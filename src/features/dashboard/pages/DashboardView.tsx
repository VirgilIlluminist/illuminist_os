import React, { useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, trend, trendUp, warning }: {
  label: string; value: string; trend?: string; trendUp?: boolean; warning?: boolean;
}) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 0,
        padding: '22px 24px',
        borderRadius: '18px',
        background: warning
          ? 'rgba(239,68,68,0.08)'
          : hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: hov
          ? warning ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.16)'
          : warning ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{
        fontSize: '11px', fontWeight: 600,
        color: warning ? 'rgba(239,68,68,0.65)' : 'var(--text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '28px', fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '10px',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', letterSpacing: '-0.01em',
          color: trendUp ? '#4ADE80' : warning ? '#F87171' : 'var(--text-tertiary)',
        }}>
          {trendUp !== undefined && (trendUp ? <TrendingUp size={13}/> : <TrendingDown size={13}/>)}
          {trend}
        </div>
      )}
    </div>
  );
}

// ─── Greeting ────────────────────────────────────────────────────────────────

function getGreeting(isId: boolean) {
  const h = new Date().getHours();
  if (!isId) {
    if (h < 5)  return 'Good evening';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (h < 5)  return 'Selamat malam';
  if (h < 12) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ icon, title, body, accent }: {
  icon: string; title: string; body: string; accent?: string;
}) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '14px',
      background: accent ? `rgba(${accent},0.07)` : 'rgba(255,255,255,0.04)',
      border: accent ? `1px solid rgba(${accent},0.20)` : '1px solid rgba(255,255,255,0.07)',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div>
        <div style={{
          fontSize: '13px', fontWeight: 500, letterSpacing: '-0.01em',
          color: accent ? `rgba(${accent},1)` : 'var(--text-secondary)',
          marginBottom: '4px',
        }}>
          {title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.6, letterSpacing: '-0.01em' }}>
          {body}
        </div>
      </div>
    </div>
  );
}

// ─── DashboardView ────────────────────────────────────────────────────────────

export default function DashboardView({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const {
    computedMaterials, computedVariants, computedSales,
    computedAds, computedKols, config, formatMoney,
  } = useERP();

  const isId = (config?.language || 'id') === 'id';
  const ownerName = (config as unknown as Record<string, unknown>)?.ownerName as string || 'Virgil';
  const accent = config?.customAccentColor || '#7c3aed';

  const metrics = useMemo(() => {
    const totalRevenue  = computedSales.reduce((s, x) => s + x.netRevenue, 0);
    const totalProfit   = computedSales.reduce((s, x) => s + x.profit, 0);
    const netMargin     = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const materialValue = computedMaterials.reduce((s, m) => s + m.totalValue, 0);
    const lowStockMats  = computedMaterials.filter(m => m.stockStatus === 'LOW_STOCK').length;
    const lowStockVars  = computedVariants.filter(v => v.status === 'LOW_STOCK').length;
    const activeAlerts  = lowStockMats + lowStockVars;
    const adsSpend      = computedAds.reduce((s, a) => s + a.spend, 0);
    const kolSpend      = computedKols.reduce((s, k) => s + k.cost, 0);
    return { totalRevenue, totalProfit, netMargin, materialValue, activeAlerts, marketingSpend: adsSpend + kolSpend };
  }, [computedSales, computedMaterials, computedVariants, computedAds, computedKols]);

  const lowStockList = useMemo(() => {
    const list: { name: string; qty: number; unit: string; min: number }[] = [];
    computedMaterials.forEach(m => {
      if (m.stockStatus === 'LOW_STOCK') list.push({ name: m.name, qty: m.remainingQty, unit: m.unit, min: m.minStock });
    });
    computedVariants.forEach(v => {
      if (v.status === 'LOW_STOCK') list.push({ name: `${v.productName} [${v.size}]`, qty: v.remainingStock, unit: 'pcs', min: v.minStock });
    });
    return list.slice(0, 5);
  }, [computedMaterials, computedVariants]);

  const days  = isId ? ['Sen','Sel','Rab','Kam','Jum','Sab','Min'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const rawBars = useMemo(() => {
    const today = new Date();
    const buckets = Array(7).fill(0) as number[];
    computedSales.forEach(s => {
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) buckets[6 - diff] += s.netRevenue || 0;
    });
    return buckets;
  }, [computedSales]);
  const maxBar = Math.max(...rawBars, 1);

  return (
    <div style={{ maxWidth: '1200px', animation: 'fadeIn 0.25s ease both' }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '30px', fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.05em', marginBottom: '6px', lineHeight: 1.2,
        }}>
          {getGreeting(isId)}, {ownerName} 👋
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', margin: 0, letterSpacing: '-0.01em' }}>
          {isId ? 'Berikut kondisi bisnis hari ini.' : "Here's your business overview for today."}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <KPICard label={isId ? 'Total Pendapatan' : 'Total Revenue'} value={formatMoney(metrics.totalRevenue)}
          trend={`+18.4% ${isId ? 'bulan ini' : 'this month'}`} trendUp />
        <KPICard label={isId ? 'Laba Bersih' : 'Net Profit'} value={formatMoney(metrics.totalProfit)}
          trend={`${metrics.netMargin.toFixed(1)}% margin`} trendUp={metrics.netMargin > 30} />
        <KPICard label={isId ? 'Nilai Inventori' : 'Inventory Value'} value={formatMoney(metrics.materialValue)}
          trend={isId ? 'Bahan baku aktif' : 'Active materials'} trendUp />
        <KPICard
          label={isId ? 'Peringatan' : 'Warnings'}
          value={metrics.activeAlerts > 0 ? String(metrics.activeAlerts) : '—'}
          trend={metrics.activeAlerts > 0 ? (isId ? 'item perlu reorder' : 'items need reorder') : (isId ? 'Semua aman' : 'All clear')}
          trendUp={metrics.activeAlerts === 0} warning={metrics.activeAlerts > 0}
        />
      </div>

      {/* ── Chart + AI ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>

        {/* Bar chart — NO backdropFilter (glass-shell handles all blur) */}
        <div style={{
          flex: '1.65', minWidth: '280px',
          padding: '22px 24px',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.02em' }}>
                {isId ? 'Revenue Mingguan' : 'Weekly Revenue'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px', letterSpacing: '-0.01em' }}>
                {isId ? '7 hari terakhir' : 'Last 7 days'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['1M','3M','6M','1Y'].map((p, i) => (
                <button key={p} style={{
                  padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                  background: i === 0 ? `${accent}38` : 'rgba(255,255,255,0.05)',
                  border: i === 0 ? `1px solid ${accent}52` : '1px solid rgba(255,255,255,0.08)',
                  color: i === 0 ? 'rgba(255,255,255,0.90)' : 'var(--text-tertiary)',
                  cursor: 'pointer', letterSpacing: '-0.01em',
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '130px' }}>
            {rawBars.map((val, i) => {
              const pct = (val / maxBar) * 100;
              const isLast = i === rawBars.length - 1;
              return (
                <div key={i} title={`${days[i]}: ${val}`} style={{
                  flex: 1, height: `${pct}%`, minHeight: '5px',
                  borderRadius: '6px 6px 2px 2px',
                  background: isLast
                    ? `linear-gradient(180deg, ${accent}cc 0%, ${accent} 100%)`
                    : `${accent}59`,
                  boxShadow: isLast ? `0 0 16px ${accent}66` : 'none',
                  cursor: 'default', transition: 'background 0.15s ease',
                }}/>
              );
            })}
          </div>

          {/* Day labels */}
          <div style={{ display: 'flex', marginTop: '10px' }}>
            {days.map(d => (
              <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-quaternary)', letterSpacing: '-0.01em' }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights — NO backdropFilter */}
        <div style={{
          flex: 1, minWidth: '220px',
          padding: '22px 24px',
          borderRadius: '18px',
          background: `${accent}12`,
          border: `1px solid ${accent}2e`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px' }}>✦</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.02em' }}>AI Insights</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}>Chief of Staff</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.totalRevenue > 0 ? (
              <InsightCard
                icon="📈"
                title={isId ? 'Revenue positif' : 'Revenue positive'}
                body={isId ? `Margin ${metrics.netMargin.toFixed(1)}% — dalam batas sehat.` : `Running at ${metrics.netMargin.toFixed(1)}% margin — healthy range.`}
                accent="74,222,128"
              />
            ) : (
              <InsightCard icon="💡"
                title={isId ? 'Belum ada transaksi' : 'No transactions yet'}
                body={isId ? 'Mulai catat penjualan untuk melihat insight.' : 'Start recording sales to see insights.'}
              />
            )}
            {metrics.activeAlerts > 0 && (
              <InsightCard icon="⚠️"
                title={isId ? `${metrics.activeAlerts} item stok kritis` : `${metrics.activeAlerts} critical stock items`}
                body={isId ? 'Buat purchase order sebelum stok habis.' : 'Create purchase orders before stock runs out.'}
                accent="248,113,113"
              />
            )}
            <InsightCard icon="📦"
              title={isId ? 'Nilai inventori' : 'Inventory value'}
              body={`${formatMoney(metrics.materialValue)} ${isId ? 'di gudang bahan baku.' : 'in raw materials.'}`}
            />
            {metrics.marketingSpend > 0 && (
              <InsightCard icon="🎯"
                title={isId ? 'Marketing spend' : 'Marketing spend'}
                body={`${formatMoney(metrics.marketingSpend)} ${isId ? 'total Ads + KOL.' : 'total ads & KOL.'}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Low Stock — NO backdropFilter ── */}
      {lowStockList.length > 0 && (
        <div style={{
          padding: '22px 24px',
          borderRadius: '18px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.16)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
        }}>
          <div style={{
            fontSize: '14px', fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
            letterSpacing: '-0.02em',
          }}>
            <span>⚠️</span>
            {isId ? 'Stok Kritis' : 'Critical Stock'}
          </div>
          {lowStockList.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < lowStockList.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                  Min: {item.min} {item.unit}
                </div>
              </div>
              <span style={{ fontSize: '14px', fontVariantNumeric: 'tabular-nums', color: '#F87171', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {item.qty} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
