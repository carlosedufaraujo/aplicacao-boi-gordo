import { Router } from 'express';
import { ExpenseController } from '@/controllers/expense.controller';
import { authenticate } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { expenseValidation } from '@/validations/expense.validation';

const router = Router();
const expenseController = new ExpenseController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Estatísticas e resumos
router.get('/stats',
  expenseController.stats
);

router.get('/stats/category', 
  validate(expenseValidation.dateRange, 'query'),
  expenseController.statsByCategory
);

router.get('/stats/cost-center', 
  validate(expenseValidation.dateRange, 'query'),
  expenseController.statsByCostCenter
);

router.get('/summary', 
  validate(expenseValidation.filters, 'query'),
  expenseController.summary
);

// Listagens especiais
router.get('/pending', 
  validate(expenseValidation.pending, 'query'),
  expenseController.pending
);

router.get('/overdue', 
  expenseController.overdue
);

// CRUD básico
router.get('/', 
  validate(expenseValidation.filters, 'query'),
  expenseController.index
);

router.get('/:id', 
  expenseController.show
);

router.post('/', 
  validate(expenseValidation.create),
  expenseController.create
);

router.put('/:id', 
  validate(expenseValidation.update),
  expenseController.update
);

router.delete('/:id', 
  expenseController.delete
);

// Ação de pagamento
router.post('/:id/pay', 
  validate(expenseValidation.pay),
  expenseController.pay
);

export default router; 