import { Router } from 'express';
import { ReportController } from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { reportValidation } from '@/validations/report.validation';
import { cachePresets } from '@/middlewares/cache';

const router = Router();
const reportController = new ReportController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Relatórios básicos - disponíveis para todos os usuários autenticados
router.get('/dre', 
  validate(reportValidation.dre, 'query'),
  cachePresets.report,
  reportController.dre
);

router.get('/cash-flow', 
  validate(reportValidation.cashFlow, 'query'),
  cachePresets.medium,
  reportController.cashFlow
);

router.get('/lot-performance', 
  validate(reportValidation.lotPerformance, 'query'),
  cachePresets.report,
  reportController.lotPerformance
);

router.get('/pen-occupancy',
  cachePresets.short,
  reportController.penOccupancy
);

// Relatórios avançados - requerem role MANAGER ou ADMIN
router.post('/dre-comparison', 
  authorize('MANAGER', 'ADMIN'),
  validate(reportValidation.dreComparison),
  reportController.dreComparison
);

router.get('/executive-summary', 
  authorize('MANAGER', 'ADMIN'),
  validate(reportValidation.executiveSummary, 'query'),
  cachePresets.long,
  reportController.executiveSummary
);

// Exportação - requer role MANAGER ou ADMIN
router.get('/export/:type', 
  authorize('MANAGER', 'ADMIN'),
  validate(reportValidation.export, 'query'),
  reportController.export
);

export default router; 