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

      // TAMBÉM criar registro na tabela MortalityRecord para aparecer no histórico de intervenções
      const mortalityRecord = await prisma.mortalityRecord.create({
        data: {
          cattlePurchaseId: selectedPurchaseId || '',
          penId: data.penId,
          quantity: data.quantity,
          deathDate: data.deathDate,
          cause: data.cause || 'unknown',
          specificCause: data.specificCause || null,
          notes: data.notes || null,
          estimatedLoss: totalLoss,
          necropsy: data.necropsy || false,
          necropsyReport: data.necropsyReport || null,
          veterinarianReport: data.veterinarianReport || null
        }
      });

      // Criar lançamento de despesa no Centro Financeiro (NÃO impacta caixa - apenas contábil)
      const expense = await prisma.expense.create({
        data: {
          category: 'deaths', // Categoria de Perdas Operacionais
          description: `Perda por mortalidade - ${data.quantity} cabeça(s) - Curral ${pen.penNumber}`,
          totalAmount: totalLoss,
          dueDate: data.deathDate,
          paymentDate: data.deathDate,
          isPaid: true, // Marcado como "pago" pois é uma perda já realizada
          impactsCashFlow: false, // IMPORTANTE: NÃO impacta fluxo de caixa - é apenas perda contábil/DRE
          notes: `PERDA CONTÁBIL - NÃO SAI DO CAIXA
                  Quantidade: ${data.quantity} cabeça(s).
                  Causa: ${data.cause || 'Não informada'}. 
                  Peso médio: ${averageWeight.toFixed(2)} kg. 
                  Custo médio/cabeça: R$ ${averageCostPerHead.toFixed(2)}. 
                  ${data.specificCause ? `Causa específica: ${data.specificCause}. ` : ''}
                  ${data.notes || ''}`,
          userId: userId || 'system',
          penId: data.penId,
          purchaseId: selectedPurchaseId || undefined
        }
      });
      
      console.log(`✅ Despesa criada no Centro Financeiro:
        - ID: ${expense.id}
        - Categoria: Mortalidade (deaths)
        - Valor: R$ ${totalLoss.toFixed(2)}`);

      // INTEGRAR COM ANÁLISE FINANCEIRA INTEGRADA
      console.log('📊 INTEGRANDO MORTALIDADE COM ANÁLISE FINANCEIRA');
      console.log('   Data da morte:', data.deathDate);
      console.log('   Perda total:', totalLoss);
      
      // Criar data no timezone local para evitar problemas de conversão
      const deathDateLocal = new Date(data.deathDate);
      const year = deathDateLocal.getFullYear();
      const month = deathDateLocal.getMonth();
      
      // Criar a data do primeiro dia do mês no timezone local
      const referenceMonth = new Date(year, month, 1, 0, 0, 0, 0);
      console.log('   Mês de referência:', referenceMonth);
      
      try {
        // Buscar ou criar análise financeira integrada do mês
        let financialAnalysis = await prisma.integratedFinancialAnalysis.findUnique({
          where: {
            referenceMonth: referenceMonth
          }
        });
        
        if (!financialAnalysis) {
          // Criar nova análise se não existir
          financialAnalysis = await prisma.integratedFinancialAnalysis.create({
            data: {
              referenceMonth: referenceMonth,
              referenceYear: year,
              totalRevenue: 0,
              totalExpenses: 0,
              netResult: 0,
              operationalExpenses: totalLoss, // Mortalidade entra como despesa operacional
              nonOperationalExpenses: 0,
              ebitda: -totalLoss,
              operationalMargin: 0,
              netMargin: 0,
              biologicalAssetValue: 0,
              inventoryValue: 0,
              status: 'DRAFT',
              userId: userId || 'system'
            }
          });
          console.log('   ✅ Análise financeira CRIADA com perda por mortalidade:', totalLoss);
        } else {
          // Atualizar análise existente
          await prisma.integratedFinancialAnalysis.update({
            where: { id: financialAnalysis.id },
            data: {
              operationalExpenses: {
                increment: totalLoss
              },
              netResult: {
                decrement: totalLoss
              },
              ebitda: {
                decrement: totalLoss
              }
            }
          });
          console.log('   ✅ Análise financeira ATUALIZADA. Perda adicionada:', totalLoss);
        }
        
        // Criar item de análise para rastreabilidade
        await prisma.integratedAnalysisItem.create({
          data: {
            analysisId: financialAnalysis.id,
            description: `Perda por mortalidade - ${data.quantity} cabeça(s) - Curral ${pen.penNumber}`,
            amount: -totalLoss, // Negativo pois é uma perda
            category: 'OPERATIONAL_EXPENSE',
            subCategory: 'MORTALITY',
            date: data.deathDate,
            transactionType: 'EXPENSE'
          }
        });
        
        logger.info(`Análise financeira integrada atualizada para ${referenceMonth.toISOString()} com perda de mortalidade: R$ ${totalLoss.toFixed(2)}`);
        
      } catch (error) {
        console.error('⚠️ Erro ao integrar com análise financeira:', error);
        // Não falhar a operação se a integração com análise falhar
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
      // Como ainda não temos modelos específicos de intervenções, vamos usar MortalityAnalysis
      // e dados dos CattlePurchases para calcular as estatísticas
      
      // Buscar estatísticas de mortalidade do mortality_analyses
      const mortalityStats = await prisma.mortality_analyses.aggregate({
        _count: true,
        _sum: {
          quantity: true,
          total_loss: true
        }
      });

      // Buscar total de animais e calcular taxa de mortalidade
      const cattlePurchases = await prisma.cattlePurchase.findMany({
        select: {
          initialQuantity: true,
          currentQuantity: true,
          deathCount: true,
          currentWeight: true,
          averageWeight: true
        }
      });

      const totalAnimals = cattlePurchases.reduce((sum, cp) => sum + (cp.initialQuantity || 0), 0);
      const currentAnimals = cattlePurchases.reduce((sum, cp) => sum + (cp.currentQuantity || 0), 0);
      const totalDeaths = cattlePurchases.reduce((sum, cp) => sum + (cp.deathCount || 0), 0);
      
      // Calcular peso médio atual
      const weights = cattlePurchases
        .filter(cp => cp.currentWeight || cp.averageWeight)
        .map(cp => cp.currentWeight || cp.averageWeight || 0);
      const averageWeight = weights.length > 0 
        ? weights.reduce((sum, w) => sum + w, 0) / weights.length 
        : 0;

      // Taxa de mortalidade
      const mortalityRate = totalAnimals > 0 ? totalDeaths / totalAnimals : 0;

      return {
        // Por enquanto, valores padrão para intervenções não implementadas
        healthInterventions: 0,
        totalMortalities: totalDeaths,
        movements: 0,
        weightReadings: 0,
        
        // Dados reais calculados
        mortalityRate,
        totalFinancialLoss: mortalityStats._sum?.total_loss || 0,
        averageWeight,
        
        // Dados adicionais
        totalAnimals,
        currentAnimals,
        mortalityRecords: {
          total: mortalityStats._count || 0,
          totalQuantity: mortalityStats._sum?.quantity || 0,
          totalLoss: mortalityStats._sum?.total_loss || 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de intervenções:', error);
      // Retornar valores padrão em caso de erro
      return {
        healthInterventions: 0,
        totalMortalities: 0,
        movements: 0,
        weightReadings: 0,
        mortalityRate: 0,
        totalFinancialLoss: 0,
        averageWeight: 0,
        totalAnimals: 0,
        currentAnimals: 0,
        mortalityRecords: {
          total: 0,
          totalQuantity: 0,
          totalLoss: 0
        }
      };
    }
  }
}

export const interventionService = new InterventionService();