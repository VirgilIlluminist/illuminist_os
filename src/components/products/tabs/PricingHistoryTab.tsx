import React, { useState } from 'react';
import type { PricingHistoryEntry } from '../../../types/product-blackbox.types';
import type { MasterProduct } from '../../../types';
import { ArrowRight, Plus } from 'lucide-react';
import NumberInput from '../../../shared/ui/NumberInput';

interface Props {
  product:  MasterProduct;
  history:  PricingHistoryEntry[];
  currency: string;
  accent:   string;
  onPriceChange: (newPrice: number, newHpp: number | null, reason: string) => Promise<void>;
}

export default function PricingHistoryTab({ product, history, currency, accent, onPriceChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ newPrice: product.sellingPrice, newHpp: 0, reason: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPrice <= 0) return;
    setSaving(true);
    try {
      await onPriceChange(form.newPrice, form.newHpp || null, form.reason);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const INPUT = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-main)] focus:outline-none';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">{history.length} Perubahan Harga</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-black cursor-pointer"
          style={{ background: accent }}>
          <Plus size={14}/> Ubah Harga
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Harga Jual Baru</label>
              <NumberInput value={form.newPrice} onChange={v => setForm(f => ({ ...f, newPrice: v }))}
                className={INPUT} required/>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">HPP Baru (opsional)</label>
              <NumberInput value={form.newHpp} onChange={v => setForm(f => ({ ...f, newHpp: v }))}
                className={INPUT}/>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Alasan Perubahan</label>
              <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Contoh: Kenaikan bahan baku, penyesuaian market"
                className={INPUT}/>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-[var(--color-text-muted)] cursor-pointer">Batal</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-black disabled:opacity-50 cursor-pointer"
              style={{ background: accent }}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      )}

      {history.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">Belum ada riwayat perubahan harga.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-[var(--color-border-line)]"/>
          <div className="space-y-4">
            {history.map(entry => {
              const up = !entry.oldPrice || entry.newPrice > entry.oldPrice;
              return (
                <div key={entry.id} className="flex gap-4 relative">
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${up ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <ArrowRight size={12} className={`${up ? 'text-green-400 -rotate-45' : 'text-red-400 rotate-45'}`}/>
                  </div>
                  <div className="flex-1 rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        {entry.oldPrice && (
                          <span className="text-[var(--color-text-muted)]">{currency}{entry.oldPrice.toLocaleString('id')}</span>
                        )}
                        {entry.oldPrice && <ArrowRight size={12} className="text-[var(--color-text-muted)]"/>}
                        <span className={`font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
                          {currency}{entry.newPrice.toLocaleString('id')}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {entry.changedAt.slice(0, 10)}
                      </span>
                    </div>
                    {(entry.oldHpp || entry.newHpp) && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        HPP: {entry.oldHpp ? `${currency}${entry.oldHpp.toLocaleString('id')} → ` : ''}
                        {entry.newHpp ? `${currency}${entry.newHpp.toLocaleString('id')}` : ''}
                      </p>
                    )}
                    {entry.reason && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">{entry.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
