import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// ===== WEIGHT BREAK ROUTES =====
router.post('/weight-break/register', analyticsController.registerWeightBreak);
router.get('/weight-break/patterns/region', analyticsController.getWeightBreakPatternsByRegion);
router.get('/weight-break/patterns/vendor/:vendorId?', analyticsController.getWeightBreakPatternsByVendor);
router.get('/weight-break/correlations', analyticsController.getWeightBreakCorrelations);
router.post('/weight-break/predict', analyticsController.predictWeightBreak);
router.post('/weight-break/report', analyticsController.generateWeightBreakReport);

// ===== MORTALITY ROUTES =====
router.post('/mortality/register', analyticsController.registerMortality);
router.get('/mortality/patterns', analyticsController.getMortalityPatterns);
router.get('/mortality/environmental', analyticsController.getEnvironmentalCorrelations);
router.get('/mortality/treatments', analyticsController.getTreatmentEffectiveness);
router.get('/mortality/risk/:cattlePurchaseId', analyticsController.predictMortalityRisk);
router.get('/mortality/report/:cattlePurchaseId', analyticsController.getLotMortalityReport);

// ===== COMBINED ANALYTICS =====
router.get('/dashboard', analyticsController.getAnalyticsDashboard);

export default router;