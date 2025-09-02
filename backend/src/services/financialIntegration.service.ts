import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { Decimal } from 'decimal.js';
import { 
  CattlePurchase, 
  SaleRecord, 
  Intervention,
  Expense,
  Revenue,
  CostCenter,
  ExpenseAllocation,
  RevenueAllocation
} from '@prisma/client';

export class FinancialIntegrationService {
  /**
   * Integra uma compra de gado com o financeiro
   */
  async integratePurchase(purchaseId: string): Promise<void> {
    try {
      logger.info(`Integrando compra ${purchaseId} com financeiro`);
      
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true
        }
      });

      if (!purchase) {
        throw new Error(`Compra ${purchaseId} não encontrada`);
      }

      // Verificar se já foi integrado
      const existingIntegration = await prisma.financialIntegration.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: 'PURCHASE',
            sourceId: purchaseId
          }
        }
      });

      if (existingIntegration && existingIntegration.status === 'PROCESSED') {
        logger.info(`Compra ${purchaseId} já foi integrada`);
        return;
      }

      const expenseIds: string[] = [];

      // 1. Criar despesa da compra de gado
      const purchaseValue = new Decimal(purchase.purchaseWeight)
        .mul(purchase.pricePerArroba)
        .div(15); // Converter de arroba para total

      const purchaseExpense = await prisma.expense.create({
        data: {
          category: 'CATTLE_PURCHASE',
          description: `Compra de Gado - Lote ${purchase.lotCode}`,
          totalAmount: purchaseValue.toNumber(),
          dueDate: new Date(purchase.purchaseDate),
          competenceDate: new Date(purchase.purchaseDate),
          isPaid: false,
          paymentMethod: 'BANK_TRANSFER',
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.vendorId,
          payerAccountId: purchase.payerAccountId,
          allocationMethod: 'PER_LOT',
          userId: 'system',
          notes: `${purchase.initialQuantity} animais, ${purchase.purchaseWeight}kg total`
        }
      });
      expenseIds.push(purchaseExpense.id);

      // Criar alocação específica para o lote
      await prisma.expenseAllocation.create({
        data: {
          expenseId: purchaseExpense.id,
          entityType: 'LOT',
          entityId: purchase.id,
          allocatedAmount: purchaseValue.toNumber(),
          percentage: 100
        }
      });

      // 2. Criar despesa de transporte se houver
      if (purchase.transportCompanyId && purchase.transportValue) {
        const transportExpense = await prisma.expense.create({
          data: {
            category: 'TRANSPORT',
            description: `Frete - Lote ${purchase.lotCode}`,
            totalAmount: purchase.transportValue,
            dueDate: new Date(purchase.purchaseDate),
            competenceDate: new Date(purchase.purchaseDate),
            isPaid: false,
            paymentMethod: 'BANK_TRANSFER',
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.transportCompanyId,
            payerAccountId: purchase.payerAccountId,
            allocationMethod: 'PER_LOT',
            userId: 'system'
          }
        });
        expenseIds.push(transportExpense.id);

        await prisma.expenseAllocation.create({
          data: {
            expenseId: transportExpense.id,
            entityType: 'LOT',
            entityId: purchase.id,
            allocatedAmount: purchase.transportValue,
            percentage: 100
          }
        });
      }

      // 3. Criar despesa de comissão se houver corretor
      if (purchase.brokerId && purchase.commissionPercentage) {
        const commissionValue = purchaseValue.mul(purchase.commissionPercentage).div(100);
        
        const commissionExpense = await prisma.expense.create({
          data: {
            category: 'COMMISSION',
            description: `Comissão Corretor - Lote ${purchase.lotCode}`,
            totalAmount: commissionValue.toNumber(),
            dueDate: new Date(purchase.purchaseDate),
            competenceDate: new Date(purchase.purchaseDate),
            isPaid: false,
            paymentMethod: 'BANK_TRANSFER',
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.brokerId,
            payerAccountId: purchase.payerAccountId,
            allocationMethod: 'PER_LOT',
            userId: 'system'
          }
        });
        expenseIds.push(commissionExpense.id);

        await prisma.expenseAllocation.create({
          data: {
            expenseId: commissionExpense.id,
            entityType: 'LOT',
            entityId: purchase.id,
            allocatedAmount: commissionValue.toNumber(),
            percentage: 100
          }
        });
      }

      // 4. Criar centro de custo específico do lote
      await this.createLotCostCenter(purchase);

      // 5. Registrar integração
      await prisma.financialIntegration.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: 'PURCHASE',
            sourceId: purchaseId
          }
        },
        update: {
          expenseIds,
          status: 'PROCESSED',
          processedAt: new Date()
        },
        create: {
          sourceType: 'PURCHASE',
          sourceId: purchaseId,
          expenseIds,
          status: 'PROCESSED',
          processedAt: new Date(),
          userId: 'system'
        }
      });

      // 6. Atualizar análise de rentabilidade
      await this.updateLotProfitability(purchaseId);

      logger.info(`Compra ${purchaseId} integrada com sucesso. ${expenseIds.length} despesas criadas.`);
    } catch (error) {
      logger.error(`Erro ao integrar compra ${purchaseId}:`, error);
      
      // Registrar erro na integração
      await prisma.financialIntegration.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: 'PURCHASE',
            sourceId: purchaseId
          }
        },
        update: {
          status: 'ERROR',
          errorMessage: error.message
        },
        create: {
          sourceType: 'PURCHASE',
          sourceId: purchaseId,
          status: 'ERROR',
          errorMessage: error.message,
          expenseIds: [],
          revenueIds: [],
          userId: 'system'
        }
      });
      
      throw error;
    }
  }

  /**
   * Integra uma venda de gado com o financeiro
   */
  async integrateSale(saleId: string): Promise<void> {
    try {
      logger.info(`Integrando venda ${saleId} com financeiro`);
      
      const sale = await prisma.saleRecord.findUnique({
        where: { id: saleId },
        include: {
          purchase: true,
          buyer: true
        }
      });

      if (!sale) {
        throw new Error(`Venda ${saleId} não encontrada`);
      }

      // Verificar se já foi integrado
      const existingIntegration = await prisma.financialIntegration.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: 'SALE',
            sourceId: saleId
          }
        }
      });

      if (existingIntegration && existingIntegration.status === 'PROCESSED') {
        logger.info(`Venda ${saleId} já foi integrada`);
        return;
      }

      const revenueIds: string[] = [];

      // Calcular valor da venda
      const saleValue = new Decimal(sale.slaughterWeight || 0)
        .mul(sale.pricePerArroba || 0)
        .div(15);

      // Criar receita da venda
      const saleRevenue = await prisma.revenue.create({
        data: {
          category: 'CATTLE_SALE',
          description: `Venda de Gado - Lote ${sale.purchase.lotCode}`,
          totalAmount: saleValue.toNumber(),
          dueDate: sale.paymentDate || sale.expectedDate,
          competenceDate: sale.slaughterDate || sale.shipmentDate || new Date(),
          isReceived: false,
          saleRecordId: sale.id,
          buyerId: sale.buyerId,
          purchaseId: sale.purchaseId,
          allocationMethod: 'PER_LOT',
          userId: 'system',
          invoiceNumber: sale.invoiceNumber,
          notes: `Venda ${sale.saleNumber}`
        }
      });
      revenueIds.push(saleRevenue.id);

      // Criar alocação
      await prisma.revenueAllocation.create({
        data: {
          revenueId: saleRevenue.id,
          entityType: 'LOT',
          entityId: sale.purchaseId,
          allocatedAmount: saleValue.toNumber(),
          percentage: 100
        }
      });

      // Registrar integração
      await prisma.financialIntegration.upsert({
        where: {
          sourceType_sourceId: {
            sourceType: 'SALE',
            sourceId: saleId
          }
        },
        update: {
          revenueIds,
          status: 'PROCESSED',
          processedAt: new Date()
        },
        create: {
          sourceType: 'SALE',
          sourceId: saleId,
          revenueIds,
          expenseIds: [],
          status: 'PROCESSED',
          processedAt: new Date(),
          userId: 'system'
        }
      });

      // Atualizar análise de rentabilidade
      await this.updateLotProfitability(sale.purchaseId);

      logger.info(`Venda ${saleId} integrada com sucesso.`);
    } catch (error) {
      logger.error(`Erro ao integrar venda ${saleId}:`, error);
      throw error;
    }
  }

  /**
   * Integra uma intervenção veterinária com o financeiro
   */
  async integrateIntervention(interventionId: string): Promise<void> {
    try {
      logger.info(`Integrando intervenção ${interventionId} com financeiro`);
      
      const intervention = await prisma.intervention.findUnique({
        where: { id: interventionId }
      });

      if (!intervention) {
        throw new Error(`Intervenção ${interventionId} não encontrada`);
      }

      // Verificar se já foi integrado
      const existingIntegration = await prisma.financialIntegration.findUnique({
        where: {
          sourceType_sourceId: {
            sourceType: 'INTERVENTION',
            sourceId: interventionId
          }
        }
      });

      if (existingIntegration && existingIntegration.status === 'PROCESSED') {
        logger.info(`Intervenção ${interventionId} já foi integrada`);
        return;
      }

      // Determinar categoria baseada no tipo de intervenção
      const category = this.getInterventionCategory(intervention.type);

      // Criar despesa
      const interventionExpense = await prisma.expense.create({
        data: {
          category,
          subcategory: intervention.type,
          description: `${intervention.type} - Lote ${intervention.lotId}`,
          totalAmount: intervention.totalCost,
          dueDate: new Date(intervention.interventionDate),
          competenceDate: new Date(intervention.interventionDate),
          isPaid: false,
          impactsCashFlow: true,
          purchaseId: intervention.lotId,
          interventionId: intervention.id,
          allocationMethod: 'PER_ANIMAL',
          userId: 'system',
          notes: intervention.observations
        }
      });

      // Criar alocação
      await prisma.expenseAllocation.create({
        data: {
          expenseId: interventionExpense.id,
          entityType: 'LOT',
          entityId: intervention.lotId,
          allocatedAmount: intervention.totalCost,
          percentage: 100
        }
      });

      // Registrar integração
      await prisma.financialIntegration.create({
        data: {
          sourceType: 'INTERVENTION',
          sourceId: interventionId,
          expenseIds: [interventionExpense.id],
          revenueIds: [],
          status: 'PROCESSED',
          processedAt: new Date(),
          userId: 'system'
        }
      });

      // Atualizar análise de rentabilidade
      await this.updateLotProfitability(intervention.lotId);

      logger.info(`Intervenção ${interventionId} integrada com sucesso.`);
    } catch (error) {
      logger.error(`Erro ao integrar intervenção ${interventionId}:`, error);
      throw error;
    }
  }

  /**
   * Cria centro de custo específico para um lote
   */
  private async createLotCostCenter(purchase: CattlePurchase): Promise<void> {
    try {
      const code = `CC_LOT_${purchase.lotCode}`;
      
      // Verificar se já existe
      const existing = await prisma.costCenter.findUnique({
        where: { code }
      });

      if (existing) {
        logger.info(`Centro de custo ${code} já existe`);
        return;
      }

      await prisma.costCenter.create({
        data: {
          code,
          name: `Lote ${purchase.lotCode}`,
          category: 'CATTLE_PURCHASE',
          type: 'OPERATIONAL',
          allocationMethod: 'PER_LOT',
          defaultPercentage: 100,
          isActive: true,
          description: `Centro de custo do lote ${purchase.lotCode}`
        }
      });

      logger.info(`Centro de custo ${code} criado`);
    } catch (error) {
      logger.error(`Erro ao criar centro de custo para lote:`, error);
      throw error;
    }
  }

  /**
   * Atualiza análise de rentabilidade de um lote
   */
  async updateLotProfitability(purchaseId: string): Promise<void> {
    try {
      logger.info(`Atualizando rentabilidade do lote ${purchaseId}`);
      
      // Buscar todas as despesas do lote
      const expenses = await prisma.expense.findMany({
        where: { purchaseId }
      });

      // Buscar todas as receitas do lote
      const revenues = await prisma.revenue.findMany({
        where: { purchaseId }
      });

      // Buscar dados do lote
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        throw new Error(`Lote ${purchaseId} não encontrado`);
      }

      // Calcular custos por categoria
      const costs = {
        purchase: 0,
        transport: 0,
        feed: 0,
        veterinary: 0,
        labor: 0,
        overhead: 0
      };

      expenses.forEach(expense => {
        switch (expense.category) {
          case 'CATTLE_PURCHASE':
            costs.purchase += expense.totalAmount;
            break;
          case 'TRANSPORT':
            costs.transport += expense.totalAmount;
            break;
          case 'CATTLE_FEED':
            costs.feed += expense.totalAmount;
            break;
          case 'VETERINARY':
          case 'MEDICINE':
          case 'VACCINE':
            costs.veterinary += expense.totalAmount;
            break;
          case 'LABOR':
            costs.labor += expense.totalAmount;
            break;
          default:
            costs.overhead += expense.totalAmount;
        }
      });

      const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

      // Calcular receitas
      const saleRevenue = revenues
        .filter(r => r.category === 'CATTLE_SALE')
        .reduce((sum, r) => sum + r.totalAmount, 0);
      
      const otherRevenue = revenues
        .filter(r => r.category !== 'CATTLE_SALE')
        .reduce((sum, r) => sum + r.totalAmount, 0);
      
      const totalRevenue = saleRevenue + otherRevenue;

      // Calcular lucros e margens
      const grossProfit = totalRevenue - costs.purchase;
      const netProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

      // Calcular métricas por animal
      const animalCount = purchase.currentQuantity || purchase.initialQuantity;
      const costPerAnimal = animalCount > 0 ? totalCost / animalCount : 0;
      const revenuePerAnimal = animalCount > 0 ? totalRevenue / animalCount : 0;
      const profitPerAnimal = animalCount > 0 ? netProfit / animalCount : 0;

      // Calcular métricas por arroba
      const totalArrobas = purchase.currentWeight ? purchase.currentWeight / 15 : purchase.purchaseWeight / 15;
      const costPerArroba = totalArrobas > 0 ? totalCost / totalArrobas : 0;
      const revenuePerArroba = totalArrobas > 0 ? totalRevenue / totalArrobas : 0;
      const profitPerArroba = totalArrobas > 0 ? netProfit / totalArrobas : 0;

      // Calcular dias em operação
      const startDate = new Date(purchase.purchaseDate);
      const endDate = purchase.status === 'SOLD' ? new Date() : null;
      const daysInOperation = endDate 
        ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Atualizar ou criar registro de rentabilidade
      await prisma.lotProfitability.upsert({
        where: { purchaseId },
        update: {
          purchaseCost: costs.purchase,
          transportCost: costs.transport,
          feedCost: costs.feed,
          veterinaryCost: costs.veterinary,
          laborCost: costs.labor,
          overheadCost: costs.overhead,
          totalCost,
          saleRevenue,
          otherRevenue,
          totalRevenue,
          grossProfit,
          netProfit,
          profitMargin,
          roi,
          costPerAnimal,
          revenuePerAnimal,
          profitPerAnimal,
          costPerArroba,
          revenuePerArroba,
          profitPerArroba,
          daysInOperation,
          status: purchase.status,
          lastCalculatedAt: new Date()
        },
        create: {
          purchaseId,
          purchaseCost: costs.purchase,
          transportCost: costs.transport,
          feedCost: costs.feed,
          veterinaryCost: costs.veterinary,
          laborCost: costs.labor,
          overheadCost: costs.overhead,
          totalCost,
          saleRevenue,
          otherRevenue,
          totalRevenue,
          grossProfit,
          netProfit,
          profitMargin,
          roi,
          costPerAnimal,
          revenuePerAnimal,
          profitPerAnimal,
          costPerArroba,
          revenuePerArroba,
          profitPerArroba,
          startDate,
          endDate,
          daysInOperation,
          status: purchase.status,
          lastCalculatedAt: new Date()
        }
      });

      logger.info(`Rentabilidade do lote ${purchaseId} atualizada`);
    } catch (error) {
      logger.error(`Erro ao atualizar rentabilidade:`, error);
      throw error;
    }
  }

  /**
   * Determina a categoria financeira baseada no tipo de intervenção
   */
  private getInterventionCategory(interventionType: string): string {
    const mapping = {
      'VACCINATION': 'VACCINE',
      'DEWORMING': 'MEDICINE',
      'TREATMENT': 'MEDICINE',
      'SURGERY': 'VETERINARY',
      'EXAMINATION': 'VETERINARY',
      'QUARANTINE': 'VETERINARY'
    };

    return mapping[interventionType] || 'VETERINARY';
  }

  /**
   * Realiza rateio de despesas globais entre lotes ativos
   */
  async allocateGlobalExpenses(): Promise<void> {
    try {
      logger.info('Iniciando rateio de despesas globais');

      // Buscar despesas globais não alocadas
      const globalExpenses = await prisma.expense.findMany({
        where: {
          allocationMethod: 'GLOBAL',
          allocations: {
            none: {}
          }
        }
      });

      // Buscar lotes ativos
      const activeLots = await prisma.cattlePurchase.findMany({
        where: {
          status: {
            in: ['QUARANTINE', 'CONFINED', 'READY_FOR_SALE']
          }
        }
      });

      if (activeLots.length === 0) {
        logger.warn('Nenhum lote ativo para rateio');
        return;
      }

      for (const expense of globalExpenses) {
        const amountPerLot = expense.totalAmount / activeLots.length;
        const percentagePerLot = 100 / activeLots.length;

        // Criar alocações para cada lote
        const allocations = activeLots.map(lot => ({
          expenseId: expense.id,
          entityType: 'LOT' as const,
          entityId: lot.id,
          allocatedAmount: amountPerLot,
          percentage: percentagePerLot
        }));

        await prisma.expenseAllocation.createMany({
          data: allocations
        });

        logger.info(`Despesa ${expense.id} alocada para ${activeLots.length} lotes`);
      }

      logger.info('Rateio de despesas globais concluído');
    } catch (error) {
      logger.error('Erro no rateio de despesas globais:', error);
      throw error;
    }
  }
}