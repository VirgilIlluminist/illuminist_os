/**
 * base.service.ts
 * Semua business service extend BaseService.
 * Pattern: Service layer berisi business logic, bukan query DB.
 * Query DB ada di repository layer.
 */
import { BaseRepository, QueryOptions } from '../../repositories/base.repository';
import { logger } from '../../utils/logger';

export class BaseService<T extends Record<string, unknown>> {
  protected repo: BaseRepository<T>;
  protected name: string;

  constructor(repo: BaseRepository<T>, name: string) {
    this.repo = repo;
    this.name = name;
  }

  async getAll(companyId: string, opts?: QueryOptions) {
    logger.debug(`Service[${this.name}]`, `getAll company=${companyId}`);
    return this.repo.findAll({ ...opts, companyId });
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async create(companyId: string, payload: Partial<T>) {
    return this.repo.create({ ...payload, company_id: companyId } as Partial<T>);
  }

  async update(id: string, payload: Partial<T>) {
    return this.repo.update(id, payload);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }

  get isDBEnabled() {
    return this.repo.isEnabled;
  }
}
