import { Router } from 'express';
import { PurchaseOrderController } from '@/controllers/purchaseOrder.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { purchaseOrderValidation } from '@/validations/purchaseOrder.validation';

const router = Router();
const purchaseOrderController = new PurchaseOrderController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  validate(purchaseOrderValidation.filters, 'query'),
  purchaseOrderController.index
);

router.get(
  '/stats',
  purchaseOrderController.stats
);

router.get(
  '/status/:status',
  purchaseOrderController.byStatus
);

router.get(
  '/stage/:stage',
  purchaseOrderController.byStage
);

router.get(
  '/:id',
  purchaseOrderController.show
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.create),
  purchaseOrderController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.update),
  purchaseOrderController.update
);

router.patch(
  '/:id/stage',
  authorize('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.updateStage),
  purchaseOrderController.updateStage
);

router.post(
  '/:id/reception',
  authorize('ADMIN', 'MANAGER', 'USER'),
  validate(purchaseOrderValidation.registerReception),
  purchaseOrderController.registerReception
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  purchaseOrderController.delete
);

export { router as purchaseOrderRoutes }; 