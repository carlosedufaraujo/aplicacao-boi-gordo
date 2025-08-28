import { Router } from 'express';
import { SaleRecordSupabaseController } from '@/controllers/supabase/saleRecord.supabase.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();
const saleRecordController = new SaleRecordSupabaseController();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rotas de registros de venda
router.get('/', saleRecordController.findAll.bind(saleRecordController));
router.get('/stats', saleRecordController.getStats.bind(saleRecordController));
router.get('/:id', saleRecordController.findById.bind(saleRecordController));
router.post('/', saleRecordController.create.bind(saleRecordController));
router.put('/:id', saleRecordController.update.bind(saleRecordController));
router.delete('/:id', saleRecordController.delete.bind(saleRecordController));

export default router;
