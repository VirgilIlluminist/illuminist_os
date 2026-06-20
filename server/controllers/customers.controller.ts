import { BaseController } from './base.controller';
import { customersService } from '../services/business/customers.service';

class CustomersController extends BaseController {
  constructor() { super(customersService as any); }
}
export const customersController = new CustomersController();
