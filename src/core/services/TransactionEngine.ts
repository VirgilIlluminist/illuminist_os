/**
 * TransactionEngine.ts — V5.2 Transaction Engine
 * Mencatat semua arus keuangan ke satu tabel terpusat.
 * Di-call oleh ERPContext hooks (addSale, addCashTransaction, dll).
 * Menyimpan ke localStorage via Repository — siap upgrade ke Supabase.
 */
import { getRepo, BaseRecord } from '../repositories';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TxType =
  | 'sale' | 'purchase' | 'expense' | 'payroll' | 'owner_draw'
  | 'inventory_in' | 'inventory_out' | 'production' | 'adjustment'
  | 'rent_in' | 'investment' | 'transfer' | 'intercompany';

export interface Transaction extends BaseRecord {
  type:        TxType;
  amount:      number;
  date:        string;
  description: string;
  ref_id?:     string;
  ref_type?:   string;
  status:      'posted' | 'draft' | 'reversed';
  category?:   string;
}

export interface JournalLine extends BaseRecord {
  journal_id:   string;
  account_code: string;
  debit:        number;
  credit:       number;
  description?: string;
}

// ─── Journal rules (akun debit/kredit per tipe transaksi) ────────────────────

const JOURNAL_RULES: Record<TxType, { debit: string; credit: string }> = {
  sale:          { debit: '1100', credit: '4100' },
  purchase:      { debit: '1300', credit: '1100' },
  expense:       { debit: '5400', credit: '1100' },
  payroll:       { debit: '5200', credit: '1100' },
  owner_draw:    { debit: '3200', credit: '1100' },
  inventory_in:  { debit: '1300', credit: '1100' },
  inventory_out: { debit: '5100', credit: '1300' },
  production:    { debit: '1300', credit: '5100' },
  adjustment:    { debit: '1300', credit: '5600' },
  rent_in:       { debit: '1100', credit: '4200' },
  investment:    { debit: '1500', credit: '1100' },
  transfer:      { debit: '1100', credit: '1100' },
  intercompany:  { debit: '1100', credit: '2300' },
};

// ─── Engine ──────────────────────────────────────────────────────────────────

export class TransactionEngine {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  async record(payload: {
    type:        TxType;
    amount:      number;
    date:        string;
    description: string;
    category?:   string;
    refId?:      string;
    refType?:    string;
  }): Promise<string | null> {
    if (!payload.amount || payload.amount === 0) return null;

    const txRepo = getRepo<Transaction>('transactions');
    const result = await txRepo.create(this.companyId, {
      type:        payload.type,
      amount:      Math.abs(payload.amount),
      date:        payload.date,
      description: payload.description,
      category:    payload.category,
      ref_id:      payload.refId,
      ref_type:    payload.refType,
      status:      'posted',
    } as any);

    if (!result) return null;

    // Auto-journal lines
    const rule = JOURNAL_RULES[payload.type];
    if (rule) {
      const jlRepo = getRepo<JournalLine>('journal_lines');
      await jlRepo.create(this.companyId, {
        journal_id:   result.id,
        account_code: rule.debit,
        debit:        Math.abs(payload.amount),
        credit:       0,
        description:  payload.description,
      } as any);
      await jlRepo.create(this.companyId, {
        journal_id:   result.id,
        account_code: rule.credit,
        debit:        0,
        credit:       Math.abs(payload.amount),
        description:  payload.description,
      } as any);
    }

    return result.id;
  }

  /** Ambil semua transaksi bulan ini */
  async getThisMonth(): Promise<Transaction[]> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const repo = getRepo<Transaction>('transactions');
    const { data } = await repo.findAll(this.companyId, {
      orderBy: { column:'date', direction:'desc' },
      limit: 500,
    });
    return data.filter(t => (t.date||'').startsWith(month));
  }

  /** Trial Balance sederhana dari journal lines */
  async getTrialBalance(): Promise<Record<string, { debit:number; credit:number; balance:number }>> {
    const repo = getRepo<JournalLine>('journal_lines');
    const { data } = await repo.findAll(this.companyId, { limit:2000 });
    const accounts: Record<string, { debit:number; credit:number; balance:number }> = {};
    data.forEach(line => {
      const code = line.account_code || '9999';
      if (!accounts[code]) accounts[code] = { debit:0, credit:0, balance:0 };
      accounts[code].debit  += line.debit  || 0;
      accounts[code].credit += line.credit || 0;
      accounts[code].balance = accounts[code].debit - accounts[code].credit;
    });
    return accounts;
  }
}

// ─── Singleton per company ───────────────────────────────────────────────────

const _engines = new Map<string, TransactionEngine>();
export function getTxEngine(companyId: string): TransactionEngine {
  if (!_engines.has(companyId)) _engines.set(companyId, new TransactionEngine(companyId));
  return _engines.get(companyId)!;
}
