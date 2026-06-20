import { Router } from 'express';
import { salesController } from '../../controllers/sales.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',         salesController.list);
router.get   ('/revenue',  salesController.revenue);
router.get   ('/:id',      salesController.getOne);
router.post  ('/',         salesController.create);
router.put   ('/:id',      salesController.update);
router.delete('/:id',      salesController.remove);

export default router;
