import { Request, Response } from 'express';
import { integratedFinancialAnalysisService } from '@/services/integratedFinancialAnalysis.service';

export class IntegratedFinancialAnalysisController {
  
  /**
   * Gera ou atualiza análise financeira integrada para um período
   * POST /api/v1/integrated-analysis/generate
   */
  async generateAnalysis(req: Request, res: Response) {
    try {
      const { year, month, includeNonCashItems = true, cycleId } = req.body;
      
      if (!year || !month) {
        return res.status(400).json({
          status: 'error',
          message: 'Ano e mês são obrigatórios'
        });
      }
      
      const referenceMonth = new Date(Date.UTC(year, month - 1, 1)); // UTC para evitar problemas de timezone
      // Em desenvolvimento, não usar userId se não for um UUID válido
      const userId = req.user?.id;
      const validUserId = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? userId : undefined;
      
      const analysis = await integratedFinancialAnalysisService.createOrUpdateAnalysis({
        referenceMonth,
        includeNonCashItems,
        cycleId
      }, validUserId);
      
      res.status(200).json({
        status: 'success',
        message: 'Análise financeira integrada gerada com sucesso',
        data: analysis
      });
      
    } catch (error: any) {
      console.error('Erro ao gerar análise integrada:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Busca análise por período específico
   * GET /api/v1/integrated-analysis/period/:year/:month
   */
  async getAnalysisByPeriod(req: Request, res: Response) {
    try {
      const { year, month } = req.params;
      
      if (!year || !month) {
        return res.status(400).json({
          status: 'error',
          message: 'Ano e mês são obrigatórios'
        });
      }
      
      const referenceMonth = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
      
      const analysis = await integratedFinancialAnalysisService.getAnalysisByPeriod(referenceMonth);
      
      if (!analysis) {
        return res.status(404).json({
          status: 'error',
          message: 'Análise não encontrada para o período especificado',
          data: null
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: analysis
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar análise:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Lista análises de um ano específico
   * GET /api/v1/integrated-analysis/year/:year
   */
  async getAnalysesByYear(req: Request, res: Response) {
    try {
      const { year } = req.params;
      
      if (!year) {
        return res.status(400).json({
          status: 'error',
          message: 'Ano é obrigatório'
        });
      }
      
      const analyses = await integratedFinancialAnalysisService.getAnalysesByYear(parseInt(year));
      
      res.status(200).json({
        status: 'success',
        data: analyses
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar análises do ano:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Análise comparativa entre períodos
   * GET /api/v1/integrated-analysis/compare
   */
  async compareAnalyses(req: Request, res: Response) {
    try {
      const { startYear, startMonth, endYear, endMonth } = req.query;
      
      if (!startYear || !startMonth || !endYear || !endMonth) {
        return res.status(400).json({
          status: 'error',
          message: 'Período inicial e final são obrigatórios'
        });
      }
      
      const startDate = new Date(parseInt(startYear as string), parseInt(startMonth as string) - 1, 1);
      const endDate = new Date(parseInt(endYear as string), parseInt(endMonth as string) - 1, 1);
      
      const comparisons = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const analysis = await integratedFinancialAnalysisService.getAnalysisByPeriod(currentDate);
        if (analysis) {
          comparisons.push({
            period: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`,
            ...analysis
          });
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Calcular métricas de comparação
      const totalRevenue = comparisons.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalExpenses = comparisons.reduce((sum, c) => sum + c.totalExpenses, 0);
      const totalNetIncome = comparisons.reduce((sum, c) => sum + c.netIncome, 0);
      const totalCashFlow = comparisons.reduce((sum, c) => sum + c.netCashFlow, 0);
      
      res.status(200).json({
        status: 'success',
        data: {
          periods: comparisons,
          summary: {
            totalRevenue,
            totalExpenses,
            totalNetIncome,
            totalCashFlow,
            averageMonthlyRevenue: totalRevenue / comparisons.length,
            averageMonthlyExpenses: totalExpenses / comparisons.length,
            averageMonthlyNetIncome: totalNetIncome / comparisons.length,
            averageMonthlyCashFlow: totalCashFlow / comparisons.length
          }
        }
      });
      
    } catch (error: any) {
      console.error('Erro ao comparar análises:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
  
  /**
   * Dashboard com métricas consolidadas
   * GET /api/v1/integrated-analysis/dashboard/:year
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const { year } = req.params;
      
      if (!year) {
        return res.status(400).json({
          status: 'error',
          message: 'Ano é obrigatório'
        });
      }
      
      const analyses = await integratedFinancialAnalysisService.getAnalysesByYear(parseInt(year));
      
      if (analyses.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Nenhuma análise encontrada para o ano especificado',
          data: null
        });
      }
      
      // Calcular KPIs
      const totalRevenue = analyses.reduce((sum, a) => sum + a.totalRevenue, 0);
      const totalExpenses = analyses.reduce((sum, a) => sum + a.totalExpenses, 0);
      const totalNetIncome = analyses.reduce((sum, a) => sum + a.netIncome, 0);
      const totalCashFlow = analyses.reduce((sum, a) => sum + a.netCashFlow, 0);
      const totalNonCashItems = analyses.reduce((sum, a) => sum + a.nonCashItems, 0);
      
      // Análise de tendências
      const monthlyTrends = analyses.map((a, index) => ({
        month: index + 1,
        revenue: a.totalRevenue,
        expenses: a.totalExpenses,
        netIncome: a.netIncome,
        cashFlow: a.netCashFlow,
        reconciliationDifference: a.reconciliationDifference
      }));
      
      // Breakdown por categoria
      const categoryBreakdown = {
        cashRevenue: analyses.reduce((sum, a) => sum + a.cashReceipts, 0),
        cashExpenses: analyses.reduce((sum, a) => sum + a.cashPayments, 0),
        depreciation: analyses.reduce((sum, a) => sum + a.depreciation, 0),
        biologicalChanges: analyses.reduce((sum, a) => sum + Math.abs(a.biologicalAssetChange), 0),
        mortality: analyses.reduce((sum, a) => sum + a.nonCashBreakdown.mortality, 0)
      };
      
      // Qualidade dos resultados
      const qualityMetrics = {
        cashConversionRate: totalCashFlow / totalNetIncome,
        nonCashPortion: totalNonCashItems / totalRevenue,
        reconciliationAccuracy: 1 - (analyses.reduce((sum, a) => sum + Math.abs(a.reconciliationDifference), 0) / totalNetIncome)
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          summary: {
            totalRevenue,
            totalExpenses,
            totalNetIncome,
            totalCashFlow,
            totalNonCashItems,
            netMargin: (totalNetIncome / totalRevenue) * 100,
            cashFlowMargin: (totalCashFlow / totalRevenue) * 100
          },
          trends: monthlyTrends,
          breakdown: categoryBreakdown,
          qualityMetrics,
          analyses: analyses.map(a => ({
            referenceMonth: a.referenceMonth,
            totalRevenue: a.totalRevenue,
            totalExpenses: a.totalExpenses,
            netIncome: a.netIncome,
            netCashFlow: a.netCashFlow,
            reconciliationDifference: a.reconciliationDifference,
            status: a.status
          }))
        }
      });
      
    } catch (error: any) {
      console.error('Erro ao gerar dashboard:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Busca todas as transações financeiras sem filtro
   * GET /api/v1/integrated-analysis/transactions
   */
  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await integratedFinancialAnalysisService.getAllFinancialTransactions();
      
      res.status(200).json({
        status: 'success',
        data: transactions
      });
      
    } catch (error: any) {
      console.error('Erro ao buscar todas as transações:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
}

export const integratedFinancialAnalysisController = new IntegratedFinancialAnalysisController();