import { Router } from 'express';
import { SaleSupabaseController } from '@/controllers/supabase/sale.supabase.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();
const saleController = new SaleSupabaseController();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rotas de vendas
router.get('/', saleController.findAll.bind(saleController));
router.get('/stats', saleController.getStats.bind(saleController));
router.get('/:id', saleController.findById.bind(saleController));
router.post('/', saleController.create.bind(saleController));
router.put('/:id', saleController.update.bind(saleController));
router.delete('/:id', saleController.delete.bind(saleController));

export default router;
