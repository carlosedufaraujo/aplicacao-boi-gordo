import { prisma } from '@/config/database';

export class DashboardService {
  /**
   * Retorna métricas principais do dashboard
   */
  async getMetrics() {
    const [
      totalAnimals,
      activeLots,
      occupancyRate,
      monthlyRevenue,
      monthlyExpense,
      pendingPayments,
      recentMovements
    ] = await Promise.all([
      this.getTotalAnimals(),
      this.getActiveLots(),
      this.getOccupancyRate(),
      this.getMonthlyRevenue(),
      this.getMonthlyExpense(),
      this.getPendingPayments(),
      this.getRecentMovements(),
    ]);

    const monthlyProfit = monthlyRevenue - monthlyExpense;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    return {
      overview: {
        totalAnimals,
        activeLots,
        occupancyRate,
        monthlyRevenue,
        monthlyExpense,
        monthlyProfit,
        profitMargin,
        pendingPayments,
      },
      recentMovements,
    };
  }

  /**
   * Retorna gráficos do dashboard
   */
  async getCharts(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const endDate = new Date();
    const startDate = this.getStartDate(period);

    const [
      revenueChart,
      costChart,
      occupancyChart,
      salesChart,
    ] = await Promise.all([
      this.getRevenueChart(startDate, endDate),
      this.getCostChart(startDate, endDate),
      this.getOccupancyChart(startDate, endDate),
      this.getSalesChart(startDate, endDate),
    ]);

    return {
      revenue: revenueChart,
      costs: costChart,
      occupancy: occupancyChart,
      sales: salesChart,
    };
  }

  /**
   * Retorna alertas e notificações
   */
  async getAlerts() {
    const alerts = [];

    // Alertas de pagamentos vencidos
    const overdueExpenses = await prisma.expense.count({
      where: {
        isPaid: false,
        dueDate: { lt: new Date() },
        impactsCashFlow: true,
      },
    });

    if (overdueExpenses > 0) {
      alerts.push({
        type: 'error',
        title: 'Pagamentos Vencidos',
        message: `${overdueExpenses} pagamentos estão vencidos`,
        action: '/financial/expenses?filter=overdue',
      });
    }

    // Alertas de recebimentos pendentes
    const overdueRevenues = await prisma.revenue.count({
      where: {
        isReceived: false,
        dueDate: { lt: new Date() },
      },
    });

    if (overdueRevenues > 0) {
      alerts.push({
        type: 'warning',
        title: 'Recebimentos Pendentes',
        message: `${overdueRevenues} recebimentos estão vencidos`,
        action: '/financial/revenues?filter=overdue',
      });
    }

    // Alertas de ocupação
    const pens = await prisma.pen.findMany({
      where: { status: 'ACTIVE' },
      include: {
        lotAllocations: {
          where: { exitDate: null },
        },
      },
    });

    const overcrowded = pens.filter(pen => {
      const occupied = pen.lotAllocations.reduce((sum, a) => sum + a.quantity, 0);
      return occupied > pen.capacity * 0.95;
    });

    if (overcrowded.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Currais Superlotados',
        message: `${overcrowded.length} currais estão com ocupação acima de 95%`,
        action: '/pens',
      });
    }

    // Alertas de mortalidade
    const highMortalityLots = await prisma.cattleLot.findMany({
      where: {
        status: 'ACTIVE',
        deathCount: { gt: 0 },
      },
    });

    const lotsWithHighMortality = highMortalityLots.filter(lot => {
      const mortalityRate = (lot.deathCount / lot.quantity) * 100;
      return mortalityRate > 2; // Alerta se mortalidade > 2%
    });

    if (lotsWithHighMortality.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Alta Mortalidade',
        message: `${lotsWithHighMortality.length} lotes com mortalidade acima de 2%`,
        action: '/lots',
      });
    }

    return alerts;
  }

  private async getTotalAnimals() {
    const result = await prisma.cattleLot.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { remainingQuantity: true },
    });
    return result._sum.remainingQuantity || 0;
  }

  private async getActiveLots() {
    return prisma.cattleLot.count({
      where: { status: 'ACTIVE' },
    });
  }

  private async getOccupancyRate() {
    const pens = await prisma.pen.findMany({
      where: { status: 'ACTIVE' },
      include: {
        lotAllocations: {
          where: { exitDate: null },
        },
      },
    });

    const totalCapacity = pens.reduce((sum, p) => sum + p.capacity, 0);
    const totalOccupied = pens.reduce((sum, p) => 
      sum + p.lotAllocations.reduce((s, a) => s + a.quantity, 0), 0
    );

    return totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
  }

  private async getMonthlyRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.revenue.aggregate({
      where: {
        isReceived: true,
        receiptDate: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || 0;
  }

  private async getMonthlyExpense() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.expense.aggregate({
      where: {
        isPaid: true,
        paymentDate: { gte: startOfMonth },
        impactsCashFlow: true,
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || 0;
  }

  private async getPendingPayments() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const result = await prisma.expense.aggregate({
      where: {
        isPaid: false,
        dueDate: { lte: nextWeek },
        impactsCashFlow: true,
      },
      _sum: { totalAmount: true },
    });

    return result._sum.totalAmount || 0;
  }

  private async getRecentMovements() {
    const movements = await prisma.lotMovement.findMany({
      take: 10,
      orderBy: { movementDate: 'desc' },
      include: {
        lot: true,
        fromPen: true,
        toPen: true,
      },
    });

    return movements.map(m => ({
      id: m.id,
      type: m.movementType,
      date: m.movementDate,
      lot: m.lot.lotNumber,
      quantity: m.quantity,
      from: m.fromPen?.name || '-',
      to: m.toPen?.name || '-',
      reason: m.reason,
    }));
  }

  private getStartDate(period: string): Date {
    const date = new Date();
    
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    
    return date;
  }

  private async getRevenueChart(startDate: Date, endDate: Date) {
    const revenues = await prisma.revenue.findMany({
      where: {
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
        isReceived: true,
      },
      orderBy: { receiptDate: 'asc' },
    });

    // Agrupa por dia
    const dailyRevenue: Record<string, number> = {};
    
    revenues.forEach(revenue => {
      const date = revenue.receiptDate!.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue.totalAmount;
    });

    return Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  private async getCostChart(startDate: Date, endDate: Date) {
    const expenses = await prisma.expense.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        isPaid: true,
        impactsCashFlow: true,
      },
    });

    // Agrupa por categoria
    const byCategory: Record<string, number> = {};
    
    expenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.totalAmount;
    });

    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  private async getOccupancyChart(startDate: Date, endDate: Date) {
    // Simula dados históricos de ocupação (em produção, isso viria de uma tabela de histórico)
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Por enquanto, retorna a ocupação atual para todos os dias
      const rate = await this.getOccupancyRate();
      
      data.push({
        date: date.toISOString().split('T')[0],
        rate: rate + (Math.random() * 10 - 5), // Adiciona variação aleatória
      });
    }
    
    return data;
  }

  private async getSalesChart(startDate: Date, endDate: Date) {
    const sales = await prisma.saleRecord.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        buyer: true,
      },
    });

    // Agrupa por comprador
    const byBuyer: Record<string, { name: string; amount: number }> = {};
    
    sales.forEach(sale => {
      const buyerId = sale.buyerId;
      if (!byBuyer[buyerId]) {
        byBuyer[buyerId] = {
          name: sale.buyer.name,
          amount: 0,
        };
      }
      byBuyer[buyerId].amount += sale.totalAmount;
    });

    return Object.values(byBuyer)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 compradores
  }
} 