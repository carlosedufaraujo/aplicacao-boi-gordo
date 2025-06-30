import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();
const dashboardController = new DashboardController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rota principal - retorna todos os dados
router.get('/', dashboardController.index);

// Rotas específicas
router.get('/metrics', dashboardController.metrics);
router.get('/charts', dashboardController.charts);
router.get('/alerts', dashboardController.alerts);

export default router; 