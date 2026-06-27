import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { Material, PurchaseOrder, Supplier } from '../types';
import { DataTable, DtColumn, moneyCell, numberCell } from '../../../shared/ui/DataTable';
import SmartTable, { ColumnDef as SmartColumnDef } from '../../../shared/table/SmartTable';
import EmptyGuide from '../../../shared/ui/EmptyGuide';
import PageHeader, { HeaderBtn } from '../../../shared/ui/PageHeader';
import { Plus, Search, Truck, Package } from 'lucide-react';
import { motion } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import NumberInput from '../../../shared/ui/NumberInput';

interface MaterialsViewProps {
  initialSubTab?: 'library' | 'purchase' | 'suppliers';
}

export default function MaterialsView({ initialSubTab = 'library' }: MaterialsViewProps) {
  const {
    suppliers,
    computedMaterials,
    computedPurchaseOrders,
    config,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    formatMoney, t,
  } = useERP();

  const accentHex = config?.customAccentColor || '#7c3aed';
  const currencySymbol = config?.currencySymbol || 'Rp';
  const isId = config?.language === 'id';

  const [activeTab, setActiveTab] = useState<'library' | 'purchase' | 'suppliers'>(initialSubTab);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // ── Edit states ─────────────────────────────────────────────────────────────
  const [editingMat, setEditingMat] = useState<(Material & { id: string }) | null>(null);
  const [editingPO,  setEditingPO]  = useState<(PurchaseOrder & { id: string }) | null>(null);
  const [editingSup, setEditingSup] = useState<(Supplier & { id: string }) | null>(null);

  // ── Add states ──────────────────────────────────────────────────────────────
  const [showAddMat, setShowAddMat] = useState(false);
  const [newMat, setNewMat] = useState<Omit<Material, 'id'>>({
    name: '', category: 'Fabric', supplierId: '', unit: 'meters',
    baseQty: 100, costPerUnit: 0, minStock: 50, notes: '',
  });

  const [showAddPO, setShowAddPO] = useState(false);
  const [newPO, setNewPO] = useState<Omit<PurchaseOrder, 'id'>>({
    supplierId: '', materialId: '', qty: 100, unitCost: 0,
    date: new Date().toISOString().split('T')[0], status: 'Draft',
  });

  const [showAddSup, setShowAddSup] = useState(false);
  const [newSup, setNewSup] = useState<Omit<Supplier, 'id'>>({
    name: '', contact: '', performanceIndex: 90, tier: 'Preferred',
  });

  const categories = [
    'Fabric','Rib','Packaging','Label','Polybag','Hangtag','Sticker',
    'Zipper','Button','Mesh','Foam','Hardware','Printing','Embroidery','Accessories',
  ];

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredMaterials = useMemo(() => computedMaterials.filter(m => {
    const q = search.toLowerCase();
    const matchQ = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    const matchCat = catFilter === 'ALL' || m.category === catFilter;
    const matchStock = stockFilter === 'ALL'
      || (stockFilter === 'LOW' && m.stockStatus === 'LOW_STOCK')
      || (stockFilter === 'HEALTHY' && m.stockStatus === 'SURPLUS');
    return matchQ && matchCat && matchStock;
  }), [computedMaterials, search, catFilter, stockFilter]);

  const filteredPOs = useMemo(() => computedPurchaseOrders.filter(po => {
    const sup = suppliers.find(s => s.id === po.supplierId);
    const mat = computedMaterials.find(m => m.id === po.materialId);
    const text = `${po.id} ${sup?.name ?? ''} ${mat?.name ?? ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  }), [computedPurchaseOrders, search, suppliers, computedMaterials]);

  const filteredSuppliers = useMemo(() => suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase()),
  ), [suppliers, search]);

  // ── Columns (Purchase Orders & Suppliers use DataTable) ─────────────────────
  type PO = typeof computedPurchaseOrders[0];
  const colsPO: DtColumn<PO>[] = [
    { key: 'id', label: 'PO ID', width: '130px' },
    { key: 'date', label: 'Tanggal', width: '110px' },
    { key: 'materialName', label: 'Material', render: (v, row) => (
      <div>
        <div style={{ color: 'rgba(255,255,255,0.9)' }}>{String(row.materialName ?? '—')}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.supplierName ?? ''}</div>
      </div>
    )},
    { key: 'qty', label: 'Qty', align: 'right', width: '90px', render: v => numberCell(v) },
    { key: 'unitCost', label: 'Unit Cost', align: 'right', width: '140px', render: v => moneyCell(v) },
    { key: 'totalCost', label: 'Total', align: 'right', width: '150px', render: v => moneyCell(v) },
    {
      key: 'status', label: 'Status', align: 'center', width: '110px',
      render: v => {
        const s = String(v);
        const cfg: Record<string, { color: string; bg: string; border: string }> = {
          Received:  { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.25)' },
          Sent:      { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)' },
          Draft:     { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' },
          Cancelled: { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
        };
        const c = cfg[s] ?? cfg.Draft;
        return (
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 500,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
          }}>
            {s}
          </span>
        );
      },
    },
  ];

  type SP = typeof suppliers[0];
  const colsSup: DtColumn<SP>[] = [
    { key: 'name', label: 'Supplier', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{String(v)}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{row.contact ?? ''}</div>
      </div>
    )},
    { key: 'tier', label: 'Tier', align: 'center', width: '110px', render: v => {
      const s = String(v);
      const map: Record<string, string> = { Preferred: '#A78BFA', Secondary: '#60A5FA', Backup: 'rgba(255,255,255,0.45)' };
      return <span style={{ color: map[s] ?? 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{s}</span>;
    }},
    { key: 'performanceIndex', label: 'Score', align: 'right', width: '90px', render: v => (
      <span style={{ fontVariantNumeric: 'tabular-nums', color: Number(v) >= 80 ? '#4ADE80' : '#F87171' }}>
        {Number(v).toFixed(0)}%
      </span>
    )},
  ];

  // ── Material Library → SmartTable (Excel-style: inline edit, resize, arrows,
  //    copy/paste, drag-reorder, frozen columns) ──────────────────────────────
  const matCols: SmartColumnDef[] = [
    { key: 'name',         label: isId ? 'Nama Material' : 'Material',  type: 'text',     isEditable: true, width: 220 },
    { key: 'code',         label: 'Kode',                               type: 'text',     isComputed: true, width: 100 },
    { key: 'category',     label: isId ? 'Kategori' : 'Category',       type: 'status',   isEditable: true, selectOptions: categories, width: 130 },
    { key: 'baseQty',      label: isId ? 'Stok' : 'Stock',              type: 'number',   isEditable: true, align: 'right', width: 90 },
    { key: 'unit',         label: 'Unit',                               type: 'status',   isEditable: true, selectOptions: ['meter','meters','yard','kg','gram','pcs','roll','lusin'], width: 100 },
    { key: 'costPerUnit',  label: isId ? 'Harga/Unit' : 'Cost/Unit',    type: 'currency', isEditable: true, align: 'right', width: 130 },
    { key: 'minStock',     label: 'Min Stok',                           type: 'number',   isEditable: true, align: 'right', width: 90 },
    { key: 'supplierName', label: 'Supplier',                           type: 'status',   isEditable: true, selectOptions: suppliers.map(s => s.name), width: 160 },
  ];

  const matRows = useMemo(() => filteredMaterials.map(m => ({
    ...m,
    code: m.id,
    supplierName: suppliers.find(s => s.id === m.supplierId)?.name ?? '',
  })), [filteredMaterials, suppliers]);

  const handleMatChange = (newData: Record<string, unknown>[]) => {
    const ids = new Set(newData.map(r => r.id));
    computedMaterials.forEach(old => { if (!ids.has(old.id)) deleteMaterial(old.id); });
    newData.forEach(row => {
      const id = String(row.id);
      const old = computedMaterials.find(m => m.id === id);
      if (!old) return;
      const updates: Partial<Material> = {};
      if (row.name !== old.name) updates.name = String(row.name ?? '');
      if (row.category !== old.category) updates.category = String(row.category ?? '');
      if (row.unit !== old.unit) updates.unit = String(row.unit ?? 'meters');
      if (Number(row.baseQty) !== old.baseQty) updates.baseQty = Number(row.baseQty) || 0;
      if (Number(row.costPerUnit) !== old.costPerUnit) updates.costPerUnit = Number(row.costPerUnit) || 0;
      if (Number(row.minStock) !== old.minStock) updates.minStock = Number(row.minStock) || 0;
      const oldSupName = suppliers.find(s => s.id === old.supplierId)?.name ?? '';
      if (row.supplierName !== oldSupName) {
        const match = suppliers.find(s => s.name === row.supplierName);
        updates.supplierId = match ? match.id : '';
      }
      if (Object.keys(updates).length) updateMaterial(id, updates);
    });
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.09] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)] text-sm';

  const tabBtn = (key: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => { setActiveTab(key); setSearch(''); }}
      style={{
        paddingBottom: '10px', paddingRight: '0', paddingLeft: '0', paddingTop: '0',
        background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
        fontSize: '12px', fontWeight: 500, letterSpacing: '0.03em',
        color: activeTab === key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
        transition: 'color 0.15s',
      }}
    >
      {activeTab === key && (
        <motion.div layoutId="mat-indicator" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: accentHex, borderRadius: '1px',
        }}/>
      )}
      {label} <span style={{ opacity: 0.5, fontSize: '10px' }}>[{count}]</span>
    </button>
  );

  const editBtn = (onClick: () => void) => (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.6)', borderRadius: '7px', padding: '4px 12px',
        fontSize: '11.5px', cursor: 'pointer',
      }}
    >
      Edit
    </button>
  );

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', zIndex: 50,
  };
  const modalCard: React.CSSProperties = {
    width: '100%', maxWidth: '520px',
    background: 'rgba(14,10,28,0.92)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px', padding: '32px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
    maxHeight: '90vh', overflowY: 'auto',
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Page Header */}
      <PageHeader
        title="Material Library"
        actions={
          <div className="flex gap-2">
            {activeTab === 'library' && (
              <HeaderBtn onClick={() => setShowAddMat(true)} label={t('mat_btn_add_material')} icon={<Plus size={14}/>}/>
            )}
            {activeTab === 'purchase' && (
              <HeaderBtn onClick={() => {
                if (computedMaterials.length) {
                  setNewPO(p => ({ ...p, materialId: computedMaterials[0].id, unitCost: computedMaterials[0].costPerUnit }));
                }
                setShowAddPO(true);
              }} label={t('mat_btn_add_po')} icon={<Plus size={14}/>}/>
            )}
            {activeTab === 'suppliers' && (
              <HeaderBtn onClick={() => setShowAddSup(true)} label={t('mat_btn_add_supplier')} icon={<Plus size={14}/>}/>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabBtn('library',   t('mat_tab_library'),   computedMaterials.length)}
        {tabBtn('purchase',  t('mat_tab_purchase'),  computedPurchaseOrders.length)}
        {tabBtn('suppliers', t('mat_tab_suppliers'), suppliers.length)}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'library' ? 'Cari material...' : activeTab === 'purchase' ? 'Cari PO...' : 'Cari supplier...'}
            style={{
              width: '100%', paddingLeft: '32px', paddingRight: '12px',
              paddingTop: '8px', paddingBottom: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '9px', color: 'rgba(255,255,255,0.8)', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        {activeTab === 'library' && (
          <>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '9px', padding: '7px 12px', fontSize: '12px' }}>
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', borderRadius: '9px', padding: '7px 12px', fontSize: '12px' }}>
              <option value="ALL">Semua Status</option>
              <option value="LOW">Low Stock</option>
              <option value="HEALTHY">Surplus</option>
            </select>
          </>
        )}
      </div>

      {/* ── TAB: LIBRARY (SmartTable — Excel-style) ── */}
      {activeTab === 'library' && (
        matRows.length === 0 ? (
          <EmptyGuide
            icon="🧵"
            title="Material Library kosong"
            description={<>Mulai dengan bahan baku pertama Anda. Klik <strong>+ Tambah Material</strong> di kanan atas, lalu edit langsung di tabel.</>}
            tableHints
            action={{ label: '+ Tambah Material', onClick: () => setShowAddMat(true) }}
          />
        ) : (
        <SmartTable
          tableId="materials_library"
          title="Material Library"
          columns={matCols}
          data={matRows}
          onDataChange={handleMatChange}
          allowAddRow={false}
          allowImport
          allowExport
          frozenColumns={1}
        />
        )
      )}

      {/* ── TAB: PURCHASE ORDERS ── */}
      {activeTab === 'purchase' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
          <DataTable
            columns={colsPO}
            data={filteredPOs as unknown as Record<string, unknown>[]}
            emptyIcon="📦"
            emptyMessage="Belum ada purchase order"
            rowActions={row => editBtn(() => setEditingPO(row as unknown as PurchaseOrder & { id: string }))}
          />
          {/* Side widget */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Truck size={14} style={{ color: accentHex }}/>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Relational Sync
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: '16px' }}>
              Status PO <strong style={{ color: '#4ADE80' }}>Received</strong> otomatis menambah stok material.
            </p>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Outstanding PO
            </div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(computedPurchaseOrders
                .filter(po => po.status === 'Sent' || po.status === 'Draft')
                .reduce((s, po) => s + po.totalCost, 0))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SUPPLIERS ── */}
      {activeTab === 'suppliers' && (
        filteredSuppliers.length === 0 ? (
          <EmptyGuide icon="🚚" title="Supplier kosong"
            description={<>Tambahkan pemasok pertama. Klik <strong>+ Tambah Supplier</strong> di kanan atas.</>}
            action={{ label: '+ Tambah Supplier', onClick: () => setShowAddSup(true) }}
          />
        ) : (
        <DataTable
          columns={colsSup}
          data={filteredSuppliers as unknown as Record<string, unknown>[]}
          emptyIcon="🏭"
          emptyMessage="Belum ada supplier"
          rowActions={row => editBtn(() => setEditingSup(row as unknown as Supplier & { id: string }))}
        />
        )
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Add Material */}
      {showAddMat && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {t('mat_modal_add_material')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_name')}</label>
                <input type="text" value={newMat.name} placeholder="e.g. Cobalt Nylon Ripstop"
                  onChange={e => setNewMat({ ...newMat, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_category')}</label>
                <select value={newMat.category} onChange={e => setNewMat({ ...newMat, category: e.target.value })} className={inputCls}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_supplier')}</label>
                <select value={newMat.supplierId} onChange={e => setNewMat({ ...newMat, supplierId: e.target.value })} className={inputCls}>
                  <option value="">Tanpa Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_unit')}</label>
                <input type="text" value={newMat.unit} placeholder="meters"
                  onChange={e => setNewMat({ ...newMat, unit: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_base_qty')}</label>
                <NumberInput value={newMat.baseQty} onChange={n => setNewMat({ ...newMat, baseQty: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_cost_per_unit')} ({currencySymbol})</label>
                <CurrencyInput value={newMat.costPerUnit} onChange={v => setNewMat({ ...newMat, costPerUnit: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_min_stock')}</label>
                <NumberInput value={newMat.minStock} onChange={n => setNewMat({ ...newMat, minStock: n })} className={inputCls}/>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('mat_lbl_notes')}</label>
                <textarea value={newMat.notes} placeholder="Catatan kualitas, ukuran, dll..."
                  onChange={e => setNewMat({ ...newMat, notes: e.target.value })}
                  className="w-full h-14 p-3 bg-[var(--color-card-bg)] border border-white/[0.06] text-white rounded-xl focus:outline-none text-xs"/>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <ImageUploader currentImage={newMat.image} onUpload={b64 => setNewMat({ ...newMat, image: b64 })} label={t('mat_lbl_swatch')}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddMat(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
              <button onClick={() => {
                if (!newMat.name) return toast.error('Nama material wajib diisi');
                addMaterial(newMat);
                setShowAddMat(false);
                setNewMat({ name: '', category: 'Fabric', supplierId: '', unit: 'meters', baseQty: 100, costPerUnit: 0, minStock: 50, notes: '' });
              }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                {t('mat_btn_catalog')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material */}
      {editingMat && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              Edit Material
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Nama</label>
                <input type="text" value={editingMat.name}
                  onChange={e => setEditingMat({ ...editingMat, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Kategori</label>
                <select value={editingMat.category} onChange={e => setEditingMat({ ...editingMat, category: e.target.value })} className={inputCls}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Harga/Unit ({currencySymbol})</label>
                <CurrencyInput value={editingMat.costPerUnit} onChange={v => setEditingMat({ ...editingMat, costPerUnit: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Min Stok</label>
                <NumberInput value={editingMat.minStock} onChange={n => setEditingMat({ ...editingMat, minStock: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Tambah Stok</label>
                <NumberInput value={editingMat.baseQty} onChange={n => setEditingMat({ ...editingMat, baseQty: n })} className={inputCls}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={() => { deleteMaterial(editingMat.id); setEditingMat(null); }}
                style={{ padding: '9px 16px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                Hapus
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingMat(null)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={() => {
                  updateMaterial(editingMat.id, {
                    name: editingMat.name, category: editingMat.category,
                    costPerUnit: editingMat.costPerUnit, minStock: editingMat.minStock,
                    baseQty: editingMat.baseQty,
                  });
                  setEditingMat(null);
                  toast.success('Material diperbarui');
                }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add PO */}
      {showAddPO && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {t('mat_modal_add_po')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Material</label>
                <select value={newPO.materialId} onChange={e => {
                  const m = computedMaterials.find(x => x.id === e.target.value);
                  setNewPO({ ...newPO, materialId: e.target.value, unitCost: m?.costPerUnit ?? 0 });
                }} className={inputCls}>
                  {computedMaterials.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Supplier</label>
                <select value={newPO.supplierId} onChange={e => setNewPO({ ...newPO, supplierId: e.target.value })} className={inputCls}>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Qty</label>
                <NumberInput value={newPO.qty} onChange={n => setNewPO({ ...newPO, qty: n })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Unit Cost ({currencySymbol})</label>
                <CurrencyInput value={newPO.unitCost} onChange={v => setNewPO({ ...newPO, unitCost: v })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Tanggal</label>
                <input type="date" value={newPO.date} onChange={e => setNewPO({ ...newPO, date: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Status</label>
                <select value={newPO.status} onChange={e => setNewPO({ ...newPO, status: e.target.value as PurchaseOrder['status'] })} className={inputCls}>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Received">Received (+stok)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddPO(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
              <button onClick={() => { addPurchaseOrder(newPO); setShowAddPO(false); }}
                style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                {t('mat_btn_dispatch_po')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier */}
      {showAddSup && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {t('mat_modal_add_supplier')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Nama Supplier</label>
                <input type="text" value={newSup.name} placeholder="e.g. CV Tekstil Nusantara"
                  onChange={e => setNewSup({ ...newSup, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Kontak</label>
                <input type="text" value={newSup.contact} placeholder="Nama — email — no HP"
                  onChange={e => setNewSup({ ...newSup, contact: e.target.value })} className={inputCls}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Score (0–100)</label>
                  <NumberInput value={newSup.performanceIndex} min={0} max={100} allowDecimal={false}
                    onChange={n => setNewSup({ ...newSup, performanceIndex: n })} className={inputCls}/>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Tier</label>
                  <select value={newSup.tier} onChange={e => setNewSup({ ...newSup, tier: e.target.value as Supplier['tier'] })} className={inputCls}>
                    <option value="Preferred">Preferred</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Backup">Backup</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowAddSup(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
              <button onClick={() => {
                if (!newSup.name) return toast.error('Nama supplier wajib diisi');
                addSupplier(newSup);
                setShowAddSup(false);
                setNewSup({ name: '', contact: '', performanceIndex: 90, tier: 'Preferred' });
              }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                {t('mat_btn_affiliate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier */}
      {editingSup && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              Edit Supplier
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Nama</label>
                <input type="text" value={editingSup.name}
                  onChange={e => setEditingSup({ ...editingSup, name: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Kontak</label>
                <input type="text" value={editingSup.contact}
                  onChange={e => setEditingSup({ ...editingSup, contact: e.target.value })} className={inputCls}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Score</label>
                  <NumberInput value={editingSup.performanceIndex} min={0} max={100} allowDecimal={false}
                    onChange={n => setEditingSup({ ...editingSup, performanceIndex: n })} className={inputCls}/>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Tier</label>
                  <select value={editingSup.tier} onChange={e => setEditingSup({ ...editingSup, tier: e.target.value as Supplier['tier'] })} className={inputCls}>
                    <option value="Preferred">Preferred</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Backup">Backup</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={() => { deleteSupplier(editingSup.id); setEditingSup(null); }}
                style={{ padding: '9px 16px', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)', color: '#F87171', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                Hapus
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingSup(null)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={() => {
                  updateSupplier(editingSup.id, {
                    name: editingSup.name, contact: editingSup.contact,
                    performanceIndex: editingSup.performanceIndex, tier: editingSup.tier,
                  });
                  setEditingSup(null);
                  toast.success('Supplier diperbarui');
                }} style={{ padding: '9px 18px', background: accentHex, color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
