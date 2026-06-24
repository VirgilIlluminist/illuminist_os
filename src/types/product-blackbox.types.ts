import type { MasterProduct, SizeVariantInventory, SalesRecord } from '../types';

export type ProductStatus = 'draft' | 'active' | 'discontinued' | 'archived';
export type AssetType = 'cover' | 'photo' | 'campaign' | 'packaging';
export type TimelineEventType =
  | 'created' | 'first_sale' | 'restock' | 'price_change'
  | 'batch_added' | 'journal_entry' | 'milestone' | 'status_change';
export type SalesChannel = 'shopee' | 'tokopedia' | 'instagram' | 'direct' | 'other';

// Re-export for convenience
export type { MasterProduct, SizeVariantInventory, SalesRecord };

export interface ProductVariantBB {
  id: string;
  productId: string;
  companyId: string;
  name: string;
  skuSuffix?: string;
  stock: number;
  hpp?: number;
  sellingPrice?: number;
  weightGram?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  companyId: string;
  batchNumber: string;
  quantity: number;
  hpp: number;
  sellingPrice: number;
  productionDate: string;
  notes?: string;
  status: 'active' | 'depleted' | 'archived';
  createdAt: string;
}

export interface ProductAsset {
  id: string;
  productId: string;
  companyId: string;
  url: string;
  storagePath: string;
  assetType: AssetType;
  label?: string;
  sortOrder: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface ProductJournalEntry {
  id: string;
  productId: string;
  companyId: string;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingHistoryEntry {
  id: string;
  productId: string;
  companyId: string;
  oldPrice?: number;
  newPrice: number;
  oldHpp?: number;
  newHpp?: number;
  reason?: string;
  changedAt: string;
}

export interface ProductTimelineEvent {
  id: string;
  productId: string;
  companyId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  eventDate: string;
  createdAt: string;
}

export interface ProductDescription {
  id: string;
  productId: string;
  companyId: string;
  shortDescription?: string;
  longDescription?: string;
  specifications?: string;
  productStory?: string;
  careInstructions?: string;
  shopeeDescription?: string;
  tokopediaDescription?: string;
  instagramCaption?: string;
  websiteDescription?: string;
  updatedAt: string;
}

export interface ChannelSalesSummary {
  channel: SalesChannel;
  unitsSold: number;
  grossRevenue: number;
  fees: number;
  netRevenue: number;
  averageOrderValue: number;
}

export interface StockMovement {
  date: string;
  type: 'in' | 'out';
  qty: number;
  reference: string;
  balance: number;
}

export interface MarginResult {
  marginAmount: number;
  marginPercent: number;
  breakEvenPrice: number;
  targetPrice: (targetMarginPercent: number) => number;
}

export interface RestockPrediction {
  currentStock: number;
  avgDailySales: number;
  daysUntilStockout: number | null;
  estimatedStockoutDate: string | null;
  recommendedRestockQuantity: number;
}

export interface BlackboxOverview {
  product: MasterProduct;
  variants: ProductVariantBB[];
  currentBatch: ProductBatch | null;
  totalStock: number;
  totalUnitsSold: number;
  totalRevenue: number;
  currentMargin: number;
  daysUntilStockout: number | null;
  recentJournalEntries: ProductJournalEntry[];
  recentTimelineEvents: ProductTimelineEvent[];
}
