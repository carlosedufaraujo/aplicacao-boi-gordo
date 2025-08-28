import { CattleLot, LotStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { prisma } from '@/config/database';

export class CattleLotRepository extends BaseRepository<CattleLot> {
  constructor() {
    super(prisma.cattleLot);
  }

  async findWithRelations(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
            broker: true,
          },
        },
        penAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            pen: true,
          },
        },
        movements: {
          orderBy: { movementDate: 'desc' },
          take: 10,
        },
        healthRecords: {
          include: {
            protocol: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        weightReadings: {
          orderBy: { readingDate: 'desc' },
          take: 10,
        },
        expenses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        nonCashExpenses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        saleRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByStatus(status: LotStatus) {
    return this.model.findMany({
      where: { status },
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCosts(id: string, costType: string, amount: number) {
    const updateData: any = {};
    updateData[costType] = { increment: amount };
    updateData.totalCost = { increment: amount };

    return this.model.update({
      where: { id },
      data: updateData,
    });
  }

  async recordMortality(id: string, quantity: number) {
    return this.model.update({
      where: { id },
      data: {
        deathCount: { increment: quantity },
        currentQuantity: { decrement: quantity },
      },
    });
  }

  async getLotMetrics(id: string) {
    const lot = await this.findWithRelations(id);
    if (!lot) return null;

    // Calcula métricas
    const daysInConfinement = Math.floor(
      (new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const mortalityRate = (lot.deathCount / lot.entryQuantity) * 100;
    
    const costPerHead = lot.currentQuantity > 0 
      ? lot.totalCost / lot.currentQuantity 
      : 0;
    
    const costPerArroba = lot.currentQuantity > 0 && lot.entryWeight > 0
      ? (lot.totalCost / ((lot.entryWeight / lot.entryQuantity * lot.currentQuantity) / 15))
      : 0;

    // Peso atual (última leitura ou estimativa)
    const lastWeightReading = lot.weightReadings[0];
    const currentWeight = lastWeightReading?.totalWeight || lot.entryWeight;
    const averageWeight = lot.currentQuantity > 0 
      ? currentWeight / lot.currentQuantity 
      : 0;

    return {
      lot,
      metrics: {
        daysInConfinement,
        mortalityRate,
        costPerHead,
        costPerArroba,
        currentWeight,
        averageWeight,
        totalInvestment: lot.totalCost,
        remainingAnimals: lot.currentQuantity,
      },
    };
  }

  async allocateToPens(lotId: string, allocations: Array<{ penId: string; quantity: number }>, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.cattleLot.findUnique({
        where: { id: lotId },
        include: {
          penAllocations: {
            where: { status: 'ACTIVE' },
          },
          purchaseOrder: true,
        },
      });

      if (!lot) {
        throw new Error('Lote não encontrado');
      }

      // Calcula quantidade já alocada
      const allocatedQuantity = lot.penAllocations.reduce((sum, a) => sum + a.quantity, 0);
      const toAllocate = allocations.reduce((sum, a) => sum + a.quantity, 0);

      if (allocatedQuantity + toAllocate > lot.currentQuantity) {
        throw new Error('Quantidade a alocar excede quantidade disponível');
      }

      // Cria as alocações
      const allocationData = await Promise.all(
        allocations.map(async (allocation) => {
          // Verifica capacidade do curral
          const pen = await tx.pen.findUnique({
            where: { id: allocation.penId },
            include: {
              lotAllocations: {
                where: { status: 'ACTIVE' },
              },
            },
          });

          if (!pen) {
            throw new Error(`Curral ${allocation.penId} não encontrado`);
          }

          const penOccupied = pen.lotAllocations.reduce((sum, a) => sum + a.quantity, 0);
          if (penOccupied + allocation.quantity > pen.capacity) {
            throw new Error(`Capacidade do curral ${pen.penNumber} excedida`);
          }

          const percentageOfLot = (allocation.quantity / lot.currentQuantity) * 100;
          const percentageOfPen = (allocation.quantity / pen.capacity) * 100;

          return {
            lotId,
            penId: allocation.penId,
            quantity: allocation.quantity,
            percentageOfLot,
            percentageOfPen,
            allocationDate: new Date(),
            status: 'ACTIVE' as const,
          };
        })
      );

      // Cria as alocações
      await tx.lotPenLink.createMany({
        data: allocationData,
      });

      // Atualiza status dos currais
      for (const allocation of allocations) {
        await tx.pen.update({
          where: { id: allocation.penId },
          data: { status: 'OCCUPIED' },
        });
      }

      // Cria movimentações
      await tx.lotMovement.createMany({
        data: allocations.map((allocation) => ({
          lotId,
          toPenId: allocation.penId,
          movementType: 'ALLOCATION' as const,
          quantity: allocation.quantity,
          reason: 'Alocação inicial',
          userId: userId,
          movementDate: new Date(),
        })),
      });

      return allocationData;
    });
  }
} 