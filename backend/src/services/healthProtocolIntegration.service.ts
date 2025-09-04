import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';
import cashFlowService from './cashFlow.service';

const prisma = new PrismaClient();

export interface HealthProtocolData {
  type: 'VACINA' | 'MEDICAMENTO' | 'VERMIFUGO' | 'SUPLEMENTO' | 'TRATAMENTO';
  name: string;
  description?: string;
  
  // Aplicação
  applicationDate: Date;
  penId?: string;
  lotId?: string;
  animalCount: number;
  
  // Financeiro
  costPerAnimal: number;
  totalCost?: number; // Calculado automaticamente se não fornecido
  
  // Pagamento
  supplierId?: string;
  supplierName?: string;
  dueDate: Date;
  paymentMethod?: string;
  
  // Conta para pagamento
  payerAccountId: string;
  
  // Veterinário
  veterinarianName?: string;
  prescription?: string;
  notes?: string;
  
  // Integração
  integrateFinancial?: boolean;
}

class HealthProtocolIntegrationService {
  /**
   * Cria um protocolo sanitário com integração financeira opcional
   */
  async createHealthProtocolWithFinancial(data: HealthProtocolData) {
    try {
      // Calcular custo total se não fornecido
      const totalCost = data.totalCost || (data.costPerAnimal * data.animalCount);

      // Iniciar transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Buscar informações adicionais se necessário
        let penInfo = null;
        let lotInfo = null;

        if (data.penId) {
          penInfo = await tx.pen.findUnique({
            where: { id: data.penId }
          });
        }

        if (data.lotId) {
          lotInfo = await tx.cattlePurchase.findUnique({
            where: { id: data.lotId }
          });
        }

        // 2. Criar registro do protocolo sanitário
        // Adaptando ao modelo existente - ajustar conforme necessário
        const protocol = {
          id: `protocol-${Date.now()}`,
          type: data.type,
          name: data.name,
          description: data.description,
          applicationDate: data.applicationDate,
          penId: data.penId,
          lotId: data.lotId,
          animalCount: data.animalCount,
          costPerAnimal: data.costPerAnimal,
          totalCost,
          veterinarianName: data.veterinarianName,
          prescription: data.prescription,
          notes: data.notes,
          createdAt: new Date()
        };

        // 3. Criar lançamento financeiro se integração estiver ativa
        let cashFlowEntry = null;
        if (data.integrateFinancial !== false) {
          // Determinar categoria baseada no tipo
          const categoryMap = {
            'VACINA': 'saude-animal-vacinas',
            'MEDICAMENTO': 'saude-animal-medicamentos',
            'VERMIFUGO': 'saude-animal-vermifugos',
            'SUPLEMENTO': 'saude-animal-suplementos',
            'TRATAMENTO': 'saude-animal-tratamentos'
          };

          // Criar descrição detalhada
          const description = this.buildDescription(data, penInfo, lotInfo);

          // Criar lançamento no CashFlow
          cashFlowEntry = await tx.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: categoryMap[data.type] || 'saude-animal',
              accountId: data.payerAccountId,
              
              // Datas
              date: data.applicationDate, // Competência
              dueDate: data.dueDate,     // Vencimento
              
              // Valores
              amount: totalCost,
              
              // Descrição
              description,
              
              // Status inicial
              status: 'PENDING',
              
              // Referências
              reference: `PROTOCOL-${protocol.id}`,
              supplier: data.supplierName || data.supplierId,
              
              // Método de pagamento
              paymentMethod: data.paymentMethod,
              
              // Metadados
              notes: data.notes,
              tags: [
                'saude-animal',
                data.type.toLowerCase(),
                penInfo?.penNumber,
                lotInfo?.lotCode
              ].filter(Boolean),
              
              // Anexos
              attachments: data.prescription ? [data.prescription] : []
            }
          });

          logger.info('Lançamento financeiro criado para protocolo sanitário', {
            protocolId: protocol.id,
            cashFlowId: cashFlowEntry.id,
            amount: totalCost
          });
        }

        return {
          protocol,
          cashFlowEntry,
          penInfo,
          lotInfo
        };
      });

      logger.info('Protocolo sanitário criado com sucesso', {
        protocolId: result.protocol.id,
        integrated: !!result.cashFlowEntry
      });

      return {
        success: true,
        protocol: result.protocol,
        cashFlow: result.cashFlowEntry,
        message: result.cashFlowEntry 
          ? `Protocolo registrado com lançamento de ${this.formatCurrency(totalCost)}` 
          : 'Protocolo registrado sem integração financeira'
      };

    } catch (error) {
      logger.error('Erro ao criar protocolo sanitário:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de pagamento de um protocolo
   */
  async updateProtocolPaymentStatus(
    protocolId: string, 
    status: 'PAID' | 'CANCELLED',
    paymentDate?: Date
  ) {
    try {
      // Buscar o lançamento financeiro associado
      const cashFlowEntry = await prisma.cashFlow.findFirst({
        where: {
          reference: `PROTOCOL-${protocolId}`
        }
      });

      if (!cashFlowEntry) {
        throw new Error('Lançamento financeiro não encontrado para este protocolo');
      }

      // Atualizar status
      const updated = await cashFlowService.updateStatus(
        cashFlowEntry.id,
        status,
        paymentDate
      );

      logger.info('Status de pagamento do protocolo atualizado', {
        protocolId,
        cashFlowId: cashFlowEntry.id,
        status,
        paymentDate
      });

      return {
        success: true,
        cashFlow: updated,
        message: status === 'PAID' 
          ? 'Protocolo marcado como pago' 
          : 'Protocolo cancelado'
      };

    } catch (error) {
      logger.error('Erro ao atualizar status de pagamento:', error);
      throw error;
    }
  }

  /**
   * Busca protocolos com seus lançamentos financeiros
   */
  async getProtocolsWithFinancial(filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    penId?: string;
    lotId?: string;
    paid?: boolean;
  }) {
    try {
      // Buscar lançamentos de protocolos
      const cashFlows = await prisma.cashFlow.findMany({
        where: {
          reference: { startsWith: 'PROTOCOL-' },
          ...(filters?.startDate && filters?.endDate && {
            date: {
              gte: filters.startDate,
              lte: filters.endDate
            }
          }),
          ...(filters?.paid !== undefined && {
            status: filters.paid ? 'PAID' : 'PENDING'
          })
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Processar e enriquecer dados
      const protocols = cashFlows.map(cf => {
        // Extrair informações do protocolo da descrição/tags
        const protocolId = cf.reference?.replace('PROTOCOL-', '');
        const type = cf.tags?.find(t => 
          ['vacina', 'medicamento', 'vermifugo', 'suplemento', 'tratamento'].includes(t)
        )?.toUpperCase() || 'UNKNOWN';

        return {
          protocolId,
          type,
          description: cf.description,
          applicationDate: cf.date,
          dueDate: cf.dueDate,
          paymentDate: cf.paymentDate,
          amount: cf.amount,
          status: cf.status,
          isPaid: cf.status === 'PAID',
          supplier: cf.supplier,
          notes: cf.notes,
          cashFlowId: cf.id
        };
      });

      // Calcular estatísticas
      const totalInvested = protocols
        .filter(p => p.isPaid)
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayment = protocols
        .filter(p => !p.isPaid)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        protocols,
        summary: {
          totalProtocols: protocols.length,
          totalInvested,
          pendingPayment,
          byType: this.groupByType(protocols)
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar protocolos com financeiro:', error);
      throw error;
    }
  }

  /**
   * Calcula o ROI dos investimentos em saúde
   */
  async calculateHealthROI(period: { start: Date; end: Date }) {
    try {
      // Buscar investimentos em saúde
      const { summary } = await this.getProtocolsWithFinancial({
        startDate: period.start,
        endDate: period.end,
        paid: true
      });

      // Buscar mortalidade do período (simplificado)
      // Em produção, comparar com período anterior ou média histórica
      const mortalityData = await prisma.cattlePurchase.aggregate({
        where: {
          updatedAt: {
            gte: period.start,
            lte: period.end
          }
        },
        _sum: {
          deathCount: true,
          initialQuantity: true
        }
      });

      const mortalityRate = mortalityData._sum.initialQuantity 
        ? (mortalityData._sum.deathCount || 0) / mortalityData._sum.initialQuantity * 100
        : 0;

      // Estimar perdas evitadas (baseado em média histórica de 3% de mortalidade)
      const expectedMortalityRate = 3; // %
      const actualMortalityRate = mortalityRate;
      const mortalityReduction = Math.max(0, expectedMortalityRate - actualMortalityRate);
      
      // Valor médio por animal (simplificado)
      const avgAnimalValue = 3000; // R$ - ajustar conforme realidade
      const animalsTotal = mortalityData._sum.initialQuantity || 0;
      const animalsSaved = animalsTotal * (mortalityReduction / 100);
      const lossAvoided = animalsSaved * avgAnimalValue;

      // Calcular ROI
      const roi = summary.totalInvested > 0 
        ? ((lossAvoided - summary.totalInvested) / summary.totalInvested) * 100
        : 0;

      return {
        period,
        investment: summary.totalInvested,
        mortalityRate: actualMortalityRate,
        expectedMortalityRate,
        mortalityReduction,
        animalsSaved: Math.round(animalsSaved),
        lossAvoided,
        roi,
        analysis: roi > 0 
          ? `Retorno positivo de ${roi.toFixed(1)}% sobre investimento em saúde`
          : 'Investimento em saúde ainda não gerou retorno mensurável'
      };

    } catch (error) {
      logger.error('Erro ao calcular ROI de saúde:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares
   */
  private buildDescription(
    data: HealthProtocolData, 
    penInfo: any, 
    lotInfo: any
  ): string {
    const parts = [
      `${data.type}: ${data.name}`,
      `${data.animalCount} animais`
    ];

    if (penInfo) {
      parts.push(`Curral ${penInfo.penNumber}`);
    }

    if (lotInfo) {
      parts.push(`Lote ${lotInfo.lotCode}`);
    }

    return parts.join(' - ');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private groupByType(protocols: any[]): Record<string, number> {
    return protocols.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {});
  }
}

export default new HealthProtocolIntegrationService();