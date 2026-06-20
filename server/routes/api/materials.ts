import { Router } from 'express';
import { materialsController } from '../../controllers/materials.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();
router.use(optionalAuth);

router.get   ('/',           materialsController.list);
router.get   ('/low-stock',  materialsController.lowStock);
router.get   ('/:id',        materialsController.getOne);
router.post  ('/',           materialsController.create);
router.put   ('/:id',        materialsController.update);
router.delete('/:id',        materialsController.remove);

export default router;
