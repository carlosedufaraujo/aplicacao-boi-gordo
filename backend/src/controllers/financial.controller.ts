import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { FinancialIntegrationService } from '@/services/financialIntegration.service';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export class FinancialController {
  private financialService: FinancialIntegrationService;

  constructor() {
    this.financialService = new FinancialIntegrationService();
  }

  /**
   * GET /api/v1/financial/dashboard
   * Retorna dados consolidados para o dashboard financeiro
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());
      const previousStart = subMonths(start, 1);
      const previousEnd = subMonths(end, 1);

      // Buscar dados do período atual
      const [expenses, revenues, activeLots] = await Promise.all([
        prisma.expense.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          }
        }),
        prisma.revenue.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          }
        }),
        prisma.cattlePurchase.count({
          where: {
            status: {
              in: ['QUARANTINE', 'CONFINED', 'READY_FOR_SALE']
            }
          }
        })
      ]);

      // Buscar dados do período anterior para comparação
      const [previousExpenses, previousRevenues] = await Promise.all([
        prisma.expense.aggregate({
          where: {
            competenceDate: {
              gte: previousStart,
              lte: previousEnd
            }
          },
          _sum: {
            totalAmount: true
          }
        }),
        prisma.revenue.aggregate({
          where: {
            competenceDate: {
              gte: previousStart,
              lte: previousEnd
            }
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      // Calcular métricas
      const totalExpenses = expenses._sum.totalAmount || 0;
      const totalRevenue = revenues._sum.totalAmount || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const previousTotalExpenses = previousExpenses._sum.totalAmount || 0;
      const previousTotalRevenue = previousRevenues._sum.totalAmount || 0;
      const previousNetProfit = previousTotalRevenue - previousTotalExpenses;

      // Calcular ROI médio dos lotes
      const lotProfitability = await prisma.lotProfitability.aggregate({
        where: {
          status: 'SOLD'
        },
        _avg: {
          roi: true
        }
      });

      // Calcular variações
      const expenseChange = previousTotalExpenses > 0 
        ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100 
        : 0;
      const revenueChange = previousTotalRevenue > 0 
        ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
        : 0;
      const profitChange = previousNetProfit !== 0 
        ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100 
        : 0;

      res.json({
        status: 'success',
        data: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          averageRoi: lotProfitability._avg.roi || 0,
          activeLots,
          revenueChange,
          expenseChange,
          profitChange,
          marginChange: profitMargin - (previousTotalRevenue > 0 ? (previousNetProfit / previousTotalRevenue) * 100 : 0),
          roiChange: 0, // Calcular baseado em histórico
          lotsChange: 0 // Calcular baseado em histórico
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar dashboard financeiro:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar dados do dashboard'
      });
    }
  }

  /**
   * GET /api/v1/financial/lot-profitability
   * Retorna análise de rentabilidade por lote
   */
  async getLotProfitability(req: Request, res: Response): Promise<void> {
    try {
      const profitability = await prisma.lotProfitability.findMany({
        include: {
          purchase: {
            select: {
              lotCode: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const items = profitability.map(lot => ({
        id: lot.id,
        purchaseId: lot.purchaseId,
        lotCode: lot.purchase.lotCode,
        purchaseCost: lot.purchaseCost,
        transportCost: lot.transportCost,
        feedCost: lot.feedCost,
        veterinaryCost: lot.veterinaryCost,
        laborCost: lot.laborCost,
        overheadCost: lot.overheadCost,
        totalCost: lot.totalCost,
        saleRevenue: lot.saleRevenue,
        otherRevenue: lot.otherRevenue,
        totalRevenue: lot.totalRevenue,
        grossProfit: lot.grossProfit,
        netProfit: lot.netProfit,
        profitMargin: lot.profitMargin,
        roi: lot.roi,
        costPerAnimal: lot.costPerAnimal,
        revenuePerAnimal: lot.revenuePerAnimal,
        profitPerAnimal: lot.profitPerAnimal,
        costPerArroba: lot.costPerArroba,
        revenuePerArroba: lot.revenuePerArroba,
        profitPerArroba: lot.profitPerArroba,
        startDate: lot.startDate,
        endDate: lot.endDate,
        daysInOperation: lot.daysInOperation,
        status: lot.status
      }));

      res.json({
        status: 'success',
        data: {
          items,
          total: items.length
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar rentabilidade dos lotes:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar rentabilidade'
      });
    }
  }

  /**
   * GET /api/v1/financial/cash-flow
   * Retorna projeção de fluxo de caixa
   */
  async getCashFlow(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

      // Buscar despesas e receitas do período
      const [expenses, revenues] = await Promise.all([
        prisma.expense.findMany({
          where: {
            dueDate: {
              gte: start,
              lte: end
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        }),
        prisma.revenue.findMany({
          where: {
            dueDate: {
              gte: start,
              lte: end
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        })
      ]);

      // Agrupar por dia
      const dailyFlow = new Map<string, { entrada: number; saida: number; saldo: number }>();
      let runningBalance = 0;

      // Processar despesas
      expenses.forEach(expense => {
        const date = expense.dueDate.toISOString().split('T')[0];
        if (!dailyFlow.has(date)) {
          dailyFlow.set(date, { entrada: 0, saida: 0, saldo: 0 });
        }
        const day = dailyFlow.get(date)!;
        day.saida += expense.totalAmount;
      });

      // Processar receitas
      revenues.forEach(revenue => {
        const date = revenue.dueDate.toISOString().split('T')[0];
        if (!dailyFlow.has(date)) {
          dailyFlow.set(date, { entrada: 0, saida: 0, saldo: 0 });
        }
        const day = dailyFlow.get(date)!;
        day.entrada += revenue.totalAmount;
      });

      // Calcular saldo acumulado
      const items = Array.from(dailyFlow.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, flow]) => {
          runningBalance += flow.entrada - flow.saida;
          return {
            date,
            entrada: flow.entrada,
            saida: flow.saida,
            saldo: runningBalance
          };
        });

      res.json({
        status: 'success',
        data: {
          items
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar fluxo de caixa:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar fluxo de caixa'
      });
    }
  }

  /**
   * POST /api/v1/financial/integrate-purchase
   * Integra uma compra com o financeiro
   */
  async integratePurchase(req: Request, res: Response): Promise<void> {
    try {
      const { purchaseId } = req.body;
      
      if (!purchaseId) {
        res.status(400).json({
          status: 'error',
          message: 'ID da compra é obrigatório'
        });
        return;
      }

      await this.financialService.integratePurchase(purchaseId);
      
      res.json({
        status: 'success',
        message: 'Compra integrada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao integrar compra:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao integrar compra'
      });
    }
  }

  /**
   * POST /api/v1/financial/integrate-sale
   * Integra uma venda com o financeiro
   */
  async integrateSale(req: Request, res: Response): Promise<void> {
    try {
      const { saleId } = req.body;
      
      if (!saleId) {
        res.status(400).json({
          status: 'error',
          message: 'ID da venda é obrigatório'
        });
        return;
      }

      await this.financialService.integrateSale(saleId);
      
      res.json({
        status: 'success',
        message: 'Venda integrada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao integrar venda:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao integrar venda'
      });
    }
  }

  /**
   * POST /api/v1/financial/integrate-intervention
   * Integra uma intervenção com o financeiro
   */
  async integrateIntervention(req: Request, res: Response): Promise<void> {
    try {
      const { interventionId } = req.body;
      
      if (!interventionId) {
        res.status(400).json({
          status: 'error',
          message: 'ID da intervenção é obrigatório'
        });
        return;
      }

      await this.financialService.integrateIntervention(interventionId);
      
      res.json({
        status: 'success',
        message: 'Intervenção integrada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao integrar intervenção:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao integrar intervenção'
      });
    }
  }

  /**
   * POST /api/v1/financial/allocate-global
   * Realiza rateio de despesas globais
   */
  async allocateGlobalExpenses(req: Request, res: Response): Promise<void> {
    try {
      await this.financialService.allocateGlobalExpenses();
      
      res.json({
        status: 'success',
        message: 'Despesas globais alocadas com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alocar despesas globais:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao alocar despesas globais'
      });
    }
  }

  /**
   * GET /api/v1/financial/summary
   * Retorna resumo financeiro consolidado
   */
  async getFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month' } = req.query;
      
      // Definir período baseado no parâmetro
      let start: Date;
      let end: Date = new Date();
      
      switch (period) {
        case 'week':
          start = new Date();
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start = startOfMonth(new Date());
          end = endOfMonth(new Date());
          break;
        case 'quarter':
          start = new Date();
          start.setMonth(start.getMonth() - 3);
          break;
        case 'year':
          start = new Date();
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start = startOfMonth(new Date());
      }

      // Buscar totais
      const [
        totalExpenses,
        paidExpenses,
        totalRevenues,
        receivedRevenues,
        expensesByCategory,
        revenuesByCategory
      ] = await Promise.all([
        // Total de despesas
        prisma.expense.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        }),
        // Despesas pagas
        prisma.expense.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            },
            isPaid: true
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        }),
        // Total de receitas
        prisma.revenue.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        }),
        // Receitas recebidas
        prisma.revenue.aggregate({
          where: {
            competenceDate: {
              gte: start,
              lte: end
            },
            isReceived: true
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        }),
        // Despesas por categoria
        prisma.expense.groupBy({
          by: ['category'],
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        }),
        // Receitas por categoria
        prisma.revenue.groupBy({
          by: ['category'],
          where: {
            competenceDate: {
              gte: start,
              lte: end
            }
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        })
      ]);

      res.json({
        status: 'success',
        data: {
          expenses: {
            total: totalExpenses._sum.totalAmount || 0,
            paid: paidExpenses._sum.totalAmount || 0,
            pending: (totalExpenses._sum.totalAmount || 0) - (paidExpenses._sum.totalAmount || 0),
            count: totalExpenses._count,
            paidCount: paidExpenses._count,
            byCategory: expensesByCategory.map(cat => ({
              category: cat.category,
              amount: cat._sum.totalAmount || 0,
              count: cat._count
            }))
          },
          revenues: {
            total: totalRevenues._sum.totalAmount || 0,
            received: receivedRevenues._sum.totalAmount || 0,
            pending: (totalRevenues._sum.totalAmount || 0) - (receivedRevenues._sum.totalAmount || 0),
            count: totalRevenues._count,
            receivedCount: receivedRevenues._count,
            byCategory: revenuesByCategory.map(cat => ({
              category: cat.category,
              amount: cat._sum.totalAmount || 0,
              count: cat._count
            }))
          },
          balance: {
            gross: (totalRevenues._sum.totalAmount || 0) - (totalExpenses._sum.totalAmount || 0),
            net: (receivedRevenues._sum.totalAmount || 0) - (paidExpenses._sum.totalAmount || 0)
          },
          period: {
            start,
            end,
            type: period as string
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar resumo financeiro:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar resumo financeiro'
      });
    }
  }
}