import { Router } from 'express';
import { CycleSupabaseController } from '@/controllers/supabase/cycle.supabase.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();
const controller = new CycleSupabaseController();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de consulta (GET)
router.get('/', controller.index.bind(controller));
router.get('/stats', controller.stats.bind(controller));
router.get('/active', controller.active.bind(controller));
router.get('/current', controller.current.bind(controller));
router.get('/status/:status', controller.byStatus.bind(controller));
router.get('/:id', controller.show.bind(controller));

// Rotas de criação e modificação (POST, PUT, PATCH, DELETE)
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.patch('/:id/complete', controller.complete.bind(controller));
router.patch('/:id/cancel', controller.cancel.bind(controller));

router.delete('/:id', 
  authorize('ADMIN', 'MANAGER'), 
  controller.delete.bind(controller)
);

export default router;
