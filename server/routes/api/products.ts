import { Router } from 'express';
import { productsController } from '../../controllers/products.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',    productsController.list);
router.get   ('/:id', productsController.getOne);
router.post  ('/',    productsController.create);
router.put   ('/:id', productsController.update);
router.delete('/:id', productsController.remove);

export default router;
