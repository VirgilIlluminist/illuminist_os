import { Router } from 'express';
import { customersController } from '../../controllers/customers.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',    customersController.list);
router.get   ('/:id', customersController.getOne);
router.post  ('/',    customersController.create);
router.put   ('/:id', customersController.update);
router.delete('/:id', customersController.remove);

export default router;
