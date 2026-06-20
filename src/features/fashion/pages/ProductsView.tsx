import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { SampleDevelopment, ProductionBatch, MasterProduct, SizeVariantInventory } from '../types';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Hammer, 
  Shirt, 
  Layers, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Layers3, 
  Database,
  Tag,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';
import CurrencyInput from '../../../shared/components/CurrencyInput';

interface ProductsViewProps {
  key?: string;
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
    formatMoney, t
  } = useERP();
  const accentHex = config?.customAccentColor || '#d4af37';

  const [activeTab, setActiveTab] = useState<'sample' | 'production' | 'master' | 'variants'>(initialSubTab);

  const isIdLng = config?.language === 'id';
  const currencySymbol = config?.currencySymbol || 'Rp';

  const columnsMaster: ColumnDef[] = [
    { key: 'id', label: 'Product ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Produk' : 'Product Name', isEditable: true, type: 'text' },
    { key: 'collection', label: isIdLng ? 'Koleksi' : 'Collection', isEditable: true, type: 'text' },
    { key: 'category', label: isIdLng ? 'Kategori' : 'Category', isEditable: true, type: 'text' },
    { key: 'sellingPrice', label: isIdLng ? 'Harga Jual' : 'Selling Price', isEditable: true, type: 'currency', align: 'right' },
    { key: 'productionCost', label: isIdLng ? 'Biaya Produksi' : 'Production Cost', type: 'currency', align: 'right', isEditable: false },
    { key: 'operationalCost', label: isIdLng ? 'Alokasi Ops' : 'Operational Cost', type: 'currency', align: 'right', isEditable: false },
    { key: 'adsAllocation', label: isIdLng ? 'Alokasi Iklan' : 'Ads Allocation', type: 'currency', align: 'right', isEditable: false },
    { key: 'kolAllocation', label: isIdLng ? 'Alokasi KOL' : 'KOL Allocation', type: 'currency', align: 'right', isEditable: false },
    { key: 'finalHPP', label: 'Final HPP', type: 'formula', formulaExpr: "{productionCost} + {operationalCost} + {adsAllocation} + {kolAllocation}", align: 'right', isEditable: false },
    { key: 'grossProfit', label: isIdLng ? 'Laba Kotor' : 'Gross Profit', type: 'formula', formulaExpr: "{sellingPrice} - {productionCost}", align: 'right', isEditable: false },
    { key: 'netProfit', label: isIdLng ? 'Laba Bersih' : 'Net Profit', type: 'formula', formulaExpr: "{sellingPrice} - {finalHPP}", align: 'right', isEditable: false },
    { key: 'marginPercentage', label: 'Margin %', type: 'formula', formulaExpr: "round(({netProfit} / {sellingPrice}) * 100)", align: 'right', isEditable: false },
    { key: 'status', label: 'Status', isEditable: true, type: 'status', selectOptions: ['Active', 'Archived'], align: 'center' },
    { key: 'aiAlignment', label: 'AI Trend Alignment 🔮', type: 'aiSummary', width: 220, isEditable: false }
  ];

  const handleDataChangeMaster = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    products.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteProduct(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedProducts.find(p => p.id === newItem.id);
      if (oldItem) {
        const updates: Partial<MasterProduct> = {};
        if (newItem.name !== oldItem.name) updates.name = newItem.name;
        if (newItem.collection !== oldItem.collection) updates.collection = newItem.collection;
        if (newItem.category !== oldItem.category) updates.category = newItem.category;
        if (newItem.sellingPrice !== oldItem.sellingPrice) updates.sellingPrice = Number(newItem.sellingPrice) || 0;
        if (newItem.status !== oldItem.status) updates.status = newItem.status as 'Active' | 'Archived';

        if (Object.keys(updates).length > 0) {
          updateProduct(newItem.id, updates);
        }
      }
    });
  };

  const columnsSample: ColumnDef[] = [
    { key: 'id', label: 'Sample ID', type: 'text', isEditable: false },
    { key: 'productName', label: isIdLng ? 'Produk Terkait' : 'Product Link', isEditable: true, type: 'text' },
    { key: 'version', label: isIdLng ? 'Versi Pola' : 'Pattern Version', isEditable: true, type: 'text' },
    { key: 'materialId', label: isIdLng ? 'Serat Kain ID' : 'Fibre ID', isEditable: true, type: 'text' },
    { key: 'usageQty', label: isIdLng ? 'Penggunaan (m)' : 'Usage (MT)', isEditable: true, type: 'number', align: 'right' },
    { key: 'wastePercentage', label: isIdLng ? 'Porsi Buang %' : 'Waste Margin %', isEditable: true, type: 'percentage', align: 'right' },
    { key: 'finalUsageQty', label: isIdLng ? 'Sisa Bersih (m)' : 'Final Usage', type: 'formula', formulaExpr: "{usageQty} * (1 - {wastePercentage})", align: 'right', isEditable: false },
    { key: 'materialCost', label: isIdLng ? 'Biaya Bahan' : 'Material Cost', type: 'currency', align: 'right', isEditable: false },
    { key: 'laborCost', label: isIdLng ? 'Upah Jahit' : 'Labor Charge', isEditable: true, type: 'currency', align: 'right' },
    { key: 'sampleTotalCost', label: isIdLng ? 'Biaya Prototipe' : 'Prototype Cost', type: 'formula', formulaExpr: "{materialCost} + {laborCost}", align: 'right', isEditable: false },
    { key: 'status', label: 'Status Approved', isEditable: true, type: 'status', selectOptions: ['Design', 'Sampling', 'Approved', 'Rejected'], align: 'center' },
    { key: 'createdDate', label: isIdLng ? 'Tanggal Log' : 'Date Logged', type: 'date', isEditable: false }
  ];

  const handleDataChangeSample = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedSamples.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteSample(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedSamples.find(s => s.id === newItem.id);
      if (oldItem) {
        const updates: Partial<SampleDevelopment> = {};
        if (newItem.productName !== oldItem.productName) updates.productName = newItem.productName;
        if (newItem.version !== oldItem.version) updates.version = newItem.version;
        if (newItem.materialId !== oldItem.materialId) updates.materialId = newItem.materialId;
        if (newItem.laborCost !== oldItem.laborCost) updates.laborCost = Number(newItem.laborCost) || 0;
        if (newItem.usageQty !== oldItem.usageQty) updates.usageQty = Number(newItem.usageQty) || 0;
        if (newItem.wastePercentage !== oldItem.wastePercentage) updates.wastePercentage = Number(newItem.wastePercentage) || 0;
        if (newItem.status !== oldItem.status) updates.status = newItem.status as any;

        if (Object.keys(updates).length > 0) {
          updateSample(newItem.id, updates);
        }
      }
    });
  };

  const columnsProduction: ColumnDef[] = [
    { key: 'id', label: 'Batch ID', type: 'text', isEditable: false },
    { key: 'productName', label: isIdLng ? 'Produk Terkait' : 'Product Link', isEditable: true, type: 'text' },
    { key: 'factory', label: isIdLng ? 'Mitra Pabrik' : 'Factory', isEditable: true, type: 'text' },
    { key: 'qty', label: isIdLng ? 'Porsi Produksi' : 'Production Qty', isEditable: true, type: 'number', align: 'right' },
    { key: 'materialId', label: isIdLng ? 'Bahan Baku ID' : 'Material ID', isEditable: true, type: 'text' },
    { key: 'usagePerPcs', label: isIdLng ? 'Bahan/PCS' : 'Usage/PCS', isEditable: true, type: 'number', align: 'right' },
    { key: 'totalUsageQty', label: isIdLng ? 'Total Volume' : 'Allocated Volume', type: 'formula', formulaExpr: "{qty} * {usagePerPcs}", align: 'right', isEditable: false },
    { key: 'materialCost', label: isIdLng ? 'Biaya Bahan' : 'Material Cost', type: 'currency', align: 'right', isEditable: false },
    { key: 'laborCost', label: isIdLng ? 'Upah Jahit' : 'Labor Cost', isEditable: true, type: 'currency', align: 'right' },
    { key: 'packagingCost', label: isIdLng ? 'Kemasan' : 'Packaging Cost', isEditable: true, type: 'currency', align: 'right' },
    { key: 'totalProductionCost', label: isIdLng ? 'Total Biaya' : 'Total Cost', type: 'formula', formulaExpr: "{materialCost} + ({laborCost} + {packagingCost}) * {qty}", align: 'right', isEditable: false },
    { key: 'unitCost', label: isIdLng ? 'Biaya Per Satuan' : 'Unit Cost', type: 'formula', formulaExpr: "{totalProductionCost} / {qty}", align: 'right', isEditable: false },
    { key: 'qcStatus', label: 'QC Status', isEditable: true, type: 'status', selectOptions: ['Pending', 'Passed', 'Failed'], align: 'center' },
    { key: 'productionStatus', label: 'Status', isEditable: true, type: 'priority', selectOptions: ['Scheduled', 'In Progress', 'Completed', 'Delayed'], align: 'center' }
  ];

  const handleDataChangeProduction = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedProduction.forEach(oldItem => {
      if (!newDataIds.has(oldItem.id)) {
        deleteProduction(oldItem.id);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedProduction.find(p => p.id === newItem.id);
      if (oldItem) {
        const updates: Partial<ProductionBatch> = {};
        if (newItem.productName !== oldItem.productName) updates.productName = newItem.productName;
        if (newItem.factory !== oldItem.factory) updates.factory = newItem.factory;
        if (newItem.qty !== oldItem.qty) updates.qty = Number(newItem.qty) || 0;
        if (newItem.materialId !== oldItem.materialId) updates.materialId = newItem.materialId;
        if (newItem.usagePerPcs !== oldItem.usagePerPcs) updates.usagePerPcs = Number(newItem.usagePerPcs) || 0;
        if (newItem.laborCost !== oldItem.laborCost) updates.laborCost = Number(newItem.laborCost) || 0;
        if (newItem.packagingCost !== oldItem.packagingCost) updates.packagingCost = Number(newItem.packagingCost) || 0;
        if (newItem.qcStatus !== oldItem.qcStatus) updates.qcStatus = newItem.qcStatus as any;
        if (newItem.productionStatus !== oldItem.productionStatus) updates.productionStatus = newItem.productionStatus as any;

        if (Object.keys(updates).length > 0) {
          updateProduction(newItem.id, updates);
        }
      }
    });
  };

  const columnsVariant: ColumnDef[] = [
    { key: 'id', label: 'Variant SKU', type: 'text', isEditable: false },
    { key: 'productId', label: isIdLng ? 'Product ID Link' : 'Product ID Link', isEditable: true, type: 'text' },
    { key: 'productName', label: isIdLng ? 'Nama Produk' : 'Product Name', isEditable: true, type: 'text' },
    { key: 'color', label: isIdLng ? 'Warna' : 'Color', isEditable: true, type: 'text' },
    { key: 'size', label: isIdLng ? 'Ukuran' : 'Size', isEditable: true, type: 'text' },
    { key: 'currentStock', label: isIdLng ? 'Stok Awal' : 'Initial Stock', isEditable: true, type: 'number', align: 'right' },
    { key: 'soldQty', label: isIdLng ? 'Terjual' : 'Sold Quantity', isEditable: true, type: 'number', align: 'right' },
    { key: 'remainingStock', label: isIdLng ? 'Sisa Stok' : 'Remaining Stock', type: 'formula', formulaExpr: "{currentStock} - {soldQty}", align: 'right', isEditable: false },
    { key: 'minStock', label: isIdLng ? 'Batas Minimum' : 'Min Threshold', isEditable: true, type: 'number', align: 'right' },
    { key: 'status', label: 'Inventory Status', type: 'priority', align: 'center', isEditable: false }
  ];

  const handleDataChangeVariant = (newData: Record<string, any>[]) => {
    // Deletion detection
    const newDataIds = new Set(newData.map(item => item.id));
    computedVariants.forEach(oldItem => {
      if (!newDataIds.has(oldItem.sku)) {
        deleteVariant(oldItem.sku);
      }
    });

    newData.forEach(newItem => {
      const oldItem = computedVariants.find(v => v.sku === newItem.id);
      if (oldItem) {
        const updates: Partial<SizeVariantInventory> = {};
        if (newItem.productId !== oldItem.productId) updates.productId = newItem.productId;
        if (newItem.productName !== oldItem.productName) updates.productName = newItem.productName;
        if (newItem.color !== oldItem.color) updates.color = newItem.color;
        if (newItem.size !== oldItem.size) updates.size = newItem.size;
        if (newItem.currentStock !== oldItem.currentStock) updates.currentStock = Number(newItem.currentStock) || 0;
        if (newItem.minStock !== oldItem.minStock) updates.minStock = Number(newItem.minStock) || 0;

        if (Object.keys(updates).length > 0) {
          updateVariant(newItem.id, updates);
        }
      }
    });
  };

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('ALL');

  // Input states for Add Product Modal (Master)
  const [showAddProd, setShowAddProd] = useState(false);
  const [newProd, setNewProd] = useState<Omit<MasterProduct, 'id'>>({
    name: '',
    collection: 'NEBULAE-26',
    category: 'Outerwear',
    sellingPrice: 195.00,
    status: 'Active'
  });

  // Input states for Add Sample Modal
  const [showAddSample, setShowAddSample] = useState(false);
  const [newSample, setNewSample] = useState<Omit<SampleDevelopment, 'id'>>({
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    version: 'v1.0',
    materialId: computedMaterials[0]?.id || '',
    usageQty: 2.0,
    wastePercentage: 0.10,
    laborCost: 40.00,
    status: 'Sampling',
    createdDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Input states for Add Production Batch
  const [showAddProdBatch, setShowAddProdBatch] = useState(false);
  const [newProdBatch, setNewProdBatch] = useState<Omit<ProductionBatch, 'id'>>({
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    factory: 'Saitama Craft Lab',
    qty: 100,
    materialId: computedMaterials[0]?.id || '',
    usagePerPcs: 1.5,
    laborCost: 15.00,
    packagingCost: 3.00,
    qcStatus: 'Pending',
    productionStatus: 'In Progress',
    productionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Input states for Add Size Variant SKU
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState<SizeVariantInventory>({
    sku: '',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    color: 'Obsidian Black',
    size: 'M',
    currentStock: 100,
    minStock: 20
  });

  // Distinct Collections
  const collections = useMemo(() => {
    return Array.from(new Set(products.map(p => p.collection)));
  }, [products]);

  // Filters
  const filteredProducts = useMemo(() => {
    return computedProducts.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchColl = collectionFilter === 'ALL' || p.collection === collectionFilter;
      return matchSearch && matchColl;
    });
  }, [computedProducts, searchQuery, collectionFilter]);

  const filteredSamples = useMemo(() => {
    return computedSamples.filter(s => {
      return s.productName.toLowerCase().includes(searchQuery.toLowerCase()) || s.version.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedSamples, searchQuery]);

  const filteredProduction = useMemo(() => {
    return computedProduction.filter(p => {
      return p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedProduction, searchQuery]);

  const filteredVariants = useMemo(() => {
    return computedVariants.filter(v => {
      return v.productName.toLowerCase().includes(searchQuery.toLowerCase()) || v.sku.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [computedVariants, searchQuery]);

  const mappedVariants = useMemo(() => {
    return filteredVariants.map(v => ({
      ...v,
      id: v.sku
    }));
  }, [filteredVariants]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
        <div>
          <span className="text-xs font-mono tracking-widest" style={{color:accentHex}}>{t('prod_page_label')}</span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">{t('prod_page_title')}</h2>
        </div>

        {/* Action Button depending on Active Tab */}
        <div className="flex gap-2">
          {activeTab === 'master' && (
            <button 
              onClick={() => setShowAddProd(true)}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('prod_btn_add_product')}
            </button>
          )}
          {activeTab === 'sample' && (
            <button 
              onClick={() => {
                if(products.length > 0 && computedMaterials.length > 0) {
                  setNewSample(prev => ({
                    ...prev,
                    productId: products[0].id,
                    productName: products[0].name,
                    materialId: computedMaterials[0].id
                  }));
                }
                setShowAddSample(true);
              }}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('prod_btn_add_sample')}
            </button>
          )}
          {activeTab === 'production' && (
            <button 
              onClick={() => {
                if(products.length > 0 && computedMaterials.length > 0) {
                  setNewProdBatch(prev => ({
                    ...prev,
                    productId: products[0].id,
                    productName: products[0].name,
                    materialId: computedMaterials[0].id
                  }));
                }
                setShowAddProdBatch(true);
              }}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('prod_btn_add_batch')}
            </button>
          )}
          {activeTab === 'variants' && (
            <button 
              onClick={() => {
                if(products.length > 0) {
                  setNewVariant(prev => ({
                    ...prev,
                    productId: products[0].id,
                    productName: products[0].name
                  }));
                }
                setShowAddVariant(true);
              }}
              className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:bg-[var(--color-background)] transition-colors rounded text-xs uppercase font-mono tracking-wider flex items-center gap-1.5 font-semibold"
            >
              <Plus size={14} /> {t('prod_btn_add_variant')}
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs Selector */}
      <div className="flex border-b border-white/[0.05] gap-6 text-sm">
        <button 
          onClick={() => { setActiveTab('master'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'master' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'master' && <motion.div layoutId="prod-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('prod_tab_products')} [{computedProducts.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('sample'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'sample' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'sample' && <motion.div layoutId="prod-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('prod_tab_samples')} [{computedSamples.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('production'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'production' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'production' && <motion.div layoutId="prod-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('prod_tab_production')} [{computedProduction.length}]
        </button>
        <button 
          onClick={() => { setActiveTab('variants'); setSearchQuery(''); }}
          className={`pb-3 font-mono tracking-wider uppercase text-xs transition-colors relative ${activeTab === 'variants' ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          {activeTab === 'variants' && <motion.div layoutId="prod-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
          {t('prod_tab_variants')} [{computedVariants.length}]
        </button>
      </div>

      {/* SEARCH AND FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--color-background)]/40 border border-white/[0.03] p-4 rounded-lg">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder="Lock on SKU, Product Name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-card-bg)]/60 border border-white/[0.05] focus:border-white/[0.15] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] rounded text-xs font-mono transition-colors"
          />
        </div>

        {activeTab === 'master' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)]">COLLECTION:</span>
            <select 
              value={collectionFilter} 
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="bg-[var(--color-card-bg)] border border-white/[0.05] text-[var(--color-text-main)] text-xs font-mono py-1 px-3 rounded"
            >
              <option value="ALL">ALL COLLECTIONS</option>
              {collections.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* --- TAB 1: MASTER PRODUCTS TABLE & CALCULATIONS --- */}
      {activeTab === 'master' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="products_master"
            title="Master Product Swatches"
            columns={columnsMaster}
            data={filteredProducts}
            onDataChange={handleDataChangeMaster}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- TAB 2: SAMPLE DEVELOPMENT DATABASE --- */}
      {activeTab === 'sample' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="products_sampling"
            title="Sample Prototypes Ledger"
            columns={columnsSample}
            data={filteredSamples}
            onDataChange={handleDataChangeSample}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- TAB 3: PRODUCTION BATCH LIBRARY --- */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="products_production"
            title="Production Pipeline Runs"
            columns={columnsProduction}
            data={filteredProduction}
            onDataChange={handleDataChangeProduction}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- TAB 4: SIZE VARIANT INVENTORY --- */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <SmartTable 
            tableId="products_variants"
            title="Inventory Variations (SKUs)"
            columns={columnsVariant}
            data={mappedVariants}
            onDataChange={handleDataChangeVariant}
            allowAddColumn={true}
            allowAddRow={true}
            allowImport={true}
            allowExport={true}
            frozenColumns={2}
          />
        </div>
      )}

      {/* --- DESIGNER INPUT MODAL DIALOGS --- */}

      {/* 1. Add Master Product */}
      {showAddProd && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('prod_modal_add_product')}</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Product Name</label>
                <input 
                  type="text" 
                  value={newProd.name} 
                  placeholder="e.g. Helix Tactical Cargo"
                  onChange={(e) => setNewProd({...newProd, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] uppercase">Collection</label>
                  <input 
                    type="text" 
                    value={newProd.collection} 
                    onChange={(e) => setNewProd({...newProd, collection: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] uppercase">Category</label>
                  <input 
                    type="text" 
                    value={newProd.category} 
                    onChange={(e) => setNewProd({...newProd, category: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 block">
                <label className="text-[var(--color-text-muted)] uppercase">Target Retail Price ({currencySymbol})</label>
                <CurrencyInput
                  value={newProd.sellingPrice}
                  onChange={(val) => setNewProd({...newProd, sellingPrice: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <ImageUploader 
                  currentImage={newProd.image} 
                  onUpload={(b64) => setNewProd({...newProd, image: b64})} 
                  label="Product Lookbook/Aesthetic Board (Visual)"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddProd(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newProd.name) return toast.error('Name required.');
                  addProduct(newProd);
                  setShowAddProd(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Catalog Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Prototype Sample */}
      {showAddSample && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('prod_modal_add_sample')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Target Product Link</label>
                <select 
                  value={newSample.productId} 
                  onChange={(e) => {
                    const backingP = products.find(p => p.id === e.target.value);
                    setNewSample({
                      ...newSample, 
                      productId: e.target.value,
                      productName: backingP ? backingP.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Pattern Version</label>
                <input 
                  type="text" 
                  value={newSample.version} 
                  onChange={(e) => setNewSample({...newSample, version: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase font-bold text-[var(--color-accent-highlight)]">Required Raw Material Fiber</label>
                <select 
                  value={newSample.materialId} 
                  onChange={(e) => setNewSample({...newSample, materialId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                >
                  {computedMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.name} ({formatMoney(m.costPerUnit)}/{m.unit}) {"["}Remaining: {m.remainingQty}{"]"}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Base Material Needed</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newSample.usageQty === 0 ? '' : newSample.usageQty} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewSample({...newSample, usageQty: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Waste Allowance Margin (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newSample.wastePercentage === 0 ? '' : newSample.wastePercentage} 
                  placeholder="e.g. 0.10 for 10%"
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewSample({...newSample, wastePercentage: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Specific Labor Tech Charge ({currencySymbol})</label>
                <CurrencyInput
                  value={newSample.laborCost}
                  onChange={(val) => setNewSample({...newSample, laborCost: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Status</label>
                <select 
                  value={newSample.status} 
                  onChange={(e) => setNewSample({...newSample, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="Design">Design</option>
                  <option value="Sampling">Sampling</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Development Feedback / Notes</label>
                <textarea 
                  value={newSample.notes} 
                  placeholder="Notes about weave, pockets, layout and feedback during fitting..."
                  onChange={(e) => setNewSample({...newSample, notes: e.target.value})}
                  className="w-full h-16 p-3 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <ImageUploader 
                  currentImage={newSample.image} 
                  onUpload={(b64) => setNewSample({...newSample, image: b64})} 
                  label="Prototype Product Picture/Sketch (Visual)"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddSample(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  addSample(newSample);
                  setShowAddSample(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Queue Prototype
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Production Run */}
      {showAddProdBatch && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('prod_modal_add_batch')}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Target Product</label>
                <select 
                  value={newProdBatch.productId} 
                  onChange={(e) => {
                    const P = products.find(p => p.id === e.target.value);
                    setNewProdBatch({
                      ...newProdBatch, 
                      productId: e.target.value,
                      productName: P ? P.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Factory Facility</label>
                <input 
                  type="text" 
                  value={newProdBatch.factory} 
                  onChange={(e) => setNewProdBatch({...newProdBatch, factory: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Volume Quantity (PCS)</label>
                <input 
                  type="number" 
                  value={newProdBatch.qty === 0 ? '' : newProdBatch.qty} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewProdBatch({...newProdBatch, qty: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Primary Fiber Alloy ID</label>
                <select 
                  value={newProdBatch.materialId} 
                  onChange={(e) => setNewProdBatch({...newProdBatch, materialId: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {computedMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.name} [Available: {m.remainingQty}]</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Required Usage Per Piece (MT)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newProdBatch.usagePerPcs === 0 ? '' : newProdBatch.usagePerPcs} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setNewProdBatch({...newProdBatch, usagePerPcs: isNaN(parsed) ? 0 : parsed});
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase text-[var(--color-text-muted)]">Labor allocation/PCS ({currencySymbol})</label>
                <CurrencyInput
                  value={newProdBatch.laborCost}
                  onChange={(val) => setNewProdBatch({...newProdBatch, laborCost: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>

              <div className="space-y-1 block col-span-2">
                <label className="text-[var(--color-text-muted)] uppercase text-[var(--color-text-muted)]">Packaging Charge/PCS ({currencySymbol})</label>
                <CurrencyInput
                  value={newProdBatch.packagingCost}
                  onChange={(val) => setNewProdBatch({...newProdBatch, packagingCost: val})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddProdBatch(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  addProduction(newProdBatch);
                  setShowAddProdBatch(false);
                }}
                className="px-4 py-2 bg-[#d4af37] text-[var(--color-text-main)] font-semibold hover:bg-[#b08e23] transition-colors uppercase rounded"
              >
                Queue Factory Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add SKU Size Variant */}
      {showAddVariant && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3">{t('prod_modal_add_variant')}</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Reference Product</label>
                <select 
                  value={newVariant.productId} 
                  onChange={(e) => {
                    const P = products.find(p => p.id === e.target.value);
                    setNewVariant({
                      ...newVariant, 
                      productId: e.target.value,
                      productName: P ? P.name : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Hardware SKU ID</label>
                <input 
                  type="text" 
                  value={newVariant.sku} 
                  placeholder="e.g. PROD-001-BLK-M"
                  onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[var(--color-accent-highlight)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] uppercase">Aesthetic Color</label>
                  <input 
                    type="text" 
                    value={newVariant.color} 
                    onChange={(e) => setNewVariant({...newVariant, color: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] uppercase">Fitted Size</label>
                  <input 
                    type="text" 
                    value={newVariant.size} 
                    placeholder="S, M, L, 42..."
                    onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-text-muted)] uppercase">Initial volume Stock</label>
                  <input 
                    type="number" 
                    value={newVariant.currentStock === 0 ? '' : newVariant.currentStock} 
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setNewVariant({...newVariant, currentStock: isNaN(parsed) ? 0 : parsed});
                    }}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-text-muted)] uppercase">Min Safety Limit</label>
                  <input 
                    type="number" 
                    value={newVariant.minStock === 0 ? '' : newVariant.minStock} 
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setNewVariant({...newVariant, minStock: isNaN(parsed) ? 0 : parsed});
                    }}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddVariant(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newVariant.sku) return toast.error('SKU required.');
                  addVariant(newVariant);
                  setShowAddVariant(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Register SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
