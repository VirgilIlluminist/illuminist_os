import { BaseService }        from './base.service';
import { FinanceRepository }  from '../../repositories/finance.repository';

class FinanceService extends BaseService<Record<string,unknown>> {
  private finRepo: FinanceRepository;
  constructor() {
    const repo = new FinanceRepository();
    super(repo, 'Finance');
    this.finRepo = repo;
  }
  async getSummary(companyId: string) {
    return this.finRepo.getSummary(companyId);
  }
}
export const financeService = new FinanceService();
