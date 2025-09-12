import { SaleRecordRepository } from '@/repositories/saleRecord.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';
import { prisma } from '@/config/database';

interface CreateSaleRecordData {
  purchaseId: string;
  buyerId: string;
  cycleId?: string;
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
  cycleId?: string;
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
    
    if (filters.cycleId) {
      where.cycleId = filters.cycleId;
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

    const options = {
      include: {
        pen: true,
        purchase: true,
        buyer: true,
        receiverAccount: true,
      }
    };

    return this.saleRecordRepository.findAll(where, pagination, options);
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
    return this.saleRecordRepository.findAll({ purchaseId });
  }

  async findByBuyer(buyerId: string) {
    return this.saleRecordRepository.findByBuyer(buyerId);
  }

  async create(data: CreateSaleRecordData) {
    console.log('🔍 DEBUG SERVICE - Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Validar campos obrigatórios
    if (!data.saleDate) {
      throw new ValidationError('Data da venda é obrigatória');
    }
    if (!data.buyerId) {
      throw new ValidationError('Comprador é obrigatório');
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new ValidationError('Quantidade deve ser maior que zero');
    }

    // Preparar dados garantindo que todos os campos obrigatórios estejam presentes
    const saleRecordData: any = {
      saleDate: new Date(data.saleDate),
      penId: data.penId || null,
      purchaseId: data.purchaseId || null,
      saleType: data.saleType || 'total',
      quantity: Number(data.quantity),
      buyerId: data.buyerId,
      exitWeight: Number(data.exitWeight || 0),
      carcassWeight: Number(data.carcassWeight || 0),
      carcassYield: Number(data.carcassYield || 50),
      pricePerArroba: Number(data.pricePerArroba || 0),
      arrobas: Number(data.arrobas || 0),
      totalValue: Number(data.totalValue || 0),
      deductions: Number(data.deductions || 0),
      netValue: Number(data.netValue || 0),
      paymentType: data.paymentType || 'cash',
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      receiverAccountId: data.receiverAccountId || null,
      invoiceNumber: data.invoiceNumber || null,
      contractNumber: data.contractNumber || null,
      observations: data.observations || null,
      // Garantir que o status seja sempre em maiúsculo para o enum do Prisma
      status: data.status ? data.status.toUpperCase() : 'PENDING',
    };

    // Remover campos com valor null que não são opcionais no banco
    Object.keys(saleRecordData).forEach(key => {
      if (saleRecordData[key] === undefined) {
        delete saleRecordData[key];
      }
    });

    console.log('📤 DEBUG SERVICE - Dados preparados para o banco:', JSON.stringify(saleRecordData, null, 2));

    try {
      const result = await this.saleRecordRepository.create(saleRecordData);
      console.log('✅ DEBUG SERVICE - Venda criada com sucesso:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ DEBUG SERVICE - Erro ao criar venda:', error);
      console.error('❌ DEBUG SERVICE - Detalhes:', error.message);
      throw error;
    }
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
      DELIVERED: ['PAID', 'CANCELLED'],
      PAID: [],
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
      totalQuantity: records.items.reduce((sum: number, r) => sum + r.quantity, 0),
      totalWeight: records.items.reduce((sum: number, r) => sum + (r.exitWeight || 0), 0),
      totalCarcassWeight: records.items.reduce((sum: number, r) => sum + (r.carcassWeight || 0), 0),
      totalGrossValue: records.items.reduce((sum: number, r) => sum + (r.totalValue || 0), 0),
      totalNetValue: records.items.reduce((sum: number, r) => sum + r.netValue, 0),
      averagePrice: 0,
      byStatus: {
        pending: records.items.filter(r => r.status === 'PENDING').length,
        confirmed: records.items.filter(r => r.status === 'CONFIRMED').length,
        delivered: records.items.filter(r => r.status === 'DELIVERED').length,
        paid: records.items.filter(r => r.status === 'PAID').length,
        cancelled: records.items.filter(r => r.status === 'CANCELLED').length,
        completed: records.items.filter(r => r.status === 'PAID').length, // Usar PAID como completed
      },
    };

    if (summary.totalWeight > 0) {
      summary.averagePrice = summary.totalNetValue / summary.totalWeight;
    }

    return summary;
  }
}