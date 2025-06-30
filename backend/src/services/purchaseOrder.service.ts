import { PurchaseOrder, PurchaseOrderStatus, PaymentType, AnimalType } from '@prisma/client';
import { PurchaseOrderRepository } from '@/repositories/purchaseOrder.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CreatePurchaseOrderData {
  vendorId: string;
  brokerId?: string;
  location: string;
  purchaseDate: Date;
  animalCount: number;
  animalType: AnimalType;
  averageAge?: number;
  totalWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  commission: number;
  freightCost?: number;
  otherCosts?: number;
  paymentType: PaymentType;
  payerAccountId: string;
  principalDueDate: Date;
  commissionDueDate?: Date;
  otherCostsDueDate?: Date;
  notes?: string;
}

interface UpdatePurchaseOrderData extends Partial<CreatePurchaseOrderData> {
  status?: PurchaseOrderStatus;
  currentStage?: string;
}

interface ReceptionData {
  receptionDate: Date;
  actualWeight: number;
  actualCount: number;
  transportMortality?: number;
  notes?: string;
}

interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  currentStage?: string;
  vendorId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class PurchaseOrderService {
  private purchaseOrderRepository: PurchaseOrderRepository;

  constructor() {
    this.purchaseOrderRepository = new PurchaseOrderRepository();
  }

  async findAll(filters: PurchaseOrderFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.currentStage) {
      where.currentStage = filters.currentStage;
    }

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.startDate || filters.endDate) {
      where.purchaseDate = {};
      if (filters.startDate) {
        where.purchaseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.purchaseDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const include = {
      vendor: true,
      broker: true,
      lot: true,
    };

    return this.purchaseOrderRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const order = await this.purchaseOrderRepository.findWithRelations(id);
    
    if (!order) {
      throw new NotFoundError('Ordem de compra não encontrada');
    }

    return order;
  }

  async findByStatus(status: PurchaseOrderStatus) {
    return this.purchaseOrderRepository.findByStatus(status);
  }

  async findByStage(stage: string) {
    return this.purchaseOrderRepository.findByStage(stage);
  }

  async create(data: CreatePurchaseOrderData, userId: string) {
    // Calcula valores
    const averageWeight = data.totalWeight / data.animalCount;
    const totalValue = (data.totalWeight * data.carcassYield / 100) / 15 * data.pricePerArroba;

    // Gera número da ordem
    const orderNumber = await this.purchaseOrderRepository.getNextOrderNumber();

    // Cria a ordem com as contas financeiras
    return this.purchaseOrderRepository.createWithFinancialAccounts({
      orderNumber,
      ...data,
      averageWeight,
      totalValue,
      freightCost: data.freightCost || 0,
      otherCosts: data.otherCosts || 0,
      status: 'PENDING',
      currentStage: 'order',
      user: { connect: { id: userId } },
      vendor: { connect: { id: data.vendorId } },
      broker: data.brokerId ? { connect: { id: data.brokerId } } : undefined,
      payerAccount: { connect: { id: data.payerAccountId } },
    });
  }

  async update(id: string, data: UpdatePurchaseOrderData) {
    // Verifica se a ordem existe
    const order = await this.findById(id);

    // Não permite atualizar ordens já recepcionadas
    if (order.status === 'CONFINED') {
      throw new ValidationError('Não é possível alterar ordens já confinadas');
    }

    // Recalcula valores se necessário
    let updates: any = { ...data };
    if (data.totalWeight || data.animalCount || data.carcassYield || data.pricePerArroba) {
      const totalWeight = data.totalWeight || order.totalWeight;
      const animalCount = data.animalCount || order.animalCount;
      const carcassYield = data.carcassYield || order.carcassYield;
      const pricePerArroba = data.pricePerArroba || order.pricePerArroba;

      updates.averageWeight = totalWeight / animalCount;
      updates.totalValue = (totalWeight * carcassYield / 100) / 15 * pricePerArroba;
    }

    return this.purchaseOrderRepository.update(id, updates);
  }

  async updateStage(id: string, stage: string) {
    const order = await this.findById(id);

    // Define o status baseado no stage
    let status: PurchaseOrderStatus = order.status;
    switch (stage) {
      case 'payment-validation':
        status = 'PAYMENT_VALIDATING';
        break;
      case 'reception':
        status = 'RECEPTION';
        break;
      case 'confined':
        status = 'CONFINED';
        break;
    }

    return this.purchaseOrderRepository.updateStatus(id, status, stage);
  }

  async registerReception(id: string, data: ReceptionData) {
    const order = await this.findById(id);

    if (order.status !== 'RECEPTION') {
      throw new ValidationError('Ordem não está na etapa de recepção');
    }

    // Calcula quebra de peso
    const weightBreakPercentage = ((order.totalWeight - data.actualWeight) / order.totalWeight) * 100;

    // Atualiza a ordem
    const updatedOrder = await this.purchaseOrderRepository.update(id, {
      receptionDate: data.receptionDate,
      actualWeight: data.actualWeight,
      actualCount: data.actualCount,
      weightBreakPercentage,
      transportMortality: data.transportMortality || 0,
      notes: data.notes,
    });

    // Cria o lote automaticamente
    await this.purchaseOrderRepository.createLotFromOrder(id);

    return updatedOrder;
  }

  async delete(id: string) {
    const order = await this.findById(id);

    // Não permite deletar ordens com lote criado
    if (order.lot) {
      throw new ValidationError('Não é possível excluir ordens com lote criado');
    }

    // Cancela ao invés de deletar se tiver contas financeiras
    if (order.financialAccounts.length > 0) {
      return this.purchaseOrderRepository.updateStatus(id, 'CANCELLED', 'cancelled');
    }

    return this.purchaseOrderRepository.delete(id);
  }

  async getStats() {
    const [pending, validating, reception, confined] = await Promise.all([
      this.purchaseOrderRepository.count({ status: 'PENDING' }),
      this.purchaseOrderRepository.count({ status: 'PAYMENT_VALIDATING' }),
      this.purchaseOrderRepository.count({ status: 'RECEPTION' }),
      this.purchaseOrderRepository.count({ status: 'CONFINED' }),
    ]);

    return {
      pending,
      validating,
      reception,
      confined,
      total: pending + validating + reception + confined,
    };
  }
} 