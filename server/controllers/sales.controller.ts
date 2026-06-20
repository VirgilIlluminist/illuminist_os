import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { salesService } from '../services/business/sales.service';
import { ok, serverError } from '../utils/response';

class SalesController extends BaseController {
  constructor() { super(salesService as any); }

  revenue = async (req: Request, res: Response) => {
    try {
      const total = await salesService.getTotalRevenue(this.getCompanyId(req));
      return ok(res, { total });
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };
}
export const salesController = new SalesController();
