import type { BaseRecord } from '../../core/repositories';

// ─── Channel Configuration ────────────────────────────────────────────────────

export interface ShopeeChannelConfig extends BaseRecord {
  name:                 string;   // e.g. "Shopee Official Store"
  shop_id?:             string;   // optional Shopee shop ID
  commission_rate:      number;   // %
  admin_fee_rate:       number;   // %
  transaction_fee_rate: number;   // %
  ppn_rate:             number;   // % applied to (commission + admin + transaction)
  is_active:            boolean;
}

// ─── Settlement Row (dari CSV) ────────────────────────────────────────────────

export interface ShopeeSettlement extends BaseRecord {
  batch_id:          string;
  channel_config_id: string;
  order_id:          string;
  order_date:        string;
  product_name:      string;
  sku:               string;
  qty:               number;
  unit_price:        number;
  gross_revenue:     number;
  commission_fee:    number;
  admin_fee:         number;
  transaction_fee:   number;
  ppn:               number;
  total_fee:         number;
  net_earnings:      number;
  status:            'pending' | 'synced';
}

// ─── Import Batch ─────────────────────────────────────────────────────────────

export interface ShopeeImportBatch extends BaseRecord {
  filename:          string;
  channel_config_id: string;
  row_count:         number;
  total_gross:       number;
  total_fees:        number;
  total_net:         number;
  imported_at:       string;
  status:            'draft' | 'synced_to_pl';
}

// ─── Fee Calculation Result ───────────────────────────────────────────────────

export interface FeeBreakdown {
  gross:          number;
  commission:     number;
  admin_fee:      number;
  transaction_fee:number;
  ppn:            number;
  total_fee:      number;
  net:            number;
}

// ─── CSV Row (sebelum parsing) ────────────────────────────────────────────────

export interface RawShopeeRow {
  order_id:       string;
  order_date:     string;
  product_name:   string;
  sku:            string;
  qty:            number;
  unit_price:     number;
  gross_revenue:  number;
}

// ─── Import Result ────────────────────────────────────────────────────────────

export interface ShopeeImportResult {
  batch:       ShopeeImportBatch;
  settlements: ShopeeSettlement[];
  errors:      string[];
}
