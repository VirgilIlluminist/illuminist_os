import { BaseRepository } from './base.repository';
export class SalesRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('sales_orders'); }
  async getTotalRevenue(companyId: string) {
    if (!this.db) return 0;
    const { data } = await this.db
      .from('sales_orders')
      .select('net_revenue')
      .eq('company_id', companyId);
    return (data || []).reduce((s: number, r: Record<string,unknown>) => s + (Number(r.net_revenue) || 0), 0);
  }
}
