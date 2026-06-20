import { BaseRepository } from './base.repository';
export class MaterialsRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('materials'); }
  async findLowStock(companyId: string) {
    if (!this.db) return [];
    const { data } = await this.db
      .from('material_stock')
      .select('*')
      .eq('company_id', companyId)
      .in('stock_status', ['LOW_STOCK','OUT_OF_STOCK']);
    return data || [];
  }
}
