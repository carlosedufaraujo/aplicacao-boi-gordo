import { SaleRecordRepository } from '@/repositories/saleRecord.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateSaleRecordData {
  purchaseId: string;
  buyerId: string;
  saleDate: Date;
  quantity: number;
  totalWeight: number;
  pricePerKg: number;
  grossValue: number;
  deductions?: number;
  netValue: number;
  paymentTerms?: string;
  deliveryDate?: Date;
  deliveryLocation?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  payerAccountId?: string;
  notes?: string;
}

interface UpdateSaleRecordData extends Partial<CreateSaleRecordData> {}

interface SaleRecordFilters {
  purchaseId?: string;
  buyerId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class SaleRecordService {
  private saleRecordRepository: SaleRecordRepository;

  constructor() {
    this.saleRecordRepository = new SaleRecordRepository();
  }

  async findAll(filters: SaleRecordFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.purchaseId) {
      where.purchaseId = filters.purchaseId;
    }

    if (filters.buyerId) {
      where.buyerId = filters.buyerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.saleDate = {};
      if (filters.startDate) {
        where.saleDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.saleDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { deliveryLocation: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      cattleLot: true,
      buyer: true,
      payerAccount: true,
    };

    return this.saleRecordRepository.findAll(where, pagination);
  }

  async findById(id: string) {
    const saleRecord = await this.saleRecordRepository.findWithRelations(id);
    
    if (!saleRecord) {
      throw new NotFoundError('Registro de venda não encontrado');
    }

    return saleRecord;
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    return this.saleRecordRepository.findByPeriod(startDate, endDate, filters);
  }

  async findByPurchase(purchaseId: string) {
    return this.saleRecordRepository.findByPurchase(purchaseId);
  }

  async findByBuyer(buyerId: string) {
    return this.saleRecordRepository.findByBuyer(buyerId);
  }

  async create(data: CreateSaleRecordData) {
    // Valida se o lote existe e tem quantidade disponível
    // Aqui você pode adicionar validações adicionais

    const saleRecordData = {
      ...data,
      status: data.status || 'PENDING',
      deductions: data.deductions || 0,
    };

    return this.saleRecordRepository.create(saleRecordData);
  }

  async update(id: string, data: UpdateSaleRecordData) {
    // Verifica se o registro existe
    await this.findById(id);

    // Valida mudanças de status
    if (data.status === 'CANCELLED') {
      // Adicionar lógica para reverter estoque se necessário
    }

    return this.saleRecordRepository.update(id, data);
  }

  async updateStatus(id: string, status: string) {
    // Verifica se o registro existe
    const saleRecord = await this.findById(id);

    // Valida transição de status
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[saleRecord.status]?.includes(status)) {
      throw new ValidationError(`Não é possível mudar de ${saleRecord.status} para ${status}`);
    }

    return this.saleRecordRepository.update(id, { status });
  }

  async delete(id: string) {
    // Verifica se o registro existe
    const saleRecord = await this.findById(id);

    // Não permite deletar vendas completas
    if (saleRecord.status === 'COMPLETED') {
      throw new ValidationError('Não é possível excluir vendas completas');
    }

    return this.saleRecordRepository.delete(id);
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const stats = await this.saleRecordRepository.getStatsByPeriod(startDate, endDate);
    const statusStats = await this.saleRecordRepository.getSalesByStatus();
    
    return {
      ...stats,
      byStatus: statusStats,
    };
  }

  async getSummary(filters?: SaleRecordFilters) {
    const records = await this.findAll(filters || {}, { page: 1, limit: 1000 });

    const summary = {
      total: records.total,
      totalQuantity: records.items.reduce((sum, r) => sum + r.quantity, 0),
      totalWeight: records.items.reduce((sum, r) => sum + r.totalWeight, 0),
      totalGrossValue: records.items.reduce((sum, r) => sum + r.grossValue, 0),
      totalNetValue: records.items.reduce((sum, r) => sum + r.netValue, 0),
      averagePrice: 0,
      byStatus: {
        pending: records.items.filter(r => r.status === 'PENDING').length,
        confirmed: records.items.filter(r => r.status === 'CONFIRMED').length,
        delivered: records.items.filter(r => r.status === 'DELIVERED').length,
        completed: records.items.filter(r => r.status === 'COMPLETED').length,
        cancelled: records.items.filter(r => r.status === 'CANCELLED').length,
      },
    };

    if (summary.totalWeight > 0) {
      summary.averagePrice = summary.totalNetValue / summary.totalWeight;
    }

    return summary;
  }
}