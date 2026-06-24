/**
 * ShopeeFeeEngine — kalkulasi fee Shopee dari gross revenue ke net earnings.
 *
 * Formula:
 *   commission    = gross × commission_rate / 100
 *   admin_fee     = gross × admin_fee_rate / 100
 *   transaction   = gross × transaction_fee_rate / 100
 *   ppn           = (commission + admin_fee + transaction) × ppn_rate / 100
 *   total_fee     = commission + admin_fee + transaction + ppn
 *   net           = gross - total_fee
 */
import type { ShopeeChannelConfig, FeeBreakdown } from './types';

export const ShopeeFeeEngine = {
  calculate(gross: number, config: Pick<ShopeeChannelConfig, 'commission_rate' | 'admin_fee_rate' | 'transaction_fee_rate' | 'ppn_rate'>): FeeBreakdown {
    const commission     = round2(gross * config.commission_rate     / 100);
    const admin_fee      = round2(gross * config.admin_fee_rate      / 100);
    const transaction_fee= round2(gross * config.transaction_fee_rate/ 100);
    const base_fees      = commission + admin_fee + transaction_fee;
    const ppn            = round2(base_fees * config.ppn_rate        / 100);
    const total_fee      = round2(base_fees + ppn);
    const net            = round2(gross - total_fee);
    return { gross, commission, admin_fee, transaction_fee, ppn, total_fee, net };
  },

  effectiveRate(config: Pick<ShopeeChannelConfig, 'commission_rate' | 'admin_fee_rate' | 'transaction_fee_rate' | 'ppn_rate'>): number {
    const base = config.commission_rate + config.admin_fee_rate + config.transaction_fee_rate;
    const withPPN = base + (base * config.ppn_rate / 100);
    return round2(withPPN);
  },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
