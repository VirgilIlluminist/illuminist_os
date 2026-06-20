/**
 * database.types.ts — TypeScript types untuk semua 23 tabel Supabase
 * Lengkap sesuai schema 001_initial_schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── Row types (data yang dibaca dari DB) ──────────────────────────────────
export interface Company {
  id:         string;
  parent_id:  string | null;
  name:       string;
  slug:       string;
  type:       'holding' | 'business' | 'personal' | 'venture';
  logo_url:   string | null;
  plan:       'starter' | 'pro' | 'enterprise';
  settings:   Json;
  is_active:  boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id:         string;
  company_id: string | null;
  full_name:  string | null;
  avatar_url: string | null;
  role:       'owner'|'admin'|'production'|'warehouse'|'finance'|'marketing'|'designer'|'viewer';
  ai_level:   1|2|3|4|5;
  is_active:  boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id:              string;
  company_id:      string;
  language:        string;
  currency:        string;
  currency_symbol: string;
  currency_rate:   number;
  theme_mode:      'dark' | 'light';
  accent_color:    string;
  decimal_places:  number;
  font_family:     string;
  system_name:     string;
  system_sub_name: string;
  brand_monogram:  string;
  created_at:      string;
  updated_at:      string;
}

export interface Supplier {
  id:              string;
  company_id:      string;
  code:            string | null;
  name:            string;
  contact:         string | null;
  email:           string | null;
  phone:           string | null;
  address:         string | null;
  performance_idx: number;
  tier:            'Premier' | 'Standard' | 'Backup';
  notes:           string | null;
  is_active:       boolean;
  created_at:      string;
  updated_at:      string;
}

export interface Material {
  id:            string;
  company_id:    string;
  code:          string | null;
  name:          string;
  category:      string | null;
  supplier_id:   string | null;
  unit:          string;
  cost_per_unit: number;
  min_stock:     number;
  image_url:     string | null;
  notes:         string | null;
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
}

export interface InventoryTransaction {
  id:             string;
  company_id:     string;
  material_id:    string;
  type:           'purchase_in'|'production_out'|'sample_out'|'adjustment'|'wastage'|'return_in';
  qty:            number;
  unit_cost:      number | null;
  reference_id:   string | null;
  reference_type: string | null;
  notes:          string | null;
  tx_date:        string;
  created_by:     string | null;
  created_at:     string;
}

export interface MaterialStock {
  id:            string;
  company_id:    string;
  code:          string | null;
  name:          string;
  unit:          string;
  min_stock:     number;
  cost_per_unit: number;
  category:      string | null;
  supplier_id:   string | null;
  remaining_qty: number;
  total_value:   number;
  stock_status:  'SURPLUS' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface PurchaseOrder {
  id:            string;
  company_id:    string;
  code:          string | null;
  supplier_id:   string | null;
  material_id:   string | null;
  qty:           number;
  unit_cost:     number;
  status:        'Draft'|'Sent'|'Confirmed'|'Received'|'Cancelled';
  order_date:    string;
  expected_date: string | null;
  received_date: string | null;
  notes:         string | null;
  created_by:    string | null;
  created_at:    string;
  updated_at:    string;
}

export interface Product {
  id:                string;
  company_id:        string;
  code:              string | null;
  name:              string;
  collection_season: string | null;
  selling_price:     number;
  description:       string | null;
  image_url:         string | null;
  is_active:         boolean;
  created_at:        string;
  updated_at:        string;
}

export interface ProductVariant {
  id:            string;
  company_id:    string;
  product_id:    string;
  size:          string;
  sku:           string | null;
  current_stock: number;
  min_stock:     number;
  created_at:    string;
}

export interface Sample {
  id:           string;
  company_id:   string;
  code:         string | null;
  product_id:   string | null;
  product_name: string | null;
  version:      string;
  status:       'Sampling'|'Approved'|'Rejected'|'Archived';
  labor_cost:   number;
  notes:        string | null;
  sample_date:  string;
  created_at:   string;
  updated_at:   string;
}

export interface SampleMaterial {
  id:            string;
  company_id:    string;
  sample_id:     string;
  material_id:   string | null;
  material_name: string | null;
  usage_qty:     number;
  waste_pct:     number;
  unit_cost:     number;
  created_at:    string;
}

export interface ProductionOrder {
  id:                string;
  company_id:        string;
  code:              string | null;
  product_id:        string | null;
  product_name:      string | null;
  factory:           string | null;
  qty:               number;
  labor_cost:        number;
  packaging_cost:    number;
  qc_status:         'Pending'|'Passed'|'Failed';
  production_status: 'Planned'|'In Progress'|'Completed'|'Cancelled';
  production_date:   string | null;
  notes:             string | null;
  created_by:        string | null;
  created_at:        string;
  updated_at:        string;
}

export interface ProductionMaterial {
  id:            string;
  company_id:    string;
  production_id: string;
  material_id:   string | null;
  material_name: string | null;
  usage_per_pcs: number;
  unit_cost:     number;
  created_at:    string;
}

export interface Customer {
  id:         string;
  company_id: string;
  code:       string | null;
  name:       string;
  email:      string | null;
  phone:      string | null;
  address:    string | null;
  segment:    'VIP'|'Regular'|'Wholesale'|'Reseller';
  notes:      string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  id:            string;
  company_id:    string;
  code:          string | null;
  customer_id:   string | null;
  product_id:    string | null;
  product_name:  string | null;
  qty_sold:      number;
  unit_price:    number;
  gross_revenue: number;
  platform_fee:  number;
  discount:      number;
  net_revenue:   number | null;
  channel:       string;
  product_link:  string | null;
  fulfillment:   string;
  sale_date:     string;
  created_by:    string | null;
  created_at:    string;
}

export interface OperationalCost {
  id:         string;
  company_id: string;
  code:       string | null;
  name:       string;
  amount:     number;
  type:       'Fixed'|'Variable'|'One-time';
  period:     string | null;
  notes:      string | null;
  cost_date:  string;
  created_at: string;
}

export interface AdsCampaign {
  id:          string;
  company_id:  string;
  code:        string | null;
  name:        string;
  platform:    string | null;
  spend:       number;
  revenue:     number;
  clicks:      number;
  impressions: number;
  start_date:  string | null;
  end_date:    string | null;
  status:      string;
  created_at:  string;
}

export interface KolRecord {
  id:            string;
  company_id:    string;
  code:          string | null;
  name:          string;
  platform:      string | null;
  fee:           number;
  followers:     number;
  engagement:    number;
  campaign:      string | null;
  sales_result:  number;
  status:        string;
  contract_date: string | null;
  created_at:    string;
}

export interface Asset {
  id:               string;
  company_id:       string;
  code:             string | null;
  name:             string;
  category:         string | null;
  purchase_value:   number;
  current_value:    number | null;
  depreciation_pct: number;
  purchase_date:    string | null;
  condition:        'New'|'Good'|'Fair'|'Poor'|'Disposed';
  notes:            string | null;
  created_at:       string;
}

export interface CashflowTransaction {
  id:          string;
  company_id:  string;
  code:        string | null;
  description: string;
  amount:      number;
  type:        'income' | 'expense';
  category:    string | null;
  reference:   string | null;
  tx_date:     string;
  created_by:  string | null;
  created_at:  string;
}

export interface HppRecord {
  id:               string;
  company_id:       string;
  product_id:       string | null;
  product_name:     string | null;
  material_cost:    number;
  labor_cost:       number;
  packaging_cost:   number;
  operational_cost: number;
  ads_allocation:   number;
  kol_allocation:   number;
  final_hpp:        number;
  selling_price:    number | null;
  margin_pct:       number;
  calc_date:        string;
  notes:            string | null;
  created_at:       string;
}

export interface AiSettings {
  id:                  string;
  company_id:          string;
  active_provider:     string;
  gemini_key_enc:      string | null;
  openai_key_enc:      string | null;
  claude_key_enc:      string | null;
  openrouter_key_enc:  string | null;
  permission_level:    1|2|3|4|5;
  custom_instructions: string | null;
  business_rules:      Json;
  created_at:          string;
  updated_at:          string;
}

export interface AuditLog {
  id:          string;
  company_id:  string | null;
  user_id:     string | null;
  entity:      string;
  entity_id:   string | null;
  action:      'CREATE'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'EXPORT'|'IMPORT'|'APPROVE'|'REJECT';
  before_data: Json | null;
  after_data:  Json | null;
  ip_address:  string | null;
  user_agent:  string | null;
  created_at:  string;
}

// ─── Database interface (untuk createClient<Database>) ─────────────────────
export interface Database {
  public: {
    Tables: {
      companies:               { Row: Company;              Insert: Omit<Company, 'id'|'created_at'|'updated_at'>;              Update: Partial<Omit<Company, 'id'|'created_at'>>              };
      profiles:                { Row: Profile;              Insert: Omit<Profile, 'created_at'|'updated_at'>;                   Update: Partial<Omit<Profile, 'id'|'created_at'>>              };
      app_settings:            { Row: AppSettings;          Insert: Omit<AppSettings, 'id'|'created_at'|'updated_at'>;          Update: Partial<Omit<AppSettings, 'id'|'created_at'>>          };
      suppliers:               { Row: Supplier;             Insert: Omit<Supplier, 'id'|'created_at'|'updated_at'>;             Update: Partial<Omit<Supplier, 'id'|'created_at'>>             };
      materials:               { Row: Material;             Insert: Omit<Material, 'id'|'created_at'|'updated_at'>;             Update: Partial<Omit<Material, 'id'|'created_at'>>             };
      inventory_transactions:  { Row: InventoryTransaction; Insert: Omit<InventoryTransaction, 'id'|'created_at'>;              Update: Partial<Omit<InventoryTransaction, 'id'|'created_at'>> };
      purchase_orders:         { Row: PurchaseOrder;        Insert: Omit<PurchaseOrder, 'id'|'created_at'|'updated_at'>;        Update: Partial<Omit<PurchaseOrder, 'id'|'created_at'>>        };
      products:                { Row: Product;              Insert: Omit<Product, 'id'|'created_at'|'updated_at'>;              Update: Partial<Omit<Product, 'id'|'created_at'>>              };
      product_variants:        { Row: ProductVariant;       Insert: Omit<ProductVariant, 'id'|'created_at'>;                   Update: Partial<Omit<ProductVariant, 'id'|'created_at'>>       };
      samples:                 { Row: Sample;               Insert: Omit<Sample, 'id'|'created_at'|'updated_at'>;               Update: Partial<Omit<Sample, 'id'|'created_at'>>               };
      sample_materials:        { Row: SampleMaterial;       Insert: Omit<SampleMaterial, 'id'|'created_at'>;                   Update: Partial<Omit<SampleMaterial, 'id'|'created_at'>>       };
      production_orders:       { Row: ProductionOrder;      Insert: Omit<ProductionOrder, 'id'|'created_at'|'updated_at'>;      Update: Partial<Omit<ProductionOrder, 'id'|'created_at'>>      };
      production_materials:    { Row: ProductionMaterial;   Insert: Omit<ProductionMaterial, 'id'|'created_at'>;               Update: Partial<Omit<ProductionMaterial, 'id'|'created_at'>>   };
      customers:               { Row: Customer;             Insert: Omit<Customer, 'id'|'created_at'|'updated_at'>;             Update: Partial<Omit<Customer, 'id'|'created_at'>>             };
      sales_orders:            { Row: SalesOrder;           Insert: Omit<SalesOrder, 'id'|'created_at'|'gross_revenue'>;       Update: Partial<Omit<SalesOrder, 'id'|'created_at'>>           };
      operational_costs:       { Row: OperationalCost;      Insert: Omit<OperationalCost, 'id'|'created_at'>;                  Update: Partial<Omit<OperationalCost, 'id'|'created_at'>>      };
      ads_campaigns:           { Row: AdsCampaign;          Insert: Omit<AdsCampaign, 'id'|'created_at'>;                      Update: Partial<Omit<AdsCampaign, 'id'|'created_at'>>          };
      kol_records:             { Row: KolRecord;            Insert: Omit<KolRecord, 'id'|'created_at'>;                        Update: Partial<Omit<KolRecord, 'id'|'created_at'>>            };
      assets:                  { Row: Asset;                Insert: Omit<Asset, 'id'|'created_at'>;                            Update: Partial<Omit<Asset, 'id'|'created_at'>>                };
      cashflow_transactions:   { Row: CashflowTransaction;  Insert: Omit<CashflowTransaction, 'id'|'created_at'>;              Update: Partial<Omit<CashflowTransaction, 'id'|'created_at'>>  };
      hpp_records:             { Row: HppRecord;            Insert: Omit<HppRecord, 'id'|'created_at'|'margin_pct'>;           Update: Partial<Omit<HppRecord, 'id'|'created_at'>>            };
      ai_settings:             { Row: AiSettings;           Insert: Omit<AiSettings, 'id'|'created_at'|'updated_at'>;          Update: Partial<Omit<AiSettings, 'id'|'created_at'>>           };
      audit_logs:              { Row: AuditLog;             Insert: Omit<AuditLog, 'id'|'created_at'>;                        Update: never                                                   };
    };
    Views: {
      material_stock: { Row: MaterialStock };
    };
    Functions: Record<string, unknown>;
    Enums:     Record<string, unknown>;
  };
}
