/**
 * useInitialData.ts — ARCH-01 Extract
 * Semua seed/initial data dipisah dari ERPContext agar file lebih ringan.
 * Import di ERPContext: import { INITIAL_MATERIALS, ... } from '../types';
 */
import {
  Material, SampleDevelopment, ProductionBatch, MasterProduct,
  SizeVariantInventory, SalesRecord, OperationalCost, AdsCampaign,
  KolTracking, PurchaseOrder, Supplier, Customer, AssetEquipment,
  CashTransaction, Notification, ERPConfig
} from '../types';

// ─── Default Config ───────────────────────────────────────────────────────────
export const DEFAULT_CONFIG: any = {
  systemName:         'NEVAEH AI OS',
  systemSubName:      'Intelligent Business Operating System',
  brandMonogram:      'N',
  accentColor:        'gold',
  customAccentColor:  '#d4af37',
  themeMode:          'dark',
  language:           'id',
  activeCurrency:     'IDR',
  currencySymbol:     'Rp',
  currencyRate:       1,
  decimalPrecision:   0,
  autoLowStockWarning: true,
  dynamicHPPEnabled:  true,
};

// ─── Initial Notifications ────────────────────────────────────────────────────
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NTF-001',
    message: 'Sistem NEVAEH AI OS berhasil diinisialisasi. Semua modul aktif.',
    type: 'success',
    read: false,
    timestamp: new Date().toLocaleString('id-ID'),
  },
];

// ─── Seed Materials ───────────────────────────────────────────────────────────
export const INITIAL_MATERIALS: any[] = [
  {
    id: 'MAT-001',
    name: 'Premium Linen Fabric',
    category: 'Fabric',
    supplierId: 'SUP-001',
    supplierName: 'PT. Kain Nusantara',
    unit: 'meter',
    baseQty: 500,
    costPerUnit: 85000,
    remainingQty: 380,
    minStock: 50,
    notes: 'Grade A linen, natural color, 145cm width',
    imageUrl: '',
  },
  {
    id: 'MAT-002',
    name: 'Organic Cotton Batik',
    category: 'Fabric',
    supplierId: 'SUP-001',
    supplierName: 'PT. Kain Nusantara',
    unit: 'meter',
    baseQty: 300,
    costPerUnit: 120000,
    remainingQty: 210,
    minStock: 30,
    notes: 'Hand-stamped batik, certified organic',
    imageUrl: '',
  },
  {
    id: 'MAT-003',
    name: 'Tencel Blend Jersey',
    category: 'Fabric',
    supplierId: 'SUP-002',
    supplierName: 'CV. Tekstil Maju',
    unit: 'meter',
    baseQty: 200,
    costPerUnit: 95000,
    remainingQty: 42,
    minStock: 50,
    notes: 'Eco-friendly, moisture-wicking',
    imageUrl: '',
  },
];

// ─── Seed Suppliers ───────────────────────────────────────────────────────────
export const INITIAL_SUPPLIERS: any[] = [
  {
    id: 'SUP-001',
    name: 'PT. Kain Nusantara',
    contact: 'pak.budi@kainnusantara.co.id | 0812-3456-7890',
    performanceIndex: 92,
    tier: 'Premier',
  },
  {
    id: 'SUP-002',
    name: 'CV. Tekstil Maju',
    contact: 'info@tekstilmaju.id | 0821-9876-5432',
    performanceIndex: 78,
    tier: 'Standard',
  },
];

// ─── Seed Products ────────────────────────────────────────────────────────────
export const INITIAL_PRODUCTS: any[] = [
  {
    id: 'PROD-001',
    name: 'Nevaeh Linen Kaftan',
    collectionSeason: 'Ramadan 2025',
    sellingPrice: 785000,
    finalHPP: 0,
    operationalCost: 0,
    adsAllocation: 0,
    kolAllocation: 0,
    description: 'Premium linen kaftan dengan detail bordir tangan',
    imageUrl: '',
  },
  {
    id: 'PROD-002',
    name: 'Batik Wrap Skirt',
    collectionSeason: 'Everyday Core',
    sellingPrice: 485000,
    finalHPP: 0,
    operationalCost: 0,
    adsAllocation: 0,
    kolAllocation: 0,
    description: 'Wrap skirt batik organik, adjustable size',
    imageUrl: '',
  },
];

// ─── Seed Customers ───────────────────────────────────────────────────────────
export const INITIAL_CUSTOMERS: any[] = [
  {
    id: 'CUST-001',
    name: 'Sari Dewi',
    email: 'sari@email.com',
    phone: '0812-1111-2222',
    segment: 'VIP',
    totalSpend: 0,
    totalOrders: 0,
  },
];

// Semua initial state lainnya dimulai kosong — diisi user melalui UI
export const INITIAL_EMPTY = {
  samples:          [] as SampleDevelopment[],
  production:       [] as ProductionBatch[],
  variants:         [] as SizeVariantInventory[],
  sales:            [] as SalesRecord[],
  operationalCosts: [] as OperationalCost[],
  adsCampaigns:     [] as AdsCampaign[],
  kols:             [] as KolTracking[],
  purchaseOrders:   [] as PurchaseOrder[],
  assets:           [] as AssetEquipment[],
  cashflowState:    [] as CashTransaction[],
  moodboard:        [] as { id: string; url: string; caption: string }[],
};
