import type { BaseRecord } from '../../core/repositories';

export interface TaxConfig extends BaseRecord {
  ppn_rate:        number;  // % default 11
  pph21_rate:      number;  // %
  pph23_rate:      number;  // %
  pph_final_rate:  number;  // % PP 46
  pkp_status:      boolean; // apakah sudah PKP
  tax_method:      'inclusive' | 'exclusive';
  npwp?:           string;
  tax_name?:       string;
}

export type PPHType = 'pph21' | 'pph23' | 'pph_final';

export interface TaxBreakdown {
  base_amount: number;
  ppn_rate:    number;
  ppn_amount:  number;
  total:       number;
  method:      'inclusive' | 'exclusive';
}

export interface PPHBreakdown {
  gross:       number;
  rate:        number;
  pph_amount:  number;
  net:         number;
  type:        PPHType;
}

export interface TaxPeriodSummary {
  period:          string;  // YYYY-MM
  ppn_collected:   number;  // dari penjualan
  ppn_paid:        number;  // dari pembelian
  ppn_net:         number;  // terutang (collected - paid)
  pph21_total:     number;
  pph23_total:     number;
  pph_final_total: number;
  total_tax:       number;
}
