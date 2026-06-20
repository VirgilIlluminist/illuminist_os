import { BaseService }          from './base.service';
import { CustomersRepository }  from '../../repositories/customers.repository';

class CustomersService extends BaseService<Record<string,unknown>> {
  constructor() { super(new CustomersRepository(), 'Customers'); }
}
export const customersService = new CustomersService();
