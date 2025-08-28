import { Router } from 'express';
import { PayerAccountSupabaseController } from '@/controllers/supabase/payerAccount.supabase.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();
const controller = new PayerAccountSupabaseController();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de consulta (GET)
router.get('/', controller.index.bind(controller));
router.get('/stats', controller.stats.bind(controller));
router.get('/active', controller.active.bind(controller));
router.get('/status/:status', controller.byStatus.bind(controller));
router.get('/type/:accountType', controller.byType.bind(controller));
router.get('/:id', controller.show.bind(controller));

// Rotas de criação e modificação (POST, PUT, PATCH, DELETE)
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.patch('/:id/balance', controller.updateBalance.bind(controller));
router.patch('/:id/toggle', controller.toggleStatus.bind(controller));

router.delete('/:id', 
  authorize('ADMIN', 'MANAGER'), 
  controller.delete.bind(controller)
);

export default router;
