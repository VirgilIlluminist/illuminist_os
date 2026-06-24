/**
 * OwnerFinanceView.tsx — Gaji Owner & Profit Allocation
 */
import React from 'react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import { Wallet, TrendingUp, PieChart, ArrowRight } from 'lucide-react';

export default function OwnerFinanceView() {
  const { currentColor, activeBusiness } = useBusiness();
  const { computedSales, computedCashflow, formatMoney, config } = useERP();
  const accent = currentColor || config?.customAccentColor || '#7c3aed';

  const now   = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const getRevOf = (s: any) => s.netRevenue || s.grossRevenue || (s.pricePerPcs||0)*(s.qtySold||0) || 0;

  const thisRev = (computedSales||[]).filter((s: any) => (s.date||'').startsWith(month)).reduce((sum: number,s: any) => sum+getRevOf(s), 0);
  const thisExp = (computedCashflow||[]).filter((c: any) => (c.date||'').startsWith(month) && String(c.type).toLowerCase().includes('out')).reduce((sum: number,c: any) => sum+(c.amount||0), 0);
  const profit  = Math.max(0, thisRev - thisExp);

  const ALLOCATION = [
    { label:'Operating Reserve',   pct:30, color:'#0071e3', desc:'Modal kerja & buffer' },
    { label:'Owner Salary',        pct:40, color:accent,    desc:'Gaji tetap pemilik' },
    { label:'Business Development',pct:20, color:'#34c759', desc:'Investasi & pengembangan' },
    { label:'Emergency Fund',      pct:10, color:'#ff9500', desc:'Dana darurat bisnis' },
  ];

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">Gaji Owner</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Alokasi profit & kompensasi pemilik bisnis</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Revenue Bulan Ini', value: formatMoney(thisRev), icon:<TrendingUp size={16}/>, color:'#0071e3' },
          { label:'Net Profit',        value: formatMoney(profit),  icon:<PieChart size={16}/>,   color:profit>0?'#34c759':'#ff3b30' },
          { label:'Gaji Owner (40%)', value: formatMoney(profit*0.4), icon:<Wallet size={16}/>,   color:accent },
        ].map((kpi,i) => (
          <div key={i} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${kpi.color}15`,color:kpi.color}}>{kpi.icon}</div>
            </div>
            <p className="text-xl font-bold text-[var(--color-text-main)] tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="px-5 py-4 border-b border-[var(--color-border-line)]">
          <p className="text-sm font-semibold text-[var(--color-text-main)]">Profit Allocation — Bulan Ini</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Total profit: {formatMoney(profit)}</p>
        </div>
        <div className="p-5 space-y-4">
          {profit === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-[var(--color-text-muted)]">Belum ada profit bulan ini.</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Catat penjualan di Sales Tracking terlebih dahulu.</p>
            </div>
          ) : ALLOCATION.map((a,i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{background:a.color}}>
                {a.pct}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">{a.label}</p>
                  <p className="text-sm font-bold tabular-nums" style={{color:a.color}}>{formatMoney(profit*a.pct/100)}</p>
                </div>
                <div className="h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${a.pct}%`, background:a.color}}/>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
