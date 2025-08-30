import { Router } from 'express';
import { CostCenterController } from '@/controllers/costCenter.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();
const costCenterController = new CostCenterController();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Rotas
router.get('/', costCenterController.index);
router.get('/stats', costCenterController.stats);
router.get('/:id', costCenterController.show);

// Apenas ADMIN e MANAGER podem criar/editar/deletar
router.post('/', authorize('ADMIN', 'MANAGER'), costCenterController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), costCenterController.update);
router.delete('/:id', authorize('ADMIN'), costCenterController.delete);

export { router as costCenterRoutes };