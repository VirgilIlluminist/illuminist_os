/**
 * TaxConfigPanel — ditampilkan di halaman Settings sebagai panel pajak per bisnis.
 * Tidak mengubah SettingsView yang sudah ada — dipanggil dari TaxSettingsPage.
 */
import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../app/store/BusinessContext';
import { useERP }      from '../../app/store/ERPContext';
import { useTaxConfig } from './useTaxConfig';
import { TaxService }  from './TaxService';
import type { TaxConfig } from './types';
import { Receipt, Save, Info } from 'lucide-react';
import { toast } from '../../shared/ui/Toast';
import NumberInput from '../../shared/ui/NumberInput';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
      {hint && <span className="text-[9px] font-mono text-[var(--color-text-muted)]/60 ml-2">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const INPUT = "w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30";

export default function TaxConfigPanel() {
  const { activeBusiness }   = useBusiness();
  const { config: erpConfig } = useERP();
  const accent = erpConfig?.customAccentColor ?? '#7c3aed';
  const currency = erpConfig?.currencySymbol ?? 'Rp';

  const { config, loading, saving, save } = useTaxConfig(activeBusiness?.id);

  const [form, setForm] = useState({
    ppn_rate:       11,
    pph21_rate:     5,
    pph23_rate:     2,
    pph_final_rate: 0.5,
    pkp_status:     false,
    tax_method:     'exclusive' as 'exclusive' | 'inclusive',
    npwp:           '',
    tax_name:       '',
  });

  useEffect(() => {
    if (config) setForm({
      ppn_rate:       config.ppn_rate       ?? 11,
      pph21_rate:     config.pph21_rate     ?? 5,
      pph23_rate:     config.pph23_rate     ?? 2,
      pph_final_rate: config.pph_final_rate ?? 0.5,
      pkp_status:     config.pkp_status     ?? false,
      tax_method:     config.tax_method     ?? 'exclusive',
      npwp:           config.npwp           ?? '',
      tax_name:       config.tax_name       ?? '',
    });
  }, [config]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Live preview
  const preview100k = TaxService.calculatePPN(100_000, form.ppn_rate, form.tax_method);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await save(form as Partial<TaxConfig>);
    if (result) toast.success('Konfigurasi pajak disimpan');
    else toast.error('Gagal menyimpan');
  };

  if (loading) return (
    <div className="animate-pulse text-xs font-mono text-[var(--color-text-muted)] py-8 text-center">
      Memuat konfigurasi pajak...
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-[var(--color-border-line)]">
        <Receipt size={14} style={{ color: accent }}/>
        <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--color-text-main)]">
          Konfigurasi Pajak
        </h3>
        {activeBusiness && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">
            {activeBusiness.name}
          </span>
        )}
      </div>

      {/* Status PKP */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-line)] bg-white/[0.02]">
        <div>
          <p className="text-xs font-mono font-semibold text-[var(--color-text-main)]">Status PKP</p>
          <p className="text-[9px] font-mono text-[var(--color-text-muted)]">Pengusaha Kena Pajak — wajib pungut PPN</p>
        </div>
        <button
          type="button"
          onClick={() => set('pkp_status', !form.pkp_status)}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.pkp_status ? 'bg-green-500' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.pkp_status ? 'left-5' : 'left-0.5'}`}/>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="PPN Rate (%)" hint="default 11%">
          <NumberInput value={form.ppn_rate} onChange={v => set('ppn_rate', v)} min={0} max={25}
            className={INPUT} disabled={!form.pkp_status}/>
        </Field>

        <Field label="Metode PPN">
          <select value={form.tax_method} onChange={e => set('tax_method', e.target.value as any)} className={INPUT} disabled={!form.pkp_status}>
            <option value="exclusive">Exclusive (PPN ditambah di atas harga)</option>
            <option value="inclusive">Inclusive (PPN sudah termasuk harga)</option>
          </select>
        </Field>

        <Field label="PPh 21 Rate (%)" hint="gaji karyawan">
          <NumberInput value={form.pph21_rate} onChange={v => set('pph21_rate', v)} min={0} max={35}
            className={INPUT}/>
        </Field>

        <Field label="PPh 23 Rate (%)" hint="jasa, royalti">
          <NumberInput value={form.pph23_rate} onChange={v => set('pph23_rate', v)} min={0} max={15}
            className={INPUT}/>
        </Field>

        <Field label="PPh Final PP 46 (%)" hint="UMKM omzet < 4.8M/tahun">
          <NumberInput value={form.pph_final_rate} onChange={v => set('pph_final_rate', v)} min={0} max={2}
            className={INPUT}/>
        </Field>

        <Field label="NPWP">
          <input type="text" value={form.npwp} placeholder="00.000.000.0-000.000"
            onChange={e => set('npwp', e.target.value)}
            className={INPUT}/>
        </Field>

        <Field label="Nama untuk Laporan Pajak" hint="opsional">
          <input type="text" value={form.tax_name} placeholder={activeBusiness?.name ?? ''}
            onChange={e => set('tax_name', e.target.value)}
            className={`${INPUT} md:col-span-2`}/>
        </Field>
      </div>

      {/* Live preview PPN */}
      {form.pkp_status && (
        <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Info size={11} className="text-[var(--color-text-muted)]"/>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
              Preview: Transaksi {currency}100.000
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-text-muted)]">Base amount</span>
              <span className="text-[var(--color-text-main)]">{currency}{preview100k.base_amount.toLocaleString('id')}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-text-muted)]">PPN {form.ppn_rate}%</span>
              <span className="text-yellow-400">+{currency}{preview100k.ppn_amount.toLocaleString('id')}</span>
            </div>
            <div className="border-t border-[var(--color-border-line)] pt-1.5 flex justify-between text-xs font-mono font-bold">
              <span className="text-[var(--color-text-muted)]">Total</span>
              <span style={{ color: accent }}>{currency}{preview100k.total.toLocaleString('id')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
          style={{ background: accent }}>
          <Save size={12}/>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi Pajak'}
        </button>
      </div>
    </form>
  );
}
