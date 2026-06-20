import { BaseRepository } from './base.repository';
export class ProductsRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('products'); }
}
