import { Router } from 'express';
import { deathRecordController } from '../controllers/deathRecord.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rotas principais
router.post('/', deathRecordController.create);
router.get('/', deathRecordController.findAll);
router.get('/statistics', deathRecordController.getStatistics);
router.get('/analysis/period', deathRecordController.getAnalysisByPeriod);
router.get('/:id', deathRecordController.findById);
router.put('/:id', deathRecordController.update);
router.delete('/:id', deathRecordController.delete);

export default router;