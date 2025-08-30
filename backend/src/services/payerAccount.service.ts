import { AccountType } from '@prisma/client';
import { PayerAccountRepository } from '@/repositories/payerAccount.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateAccountData {
  bankName: string;
  accountName: string;
  agency?: string;
  accountNumber?: string;
  accountType: AccountType;
  balance?: number;
}

interface UpdateAccountData extends Partial<CreateAccountData> {
  isActive?: boolean;
}

interface AccountFilters {
  accountType?: AccountType;
  isActive?: boolean;
  search?: string;
}

export class PayerAccountService {
  private accountRepository: PayerAccountRepository;

  constructor() {
    this.accountRepository = new PayerAccountRepository();
  }

  async findAll(filters: AccountFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.accountType) {
      where.accountType = filters.accountType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { accountName: { contains: filters.search, mode: 'insensitive' } },
        { bankName: { contains: filters.search, mode: 'insensitive' } },
        { accountNumber: { contains: filters.search } },
      ];
    }

    return this.accountRepository.findAll(where, pagination);
  }

  async findById(id: string) {
    const account = await this.accountRepository.findById(id);
    
    if (!account) {
      throw new NotFoundError('Conta não encontrada');
    }

    return account;
  }

  async findByType(type: AccountType) {
    return this.accountRepository.findByType(type);
  }

  async create(data: CreateAccountData) {
    return this.accountRepository.create({
      ...data,
      balance: data.balance || 0,
    });
  }

  async update(id: string, data: UpdateAccountData) {
    // Verifica se a conta existe
    await this.findById(id);

    return this.accountRepository.update(id, data);
  }

  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract') {
    // Verifica se a conta existe
    const account = await this.findById(id);

    const finalAmount = operation === 'add' ? amount : -amount;
    
    // Verifica se há saldo suficiente para subtração
    if (operation === 'subtract' && account.balance < amount) {
      throw new ValidationError('Saldo insuficiente');
    }

    return this.accountRepository.updateBalance(id, finalAmount);
  }

  async delete(id: string) {
    // Verifica se a conta existe e tem transações
    const accountStats = await this.accountRepository.getAccountStats(id);
    
    if (!accountStats) {
      throw new NotFoundError('Conta não encontrada');
    }

    const hasTransactions = 
      accountStats.account.cattlePurchases?.length > 0 ||
      accountStats.account.expenses.length > 0 ||
      accountStats.account.revenues.length > 0 ||
      accountStats.account.contributions.length > 0;

    if (hasTransactions) {
      // Inativa ao invés de deletar
      return this.accountRepository.update(id, { isActive: false });
    }

    return this.accountRepository.delete(id);
  }

  async getStats() {
    const accounts = await this.accountRepository.findAll({});
    const total = accounts.data.length;
    const totalBalance = accounts.data.reduce((sum, acc) => sum + acc.balance, 0);
    
    const byType = {
      CHECKING: accounts.data.filter(a => a.accountType === 'CHECKING').length,
      SAVINGS: accounts.data.filter(a => a.accountType === 'SAVINGS').length,
      INVESTMENT: accounts.data.filter(a => a.accountType === 'INVESTMENT').length,
      CREDIT: accounts.data.filter(a => a.accountType === 'CREDIT').length,
    };

    return {
      total,
      active: accounts.data.filter(a => a.isActive).length,
      inactive: accounts.data.filter(a => !a.isActive).length,
      totalBalance,
      averageBalance: total > 0 ? totalBalance / total : 0,
      byType
    };
  }

  async getAccountStats(id: string) {
    const stats = await this.accountRepository.getAccountStats(id);
    
    if (!stats) {
      throw new NotFoundError('Conta não encontrada');
    }

    return stats;
  }

  async getTransactions(id: string, startDate?: Date, endDate?: Date) {
    const account = await this.accountRepository.getAccountWithTransactions(id, startDate, endDate);
    
    if (!account) {
      throw new NotFoundError('Conta não encontrada');
    }

    // Formata as transações em ordem cronológica
    const transactions = [
      ...account.expenses.map((e: any) => ({
        id: e.id,
        type: 'expense' as const,
        date: e.paymentDate || e.dueDate,
        description: e.description,
        amount: -e.totalAmount,
        status: e.isPaid ? 'paid' : 'pending',
      })),
      ...account.revenues.map((r: any) => ({
        id: r.id,
        type: 'revenue' as const,
        date: r.receiptDate || r.dueDate,
        description: r.description,
        amount: r.totalAmount,
        status: r.isReceived ? 'received' : 'pending',
      })),
      ...account.contributions.map((c: any) => ({
        id: c.id,
        type: 'contribution' as const,
        date: c.contributionDate,
        description: `Aporte - ${c.partner.name}`,
        amount: c.amount,
        status: 'completed',
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      account: {
        id: account.id,
        bankName: account.bankName,
        accountName: account.accountName,
        balance: account.balance,
      },
      transactions,
    };
  }
} 