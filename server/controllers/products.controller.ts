import { BaseController } from './base.controller';
import { productsService } from '../services/business/products.service';

class ProductsController extends BaseController {
  constructor() { super(productsService as any); }
}
export const productsController = new ProductsController();
