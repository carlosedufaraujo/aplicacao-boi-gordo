import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

export interface MortalityCalculationResult {
  totalLoss: number;
  averageCostPerHead: number;
  lotsAffected: {
    id: string;
    lotCode: string;
    percentage: number;
    value: number;
  }[];
  calculationDetails: string;
}

export interface MortalityRegistrationData {
  penId: string;
  quantity: number;
  date: Date;
  cause: string;
  notes?: string;
  integrateFinancial?: boolean;
}

class MortalityCalculationService {
  /**
   * Calcula a perda financeira por mortalidade baseado no preço médio dos lotes no curral
   */
  async calculateMortalityLoss(
    penId: string, 
    quantity: number
  ): Promise<MortalityCalculationResult> {
    try {
      // 1. Buscar todos os lotes ativos no curral
      const lotsInPen = await prisma.lotPenLink.findMany({
        where: {
          penId,
          status: 'ACTIVE'
        },
        include: {
          purchase: true,
          pen: true
        }
      });

      if (lotsInPen.length === 0) {
        throw new Error(`Nenhum lote ativo encontrado no curral ${penId}`);
      }

      // 2. Calcular o custo total e quantidade de animais no curral
      let totalValue = 0;
      let totalAnimals = 0;
      const lotDetails: any[] = [];

      for (const link of lotsInPen) {
        const lot = link.purchase;
        
        // Custo total do lote (compra + frete + comissão + custos operacionais)
        const lotTotalCost = 
          (lot.purchaseValue || 0) + 
          (lot.freightCost || 0) + 
          (lot.commission || 0) +
          (lot.healthCost || 0) +
          (lot.feedCost || 0) +
          (lot.operationalCost || 0);
        
        // Quantidade de animais deste lote no curral
        const animalsInPen = link.quantity;
        
        // Valor proporcional deste lote no curral
        const proportionalValue = lot.currentQuantity > 0 
          ? (lotTotalCost * animalsInPen) / lot.currentQuantity
          : 0;
        
        totalValue += proportionalValue;
        totalAnimals += animalsInPen;
        
        lotDetails.push({
          id: lot.id,
          lotCode: lot.lotCode,
          animalsInPen,
          proportionalValue,
          costPerHead: proportionalValue / animalsInPen
        });
      }

      if (totalAnimals === 0) {
        throw new Error('Nenhum animal encontrado no curral');
      }

      // 3. Calcular o preço médio por cabeça
      const averageCostPerHead = totalValue / totalAnimals;
      
      // 4. Calcular a perda total
      const totalLoss = averageCostPerHead * quantity;

      // 5. Distribuir a perda proporcionalmente entre os lotes
      const lotsAffected = lotDetails.map(lot => ({
        id: lot.id,
        lotCode: lot.lotCode,
        percentage: (lot.animalsInPen / totalAnimals) * 100,
        value: (lot.animalsInPen / totalAnimals) * totalLoss
      }));

      // 6. Gerar detalhes do cálculo para auditoria
      const calculationDetails = `
        Curral: ${lotsInPen[0].pen.penNumber}
        Total de animais no curral: ${totalAnimals}
        Valor total no curral: R$ ${totalValue.toFixed(2)}
        Custo médio por cabeça: R$ ${averageCostPerHead.toFixed(2)}
        Quantidade de mortes: ${quantity}
        Perda total: R$ ${totalLoss.toFixed(2)}
        Lotes afetados: ${lotsAffected.map(l => l.lotCode).join(', ')}
      `.trim();

      logger.info('Cálculo de mortalidade realizado', {
        penId,
        quantity,
        totalLoss,
        averageCostPerHead,
        lotsCount: lotsAffected.length
      });

      return {
        totalLoss,
        averageCostPerHead,
        lotsAffected,
        calculationDetails
      };
    } catch (error) {
      logger.error('Erro ao calcular perda por mortalidade:', error);
      throw error;
    }
  }

  /**
   * Registra uma mortalidade e opcionalmente integra com o financeiro
   */
  async registerMortality(data: MortalityRegistrationData) {
    try {
      // 1. Calcular a perda
      const calculation = await this.calculateMortalityLoss(data.penId, data.quantity);

      // 2. Criar registro de mortalidade e integrar com DRE
      const mortality = await prisma.$transaction(async (tx) => {
        // Atualizar quantidade nos lotes afetados
        for (const lot of calculation.lotsAffected) {
          const proportionalDeaths = Math.round(
            data.quantity * (lot.percentage / 100)
          );
          
          await tx.cattlePurchase.update({
            where: { id: lot.id },
            data: {
              currentQuantity: {
                decrement: proportionalDeaths
              },
              deathCount: {
                increment: proportionalDeaths
              }
            }
          });
        }

        // Criar registro de mortalidade no banco
        const mortalityRecord = await tx.mortalityRecord.create({
          data: {
            cattlePurchaseId: calculation.lotsAffected[0].id, // Usar o primeiro lote como referência
            penId: data.penId,
            quantity: data.quantity,
            deathDate: data.date || new Date(),
            cause: data.cause || 'DESCONHECIDA',
            estimatedLoss: calculation.totalLoss,
            notes: data.notes
          }
        });

        // 3. Integrar com DRE se solicitado
        if (data.integrateFinancial !== false) {
          const referenceMonth = new Date(data.date || new Date());
          referenceMonth.setDate(1); // Primeiro dia do mês
          referenceMonth.setHours(0, 0, 0, 0);

          // Buscar ou criar DRE do mês
          let dreStatement = await tx.dREStatement.findFirst({
            where: {
              referenceMonth: referenceMonth,
              cycleId: null // Por enquanto sem ciclo específico
            }
          });

          if (!dreStatement) {
            // Criar novo DRE se não existir
            dreStatement = await tx.dREStatement.create({
              data: {
                referenceMonth: referenceMonth,
                deductions: calculation.totalLoss,
                grossRevenue: 0,
                netRevenue: -calculation.totalLoss,
                animalCost: 0,
                feedCost: 0,
                healthCost: 0,
                laborCost: 0,
                otherCosts: 0,
                totalCosts: 0,
                grossProfit: -calculation.totalLoss,
                grossMargin: 0,
                adminExpenses: 0,
                salesExpenses: 0,
                financialExpenses: 0,
                otherExpenses: 0,
                totalExpenses: 0,
                operationalProfit: -calculation.totalLoss,
                operationalMargin: 0,
                netProfit: -calculation.totalLoss,
                netMargin: 0,
                status: 'DRAFT'
              }
            });
          } else {
            // Atualizar DRE existente
            await tx.dREStatement.update({
              where: { id: dreStatement.id },
              data: {
                deductions: {
                  increment: calculation.totalLoss
                },
                netRevenue: {
                  decrement: calculation.totalLoss
                },
                grossProfit: {
                  decrement: calculation.totalLoss
                },
                operationalProfit: {
                  decrement: calculation.totalLoss
                },
                netProfit: {
                  decrement: calculation.totalLoss
                }
              }
            });
          }

          logger.info('Mortalidade integrada ao DRE', {
            dreId: dreStatement.id,
            deduction: calculation.totalLoss,
            month: referenceMonth
          });
        }

        return mortalityRecord;
      });

      logger.info('Mortalidade registrada com sucesso', {
        mortalityId: mortality.id,
        totalLoss: calculation.totalLoss
      });

      return {
        mortality,
        calculation,
        integrated: data.integrateFinancial !== false,
        message: data.integrateFinancial !== false 
          ? `Mortalidade registrada. Perda de R$ ${calculation.totalLoss.toFixed(2)} deduzida do DRE`
          : `Mortalidade registrada. Perda estimada: R$ ${calculation.totalLoss.toFixed(2)}`
      };
    } catch (error) {
      logger.error('Erro ao registrar mortalidade:', error);
      throw error;
    }
  }

  /**
   * Busca o histórico de mortalidade para análise
   */
  async getMortalityHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    penId?: string;
    cycleId?: string;
  }) {
    try {
      // Buscar nos registros de compra as mortalidades
      const purchases = await prisma.cattlePurchase.findMany({
        where: {
          deathCount: { gt: 0 },
          ...(filters?.cycleId && { cycleId: filters.cycleId }),
          ...(filters?.startDate && filters?.endDate && {
            updatedAt: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          })
        },
        include: {
          vendor: true,
          lotPenLinks: {
            include: {
              pen: true
            }
          }
        }
      });

      // Calcular estatísticas
      const totalDeaths = purchases.reduce((sum, p) => sum + (p.deathCount || 0), 0);
      const totalAnimals = purchases.reduce((sum, p) => sum + p.initialQuantity, 0);
      const mortalityRate = totalAnimals > 0 ? (totalDeaths / totalAnimals) * 100 : 0;

      // Estimar perda total (simplificado)
      const estimatedTotalLoss = purchases.reduce((sum, p) => {
        const costPerHead = p.totalCost / p.initialQuantity;
        return sum + (costPerHead * (p.deathCount || 0));
      }, 0);

      return {
        records: purchases.map(p => ({
          lotCode: p.lotCode,
          deathCount: p.deathCount,
          initialQuantity: p.initialQuantity,
          mortalityRate: ((p.deathCount || 0) / p.initialQuantity) * 100,
          estimatedLoss: (p.totalCost / p.initialQuantity) * (p.deathCount || 0),
          pens: p.lotPenLinks.map(l => l.pen.penNumber)
        })),
        summary: {
          totalDeaths,
          totalAnimals,
          mortalityRate,
          estimatedTotalLoss
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar histórico de mortalidade:', error);
      throw error;
    }
  }

  /**
   * Calcula o impacto da mortalidade no DRE
   */
  async calculateDREImpact(period: { start: Date; end: Date }) {
    try {
      const history = await this.getMortalityHistory({
        startDate: period.start,
        endDate: period.end
      });

      return {
        period: {
          start: period.start,
          end: period.end
        },
        deduction: history.summary.estimatedTotalLoss,
        mortalityRate: history.summary.mortalityRate,
        totalDeaths: history.summary.totalDeaths,
        impact: 'DEDUÇÃO_RECEITA_BRUTA',
        description: `Dedução por mortalidade de ${history.summary.totalDeaths} animais (${history.summary.mortalityRate.toFixed(2)}% de taxa)`
      };
    } catch (error) {
      logger.error('Erro ao calcular impacto no DRE:', error);
      throw error;
    }
  }
}

export default new MortalityCalculationService();