import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';

// Tipos para as intervenções
export interface HealthInterventionData {
  cattlePurchaseId: string;
  penId: string;
  interventionType: 'vaccine' | 'medication' | 'treatment';
  productName: string;
  dose: number;
  unit?: string;
  applicationDate: Date;
  veterinarian?: string;
  batchNumber?: string;
  manufacturer?: string;
  expirationDate?: Date;
  cost?: number;
  notes?: string;
}

export interface MortalityRecordData {
  cattlePurchaseId: string;
  penId: string;
  quantity: number;
  deathDate: Date;
  cause: 'disease' | 'accident' | 'predator' | 'poisoning' | 'unknown' | 'other';
  specificCause?: string;
  veterinarianReport?: string;
  necropsy?: boolean;
  necropsyReport?: string;
  estimatedLoss?: number;
  notes?: string;
}

export interface PenMovementData {
  cattlePurchaseId: string;
  fromPenId: string;
  toPenId: string;
  quantity: number;
  movementDate: Date;
  reason: string;
  responsibleUser?: string;
  notes?: string;
}

export interface WeightReadingData {
  cattlePurchaseId: string;
  penId: string;
  averageWeight: number;
  totalWeight?: number;
  sampleSize: number;
  weighingDate: Date;
  weighingMethod?: 'individual' | 'sample' | 'estimated';
  equipment?: string;
  operator?: string;
  weatherConditions?: string;
  notes?: string;
}

export class InterventionService {
  // Intervenções de Saúde
  async createHealthIntervention(data: HealthInterventionData) {
    try {
      // Verificar se o lote e curral existem
      const [purchase, pen] = await Promise.all([
        prisma.cattlePurchase.findUnique({ where: { id: data.cattlePurchaseId } }),
        prisma.pen.findUnique({ where: { id: data.penId } })
      ]);

      if (!purchase) throw new AppError('Lote não encontrado', 404);
      if (!pen) throw new AppError('Curral não encontrado', 404);

      const intervention = await prisma.healthIntervention.create({
        data: {
          ...data,
          unit: data.unit || 'ml'
        },
        include: {
          cattlePurchase: true,
          pen: true
        }
      });

      // Atualizar custo de saúde no lote
      if (data.cost) {
        await prisma.cattlePurchase.update({
          where: { id: data.cattlePurchaseId },
          data: {
            healthCost: {
              increment: data.cost
            },
            totalCost: {
              increment: data.cost
            }
          }
        });
      }

      return intervention;
    } catch (error) {
      console.error('Erro ao criar intervenção de saúde:', error);
      throw error;
    }
  }

  // Registros de Mortalidade
  async createMortalityRecord(data: MortalityRecordData) {
    try {
      // Verificar se o lote e curral existem
      const [purchase, pen] = await Promise.all([
        prisma.cattlePurchase.findUnique({ where: { id: data.cattlePurchaseId } }),
        prisma.pen.findUnique({ where: { id: data.penId } })
      ]);

      if (!purchase) throw new AppError('Lote não encontrado', 404);
      if (!pen) throw new AppError('Curral não encontrado', 404);

      // Verificar se há animais suficientes
      if (purchase.currentQuantity < data.quantity) {
        throw new AppError('Quantidade de mortes excede quantidade atual de animais', 400);
      }

      // Criar registro de mortalidade
      const mortality = await prisma.mortalityRecord.create({
        data,
        include: {
          cattlePurchase: true,
          pen: true
        }
      });

      // Atualizar quantidade de animais e contagem de mortes no lote
      await prisma.cattlePurchase.update({
        where: { id: data.cattlePurchaseId },
        data: {
          currentQuantity: {
            decrement: data.quantity
          },
          deathCount: {
            increment: data.quantity
          }
        }
      });

      // Atualizar alocação no curral
      const allocation = await prisma.lotPenLink.findFirst({
        where: {
          purchaseId: data.cattlePurchaseId,
          penId: data.penId,
          status: 'ACTIVE'
        }
      });

      if (allocation) {
        await prisma.lotPenLink.update({
          where: { id: allocation.id },
          data: {
            quantity: {
              decrement: data.quantity
            }
          }
        });
      }

      return mortality;
    } catch (error) {
      console.error('Erro ao criar registro de mortalidade:', error);
      throw error;
    }
  }

  // Movimentações entre Currais
  async createPenMovement(data: PenMovementData) {
    try {
      // Verificar se o lote e currais existem
      const [purchase, fromPen, toPen] = await Promise.all([
        prisma.cattlePurchase.findUnique({ where: { id: data.cattlePurchaseId } }),
        prisma.pen.findUnique({ where: { id: data.fromPenId } }),
        prisma.pen.findUnique({ where: { id: data.toPenId } })
      ]);

      if (!purchase) throw new AppError('Lote não encontrado', 404);
      if (!fromPen) throw new AppError('Curral de origem não encontrado', 404);
      if (!toPen) throw new AppError('Curral de destino não encontrado', 404);

      // Verificar alocação no curral de origem
      const fromAllocation = await prisma.lotPenLink.findFirst({
        where: {
          purchaseId: data.cattlePurchaseId,
          penId: data.fromPenId,
          status: 'ACTIVE'
        }
      });

      if (!fromAllocation || fromAllocation.quantity < data.quantity) {
        throw new AppError('Quantidade insuficiente no curral de origem', 400);
      }

      // Verificar capacidade no curral de destino
      const toAllocations = await prisma.lotPenLink.findMany({
        where: {
          penId: data.toPenId,
          status: 'ACTIVE'
        }
      });

      const currentOccupancy = toAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
      const availableSpace = toPen.capacity - currentOccupancy;

      if (availableSpace < data.quantity) {
        throw new AppError('Capacidade insuficiente no curral de destino', 400);
      }

      // Executar movimentação em transação
      const result = await prisma.$transaction(async (tx) => {
        // Criar registro de movimentação
        const movement = await tx.penMovement.create({
          data,
          include: {
            cattlePurchase: true,
            fromPen: true,
            toPen: true
          }
        });

        // Atualizar alocação no curral de origem
        await tx.lotPenLink.update({
          where: { id: fromAllocation.id },
          data: {
            quantity: {
              decrement: data.quantity
            }
          }
        });

        // Verificar se já existe alocação no curral de destino
        const toAllocation = await tx.lotPenLink.findFirst({
          where: {
            purchaseId: data.cattlePurchaseId,
            penId: data.toPenId,
            status: 'ACTIVE'
          }
        });

        if (toAllocation) {
          // Atualizar alocação existente
          await tx.lotPenLink.update({
            where: { id: toAllocation.id },
            data: {
              quantity: {
                increment: data.quantity
              }
            }
          });
        } else {
          // Criar nova alocação
          await tx.lotPenLink.create({
            data: {
              purchaseId: data.cattlePurchaseId,
              penId: data.toPenId,
              quantity: data.quantity,
              percentageOfLot: (data.quantity / purchase.currentQuantity) * 100,
              percentageOfPen: (data.quantity / toPen.capacity) * 100,
              allocationDate: data.movementDate,
              status: 'ACTIVE'
            }
          });
        }

        return movement;
      });

      return result;
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      throw error;
    }
  }

  // Leituras de Peso
  async createWeightReading(data: WeightReadingData) {
    try {
      // Verificar se o lote e curral existem
      const [purchase, pen] = await Promise.all([
        prisma.cattlePurchase.findUnique({ where: { id: data.cattlePurchaseId } }),
        prisma.pen.findUnique({ where: { id: data.penId } })
      ]);

      if (!purchase) throw new AppError('Lote não encontrado', 404);
      if (!pen) throw new AppError('Curral não encontrado', 404);

      // Buscar última pesagem para calcular GMD
      const lastReading = await prisma.weightReading.findFirst({
        where: {
          cattlePurchaseId: data.cattlePurchaseId,
          penId: data.penId
        },
        orderBy: {
          weighingDate: 'desc'
        }
      });

      let gmd = null;
      if (lastReading) {
        const daysDiff = Math.floor(
          (data.weighingDate.getTime() - lastReading.weighingDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 0) {
          gmd = (data.averageWeight - lastReading.averageWeight) / daysDiff;
        }
      }

      // Calcular peso projetado para abate
      let projectedWeight = null;
      if (gmd && purchase.estimatedSlaughterDate) {
        const daysToSlaughter = Math.floor(
          (purchase.estimatedSlaughterDate.getTime() - data.weighingDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysToSlaughter > 0) {
          projectedWeight = data.averageWeight + (gmd * daysToSlaughter);
        }
      }

      // Criar leitura de peso
      const reading = await prisma.weightReading.create({
        data: {
          ...data,
          gmd,
          projectedWeight
        },
        include: {
          cattlePurchase: true,
          pen: true
        }
      });

      // Atualizar peso médio no lote
      await prisma.cattlePurchase.update({
        where: { id: data.cattlePurchaseId },
        data: {
          averageWeight: data.averageWeight,
          currentWeight: data.totalWeight || (data.averageWeight * purchase.currentQuantity)
        }
      });

      return reading;
    } catch (error) {
      console.error('Erro ao criar leitura de peso:', error);
      throw error;
    }
  }

  // Buscar histórico de intervenções
  async getInterventionHistory(filters: {
    cattlePurchaseId?: string;
    penId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: 'health' | 'mortality' | 'movement' | 'weight';
  }) {
    try {
      const results: any[] = [];

      // Buscar intervenções de saúde
      if (!filters.type || filters.type === 'health') {
        const healthInterventions = await prisma.healthIntervention.findMany({
          where: {
            ...(filters.cattlePurchaseId && { cattlePurchaseId: filters.cattlePurchaseId }),
            ...(filters.penId && { penId: filters.penId }),
            ...(filters.startDate && filters.endDate && {
              applicationDate: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            })
          },
          include: {
            cattlePurchase: true,
            pen: true
          },
          orderBy: {
            applicationDate: 'desc'
          }
        });
        results.push(...healthInterventions.map(i => ({ ...i, type: 'health' })));
      }

      // Buscar registros de mortalidade
      if (!filters.type || filters.type === 'mortality') {
        const mortalityRecords = await prisma.mortalityRecord.findMany({
          where: {
            ...(filters.cattlePurchaseId && { cattlePurchaseId: filters.cattlePurchaseId }),
            ...(filters.penId && { penId: filters.penId }),
            ...(filters.startDate && filters.endDate && {
              deathDate: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            })
          },
          include: {
            cattlePurchase: true,
            pen: true
          },
          orderBy: {
            deathDate: 'desc'
          }
        });
        results.push(...mortalityRecords.map(m => ({ ...m, type: 'mortality' })));
      }

      // Buscar movimentações
      if (!filters.type || filters.type === 'movement') {
        const movements = await prisma.penMovement.findMany({
          where: {
            ...(filters.cattlePurchaseId && { cattlePurchaseId: filters.cattlePurchaseId }),
            ...(filters.penId && {
              OR: [
                { fromPenId: filters.penId },
                { toPenId: filters.penId }
              ]
            }),
            ...(filters.startDate && filters.endDate && {
              movementDate: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            })
          },
          include: {
            cattlePurchase: true,
            fromPen: true,
            toPen: true
          },
          orderBy: {
            movementDate: 'desc'
          }
        });
        results.push(...movements.map(m => ({ ...m, type: 'movement' })));
      }

      // Buscar leituras de peso
      if (!filters.type || filters.type === 'weight') {
        const weightReadings = await prisma.weightReading.findMany({
          where: {
            ...(filters.cattlePurchaseId && { cattlePurchaseId: filters.cattlePurchaseId }),
            ...(filters.penId && { penId: filters.penId }),
            ...(filters.startDate && filters.endDate && {
              weighingDate: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            })
          },
          include: {
            cattlePurchase: true,
            pen: true
          },
          orderBy: {
            weighingDate: 'desc'
          }
        });
        results.push(...weightReadings.map(w => ({ ...w, type: 'weight' })));
      }

      // Ordenar por data
      results.sort((a, b) => {
        const dateA = a.applicationDate || a.deathDate || a.movementDate || a.weighingDate;
        const dateB = b.applicationDate || b.deathDate || b.movementDate || b.weighingDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return results;
    } catch (error) {
      console.error('Erro ao buscar histórico de intervenções:', error);
      throw error;
    }
  }

  // Estatísticas de intervenções
  async getInterventionStatistics(cycleId?: string) {
    try {
      const where = cycleId ? { cattlePurchase: { cycleId } } : {};

      const [healthCount, mortalityStats, movementCount, weightCount] = await Promise.all([
        // Total de intervenções de saúde
        prisma.healthIntervention.count({ where }),
        
        // Estatísticas de mortalidade
        prisma.mortalityRecord.aggregate({
          where,
          _sum: {
            quantity: true,
            estimatedLoss: true
          },
          _count: true
        }),
        
        // Total de movimentações
        prisma.penMovement.count({ where }),
        
        // Total de pesagens
        prisma.weightReading.count({ where })
      ]);

      // Buscar GMD médio das últimas pesagens
      const recentWeightReadings = await prisma.weightReading.findMany({
        where: {
          ...where,
          gmd: { not: null }
        },
        select: {
          gmd: true
        },
        take: 100,
        orderBy: {
          weighingDate: 'desc'
        }
      });

      const averageGMD = recentWeightReadings.length > 0
        ? recentWeightReadings.reduce((sum, r) => sum + (r.gmd || 0), 0) / recentWeightReadings.length
        : 0;

      return {
        healthInterventions: healthCount,
        mortalityRecords: {
          total: mortalityStats._count,
          totalDeaths: mortalityStats._sum.quantity || 0,
          totalLoss: mortalityStats._sum.estimatedLoss || 0
        },
        penMovements: movementCount,
        weightReadings: weightCount,
        averageGMD
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de intervenções:', error);
      throw error;
    }
  }
}

export const interventionService = new InterventionService();