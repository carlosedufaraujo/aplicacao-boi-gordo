import { Router } from 'express';
import cashFlowController from '@/controllers/cashFlow.controller';
import { authMiddleware } from '@/middlewares/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de fluxo de caixa
router.post('/', cashFlowController.create);
router.get('/', cashFlowController.findAll);
router.get('/summary', cashFlowController.getSummary);
router.get('/:id', cashFlowController.findById);
router.put('/:id', cashFlowController.update);
router.patch('/:id/status', cashFlowController.updateStatus);
router.delete('/:id', cashFlowController.delete);

export default router;