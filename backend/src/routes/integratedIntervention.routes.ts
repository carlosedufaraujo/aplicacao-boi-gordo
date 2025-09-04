import { Router } from 'express';
import integratedInterventionController from '@/controllers/integratedIntervention.controller';
import { authMiddleware } from '@/middlewares/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rota genérica para registro integrado
router.post('/register', integratedInterventionController.registerIntegratedIntervention);

// Rotas de Mortalidade
router.post('/mortality/register', integratedInterventionController.registerMortality);
router.get('/mortality/calculate-loss', integratedInterventionController.calculateMortalityLoss);
router.get('/mortality/history', integratedInterventionController.getMortalityHistory);
router.get('/mortality/dre-impact', integratedInterventionController.calculateDREImpact);

// Rotas de Protocolo Sanitário
router.post('/health-protocol/register', integratedInterventionController.registerHealthProtocol);
router.patch('/health-protocol/:id/payment-status', integratedInterventionController.updateProtocolPaymentStatus);
router.get('/health-protocols', integratedInterventionController.getProtocolsWithFinancial);
router.get('/health-protocol/roi', integratedInterventionController.calculateHealthROI);

export default router;