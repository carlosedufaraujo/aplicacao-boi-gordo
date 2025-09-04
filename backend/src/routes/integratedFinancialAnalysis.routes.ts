import { Router } from 'express';
import { integratedFinancialAnalysisController } from '@/controllers/integratedFinancialAnalysis.controller';
import { authMiddleware } from '@/middlewares/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/integrated-analysis/generate:
 *   post:
 *     summary: Gera ou atualiza análise financeira integrada
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2025
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 9
 *               includeNonCashItems:
 *                 type: boolean
 *                 default: true
 *               cycleId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Análise gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/IntegratedAnalysisResult'
 */
router.post('/generate', integratedFinancialAnalysisController.generateAnalysis);

/**
 * @swagger
 * /api/v1/integrated-analysis/period/{year}/{month}:
 *   get:
 *     summary: Busca análise por período específico
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2025
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 9
 *     responses:
 *       200:
 *         description: Análise encontrada
 *       404:
 *         description: Análise não encontrada
 */
router.get('/period/:year/:month', integratedFinancialAnalysisController.getAnalysisByPeriod);

/**
 * @swagger
 * /api/v1/integrated-analysis/year/{year}:
 *   get:
 *     summary: Lista análises de um ano específico
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2025
 *     responses:
 *       200:
 *         description: Lista de análises do ano
 */
router.get('/year/:year', integratedFinancialAnalysisController.getAnalysesByYear);

/**
 * @swagger
 * /api/v1/integrated-analysis/compare:
 *   get:
 *     summary: Análise comparativa entre períodos
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startYear
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2025
 *       - in: query
 *         name: startMonth
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: endYear
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2025
 *       - in: query
 *         name: endMonth
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     responses:
 *       200:
 *         description: Comparação entre períodos
 */
router.get('/compare', integratedFinancialAnalysisController.compareAnalyses);

/**
 * @swagger
 * /api/v1/integrated-analysis/dashboard/{year}:
 *   get:
 *     summary: Dashboard com métricas consolidadas
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2025
 *     responses:
 *       200:
 *         description: Dashboard com KPIs e análises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         totalExpenses:
 *                           type: number
 *                         totalNetIncome:
 *                           type: number
 *                         totalCashFlow:
 *                           type: number
 *                         netMargin:
 *                           type: number
 *                         cashFlowMargin:
 *                           type: number
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                     breakdown:
 *                       type: object
 *                     qualityMetrics:
 *                       type: object
 */
router.get('/dashboard/:year', integratedFinancialAnalysisController.getDashboard);

/**
 * @swagger
 * /api/v1/integrated-analysis/transactions:
 *   get:
 *     summary: Lista todas as transações financeiras sem filtro
 *     tags: [Integrated Financial Analysis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas as transações financeiras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinancialTransaction'
 */
router.get('/transactions', integratedFinancialAnalysisController.getAllTransactions);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     IntegratedAnalysisResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         referenceMonth:
 *           type: string
 *           format: date-time
 *         referenceYear:
 *           type: integer
 *         totalRevenue:
 *           type: number
 *         totalExpenses:
 *           type: number
 *         netIncome:
 *           type: number
 *         cashReceipts:
 *           type: number
 *         cashPayments:
 *           type: number
 *         netCashFlow:
 *           type: number
 *         nonCashItems:
 *           type: number
 *         depreciation:
 *           type: number
 *         biologicalAssetChange:
 *           type: number
 *         reconciliationDifference:
 *           type: number
 *         status:
 *           type: string
 *           enum: [DRAFT, REVIEWING, APPROVED, CLOSED]
 *         cashFlowBreakdown:
 *           type: object
 *           properties:
 *             operating:
 *               type: object
 *               properties:
 *                 receipts:
 *                   type: number
 *                 payments:
 *                   type: number
 *                 net:
 *                   type: number
 *             investing:
 *               type: object
 *               properties:
 *                 receipts:
 *                   type: number
 *                 payments:
 *                   type: number
 *                 net:
 *                   type: number
 *             financing:
 *               type: object
 *               properties:
 *                 receipts:
 *                   type: number
 *                 payments:
 *                   type: number
 *                 net:
 *                   type: number
 *         nonCashBreakdown:
 *           type: object
 *           properties:
 *             depreciation:
 *               type: number
 *             mortality:
 *               type: number
 *             biologicalAdjustments:
 *               type: number
 *             other:
 *               type: number
 *         reconciliation:
 *           type: object
 *           properties:
 *             netIncome:
 *               type: number
 *             nonCashAdjustments:
 *               type: number
 *             netCashFlow:
 *               type: number
 *             difference:
 *               type: number
 *         items:
 *           type: array
 *           items:
 *             type: object
 */