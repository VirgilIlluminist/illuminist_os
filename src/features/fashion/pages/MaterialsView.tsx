import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { Material, PurchaseOrder, Supplier } from '../types';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Package, 
  FolderLock, 
  Inbox,
  Clock,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';
import CurrencyInput from '../../../shared/components/CurrencyInput';

interface MaterialsViewProps {
  key?: string;
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
    formatMoney, t
  } = useERP();

  const accentHex = config?.customAccentColor || '#d4af37';

  const currencySymbol = config?.currencySymbol || 'Rp';

  const [activeTab, setActiveTab] = useState<'library' | 'purchase' | 'suppliers'>(initialSubTab);

  const isIdLng = config?.language === 'id';

  const columnsLib: ColumnDef[] = [
    { key: 'id', label: 'Material ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Bahan' : 'Material Name', isEditable: true, type: 'text' },
    { key: 'category', label: isIdLng ? 'Kategori' : 'Category', isEditable: true, type: 'text' },
    { key: 'supplierId', label: isIdLng ? 'Pemasok' : 'Supplier Source', isEditable: true, type: 'status', selectOptions: suppliers.map(s => s.name) },
    { key: 'purchaseQty', label: isIdLng ? 'Stok Ditambahkan' : 'Purchase Qty', isEditable: true, type: 'number', align: 'right' },
    { key: 'sampleQty', label: isIdLng ? 'Pakai Sampel' : 'Sample Usage', type: 'number', align: 'right', isEditable: false },
    { key: 'productionQty', label: isIdLng ? 'Pakai Produksi' : 'Production Usage', type: 'number', align: 'right', isEditable: false },
    { key: 'totalUsedQty', label: isIdLng ? 'Total Terpakai' : 'Total Used', type: 'number', align: 'right', isEditable: false },
    { key: 'remainingQty', label: isIdLng ? 'Sisa Stok' : 'Remaining Qty', type: 'number', align: 'right', isEditable: false },
    { key: 'stockStatus', label: 'Status', type: 'priority', align: 'center', isEditable: false },
    { key: 'costPerUnit', label: isIdLng ? 'Biaya per Satuan' : 'Cost/Unit', isEditable: true, type: 'currency', align: 'right' },
    { key: 'totalValue', label: isIdLng ? 'Total Nilai' : 'Total Value', type: 'formula', formulaExpr: "{remainingQty} * {costPerUnit}", align: 'right', isEditable: false },
    { key: 'aiReview', label: 'AI Review ✨', type: 'aiSummary', width: 220, isEditable: false }
  ];

  const handleDataChangeLib = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedMaterials.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteMaterial(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedMaterials.find(m => m.id === newItem.id);
      if (oldItem) {
        const updates: Partial<Material> = {};
        if (newItem.name !== oldItem.name) updates.name = newItem.name;
        if (newItem.category !== oldItem.category) updates.category = newItem.category;
        if (newItem.costPerUnit !== oldItem.costPerUnit) updates.costPerUnit = Number(newItem.costPerUnit) || 0;
        if (newItem.purchaseQty !== oldItem.purchaseQty) updates.baseQty = Number(newItem.purchaseQty) || 0;
        
        if (newItem.supplierId !== oldItem.supplierId) {
          const match = suppliers.find(s => s.name === newItem.supplierId);
          if (match) {
            updates.supplierId = match.id;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateMaterial(newItem.id, updates);
        }
      }
    });
  };

  const columnsPO: ColumnDef[] = [
    { key: 'id', label: 'PO ID', type: 'text', isEditable: false },
    { key: 'date', label: isIdLng ? 'Tanggal' : 'Dated', isEditable: true, type: 'date' },
    { key: 'materialName', label: isIdLng ? 'Target Bahan' : 'Material Target', isEditable: true, type: 'text' },
    { key: 'supplierName', label: isIdLng ? 'Pemasok' : 'Supplier Brand', isEditable: true, type: 'text' },
    { key: 'qty', label: isIdLng ? 'Volume' : 'Volume', isEditable: true, type: 'number', align: 'right' },
    { key: 'unitCost', label: 'Unit HPP', isEditable: true, type: 'currency', align: 'right' },
    { key: 'totalCost', label: 'Landed Cost', type: 'formula', formulaExpr: "{qty} * {unitCost}", align: 'right', isEditable: false },
    { key: 'status', label: 'Status', isEditable: true, type: 'status', selectOptions: ['Draft', 'Sent', 'Received', 'Cancelled'], align: 'center' }
  ];

  const handleDataChangePO = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedPurchaseOrders.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deletePurchaseOrder(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedPurchaseOrders.find(po => po.id === newItem.id);
      if (oldItem) {
        const updates: Partial<PurchaseOrder> = {};
        if (newItem.date !== oldItem.date) updates.date = newItem.date;
        if (newItem.qty !== oldItem.qty) updates.qty = Number(newItem.qty) || 0;
        if (newItem.unitCost !== oldItem.unitCost) updates.unitCost = Number(newItem.unitCost) || 0;
        if (newItem.status !== oldItem.status) updates.status = newItem.status as any;
        
        if (Object.keys(updates).length > 0) {
          updatePurchaseOrder(newItem.id, updates);
        }
      }
    });
  };

  const columnsSupplier: ColumnDef[] = [
    { key: 'id', label: 'Supplier ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Pemasok' : 'Supplier Name', isEditable: true, type: 'text' },
    { key: 'contact', label: isIdLng ? 'Narahubung / Kontak' : 'Contact / Details', isEditable: true, type: 'text' },
    { key: 'performanceIndex', label: isIdLng ? 'Indeks Skor' : 'Performance Score', isEditable: true, type: 'percentage', align: 'right' },
    { key: 'tier', label: 'Tier Level', isEditable: true, type: 'priority', selectOptions: ['Preferred', 'Secondary', 'Emergency'], align: 'center' },
    { key: 'aiForecast', label: 'AI Risk Forecast 🔮', type: 'aiForecast', width: 220, isEditable: false }
  ];

  const handleDataChangeSupplier = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    suppliers.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteSupplier(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = suppliers.find(s => s.id === newItem.id);
      if (oldItem) {
        const updates: Partial<Supplier> = {};
        if (newItem.name !== oldItem.name) updates.name = newItem.name;
        if (newItem.contact !== oldItem.contact) updates.contact = newItem.contact;
        if (newItem.performanceIndex !== oldItem.performanceIndex) updates.performanceIndex = Number(newItem.performanceIndex) || 0;
        if (newItem.tier !== oldItem.tier) updates.tier = newItem.tier as any;

        if (Object.keys(updates).length > 0) {
          updateSupplier(newItem.id, updates);
        }
      }
    });
  };

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [alertFilter, setAlertFilter] = useState('ALL');

  // Input states for Add Material Modal
  const [showAddMat, setShowAddMat] = useState(false);
  const [newMat, setNewMat] = useState<Omit<Material, 'id'>>({
    name: '',
    category: 'Fabric',
    supplierId: '',
    unit: 'meters',
    baseQty: 100,
    costPerUnit: 12.00,
    minStock: 200,
    notes: ''
  });

  // Input states for Add PO Modal
  const [showAddPO, setShowAddPO] = useState(false);
  const [newPO, setNewPO] = useState<Omit<PurchaseOrder, 'id'>>({
    supplierId: suppliers[0]?.id || '',
    materialId: computedMaterials[0]?.id || '',
    qty: 500,
    unitCost: computedMaterials[0]?.costPerUnit || 10,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft'
  });

  // Input states for Add Supplier
  const [showAddSup, setShowAddSup] = useState(false);
  const [newSup, setNewSup] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contact: '',
    performanceIndex: 90,
    tier: 'Preferred'
  });

  // Category list
  const categories = [
    'Fabric', 'Rib', 'Packaging', 'Label', 'Polybag', 'Hangtag', 'Sticker', 
    'Zipper', 'Button', 'Mesh', 'Foam', 'Hardware', 'Printing', 'Embroidery', 'Accessories'
  ];

  // --- FILTERS & SORTING ---
  const filteredMaterials = useMemo(() => {
    return computedMaterials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchAlert = alertFilter === 'ALL' || 
        (alertFilter === 'LOW' && m.stockStatus === 'LOW_STOCK') ||
        (alertFilter === 'HEALTHY' && m.stockStatus === 'SURPLUS');
      return matchSearch && matchCat && matchAlert;
    });
  }, [computedMaterials, searchQuery, categoryFilter, alertFilter]);

  const filteredPurchaseOrders = useMemo(() => {
    return computedPurchaseOrders.filter(po => {
      const sup = suppliers.find(s => s.id === po.supplierId);
      const mat = computedMaterials.find(m => m.id === po.materialId);
      const source = `${po.id} ${sup?.name || ''} ${mat?.name || ''}`.toLowerCase();
      return source.includes(searchQuery.toLowerCase());
    });
  }, [computedPurchaseOrders, searchQuery, suppliers, computedMaterials]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.contact.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [suppliers, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
        <div>
          <span className="text-xs font-mono tracking-widest" style={{color:accentHex}}>{t('mat_page_label')}</span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">{t('mat_page_title')}</h2>
        </div>

        {/* Action Button depending on Active Tab */}
        <div className="flex gap-2">
          {activeTab === 'library' && (
            <button 
              onClick={() => setShowAddMat(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('mat_btn_add_material')}
            </button>
          )}
          {activeTab === 'purchase' && (
            <button 
              onClick={() => {
                if(computedMaterials.length > 0) {
                  setNewPO(prev => ({
                    ...prev,
                    materialId: computedMaterials[0].id,
                    unitCost: computedMaterials[0].costPerUnit
                  }));
                }
                setShowAddPO(true);
              }}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('mat_btn_add_po')}
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button 
              onClick={() => setShowAddSup(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('mat_btn_add_supplier')}
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs Selector */}
      <div className="flex border-b border-[var(--color-border-line)] gap-6 text-sm">
        <button 
          onClick={() => { setActiveTab('library'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'library' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'library' && <motion.div layoutId="mat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('mat_tab_library')} [{computedMaterials.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('purchase'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'purchase' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'purchase' && <motion.div layoutId="mat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('mat_tab_purchase')} [{computedPurchaseOrders.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'suppliers' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'suppliers' && <motion.div layoutId="mat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('mat_tab_suppliers')} [{suppliers.length}]
        </button>
      </div>

      {/* SEARCH AND FILTER CODES */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--color-background)]/40 border border-white/[0.03] p-4 rounded-lg">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder={activeTab === 'library' ? "Lock on Material ID, Name..." : activeTab === 'purchase' ? "Search PO orders, suppliers..." : "Search supplier names, contacts..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-card-bg)]/60 border border-white/[0.05] focus:border-white/[0.15] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] rounded text-xs font-mono transition-colors"
          />
        </div>

        {/* Extra Filters for Material Library */}
        {activeTab === 'library' && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)]">CATEGORY:</span>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[var(--color-card-bg)] border border-white/[0.05] text-[var(--color-text-main)] text-xs font-mono py-1 px-3 rounded"
              >
                <option value="ALL">ALL CATEGORIES</option>
                {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)]">STOCK:</span>
              <select 
                value={alertFilter} 
                onChange={(e) => setAlertFilter(e.target.value)}
                className="bg-[var(--color-card-bg)] border border-white/[0.05] text-[var(--color-text-main)] text-xs font-mono py-1 px-3 rounded"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="LOW">LOW STOCK WARNING</option>
                <option value="HEALTHY">SURPLUS</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB SUB-VIEWS */}

      {/* --- TAB 1: MATERIAL LIBRARY TABLE --- */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="materials_library"
            title="Materials Stock Swatches"
            columns={columnsLib}
            data={filteredMaterials}
            onDataChange={handleDataChangeLib}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- TAB 2: PURCHASE ORDERS VIEW --- */}
      {activeTab === 'purchase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SmartTable 
              tableId="materials_purchase"
              title="Purchase Orders"
              columns={columnsPO}
              data={filteredPurchaseOrders}
              onDataChange={handleDataChangePO}
              allowAddColumn={true}
              allowAddRow={true}
              allowImport={true}
              allowExport={true}
              frozenColumns={1}
            />
          </div>

          {/* Sourcing Action Dashboard side widget */}
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <h4 className="text-sm font-display uppercase tracking-widest text-[var(--color-accent-highlight)] font-medium flex items-center gap-1.5 border-b border-white/[0.05] pb-3">
              <Truck size={16} /> Relational Sync Ledger
            </h4>
            <div className="space-y-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              <p>
                {t('mat_sync_desc1')}
              </p>
              <div className="p-3 bg-[var(--color-background)] border border-white/[0.03] space-y-2.5 rounded">
                <div className="flex gap-2 items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] mt-1.5"></span>
                  <span>Transition an order to <strong className="text-emerald-400">Received</strong>: Raw stock catalog numbers immediately increment.</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] mt-1.5"></span>
                  <span>Calculates actual material values and re-indexes HPP curves.</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.03] text-[10px] font-mono text-[var(--color-text-muted)] space-y-1">
                <div>{t('mat_outstanding')}</div>
                <div className="text-sm text-[var(--color-text-main)] font-medium font-mono mt-1">
                  {formatMoney(computedPurchaseOrders
                    .filter(po => po.status === 'Sent' || po.status === 'Draft')
                    .reduce((sum, po) => sum + po.totalCost, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SUPPLIERS LIST --- */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="materials_suppliers"
            title="Suppliers"
            columns={columnsSupplier}
            data={filteredSuppliers}
            onDataChange={handleDataChangeSupplier}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- CREATE NEW DIALOG MODALS --- */}

      {/* 1. Add Material Slideover Modal overlay */}
      {showAddMat && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-white/[0.05] pb-3">{t('mat_modal_add_material')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="col-span-2 space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_name')}</label>
                <input 
                  type="text" 
                  value={newMat.name} 
                  placeholder="e.g. Cobalt Nylon Ripstop"
                  onChange={(e) => setNewMat({...newMat, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_category')}</label>
                <select 
                  value={newMat.category} 
                  onChange={(e) => setNewMat({...newMat, category: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_supplier')}</label>
                <select 
                  value={newMat.supplierId} 
                  onChange={(e) => setNewMat({...newMat, supplierId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="">Direct Import</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_unit')}</label>
                <input 
                  type="text" 
                  value={newMat.unit} 
                  placeholder="e.g. meters"
                  onChange={(e) => setNewMat({...newMat, unit: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_base_qty')}</label>
                <input 
                  type="number" 
                  value={newMat.baseQty === 0 ? '' : newMat.baseQty} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewMat({...newMat, baseQty: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_cost_per_unit')} ({currencySymbol})</label>
                <CurrencyInput
                  value={newMat.costPerUnit}
                  onChange={(val) => setNewMat({...newMat, costPerUnit: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_min_stock')}</label>
                <input 
                  type="number" 
                  value={newMat.minStock === 0 ? '' : newMat.minStock} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewMat({...newMat, minStock: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_notes')}</label>
                <textarea 
                  value={newMat.notes} 
                  placeholder="Seam qualities, wash ratios, color matching rules..."
                  onChange={(e) => setNewMat({...newMat, notes: e.target.value})}
                  className="w-full h-16 p-3 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="col-span-2">
                <ImageUploader 
                  currentImage={newMat.image} 
                  onUpload={(b64) => setNewMat({...newMat, image: b64})} 
                  label={t('mat_lbl_swatch')}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddMat(false)}
                className="px-4 py-2 border border-white/[0.03] hover:bg-white/[0.02] text-[var(--color-text-muted)] hover:text-white transition-colors rounded uppercase"
              >
                {t('btn_cancel')}
              </button>
              <button 
                onClick={() => {
                  if(!newMat.name) return toast.error('Name required.');
                  addMaterial(newMat);
                  setShowAddMat(false);
                }}
                className="px-4 py-2 bg-[#d4af37] text-[var(--color-text-main)] font-semibold hover:bg-[#b08e23] transition-colors rounded uppercase"
              >
                {t('mat_btn_catalog')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add PO Slideover Modal */}
      {showAddPO && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-white/[0.05] pb-3">{t('mat_modal_add_po')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_target_material')}</label>
                <select 
                  value={newPO.materialId} 
                  onChange={(e) => {
                    const backingMat = computedMaterials.find(m => m.id === e.target.value);
                    setNewPO({
                      ...newPO, 
                      materialId: e.target.value,
                      unitCost: backingMat ? backingMat.costPerUnit : 10
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {computedMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.name} ({formatMoney(m.costPerUnit)}/{m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_vendor')}</label>
                <select 
                  value={newPO.supplierId} 
                  onChange={(e) => setNewPO({...newPO, supplierId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_volume')}</label>
                <input 
                  type="number" 
                  value={newPO.qty === 0 ? '' : newPO.qty} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewPO({...newPO, qty: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_po_date')}</label>
                <input 
                  type="date" 
                  value={newPO.date} 
                  onChange={(e) => setNewPO({...newPO, date: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_unit_cost')} ({currencySymbol})</label>
                <CurrencyInput
                  value={newPO.unitCost}
                  onChange={(val) => setNewPO({...newPO, unitCost: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_po_status')}</label>
                <select 
                  value={newPO.status} 
                  onChange={(e) => setNewPO({...newPO, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="Draft">Draft (PO Pending Review)</option>
                  <option value="Sent">Sent (Awaiting Supplier Confirm)</option>
                  <option value="Received">Received (Instantly Adds to Catalog Stock)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddPO(false)}
                className="px-4 py-2 border border-white/[0.03] hover:bg-white/[0.02] text-[var(--color-text-muted)] hover:text-white transition-colors rounded uppercase"
              >
                {t('btn_cancel')}
              </button>
              <button 
                onClick={() => {
                  addPurchaseOrder(newPO);
                  setShowAddPO(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors rounded uppercase"
              >
                {t('mat_btn_dispatch_po')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Supplier Modal */}
      {showAddSup && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-white/[0.05] pb-3">{t('mat_modal_add_supplier')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="col-span-2 space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_sup_name')}</label>
                <input 
                  type="text" 
                  value={newSup.name} 
                  placeholder="e.g. Asgardian Leathercrafts"
                  onChange={(e) => setNewSup({...newSup, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_sup_contact')}</label>
                <input 
                  type="text" 
                  value={newSup.contact} 
                  placeholder="e.g. contact@asgardian.com"
                  onChange={(e) => setNewSup({...newSup, contact: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_sup_rating')}</label>
                <input 
                  type="number" 
                  value={newSup.performanceIndex === 0 ? '' : newSup.performanceIndex} 
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setNewSup({...newSup, performanceIndex: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('mat_lbl_sup_tier')}</label>
                <select 
                  value={newSup.tier} 
                  onChange={(e) => setNewSup({...newSup, tier: e.target.value as any})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="Preferred">Preferred Vendor</option>
                  <option value="Secondary">Secondary Tier</option>
                  <option value="Backup">Emergency Backup Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddSup(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors rounded uppercase"
              >
                {t('btn_cancel')}
              </button>
              <button 
                onClick={() => {
                  if(!newSup.name) return toast.error('Supplier name required.');
                  addSupplier(newSup);
                  setShowAddSup(false);
                }}
                className="px-4 py-2 bg-[#d4af37] text-[var(--color-text-main)] font-semibold hover:bg-[#b08e23] transition-colors rounded uppercase"
              >
                {t('mat_btn_affiliate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
