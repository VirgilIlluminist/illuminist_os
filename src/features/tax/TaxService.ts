/**
 * TaxService — kalkulasi PPN & PPh, load/save TaxConfig, period summary.
 * Stateless — tidak memegang state React, hanya fungsi murni + repo calls.
 */
import { getRepo } from '../../core/repositories';
import type { TaxConfig, TaxBreakdown, PPHBreakdown, PPHType, TaxPeriodSummary } from './types';

const DEFAULT_CONFIG: Omit<TaxConfig, keyof import('../../core/repositories').BaseRecord> = {
  ppn_rate:       11,
  pph21_rate:     5,
  pph23_rate:     2,
  pph_final_rate: 0.5,
  pkp_status:     false,
  tax_method:     'exclusive',
};

// ─── Repository helpers ───────────────────────────────────────────────────────

async function getConfig(companyId: string): Promise<TaxConfig | null> {
  const result = await getRepo<TaxConfig>('tax_config').findAll(companyId, { limit: 1 });
  return result.data[0] ?? null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const TaxService = {
  // ── Config CRUD ─────────────────────────────────────────────────────────
  async loadConfig(companyId: string): Promise<TaxConfig & typeof DEFAULT_CONFIG> {
    const existing = await getConfig(companyId);
    return existing ? { ...DEFAULT_CONFIG, ...existing } : { ...DEFAULT_CONFIG } as any;
  },

  async saveConfig(companyId: string, data: Partial<TaxConfig>): Promise<TaxConfig | null> {
    const existing = await getConfig(companyId);
    if (existing) {
      return getRepo<TaxConfig>('tax_config').update(companyId, existing.id, data);
    }
    return getRepo<TaxConfig>('tax_config').create(companyId, { ...DEFAULT_CONFIG, ...data });
  },

  // ── PPN Calculation ──────────────────────────────────────────────────────
  calculatePPN(amount: number, rate: number, method: 'inclusive' | 'exclusive'): TaxBreakdown {
    const r = rate / 100;
    let base: number, ppn: number;
    if (method === 'exclusive') {
      base = amount;
      ppn  = round2(amount * r);
    } else {
      // amount sudah termasuk PPN
      base = round2(amount / (1 + r));
      ppn  = round2(amount - base);
    }
    return { base_amount: base, ppn_rate: rate, ppn_amount: ppn, total: round2(base + ppn), method };
  },

  // ── PPh Calculation ──────────────────────────────────────────────────────
  calculatePPh(gross: number, type: PPHType, config: Pick<TaxConfig, 'pph21_rate' | 'pph23_rate' | 'pph_final_rate'>): PPHBreakdown {
    const rate = type === 'pph21' ? config.pph21_rate
               : type === 'pph23' ? config.pph23_rate
               : config.pph_final_rate;
    const pph_amount = round2(gross * rate / 100);
    return { gross, rate, pph_amount, net: round2(gross - pph_amount), type };
  },

  // ── Period Summary ───────────────────────────────────────────────────────
  buildPeriodSummary(
    period: string,
    sales:  { amount: number; ppn: number }[],
    costs:  { amount: number; ppn: number }[],
    pph21:  number,
    pph23:  number,
    pphFinal: number,
  ): TaxPeriodSummary {
    const ppn_collected = round2(sales.reduce((s, r) => s + r.ppn,    0));
    const ppn_paid      = round2(costs.reduce((s, r) => s + r.ppn,    0));
    return {
      period,
      ppn_collected,
      ppn_paid,
      ppn_net:         round2(ppn_collected - ppn_paid),
      pph21_total:     round2(pph21),
      pph23_total:     round2(pph23),
      pph_final_total: round2(pphFinal),
      total_tax:       round2(ppn_collected - ppn_paid + pph21 + pph23 + pphFinal),
    };
  },
};

function round2(n: number) { return Math.round(n * 100) / 100; }
