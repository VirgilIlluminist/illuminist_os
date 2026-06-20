import { BaseService }         from './base.service';
import { ProductsRepository }  from '../../repositories/products.repository';

class ProductsService extends BaseService<Record<string,unknown>> {
  constructor() { super(new ProductsRepository(), 'Products'); }
}
export const productsService = new ProductsService();
