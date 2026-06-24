import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import { useTaxConfig } from '../useTaxConfig';
import { TaxService }  from '../TaxService';
import TaxConfigPanel  from '../TaxConfigPanel';
import { Receipt, BarChart3, FileText } from 'lucide-react';

type Tab = 'config' | 'summary';

export default function TaxSettingsPage() {
  const { activeBusiness }   = useBusiness();
  const { config: erpConfig, sales, operationalCosts } = useERP();
  const { config: taxConfig } = useTaxConfig(activeBusiness?.id);
  const accent   = erpConfig?.customAccentColor ?? '#7c3aed';
  const currency = erpConfig?.currencySymbol    ?? 'Rp';
  const [tab, setTab] = useState<Tab>('config');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const summary = useMemo(() => {
    if (!taxConfig?.pkp_status) return null;
    const rate   = taxConfig.ppn_rate ?? 11;
    const method = taxConfig.tax_method ?? 'exclusive';

    const periodSales = sales.filter(s => s.date?.startsWith(period));
    const periodCosts = operationalCosts.filter(c => (c as any).date?.startsWith(period));

    const salesWithPPN = periodSales.map(s => {
      const gross  = s.qtySold * s.pricePerPcs - s.discount;
      const b = TaxService.calculatePPN(gross, rate, method);
      return { amount: b.base_amount, ppn: b.ppn_amount };
    });
    const costsWithPPN = periodCosts.map(c => {
      const b = TaxService.calculatePPN(c.amount, rate, method);
      return { amount: b.base_amount, ppn: b.ppn_amount };
    });

    return TaxService.buildPeriodSummary(period, salesWithPPN, costsWithPPN, 0, 0, 0);
  }, [taxConfig, sales, operationalCosts, period]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Receipt size={14} style={{ color: accent }}/>
          <span className="text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">Tax Management</span>
        </div>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)]">Pajak & Fiskal</h2>
        <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
          Konfigurasi PPN, PPh, dan laporan pajak per periode
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border-line)]">
        {([['config', 'Konfigurasi'], ['summary', 'Rekapitulasi']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer border-b-2 -mb-px ${tab === t ? 'border-current font-bold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
            style={tab === t ? { color: accent, borderColor: accent } : {}}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'config' && <TaxConfigPanel />}

      {tab === 'summary' && (
        <div className="space-y-4">
          {!taxConfig?.pkp_status ? (
            <div className="text-center py-16 text-sm font-mono text-[var(--color-text-muted)]">
              Aktifkan status PKP di tab Konfigurasi untuk melihat rekapitulasi pajak.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Periode</label>
                <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                  className="bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-white/30"/>
              </div>

              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'PPN Dipungut',    value: summary.ppn_collected,   color: 'text-[var(--color-text-main)]' },
                    { label: 'PPN Dibayar',     value: summary.ppn_paid,        color: 'text-[var(--color-text-muted)]' },
                    { label: 'PPN Terutang',    value: summary.ppn_net,         color: summary.ppn_net > 0 ? 'text-red-400' : 'text-green-400' },
                    { label: 'PPh 21',          value: summary.pph21_total,     color: 'text-[var(--color-text-muted)]' },
                    { label: 'PPh 23',          value: summary.pph23_total,     color: 'text-[var(--color-text-muted)]' },
                    { label: 'Total Pajak',     value: summary.total_tax,       color: 'text-yellow-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="border border-[var(--color-border-line)] rounded-xl p-4 bg-white/[0.02]">
                      <p className="text-[9px] font-mono uppercase text-[var(--color-text-muted)] mb-1">{label}</p>
                      <p className={`text-lg font-mono font-bold ${color}`}>{currency}{value.toLocaleString('id')}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-[var(--color-border-line)]">
                <FileText size={12} className="text-[var(--color-text-muted)]"/>
                <span className="text-[9px] font-mono text-[var(--color-text-muted)]">
                  Untuk laporan SPT Masa PPN, export data dari rekapitulasi di atas per bulan.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
