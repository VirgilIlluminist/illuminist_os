import { Router } from 'express';
import { financeController } from '../../controllers/finance.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',          financeController.list);
router.get   ('/summary',   financeController.summary);
router.get   ('/:id',       financeController.getOne);
router.post  ('/',          financeController.create);
router.put   ('/:id',       financeController.update);
router.delete('/:id',       financeController.remove);

export default router;
