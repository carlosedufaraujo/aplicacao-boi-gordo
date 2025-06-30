import { CattleLot, LotStatus } from '@prisma/client';
import { CattleLotRepository } from '@/repositories/cattleLot.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';

interface CattleLotFilters {
  status?: LotStatus;
  vendorId?: string;
  penId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface AllocationData {
  penId: string;
  quantity: number;
}

interface MortalityData {
  quantity: number;
  cause: string;
  notes?: string;
}

interface WeightLossData {
  expectedWeight: number;
  actualWeight: number;
  notes?: string;
}

export class CattleLotService {
  private cattleLotRepository: CattleLotRepository;

  constructor() {
    this.cattleLotRepository = new CattleLotRepository();
  }

  async findAll(filters: CattleLotFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.vendorId) {
      where.purchaseOrder = {
        vendorId: filters.vendorId,
      };
    }

    if (filters.penId) {
      where.penAllocations = {
        some: {
          penId: filters.penId,
          status: 'ACTIVE',
        },
      };
    }

    if (filters.startDate || filters.endDate) {
      where.entryDate = {};
      if (filters.startDate) {
        where.entryDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.entryDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { lotNumber: { contains: filters.search } },
        { purchaseOrder: { orderNumber: { contains: filters.search } } },
      ];
    }

    const include = {
      purchaseOrder: {
        include: {
          vendor: true,
        },
      },
      penAllocations: {
        where: { status: 'ACTIVE' },
        include: {
          pen: true,
        },
      },
    };

    return this.cattleLotRepository.findAll(where, pagination, include);
  }

  async findById(id: string) {
    const lot = await this.cattleLotRepository.findWithRelations(id);
    
    if (!lot) {
      throw new NotFoundError('Lote não encontrado');
    }

    return lot;
  }

  async findByStatus(status: LotStatus) {
    return this.cattleLotRepository.findByStatus(status);
  }

  async getMetrics(id: string) {
    const metrics = await this.cattleLotRepository.getLotMetrics(id);
    
    if (!metrics) {
      throw new NotFoundError('Lote não encontrado');
    }

    return metrics;
  }

  async allocateToPens(id: string, allocations: AllocationData[], userId: string) {
    // Verifica se o lote existe
    const lot = await this.findById(id);

    if (lot.status !== 'ACTIVE') {
      throw new ValidationError('Apenas lotes ativos podem ser alocados');
    }

    // Valida quantidade total
    const totalToAllocate = allocations.reduce((sum, a) => sum + a.quantity, 0);
    const alreadyAllocated = lot.penAllocations.reduce((sum, a) => sum + a.quantity, 0);
    
    if (alreadyAllocated + totalToAllocate > lot.currentQuantity) {
      throw new ValidationError(
        `Quantidade a alocar (${totalToAllocate}) excede quantidade disponível (${lot.currentQuantity - alreadyAllocated})`
      );
    }

    return this.cattleLotRepository.allocateToPens(id, allocations, userId);
  }

  async recordMortality(id: string, data: MortalityData, userId: string) {
    const lot = await this.findById(id);

    if (data.quantity > lot.currentQuantity) {
      throw new ValidationError('Quantidade de mortes excede quantidade atual');
    }

    // Atualiza o lote
    await this.cattleLotRepository.recordMortality(id, data.quantity);

    // Cria registro de despesa não-caixa
    const costPerAnimal = lot.totalCost / lot.entryQuantity;
    const totalValue = costPerAnimal * data.quantity;

    await this.cattleLotRepository.prisma.nonCashExpense.create({
      data: {
        type: 'MORTALITY',
        lotId: id,
        description: `Mortalidade - ${data.cause}`,
        quantity: data.quantity,
        totalValue,
        recordDate: new Date(),
        notes: data.notes,
      },
    });

    // Cria movimentação
    await this.cattleLotRepository.prisma.lotMovement.create({
      data: {
        lotId: id,
        movementType: 'DEATH',
        quantity: data.quantity,
        reason: data.cause,
        userId,
        movementDate: new Date(),
      },
    });

    return this.findById(id);
  }

  async recordWeightLoss(id: string, data: WeightLossData, userId: string) {
    const lot = await this.findById(id);

    const weightLoss = data.expectedWeight - data.actualWeight;
    const lossPercentage = (weightLoss / data.expectedWeight) * 100;
    
    // Calcula valor da perda (baseado no preço médio)
    const pricePerKg = lot.totalCost / lot.entryWeight;
    const totalValue = weightLoss * pricePerKg;

    // Cria registro de despesa não-caixa
    await this.cattleLotRepository.prisma.nonCashExpense.create({
      data: {
        type: 'WEIGHT_LOSS',
        lotId: id,
        description: `Quebra de peso - ${lossPercentage.toFixed(2)}%`,
        expectedValue: data.expectedWeight * pricePerKg,
        actualValue: data.actualWeight * pricePerKg,
        totalValue,
        recordDate: new Date(),
        notes: data.notes,
      },
    });

    return this.findById(id);
  }

  async updateCosts(id: string, costType: string, amount: number) {
    // Verifica se o lote existe
    await this.findById(id);

    const validCostTypes = [
      'healthCost',
      'feedCost',
      'operationalCost',
      'freightCost',
      'otherCosts',
    ];

    if (!validCostTypes.includes(costType)) {
      throw new ValidationError('Tipo de custo inválido');
    }

    return this.cattleLotRepository.updateCosts(id, costType, amount);
  }

  async getStats() {
    const [active, sold, total] = await Promise.all([
      this.cattleLotRepository.count({ status: 'ACTIVE' }),
      this.cattleLotRepository.count({ status: 'SOLD' }),
      this.cattleLotRepository.count({}),
    ]);

    const activeLots = await this.cattleLotRepository.findAll(
      { status: 'ACTIVE' },
      { page: 1, limit: 1000 }
    );

    const totalAnimals = activeLots.data.reduce((sum, lot) => sum + lot.currentQuantity, 0);
    const totalInvestment = activeLots.data.reduce((sum, lot) => sum + lot.totalCost, 0);

    return {
      active,
      sold,
      total,
      totalAnimals,
      totalInvestment,
    };
  }
} 