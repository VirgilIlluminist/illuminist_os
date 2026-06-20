/**
 * routes/api/audit.ts — Audit log endpoint
 */
import { Router } from 'express';
import { getAuditLog } from '../../middleware/audit';
import { ok }          from '../../utils/response';

const router = Router();

router.get('/', (req, res) => {
  const limit  = parseInt(req.query.limit  as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  return ok(res, {
    entries: getAuditLog(limit, offset),
    limit,
    offset,
  });
});

export default router;
