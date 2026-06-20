import { getTxEngine } from '../../core/services/TransactionEngine';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useBusiness } from './BusinessContext';
import { getTranslation } from '../../core/utils/translations';
import {
  Material,
  SampleDevelopment,
  ProductionBatch,
  MasterProduct,
  SizeVariantInventory,
  SalesRecord,
  OperationalCost,
  AdsCampaign,
  KolTracking,
  PurchaseOrder,
  Supplier,
  Customer,
  AssetEquipment,
  CashTransaction,
  Notification,
  ERPConfig,
  MoodboardItem
} from '../../core/types';

interface ERPContextType {
  materials: Material[];
  samples: SampleDevelopment[];
  production: ProductionBatch[];
  products: MasterProduct[];
  variants: SizeVariantInventory[];
  sales: SalesRecord[];
  operationalCosts: OperationalCost[];
  adsCampaigns: AdsCampaign[];
  kols: KolTracking[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  customers: Customer[];
  assets: AssetEquipment[];
  cashflow: CashTransaction[];
  notifications: Notification[];
  config: ERPConfig;
  moodboard: MoodboardItem[];

  // Computed relational views
  computedMaterials: Array<Material & {
    purchaseQty: number;
    sampleQty: number;
    productionQty: number;
    totalUsedQty: number;
    remainingQty: number;
    totalValue: number;
    stockStatus: 'LOW_STOCK' | 'SURPLUS';
  }>;

  computedSamples: Array<SampleDevelopment & {
    finalUsageQty: number;
    materialCost: number;
    sampleTotalCost: number;
  }>;

  computedProduction: Array<ProductionBatch & {
    totalUsageQty: number;
    materialCost: number;
    totalProductionCost: number;
    unitCost: number;
  }>;

  computedProducts: Array<MasterProduct & {
    unitsProduced: number;
    unitsSold: number;
    productionCost: number;
    operationalCost: number;
    adsAllocation: number;
    kolAllocation: number;
    finalHPP: number;
    grossProfit: number;
    netProfit: number;
    marginPercentage: number;
  }>;

  computedVariants: Array<SizeVariantInventory & {
    sku: string;
    productName: string;
    soldQty: number;
    remainingStock: number;
    status: 'LOW_STOCK' | 'HEALTHY';
  }>;

  computedSales: Array<SalesRecord & {
    productName: string;
    grossRevenue: number;
    netRevenue: number;
    profit: number;
  }>;

  computedAds: Array<AdsCampaign & {
    roas: number;
    profitability: number;
  }>;

  computedKols: Array<KolTracking & {
    roas: number;
  }>;

  computedPurchaseOrders: Array<PurchaseOrder & {
    materialName: string;
    supplierName: string;
    totalCost: number;
  }>;

  computedCustomerDatabase: Array<Customer & {
    ordersCount: number;
    ltv: number;
  }>;

  computedCashflow: CashTransaction[];

  // Mutator actions
  addMaterial: (item: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addSample: (item: Omit<SampleDevelopment, 'id'>) => void;
  updateSample: (id: string, updates: Partial<SampleDevelopment>) => void;
  deleteSample: (id: string) => void;

  addProduction: (item: Omit<ProductionBatch, 'id'>) => void;
  updateProduction: (id: string, updates: Partial<ProductionBatch>) => void;
  deleteProduction: (id: string) => void;

  addProduct: (item: Omit<MasterProduct, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<MasterProduct>) => void;
  deleteProduct: (id: string) => void;

  addVariant: (item: SizeVariantInventory) => void;
  updateVariant: (sku: string, updates: Partial<SizeVariantInventory>) => void;
  deleteVariant: (sku: string) => void;

  addSale: (item: Omit<SalesRecord, 'id'>) => void;
  updateSale: (id: string, updates: Partial<SalesRecord>) => void;
  deleteSale: (id: string) => void;

  addOperationalCost: (item: Omit<OperationalCost, 'id'>) => void;
  updateOperationalCost: (id: string, updates: Partial<OperationalCost>) => void;
  deleteOperationalCost: (id: string) => void;

  addAdsCampaign: (item: Omit<AdsCampaign, 'id'>) => void;
  updateAdsCampaign: (id: string, updates: Partial<AdsCampaign>) => void;
  deleteAdsCampaign: (id: string) => void;

  addKol: (item: Omit<KolTracking, 'id'>) => void;
  updateKol: (id: string, updates: Partial<KolTracking>) => void;
  deleteKol: (id: string) => void;

  addPurchaseOrder: (item: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;

  addSupplier: (item: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addCustomer: (item: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addAsset: (item: Omit<AssetEquipment, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<AssetEquipment>) => void;
  deleteAsset: (id: string) => void;

  addCashTransaction: (item: Omit<CashTransaction, 'id'>) => void;
  addNotification: (message: string, type?: Notification['type']) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  updateConfig: (updates: Partial<ERPConfig>) => void;

  addMoodboardItem: (item: Omit<MoodboardItem, 'id' | 'date'>) => void;
  deleteMoodboardItem: (id: string) => void;

  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  setProducts: React.Dispatch<React.SetStateAction<MasterProduct[]>>;
  setSamples: React.Dispatch<React.SetStateAction<SampleDevelopment[]>>;
  setSales: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  formatMoney: (val: number | string, customDecimals?: number) => string;
  formatNumber: (val: number | string, customDecimals?: number) => string;
  formatPercent: (val: number | string, customDecimals?: number) => string;
  convertCurrency: (val: number, from: 'IDR' | 'USD', to: 'IDR' | 'USD') => number;
  t: (key: string) => string;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Key dinamis per bisnis — dioverride oleh ERPProvider berdasarkan activeBusiness
let _ACTIVE_BUSINESS_ID = 'nevaeh'; // default
const getKey = () => `illuminist_erp_${_ACTIVE_BUSINESS_ID}`;
// Backward compat untuk bisnis NEVAEH
const LOCAL_STORAGE_KEY = 'nevaeh_erp_state_v2_idr';
const getStorageKey = () => _ACTIVE_BUSINESS_ID === 'nevaeh' || _ACTIVE_BUSINESS_ID === '00000000-0000-0000-0000-000000000002'
  ? LOCAL_STORAGE_KEY
  : `illuminist_erp_${_ACTIVE_BUSINESS_ID}`;

// BUG-01 FIX: Gunakan max ID yang ada + 1, bukan .length + 1
// Alasan: length-based menyebabkan duplikat ID setelah item dihapus lalu ditambah lagi
function getNextId(items: { id: string }[], prefix: string): string {
  const nums = items.map(item => {
    const raw = item.id.replace(prefix + '-', '');
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
  });
  const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

// ORD prefix pakai 4 digit mulai 1001
function getNextOrderId(items: { id: string }[]): string {
  const nums = items.map(item => {
    const n = parseInt(item.id.replace('ORD-', ''), 10);
    return isNaN(n) ? 1000 : n;
  });
  const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
  return `ORD-${maxNum + 1}`;
}

// BUG-03 FIX: safe localStorage.setItem dengan error handling
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // QuotaExceededError — umumnya terjadi pada moodboard base64 images
    console.warn(`[Nevaeh] Storage quota exceeded for key "${key}". Data tidak disimpan.`);
  }
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
  // Sync storage key dengan active business
  const { activeBusiness: _activeBiz } = (() => { try { return useBusiness(); } catch { return { activeBusiness: null }; } })();
  if (_activeBiz?.id) _ACTIVE_BUSINESS_ID = _activeBiz.id;

  // Reset state saat switch bisnis — reload dari localStorage key yang benar
  const [currentBizId, setCurrentBizId] = React.useState(_ACTIVE_BUSINESS_ID);
  React.useEffect(() => {
    if (_activeBiz?.id && _activeBiz.id !== currentBizId) {
      setCurrentBizId(_activeBiz.id);
      // Data akan reload otomatis karena useState initializer pakai getStorageKey()
      // yang sudah di-update oleh _ACTIVE_BUSINESS_ID di atas
    }
  }, [_activeBiz?.id]);
  // --- INITIAL DATA SEEDING ---
  const initialSuppliers: Supplier[] = [
    { id: 'SUP-001', name: 'Obsidian Textiles Tokyo', contact: 'tokyo@obsidian.com', performanceIndex: 98, tier: 'Preferred' },
    { id: 'SUP-002', name: 'Atropos Metal Hardware', contact: 'craft@atropos.it', performanceIndex: 94, tier: 'Preferred' },
    { id: 'SUP-003', name: 'Phronesis Eco Packaging', contact: 'packaging@phronesis.co', performanceIndex: 89, tier: 'Secondary' }
  ];

  const initialMaterials: Material[] = [
    { id: 'MAT-001', name: 'Tech Avant-Garde Nylon', category: 'Fabric', supplierId: 'SUP-001', unit: 'meters', baseQty: 800, costPerUnit: 220000, minStock: 250, notes: 'Waterproof, matte finish, heavy drape' },
    { id: 'MAT-002', name: 'Deadstock Merino Terry', category: 'Rib', supplierId: 'SUP-001', unit: 'meters', baseQty: 450, costPerUnit: 300000, minStock: 100, notes: 'Ultra-warm, premium heavy-weight weave' },
    { id: 'MAT-003', name: 'Gunmetal Cobalt Zipper 20cm', category: 'Zipper', supplierId: 'SUP-002', unit: 'pcs', baseQty: 600, costPerUnit: 75000, minStock: 150, notes: 'Dual-opening asymmetrical laser cut' },
    { id: 'MAT-004', name: 'Stitch Satin Back-Neck Label', category: 'Label', supplierId: 'SUP-001', unit: 'pcs', baseQty: 1500, costPerUnit: 12000, minStock: 300, notes: 'Premium woven charcoal labeling with metallic thread' },
    { id: 'MAT-005', name: 'Bespoke Recycled Polybag', category: 'Polybag', supplierId: 'SUP-003', unit: 'pcs', baseQty: 1000, costPerUnit: 7500, minStock: 200, notes: 'Frosted matte black compostable bags' },
    { id: 'MAT-006', name: 'Tactical Aluminum Hook Buckle', category: 'Hardware', supplierId: 'SUP-002', unit: 'pcs', baseQty: 400, costPerUnit: 95000, minStock: 100, notes: 'Custom dark gray clasp for helix cargos' }
  ];

  const initialProducts: MasterProduct[] = [
    { id: 'PROD-001', name: 'Aura Tech Parka', collection: 'NEBULAE-26', category: 'Outerwear', sellingPrice: 4650000, status: 'Active' },
    { id: 'PROD-002', name: 'Obsidian Shroud Hoodie', collection: 'NEBULAE-26', category: 'Outerwear', sellingPrice: 2625000, status: 'Active' },
    { id: 'PROD-003', name: 'Helix Tactical Cargo', collection: 'CHRONOS', category: 'Bottoms', sellingPrice: 3225000, status: 'Active' },
    { id: 'PROD-004', name: 'Zenith Zero-G Boot', collection: 'CHRONOS', category: 'Footwear', sellingPrice: 5925000, status: 'Active' }
  ];

  const initialSamples: SampleDevelopment[] = [
    { id: 'SMP-001', productId: 'PROD-001', productName: 'Aura Tech Parka', version: 'v1.4', materialId: 'MAT-001', usageQty: 2.3, wastePercentage: 0.12, laborCost: 825000, status: 'Approved', createdDate: '2026-05-10', notes: 'Fit check matches premium standard, pocket adjustments completed' },
    { id: 'SMP-002', productId: 'PROD-003', productName: 'Helix Tactical Cargo', version: 'v1.1', materialId: 'MAT-001', usageQty: 1.8, wastePercentage: 0.10, laborCost: 600000, status: 'Approved', createdDate: '2026-05-12', notes: 'Tactical buckle integrated cleanly' },
    { id: 'SMP-003', productId: 'PROD-002', productName: 'Obsidian Shroud Hoodie', version: 'v2.0', materialId: 'MAT-002', usageQty: 1.5, wastePercentage: 0.08, laborCost: 450000, status: 'Sampling', createdDate: '2026-05-18', notes: 'Testing wash durability of internal fleece' }
  ];

  const initialProduction: ProductionBatch[] = [
    { id: 'PRD-001', productId: 'PROD-001', productName: 'Aura Tech Parka', factory: 'Saitama Craft Lab', qty: 120, materialId: 'MAT-001', usagePerPcs: 2.2, laborCost: 360000, packagingCost: 78000, qcStatus: 'Passed', productionStatus: 'Completed', productionDate: '2026-05-20', notes: 'Highly successful run. Zero seam disruptions recorded.' },
    { id: 'PRD-002', productId: 'PROD-003', productName: 'Helix Tactical Cargo', factory: 'Kyoto Outerwear Co', qty: 150, materialId: 'MAT-001', usagePerPcs: 1.7, laborCost: 270000, packagingCost: 67500, qcStatus: 'Passed', productionStatus: 'Completed', productionDate: '2026-05-22', notes: 'Excellent drape finish.' },
    { id: 'PRD-003', productId: 'PROD-002', productName: 'Obsidian Shroud Hoodie', factory: 'Saitama Craft Lab', qty: 100, materialId: 'MAT-002', usagePerPcs: 1.45, laborCost: 225000, packagingCost: 52500, qcStatus: 'Pending', productionStatus: 'In Progress', productionDate: '2026-05-26', notes: 'Sleeves currently sewing, batch 70% completed.' }
  ];

  const initialVariants: SizeVariantInventory[] = [
    { sku: 'PROD-001-BLK-S', productId: 'PROD-001', productName: 'Aura Tech Parka', color: 'Obsidian Black', size: 'S', currentStock: 40, minStock: 10 },
    { sku: 'PROD-001-BLK-M', productId: 'PROD-001', productName: 'Aura Tech Parka', color: 'Obsidian Black', size: 'M', currentStock: 40, minStock: 10 },
    { sku: 'PROD-001-BLK-L', productId: 'PROD-001', productName: 'Aura Tech Parka', color: 'Obsidian Black', size: 'L', currentStock: 40, minStock: 10 },

    { sku: 'PROD-003-SLT-S', productId: 'PROD-003', productName: 'Helix Tactical Cargo', color: 'Slate Gray', size: 'S', currentStock: 50, minStock: 12 },
    { sku: 'PROD-003-SLT-M', productId: 'PROD-003', productName: 'Helix Tactical Cargo', color: 'Slate Gray', size: 'M', currentStock: 50, minStock: 12 },
    { sku: 'PROD-003-SLT-L', productId: 'PROD-003', productName: 'Helix Tactical Cargo', color: 'Slate Gray', size: 'L', currentStock: 50, minStock: 12 },

    { sku: 'PROD-002-BLK-M', productId: 'PROD-002', productName: 'Obsidian Shroud Hoodie', color: 'Charcoal Noir', size: 'M', currentStock: 60, minStock: 15 },
    { sku: 'PROD-002-BLK-L', productId: 'PROD-002', productName: 'Obsidian Shroud Hoodie', color: 'Charcoal Noir', size: 'L', currentStock: 40, minStock: 15 },

    { sku: 'PROD-004-BLK-42', productId: 'PROD-004', productName: 'Zenith Zero-G Boot', color: 'Triple Midnight', size: '42', currentStock: 30, minStock: 5 },
    { sku: 'PROD-004-BLK-43', productId: 'PROD-004', productName: 'Zenith Zero-G Boot', color: 'Triple Midnight', size: '43', currentStock: 30, minStock: 5 }
  ];

  const initialSales: SalesRecord[] = [
    { id: 'ORD-1001', date: '2026-05-24', productId: 'PROD-001', variantSku: 'PROD-001-BLK-M', customerName: 'Hiroshi Tanaka', channel: 'Website', qtySold: 2, pricePerPcs: 4650000, platformFee: 139500, shippingFee: 180000, discount: 225000, status: 'Completed' },
    { id: 'ORD-1002', date: '2026-05-25', productId: 'PROD-001', variantSku: 'PROD-001-BLK-S', customerName: 'Evelyn Vane', channel: 'Instagram', qtySold: 1, pricePerPcs: 4650000, platformFee: 93000, shippingFee: 150000, discount: 0, status: 'Completed' },
    { id: 'ORD-1003', date: '2026-05-25', productId: 'PROD-003', variantSku: 'PROD-003-SLT-M', customerName: 'Lucas Kane', channel: 'TikTok Shop', qtySold: 3, pricePerPcs: 3225000, platformFee: 483750, shippingFee: 225000, discount: 300000, status: 'Completed' },
    { id: 'ORD-1004', date: '2026-05-26', productId: 'PROD-002', variantSku: 'PROD-002-BLK-M', customerName: 'Yuki Sato', channel: 'Shopee', qtySold: 4, pricePerPcs: 2625000, platformFee: 630000, shippingFee: 270000, discount: 450000, status: 'Shipped' },
    { id: 'ORD-1005', date: '2026-05-27', productId: 'PROD-004', variantSku: 'PROD-004-BLK-42', customerName: 'Zane Croft', channel: 'Website', qtySold: 1, pricePerPcs: 5925000, platformFee: 177750, shippingFee: 0, discount: 150000, status: 'Pending' }
  ];

  const initialOperationalCosts: OperationalCost[] = [
    { id: 'EXP-001', category: 'Meta Ads', campaignId: 'CAM-001', productId: 'PROD-001', amount: 22500000, date: '2026-05-15', platform: 'Facebook Business Manager', notes: 'Core Campaign: Aura Tech Parka Launch' },
    { id: 'EXP-002', category: 'TikTok Ads', campaignId: 'CAM-002', productId: 'PROD-003', amount: 12000000, date: '2026-05-18', platform: 'TikTok Ads Manager', notes: 'Chronos Helix Cargo Shorts Feed Drive' },
    { id: 'EXP-003', category: 'KOL', campaignId: '', productId: 'PROD-001', amount: 18000000, date: '2026-05-20', platform: 'Instagram Endorse', notes: 'Contracted @hyper_avant for story loops' },
    { id: 'EXP-004', category: 'Salary', campaignId: '', productId: '', amount: 90000000, date: '2026-05-25', platform: 'Bank Transfer', notes: 'Creative team & production labor salaries' },
    { id: 'EXP-005', category: 'Software', campaignId: '', productId: '', amount: 5250000, date: '2026-05-26', platform: 'Stripe SaaS', notes: 'CLO 3D fashion engine premium license' }
  ];

  const initialAdsCampaigns: AdsCampaign[] = [
    { id: 'CAM-001', name: 'Nebulae Core Parka Prospecting', platform: 'Meta Ads', productId: 'PROD-001', spend: 22500000, revenue: 78000000, cpc: 12750, cpm: 186000, ctr: 3.12, conversionRate: 2.15 },
    { id: 'CAM-002', name: 'Chronos Cargo Feed Conversions', platform: 'TikTok Ads', productId: 'PROD-003', spend: 12000000, revenue: 36000000, cpc: 6300, cpm: 127500, ctr: 4.88, conversionRate: 3.20 },
    { id: 'CAM-003', name: 'Zero-G Boots Display Push', platform: 'Google Ads', productId: 'PROD-004', spend: 9000000, revenue: 16500000, cpc: 16500, cpm: 234000, ctr: 1.95, conversionRate: 1.25 }
  ];

  const initialKols: KolTracking[] = [
    { id: 'KOL-001', name: 'Akihiro Kuroda (@hyper_avant)', platform: 'Instagram', followers: 185000, cost: 18000000, revenueGenerated: 72000000, campaignId: 'CAM-001', status: 'Completed' },
    { id: 'KOL-002', name: 'Zoe Techwear (@zo_cyber)', platform: 'TikTok', followers: 240000, cost: 22500000, revenueGenerated: 93000000, campaignId: 'CAM-001', status: 'Content Posted' },
    { id: 'KOL-003', name: 'Valerie Void (@void_wear)', platform: 'YouTube', followers: 95000, cost: 12000000, revenueGenerated: 27000000, campaignId: 'CAM-002', status: 'Contracted' }
  ];

  const initialPOS: PurchaseOrder[] = [
    { id: 'PO-001', supplierId: 'SUP-001', materialId: 'MAT-001', qty: 200, unitCost: 220000, date: '2026-05-14', status: 'Received' },
    { id: 'PO-002', supplierId: 'SUP-002', materialId: 'MAT-003', qty: 300, unitCost: 75000, date: '2026-05-24', status: 'Sent' },
    { id: 'PO-003', supplierId: 'SUP-001', materialId: 'MAT-002', qty: 100, unitCost: 300000, date: '2026-05-26', status: 'Draft' }
  ];

  const initialCustomers: Customer[] = [
    { id: 'CUST-001', name: 'Hiroshi Tanaka', email: 'tanaka@syndicate.jp', tier: 'Platinum' },
    { id: 'CUST-002', name: 'Evelyn Vane', email: 'evelyn@veil.tech', tier: 'Gold' },
    { id: 'CUST-003', name: 'Lucas Kane', email: 'kane@helix.net', tier: 'Gold' },
    { id: 'CUST-004', name: 'Yuki Sato', email: 'yuki@saitama.co', tier: 'Silver' },
    { id: 'CUST-005', name: 'Zane Croft', email: 'zane@voidwear.io', tier: 'Standard' }
  ];

  const initialAssets: AssetEquipment[] = [
    { id: 'AST-001', name: 'StitchMaster Laser Sealer XL', qty: 2, purchaseValue: 180000000, depreciation: 10, status: 'Operational' },
    { id: 'AST-002', name: 'CLO Workstation Render Rig', qty: 3, purchaseValue: 67500000, depreciation: 20, status: 'Operational' },
    { id: 'AST-003', name: 'Ultra-sonic Seam Welder v2', qty: 1, purchaseValue: 127500000, depreciation: 12, status: 'Maintenance' },
    { id: 'AST-004', name: 'Matrix Heavy Leather Stitcher', qty: 1, purchaseValue: 82500000, depreciation: 15, status: 'Operational' }
  ];

  const initialCash: CashTransaction[] = [
    { id: 'CSH-001', date: '2026-05-01', type: 'Inflow', category: 'Capital Injection', amount: 750000000, notes: 'Studio kickstart reserves' },
    { id: 'CSH-002', date: '2026-05-05', type: 'Outflow', category: 'Software Subscription', amount: 5250000, notes: 'CLO 3D development rig' },
    { id: 'CSH-003', date: '2026-05-15', type: 'Outflow', category: 'Ads spend', amount: 22500000, notes: 'Meta Prospecting Launch' }
  ];

  const initialNotifications: Notification[] = [
    { id: 'NTF-001', timestamp: '2026-05-27T10:30:00Z', type: 'warning', message: 'Low Stock Alert: Deadstock Merino Terry (Remaining: 20m, Min: 100m)', read: false },
    { id: 'NTF-002', timestamp: '2026-05-27T11:45:00Z', type: 'info', message: 'Production batch PRD-003 (Shroud Hoodie) marked 70% complete', read: false },
    { id: 'NTF-003', timestamp: '2026-05-27T12:15:00Z', type: 'success', message: 'Received PO-001 of Tech Nylon. Stock restocked automatically (+200m)', read: true }
  ];

  const initialConfig: ERPConfig = {
    lowStockThreshold: 150,
    autoReorderEnabled: true,
    defaultTaxRate: 10,
    systemName: 'NEVAEH AI OS',
    systemSubName: 'Supply chain, margins, and luxury brand diagnostics.',
    brandMonogram: 'N',
    currencySymbol: 'Rp',
    activeCurrency: 'IDR',
    currencyRate: 1,
    accentColor: 'gold',
    decimalPrecision: 0,
    visibleWidgets: {
      kpis: true,
      chart: true,
      aiInsight: true,
      lookbook: true,
      safeguards: true,
      salesLog: true
    }
  };

  const initialMoodboard: MoodboardItem[] = [
    {
      id: 'MOB-001',
      title: 'Minimal Futuristic Swatches',
      tag: 'Inspiration',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230c0c0e"/><circle cx="150" cy="100" r="50" fill="%238c7324" opacity="0.3"/><line x1="20" y1="20" x2="280" y2="180" stroke="%233f3f46" stroke-width="1"/><text x="20" y="30" fill="%23d4af37" font-family="monospace" font-size="10">NEBULAE CORE</text></svg>',
      date: '2026-05-27',
      notes: 'Matte texture pairings with metallic hardware accents.'
    },
    {
      id: 'MOB-002',
      title: 'Avant-garde Fit Check v1',
      tag: 'Fit check',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%230c0c0e"/><rect x="50" y="30" width="200" height="140" fill="none" stroke="%23d4af37" stroke-width="1" stroke-dasharray="4"/><text x="60" y="55" fill="%2371717a" font-family="monospace" font-size="10">HELIX OVERSIZE CROPPED</text></svg>',
      date: '2026-05-27',
      notes: 'Testing volume on overcoat silhouettes.'
    }
  ];

  // --- STATE DECLARED WITH LOCAL STORAGE SYNC ---
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_suppliers`);
    return local ? JSON.parse(local) : initialSuppliers;
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_materials`);
    return local ? JSON.parse(local) : initialMaterials;
  });

  const [products, setProducts] = useState<MasterProduct[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_products`);
    return local ? JSON.parse(local) : initialProducts;
  });

  const [samples, setSamples] = useState<SampleDevelopment[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_samples`);
    return local ? JSON.parse(local) : initialSamples;
  });

  const [production, setProduction] = useState<ProductionBatch[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_production`);
    return local ? JSON.parse(local) : initialProduction;
  });

  const [variants, setVariants] = useState<SizeVariantInventory[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_variants`);
    return local ? JSON.parse(local) : initialVariants;
  });

  const [sales, setSales] = useState<SalesRecord[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sales`);
    return local ? JSON.parse(local) : initialSales;
  });

  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ops`);
    return local ? JSON.parse(local) : initialOperationalCosts;
  });

  const [adsCampaigns, setAdsCampaigns] = useState<AdsCampaign[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ads`);
    return local ? JSON.parse(local) : initialAdsCampaigns;
  });

  const [kols, setKols] = useState<KolTracking[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_kols`);
    return local ? JSON.parse(local) : initialKols;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pos`);
    return local ? JSON.parse(local) : initialPOS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
    return local ? JSON.parse(local) : initialCustomers;
  });

  const [assets, setAssets] = useState<AssetEquipment[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_assets`);
    return local ? JSON.parse(local) : initialAssets;
  });

  const [cashflowState, setCashflowState] = useState<CashTransaction[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cash`);
    return local ? JSON.parse(local) : initialCash;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
    return local ? JSON.parse(local) : initialNotifications;
  });

  const [config, setConfig] = useState<ERPConfig>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_config`);
    const parsed = local ? JSON.parse(local) : initialConfig;
    return {
      activeCurrency: 'IDR',
      currencySymbol: 'Rp',
      currencyRate: 1,
      ...parsed
    };
  });

  const [moodboard, setMoodboard] = useState<MoodboardItem[]>(() => {
    const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_moodboard`);
    return local ? JSON.parse(local) : initialMoodboard;
  });

  // PERF-01 FIX: Per-state useEffect agar hanya state yang berubah yang disimpan
  // Sebelumnya: 1 useEffect menyimpan semua 17 state setiap ada perubahan apapun
  // Sekarang: masing-masing state punya useEffect sendiri → hemat CPU dan storage calls
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_suppliers`,    JSON.stringify(suppliers));    }, [suppliers]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_materials`,    JSON.stringify(materials));    }, [materials]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_products`,     JSON.stringify(products));     }, [products]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_samples`,      JSON.stringify(samples));      }, [samples]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_production`,   JSON.stringify(production));   }, [production]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_variants`,     JSON.stringify(variants));     }, [variants]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_sales`,        JSON.stringify(sales));        }, [sales]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_ops`,          JSON.stringify(operationalCosts)); }, [operationalCosts]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_ads`,          JSON.stringify(adsCampaigns)); }, [adsCampaigns]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_kols`,         JSON.stringify(kols));         }, [kols]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_pos`,          JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_customers`,    JSON.stringify(customers));    }, [customers]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_assets`,       JSON.stringify(assets));       }, [assets]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_cash`,         JSON.stringify(cashflowState)); }, [cashflowState]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_notifications`, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_config`,       JSON.stringify(config));       }, [config]);
  // BUG-03: moodboard bisa berisi gambar base64 besar → pakai safeSetItem untuk graceful fail
  useEffect(() => { safeSetItem(`${LOCAL_STORAGE_KEY}_moodboard`,    JSON.stringify(moodboard));    }, [moodboard]);

  // Helper t() lokal — perlu didefinisikan SEBELUM mutator functions
  // agar bisa digunakan di addMaterial, addSale, dll.
  const t = (key: string): string => getTranslation(key, (config?.language === 'id' ? 'id' : 'en'));

  // --- MUTATOR ACTIONS ---
  const addMaterial = (item: Omit<Material, 'id'>) => {
    const nextId = getNextId(materials, 'MAT');
    setMaterials(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_material'), 'success');
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addSample = (item: Omit<SampleDevelopment, 'id'>) => {
    const nextId = getNextId(samples, 'SMP');
    setSamples(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_sample'), 'info');
  };

  const updateSample = (id: string, updates: Partial<SampleDevelopment>) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSample = (id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  const addProduction = (item: Omit<ProductionBatch, 'id'>) => {
    const nextId = getNextId(production, 'PRD');
    setProduction(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_production'), 'success');
  };

  const updateProduction = (id: string, updates: Partial<ProductionBatch>) => {
    setProduction(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduction = (id: string) => {
    setProduction(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = (item: Omit<MasterProduct, 'id'>) => {
    const nextId = getNextId(products, 'PROD');
    setProducts(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_product'), 'success');
  };

  const updateProduct = (id: string, updates: Partial<MasterProduct>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addVariant = (item: SizeVariantInventory) => {
    setVariants(prev => {
      if (prev.some(v => v.sku === item.sku)) return prev;
      return [...prev, item];
    });
  };

  const updateVariant = (sku: string, updates: Partial<SizeVariantInventory>) => {
    setVariants(prev => prev.map(v => v.sku === sku ? { ...v, ...updates } : v));
  };

  const deleteVariant = (sku: string) => {
    setVariants(prev => prev.filter(v => v.sku !== sku));
  };

  const addSale = (item: Omit<SalesRecord, 'id'>) => {
    const nextId = getNextOrderId(sales);
    setSales(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_sales'), 'success');
    // Catat ke Transaction Engine (async, tidak block UI)
    const companyId = localStorage.getItem('illuminist_active_company') || 'nevaeh';
    const rev = (item.pricePerPcs||0)*(item.qtySold||0) - (item.platformFee||0) - (item.discount||0);
    getTxEngine(companyId).record({
      type: 'sale', amount: Math.max(0, rev),
      date: item.date || new Date().toISOString().slice(0,10),
      description: `Penjualan - ${item.customerName || 'Customer'}`,
      category: 'Penjualan',
      refId: nextId, refType: 'sale',
    }).catch(() => {});
  };

  const updateSale = (id: string, updates: Partial<SalesRecord>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const addOperationalCost = (item: Omit<OperationalCost, 'id'>) => {
    const nextId = getNextId(operationalCosts, 'EXP');
    setOperationalCosts(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_ops'), 'info');
    const companyId = localStorage.getItem('illuminist_active_company') || 'nevaeh';
    getTxEngine(companyId).record({
      type: 'expense', amount: item.amount || 0,
      date: item.date || new Date().toISOString().slice(0,10),
      description: item.category || 'Biaya Operasional',
      category: item.category, refId: nextId, refType: 'operational_cost',
    }).catch(() => {});
  };

  const updateOperationalCost = (id: string, updates: Partial<OperationalCost>) => {
    setOperationalCosts(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOperationalCost = (id: string) => {
    setOperationalCosts(prev => prev.filter(o => o.id !== id));
  };

  const addAdsCampaign = (item: Omit<AdsCampaign, 'id'>) => {
    const nextId = getNextId(adsCampaigns, 'CAM');
    setAdsCampaigns(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_ads'), 'success');
  };

  const updateAdsCampaign = (id: string, updates: Partial<AdsCampaign>) => {
    setAdsCampaigns(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAdsCampaign = (id: string) => {
    setAdsCampaigns(prev => prev.filter(a => a.id !== id));
  };

  const addKol = (item: Omit<KolTracking, 'id'>) => {
    const nextId = getNextId(kols, 'KOL');
    setKols(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_kol'), 'info');
  };

  const updateKol = (id: string, updates: Partial<KolTracking>) => {
    setKols(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const deleteKol = (id: string) => {
    setKols(prev => prev.filter(k => k.id !== id));
  };

  const addPurchaseOrder = (item: Omit<PurchaseOrder, 'id'>) => {
    const nextId = getNextId(purchaseOrders, 'PO');
    setPurchaseOrders(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_po'), 'info');
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        // If PO transitioning to "Received"
        if (updates.status === 'Received' && po.status !== 'Received') {
          addNotification(t('notif_po_received'), 'success');
        }
        return { ...po, ...updates };
      }
      return po;
    }));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  const addSupplier = (item: Omit<Supplier, 'id'>) => {
    const nextId = getNextId(suppliers, 'SUP');
    setSuppliers(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_supplier'), 'info');
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addCustomer = (item: Omit<Customer, 'id'>) => {
    const nextId = getNextId(customers, 'CUST');
    setCustomers(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_customer'), 'info');
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addAsset = (item: Omit<AssetEquipment, 'id'>) => {
    const nextId = getNextId(assets, 'AST');
    setAssets(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_asset'), 'info');
  };

  const updateAsset = (id: string, updates: Partial<AssetEquipment>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const addCashTransaction = (item: Omit<CashTransaction, 'id'>) => {
    const nextId = getNextId(cashflowState, 'CSH');
    setCashflowState(prev => [...prev, { ...item, id: nextId }]);
    addNotification(t('notif_added_cash'), 'info');
  };

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const nextId = `NTF-${Date.now()}`;
    const newN: Notification = {
      id: nextId,
      timestamp: new Date().toISOString(),
      type,
      message,
      read: false
    };
    setNotifications(prev => [newN, ...prev]);
  };

  const clearNotifications = () => setNotifications([]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateConfig = (updates: Partial<ERPConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const addMoodboardItem = (item: Omit<MoodboardItem, 'id' | 'date'>) => {
    const nextId = `MOB-${Date.now()}`;
    const newItem: MoodboardItem = {
      ...item,
      id: nextId,
      date: new Date().toISOString().split('T')[0]
    };
    setMoodboard(prev => [newItem, ...prev]);
    addNotification(`Uploaded visual media "${item.title}" to digital lookbook.`, 'success');
  };

  const deleteMoodboardItem = (id: string) => {
    setMoodboard(prev => prev.filter(m => m.id !== id));
  };

  // --- CONNECTED REALTIME RELATIONAL DATABASE FORMULAS ---

  // 1. COMPUTED MATERIALS
  const computedMaterials = useMemo(() => {
    return materials.map(m => {
      // purchaseQty = baseQty + Sum PO quantity (Received)
      const poSum = purchaseOrders
        .filter(po => po.materialId === m.id && po.status === 'Received')
        .reduce((sum, po) => sum + po.qty, 0);
      const purchaseQty = m.baseQty + poSum;

      // sampleQty = sum of finalUsageQty for this material
      const sampleSum = samples
        .filter(s => s.materialId === m.id)
        .reduce((sum, s) => {
          const finalUsage = s.usageQty * (1 + s.wastePercentage);
          return sum + finalUsage;
        }, 0);

      // productionQty = sum of totalUsageQty in completed/in-progress batches
      const prodSum = production
        .filter(p => p.materialId === m.id && p.productionStatus !== 'Scheduled')
        .reduce((sum, p) => sum + (p.qty * p.usagePerPcs), 0);

      const totalUsedQty = sampleSum + prodSum;
      const remainingQty = Math.max(0, purchaseQty - totalUsedQty);
      const totalValue = remainingQty * m.costPerUnit;
      const stockStatus: 'LOW_STOCK' | 'SURPLUS' = remainingQty < m.minStock ? 'LOW_STOCK' : 'SURPLUS';

      return {
        ...m,
        purchaseQty,
        sampleQty: parseFloat(sampleSum.toFixed(2)),
        productionQty: parseFloat(prodSum.toFixed(2)),
        totalUsedQty: parseFloat(totalUsedQty.toFixed(2)),
        remainingQty: parseFloat(remainingQty.toFixed(2)),
        totalValue: parseFloat(totalValue.toFixed(2)),
        stockStatus
      };
    });
  }, [materials, purchaseOrders, samples, production]);

  // BUG-02 FIX: Gunakan useRef untuk track material IDs yang sudah dapat notifikasi
  // Masalah lama: useEffect membaca `notifications` via stale closure (tidak ada di deps),
  // dan check string-nya salah sehingga TIDAK PERNAH match → notifikasi spam tiap data berubah
  const notifiedLowStockRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    computedMaterials.forEach(m => {
      if (m.stockStatus === 'LOW_STOCK') {
        if (!notifiedLowStockRef.current.has(m.id)) {
          notifiedLowStockRef.current.add(m.id);
          addNotification(
            `${t('notif_low_stock')}: ${m.name} — ${m.remainingQty} ${m.unit} (min: ${m.minStock})`,
            'warning'
          );
        }
      } else {
        // Stok pulih — hapus dari set agar bisa notif lagi jika nanti turun kembali
        notifiedLowStockRef.current.delete(m.id);
      }
    });
  }, [computedMaterials]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. COMPUTED SAMPLES
  const computedSamples = useMemo(() => {
    return samples.map(s => {
      const backingMat = computedMaterials.find(m => m.id === s.materialId);
      const matCostPerUnit = backingMat ? backingMat.costPerUnit : 0;

      const finalUsageQty = s.usageQty * (1 + s.wastePercentage);
      const materialCost = finalUsageQty * matCostPerUnit;
      const sampleTotalCost = materialCost + s.laborCost;

      return {
        ...s,
        finalUsageQty: parseFloat(finalUsageQty.toFixed(2)),
        materialCost: parseFloat(materialCost.toFixed(2)),
        sampleTotalCost: parseFloat(sampleTotalCost.toFixed(2))
      };
    });
  }, [samples, computedMaterials]);

  // 3. COMPUTED PRODUCTION
  const computedProduction = useMemo(() => {
    return production.map(p => {
      const backingMat = computedMaterials.find(m => m.id === p.materialId);
      const matCostPerUnit = backingMat ? backingMat.costPerUnit : 0;

      const totalUsageQty = p.qty * p.usagePerPcs;
      const materialCost = totalUsageQty * matCostPerUnit;
      const totalProductionCost = materialCost + p.laborCost + p.packagingCost;
      const unitCost = p.qty > 0 ? totalProductionCost / p.qty : 0;

      return {
        ...p,
        totalUsageQty: parseFloat(totalUsageQty.toFixed(2)),
        materialCost: parseFloat(materialCost.toFixed(2)),
        totalProductionCost: parseFloat(totalProductionCost.toFixed(2)),
        unitCost: parseFloat(unitCost.toFixed(2))
      };
    });
  }, [production, computedMaterials]);

  // 4. COMPUTED PRODUCTS WITH RELATIONAL FORMULAS
  const computedProducts = useMemo(() => {
    // Indexing for high-performance O(1) lookups
    const prodMap = new Map<string, any[]>();
    computedProduction.forEach(p => {
      if (p.productionStatus !== 'Scheduled') {
        const prodId = p.productId;
        if (!prodMap.has(prodId)) prodMap.set(prodId, []);
        prodMap.get(prodId)!.push(p);
      }
    });

    const salesMap = new Map<string, any[]>();
    sales.forEach(s => {
      if (s.status !== 'Cancelled') {
        const prodId = s.productId;
        if (!salesMap.has(prodId)) salesMap.set(prodId, []);
        salesMap.get(prodId)!.push(s);
      }
    });

    const approvedSampleMap = new Map<string, any>();
    computedSamples.forEach(s => {
      if (s.status === 'Approved') {
        approvedSampleMap.set(s.productId, s);
      }
    });

    const opsMap = new Map<string, any[]>();
    operationalCosts.forEach(o => {
      const prodId = o.productId;
      if (prodId) {
        if (!opsMap.has(prodId)) opsMap.set(prodId, []);
        opsMap.get(prodId)!.push(o);
      }
    });

    const adsMap = new Map<string, any[]>();
    adsCampaigns.forEach(a => {
      const prodId = a.productId;
      if (prodId) {
        if (!adsMap.has(prodId)) adsMap.set(prodId, []);
        adsMap.get(prodId)!.push(a);
      }
    });

    // KOL maps: campaign relationships -> product mapping
    const campaignsProductMap = new Map<string, string>();
    adsCampaigns.forEach(a => {
      campaignsProductMap.set(a.id, a.productId);
    });

    const kolsByProd = new Map<string, any[]>();
    kols.forEach(k => {
      // Find direct product matching or campaigns lookup
      const prodId = campaignsProductMap.get(k.campaignId) || k.campaignId;
      if (!kolsByProd.has(prodId)) kolsByProd.set(prodId, []);
      kolsByProd.get(prodId)!.push(k);
    });

    return products.map(product => {
      // units produced: sum of completed/in-progress batches
      const prodsForProd = prodMap.get(product.id) || [];
      const unitsProduced = prodsForProd.reduce((sum, p) => sum + p.qty, 0);

      // units sold
      const unitsSold = (salesMap.get(product.id) || []).reduce((sum, s) => sum + s.qtySold, 0);

      // 4a. Production Cost per unit = Weighted average of actual completed production runs or sample standard as fallback
      let productionCost = 0;
      if (prodsForProd.length > 0) {
        const totalCost = prodsForProd.reduce((sum, p) => sum + p.totalProductionCost, 0);
        const totalQty = prodsForProd.reduce((sum, p) => sum + p.qty, 0);
        productionCost = totalQty > 0 ? totalCost / totalQty : 0;
      } else {
        // Find approved sample
        const matchingSample = approvedSampleMap.get(product.id);
        if (matchingSample) {
          // If a sample has say, final usage quantity, we can derive mock production unit cost
          productionCost = matchingSample.sampleTotalCost;
        } else {
          // Fallback static based on product categories
          productionCost = product.sellingPrice * 0.25; // 25% of retail price
        }
      }

      // 4b. Operational Cost Allocation = Operational costs linked to this product / units produced
      const directOpsSum = (opsMap.get(product.id) || []).reduce((sum, o) => sum + o.amount, 0);
      const unitsRef = Math.max(1, unitsProduced || 100); // safety fallback reference
      const operationalCost = directOpsSum / unitsRef;

      // 4c. Ads Allocation = Ads spends linked to this product / unitsRef
      const directAdsSum = (adsMap.get(product.id) || []).reduce((sum, a) => sum + a.spend, 0);
      const adsAllocation = directAdsSum / unitsRef;

      // 4d. KOL Allocation = KOL costs linked to this product (viaCampaign IDs or directly) / unitsRef
      const directKolSum = (kolsByProd.get(product.id) || []).reduce((sum, k) => sum + k.cost, 0);
      const kolAllocation = directKolSum / unitsRef;

      // HPP calculation: production cost + operational allocated + ads allocated + kol allocated
      const finalHPP = productionCost + operationalCost + adsAllocation + kolAllocation;
      const grossProfit = product.sellingPrice - productionCost;
      const netProfit = product.sellingPrice - finalHPP;
      const marginPercentage = product.sellingPrice > 0 ? netProfit / product.sellingPrice : 0;

      return {
        ...product,
        unitsProduced,
        unitsSold,
        productionCost: parseFloat(productionCost.toFixed(2)),
        operationalCost: parseFloat(operationalCost.toFixed(2)),
        adsAllocation: parseFloat(adsAllocation.toFixed(2)),
        kolAllocation: parseFloat(kolAllocation.toFixed(2)),
        finalHPP: parseFloat(finalHPP.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(1)),
        marginPercentage: parseFloat((marginPercentage * 100).toFixed(1))
      };
    });
  }, [products, computedProduction, computedSamples, sales, operationalCosts, adsCampaigns, kols]);

  // 5. SIZE VARIANT INVENTORY
  const computedVariants = useMemo(() => {
    // Index sales by variantSku for fast O(1) matching
    const salesByVariant = new Map<string, any[]>();
    sales.forEach(s => {
      if (s.status !== 'Cancelled') {
        const sku = s.variantSku;
        if (!salesByVariant.has(sku)) salesByVariant.set(sku, []);
        salesByVariant.get(sku)!.push(s);
      }
    });

    return variants.map(v => {
      const soldQty = (salesByVariant.get(v.sku) || []).reduce((sum, s) => sum + s.qtySold, 0);

      const remainingStock = Math.max(0, v.currentStock - soldQty);
      const status: 'HEALTHY' | 'LOW_STOCK' = remainingStock < v.minStock ? 'LOW_STOCK' : 'HEALTHY';

      return {
        ...v,
        soldQty,
        remainingStock,
        status
      };
    });
  }, [variants, sales]);

  // 6. COMPUTED SALES
  const computedSales = useMemo(() => {
    // Index computedProducts by product ID
    const productsMap = new Map<string, any>();
    computedProducts.forEach(p => {
      productsMap.set(p.id, p);
    });

    return sales.map(s => {
      const linkedProduct = productsMap.get(s.productId);
      const hpp = linkedProduct ? linkedProduct.finalHPP : 0;

      const grossRevenue = s.qtySold * s.pricePerPcs;
      const netRevenue = grossRevenue - s.platformFee - s.shippingFee - s.discount;
      const profit = netRevenue - (hpp * s.qtySold);

      return {
        ...s,
        productName: linkedProduct ? linkedProduct.name : 'Unknown Product',
        grossRevenue: parseFloat(grossRevenue.toFixed(2)),
        netRevenue: parseFloat(netRevenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    });
  }, [sales, computedProducts]);

  // 7. ADS ROI FORMULAS
  const computedAds = useMemo(() => {
    return adsCampaigns.map(a => {
      // ROAS = Spend > 0 ? Revenue / Spend : 0
      const roas = a.spend > 0 ? a.revenue / a.spend : 0;
      const profitability = a.revenue - a.spend;

      return {
        ...a,
        roas: parseFloat(roas.toFixed(2)),
        profitability: parseFloat(profitability.toFixed(2))
      };
    });
  }, [adsCampaigns]);

  // 8. KOL ROI FORMULAS
  const computedKols = useMemo(() => {
    return kols.map(k => {
      const roas = k.cost > 0 ? k.revenueGenerated / k.cost : 0;

      return {
        ...k,
        roas: parseFloat(roas.toFixed(2))
      };
    });
  }, [kols]);

  // 9. REGISTERED PURCHASE ORDERS
  const computedPurchaseOrders = useMemo(() => {
    const matMap = new Map<string, any>();
    materials.forEach(m => matMap.set(m.id, m));

    const supMap = new Map<string, any>();
    suppliers.forEach(s => supMap.set(s.id, s));

    return purchaseOrders.map(po => {
      const mat = matMap.get(po.materialId);
      const sup = supMap.get(po.supplierId);

      return {
        ...po,
        materialName: mat ? mat.name : 'Unknown Material',
        supplierName: sup ? sup.name : 'Unknown Supplier',
        totalCost: parseFloat((po.qty * po.unitCost).toFixed(2))
      };
    });
  }, [purchaseOrders, materials, suppliers]);

  // 10. CUSTOMER DATABASE METRICS
  const computedCustomerDatabase = useMemo(() => {
    // Pre-aggregate sales by lowercase customer name
    const salesByCustomer = new Map<string, any[]>();
    computedSales.forEach(s => {
      const nameKey = s.customerName.toLowerCase().trim();
      if (!salesByCustomer.has(nameKey)) {
        salesByCustomer.set(nameKey, []);
      }
      salesByCustomer.get(nameKey)!.push(s);
    });

    return customers.map(cust => {
      const nameKey = cust.name.toLowerCase().trim();
      const custOrders = salesByCustomer.get(nameKey) || [];
      const ordersCount = custOrders.length;
      const ltv = custOrders.reduce((sum, o) => sum + o.netRevenue, 0);

      return {
        ...cust,
        ordersCount,
        ltv: parseFloat(ltv.toFixed(2))
      };
    });
  }, [customers, computedSales]);

  // 11. CASHFLOW LEDGER
  const computedCashflow = useMemo(() => {
    // Generate organic ledger entries from various connected transactions dynamically!
    // Inflow Ledger entries: Completed Sales net revenues
    const generatedSalesInflows = computedSales
      .filter(s => s.status === 'Completed' || s.status === 'Shipped')
      .map(s => ({
        id: `CSH-S-${s.id}`,
        date: s.date,
        type: 'Inflow' as const,
        category: 'Sales Revenue',
        amount: s.netRevenue,
        notes: `Order ${s.id} Attributed via ${s.channel}`
      }));

    // Outflow Ledger entries: Received Purchase Orders
    const generatedPOOutflows = computedPurchaseOrders
      .filter(po => po.status === 'Received')
      .map(po => ({
        id: `CSH-PO-${po.id}`,
        date: po.date,
        type: 'Outflow' as const,
        category: 'Material Sourcing',
        amount: po.totalCost,
        notes: `Received PO ${po.id} from ${po.supplierName}`
      }));

    // Outflow: Direct Operational Costs (Ads, Salaries, Software SaaS CLO, etc)
    const generatedOpsOutflows = operationalCosts.map(op => ({
      id: `CSH-EXP-${op.id}`,
      date: op.date,
      type: 'Outflow' as const,
      category: op.category === 'Salary' ? 'Payroll' : op.category === 'Software' ? 'Tech Stack SaaS' : 'Marketing Spend',
      amount: op.amount,
      notes: `${op.category}: ${op.notes}`
    }));

    // Combine manually inputted flows plus automatically synchronized cashflows!
    const allCashTransactions = [
      ...cashflowState,
      ...generatedSalesInflows,
      ...generatedPOOutflows,
      ...generatedOpsOutflows
    ];

    // Sort by date descending
    return allCashTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashflowState, computedSales, computedPurchaseOrders, operationalCosts]);

  // Robust formatting engine with configurable decimal precision and global currency conversion
  const convertCurrency = (val: number, from: 'IDR' | 'USD', to: 'IDR' | 'USD'): number => {
    if (from === to) return val;
    const rate = config?.currencyRate || 15400;
    if (from === 'IDR' && to === 'USD') {
      return val / rate;
    }
    if (from === 'USD' && to === 'IDR') {
      return val * rate;
    }
    return val;
  };

  const formatNumber = (val: any, customDecimals?: number): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0';
    const numericVal = Number(val);
    const precision = customDecimals !== undefined ? customDecimals : (config?.decimalPrecision !== undefined ? config.decimalPrecision : 0);
    return numericVal.toLocaleString('id-ID', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };

  const formatPercent = (val: any, customDecimals?: number): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return '0%';
    const numericVal = Number(val);
    const precision = customDecimals !== undefined ? customDecimals : (config?.decimalPrecision !== undefined ? config.decimalPrecision : 2);
    return numericVal.toLocaleString('id-ID', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }) + '%';
  };

  const formatMoney = (val: any, customDecimals?: number): string => {
    const symbol = config?.currencySymbol || 'Rp';
    const activeCurrency = config?.activeCurrency || 'IDR';
    if (val === null || val === undefined || String(val).trim() === '') {
      return `${symbol} 0`;
    }
    
    let numericVal = 0;
    if (typeof val === 'number') {
      numericVal = val;
    } else {
      let cleaned = String(val).trim();
      cleaned = cleaned.replace(/[Rp$€£\s]/g, '');
      if (activeCurrency === 'IDR') {
        if (cleaned.includes(',') && cleaned.includes('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else if (cleaned.includes(',')) {
          cleaned = cleaned.replace(/,/g, '.');
        } else if (cleaned.includes('.')) {
          if (cleaned.match(/^\d+(\.\d{3})+$/) || cleaned.split('.').length > 2) {
            cleaned = cleaned.replace(/\./g, '');
          }
        }
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
      const parsed = parseFloat(cleaned);
      numericVal = isNaN(parsed) ? 0 : parsed;
    }
    
    // Base data is stored in IDR, convert if USD is selected
    if (activeCurrency === 'USD') {
      numericVal = convertCurrency(numericVal, 'IDR', 'USD');
    }
    
    let precision = customDecimals !== undefined 
      ? customDecimals 
      : (config?.decimalPrecision !== undefined ? config.decimalPrecision : (activeCurrency === 'USD' ? 2 : 0));
      
    return symbol + ' ' + numericVal.toLocaleString(activeCurrency === 'USD' ? 'en-US' : 'id-ID', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };

  return (
    <ERPContext.Provider value={{
      materials,
      samples,
      production,
      products,
      variants,
      sales,
      operationalCosts,
      adsCampaigns,
      kols,
      purchaseOrders,
      suppliers,
      customers,
      assets,
      cashflow: cashflowState,
      notifications,
      config,
 
      computedMaterials,
      computedSamples,
      computedProduction,
      computedProducts,
      computedVariants,
      computedSales,
      computedAds,
      computedKols,
      computedPurchaseOrders,
      computedCustomerDatabase,
      computedCashflow,
 
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addSample,
      updateSample,
      deleteSample,
      addProduction,
      updateProduction,
      deleteProduction,
      addProduct,
      updateProduct,
      deleteProduct,
      addVariant,
      updateVariant,
      deleteVariant,
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
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addAsset,
      updateAsset,
      deleteAsset,
      addCashTransaction,
      addNotification,
      clearNotifications,
      markNotificationAsRead,
      updateConfig,
 
      moodboard,
      addMoodboardItem,
      deleteMoodboardItem,
 
      setMaterials,
      setProducts,
      setSamples,
      setSales,
      formatMoney,
      formatNumber,
      formatPercent,
      convertCurrency,
      t,
    }}>
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}
