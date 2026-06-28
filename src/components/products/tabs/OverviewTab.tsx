import React from 'react';
import { calculateMargin, predictRestock } from '../../../services/productBlackbox.service';
import type { BlackboxOverview } from '../../../types/product-blackbox.types';
import type { SalesRecord } from '../../../types';
import { TrendingUp, Package, DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface Props {
  overview: BlackboxOverview;
  sales:    SalesRecord[];
  currency: string;
  accent:   string;
}

const TIMELINE_ICON: Record<string, string> = {
  created: '🌱', batch_added: '📦', first_sale: '🎉',
  price_change: '💰', restock: '🔄', journal_entry: '📝',
  status_change: '🔀', milestone: '⭐',
};

export default function OverviewTab({ overview, sales, currency, accent }: Props) {
  const { product, variants, currentBatch, totalStock, totalUnitsSold, totalRevenue,
          currentMargin, daysUntilStockout, recentJournalEntries, recentTimelineEvents } = overview;

  const restock = predictRestock(totalStock, sales, product.id);

  const kpis = [
    { label: 'Stok Saat Ini', value: `${totalStock} pcs`,
      sub: totalStock === 0 ? 'Habis!' : totalStock <= 10 ? 'Stok Menipis' : 'Aman',
      color: totalStock === 0 ? 'text-red-400' : totalStock <= 10 ? 'text-yellow-400' : 'text-green-400',
      icon: Package },
    { label: 'Total Terjual', value: `${totalUnitsSold} pcs`,
      sub: 'Sepanjang waktu', color: 'text-[var(--color-text-main)]', icon: TrendingUp },
    { label: 'Total Revenue', value: `${currency}${Math.round(totalRevenue / 1_000_000).toLocaleString('id')}jt`,
      sub: 'Gross revenue', color: 'text-[var(--color-text-main)]', icon: DollarSign },
    { label: 'Margin Saat Ini', value: `${currentMargin.toFixed(1)}%`,
      sub: currentBatch ? `HPP Rp${currentBatch.hpp.toLocaleString('id')}` : 'No batch data',
      color: currentMargin < 20 ? 'text-red-400' : currentMargin < 35 ? 'text-yellow-400' : 'text-green-400',
      icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={14} className="text-[var(--color-text-muted)]"/>
              <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
            </div>
            <p className={`text-xl font-mono font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Restock prediction */}
      {restock.daysUntilStockout !== null && (
        <div className={`flex items-start gap-3 rounded-xl p-3 border ${
          restock.daysUntilStockout <= 7 ? 'border-red-500/30 bg-red-500/5' :
          restock.daysUntilStockout <= 14 ? 'border-yellow-500/30 bg-yellow-500/5' :
          'border-[var(--color-border-line)] bg-white/[0.06]'
        }`}>
          <AlertTriangle size={14} className={restock.daysUntilStockout <= 7 ? 'text-red-400 mt-0.5 flex-shrink-0' : 'text-yellow-400 mt-0.5 flex-shrink-0'}/>
          <div className="text-xs space-y-0.5">
            <p className="text-[var(--color-text-main)] font-semibold">
              Stok diperkirakan habis dalam <span className={restock.daysUntilStockout <= 7 ? 'text-red-400' : 'text-yellow-400'}>{restock.daysUntilStockout} hari</span>
              {restock.estimatedStockoutDate ? ` (${restock.estimatedStockoutDate})` : ''}
            </p>
            <p className="text-[var(--color-text-muted)]">
              Avg {restock.avgDailySales.toFixed(1)} pcs/hari · Restock min {restock.recommendedRestockQuantity} pcs
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Variant stock breakdown */}
        {variants.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Stok per Variant</p>
            <div className="space-y-2">
              {variants.filter(v => v.isActive).map(v => (
                <div key={v.id} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-main)]">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (v.stock / Math.max(1, totalStock)) * 100)}%`, background: v.stock === 0 ? '#ef4444' : accent }}/>
                    </div>
                    <span className={`text-xs font-bold w-8 text-right ${v.stock === 0 ? 'text-red-400' : 'text-[var(--color-text-main)]'}`}>
                      {v.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent timeline */}
        {recentTimelineEvents.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Timeline Terbaru</p>
            <div className="space-y-3">
              {recentTimelineEvents.map((ev, i) => (
                <div key={ev.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{TIMELINE_ICON[ev.eventType] ?? '•'}</span>
                    {i < recentTimelineEvents.length - 1 && <div className="w-px flex-1 bg-[var(--color-border-line)] mt-1"/>}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold text-[var(--color-text-main)]">{ev.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{ev.eventDate.slice(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent journal */}
      {recentJournalEntries.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.06] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Catatan Terbaru</p>
          <div className="space-y-3">
            {recentJournalEntries.map(j => (
              <div key={j.id} className="border-b border-[var(--color-border-line)]/50 pb-3 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-[var(--color-text-main)]">{j.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{j.content}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-[var(--color-text-muted)]">{j.createdAt.slice(0, 10)}</span>
                  {j.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-[var(--color-text-muted)]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
