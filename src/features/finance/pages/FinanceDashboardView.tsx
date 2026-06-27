import React, { useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import PageHeader from '../../../shared/ui/PageHeader';
import { DataTable, DtColumn, moneyCell } from '../../../shared/ui/DataTable';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Package } from 'lucide-react';

// Real finance overview — reads live ERP data (cashflow, sales, ops, assets).
// No redirect, no placeholder.
export default function FinanceDashboardView() {
  const { computedCashflow, computedSales, operationalCosts, assets, formatMoney } = useERP();

  const stats = useMemo(() => {
    const inflow  = computedCashflow.filter(c => c.type === 'Inflow').reduce((s, c) => s + (c.amount || 0), 0);
    const outflow = computedCashflow.filter(c => c.type === 'Outflow').reduce((s, c) => s + (c.amount || 0), 0);
    const net = inflow - outflow;
    const revenue = computedSales.reduce((s, x) => s + (x.netRevenue || 0), 0);
    const opsTotal = operationalCosts.reduce((s, o) => s + (o.amount || 0), 0);
    const assetValue = assets.reduce((s, a) => s + (a.value ?? (a.purchaseValue || 0) * (a.qty || 1)), 0);
    return { inflow, outflow, net, revenue, opsTotal, assetValue };
  }, [computedCashflow, computedSales, operationalCosts, assets]);

  const recent = useMemo(
    () => [...computedCashflow].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 12),
    [computedCashflow],
  );

  const cols: DtColumn<typeof recent[0]>[] = [
    { key: 'date', label: 'Tanggal', width: '120px' },
    {
      key: 'type', label: 'Tipe', width: '110px',
      render: v => {
        const inflow = v === 'Inflow';
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
            background: inflow ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
            color: inflow ? '#4ADE80' : '#F87171',
            border: `1px solid ${inflow ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
          }}>
            {inflow ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            {inflow ? 'Masuk' : 'Keluar'}
          </span>
        );
      },
    },
    { key: 'category', label: 'Kategori' },
    {
      key: 'amount', label: 'Jumlah', align: 'right', width: '160px',
      render: (v, row) => (
        <span style={{ color: row.type === 'Inflow' ? '#4ADE80' : '#F87171', fontVariantNumeric: 'tabular-nums' }}>
          {row.type === 'Inflow' ? '+' : '−'} Rp {Number(v || 0).toLocaleString('id-ID')}
        </span>
      ),
    },
    { key: 'notes', label: 'Catatan', render: v => <span style={{ color: 'var(--text-tertiary)' }}>{String(v || '—')}</span> },
  ];

  const Kpi = ({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) => (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader title="Finance" description="Ringkasan kas, pendapatan, dan posisi keuangan." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Kpi label="Posisi Kas Bersih" value={formatMoney(stats.net)} icon={<Wallet size={18}/>} color="var(--accent-primary)"
             sub={`Masuk ${formatMoney(stats.inflow)} · Keluar ${formatMoney(stats.outflow)}`} />
        <Kpi label="Pendapatan (Net)" value={formatMoney(stats.revenue)} icon={<TrendingUp size={18}/>} color="#4ADE80" sub="Dari penjualan" />
        <Kpi label="Biaya Operasional" value={formatMoney(stats.opsTotal)} icon={<ArrowDownRight size={18}/>} color="#F87171" sub="Total tercatat" />
        <Kpi label="Nilai Aset" value={formatMoney(stats.assetValue)} icon={<Package size={18}/>} color="#60A5FA" sub={`${assets.length} aset`} />
      </div>

      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Transaksi Terbaru</h2>
        <DataTable
          columns={cols}
          data={recent as unknown as Record<string, unknown>[]}
          emptyIcon="💸"
          emptyMessage="Belum ada transaksi kas"
        />
      </div>
    </div>
  );
}
