import { BaseRepository } from './base.repository';
export class SuppliersRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('suppliers'); }
}
