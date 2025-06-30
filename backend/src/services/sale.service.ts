import { SaleRecord, SaleStatus } from '@prisma/client';
import { SaleRepository } from '@/repositories/sale.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreateSaleData {
  lotId: string;
  buyerId: string;
  quantity: number;
  pricePerKg: number;
  totalWeight: number;
  saleDate: Date;
  paymentType: 'CASH' | 'INSTALLMENT' | 'FORWARD';
  paymentDueDate?: Date;
  slaughterHouse?: string;
  notes?: string;
}

interface UpdateSaleData extends Partial<CreateSaleData> {
  status?: SaleStatus;
  deliveryDate?: Date;
  finalWeight?: number;
  finalAmount?: number;
}

interface SaleFilters {
  status?: SaleStatus;
  buyerId?: string;
  lotId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class SaleService {
  private saleRepository: SaleRepository;

  constructor() {
    this.saleRepository = new SaleRepository();
  }

  async findAll(filters: SaleFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.buyerId) {
      where.buyerId = filters.buyerId;
    }

    if (filters.lotId) {
      where.lotId = filters.lotId;
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
        { saleNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      buyer: true,
      lot: true,
      revenues: true,
    };

    return this.saleRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const sale = await this.saleRepository.findWithRelations(id);
    
    if (!sale) {
      throw new NotFoundError('Venda não encontrada');
    }

    return sale;
  }

  async findByStatus(status: SaleStatus) {
    return this.saleRepository.findByStatus(status);
  }

  async findByLot(lotId: string) {
    return this.saleRepository.findByLot(lotId);
  }

  async create(data: CreateSaleData, userId: string) {
    // Valida se o lote existe e tem quantidade disponível
    const lot = await this.validateLotAvailability(data.lotId, data.quantity);

    // Gera número da venda
    const saleNumber = await this.generateSaleNumber();

    // Calcula o valor total
    const totalAmount = data.totalWeight * data.pricePerKg;

    const saleData = {
      saleNumber,
      lot: { connect: { id: data.lotId } },
      buyer: { connect: { id: data.buyerId } },
      quantity: data.quantity,
      pricePerKg: data.pricePerKg,
      totalWeight: data.totalWeight,
      totalAmount,
      saleDate: data.saleDate,
      paymentType: data.paymentType,
      paymentDueDate: data.paymentDueDate,
      slaughterHouse: data.slaughterHouse,
      status: 'NEGOTIATING' as SaleStatus,
      notes: data.notes,
      user: { connect: { id: userId } },
    };

    return this.saleRepository.createWithRevenue(saleData);
  }

  async update(id: string, data: UpdateSaleData) {
    const sale = await this.findById(id);

    // Não permite alterar vendas finalizadas
    if (sale.status === 'DELIVERED' || sale.status === 'CANCELLED') {
      throw new ValidationError('Não é possível alterar vendas finalizadas ou canceladas');
    }

    // Se está alterando quantidade, valida disponibilidade
    if (data.quantity && data.quantity !== sale.quantity) {
      await this.validateLotAvailability(sale.lotId, data.quantity - sale.quantity);
    }

    // Recalcula valor se necessário
    let updateData: any = { ...data };
    if (data.totalWeight || data.pricePerKg) {
      const weight = data.totalWeight || sale.totalWeight;
      const price = data.pricePerKg || sale.pricePerKg;
      updateData.totalAmount = weight * price;
    }

    return this.saleRepository.update(id, updateData);
  }

  async updateStatus(id: string, status: SaleStatus) {
    const sale = await this.findById(id);

    // Valida transições de status
    this.validateStatusTransition(sale.status, status);

    return this.saleRepository.updateStatus(id, status);
  }

  async delete(id: string) {
    const sale = await this.findById(id);

    // Não permite excluir vendas confirmadas ou posteriores
    if (sale.status !== 'NEGOTIATING') {
      throw new ValidationError('Apenas vendas em negociação podem ser excluídas');
    }

    return this.saleRepository.delete(id);
  }

  async getSalesByPeriod(startDate: Date, endDate: Date) {
    return this.saleRepository.getSalesByPeriod(startDate, endDate);
  }

  async getStatistics(startDate?: Date, endDate?: Date) {
    return this.saleRepository.getSalesStatistics(startDate, endDate);
  }

  async getProfitability(lotId: string) {
    return this.saleRepository.getProfitabilityByLot(lotId);
  }

  private async validateLotAvailability(lotId: string, quantity: number) {
    const lot = await this.prisma.cattleLot.findUnique({
      where: { id: lotId },
      include: {
        sales: true,
      },
    });

    if (!lot) {
      throw new NotFoundError('Lote não encontrado');
    }

    if (lot.status !== 'ACTIVE') {
      throw new ValidationError('Lote não está ativo para vendas');
    }

    const soldQuantity = lot.sales
      .filter(s => s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + s.quantity, 0);

    const available = lot.quantity - soldQuantity;

    if (quantity > available) {
      throw new ValidationError(`Quantidade disponível insuficiente. Disponível: ${available}`);
    }

    return lot;
  }

  private validateStatusTransition(currentStatus: SaleStatus, newStatus: SaleStatus) {
    const validTransitions: Record<SaleStatus, SaleStatus[]> = {
      NEGOTIATING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(`Transição inválida de ${currentStatus} para ${newStatus}`);
    }
  }

  private async generateSaleNumber() {
    const year = new Date().getFullYear();
    const lastSale = await this.saleRepository.findFirst(
      {},
      { sortBy: 'saleNumber', sortOrder: 'desc' }
    );

    let sequence = 1;
    if (lastSale && lastSale.saleNumber.startsWith(`VND${year}`)) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `VND${year}${sequence.toString().padStart(4, '0')}`;
  }

  private get prisma() {
    return (this.saleRepository as any).prisma;
  }
} 