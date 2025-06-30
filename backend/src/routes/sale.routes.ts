import { Router } from 'express';
import { SaleController } from '@/controllers/sale.controller';
import { authenticate } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { saleValidation } from '@/validations/sale.validation';

const router = Router();
const saleController = new SaleController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Estatísticas e análises
router.get('/statistics', 
  validate(saleValidation.period, 'query'),
  saleController.statistics
);

router.get('/period', 
  validate(saleValidation.period, 'query'),
  saleController.byPeriod
);

router.get('/profitability/:lotId', 
  saleController.profitability
);

// Listagens por filtros
router.get('/by-status/:status', 
  saleController.byStatus
);

router.get('/by-lot/:lotId', 
  saleController.byLot
);

// CRUD básico
router.get('/', 
  validate(saleValidation.filters, 'query'),
  saleController.index
);

router.get('/:id', 
  saleController.show
);

router.post('/', 
  validate(saleValidation.create),
  saleController.create
);

router.put('/:id', 
  validate(saleValidation.update),
  saleController.update
);

router.patch('/:id/status', 
  validate(saleValidation.updateStatus),
  saleController.updateStatus
);

router.delete('/:id', 
  saleController.delete
);

export default router; 