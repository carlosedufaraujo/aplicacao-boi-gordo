import { Router } from 'express';
import { SaleRecordController } from '@/controllers/saleRecord.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();
const saleRecordController = new SaleRecordController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  saleRecordController.index
);

router.get(
  '/stats',
  saleRecordController.stats
);

router.get(
  '/summary',
  saleRecordController.summary
);

router.get(
  '/period',
  saleRecordController.byPeriod
);

router.get(
  '/cattle-lot/:cattleLotId',
  saleRecordController.byCattleLot
);

router.get(
  '/buyer/:buyerId',
  saleRecordController.byBuyer
);

router.get(
  '/:id',
  saleRecordController.show
);

router.post(
  '/',
  // authorize('ADMIN', 'MANAGER'), // Temporariamente desabilitado para desenvolvimento
  saleRecordController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  saleRecordController.update
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'MANAGER'),
  saleRecordController.updateStatus
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  saleRecordController.delete
);

export { router as saleRecordRoutes };