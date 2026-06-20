import { BaseRepository } from './base.repository';
export class CustomersRepository extends BaseRepository<Record<string,unknown>> {
  constructor() { super('customers'); }
}
