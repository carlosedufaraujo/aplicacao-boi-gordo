import { Revenue } from '@prisma/client';
import { RevenueRepository } from '@/repositories/revenue.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateRevenueData {
  category: string;
  costCenterId?: string;
  description: string;
  totalAmount: number;
  dueDate: Date;
  saleRecordId?: string;
  buyerId?: string;
  payerAccountId?: string;
  notes?: string;
}

interface UpdateRevenueData extends Partial<CreateRevenueData> {
  receiptDate?: Date;
  isReceived?: boolean;
}

interface RevenueFilters {
  category?: string;
  costCenterId?: string;
  isReceived?: boolean;
  saleRecordId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface ReceiptData {
  receiptDate?: Date;
  payerAccountId?: string;
}

interface AllocationData {
  entityType: 'LOT' | 'PEN' | 'GLOBAL';
  entityId: string;
  allocatedAmount: number;
  percentage: number;
}

export class RevenueService {
  private revenueRepository: RevenueRepository;

  constructor() {
    this.revenueRepository = new RevenueRepository();
  }

  async findAll(filters: RevenueFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.costCenterId) {
      where.costCenterId = filters.costCenterId;
    }

    if (filters.isReceived !== undefined) {
      where.isReceived = filters.isReceived;
    }

    if (filters.saleRecordId) {
      where.saleRecordId = filters.saleRecordId;
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
      payerAccount: true,
      allocations: true,
    };

    return this.revenueRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const revenue = await this.revenueRepository.findWithRelations(id);
    
    if (!revenue) {
      throw new NotFoundError('Receita não encontrada');
    }

    return revenue;
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    return this.revenueRepository.findByPeriod(startDate, endDate, filters);
  }

  async findPending(daysAhead?: number) {
    return this.revenueRepository.findPending(daysAhead);
  }

  async findOverdue() {
    return this.revenueRepository.findOverdue();
  }

  async create(data: CreateRevenueData, userId: string, allocations?: AllocationData[]) {
    // Valida categoria
    const validCategories = [
      'cattle_sales', 'service_revenue', 'byproduct_sales', 'other_revenue',
      'partner_contribution', 'partner_loan', 'bank_financing', 'external_investor'
    ];

    if (!validCategories.includes(data.category)) {
      throw new ValidationError('Categoria inválida');
    }

    const revenueData = {
      ...data,
      isReceived: false,
      user: { connect: { id: userId } },
      costCenter: data.costCenterId ? { connect: { id: data.costCenterId } } : undefined,
      payerAccount: data.payerAccountId ? { connect: { id: data.payerAccountId } } : undefined,
    };

    return this.revenueRepository.createWithAllocations(revenueData, allocations);
  }

  async update(id: string, data: UpdateRevenueData) {
    // Verifica se a receita existe
    const revenue = await this.findById(id);

    // Não permite alterar receitas já recebidas
    if (revenue.isReceived && !data.isReceived) {
      throw new ValidationError('Não é possível alterar receitas já recebidas');
    }

    return this.revenueRepository.update(id, data);
  }

  async receive(id: string, receiptData: ReceiptData) {
    const revenue = await this.findById(id);

    if (revenue.isReceived) {
      throw new ValidationError('Receita já recebida');
    }

    const receipt = {
      receiptDate: receiptData.receiptDate || new Date(),
      payerAccountId: receiptData.payerAccountId || revenue.payerAccountId,
    };

    if (!receipt.payerAccountId) {
      throw new ValidationError('Conta recebedora é obrigatória');
    }

    return this.revenueRepository.receiveRevenue(id, receipt);
  }

  async delete(id: string) {
    const revenue = await this.findById(id);

    if (revenue.isReceived) {
      throw new ValidationError('Não é possível excluir receitas recebidas');
    }

    // Verifica se tem alocações ou reconciliações
    if (revenue.allocations.length > 0 || revenue.reconciliations.length > 0) {
      throw new ValidationError('Não é possível excluir receita com alocações ou reconciliações');
    }

    return this.revenueRepository.delete(id);
  }

  async getStatsByCategory(startDate?: Date, endDate?: Date) {
    return this.revenueRepository.getRevenuesByCategory(startDate, endDate);
  }

  async getStatsByCostCenter(startDate?: Date, endDate?: Date) {
    return this.revenueRepository.getRevenuesByCostCenter(startDate, endDate);
  }

  async getMonthlyRecurring() {
    return this.revenueRepository.getMonthlyRecurring();
  }

  async getSummary(filters?: RevenueFilters) {
    const revenues = await this.findAll(filters || {}, { page: 1, limit: 10000 });

    const summary = {
      total: revenues.data.reduce((sum, r) => sum + r.totalAmount, 0),
      received: revenues.data.filter(r => r.isReceived).reduce((sum, r) => sum + r.totalAmount, 0),
      pending: revenues.data.filter(r => !r.isReceived).reduce((sum, r) => sum + r.totalAmount, 0),
      overdue: 0,
      count: revenues.total,
      receivedCount: revenues.data.filter(r => r.isReceived).length,
      pendingCount: revenues.data.filter(r => !r.isReceived).length,
      overdueCount: 0,
    };

    // Calcula vencidas
    const today = new Date();
    const overdue = revenues.data.filter(r => !r.isReceived && r.dueDate < today);
    summary.overdue = overdue.reduce((sum, r) => sum + r.totalAmount, 0);
    summary.overdueCount = overdue.length;

    return summary;
  }

  async getProjection(months: number = 3) {
    // Busca receitas recorrentes
    const recurring = await this.getMonthlyRecurring();
    
    // Busca receitas confirmadas futuras
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    
    const confirmed = await this.revenueRepository.findByPeriod(new Date(), endDate);
    
    // Projeta receitas recorrentes
    const projections = [];
    const today = new Date();
    
    for (let i = 1; i <= months; i++) {
      const projectionDate = new Date(today);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      const monthProjection = {
        month: projectionDate.toISOString().slice(0, 7),
        confirmed: 0,
        projected: 0,
        total: 0,
      };
      
      // Soma receitas confirmadas do mês
      confirmed.forEach(revenue => {
        if (revenue.dueDate.toISOString().slice(0, 7) === monthProjection.month) {
          monthProjection.confirmed += revenue.totalAmount;
        }
      });
      
      // Projeta receitas recorrentes
      recurring.forEach((item: any) => {
        monthProjection.projected += item.averageAmount;
      });
      
      monthProjection.total = monthProjection.confirmed + monthProjection.projected;
      projections.push(monthProjection);
    }
    
    return {
      recurring,
      projections,
      totalProjected: projections.reduce((sum, p) => sum + p.total, 0),
    };
  }
} 