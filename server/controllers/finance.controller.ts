import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { financeService } from '../services/business/finance.service';
import { ok, serverError } from '../utils/response';

class FinanceController extends BaseController {
  constructor() { super(financeService as any); }

  summary = async (req: Request, res: Response) => {
    try {
      const data = await financeService.getSummary(this.getCompanyId(req));
      return ok(res, data);
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };
}
export const financeController = new FinanceController();
