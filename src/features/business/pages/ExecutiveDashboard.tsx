/**
 * ExecutiveDashboard.tsx
 * Tampil saat ILLUMINIST (holding) dipilih.
 * Konsolidasi semua bisnis dalam satu view — seperti Stripe Dashboard.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, BarChart3, ArrowRight } from 'lucide-react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP } from '../../../app/store/ERPContext';
import { TYPE_ICONS } from '../../../features/business/components/BusinessSwitcher';

interface BizStat {
  id:       string;
  name:     string;
  type:     string;
  revenue:  number;
  expenses: number;
  profit:   number;
  growth:   number;
}

export default function ExecutiveDashboard() {
  const { businesses, switchBusiness } = useBusiness();
  const { formatMoney, config } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';

  // Simulated consolidated data (akan terisi dari Supabase business_kpis)
  const childBiz = businesses.filter(b => b.parent_id);

  const stats: BizStat[] = childBiz.map((b, i) => ({
    id:       b.id,
    name:     b.name,
    type:     b.business_type,
    revenue:  [85000000, 12500000, 4200000][i] || 0,
    expenses: [42000000, 8100000,  2800000][i] || 0,
    profit:   [43000000, 4400000,  1400000][i] || 0,
    growth:   [12.4, -2.1, 8.7][i] || 0,
  }));

  const totals = stats.reduce((acc, s) => ({
    revenue:  acc.revenue  + s.revenue,
    expenses: acc.expenses + s.expenses,
    profit:   acc.profit   + s.profit,
  }), { revenue: 0, expenses: 0, profit: 0 });

  const KPICard = ({ label, value, sub, icon, color }: { label:string; value:string; sub?:string; icon:React.ReactNode; color:string }) => (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className="p-5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-display font-bold text-[var(--color-text-main)] mt-2">{value}</p>
          {sub && <p className="text-[10px] font-mono mt-1" style={{color}}>{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{background:color+'15'}}>{icon}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <span className="text-xs font-mono tracking-widest uppercase" style={{color:accent}}>
          ILLUMINIST HOLDING · EXECUTIVE VIEW
        </span>
        <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-[var(--color-text-main)] mt-1">
          Consolidated Overview
        </h1>
        <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">
          {childBiz.length} bisnis aktif · Data konsolidasi bulan ini
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue"   value={formatMoney(totals.revenue)}  sub="Semua bisnis" icon={<DollarSign size={18} style={{color:'#22c55e'}} />} color="#22c55e" />
        <KPICard label="Total Profit"    value={formatMoney(totals.profit)}   sub={`Margin ${Math.round(totals.profit/totals.revenue*100)||0}%`} icon={<TrendingUp size={18} style={{color:accent}} />} color={accent} />
        <KPICard label="Total Expenses"  value={formatMoney(totals.expenses)} sub="Pengeluaran" icon={<TrendingDown size={18} style={{color:'#ef4444'}} />} color="#ef4444" />
        <KPICard label="Bisnis Aktif"    value={`${childBiz.length}`}         sub="Unit bisnis" icon={<Building2 size={18} style={{color:'#60a5fa'}} />} color="#60a5fa" />
      </div>

      {/* Business Cards */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          Performa per Bisnis
        </h3>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <motion.div key={s.id}
              initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
              transition={{delay:i*0.06}}
              className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl flex items-center gap-4 hover:border-[var(--color-accent-highlight)]/30 transition-all group"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                   style={{background:accent+'15'}}>
                {TYPE_ICONS[s.type] || '🏢'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-main)]">{s.name}</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-border-line)] text-[var(--color-text-muted)] capitalize">
                    {s.type.replace('_',' ')}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-[var(--color-border-line)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width:`${Math.max(5,Math.min(100,(s.revenue/totals.revenue)*100))}%`,
                    background:accent
                  }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-sm font-bold font-mono text-[var(--color-text-main)]">{formatMoney(s.revenue)}</p>
                <p className="text-[10px] font-mono text-emerald-400">Profit: {formatMoney(s.profit)}</p>
                <p className={`text-[9px] font-mono ${s.growth>=0?'text-emerald-400':'text-red-400'}`}>
                  {s.growth>=0?'↑':'↓'} {Math.abs(s.growth)}% MoM
                </p>
              </div>

              {/* Drill down */}
              <button onClick={() => switchBusiness(s.id)}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.04] transition-all cursor-pointer opacity-0 group-hover:opacity-100 shrink-0">
                <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue chart (simple bars) */}
      <div className="p-5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
          Revenue Distribution
        </h3>
        <div className="flex items-end gap-3 h-28">
          {stats.map(s => (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-mono text-[var(--color-text-muted)]">
                {formatMoney(s.revenue).replace(/\s/g,'\u00A0')}
              </p>
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height:`${Math.max(8,Math.min(80,(s.revenue/totals.revenue)*80))}px`,
                  background:`${accent}${s.id===childBiz[0]?.id?'ff':'60'}`,
                }} />
              <p className="text-[9px] font-mono text-[var(--color-text-muted)] text-center truncate w-full">
                {s.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick note */}
      <div className="p-4 border border-dashed border-[var(--color-border-line)] rounded-xl">
        <p className="text-[10.5px] font-mono text-[var(--color-text-muted)] text-center">
          💡 Klik pada nama bisnis di sidebar untuk masuk ke modul bisnis tersebut. Data akan terkonfigurasi secara otomatis sesuai tipe bisnis.
        </p>
      </div>
    </div>
  );
}
