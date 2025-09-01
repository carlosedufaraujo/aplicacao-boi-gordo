import { Expense, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
// import { prisma } from '@/config/database';

export class ExpenseRepository extends BaseRepository<Expense> {
  constructor() {
    super('expense');
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        costCenter: true,
        purchase: {
          include: {
            purchaseOrder: {
              include: {
                vendor: true,
              },
            },
          },
        },
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
        purchase: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findPending(daysAhead?: number) {
    const where: any = {
      isPaid: false,
      impactsCashFlow: true,
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
        purchase: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdue() {
    return this.model.findMany({
      where: {
        isPaid: false,
        impactsCashFlow: true,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        costCenter: true,
        purchase: true,
        payerAccount: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async payExpense(id: string, paymentData: { paymentDate: Date; payerAccountId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
      });

      if (!expense) {
        throw new Error('Despesa não encontrada');
      }

      if (expense.isPaid) {
        throw new Error('Despesa já paga');
      }

      // Atualiza a despesa
      const updatedExpense = await tx.expense.update({
        where: { id },
        data: {
          isPaid: true,
          paymentDate: paymentData.paymentDate,
          payerAccountId: paymentData.payerAccountId || expense.payerAccountId,
        },
      });

      // Atualiza saldo da conta se impacta caixa
      if (expense.impactsCashFlow && expense.payerAccountId) {
        await tx.payerAccount.update({
          where: { id: expense.payerAccountId },
          data: {
            balance: {
              decrement: expense.totalAmount,
            },
          },
        });
      }

      return updatedExpense;
    });
  }

  async getExpensesByCategory(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const expenses = await this.model.findMany({
      where: {
        dueDate: dateFilter,
        impactsCashFlow: true,
      },
    });

    // Agrupa por categoria
    const byCategory = expenses.reduce((acc: Record<string, any>, expense: any) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
        };
      }

      acc[expense.category].total += expense.totalAmount;
      acc[expense.category].count++;

      if (expense.isPaid) {
        acc[expense.category].paid += expense.totalAmount;
      } else {
        acc[expense.category].pending += expense.totalAmount;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(byCategory);
  }

  async getExpensesByCostCenter(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const expenses = await this.model.findMany({
      where: {
        dueDate: dateFilter,
        impactsCashFlow: true,
      },
      include: {
        costCenter: true,
      },
    });

    // Agrupa por centro de custo
    const byCostCenter = expenses.reduce((acc: Record<string, any>, expense: any) => {
      const centerName = expense.costCenter?.name || 'Sem Centro de Custo';
      const centerId = expense.costCenterId || 'no-center';

      if (!acc[centerId]) {
        acc[centerId] = {
          id: centerId,
          name: centerName,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
        };
      }

      acc[centerId].total += expense.totalAmount;
      acc[centerId].count++;

      if (expense.isPaid) {
        acc[centerId].paid += expense.totalAmount;
      } else {
        acc[centerId].pending += expense.totalAmount;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(byCostCenter);
  }

  async createWithAllocations(data: Prisma.ExpenseCreateInput, allocations?: Array<{
    entityType: 'LOT' | 'PEN' | 'GLOBAL';
    entityId: string;
    allocatedAmount: number;
    percentage: number;
  }>) {
    return this.prisma.$transaction(async (tx) => {
      // Cria a despesa
      const expense = await tx.expense.create({
        data,
      });

      // Cria as alocações se fornecidas
      if (allocations && allocations.length > 0) {
        await tx.expenseAllocation.createMany({
          data: allocations.map((allocation: any) => ({
            expenseId: expense.id,
            ...allocation,
          })),
        });
      }

      // Retorna a despesa com alocações
      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          allocations: true,
          costCenter: true,
          purchase: true,
          payerAccount: true,
        },
      });
    });
  }
} 