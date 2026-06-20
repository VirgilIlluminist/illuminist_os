export interface Material {
  id: string; // e.g. "MAT-001"
  name: string;
  category: string; // fabric, zipper, zipper etc.
  supplierId: string;
  unit: string; // meters, pcs, etc.
  baseQty: number; // manually entered starting qty
  notes: string;
  costPerUnit: number;
  minStock: number;
  image?: string; // base64 or media attachment
}

export interface SampleDevelopment {
  id: string; // e.g. "SMP-001"
  productId: string;
  productName: string;
  version: string;
  materialId: string;
  usageQty: number; // base pattern usage
  wastePercentage: number; // e.g. 0.15 for 15%
  laborCost: number;
  status: 'Design' | 'Sampling' | 'Approved' | 'Rejected';
  createdDate: string;
  notes: string;
  image?: string;
}

export interface ProductionBatch {
  id: string; // e.g. "PRD-001"
  productId: string;
  productName: string;
  factory: string;
  qty: number;
  materialId: string;
  usagePerPcs: number;
  laborCost: number;
  packagingCost: number;
  qcStatus: 'Pending' | 'Passed' | 'Failed';
  productionStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
  productionDate: string;
  notes: string;
  image?: string;
}

export interface MasterProduct {
  id: string; // e.g. "PROD-001"
  name: string;
  collection: string; // e.g. "NEBULAE-26"
  category: string; // e.g. "Outerwear", "Footwear", "Bottoms"
  sellingPrice: number;
  status: 'Active' | 'Draft' | 'Archived';
  image?: string;
}

export interface SizeVariantInventory {
  sku: string; // e.g. "PROD-001-BLK-M"
  productId: string;
  productName: string;
  color: string;
  size: string;
  currentStock: number; // initial added stock from batch/manual
  minStock: number;
}

export interface SalesRecord {
  id: string; // ORD-001
  date: string;
  productId: string;
  variantSku: string;
  customerName: string;
  channel: string; // Shopee, TikTok Shop, etc.
  qtySold: number;
  pricePerPcs: number;
  platformFee: number;
  shippingFee: number;
  discount: number;
  status: 'Pending' | 'Shipped' | 'Completed' | 'Cancelled';
}

export interface OperationalCost {
  id: string; // EXP-001
  category: string; // TikTok Ads, meta Ads, Shipping, Salary, etc.
  campaignId: string; // optional matching
  productId: string; // optional linked product
  amount: number;
  date: string;
  platform: string;
  notes: string;
}

export interface AdsCampaign {
  id: string; // CAM-001
  name: string;
  platform: 'Meta Ads' | 'TikTok Ads' | 'Google Ads' | 'Shopee Ads';
  productId: string;
  spend: number;
  revenue: number;
  cpc: number;
  cpm: number;
  ctr: number; // percent e.g. 2.5
  conversionRate: number; // percent e.g. 1.8
}

export interface KolTracking {
  id: string; // KOL-001
  name: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'X';
  followers: number;
  cost: number;
  revenueGenerated: number;
  campaignId: string;
  status: 'Negotiation' | 'Contracted' | 'Content Posted' | 'Completed';
}

export interface PurchaseOrder {
  id: string; // PO-001
  supplierId: string;
  materialId: string;
  qty: number;
  unitCost: number;
  date: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  performanceIndex: number; // 0-100
  tier: 'Preferred' | 'Secondary' | 'Backup';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
}

export interface AssetEquipment {
  id: string;
  name: string;
  qty: number;
  purchaseValue: number;
  depreciation: number; // annual percentage e.g. 15
  status: 'Operational' | 'Maintenance' | 'Offline';
  image?: string;
  category?: string;
  value?: number;
  maintenanceDate?: string;
}

export interface MoodboardItem {
  id: string;
  title: string;
  notes?: string;
  tag: string; // e.g. "Inspiration", "Fabric", "Fit check", "Lookbook", "Design Sketch"
  image: string; // base64 representation
  date: string;
  linkedEntityId?: string; // Optional links back to materials/products/samples
}

export interface CashTransaction {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  category: string;
  amount: number;
  notes: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
  read: boolean;
}

export interface ERPConfig {
  lowStockThreshold: number;
  autoReorderEnabled: boolean;
  defaultTaxRate: number;
  systemName?: string;
  systemSubName?: string;
  brandMonogram?: string;
  currencySymbol?: string;
  accentColor?: string; // 'gold' | 'emerald' | 'crimson' | 'indigo' | 'platinum'
  themeMode?: 'light' | 'dark' | 'glass';
  visibleWidgets?: {
    kpis: boolean;
    chart: boolean;
    aiInsight: boolean;
    lookbook: boolean;
    safeguards: boolean;
    salesLog: boolean;
  };
  
  // Customization Core Assets
  sidebarColor?: string;
  cardColor?: string;
  widgetSize?: 'compact' | 'standard' | 'spacious';
  borderRadius?: 'sharp' | 'standard' | 'luxury';
  spacingSize?: 'dense' | 'comfortable' | 'loose';
  fontFamily?: 'Space Grotesk' | 'Inter' | 'JetBrains Mono' | 'Playfair Display';
  wallpapertype?: 'dark-cosmic' | 'crystal-glass' | 'monochrome-wire' | 'custom-photo';
  wallpaperB64?: string;
  customLogo?: string;
  customIcon?: string;
  tableDensity?: 'compact' | 'normal' | 'relaxed';
  language?: 'en' | 'id' | 'ja' | 'zh';
  favoritePages?: string[];
  activeBrand?: string;

  // Real-time Style Override properties
  customBgColor?: string;
  customCardBg?: string;
  customTextColor?: string;
  customBorderColor?: string;
  customAccentColor?: string;
  tableFontSize?: number;
  tableRowPadding?: number;
  tableCardWidth?: number;
  appScale?: number;
  activeCurrency?: string;
  currencyRate?: number;
  customFontB64?: string;
  customFontUrl?: string;
  customFontName?: string;
  labelOverrides?: Record<string, string>;
  decimalPrecision?: number;
}

export interface WhiteboardItem {
  id: string;
  type: 'sticky' | 'shape' | 'text' | 'mindmap_node' | 'arrow' | 'database_embed';
  title: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string; // e.g. '#d4af37', '#10b981', etc.
  content?: string;
  shapeType?: 'rectangle' | 'circle' | 'diamond' | 'parallelogram';
  arrowFrom?: string;
  arrowTo?: string;
  embedTableId?: string; // e.g. 'materials', 'products'
}

export interface AutomationNode {
  id: string;
  type: 'trigger_schedule' | 'trigger_webhook' | 'inventory_check' | 'hpp_calculator' | 'sales_attribution' | 'ai_assistant_node' | 'telegram_action';
  x: number;
  y: number;
  label: string;
  status?: 'idle' | 'success' | 'alert' | 'active';
  config: Record<string, any>;
}

export interface SmartColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'tag' | 'date' | 'formula' | 'relation';
  formulaExpression?: string;
  relationTargetTable?: string;
  colorMap?: Record<string, string>;
  visible: boolean;
}

export interface CustomWorkspaceModule {
  id: string;
  name: string;
  iconName: string;
  color: string;
  pages: Array<{
    id: string;
    name: string;
    layoutType: 'grid' | 'kanban' | 'list';
    widgets: string[];
  }>;
}

