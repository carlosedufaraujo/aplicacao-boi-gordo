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
  authorizeBackend('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.create),
  purchaseOrderController.create
);

router.put(
  '/:id',
  authorizeBackend('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.update),
  purchaseOrderController.update
);

router.patch(
  '/:id/stage',
  authorizeBackend('ADMIN', 'MANAGER'),
  validate(purchaseOrderValidation.updateStage),
  purchaseOrderController.updateStage
);

router.post(
  '/:id/reception',
  authorizeBackend('ADMIN', 'MANAGER', 'USER'),
  validate(purchaseOrderValidation.registerReception),
  purchaseOrderController.registerReception
);

router.delete(
  '/:id',
  authorizeBackend('ADMIN'),
  purchaseOrderController.delete
);

export { router as purchaseOrderRoutes }; 