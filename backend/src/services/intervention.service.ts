import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

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
          cattle_purchases: true,
          pens: true
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
  async createMortalityRecord(data: MortalityRecordData, userId?: string) {
    try {
      // Verificar se o curral existe
      const pen = await prisma.pen.findUnique({ 
        where: { id: data.penId },
        include: {
          lotAllocations: {
            where: { status: 'ACTIVE' },
            include: {
              purchase: true
            }
          }
        }
      });

      if (!pen) throw new AppError('Curral não encontrado', 404);

      // Calcular total de animais no curral
      const totalAnimalsInPen = pen.lotAllocations.reduce(
        (sum, allocation) => sum + allocation.quantity, 
        0
      );

      // Verificar se há animais suficientes
      if (totalAnimalsInPen < data.quantity) {
        throw new AppError('Quantidade de mortes excede quantidade atual de animais no curral', 400);
      }

      // Calcular o custo médio ponderado dos animais no curral
      let totalCostInPen = 0;
      let totalWeightInPen = 0;
      let selectedPurchaseId = data.cattlePurchaseId;
      
      // Se não foi especificado um lote, usar o primeiro com animais
      if (!selectedPurchaseId && pen.lotAllocations.length > 0) {
        selectedPurchaseId = pen.lotAllocations[0].purchaseId;
      }

      // Calcular custo médio ponderado de todos os lotes no curral
      for (const allocation of pen.lotAllocations) {
        const purchase = allocation.purchase;
        // Custo total incluindo: valor de compra + frete + comissão + custos adicionais
        const totalPurchaseCost = purchase.totalCost || 
          (purchase.unitPrice * purchase.initialQuantity) + 
          (purchase.freightCost || 0) + 
          (purchase.commission || 0) +
          (purchase.healthCost || 0) +
          (purchase.feedCost || 0);
        
        const costPerAnimal = totalPurchaseCost / purchase.initialQuantity;
        const totalCostForAllocation = costPerAnimal * allocation.quantity;
        totalCostInPen += totalCostForAllocation;
        totalWeightInPen += (purchase.averageWeight || 0) * allocation.quantity;
      }

      // Custo médio por cabeça no curral (incluindo todos os custos acumulados)
      const averageCostPerHead = totalAnimalsInPen > 0 ? totalCostInPen / totalAnimalsInPen : 0;
      const averageWeight = totalAnimalsInPen > 0 ? totalWeightInPen / totalAnimalsInPen : 0;
      
      // Calcular o valor total da perda baseado no custo médio ponderado
      const totalLoss = averageCostPerHead * data.quantity;
      
      console.log(`📊 Cálculo de perda por mortalidade:
        - Curral: ${pen.penNumber}
        - Total de animais no curral: ${totalAnimalsInPen}
        - Custo médio por cabeça: R$ ${averageCostPerHead.toFixed(2)}
        - Quantidade de mortes: ${data.quantity}
        - Valor total da perda: R$ ${totalLoss.toFixed(2)}`);

      // Criar registro de mortalidade usando a tabela mortality_analyses
      const mortality = await (prisma as any).mortality_analyses.create({
        data: {
          cattle_purchase_id: selectedPurchaseId,
          pen_id: data.penId,
          quantity: data.quantity,
          mortality_date: data.deathDate,
          cause: data.cause || 'unknown',
          phase: 'fattening',
          notes: data.notes,
          // Campos financeiros calculados
          unit_cost: averageCostPerHead,
          total_loss: totalLoss,
          accumulated_cost: totalLoss,
          average_weight: averageWeight
        }
        // Removendo include pois pode estar causando problemas
      });

      // Criar lançamento de despesa no Centro Financeiro
      const expense = await prisma.expense.create({
        data: {
          category: 'deaths', // Categoria de Perdas Operacionais
          description: `Perda por mortalidade - ${data.quantity} cabeça(s) - Curral ${pen.penNumber}`,
          totalAmount: totalLoss,
          unitPrice: averageCostPerHead,
          quantity: data.quantity,
          dueDate: data.deathDate,
          paymentDate: data.deathDate,
          isPaid: true,
          impactsCashFlow: false, // Perda contábil, não impacta fluxo de caixa direto
          notes: `Causa: ${data.cause || 'Não informada'}. 
                  Peso médio: ${averageWeight.toFixed(2)} kg. 
                  Custo médio/cabeça: R$ ${averageCostPerHead.toFixed(2)}. 
                  ${data.specificCause ? `Causa específica: ${data.specificCause}. ` : ''}
                  ${data.notes || ''}`,
          userId: userId || 'system',
          penId: data.penId,
          // Relacionamentos
          purchase: selectedPurchaseId ? { connect: { id: selectedPurchaseId } } : undefined,
          cycle: pen.lotAllocations[0]?.purchase?.cycleId ? 
            { connect: { id: pen.lotAllocations[0].purchase.cycleId } } : undefined
        }
      });
      
      console.log(`✅ Despesa criada no Centro Financeiro:
        - ID: ${expense.id}
        - Categoria: Mortalidade (deaths)
        - Valor: R$ ${totalLoss.toFixed(2)}`);

      // INTEGRAR COM DRE - Adicionar dedução
      console.log('🔴 INTEGRANDO MORTALIDADE COM DRE');
      console.log('   Data da morte:', data.deathDate);
      console.log('   Perda total:', totalLoss);
      
      // Criar data no timezone local para evitar problemas de conversão
      const deathDateLocal = new Date(data.deathDate);
      const year = deathDateLocal.getFullYear();
      const month = deathDateLocal.getMonth();
      
      // Criar a data do primeiro dia do mês no timezone local
      const referenceMonth = new Date(year, month, 1, 0, 0, 0, 0);
      console.log('   Mês de referência:', referenceMonth);
      console.log('   Mês formatado:', referenceMonth.toISOString());

      // Buscar ou criar DRE do mês
      const cycleId = pen.lotAllocations[0]?.purchase?.cycleId || null;
      console.log('   Ciclo ID:', cycleId);
      
      let dreStatement = await prisma.dREStatement.findFirst({
        where: {
          referenceMonth: referenceMonth,
          cycleId: cycleId
        }
      });
      
      console.log('   DRE encontrado?', !!dreStatement);

      if (!dreStatement) {
        // Criar novo DRE se não existir
        dreStatement = await prisma.dREStatement.create({
          data: {
            referenceMonth: referenceMonth,
            cycleId: pen.lotAllocations[0]?.purchase?.cycleId || null,
            deductions: totalLoss,
            grossRevenue: 0,
            netRevenue: -totalLoss,
            animalCost: 0,
            feedCost: 0,
            healthCost: 0,
            laborCost: 0,
            otherCosts: 0,
            totalCosts: 0,
            grossProfit: -totalLoss,
            grossMargin: 0,
            adminExpenses: 0,
            salesExpenses: 0,
            financialExpenses: 0,
            otherExpenses: 0,
            totalExpenses: 0,
            operationalProfit: -totalLoss,
            operationalMargin: 0,
            netProfit: -totalLoss,
            netMargin: 0,
            status: 'DRAFT'
          }
        });
        logger.info(`DRE criado para ${referenceMonth.toISOString()} com dedução de mortalidade: R$ ${totalLoss.toFixed(2)}`);
        console.log('   ✅ DRE CRIADO com dedução:', totalLoss);
      } else {
        // Atualizar DRE existente
        console.log('   Atualizando DRE existente. Deduções atuais:', dreStatement.deductions);
        await prisma.dREStatement.update({
          where: { id: dreStatement.id },
          data: {
            deductions: {
              increment: totalLoss
            },
            netRevenue: {
              decrement: totalLoss
            },
            grossProfit: {
              decrement: totalLoss
            },
            operationalProfit: {
              decrement: totalLoss
            },
            netProfit: {
              decrement: totalLoss
            }
          }
        });
        logger.info(`DRE atualizado para ${referenceMonth.toISOString()} com dedução de mortalidade: R$ ${totalLoss.toFixed(2)}`);
        console.log('   ✅ DRE ATUALIZADO. Nova dedução adicionada:', totalLoss);
      }

      // Atualizar quantidades nos lotes (apenas quantidade, sem alterar peso ou valores)
      if (data.cattlePurchaseId) {
        // Se foi especificado um lote, reduzir apenas dele
        await prisma.cattlePurchase.update({
          where: { id: data.cattlePurchaseId },
          data: {
            currentQuantity: {
              decrement: data.quantity
            },
            deathCount: {
              increment: data.quantity
            }
            // NÃO alteramos: averageWeight, currentWeight, purchaseValue, etc.
            // Mantemos peso médio e valores originais
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
      } else {
        // Distribuir proporcionalmente entre todos os lotes do curral
        let remainingDeaths = data.quantity;
        
        for (const allocation of pen.lotAllocations) {
          if (remainingDeaths <= 0) break;
          
          // Calcular quantas mortes atribuir a este lote (proporcional)
          const proportionalDeaths = Math.min(
            Math.ceil((allocation.quantity / totalAnimalsInPen) * data.quantity),
            allocation.quantity,
            remainingDeaths
          );
          
          if (proportionalDeaths > 0) {
            // Atualizar o lote (apenas quantidade, sem alterar peso ou valores)
            await prisma.cattlePurchase.update({
              where: { id: allocation.purchaseId },
              data: {
                currentQuantity: {
                  decrement: proportionalDeaths
                },
                deathCount: {
                  increment: proportionalDeaths
                }
                // NÃO alteramos: averageWeight, currentWeight, purchaseValue, etc.
              }
            });
            
            // Atualizar a alocação
            await prisma.lotPenLink.update({
              where: { id: allocation.id },
              data: {
                quantity: {
                  decrement: proportionalDeaths
                }
              }
            });
            
            remainingDeaths -= proportionalDeaths;
          }
        }
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
          cattle_purchases: true,
          pens: true
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
            ...(filters.cattlePurchaseId && { purchaseId: filters.cattlePurchaseId }),
            ...(filters.startDate && filters.endDate && {
              readingDate: {
                gte: filters.startDate,
                lte: filters.endDate
              }
            })
          },
          include: {
            cattle_purchases: true
          },
          orderBy: {
            readingDate: 'desc'
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

      // Inicializar valores padrão para evitar erros
      let healthCount = 0;
      let mortalityStats = {
        _count: 0,
        _sum: {
          quantity: 0,
          estimatedLoss: 0
        }
      };
      let movementCount = 0;
      let weightCount = 0;

      const results = await Promise.allSettled([
          // Total de intervenções de saúde
          prisma.healthIntervention?.count({ where }) || Promise.resolve(0),
          
          // Estatísticas de mortalidade
          prisma.mortalityRecord?.aggregate({
            where,
            _sum: {
              quantity: true,
              estimatedLoss: true
            },
            _count: true
          }) || Promise.resolve(mortalityStats),
          
          // Total de movimentações
          prisma.penMovement?.count({ where }) || Promise.resolve(0),
        
          // Total de pesagens
          prisma.weightReading?.count({ where }) || Promise.resolve(0)
        ]);

      // Processar resultados
      if (results[0].status === 'fulfilled') healthCount = results[0].value;
      if (results[1].status === 'fulfilled') mortalityStats = results[1].value;
      if (results[2].status === 'fulfilled') movementCount = results[2].value;
      if (results[3].status === 'fulfilled') weightCount = results[3].value;

      // GMD médio não está disponível no modelo atual
      // Usar valor padrão
      let averageGMD = 0.5; // Valor padrão de GMD em kg/dia

      return {
        healthInterventions: healthCount,
        mortalityRecords: {
          total: mortalityStats._count || 0,
          totalDeaths: mortalityStats._sum?.quantity || 0,
          totalLoss: mortalityStats._sum?.estimatedLoss || 0
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