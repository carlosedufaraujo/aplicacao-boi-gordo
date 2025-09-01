import { PurchaseStatus } from '@prisma/client';
import { CattlePurchaseRepository } from '@/repositories/cattlePurchase.repository';
import { PenRepository } from '@/repositories/pen.repository';
import { AppError } from '@/utils/AppError';
import { prisma } from '@/config/database';
import { CodeGeneratorService } from '@/services/codeGenerator.service';

interface CreateCattlePurchaseData {
  vendorId: string;
  brokerId?: string;
  transportCompanyId?: string;
  payerAccountId: string;
  cycleId?: string;
  location?: string;
  city?: string;
  state?: string;
  farm?: string;
  purchaseDate: Date;
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  animalAge?: number;
  initialQuantity: number;
  purchaseWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'BARTER';
  paymentTerms?: string;
  principalDueDate?: Date;
  freightCost?: number;
  freightDistance?: number;
  commission?: number;
  notes?: string;
}

interface RegisterReceptionData {
  receivedDate: Date;
  receivedWeight: number;
  actualQuantity: number;
  freightDistance?: number;
  freightCostPerKm?: number;
  freightValue?: number;
  transportCompanyId?: string;
  estimatedGMD?: number;
  transportMortality?: number;
  mortalityReason?: string;
  notes?: string;
  penAllocations?: Array<{ penId: string; quantity: number }>;
}

interface MarkAsConfinedData {
  penAllocations: Array<{ penId: string; quantity: number }>;
  notes?: string;
}

export class CattlePurchaseService {
  private repository: CattlePurchaseRepository;
  private penRepository: PenRepository;

  constructor() {
    this.repository = new CattlePurchaseRepository();
    this.penRepository = new PenRepository();
  }

  async create(data: CreateCattlePurchaseData) {
    // Gerar códigos únicos
    const lotCode = await this.generateLotCode();
    // Removido internalCode - usando apenas lotCode
    
    // Se não foi especificado um ciclo, buscar o ciclo ativo
    let cycleId = data.cycleId;
    if (!cycleId) {
      const activeCycle = await prisma.cycle.findFirst({
        where: { status: 'ACTIVE' }
      });
      cycleId = activeCycle?.id;
    }
    
    // Calcular valor da compra
    const purchaseValue = (data.purchaseWeight / 30) * data.pricePerArroba;
    
    // Calcular custos totais
    const totalCost = purchaseValue + 
                     (data.freightCost || 0) + 
                     (data.commission || 0);

    return await this.repository.create({
      ...data,
      cycleId,
      lotCode,
      // internalCode removido
      purchaseValue,
      totalCost,
      currentQuantity: data.initialQuantity,
      status: 'CONFIRMED' as const,
      stage: 'confirmed',
      deathCount: 0,
      averageWeight: data.purchaseWeight / data.initialQuantity,
      // Adicionar campos de localização
      city: data.city,
      state: data.state,
      farm: data.farm
    });
  }

  async findAll(filters: any = {}, pagination?: any) {
    // Temporariamente sem include para testar
    return await this.repository.findAll(filters, pagination);
  }

  async findById(id: string) {
    const purchase = await this.repository.findWithRelations(id);
    if (!purchase) {
      throw new AppError('Compra não encontrada', 404);
    }
    return purchase;
  }

  async update(id: string, data: any) {
    const purchase = await this.findById(id);
    
    // Recalcular custos se necessário
    if (data.purchaseWeight || data.pricePerArroba) {
      const weight = data.purchaseWeight || purchase.purchaseWeight;
      const price = data.pricePerArroba || purchase.pricePerArroba;
      data.purchaseValue = (weight / 30) * price;
    }

    if (data.freightCost !== undefined || data.commission !== undefined) {
      data.totalCost = (data.purchaseValue || purchase.purchaseValue) +
                      (data.freightCost ?? purchase.freightCost) +
                      (data.commission ?? purchase.commission);
    }

    return await this.repository.update(id, data);
  }

  async updateStatus(id: string, status: PurchaseStatus) {
    return await this.repository.update(id, { 
      status,
      stage: status.toLowerCase()
    });
  }

  async registerReception(id: string, data: RegisterReceptionData) {
    const purchase = await this.findById(id);
    
    if (purchase.status !== 'CONFIRMED' && purchase.status !== 'IN_TRANSIT') {
      throw new AppError('Apenas compras confirmadas ou em trânsito podem ser recepcionadas', 400);
    }

    // Calcular quebra de peso
    const weightBreak = purchase.purchaseWeight - data.receivedWeight;
    const weightBreakPercentage = (weightBreak / purchase.purchaseWeight) * 100;
    
    // Calcular mortalidade
    const transportMortality = data.transportMortality || 
                              (purchase.initialQuantity - data.actualQuantity);

    // Se tiver alocações de curral, processar recepção e alocação juntas
    if (data.penAllocations && data.penAllocations.length > 0) {
      // Validar total de animais alocados
      const totalAllocated = data.penAllocations.reduce((sum: number, alloc) => sum + alloc.quantity, 0);
      if (totalAllocated !== data.actualQuantity) {
        throw new AppError(`Total alocado (${totalAllocated}) deve ser igual à quantidade recebida (${data.actualQuantity})`, 400);
      }

      // Executar em transação
      return await prisma.$transaction(async (tx) => {
        // Atualizar compra para ACTIVE direto
        const updatedPurchase = await tx.cattlePurchase.update({
          where: { id },
          data: {
            receivedDate: data.receivedDate,
            receivedWeight: data.receivedWeight,
            currentQuantity: data.actualQuantity,
            transportMortality,
            weightBreakPercentage,
            deathCount: transportMortality,
            freightDistance: data.freightDistance || purchase.freightDistance,
            freightCostPerKm: data.freightCostPerKm || purchase.freightCostPerKm,
            freightCost: data.freightValue || purchase.freightCost,
            transportCompanyId: data.transportCompanyId || purchase.transportCompanyId,
            expectedGMD: data.estimatedGMD || purchase.expectedGMD,
            status: 'ACTIVE' as const,
            stage: 'confined',
            averageWeight: data.receivedWeight / data.actualQuantity,
            notes: [
              purchase.notes,
              data.mortalityReason ? `Motivo da mortalidade: ${data.mortalityReason}` : null,
              data.notes
            ].filter(Boolean).join('\n').trim() || null,
            confinementDate: new Date()
          },
          include: {
            vendor: true,
            broker: true,
            pens: true
          }
        });

        // Criar alocações de curral
        for (const allocation of data.penAllocations) {
          await tx.lotPenLink.create({
            data: {
              purchaseId: id,
              penId: allocation.penId,
              quantity: allocation.quantity,
              entryDate: new Date(),
              status: 'ACTIVE'
            }
          });

          // Atualizar ocupação do curral
          await tx.pen.update({
            where: { id: allocation.penId },
            data: {
              currentOccupancy: {
                increment: allocation.quantity
              }
            }
          });
        }

        return updatedPurchase;
      });
    } else {
      // Apenas registrar recepção sem alocação (mantém compatibilidade)
      return await this.repository.update(id, {
        receivedDate: data.receivedDate,
        receivedWeight: data.receivedWeight,
        currentQuantity: data.actualQuantity,
        transportMortality,
        weightBreakPercentage,
        deathCount: transportMortality,
        freightDistance: data.freightDistance || purchase.freightDistance,
        freightCostPerKm: data.freightCostPerKm || purchase.freightCostPerKm,
        freightCost: data.freightValue || purchase.freightCost,
        transportCompanyId: data.transportCompanyId || purchase.transportCompanyId,
        expectedGMD: data.estimatedGMD || purchase.expectedGMD,
        status: 'RECEIVED' as const,
        stage: 'received',
        averageWeight: data.receivedWeight / data.actualQuantity,
        notes: [
          purchase.notes,
          data.mortalityReason ? `Motivo da mortalidade: ${data.mortalityReason}` : null,
          data.notes
        ].filter(Boolean).join('\n').trim() || null
      });
    }
  }

  async markAsConfined(id: string, data: MarkAsConfinedData) {
    const purchase = await this.findById(id);
    
    if (purchase.status !== 'RECEIVED') {
      throw new AppError('Apenas compras recepcionadas podem ser ativadas', 400);
    }

    // Validar total de animais alocados
    const totalAllocated = data.penAllocations.reduce((sum: number, alloc) => sum + alloc.quantity, 0);
    if (totalAllocated !== purchase.currentQuantity) {
      throw new AppError(`Total alocado (${totalAllocated}) deve ser igual à quantidade atual (${purchase.currentQuantity})`, 400);
    }

    // Executar em transação
    return await prisma.$transaction(async (tx) => {
      // Remover alocações antigas se existirem
      await tx.lotPenLink.updateMany({
        where: {
          purchaseId: id,
          status: 'ACTIVE'
        },
        data: {
          status: 'REMOVED',
          removalDate: new Date()
        }
      });

      // Criar novas alocações
      const allocationDate = new Date();
      for (const allocation of data.penAllocations) {
        // Verificar disponibilidade do curral
        const pen = await tx.pen.findUnique({
          where: { id: allocation.penId },
          include: {
            lotAllocations: {
              where: { status: 'ACTIVE' }
            }
          }
        });

        if (!pen) {
          throw new AppError(`Curral ${allocation.penId} não encontrado`, 404);
        }

        const currentOccupation = pen.lotAllocations.reduce((sum: number, alloc: any) => sum + alloc.quantity, 0);
        const availableSpace = pen.capacity - currentOccupation;

        if (allocation.quantity > availableSpace) {
          throw new AppError(`Curral ${pen.penNumber} não tem espaço suficiente. Disponível: ${availableSpace}`, 400);
        }

        // Criar alocação
        await tx.lotPenLink.create({
          data: {
            purchaseId: id,
            penId: allocation.penId,
            quantity: allocation.quantity,
            percentageOfLot: (allocation.quantity / purchase.currentQuantity) * 100,
            percentageOfPen: (allocation.quantity / pen.capacity) * 100,
            allocationDate,
            status: 'ACTIVE'
          }
        });

        // Atualizar status do curral
        if (currentOccupation + allocation.quantity >= pen.capacity) {
          await tx.pen.update({
            where: { id: allocation.penId },
            data: { status: 'OCCUPIED' }
          });
        }
      }

      // Atualizar status da compra
      const updated = await tx.cattlePurchase.update({
        where: { id },
        data: {
          status: 'ACTIVE' as const,
          stage: 'active',
          notes: data.notes ? `${purchase.notes || ''}\n${data.notes}`.trim() : purchase.notes
        },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true,
          penAllocations: {
            where: { status: 'ACTIVE' },
            include: { pen: true }
          }
        }
      });

      return updated;
    });
  }

  async registerDeath(id: string, count: number, date: Date) {
    const purchase = await this.findById(id);
    
    const newDeathCount = purchase.deathCount + count;
    const newCurrentQuantity = purchase.currentQuantity - count;
    
    if (newCurrentQuantity < 0) {
      throw new AppError('Quantidade de mortes excede quantidade atual', 400);
    }
    
    return await this.repository.update(id, {
      deathCount: newDeathCount,
      currentQuantity: newCurrentQuantity
    });
  }

  async delete(id: string) {
    const purchase = await this.findById(id);
    
    if (purchase.status === 'ACTIVE') {
      throw new AppError('Não é possível excluir compra ativa', 400);
    }
    
    // Remover alocações se existirem
    await prisma.lotPenLink.deleteMany({
      where: { purchaseId: id }
    });
    
    return await this.repository.delete(id);
  }

  async getStatistics() {
    return await this.repository.getStatistics();
  }

  async getDashboardSummary(dateRange?: { start: Date; end: Date }) {
    return await this.repository.getDashboardSummary(dateRange);
  }

  private async generateLotCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const lastPurchase = await this.repository.findOne(
      { lotCode: { startsWith: `LOT-${year}${month}` } },
      { orderBy: { lotCode: 'desc' } }
    );
    
    let sequence = '001';
    if (lastPurchase) {
      const lastSequence = parseInt(lastPurchase.lotCode.slice(-3));
      sequence = (lastSequence + 1).toString().padStart(3, '0');
    }
    
    return `LOT-${year}${month}${sequence}`;
  }
}

export const cattlePurchaseService = new CattlePurchaseService();