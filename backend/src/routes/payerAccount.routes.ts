import { Router } from 'express';
import { PayerAccountController } from '@/controllers/payerAccount.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { payerAccountValidation } from '@/validations/payerAccount.validation';

const router = Router();
const payerAccountController = new PayerAccountController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  validate(payerAccountValidation.filters, 'query'),
  payerAccountController.index
);

router.get(
  '/type/:type',
  payerAccountController.byType
);

router.get(
  '/:id',
  payerAccountController.show
);

router.get(
  '/:id/stats',
  payerAccountController.stats
);

router.get(
  '/:id/transactions',
  validate(payerAccountValidation.transactions, 'query'),
  payerAccountController.transactions
);

router.post(
  '/',
  authorize('ADMIN'),
  validate(payerAccountValidation.create),
  payerAccountController.create
);

router.put(
  '/:id',
  authorize('ADMIN'),
  validate(payerAccountValidation.update),
  payerAccountController.update
);

router.post(
  '/:id/balance',
  authorize('ADMIN', 'MANAGER'),
  validate(payerAccountValidation.updateBalance),
  payerAccountController.updateBalance
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  payerAccountController.delete
);

export { router as payerAccountRoutes }; 