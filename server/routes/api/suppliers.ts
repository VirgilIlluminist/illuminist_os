import { Router } from 'express';
import { suppliersController } from '../../controllers/suppliers.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',    suppliersController.list);
router.get   ('/:id', suppliersController.getOne);
router.post  ('/',    suppliersController.create);
router.put   ('/:id', suppliersController.update);
router.delete('/:id', suppliersController.remove);

export default router;
