import { Expense } from '@prisma/client';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateExpenseData {
  category: string;
  costCenterId?: string;
  description: string;
  totalAmount: number;
  dueDate: Date;
  impactsCashFlow?: boolean;
  lotId?: string;
  penId?: string;
  vendorId?: string;
  payerAccountId?: string;
  purchaseOrderId?: string;
  notes?: string;
}

interface UpdateExpenseData extends Partial<CreateExpenseData> {
  paymentDate?: Date;
  isPaid?: boolean;
}

interface ExpenseFilters {
  category?: string;
  costCenterId?: string;
  isPaid?: boolean;
  impactsCashFlow?: boolean;
  lotId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface PaymentData {
  paymentDate?: Date;
  payerAccountId?: string;
}

interface AllocationData {
  entityType: 'LOT' | 'PEN' | 'GLOBAL';
  entityId: string;
  allocatedAmount: number;
  percentage: number;
}

export class ExpenseService {
  private expenseRepository: ExpenseRepository;

  constructor() {
    this.expenseRepository = new ExpenseRepository();
  }

  async findAll(filters: ExpenseFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.costCenterId) {
      where.costCenterId = filters.costCenterId;
    }

    if (filters.isPaid !== undefined) {
      where.isPaid = filters.isPaid;
    }

    if (filters.impactsCashFlow !== undefined) {
      where.impactsCashFlow = filters.impactsCashFlow;
    }

    if (filters.lotId) {
      where.lotId = filters.lotId;
    }

    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      costCenter: true,
      lot: true,
      payerAccount: true,
      allocations: true,
    };

    return this.expenseRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const expense = await this.expenseRepository.findWithRelations(id);
    
    if (!expense) {
      throw new NotFoundError('Despesa não encontrada');
    }

    return expense;
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    return this.expenseRepository.findByPeriod(startDate, endDate, filters);
  }

  async findPending(daysAhead?: number) {
    return this.expenseRepository.findPending(daysAhead);
  }

  async findOverdue() {
    return this.expenseRepository.findOverdue();
  }

  async create(data: CreateExpenseData, userId: string, allocations?: AllocationData[]) {
    // Valida categoria
    const validCategories = [
      'animal_purchase', 'commission', 'freight', 'acquisition_other',
      'feed', 'health_costs', 'operational_costs', 'deaths', 'weight_loss',
      'general_admin', 'marketing', 'personnel', 'admin_other',
      'interest', 'fees', 'financial_management', 'financial_other'
    ];

    if (!validCategories.includes(data.category)) {
      throw new ValidationError('Categoria inválida');
    }

    // Define impactsCashFlow baseado na categoria se não fornecido
    const impactsCashFlow = data.impactsCashFlow ?? 
      !['deaths', 'weight_loss'].includes(data.category);

    const expenseData = {
      ...data,
      impactsCashFlow,
      isPaid: false,
      user: { connect: { id: userId } },
      costCenter: data.costCenterId ? { connect: { id: data.costCenterId } } : undefined,
      lot: data.lotId ? { connect: { id: data.lotId } } : undefined,
      payerAccount: data.payerAccountId ? { connect: { id: data.payerAccountId } } : undefined,
    };

    return this.expenseRepository.createWithAllocations(expenseData, allocations);
  }

  async update(id: string, data: UpdateExpenseData) {
    // Verifica se a despesa existe
    const expense = await this.findById(id);

    // Não permite alterar despesas já pagas
    if (expense.isPaid && !data.isPaid) {
      throw new ValidationError('Não é possível alterar despesas já pagas');
    }

    return this.expenseRepository.update(id, data);
  }

  async pay(id: string, paymentData: PaymentData) {
    const expense = await this.findById(id);

    if (expense.isPaid) {
      throw new ValidationError('Despesa já paga');
    }

    if (!expense.impactsCashFlow) {
      throw new ValidationError('Esta despesa não impacta o caixa');
    }

    const payment = {
      paymentDate: paymentData.paymentDate || new Date(),
      payerAccountId: paymentData.payerAccountId || expense.payerAccountId,
    };

    if (!payment.payerAccountId) {
      throw new ValidationError('Conta pagadora é obrigatória');
    }

    return this.expenseRepository.payExpense(id, payment);
  }

  async delete(id: string) {
    const expense = await this.findById(id);

    if (expense.isPaid) {
      throw new ValidationError('Não é possível excluir despesas pagas');
    }

    // Verifica se tem alocações ou reconciliações
    if (expense.allocations.length > 0 || expense.reconciliations.length > 0) {
      throw new ValidationError('Não é possível excluir despesa com alocações ou reconciliações');
    }

    return this.expenseRepository.delete(id);
  }

  async getStatsByCategory(startDate?: Date, endDate?: Date) {
    return this.expenseRepository.getExpensesByCategory(startDate, endDate);
  }

  async getStatsByCostCenter(startDate?: Date, endDate?: Date) {
    return this.expenseRepository.getExpensesByCostCenter(startDate, endDate);
  }

  async getSummary(filters?: ExpenseFilters) {
    const expenses = await this.findAll(filters || {}, { page: 1, limit: 10000 });

    const summary = {
      total: expenses.data.reduce((sum, e) => sum + e.totalAmount, 0),
      paid: expenses.data.filter(e => e.isPaid).reduce((sum, e) => sum + e.totalAmount, 0),
      pending: expenses.data.filter(e => !e.isPaid).reduce((sum, e) => sum + e.totalAmount, 0),
      overdue: 0,
      count: expenses.total,
      paidCount: expenses.data.filter(e => e.isPaid).length,
      pendingCount: expenses.data.filter(e => !e.isPaid).length,
      overdueCount: 0,
    };

    // Calcula vencidas
    const today = new Date();
    const overdue = expenses.data.filter(e => !e.isPaid && e.dueDate < today);
    summary.overdue = overdue.reduce((sum, e) => sum + e.totalAmount, 0);
    summary.overdueCount = overdue.length;

    return summary;
  }
} 