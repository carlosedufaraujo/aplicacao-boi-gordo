import { Router } from 'express';
import { PartnerController } from '@/controllers/partner.controller';
import { validate } from '@/middlewares/validation';
import { authenticate, authorize } from '@/middlewares/auth';
import { partnerValidation } from '@/validations/partner.validation';

const router = Router();
const partnerController = new PartnerController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get(
  '/',
  validate(partnerValidation.filters, 'query'),
  partnerController.index
);

router.get(
  '/type/:type',
  partnerController.byType
);

router.get(
  '/:id',
  partnerController.show
);

router.get(
  '/:id/stats',
  partnerController.stats
);

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(partnerValidation.create),
  partnerController.create
);

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(partnerValidation.update),
  partnerController.update
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  partnerController.delete
);

export { router as partnerRoutes }; 