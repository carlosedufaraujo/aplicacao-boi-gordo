import { Revenue, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
// import { prisma } from '@/config/database';

export class RevenueRepository extends BaseRepository<Revenue> {
  constructor() {
    super('revenue');
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        costCenter: true,
        payerAccount: true,
      },
    });
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    const where: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      ...filters,
    };

    return this.model.findMany({
      where,
      include: {
        costCenter: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findPending(daysAhead?: number) {
    const where: any = {
      isReceived: false,
    };

    if (daysAhead) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      where.dueDate = {
        lte: futureDate,
      };
    }

    return this.model.findMany({
      where,
      include: {
        costCenter: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdue() {
    return this.model.findMany({
      where: {
        isReceived: false,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        costCenter: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async receiveRevenue(id: string, receiptData: { receiptDate: Date; payerAccountId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const revenue = await tx.revenue.findUnique({
        where: { id },
      });

      if (!revenue) {
        throw new Error('Receita não encontrada');
      }

      if (revenue.isReceived) {
        throw new Error('Receita já recebida');
      }

      // Atualiza a receita
      const updatedRevenue = await tx.revenue.update({
        where: { id },
        data: {
          isReceived: true,
          receiptDate: receiptData.receiptDate,
          payerAccountId: receiptData.payerAccountId || revenue.payerAccountId,
        },
      });

      // Atualiza saldo da conta
      if (revenue.payerAccountId) {
        await tx.payerAccount.update({
          where: { id: revenue.payerAccountId },
          data: {
            balance: {
              increment: revenue.totalAmount,
            },
          },
        });
      }

      return updatedRevenue;
    });
  }

  async getRevenuesByCategory(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const revenues = await this.model.findMany({
      where: {
        dueDate: dateFilter,
      },
    });

    // Agrupa por categoria
    const byCategory = revenues.reduce((acc: any, revenue: any) => {
      if (!acc[revenue.category]) {
        acc[revenue.category] = {
          category: revenue.category,
          total: 0,
          received: 0,
          pending: 0,
          count: 0,
        };
      }

      acc[revenue.category].total += revenue.totalAmount;
      acc[revenue.category].count++;

      if (revenue.isReceived) {
        acc[revenue.category].received += revenue.totalAmount;
      } else {
        acc[revenue.category].pending += revenue.totalAmount;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(byCategory);
  }

  async getRevenuesByCostCenter(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const revenues = await this.model.findMany({
      where: {
        dueDate: dateFilter,
      },
      include: {
        costCenter: true,
      },
    });

    // Agrupa por centro de custo
    const byCostCenter = revenues.reduce((acc: any, revenue: any) => {
      const centerName = revenue.costCenter?.name || 'Sem Centro de Custo';
      const centerId = revenue.costCenterId || 'no-center';

      if (!acc[centerId]) {
        acc[centerId] = {
          id: centerId,
          name: centerName,
          total: 0,
          received: 0,
          pending: 0,
          count: 0,
        };
      }

      acc[centerId].total += revenue.totalAmount;
      acc[centerId].count++;

      if (revenue.isReceived) {
        acc[centerId].received += revenue.totalAmount;
      } else {
        acc[centerId].pending += revenue.totalAmount;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(byCostCenter);
  }

  async createWithAllocations(data: Prisma.RevenueCreateInput, allocations?: Array<{
    entityType: 'LOT' | 'PEN' | 'GLOBAL';
    entityId: string;
    allocatedAmount: number;
    percentage: number;
  }>) {
    return this.prisma.$transaction(async (tx) => {
      // Cria a receita
      const revenue = await tx.revenue.create({
        data,
      });

      // Cria as alocações se fornecidas
      if (allocations && allocations.length > 0) {
        await tx.revenueAllocation.createMany({
          data: allocations.map((allocation: any) => ({
            revenueId: revenue.id,
            ...allocation,
          })),
        });
      }

      // Retorna a receita com alocações
      return tx.revenue.findUnique({
        where: { id: revenue.id },
        include: {
          allocations: true,
          costCenter: true,
          payerAccount: true,
        },
      });
    });
  }

  async getMonthlyRecurring() {
    // Busca receitas dos últimos 3 meses para identificar padrões
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const revenues = await this.model.findMany({
      where: {
        dueDate: {
          gte: threeMonthsAgo,
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // Agrupa por descrição para identificar recorrências
    const grouped = revenues.reduce((acc: any, revenue: any) => {
      const key = revenue.description.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = {
          description: revenue.description,
          category: revenue.category,
          occurrences: [],
          averageAmount: 0,
          isRecurring: false,
        };
      }
      acc[key].occurrences.push({
        date: revenue.dueDate,
        amount: revenue.totalAmount,
      });
      return acc;
    }, {} as Record<string, any>);

    // Identifica receitas recorrentes (aparecem pelo menos 2 vezes)
    Object.values(grouped).forEach((item: any) => {
      if (item.occurrences.length >= 2) {
        item.isRecurring = true;
        item.averageAmount = item.occurrences.reduce((sum: number, o: any) => sum + o.amount, 0) / item.occurrences.length;
      }
    });

    return Object.values(grouped).filter((item: any) => item.isRecurring);
  }
} 