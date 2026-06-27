import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { MasterProduct, SampleDevelopment, ProductionBatch, SizeVariantInventory } from '../types';
import { DataTable, DtColumn, moneyCell, numberCell } from '../../../shared/ui/DataTable';
import SmartTable, { ColumnDef as SmartColumnDef } from '../../../shared/table/SmartTable';
import EmptyGuide from '../../../shared/ui/EmptyGuide';
import PageHeader, { HeaderBtn } from '../../../shared/ui/PageHeader';
import { Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import NumberInput from '../../../shared/ui/NumberInput';

interface ProductsViewProps {
  initialSubTab?: 'sample' | 'production' | 'master' | 'variants';
}

export default function ProductsView({ initialSubTab = 'master' }: ProductsViewProps) {
  const {
    products,
    computedMaterials,
    computedSamples,
    computedProduction,
    computedProducts,
    computedVariants,
    config,
    addProduct,
    updateProduct,
    deleteProduct,
    addSample,
    updateSample,
    deleteSample,
    addProduction,
    updateProduction,
    deleteProduction,
    addVariant,
    updateVariant,
    deleteVariant,
    formatMoney, t,
  } = useERP();

  const accentHex = config?.customAccentColor || '#7c3aed';
  const currencySymbol = config?.currencySymbol || 'Rp';
  const isId = config?.language === 'id';

  const [activeTab, setActiveTab] = useState<'master' | 'sample' | 'production' | 'variants'>(initialSubTab);
  const [search, setSearch] = useState('');
  const [collFilter, setCollFilter] = useState('ALL');

  // ── Edit states ──────────────────────────────────────────────────────────────
  type EditProd = MasterProduct & { id: string };
  const [editingProd, setEditingProd] = useState<EditProd | null>(null);

  // ── Add states ───────────────────────────────────────────────────────────────
  const [showAddProd, setShowAddProd] = useState(false);
  const [newProd, setNewProd] = useState<Omit<MasterProduct, 'id'>>({
    name: '', collection: '', category: 'T-Shirt', sellingPrice: 0, status: 'Active',
  });

  const [showAddSample, setShowAddSample] = useState(false);
  const [newSample, setNewSample] = useState<Omit<SampleDevelopment, 'id'>>({
    productId: '', productName: '', version: 'v1.0',
    materialId: '', usageQty: 2.0, wastePercentage: 0.10, laborCost: 0,
    status: 'Sampling', createdDate: new Date().toISOString().split('T')[0], notes: '',
  });

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatch, setNewBatch] = useState<Omit<ProductionBatch, 'id'>>({
    productId: '', productName: '', factory: '',
    qty: 100, materialId: '', usagePerPcs: 1.5,
    laborCost: 0, packagingCost: 0,
    qcStatus: 'Pending', productionStatus: 'Scheduled',
    productionDate: new Date().toISOString().split('T')[0], notes: '',
  });

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState<SizeVariantInventory>({
    sku: '', productId: '', productName: '',
    color: 'White', size: 'M', currentStock: 50, minStock: 10,
  });

  // ── Collections list ─────────────────────────────────────────────────────────
  const collections = useMemo(() => [...new Set(products.map(p => p.collection))], [products]);

  // ── Filtered data ─────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => computedProducts.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      && (collFilter === 'ALL' || p.collection === collFilter);
  }), [computedProducts, search, collFilter]);

  const filteredSamples = useMemo(() => computedSamples.filter(s =>
    s.productName.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()),
  ), [computedSamples, search]);

  const filteredProduction = useMemo(() => computedProduction.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()),
  ), [computedProduction, search]);

  const filteredVariants = useMemo(() => computedVariants.filter(v =>
    v.productName.toLowerCase().includes(search.toLowerCase()) ||
    v.sku.toLowerCase().includes(search.toLowerCase()),
  ), [computedVariants, search]);

  // ── Status badge helper ──────────────────────────────────────────────────────
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    Active:      { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
    active:      { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
    Approved:    { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
    Completed:   { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
    Passed:      { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
    'In Progress':{ color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.25)' },
    Sampling:    { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
    Scheduled:   { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
    Sent:        { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
    Archived:    { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
    Draft:       { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
    Design:      { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
    Pending:     { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)' },
    Rejected:    { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
    Failed:      { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
    Delayed:     { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
    Cancelled:   { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  };

  const statusBadge = (v: unknown) => {
    const s = String(v ?? '');
    const c = statusColors[s] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
        fontSize: '11px', fontWeight: 500,
        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      }}>
        {s}
      </span>
    );
  };

  // ── Columns (Sample / Production / Variants use DataTable) ──────────────────
  type CS = typeof computedSamples[0];
  const colsSample: DtColumn<CS>[] = [
    {
      key: 'productName', label: 'Produk',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.id} · {row.version}</div>
        </div>
      ),
    },
    { key: 'usageQty', label: 'Usage (m)', align: 'right', width: '110px', render: v => numberCell(v) },
    { key: 'wastePercentage', label: 'Waste %', align: 'right', width: '90px',
      render: v => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'laborCost', label: 'Labor', align: 'right', width: '130px', render: v => moneyCell(v) },
    { key: 'sampleTotalCost', label: 'Total Cost', align: 'right', width: '140px', render: v => moneyCell(v) },
    { key: 'status', label: 'Status', align: 'center', width: '100px', render: statusBadge },
    { key: 'createdDate', label: 'Tanggal', width: '110px' },
  ];

  type CPB = typeof computedProduction[0];
  const colsBatch: DtColumn<CPB>[] = [
    {
      key: 'productName', label: 'Produk',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.id} · {row.factory}</div>
        </div>
      ),
    },
    { key: 'qty', label: 'Qty', align: 'right', width: '80px', render: v => numberCell(v) },
    { key: 'totalProductionCost', label: 'Total Cost', align: 'right', width: '150px', render: v => moneyCell(v) },
    { key: 'unitCost', label: 'Unit Cost', align: 'right', width: '130px', render: v => moneyCell(v) },
    { key: 'qcStatus', label: 'QC', align: 'center', width: '90px', render: statusBadge },
    { key: 'productionStatus', label: 'Status', align: 'center', width: '110px', render: statusBadge },
  ];

  type CV = { sku: string; productName: string; color: string; size: string; remainingStock: number; currentStock: number; minStock: number; status: string };
  const colsVariant: DtColumn<CV>[] = [
    {
      key: 'productName', label: 'Produk',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.sku}</div>
        </div>
      ),
    },
    { key: 'color', label: 'Warna', width: '100px' },
    { key: 'size', label: 'Size', align: 'center', width: '70px' },
    { key: 'currentStock', label: 'Stok Awal', align: 'right', width: '100px', render: v => numberCell(v) },
    {
      key: 'remainingStock', label: 'Sisa', align: 'right', width: '90px',
      render: (v, row) => {
        const n = Number(v) || 0;
        const isLow = n <= Number(row.minStock);
        return <span style={{ color: isLow ? '#F87171' : '#4ADE80', fontVariantNumeric: 'tabular-nums', fontWeight: isLow ? 600 : 400 }}>
          {n.toLocaleString('id-ID')}
        </span>;
      },
    },
    { key: 'status', label: 'Status', align: 'center', width: '100px', render: statusBadge },
  ];

  // ── Master Products → SmartTable (Excel-style) ──────────────────────────────
  const prodCols: SmartColumnDef[] = [
    { key: 'name',             label: 'Nama Produk',  type: 'text',     isEditable: true,  width: 220 },
    { key: 'sku',              label: 'SKU',          type: 'text',     isComputed: true,  width: 120 },
    { key: 'collection',       label: 'Koleksi',      type: 'text',     isEditable: true,  width: 160 },
    { key: 'category',         label: 'Kategori',     type: 'text',     isEditable: true,  width: 130 },
    { key: 'sellingPrice',     label: 'Harga Jual',   type: 'currency', isEditable: true,  align: 'right', width: 130 },
    { key: 'finalHPP',         label: 'HPP',          type: 'currency', isComputed: true,  align: 'right', width: 130 },
    { key: 'marginPercentage', label: 'Margin %',     type: 'number',   isComputed: true,  align: 'right', width: 90 },
    { key: 'status',           label: 'Status',       type: 'status',   isEditable: true,  selectOptions: ['Active','Draft','Archived'], width: 120 },
  ];

  const prodRows = useMemo(() => filteredProducts.map(p => ({ ...p, sku: p.id })), [filteredProducts]);

  const handleProdChange = (newData: Record<string, unknown>[]) => {
    const ids = new Set(newData.map(r => r.id));
    products.forEach(old => { if (!ids.has(old.id)) deleteProduct(old.id); });
    newData.forEach(row => {
      const id = String(row.id);
      const old = computedProducts.find(p => p.id === id);
      if (!old) return;
      const updates: Partial<MasterProduct> = {};
      if (row.name !== old.name) updates.name = String(row.name ?? '');
      if (row.collection !== old.collection) updates.collection = String(row.collection ?? '');
      if (row.category !== old.category) updates.category = String(row.category ?? '');
      if (Number(row.sellingPrice) !== old.sellingPrice) updates.sellingPrice = Number(row.sellingPrice) || 0;
      if (row.status !== old.status) updates.status = String(row.status) as MasterProduct['status'];
      if (Object.keys(updates).length) updateProduct(id, updates);
    });
  };

  // ── Shared UI helpers ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 bg-[var(--color-card-bg)] border border-white/[0.08] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)] text-sm';

  const tabBtn = (key: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => { setActiveTab(key); setSearch(''); }}
      style={{
        paddingBottom: '10px', background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative', fontSize: '14px', fontWeight: 500,
        color: activeTab === key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
        transition: 'color 0.15s',
      }}
    >
      {activeTab === key && (
        <motion.div layoutId="prod-indicator" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: accentHex, borderRadius: '1px',
        }}/>
      )}
      {label} <span style={{ opacity: 0.4, fontSize: '10px' }}>[{count}]</span>
    </button>
  );

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 50,
  };
  const modalCard: React.CSSProperties = {
    width: '100%', maxWidth: '480px',
    background: 'rgba(14,10,28,0.92)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px', padding: '32px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
    maxHeight: '90vh', overflowY: 'auto',
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <PageHeader
        title="Products"
        actions={
          <div className="flex gap-2">
            {activeTab === 'master' && <HeaderBtn onClick={() => setShowAddProd(true)} label={t('prod_btn_add_product')} icon={<Plus size={14}/>}/>}
            {activeTab === 'sample' && <HeaderBtn onClick={() => {
              if (products.length && computedMaterials.length) {
                setNewSample(s => ({ ...s, productId: products[0].id, productName: products[0].name, materialId: computedMaterials[0].id }));
              }
              setShowAddSample(true);
            }} label={t('prod_btn_add_sample')} icon={<Plus size={14}/>}/>}
            {activeTab === 'production' && <HeaderBtn onClick={() => {
              if (products.length && computedMaterials.length) {
                setNewBatch(b => ({ ...b, productId: products[0].id, productName: products[0].name, materialId: computedMaterials[0].id }));
              }
              setShowAddBatch(true);
            }} label={t('prod_btn_add_batch')} icon={<Plus size={14}/>}/>}
            {activeTab === 'variants' && <HeaderBtn onClick={() => {
              if (products.length) setNewVariant(v => ({ ...v, productId: products[0].id, productName: products[0].name }));
              setShowAddVariant(true);
            }} label={t('prod_btn_add_variant')} icon={<Plus size={14}/>}/>}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabBtn('master',     t('prod_tab_products'),    computedProducts.length)}
        {tabBtn('sample',     t('prod_tab_samples'),     computedSamples.length)}
        {tabBtn('production', t('prod_tab_production'),  computedProduction.length)}
        {tabBtn('variants',   t('prod_tab_variants'),    computedVariants.length)}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk, SKU, ID..."
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', color: 'rgba(255,255,255,0.85)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {activeTab === 'master' && collections.length > 0 && (
          <select value={collFilter} onChange={e => setCollFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '10px 14px', fontSize: '14px' }}>
            <option value="ALL">Semua Koleksi</option>
            {collections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* ── Tables ── */}
      {activeTab === 'master' && (
        prodRows.length === 0 ? (
          <EmptyGuide
            icon="👕"
            title="Products kosong"
            description={<>Tambahkan produk pertama Anda. Klik <strong>+ Tambah Produk</strong> di kanan atas, lalu edit langsung di tabel.</>}
            tableHints
            action={{ label: '+ Tambah Produk', onClick: () => setShowAddProd(true) }}
          />
        ) : (
        <SmartTable
          tableId="master_products"
          title="Products"
          columns={prodCols}
          data={prodRows}
          onDataChange={handleProdChange}
          allowAddRow={false}
          allowImport
          allowExport
          frozenColumns={1}
        />
        )
      )}

      {activeTab === 'sample' && (
        filteredSamples.length === 0 ? (
          <EmptyGuide icon="🧪" title="Sample Development kosong"
            description={<>Catat prototipe/sample pertama. Klik <strong>+ Tambah Sample</strong> di kanan atas.</>}
            action={{ label: '+ Tambah Sample', onClick: () => { if (products.length && computedMaterials.length) setNewSample(s => ({ ...s, productId: products[0].id, productName: products[0].name, materialId: computedMaterials[0].id })); setShowAddSample(true); } }}
          />
        ) : (
        <DataTable
          columns={colsSample}
          data={filteredSamples as unknown as Record<string, unknown>[]}
          emptyIcon="🧪"
          emptyMessage="Belum ada sample"
        />
        )
      )}

      {activeTab === 'production' && (
        filteredProduction.length === 0 ? (
          <EmptyGuide icon="🏭" title="Production kosong"
            description={<>Mulai batch produksi pertama. Klik <strong>+ Tambah Batch</strong> di kanan atas.</>}
            action={{ label: '+ Tambah Batch', onClick: () => { if (products.length && computedMaterials.length) setNewBatch(b => ({ ...b, productId: products[0].id, productName: products[0].name, materialId: computedMaterials[0].id })); setShowAddBatch(true); } }}
          />
        ) : (
        <DataTable
          columns={colsBatch}
          data={filteredProduction as unknown as Record<string, unknown>[]}
          emptyIcon="🏭"
          emptyMessage="Belum ada produksi"
        />
        )
      )}

      {activeTab === 'variants' && (
        <DataTable
          columns={colsVariant as DtColumn<Record<string, unknown>>[]}
          data={filteredVariants.map(v => ({
            ...v,
            remainingStock: v.currentStock - (computedProducts.find(p => p.id === v.productId) ? 0 : 0),
            status: v.currentStock <= v.minStock ? 'Low Stock' : 'OK',
          } as Record<string, unknown>))}
          emptyIcon="📦"
          emptyMessage="Belum ada variant SKU"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Add / Edit Master Product */}
      {(showAddProd || editingProd) && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.95)', marginBottom: '24px' }}>
              {editingProd ? 'Edit Produk' : t('prod_modal_add_product')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Nama Produk</label>
                <input type="text" value={editingProd ? editingProd.name : newProd.name}
                  placeholder="e.g. Oversize Tee Classic White"
                  onChange={e => editingProd ? setEditingProd({ ...editingProd, name: e.target.value }) : setNewProd({ ...newProd, name: e.target.value })}
                  className={inputCls}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Koleksi</label>
                  <input type="text" value={editingProd ? editingProd.collection : newProd.collection}
                    onChange={e => editingProd ? setEditingProd({ ...editingProd, collection: e.target.value }) : setNewProd({ ...newProd, collection: e.target.value })}
                    placeholder="Essential Series 2025" className={inputCls}/>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Kategori</label>
                  <input type="text" value={editingProd ? editingProd.category : newProd.category}
                    onChange={e => editingProd ? setEditingProd({ ...editingProd, category: e.target.value }) : setNewProd({ ...newProd, category: e.target.value })}
                    className={inputCls}/>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Harga Jual ({currencySymbol})</label>
                <CurrencyInput
                  value={editingProd ? editingProd.sellingPrice : newProd.sellingPrice}
                  onChange={v => editingProd ? setEditingProd({ ...editingProd, sellingPrice: v }) : setNewProd({ ...newProd, sellingPrice: v })}
                  className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Status</label>
                <select
                  value={editingProd ? editingProd.status : newProd.status}
                  onChange={e => editingProd
                    ? setEditingProd({ ...editingProd, status: e.target.value as MasterProduct['status'] })
                    : setNewProd({ ...newProd, status: e.target.value as MasterProduct['status'] })}
                  className={inputCls}>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <ImageUploader
                  currentImage={editingProd ? editingProd.image : newProd.image}
                  onUpload={b64 => editingProd ? setEditingProd({ ...editingProd, image: b64 }) : setNewProd({ ...newProd, image: b64 })}
                  label="Foto Produk (opsional)"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: editingProd ? 'space-between' : 'flex-end', marginTop: '20px' }}>
              {editingProd && (
                <button onClick={() => { deleteProduct(editingProd.id); setEditingProd(null); }}
                  style={{ padding: '9px 16px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                  Hapus
                </button>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowAddProd(false); setEditingProd(null); }}
                  style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={() => {
                  if (editingProd) {
                    updateProduct(editingProd.id, {
                      name: editingProd.name, collection: editingProd.collection,
                      category: editingProd.category, sellingPrice: editingProd.sellingPrice,
                      status: editingProd.status,
                    });
                    setEditingProd(null);
                    toast.success('Produk diperbarui');
                  } else {
                    if (!newProd.name) return toast.error('Nama produk wajib diisi');
                    addProduct(newProd);
                    setShowAddProd(false);
                    setNewProd({ name: '', collection: '', category: 'T-Shirt', sellingPrice: 0, status: 'Active' });
                  }
                }} style={{ padding: '12px 20px', background: accentHex, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {editingProd ? 'Simpan' : t('prod_modal_add_product').split(' ')[0] + ' Produk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sample */}
      {showAddSample && (
        <div style={modalOverlay}>
          <div style={{ ...modalCard, maxWidth: '520px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.95)', marginBottom: '24px' }}>
              {t('prod_modal_add_sample')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Produk</label>
                <select value={newSample.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setNewSample({ ...newSample, productId: e.target.value, productName: p?.name ?? '' });
                }} className={inputCls}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Versi Pola</label>
                <input type="text" value={newSample.version}
                  onChange={e => setNewSample({ ...newSample, version: e.target.value })} className={inputCls}/>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Material</label>
                <select value={newSample.materialId}
                  onChange={e => setNewSample({ ...newSample, materialId: e.target.value })} className={inputCls}>
                  {computedMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — sisa {m.remainingQty} {m.unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Usage (m)</label>
                <NumberInput value={newSample.usageQty} onChange={n => setNewSample({ ...newSample, usageQty: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Waste % (0.10 = 10%)</label>
                <NumberInput value={newSample.wastePercentage} onChange={n => setNewSample({ ...newSample, wastePercentage: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Labor ({currencySymbol})</label>
                <CurrencyInput value={newSample.laborCost} onChange={v => setNewSample({ ...newSample, laborCost: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Status</label>
                <select value={newSample.status} onChange={e => setNewSample({ ...newSample, status: e.target.value as SampleDevelopment['status'] })} className={inputCls}>
                  <option value="Design">Design</option>
                  <option value="Sampling">Sampling</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Catatan</label>
                <textarea value={newSample.notes} onChange={e => setNewSample({ ...newSample, notes: e.target.value })}
                  className="w-full h-14 p-3 bg-[var(--color-card-bg)] border border-white/[0.06] text-white rounded-xl focus:outline-none text-xs"/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddSample(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => { addSample(newSample); setShowAddSample(false); }}
                style={{ padding: '12px 20px', background: accentHex, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Buat Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Production Batch */}
      {showAddBatch && (
        <div style={modalOverlay}>
          <div style={{ ...modalCard, maxWidth: '520px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.95)', marginBottom: '24px' }}>
              {t('prod_modal_add_batch')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Produk</label>
                <select value={newBatch.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setNewBatch({ ...newBatch, productId: e.target.value, productName: p?.name ?? '' });
                }} className={inputCls}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Pabrik</label>
                <input type="text" value={newBatch.factory}
                  onChange={e => setNewBatch({ ...newBatch, factory: e.target.value })}
                  placeholder="Nama CMT / pabrik" className={inputCls}/>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Material</label>
                <select value={newBatch.materialId} onChange={e => setNewBatch({ ...newBatch, materialId: e.target.value })} className={inputCls}>
                  {computedMaterials.map(m => <option key={m.id} value={m.id}>{m.name} — sisa {m.remainingQty} {m.unit}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Qty Produksi</label>
                <NumberInput value={newBatch.qty} allowDecimal={false}
                  onChange={n => setNewBatch({ ...newBatch, qty: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Usage/PCS (m)</label>
                <NumberInput value={newBatch.usagePerPcs}
                  onChange={n => setNewBatch({ ...newBatch, usagePerPcs: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Labor/PCS ({currencySymbol})</label>
                <CurrencyInput value={newBatch.laborCost} onChange={v => setNewBatch({ ...newBatch, laborCost: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Packaging/PCS ({currencySymbol})</label>
                <CurrencyInput value={newBatch.packagingCost} onChange={v => setNewBatch({ ...newBatch, packagingCost: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Status Produksi</label>
                <select value={newBatch.productionStatus} onChange={e => setNewBatch({ ...newBatch, productionStatus: e.target.value as ProductionBatch['productionStatus'] })} className={inputCls}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Tanggal</label>
                <input type="date" value={newBatch.productionDate}
                  onChange={e => setNewBatch({ ...newBatch, productionDate: e.target.value })} className={inputCls}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddBatch(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => { addProduction(newBatch); setShowAddBatch(false); }}
                style={{ padding: '12px 20px', background: accentHex, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Buat Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Size Variant */}
      {showAddVariant && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.95)', marginBottom: '24px' }}>
              {t('prod_btn_add_variant')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Produk</label>
                <select value={newVariant.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  setNewVariant({ ...newVariant, productId: e.target.value, productName: p?.name ?? '' });
                }} className={inputCls}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">SKU</label>
                <input type="text" value={newVariant.sku}
                  onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })}
                  placeholder="NVH-OTC-S-WHT" className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Warna</label>
                <input type="text" value={newVariant.color}
                  onChange={e => setNewVariant({ ...newVariant, color: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Size</label>
                <select value={newVariant.size} onChange={e => setNewVariant({ ...newVariant, size: e.target.value })} className={inputCls}>
                  {['XS','S','M','L','XL','XXL','3XL','Free Size'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Stok Awal</label>
                <NumberInput value={newVariant.currentStock} allowDecimal={false}
                  onChange={n => setNewVariant({ ...newVariant, currentStock: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Min Stok</label>
                <NumberInput value={newVariant.minStock} allowDecimal={false}
                  onChange={n => setNewVariant({ ...newVariant, minStock: n })} className={inputCls}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddVariant(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => {
                if (!newVariant.sku) return toast.error('SKU wajib diisi');
                addVariant(newVariant);
                setShowAddVariant(false);
              }} style={{ padding: '12px 20px', background: accentHex, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Tambah Variant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
