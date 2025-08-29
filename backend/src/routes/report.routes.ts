import { Router } from 'express';
import { ReportController } from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { reportValidation } from '@/validations/report.validation';

const router = Router();
const reportController = new ReportController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Relatórios básicos - disponíveis para todos os usuários autenticados
router.get('/dre', 
  validate(reportValidation.dre, 'query'),
  reportController.dre
);

router.get('/cash-flow', 
  validate(reportValidation.cashFlow, 'query'),
  reportController.cashFlow
);

router.get('/lot-performance', 
  validate(reportValidation.lotPerformance, 'query'),
  reportController.lotPerformance
);

router.get('/pen-occupancy', 
  reportController.penOccupancy
);

// Relatórios avançados - requerem role MANAGER ou ADMIN
router.post('/dre-comparison', 
  authorizeBackend(['MANAGER', 'ADMIN']),
  validate(reportValidation.dreComparison),
  reportController.dreComparison
);

router.get('/executive-summary', 
  authorizeBackend(['MANAGER', 'ADMIN']),
  validate(reportValidation.executiveSummary, 'query'),
  reportController.executiveSummary
);

// Exportação - requer role MANAGER ou ADMIN
router.get('/export/:type', 
  authorizeBackend(['MANAGER', 'ADMIN']),
  validate(reportValidation.export, 'query'),
  reportController.export
);

export default router; 