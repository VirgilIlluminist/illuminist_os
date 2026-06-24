import React, { useState } from 'react';
import type { ProductBatch } from '../../../types/product-blackbox.types';
import { nextBatchNumber } from '../../../services/productBlackbox.service';
import { Plus, Package } from 'lucide-react';

interface Props {
  productId: string;
  batches:   ProductBatch[];
  currency:  string;
  accent:    string;
  onAddBatch: (data: Omit<ProductBatch, 'id' | 'createdAt'>) => Promise<void>;
}

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-500/15 text-green-400',
  depleted: 'bg-white/10 text-[var(--color-text-muted)]',
  archived: 'bg-white/5 text-[var(--color-text-muted)]/50',
};

export default function ProductionTab({ productId, batches, currency, accent, onAddBatch }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({
    qty:            0,
    hpp:            0,
    sellingPrice:   0,
    productionDate: new Date().toISOString().slice(0, 10),
    notes:          '',
  });

  const avgHPP  = batches.length > 0 ? batches.reduce((s, b) => s + b.hpp, 0) / batches.length : 0;
  const maxHPP  = batches.length > 0 ? Math.max(...batches.map(b => b.hpp)) : 0;
  const minHPP  = batches.length > 0 ? Math.min(...batches.map(b => b.hpp)) : 0;
  const totalQty = batches.reduce((s, b) => s + b.quantity, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAddBatch({
        productId, companyId: '',
        batchNumber:    nextBatchNumber(batches),
        quantity:       form.qty,
        hpp:            form.hpp,
        sellingPrice:   form.sellingPrice,
        productionDate: form.productionDate,
        notes:          form.notes || undefined,
        status:         'active',
      });
      setShowForm(false);
      setForm({ qty: 0, hpp: 0, sellingPrice: 0, productionDate: new Date().toISOString().slice(0, 10), notes: '' });
    } finally { setSaving(false); }
  };

  const INPUT = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text-main)] focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Summary */}
      {batches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Produksi', value: `${totalQty} pcs` },
            { label: 'Rata-rata HPP',  value: `${currency}${Math.round(avgHPP).toLocaleString('id')}` },
            { label: 'HPP Tertinggi',  value: `${currency}${Math.round(maxHPP).toLocaleString('id')}` },
            { label: 'HPP Terendah',   value: `${currency}${Math.round(minHPP).toLocaleString('id')}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-3">
              <p className="text-[8px] font-mono uppercase text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className="text-base font-mono font-bold text-[var(--color-text-main)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add batch button */}
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
          {batches.length} Batch Produksi
        </p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold text-black cursor-pointer"
          style={{ background: accent }}>
          <Plus size={10}/> Batch Baru
        </button>
      </div>

      {/* Add batch form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 space-y-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
            {nextBatchNumber(batches)}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Qty (pcs)', key: 'qty',          type: 'number' },
              { label: 'HPP/pcs',   key: 'hpp',          type: 'number' },
              { label: 'Harga Jual',key: 'sellingPrice', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-[8px] font-mono text-[var(--color-text-muted)] mb-1 block">{label}</label>
                <input type={type} value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className={INPUT} required/>
              </div>
            ))}
            <div>
              <label className="text-[8px] font-mono text-[var(--color-text-muted)] mb-1 block">Tanggal Produksi</label>
              <input type="date" value={form.productionDate}
                onChange={e => setForm(f => ({ ...f, productionDate: e.target.value }))}
                className={INPUT} required/>
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-mono text-[var(--color-text-muted)] mb-1 block">Catatan</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className={INPUT}/>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-[9px] font-mono text-[var(--color-text-muted)] cursor-pointer">Batal</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg text-[9px] font-mono font-bold text-black disabled:opacity-50 cursor-pointer"
              style={{ background: accent }}>
              {saving ? 'Menyimpan...' : 'Simpan Batch'}
            </button>
          </div>
        </form>
      )}

      {/* Batch list */}
      {batches.length === 0 ? (
        <div className="text-center py-12 text-xs font-mono text-[var(--color-text-muted)]">Belum ada batch produksi.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-line)]">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-[var(--color-border-line)] bg-white/[0.02]">
                {['Batch', 'Tanggal', 'Qty', 'HPP/pcs', 'Harga Jual', 'Status', 'Catatan'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} className="border-b border-[var(--color-border-line)]/50 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 font-semibold text-[var(--color-text-main)]">{b.batchNumber}</td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)]">{b.productionDate.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-[var(--color-text-main)]">{b.quantity} pcs</td>
                  <td className="px-3 py-2 text-[var(--color-text-main)]">{currency}{b.hpp.toLocaleString('id')}</td>
                  <td className="px-3 py-2 text-[var(--color-text-main)]">{currency}{b.sellingPrice.toLocaleString('id')}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLOR[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)] max-w-[120px] truncate">{b.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
