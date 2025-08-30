import { PayerAccount, AccountType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class PayerAccountRepository extends BaseRepository<PayerAccount> {
  constructor() {
    super('payerAccount');
  }

  async findByType(type: AccountType) {
    return this.model.findMany({
      where: { accountType: type, isActive: true },
      orderBy: { accountName: 'asc' },
    });
  }

  async updateBalance(id: string, amount: number) {
    return this.model.update({
      where: { id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async getAccountWithTransactions(id: string, startDate?: Date, endDate?: Date) {
    const where: any = { id };
    const dateFilter: any = {};

    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    return this.model.findUnique({
      where,
      include: {
        purchaseOrders: {
          where: startDate || endDate ? { createdAt: dateFilter } : undefined,
          include: {
            vendor: true,
          },
        },
        expenses: {
          where: startDate || endDate ? { createdAt: dateFilter } : undefined,
        },
        revenues: {
          where: startDate || endDate ? { createdAt: dateFilter } : undefined,
        },
        contributions: {
          where: startDate || endDate ? { createdAt: dateFilter } : undefined,
          include: {
            partner: true,
          },
        },
        bankStatements: {
          where: startDate || endDate ? { statementDate: dateFilter } : undefined,
          orderBy: { statementDate: 'desc' },
        },
      },
    });
  }

  async getAccountStats(id: string) {
    const account = await this.getAccountWithTransactions(id);
    if (!account) return null;

    const totalExpenses = account.expenses.reduce((sum: number, e: any) => sum + (e.isPaid ? e.totalAmount : 0), 0);
    const totalRevenues = account.revenues.reduce((sum: number, r: any) => sum + (r.isReceived ? r.totalAmount : 0), 0);
    const totalContributions = account.contributions.reduce((sum: number, c: any) => sum + c.amount, 0);
    const pendingExpenses = account.expenses.filter((e: any) => !e.isPaid).reduce((sum: number, e: any) => sum + e.totalAmount, 0);
    const pendingRevenues = account.revenues.filter((r: any) => !r.isReceived).reduce((sum: number, r: any) => sum + r.totalAmount, 0);

    return {
      account,
      stats: {
        currentBalance: account.balance,
        totalExpenses,
        totalRevenues,
        totalContributions,
        pendingExpenses,
        pendingRevenues,
        projectedBalance: account.balance - pendingExpenses + pendingRevenues,
      },
    };
  }
} 