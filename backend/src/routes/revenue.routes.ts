import { Router } from 'express';
import { RevenueController } from '@/controllers/revenue.controller';
import { authenticate } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { revenueValidation } from '@/validations/revenue.validation';

const router = Router();
const revenueController = new RevenueController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Estatísticas e resumos
router.get('/stats',
  revenueController.stats
);

router.get('/stats/category', 
  validate(revenueValidation.dateRange, 'query'),
  revenueController.statsByCategory
);

router.get('/stats/cost-center', 
  validate(revenueValidation.dateRange, 'query'),
  revenueController.statsByCostCenter
);

router.get('/summary', 
  validate(revenueValidation.filters, 'query'),
  revenueController.summary
);

router.get('/projection', 
  validate(revenueValidation.projection, 'query'),
  revenueController.projection
);

// Listagens especiais
router.get('/pending', 
  validate(revenueValidation.pending, 'query'),
  revenueController.pending
);

router.get('/overdue', 
  revenueController.overdue
);

router.get('/recurring', 
  revenueController.recurring
);

// CRUD básico
router.get('/', 
  validate(revenueValidation.filters, 'query'),
  revenueController.index
);

router.get('/:id', 
  revenueController.show
);

router.post('/', 
  validate(revenueValidation.create),
  revenueController.create
);

router.put('/:id', 
  validate(revenueValidation.update),
  revenueController.update
);

router.delete('/:id', 
  revenueController.delete
);

// Ação de recebimento
router.post('/:id/receive', 
  validate(revenueValidation.receive),
  revenueController.receive
);

export default router; 