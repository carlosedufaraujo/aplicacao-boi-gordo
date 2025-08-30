import { Router } from 'express';
import { PenController } from '@/controllers/pen.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { penValidation } from '@/validations/pen.validation';

const router = Router();
const penController = new PenController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  validate(penValidation.filters, 'query'),
  penController.index
);

router.get(
  '/available',
  penController.available
);

router.get(
  '/stats',
  penController.stats
);

router.get(
  '/status/:status',
  penController.byStatus
);

router.get(
  '/type/:type',
  penController.byType
);

router.get(
  '/:id',
  penController.show
);

router.get(
  '/:id/occupation',
  penController.occupation
);

router.get(
  '/:id/health-history',
  validate(penValidation.healthHistory, 'query'),
  penController.healthHistory
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(penValidation.create),
  penController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(penValidation.update),
  penController.update
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'MANAGER'),
  validate(penValidation.updateStatus),
  penController.updateStatus
);

router.post(
  '/:id/health-protocol',
  authorize('ADMIN', 'MANAGER', 'USER'),
  validate(penValidation.applyHealthProtocol),
  penController.applyHealthProtocol
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  penController.delete
);

export { router as penRoutes }; 