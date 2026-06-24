import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useERP }       from '../../app/store/ERPContext';
import { useBusiness }  from '../../app/store/BusinessContext';
import { productBlackboxRepo    } from '../../repositories/productBlackbox.repository';
import { productBlackboxService } from '../../services/productBlackbox.service';
import type {
  BlackboxOverview, ProductBatch, ProductJournalEntry,
  ProductDescription, ProductAsset, AssetType, ProductStatus,
  PricingHistoryEntry,
} from '../../types/product-blackbox.types';
import ProductHeader         from './ProductHeader';
import OverviewTab           from './tabs/OverviewTab';
import AssetsTab             from './tabs/AssetsTab';
import DescriptionTab        from './tabs/DescriptionTab';
import MaterialsTab          from './tabs/MaterialsTab';
import ProductionTab         from './tabs/ProductionTab';
import InventoryTab          from './tabs/InventoryTab';
import PricingHistoryTab     from './tabs/PricingHistoryTab';
import JournalTab            from './tabs/JournalTab';
import SalesTab              from './tabs/SalesTab';
import AIInsightsTab         from './tabs/AIInsightsTab';

type TabKey = 'overview' | 'assets' | 'description' | 'materials' | 'production'
            | 'inventory' | 'pricing' | 'journal' | 'sales' | 'ai';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',     label: 'Overview'    },
  { key: 'assets',       label: 'Assets'      },
  { key: 'description',  label: 'Description' },
  { key: 'materials',    label: 'Materials'   },
  { key: 'production',   label: 'Production'  },
  { key: 'inventory',    label: 'Inventory'   },
  { key: 'pricing',      label: 'Pricing'     },
  { key: 'journal',      label: 'Journal'     },
  { key: 'sales',        label: 'Sales'       },
  { key: 'ai',           label: 'AI Insights' },
];

interface TabData {
  assets?:      ProductAsset[];
  description?: ProductDescription | null;
  batches?:     ProductBatch[];
  journals?:    ProductJournalEntry[];
  pricing?:     PricingHistoryEntry[];
  tags?:        string[];
}

export default function ProductBlackboxView() {
  const { productId }           = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate                = useNavigate();
  const { config: erpConfig, products, materials, sales, variants: sizeVariants, production, updateProduct } = useERP();
  const { activeBusiness }      = useBusiness();

  const accent   = erpConfig?.customAccentColor ?? '#7c3aed';
  const currency = erpConfig?.currencySymbol    ?? 'Rp';
  const companyId = activeBusiness?.id ?? 'default';

  const initialTab = (searchParams.get('tab') ?? 'overview') as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [overview,  setOverview]  = useState<BlackboxOverview | null>(null);
  const [tabData,   setTabData]   = useState<TabData>({});
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const loadedTabs = useRef<Set<TabKey>>(new Set(['overview']));

  const product = products.find(p => p.id === productId);
  const productSizeVariants = sizeVariants.filter(v => v.productId === productId);
  const productStock = productSizeVariants.reduce((s, v) => s + v.currentStock, 0);

  const switchTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // Load overview on mount
  useEffect(() => {
    if (!product || !productId) return;
    setLoading(true);
    productBlackboxService.getOverview(companyId, product, sales, productStock)
      .then(ov => { setOverview(ov); productBlackboxService.ensureCreatedEvent(companyId, product); })
      .finally(() => setLoading(false));
  }, [productId, companyId]);

  // Lazy load tab data
  useEffect(() => {
    if (!productId || loadedTabs.current.has(activeTab)) return;
    loadedTabs.current.add(activeTab);
    const load = async () => {
      if (activeTab === 'assets') {
        const assets = await productBlackboxRepo.getAssets(companyId, productId);
        setTabData(d => ({ ...d, assets }));
      } else if (activeTab === 'description') {
        const description = await productBlackboxRepo.getDescription(companyId, productId);
        setTabData(d => ({ ...d, description }));
      } else if (activeTab === 'production') {
        const batches = await productBlackboxRepo.getBatches(companyId, productId);
        setTabData(d => ({ ...d, batches }));
      } else if (activeTab === 'journal') {
        const journals = await productBlackboxRepo.getJournalEntries(companyId, productId);
        setTabData(d => ({ ...d, journals }));
      } else if (activeTab === 'pricing') {
        const pricing = await productBlackboxRepo.getPricingHistory(companyId, productId);
        setTabData(d => ({ ...d, pricing }));
      }
    };
    load();
  }, [activeTab, productId, companyId]);

  if (!product) {
    return (
      <div className="text-center py-20 text-sm font-mono text-[var(--color-text-muted)]">
        Produk tidak ditemukan. <button onClick={() => navigate('/app/products')} className="underline cursor-pointer">Kembali ke daftar</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-2xl"/>
        <div className="h-10 bg-white/5 rounded-xl"/>
        <div className="h-64 bg-white/5 rounded-2xl"/>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus: ProductStatus) => {
    const oldStatus = (product.status ?? 'active') as string;
    await productBlackboxService.changeStatus(companyId, product.id, oldStatus, newStatus);
    updateProduct(product.id, { status: newStatus as any });
  };

  const handleAddBatch = async (data: Omit<ProductBatch, 'id' | 'createdAt'>) => {
    const filled = { ...data, productId: product.id, companyId };
    const batch  = await productBlackboxService.addProductionBatch(companyId, product.id, filled);
    if (batch) {
      setTabData(d => ({ ...d, batches: [batch, ...(d.batches ?? [])] }));
      if (overview) setOverview({ ...overview, currentBatch: batch });
      updateProduct(product.id, {}); // force recompute
    }
  };

  const handlePriceChange = async (newPrice: number, newHpp: number | null, reason: string) => {
    await productBlackboxService.updateProductPrice(companyId, product, newPrice, newHpp, reason);
    updateProduct(product.id, { sellingPrice: newPrice });
    const pricing = await productBlackboxRepo.getPricingHistory(companyId, product.id);
    setTabData(d => ({ ...d, pricing }));
  };

  const handleNewJournal = async (data: { title: string; content: string; tags: string[] }) => {
    const entry = await productBlackboxService.createJournalWithTimeline(companyId, product.id, {
      ...data, productId: product.id, companyId, imageUrls: [],
    });
    if (entry) setTabData(d => ({ ...d, journals: [entry, ...(d.journals ?? [])] }));
  };

  const handleEditJournal = async (id: string, data: Partial<ProductJournalEntry>) => {
    const updated = await productBlackboxRepo.updateJournalEntry(companyId, id, data);
    if (updated) setTabData(d => ({
      ...d,
      journals: (d.journals ?? []).map(j => j.id === id ? { ...j, ...updated } : j),
    }));
  };

  const handleUploadAsset = async (file: File, type: AssetType) => {
    setUploading(true);
    try {
      const asset = await productBlackboxService.uploadAsset(companyId, product.id, file, type);
      if (asset) setTabData(d => ({ ...d, assets: [...(d.assets ?? []), asset] }));
    } finally { setUploading(false); }
  };

  const handleDeleteAsset = async (assetId: string) => {
    await productBlackboxRepo.deleteAsset(companyId, assetId);
    setTabData(d => ({ ...d, assets: (d.assets ?? []).filter(a => a.id !== assetId) }));
  };

  const handleReorderAssets = async (orderedIds: string[]) => {
    await productBlackboxRepo.reorderAssets(companyId, orderedIds);
    setTabData(d => ({
      ...d,
      assets: orderedIds.map(id => (d.assets ?? []).find(a => a.id === id)!).filter(Boolean),
    }));
  };

  const handleSaveDescription = async (data: Partial<ProductDescription>) => {
    const saved = await productBlackboxRepo.upsertDescription(companyId, product.id, data);
    if (saved) setTabData(d => ({ ...d, description: saved }));
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <ProductHeader
        product={product}
        currentBatch={overview?.currentBatch ?? null}
        totalStock={overview?.totalStock ?? productStock}
        currency={currency}
        accent={accent}
        onBack={() => navigate('/app/products')}
        onStatusChange={handleStatusChange}
      />

      {/* Tabs */}
      <div className="border-b border-[var(--color-border-line)] overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => switchTab(key)}
              className={`px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest border-b-2 -mb-px transition-all cursor-pointer whitespace-nowrap ${
                activeTab === key
                  ? 'font-bold border-current'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
              style={activeTab === key ? { color: accent, borderColor: accent } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && overview && (
          <OverviewTab overview={overview} sales={sales} currency={currency} accent={accent}/>
        )}
        {activeTab === 'assets' && (
          <AssetsTab
            assets={tabData.assets ?? []}
            uploading={uploading}
            accent={accent}
            onUpload={handleUploadAsset}
            onDelete={handleDeleteAsset}
            onReorder={handleReorderAssets}
          />
        )}
        {activeTab === 'description' && (
          <DescriptionTab
            description={tabData.description ?? null}
            accent={accent}
            onSave={handleSaveDescription}
          />
        )}
        {activeTab === 'materials' && (
          <MaterialsTab
            productId={product.id}
            materials={materials}
            productHPP={overview?.currentBatch?.hpp ?? 0}
            currency={currency}
            accent={accent}
          />
        )}
        {activeTab === 'production' && (
          <ProductionTab
            productId={product.id}
            batches={tabData.batches ?? overview?.currentBatch ? [overview!.currentBatch!, ...(tabData.batches ?? []).slice(1)] : tabData.batches ?? []}
            currency={currency}
            accent={accent}
            onAddBatch={handleAddBatch}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab
            productId={product.id}
            variants={overview?.variants ?? []}
            sizeVariants={sizeVariants}
            sales={sales}
            production={production}
            currency={currency}
            accent={accent}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingHistoryTab
            product={product}
            history={tabData.pricing ?? []}
            currency={currency}
            accent={accent}
            onPriceChange={handlePriceChange}
          />
        )}
        {activeTab === 'journal' && (
          <JournalTab
            entries={tabData.journals ?? overview?.recentJournalEntries ?? []}
            accent={accent}
            onNewEntry={handleNewJournal}
            onEditEntry={handleEditJournal}
          />
        )}
        {activeTab === 'sales' && (
          <SalesTab productId={product.id} sales={sales} currency={currency} accent={accent}/>
        )}
        {activeTab === 'ai' && overview && (
          <AIInsightsTab
            overview={overview}
            sales={sales}
            companyId={companyId}
            currency={currency}
            accent={accent}
          />
        )}
      </div>
    </div>
  );
}
