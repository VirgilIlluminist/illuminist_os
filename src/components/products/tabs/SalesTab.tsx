import React, { useMemo } from 'react';
import type { ChannelSalesSummary } from '../../../types/product-blackbox.types';
import type { SalesRecord } from '../../../types';
import { getSalesByChannel } from '../../../services/productBlackbox.service';

interface Props {
  productId: string;
  sales:     SalesRecord[];
  currency:  string;
  accent:    string;
}

export default function SalesTab({ productId, sales, currency, accent }: Props) {
  const productSales = sales.filter(s => s.productId === productId && s.status !== 'Cancelled');

  const channels = useMemo(() => getSalesByChannel(sales, productId), [sales, productId]);

  const totalUnits   = productSales.reduce((s, r) => s + r.qtySold, 0);
  const totalGross   = productSales.reduce((s, r) => s + (r.qtySold * r.pricePerPcs - (r.discount ?? 0)), 0);
  const aov          = totalUnits > 0 ? totalGross / totalUnits : 0;

  // Best month
  const monthMap = new Map<string, { units: number; revenue: number }>();
  productSales.forEach(s => {
    const m = s.date?.slice(0, 7) ?? 'Unknown';
    const prev = monthMap.get(m) ?? { units: 0, revenue: 0 };
    monthMap.set(m, { units: prev.units + s.qtySold, revenue: prev.revenue + s.qtySold * s.pricePerPcs });
  });
  const months    = Array.from(monthMap.entries()).map(([month, d]) => ({ month, ...d }));
  const bestMonth = months.reduce<{ month: string; units: number; revenue: number } | null>(
    (best, m) => !best || m.revenue > best.revenue ? m : best, null
  );

  // Last 12 months bar chart
  const now    = new Date();
  const last12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = d.toISOString().slice(0, 7);
    const data = monthMap.get(key) ?? { units: 0, revenue: 0 };
    return { key, label: d.toLocaleString('id', { month: 'short' }), ...data };
  });
  const maxRevenue = Math.max(...last12.map(m => m.revenue), 1);

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Terjual',  value: `${totalUnits} pcs` },
          { label: 'Total Revenue',  value: `${currency}${Math.round(totalGross / 1_000_000)}jt` },
          { label: 'Avg Order Value',value: `${currency}${Math.round(aov).toLocaleString('id')}` },
          { label: 'Bulan Terbaik',  value: bestMonth?.month ?? '-', sub: bestMonth ? `${currency}${Math.round(bestMonth.revenue / 1_000_000)}jt` : '' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
            <p className="text-xs uppercase text-[var(--color-text-muted)] mb-1">{label}</p>
            <p className="text-lg font-mono font-bold text-[var(--color-text-main)]">{value}</p>
            {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">Revenue 12 Bulan Terakhir</p>
        <div className="flex items-end gap-1.5 h-24">
          {last12.map(m => {
            const pct = m.revenue / maxRevenue;
            return (
              <div key={m.key} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-t-sm transition-all" title={`${m.label}: ${currency}${Math.round(m.revenue / 1000)}k`}
                  style={{ height: `${Math.max(2, pct * 80)}px`, background: pct > 0 ? accent : 'rgba(255,255,255,0.05)' }}/>
                <span className="text-xs text-[var(--color-text-muted)] w-full text-center">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel breakdown */}
      {channels.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border-line)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/[0.06] border-b border-[var(--color-border-line)]">
                {['Channel', 'Units', 'Gross Revenue', 'Fees', 'Net Revenue'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs uppercase text-[var(--color-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map(ch => (
                <tr key={ch.channel} className="border-b border-[var(--color-border-line)]/50 hover:bg-white/[0.06]">
                  <td className="px-3 py-2 font-semibold text-[var(--color-text-main)] capitalize">{ch.channel}</td>
                  <td className="px-3 py-2 text-[var(--color-text-main)]">{ch.unitsSold}</td>
                  <td className="px-3 py-2 text-[var(--color-text-main)]">{currency}{Math.round(ch.grossRevenue).toLocaleString('id')}</td>
                  <td className="px-3 py-2 text-red-400">{ch.grossRevenue > 0 ? `${((ch.fees / ch.grossRevenue) * 100).toFixed(1)}%` : '0%'}</td>
                  <td className="px-3 py-2 text-green-400 font-semibold">{currency}{Math.round(ch.netRevenue).toLocaleString('id')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-xs font-mono text-[var(--color-text-muted)]">Belum ada penjualan untuk produk ini.</div>
      )}
    </div>
  );
}
