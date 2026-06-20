import { BaseService }       from './base.service';
import { SalesRepository }   from '../../repositories/sales.repository';

class SalesService extends BaseService<Record<string,unknown>> {
  private salesRepo: SalesRepository;
  constructor() {
    const repo = new SalesRepository();
    super(repo, 'Sales');
    this.salesRepo = repo;
  }
  async getTotalRevenue(companyId: string) {
    return this.salesRepo.getTotalRevenue(companyId);
  }
}
export const salesService = new SalesService();
