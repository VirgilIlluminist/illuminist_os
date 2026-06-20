import { BaseRepository } from './base.repository';
export class FinanceRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('cashflow_transactions'); }
  async getSummary(companyId: string) {
    if (!this.db) return { income: 0, expense: 0, net: 0 };
    const { data } = await this.db
      .from('cashflow_transactions')
      .select('type,amount')
      .eq('company_id', companyId);
    const rows = data || [];
    const income  = rows.filter((r: Record<string,unknown>) => r.type === 'income' ).reduce((s: number, r: Record<string,unknown>) => s + Number(r.amount), 0);
    const expense = rows.filter((r: Record<string,unknown>) => r.type === 'expense').reduce((s: number, r: Record<string,unknown>) => s + Number(r.amount), 0);
    return { income, expense, net: income - expense };
  }
}
