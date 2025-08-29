import { Router } from 'express';
import { CattleLotController } from '@/controllers/cattleLot.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { cattleLotValidation } from '@/validations/cattleLot.validation';

const router = Router();
const cattleLotController = new CattleLotController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  validate(cattleLotValidation.filters, 'query'),
  cattleLotController.index
);

router.get(
  '/stats',
  cattleLotController.stats
);

router.get(
  '/status/:status',
  cattleLotController.byStatus
);

router.get(
  '/:id',
  cattleLotController.show
);

router.get(
  '/:id/metrics',
  cattleLotController.metrics
);

router.post(
  '/:id/allocate',
  authorizeBackend('ADMIN', 'MANAGER', 'USER'),
  validate(cattleLotValidation.allocate),
  cattleLotController.allocate
);

router.post(
  '/:id/mortality',
  authorizeBackend('ADMIN', 'MANAGER', 'USER'),
  validate(cattleLotValidation.recordMortality),
  cattleLotController.recordMortality
);

router.post(
  '/:id/weight-loss',
  authorizeBackend('ADMIN', 'MANAGER', 'USER'),
  validate(cattleLotValidation.recordWeightLoss),
  cattleLotController.recordWeightLoss
);

router.patch(
  '/:id/costs',
  authorizeBackend('ADMIN', 'MANAGER'),
  validate(cattleLotValidation.updateCosts),
  cattleLotController.updateCosts
);

export { router as cattleLotRoutes }; 