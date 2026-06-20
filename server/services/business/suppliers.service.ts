import { BaseService }          from './base.service';
import { SuppliersRepository }  from '../../repositories/suppliers.repository';

class SuppliersService extends BaseService<Record<string,unknown>> {
  constructor() { super(new SuppliersRepository(), 'Suppliers'); }
}
export const suppliersService = new SuppliersService();
