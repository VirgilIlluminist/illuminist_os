import { BaseService }           from './base.service';
import { MaterialsRepository }   from '../../repositories/materials.repository';

class MaterialsService extends BaseService<Record<string,unknown>> {
  private materialsRepo: MaterialsRepository;
  constructor() {
    const repo = new MaterialsRepository();
    super(repo, 'Materials');
    this.materialsRepo = repo;
  }
  async getLowStock(companyId: string) {
    return this.materialsRepo.findLowStock(companyId);
  }
}
export const materialsService = new MaterialsService();
