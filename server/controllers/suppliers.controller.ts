import { BaseController } from './base.controller';
import { suppliersService } from '../services/business/suppliers.service';

class SuppliersController extends BaseController {
  constructor() { super(suppliersService as any); }
}
export const suppliersController = new SuppliersController();
