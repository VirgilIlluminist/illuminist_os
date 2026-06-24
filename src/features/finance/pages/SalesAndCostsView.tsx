import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import SalesInvoicePanel from '../../invoice/SalesInvoicePanel';
import { SalesRecord, OperationalCost, AdsCampaign, KolTracking } from '../types';
import { DataTable, DtColumn, moneyCell, numberCell } from '../../../shared/ui/DataTable';
import SmartTable, { ColumnDef as SmartColumnDef } from '../../../shared/table/SmartTable';
import EmptyGuide from '../../../shared/ui/EmptyGuide';
import PageHeader, { HeaderBtn } from '../../../shared/ui/PageHeader';
import { Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import NumberInput from '../../../shared/ui/NumberInput';

interface SalesAndCostsViewProps {
  initialSubTab?: 'sales' | 'ops' | 'ads' | 'kol';
}

export default function SalesAndCostsView({ initialSubTab = 'sales' }: SalesAndCostsViewProps) {
  const {
    products,
    variants,
    computedProducts,
    computedVariants,
    computedSales,
    computedAds,
    computedKols,
    operationalCosts,
    addSale,
    updateSale,
    deleteSale,
    addOperationalCost,
    updateOperationalCost,
    deleteOperationalCost,
    addAdsCampaign,
    updateAdsCampaign,
    deleteAdsCampaign,
    addKol,
    updateKol,
    deleteKol,
    formatMoney, t,
    config,
  } = useERP();

  const accentHex = config?.customAccentColor || '#7c3aed';
  const currencySymbol = config?.currencySymbol || 'Rp';
  const isId = config?.language === 'id';

  const [activeTab, setActiveTab] = useState<'sales' | 'ops' | 'ads' | 'kol'>(initialSubTab);
  const [search, setSearch] = useState('');

  // ── Edit states ──────────────────────────────────────────────────────────────
  const [editingSale, setEditingSale] = useState<(SalesRecord & { id: string }) | null>(null);

  // ── Add states ───────────────────────────────────────────────────────────────
  const [showAddSale, setShowAddSale] = useState(false);
  const [newSale, setNewSale] = useState<Omit<SalesRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    productId: '', variantSku: '', customerName: '',
    channel: 'Website', qtySold: 1, pricePerPcs: 0,
    platformFee: 0, shippingFee: 0, discount: 0, status: 'Completed',
  });

  const [showAddOps, setShowAddOps] = useState(false);
  const [newOps, setNewOps] = useState<Omit<OperationalCost, 'id'>>({
    category: 'Meta Ads', campaignId: '', productId: '',
    amount: 0, date: new Date().toISOString().split('T')[0],
    platform: '', notes: '',
  });

  const [showAddAds, setShowAddAds] = useState(false);
  const [newAds, setNewAds] = useState<Omit<AdsCampaign, 'id'>>({
    name: '', platform: 'Meta Ads', productId: '',
    spend: 0, revenue: 0, cpc: 0, cpm: 0, ctr: 0, conversionRate: 0,
  });

  const [showAddKol, setShowAddKol] = useState(false);
  const [newKol, setNewKol] = useState<Omit<KolTracking, 'id'>>({
    name: '', platform: 'Instagram', followers: 0,
    cost: 0, revenueGenerated: 0, campaignId: '', status: 'Contracted',
  });

  const channels = ['Shopee','TikTok Shop','Tokopedia','Website','Instagram','WhatsApp','Offline Store','Event Booth'];
  const opsCategories = ['TikTok Ads','Meta Ads','Shopee Ads','KOL','Endorse','Affiliate','Shipping','Salary','Office','Equipment','Software','Event Booth','Utilities','Packaging'];

  // ── Filtered data ─────────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => computedSales.filter(s => {
    const q = search.toLowerCase();
    return s.customerName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s as any).productName?.toLowerCase().includes(q);
  }), [computedSales, search]);

  const filteredOps = useMemo(() => operationalCosts.filter(o => {
    const pName = products.find(p => p.id === o.productId)?.name ?? '';
    const q = search.toLowerCase();
    return o.category.toLowerCase().includes(q) || pName.toLowerCase().includes(q);
  }), [operationalCosts, search, products]);

  const filteredAds = useMemo(() => computedAds.filter(a => {
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.platform.toLowerCase().includes(q);
  }), [computedAds, search]);

  const filteredKols = useMemo(() => computedKols.filter(k => {
    const q = search.toLowerCase();
    return k.name.toLowerCase().includes(q) || k.campaignId.toLowerCase().includes(q);
  }), [computedKols, search]);

  // ── Status badge ──────────────────────────────────────────────────────────────
  const statusBadge = (v: unknown) => {
    const s = String(v ?? '');
    const map: Record<string, { color: string; bg: string; border: string }> = {
      Completed:      { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
      'Content Posted':{ color: '#4ADE80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)' },
      Contracted:     { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
      Shipped:        { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
      Pending:        { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)' },
      Negotiation:    { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)' },
      Cancelled:      { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
    };
    const c = map[s] ?? { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };
    return (
      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {s}
      </span>
    );
  };

  const roasCell = (v: unknown) => {
    const n = Number(v) || 0;
    return <span style={{ fontVariantNumeric: 'tabular-nums', color: n >= 2 ? '#4ADE80' : n >= 1 ? '#FBBF24' : '#F87171', fontWeight: 600 }}>
      {n.toFixed(2)}×
    </span>;
  };

  // ── Columns ────────────────────────────────────────────────────────────────────
  type CS = typeof computedSales[0];
  const colsSales: DtColumn<CS>[] = [
    {
      key: 'id', label: 'Order', width: '110px',
      render: (v, row) => (
        <div>
          <div style={{ fontSize: '11.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{String(v)}</div>
          <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.3)' }}>{row.date}</div>
        </div>
      ),
    },
    {
      key: 'productName', label: 'Produk',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String((row as any).productName ?? '—')}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.variantSku}</div>
        </div>
      ),
    },
    { key: 'customerName', label: 'Pembeli', width: '140px' },
    { key: 'channel', label: 'Channel', align: 'center', width: '110px', render: statusBadge },
    { key: 'qtySold', label: 'Qty', align: 'right', width: '60px', render: v => numberCell(v) },
    { key: 'grossRevenue', label: 'Gross', align: 'right', width: '130px', render: v => moneyCell(v) },
    { key: 'netRevenue', label: 'Net Revenue', align: 'right', width: '140px', render: v => moneyCell(v) },
    {
      key: 'profit', label: 'Profit', align: 'right', width: '130px',
      render: v => {
        const n = Number(v) || 0;
        return <span style={{ color: n >= 0 ? '#4ADE80' : '#F87171', fontVariantNumeric: 'tabular-nums' }}>
          Rp {n.toLocaleString('id-ID')}
        </span>;
      },
    },
    { key: 'status', label: 'Status', align: 'center', width: '100px', render: statusBadge },
  ];

  type CO = OperationalCost;
  const colsOps: DtColumn<CO>[] = [
    {
      key: 'category', label: 'Kategori',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.date} · {row.platform || '—'}</div>
        </div>
      ),
    },
    {
      key: 'productId', label: 'Produk', width: '150px',
      render: v => {
        const name = products.find(p => p.id === v)?.name;
        return <span style={{ color: name ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)' }}>{name ?? 'General'}</span>;
      },
    },
    { key: 'amount', label: 'Jumlah', align: 'right', width: '140px', render: v => moneyCell(v) },
    { key: 'notes', label: 'Catatan', render: v => <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{String(v || '—')}</span> },
  ];

  type CA = typeof computedAds[0];
  const colsAds: DtColumn<CA>[] = [
    {
      key: 'name', label: 'Campaign',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.platform}</div>
        </div>
      ),
    },
    { key: 'spend', label: 'Spend', align: 'right', width: '130px', render: v => moneyCell(v) },
    { key: 'revenue', label: 'Revenue', align: 'right', width: '140px', render: v => moneyCell(v) },
    { key: 'roas', label: 'ROAS', align: 'right', width: '90px', render: roasCell },
    { key: 'ctr', label: 'CTR', align: 'right', width: '80px', render: v => `${Number(v).toFixed(2)}%` },
    { key: 'conversionRate', label: 'CVR', align: 'right', width: '80px', render: v => `${Number(v).toFixed(2)}%` },
  ];

  type CK = typeof computedKols[0];
  const colsKols: DtColumn<CK>[] = [
    {
      key: 'name', label: 'KOL',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.platform} · {Number(row.followers).toLocaleString('id-ID')} followers</div>
        </div>
      ),
    },
    { key: 'cost', label: 'Fee', align: 'right', width: '130px', render: v => moneyCell(v) },
    { key: 'revenueGenerated', label: 'Revenue', align: 'right', width: '140px', render: v => moneyCell(v) },
    { key: 'roas', label: 'ROI', align: 'right', width: '90px', render: roasCell },
    { key: 'campaignId', label: 'Kode Promo', width: '120px' },
    { key: 'status', label: 'Status', align: 'center', width: '120px', render: statusBadge },
  ];

  // ── Shared UI ─────────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.06] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)] text-xs font-mono';

  const tabBtn = (key: typeof activeTab, label: string, count: number) => (
    <button onClick={() => { setActiveTab(key); setSearch(''); }}
      style={{ paddingBottom: '10px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '12px', fontWeight: 500, color: activeTab === key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', transition: 'color 0.15s' }}>
      {activeTab === key && (
        <motion.div layoutId="sales-indicator" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: accentHex, borderRadius: '1px' }}/>
      )}
      {label} <span style={{ opacity: 0.4, fontSize: '10px' }}>[{count}]</span>
    </button>
  );

  const editBtn = (onClick: () => void) => (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '7px', padding: '4px 12px', fontSize: '11.5px', cursor: 'pointer' }}>
      Edit
    </button>
  );

  // ── Sales Ledger → SmartTable (Excel-style) ─────────────────────────────────
  const salesCols: SmartColumnDef[] = [
    { key: 'id',           label: 'No. Order',   type: 'text',     isComputed: true, width: 120 },
    { key: 'date',         label: 'Tanggal',     type: 'date',     isEditable: true, width: 110 },
    { key: 'customerName', label: 'Customer',    type: 'text',     isEditable: true, width: 160 },
    { key: 'productName',  label: 'Produk',      type: 'text',     isComputed: true, width: 160 },
    { key: 'qtySold',      label: 'Qty',         type: 'number',   isEditable: true, align: 'right', width: 70 },
    { key: 'pricePerPcs',  label: 'Harga/pcs',   type: 'currency', isEditable: true, align: 'right', width: 120 },
    { key: 'channel',      label: 'Channel',     type: 'status',   isEditable: true, selectOptions: channels, width: 120 },
    { key: 'platformFee',  label: 'Fee',         type: 'currency', isEditable: true, align: 'right', width: 110 },
    { key: 'netRevenue',   label: 'Net',         type: 'currency', isComputed: true, align: 'right', width: 120 },
    { key: 'status',       label: 'Status',      type: 'status',   isEditable: true, selectOptions: ['Pending','Shipped','Completed','Cancelled'], width: 110 },
  ];

  const salesRows = useMemo(() => filteredSales.map(s => ({ ...s })), [filteredSales]);

  const handleSalesChange = (newData: Record<string, unknown>[]) => {
    const ids = new Set(newData.map(r => r.id));
    computedSales.forEach(old => { if (!ids.has(old.id)) deleteSale(old.id); });
    newData.forEach(row => {
      const id = String(row.id);
      const old = computedSales.find(s => s.id === id);
      if (!old) return;
      const updates: Partial<SalesRecord> = {};
      if (row.date !== old.date) updates.date = String(row.date ?? '');
      if (row.customerName !== old.customerName) updates.customerName = String(row.customerName ?? '');
      if (Number(row.qtySold) !== old.qtySold) updates.qtySold = Number(row.qtySold) || 0;
      if (Number(row.pricePerPcs) !== old.pricePerPcs) updates.pricePerPcs = Number(row.pricePerPcs) || 0;
      if (Number(row.platformFee) !== old.platformFee) updates.platformFee = Number(row.platformFee) || 0;
      if (row.channel !== old.channel) updates.channel = String(row.channel ?? '');
      if (row.status !== old.status) updates.status = String(row.status) as SalesRecord['status'];
      if (Object.keys(updates).length) updateSale(id, updates);
    });
  };

  const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50 };
  const modalCard: React.CSSProperties = { width: '100%', maxWidth: '500px', background: 'rgba(18,14,34,0.97)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.60)', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <PageHeader
        title="Sales Tracking"
        actions={
          <div className="flex gap-2">
            {activeTab === 'sales' && <HeaderBtn onClick={() => {
              if (products.length) setNewSale(s => ({ ...s, productId: products[0].id, pricePerPcs: products[0].sellingPrice }));
              setShowAddSale(true);
            }} label={t('sales_btn_add_sale')} icon={<Plus size={12}/>}/>}
            {activeTab === 'ops'  && <HeaderBtn onClick={() => setShowAddOps(true)}  label={t('sales_btn_add_ops')} icon={<Plus size={12}/>}/>}
            {activeTab === 'ads'  && <HeaderBtn onClick={() => setShowAddAds(true)}  label="Tambah Campaign" icon={<Plus size={12}/>}/>}
            {activeTab === 'kol'  && <HeaderBtn onClick={() => setShowAddKol(true)}  label="Tambah KOL" icon={<Plus size={12}/>}/>}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabBtn('sales', t('sales_tab_sales'), computedSales.length)}
        {tabBtn('ops',   t('sales_tab_ops'),   operationalCosts.length)}
        {tabBtn('ads',   t('sales_tab_ads'),   computedAds.length)}
        {tabBtn('kol',   t('sales_tab_kol'),   computedKols.length)}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari order, customer, produk..."
          style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: 'rgba(255,255,255,0.8)', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* ── Tables ── */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {filteredSales.length === 0 ? (
            <EmptyGuide
              icon="🧾"
              title="Sales Ledger kosong"
              description={<>Catat transaksi penjualan pertama. Klik <strong>+ Tambah Penjualan</strong> di kanan atas, lalu edit langsung di tabel.</>}
              tableHints
              action={{ label: '+ Tambah Penjualan', onClick: () => { if (products.length) setNewSale(s => ({ ...s, productId: products[0].id, pricePerPcs: products[0].sellingPrice })); setShowAddSale(true); } }}
            />
          ) : (
            <>
              <SalesInvoicePanel sales={filteredSales as any} products={products.map(p => ({ id: p.id, name: p.name }))}/>
              <SmartTable
                tableId="nevaeh_sales"
                title="Sales Ledger"
                columns={salesCols}
                data={salesRows}
                onDataChange={handleSalesChange}
                allowAddRow={false}
                allowImport
                allowExport
                frozenColumns={1}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'ops' && (
        <DataTable
          columns={colsOps}
          data={filteredOps as unknown as Record<string, unknown>[]}
          emptyIcon="💸"
          emptyMessage="Belum ada biaya operasional"
        />
      )}

      {activeTab === 'ads' && (
        <DataTable
          columns={colsAds}
          data={filteredAds as unknown as Record<string, unknown>[]}
          emptyIcon="📣"
          emptyMessage="Belum ada campaign iklan"
        />
      )}

      {activeTab === 'kol' && (
        <DataTable
          columns={colsKols}
          data={filteredKols as unknown as Record<string, unknown>[]}
          emptyIcon="🤝"
          emptyMessage="Belum ada KOL"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Add / Edit Sale */}
      {(showAddSale || editingSale) && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {editingSale ? 'Edit Order' : t('sales_modal_add_sale')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Produk</label>
                <select
                  value={editingSale ? editingSale.productId : newSale.productId}
                  onChange={e => {
                    const p = products.find(x => x.id === e.target.value);
                    const v = variants.find(x => x.productId === e.target.value);
                    if (editingSale) setEditingSale({ ...editingSale, productId: e.target.value, pricePerPcs: p?.sellingPrice ?? editingSale.pricePerPcs, variantSku: v?.sku ?? '' });
                    else setNewSale({ ...newSale, productId: e.target.value, pricePerPcs: p?.sellingPrice ?? 0, variantSku: v?.sku ?? '' });
                  }} className={inputCls}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Variant SKU</label>
                <select
                  value={editingSale ? editingSale.variantSku : newSale.variantSku}
                  onChange={e => editingSale ? setEditingSale({ ...editingSale, variantSku: e.target.value }) : setNewSale({ ...newSale, variantSku: e.target.value })}
                  className={inputCls}>
                  <option value="">Tanpa variant</option>
                  {computedVariants
                    .filter(v => v.productId === (editingSale?.productId ?? newSale.productId))
                    .map(v => <option key={v.sku} value={v.sku}>{v.sku} — {v.color} {v.size} (sisa {v.remainingStock})</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Nama Pembeli</label>
                <input type="text"
                  value={editingSale ? editingSale.customerName : newSale.customerName}
                  onChange={e => editingSale ? setEditingSale({ ...editingSale, customerName: e.target.value }) : setNewSale({ ...newSale, customerName: e.target.value })}
                  placeholder="e.g. Rina Marlina" className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Channel</label>
                <select
                  value={editingSale ? editingSale.channel : newSale.channel}
                  onChange={e => editingSale ? setEditingSale({ ...editingSale, channel: e.target.value }) : setNewSale({ ...newSale, channel: e.target.value })}
                  className={inputCls}>
                  {channels.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Qty</label>
                <NumberInput allowDecimal={false}
                  value={editingSale ? editingSale.qtySold : newSale.qtySold}
                  onChange={n => editingSale ? setEditingSale({ ...editingSale, qtySold: n }) : setNewSale({ ...newSale, qtySold: n })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Harga/PCS ({currencySymbol})</label>
                <CurrencyInput
                  value={editingSale ? editingSale.pricePerPcs : newSale.pricePerPcs}
                  onChange={v => editingSale ? setEditingSale({ ...editingSale, pricePerPcs: v }) : setNewSale({ ...newSale, pricePerPcs: v })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Platform Fee ({currencySymbol})</label>
                <CurrencyInput
                  value={editingSale ? editingSale.platformFee : newSale.platformFee}
                  onChange={v => editingSale ? setEditingSale({ ...editingSale, platformFee: v }) : setNewSale({ ...newSale, platformFee: v })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Diskon ({currencySymbol})</label>
                <CurrencyInput
                  value={editingSale ? editingSale.discount : newSale.discount}
                  onChange={v => editingSale ? setEditingSale({ ...editingSale, discount: v }) : setNewSale({ ...newSale, discount: v })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Tanggal</label>
                <input type="date"
                  value={editingSale ? editingSale.date : newSale.date}
                  onChange={e => editingSale ? setEditingSale({ ...editingSale, date: e.target.value }) : setNewSale({ ...newSale, date: e.target.value })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Status</label>
                <select
                  value={editingSale ? editingSale.status : newSale.status}
                  onChange={e => editingSale ? setEditingSale({ ...editingSale, status: e.target.value as SalesRecord['status'] }) : setNewSale({ ...newSale, status: e.target.value as SalesRecord['status'] })}
                  className={inputCls}>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: editingSale ? 'space-between' : 'flex-end', marginTop: '20px' }}>
              {editingSale && (
                <button onClick={() => { deleteSale(editingSale.id); setEditingSale(null); }}
                  style={{ padding: '9px 16px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                  Hapus
                </button>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowAddSale(false); setEditingSale(null); }}
                  style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={() => {
                  if (editingSale) {
                    updateSale(editingSale.id, {
                      date: editingSale.date, productId: editingSale.productId,
                      variantSku: editingSale.variantSku, customerName: editingSale.customerName,
                      channel: editingSale.channel, qtySold: editingSale.qtySold,
                      pricePerPcs: editingSale.pricePerPcs, platformFee: editingSale.platformFee,
                      discount: editingSale.discount, status: editingSale.status,
                    });
                    setEditingSale(null);
                    toast.success('Order diperbarui');
                  } else {
                    if (!newSale.productId) return toast.error('Produk wajib dipilih');
                    addSale(newSale);
                    setShowAddSale(false);
                    setNewSale({ date: new Date().toISOString().split('T')[0], productId: '', variantSku: '', customerName: '', channel: 'Website', qtySold: 1, pricePerPcs: 0, platformFee: 0, shippingFee: 0, discount: 0, status: 'Completed' });
                  }
                }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                  {editingSale ? 'Simpan' : 'Log Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Ops Cost */}
      {showAddOps && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {t('sales_modal_add_ops')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Kategori</label>
                <select value={newOps.category} onChange={e => setNewOps({ ...newOps, category: e.target.value })} className={inputCls}>
                  {opsCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Jumlah ({currencySymbol})</label>
                <CurrencyInput value={newOps.amount} onChange={v => setNewOps({ ...newOps, amount: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Platform</label>
                <input type="text" value={newOps.platform} placeholder="Meta Ads, Shopee, dll..."
                  onChange={e => setNewOps({ ...newOps, platform: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Tanggal</label>
                <input type="date" value={newOps.date} onChange={e => setNewOps({ ...newOps, date: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Produk Terkait</label>
                <select value={newOps.productId} onChange={e => setNewOps({ ...newOps, productId: e.target.value })} className={inputCls}>
                  <option value="">General (semua produk)</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Campaign ID</label>
                <input type="text" value={newOps.campaignId} placeholder="opsional"
                  onChange={e => setNewOps({ ...newOps, campaignId: e.target.value })} className={inputCls}/>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Catatan</label>
                <textarea value={newOps.notes} onChange={e => setNewOps({ ...newOps, notes: e.target.value })}
                  className="w-full h-14 p-3 bg-[var(--color-card-bg)] border border-white/[0.06] text-white rounded focus:outline-none text-xs font-mono"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddOps(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => {
                if (!newOps.amount) return toast.error('Jumlah wajib diisi');
                addOperationalCost(newOps);
                setShowAddOps(false);
                setNewOps({ category: 'Meta Ads', campaignId: '', productId: '', amount: 0, date: new Date().toISOString().split('T')[0], platform: '', notes: '' });
              }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Catat Biaya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ads */}
      {showAddAds && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              Tambah Campaign Iklan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Nama Campaign</label>
                <input type="text" value={newAds.name} placeholder="e.g. Summer Drop 2025"
                  onChange={e => setNewAds({ ...newAds, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Platform</label>
                <select value={newAds.platform} onChange={e => setNewAds({ ...newAds, platform: e.target.value as AdsCampaign['platform'] })} className={inputCls}>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Shopee Ads">Shopee Ads</option>
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Produk</label>
                <select value={newAds.productId} onChange={e => setNewAds({ ...newAds, productId: e.target.value })} className={inputCls}>
                  <option value="">Semua produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Spend ({currencySymbol})</label>
                <CurrencyInput value={newAds.spend} onChange={v => setNewAds({ ...newAds, spend: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Revenue ({currencySymbol})</label>
                <CurrencyInput value={newAds.revenue} onChange={v => setNewAds({ ...newAds, revenue: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">CTR (%)</label>
                <NumberInput value={newAds.ctr} onChange={n => setNewAds({ ...newAds, ctr: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">CVR (%)</label>
                <NumberInput value={newAds.conversionRate} onChange={n => setNewAds({ ...newAds, conversionRate: n })} className={inputCls}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddAds(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => {
                if (!newAds.name) return toast.error('Nama campaign wajib diisi');
                addAdsCampaign(newAds);
                setShowAddAds(false);
              }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Simpan Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add KOL */}
      {showAddKol && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              Tambah KOL
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Nama KOL</label>
                <input type="text" value={newKol.name} placeholder="e.g. @influencer_name"
                  onChange={e => setNewKol({ ...newKol, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Platform</label>
                <select value={newKol.platform} onChange={e => setNewKol({ ...newKol, platform: e.target.value as KolTracking['platform'] })} className={inputCls}>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="X">X (Twitter)</option>
                </select>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Followers</label>
                <NumberInput value={newKol.followers} allowDecimal={false}
                  onChange={n => setNewKol({ ...newKol, followers: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Fee ({currencySymbol})</label>
                <CurrencyInput value={newKol.cost} onChange={v => setNewKol({ ...newKol, cost: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Revenue Track ({currencySymbol})</label>
                <CurrencyInput value={newKol.revenueGenerated} onChange={v => setNewKol({ ...newKol, revenueGenerated: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Kode Promo</label>
                <input type="text" value={newKol.campaignId} placeholder="NAMAXXXXXXX"
                  onChange={e => setNewKol({ ...newKol, campaignId: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-[var(--color-text-muted)] uppercase text-[10px] font-mono mb-1 block">Status</label>
                <select value={newKol.status} onChange={e => setNewKol({ ...newKol, status: e.target.value as KolTracking['status'] })} className={inputCls}>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Contracted">Contracted</option>
                  <option value="Content Posted">Content Posted</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddKol(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => {
                if (!newKol.name) return toast.error('Nama KOL wajib diisi');
                addKol(newKol);
                setShowAddKol(false);
              }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Tambah KOL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
