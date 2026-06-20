import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { materialsService } from '../services/business/materials.service';
import { ok, serverError } from '../utils/response';

class MaterialsController extends BaseController {
  constructor() { super(materialsService as any); }

  lowStock = async (req: Request, res: Response) => {
    try {
      const data = await materialsService.getLowStock(this.getCompanyId(req));
      return ok(res, data);
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };
}
export const materialsController = new MaterialsController();
