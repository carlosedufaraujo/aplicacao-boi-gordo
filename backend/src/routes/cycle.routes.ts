import { Router } from 'express';
import { CycleController } from '@/controllers/cycle.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();
const cycleController = new CycleController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  cycleController.index
);

router.get(
  '/stats',
  cycleController.stats
);

router.get(
  '/summary',
  cycleController.summary
);

router.get(
  '/active',
  cycleController.active
);

router.get(
  '/period',
  cycleController.byPeriod
);

router.get(
  '/:id',
  cycleController.show
);

router.get(
  '/:id/stats',
  cycleController.cycleStats
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  cycleController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  cycleController.update
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'MANAGER'),
  cycleController.updateStatus
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  cycleController.delete
);

export { router as cycleRoutes };