/**
 * base.controller.ts
 * Semua controller extend BaseController.
 * Controller: terima request, panggil service, kirim response.
 * Tidak boleh ada business logic di sini.
 */
import { Request, Response } from 'express';
import { ok, badRequest, notFound, serverError } from '../utils/response';
import { BaseService } from '../services/business/base.service';

export class BaseController {
  protected service: BaseService<Record<string,unknown>>;

  constructor(service: BaseService<Record<string,unknown>>) {
    this.service = service;
  }

  getCompanyId(req: Request): string {
    return req.user?.companyId || 'default';
  }

  list = async (req: Request, res: Response) => {
    try {
      const companyId = this.getCompanyId(req);
      const limit  = parseInt(req.query.limit  as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await this.service.getAll(companyId, { limit, offset });
      return ok(res, result.data, undefined, { count: result.count });
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const item = await this.service.getById(req.params.id);
      if (!item) return notFound(res);
      return ok(res, item);
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const companyId = this.getCompanyId(req);
      const result = await this.service.create(companyId, req.body);
      if (result.error) return badRequest(res, result.error);
      return ok(res, result.data, 'Created');
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const result = await this.service.update(req.params.id, req.body);
      if (result.error) return badRequest(res, result.error);
      return ok(res, result.data, 'Updated');
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const result = await this.service.delete(req.params.id);
      if (result.error) return badRequest(res, result.error);
      return ok(res, null, 'Deleted');
    } catch (err) {
      return serverError(res, err instanceof Error ? err.message : 'Error');
    }
  };
}
