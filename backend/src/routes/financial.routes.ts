import { Router } from 'express';
import { FinancialController } from '@/controllers/financial.controller';

const router = Router();
const financialController = new FinancialController();

// Dashboard e resumos
router.get('/dashboard', (req, res) => financialController.getDashboard(req, res));
router.get('/summary', (req, res) => financialController.getFinancialSummary(req, res));

// Análises
router.get('/lot-profitability', (req, res) => financialController.getLotProfitability(req, res));
router.get('/cash-flow', (req, res) => financialController.getCashFlow(req, res));

// Integrações
router.post('/integrate-purchase', (req, res) => financialController.integratePurchase(req, res));
router.post('/integrate-sale', (req, res) => financialController.integrateSale(req, res));
router.post('/integrate-intervention', (req, res) => financialController.integrateIntervention(req, res));

// Alocação de despesas globais
router.post('/allocate-global', (req, res) => financialController.allocateGlobalExpenses(req, res));

export default router;