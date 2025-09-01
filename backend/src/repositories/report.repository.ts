import { prisma } from '@/config/database';

export class ReportRepository {
  /**
   * Relatório de DRE (Demonstração de Resultados)
   */
  async generateDRE(startDate: Date, endDate: Date, entityType?: 'LOT' | 'PEN', entityId?: string) {
    // Busca receitas
    const revenueWhere: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (entityType && entityId) {
      revenueWhere.allocations = {
        some: {
          entityType,
          entityId,
        },
      };
    }

    const revenues = await prisma.revenue.findMany({
      where: revenueWhere,
      include: {
        allocations: true,
      },
    });

    // Busca despesas
    const expenseWhere: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (entityType && entityId) {
      expenseWhere.allocations = {
        some: {
          entityType,
          entityId,
        },
      };
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      include: {
        allocations: true,
      },
    });

    // Calcula totais por categoria
    const revenueByCategory = this.groupByCategory(revenues, 'revenue', entityType, entityId);
    const expenseByCategory = this.groupByCategory(expenses, 'expense', entityType, entityId);

    // Calcula totais gerais
    const totalRevenue = Object.values(revenueByCategory).reduce((sum: number, cat: any) => sum + cat.total, 0);
    const totalExpense = Object.values(expenseByCategory).reduce((sum: number, cat: any) => sum + cat.total, 0);
    const grossProfit = totalRevenue - totalExpense;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      period: {
        startDate,
        endDate,
      },
      entity: entityType && entityId ? { type: entityType, id: entityId } : null,
      revenue: {
        byCategory: revenueByCategory,
        total: totalRevenue,
      },
      expense: {
        byCategory: expenseByCategory,
        total: totalExpense,
      },
      results: {
        grossProfit,
        margin,
        roi: totalExpense > 0 ? (grossProfit / totalExpense) * 100 : 0,
      },
    };
  }

  /**
   * Relatório de Fluxo de Caixa
   */
  async generateCashFlow(startDate: Date, endDate: Date, accountId?: string) {
    const where: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (accountId) {
      where.payerAccountId = accountId;
    }

    // Busca entradas (receitas)
    const revenues = await prisma.revenue.findMany({
      where,
      include: {
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // Busca saídas (despesas)
    const expenses = await prisma.expense.findMany({
      where: {
        ...where,
        impactsCashFlow: true,
      },
      include: {
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // Busca aportes
    const contributions = await prisma.financialContribution.findMany({
      where: {
        contributionDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(accountId ? { payerAccountId: accountId } : {}),
      },
      include: {
        partner: true,
        payerAccount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa por dia
    const dailyFlow = this.generateDailyFlow(revenues, expenses, contributions, startDate, endDate);

    // Calcula totais
    const totalInflow = revenues.reduce((sum: number, r: any) => sum + (r.isReceived ? r.totalAmount : 0), 0) +
                       contributions.reduce((sum: number, c: any) => sum + c.amount, 0);
    const totalOutflow = expenses.reduce((sum: number, e) => sum + (e.isPaid ? e.totalAmount : 0), 0);
    const netFlow = totalInflow - totalOutflow;

    return {
      period: {
        startDate,
        endDate,
      },
      account: accountId || 'all',
      dailyFlow,
      summary: {
        totalInflow,
        totalOutflow,
        netFlow,
        pendingInflow: revenues.reduce((sum: number, r) => sum + (!r.isReceived ? r.totalAmount : 0), 0),
        pendingOutflow: expenses.reduce((sum: number, e) => sum + (!e.isPaid ? e.totalAmount : 0), 0),
      },
    };
  }

  /**
   * Relatório de Performance por Lote
   */
  async generateLotPerformance(lotId?: string) {
    const where = lotId ? { id: lotId } : {};

    const lots = await prisma.cattlePurchase.findMany({
      where,
      include: {
        vendor: true,
        saleRecords: {
          include: {
            buyer: true,
          },
        },
        expenses: true,
        penAllocations: {
          include: {
            pen: true,
          },
        },
        movements: true,
      },
    });

    return lots.map((lot: any) => {
      const totalSales = lot.saleRecords.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
      const totalExpenses = lot.totalCost;
      const profit = totalSales - totalExpenses;
      
      const soldQuantity = lot.saleRecords
        .filter((s: any) => s.status !== 'CANCELLED')
        .reduce((sum: number, s: any) => sum + s.quantity, 0);
      
      const avgSalePrice = soldQuantity > 0 ? totalSales / soldQuantity : 0;
      const avgPurchasePrice = lot.currentQuantity > 0 ? lot.purchaseCost / lot.currentQuantity : 0;

      return {
        lot: {
          id: lot.id,
          lotNumber: lot.lotCode,
          status: lot.status,
          entryDate: lot.entryDate,
        },
        vendor: lot.vendor,
        quantities: {
          initial: lot.currentQuantity,
          current: lot.remainingQuantity,
          sold: soldQuantity,
          deaths: lot.deathCount,
        },
        financials: {
          purchaseCost: lot.purchaseCost,
          totalCost: lot.totalCost,
          totalSales,
          profit,
          margin: totalSales > 0 ? (profit / totalSales) * 100 : 0,
          roi: totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0,
        },
        averages: {
          purchasePrice: avgPurchasePrice,
          salePrice: avgSalePrice,
          costPerHead: lot.currentQuantity > 0 ? lot.totalCost / lot.currentQuantity : 0,
          profitPerHead: soldQuantity > 0 ? profit / soldQuantity : 0,
        },
        timeline: {
          daysInConfinement: Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
          averageDailyGain: lot.currentWeight > lot.entryWeight 
            ? (lot.currentWeight - lot.entryWeight) / lot.currentQuantity / 
              Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        },
      };
    });
  }

  /**
   * Relatório de Ocupação de Currais
   */
  async generatePenOccupancy() {
    const pens = await prisma.pen.findMany({
      include: {
        lotAllocations: {
          where: {
            removalDate: null,
          },
          include: { 
            purchase: {
              include: {
                vendor: true
              }
            }
          }
        }
      }
    });

    const totalCapacity = pens.reduce((sum: number, p: any) => sum + p.capacity, 0);
    const totalOccupied = pens.reduce((sum: number, p: any) => 
      sum + p.lotAllocations.reduce((s: number, a: any) => s + a.quantity, 0), 0
    );

    return {
      summary: {
        totalPens: pens.length,
        activePens: pens.filter((p: any) => p.status === 'ACTIVE').length,
        totalCapacity,
        totalOccupied,
        occupancyRate: totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0,
      },
      pens: pens.map((pen: any) => {
        const occupied = pen.lotAllocations.reduce((sum: number, a: any) => sum + a.quantity, 0);
        return {
          id: pen.id,
          name: pen.name,
          type: pen.type,
          status: pen.status,
          capacity: pen.capacity,
          occupied,
          available: pen.capacity - occupied,
          occupancyRate: pen.capacity > 0 ? (occupied / pen.capacity) * 100 : 0,
          lots: pen.lotAllocations.map((a: any) => ({
            lotId: a.purchase.id,
            lotNumber: a.purchase.lotCode,
            quantity: a.quantity,
            entryDate: a.allocationDate,
            daysInPen: Math.floor((new Date().getTime() - a.allocationDate.getTime()) / (1000 * 60 * 60 * 24)),
          })),
        };
      }),
    };
  }

  private groupByCategory(items: any[], type: 'revenue' | 'expense', entityType?: string, entityId?: string) {
    const grouped: Record<string, any> = {};

    items.forEach(item => {
      // Se tem filtro de entidade, calcula apenas o valor alocado
      let amount = item.totalAmount;
      if (entityType && entityId && item.allocations.length > 0) {
        const allocation = item.allocations.find((a: any) => 
          a.entityType === entityType && a.entityId === entityId
        );
        amount = allocation ? allocation.allocatedAmount : 0;
      }

      if (!grouped[item.category]) {
        grouped[item.category] = {
          category: item.category,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
        };
      }

      grouped[item.category].total += amount;
      grouped[item.category].count++;

      const isPaidField = type === 'revenue' ? 'isReceived' : 'isPaid';
      if (item[isPaidField]) {
        grouped[item.category].paid += amount;
      } else {
        grouped[item.category].pending += amount;
      }
    });

    return grouped;
  }

  private generateDailyFlow(revenues: any[], expenses: any[], contributions: any[], startDate: Date, endDate: Date) {
    const dailyMap: Record<string, any> = {};
    
    // Inicializa todos os dias do período
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyMap[dateKey] = {
        date: dateKey,
        inflow: 0,
        outflow: 0,
        balance: 0,
        details: {
          revenues: [],
          expenses: [],
          contributions: [],
        },
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adiciona receitas
    revenues.forEach(revenue => {
      const dateKey = revenue.dueDate.toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        if (revenue.isReceived) {
          dailyMap[dateKey].inflow += revenue.totalAmount;
        }
        dailyMap[dateKey].details.revenues.push({
          id: revenue.id,
          description: revenue.description,
          amount: revenue.totalAmount,
          received: revenue.isReceived,
        });
      }
    });

    // Adiciona despesas
    expenses.forEach(expense => {
      const dateKey = expense.dueDate.toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        if (expense.isPaid) {
          dailyMap[dateKey].outflow += expense.totalAmount;
        }
        dailyMap[dateKey].details.expenses.push({
          id: expense.id,
          description: expense.description,
          amount: expense.totalAmount,
          paid: expense.isPaid,
        });
      }
    });

    // Adiciona aportes
    contributions.forEach(contribution => {
      const dateKey = contribution.contributionDate.toISOString().split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].inflow += contribution.amount;
        dailyMap[dateKey].details.contributions.push({
          id: contribution.id,
          partner: contribution.partner.name,
          amount: contribution.amount,
        });
      }
    });

    // Calcula saldo diário
    Object.values(dailyMap).forEach(day => {
      day.balance = day.inflow - day.outflow;
    });

    return Object.values(dailyMap);
  }
} 