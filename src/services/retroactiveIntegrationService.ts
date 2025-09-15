import { dataService } from './supabaseData';
import { LotIntegrationService } from './lotIntegrationService';

/**
 * Serviço para integração retroativa de ordens de compra existentes
 */
export class RetroactiveIntegrationService {
  /**
   * Executa integração retroativa para todas as ordens sem integração
   */
  static async integrateExistingOrders(): Promise<void> {
    
    try {
      // 1. Buscar todas as ordens de compra
      const allOrders = await dataService.getAllCattlePurchases();
      
      // 2. Identificar ordens sem integração
      const ordersWithoutIntegration = [];
      
      for (const order of allOrders) {
        const hasLot = await this.checkIfOrderHasLot(order.id);
        const hasExpenses = await this.checkIfOrderHasExpenses(order.id);
        
        if (!hasLot || !hasExpenses) {
          ordersWithoutIntegration.push({
            order,
            hasLot,
            hasExpenses,
            missingIntegrations: {
              lot: !hasLot,
              expenses: !hasExpenses
            }
          });
        }
      }
      // 3. Executar integração para cada ordem
      let successCount = 0;
      let errorCount = 0;
      
      for (const { order, missingIntegrations } of ordersWithoutIntegration) {
        try {
          
          if (missingIntegrations.lot && missingIntegrations.expenses) {
            // Integração completa
            await LotIntegrationService.integrateNewLot(order);
          } else if (missingIntegrations.lot) {
            // Apenas criar lote
            await this.createLotForOrder(order);
          } else if (missingIntegrations.expenses) {
            // Apenas criar despesas
            await this.createExpensesForOrder(order);
          }
          
          successCount++;
        } catch (error) {
          console.error(`❌ Erro ao integrar ordem ${order.lotCode}:`, error);
          errorCount++;
        }
      }
    } catch (error) {
      console.error('❌ Erro na integração retroativa:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se uma ordem já tem lote correspondente
   */
  private static async checkIfOrderHasLot(orderId: string): Promise<boolean> {
    try {
      const lot = await dataService.getCattlePurchaseByCattlePurchaseId(orderId);
      return lot !== null;
    } catch (error) {
      console.error(`Erro ao verificar lote para ordem ${orderId}:`, error);
      return false;
    }
  }
  
  /**
   * Verifica se uma ordem já tem despesas correspondentes
   */
  private static async checkIfOrderHasExpenses(orderId: string): Promise<boolean> {
    try {
      const expenses = await dataService.getExpensesByCattlePurchaseId(orderId);
      return expenses && expenses.length > 0;
    } catch (error) {
      console.error(`Erro ao verificar despesas para ordem ${orderId}:`, error);
      return false;
    }
  }
  
  /**
   * Cria apenas o lote para uma ordem (sem outras integrações)
   */
  private static async createLotForOrder(order: any): Promise<void> {
    const cattleLotData = {
      lotNumber: order.lotCode,
      purchaseId: order.id,
      entryDate: order.arrivalDate || order.purchaseDate,
      entryWeight: order.totalWeight || 0,
      entryQuantity: order.animalCount || 0,
      currentQuantity: order.animalCount || 0,
      acquisitionCost: order.totalValue || 0,
      healthCost: 0,
      feedCost: 0,
      operationalCost: 0,
      freightCost: order.freightCost || 0,
      otherCosts: 0,
      totalCost: order.totalValue || 0,
      deathCount: 0,
      status: 'ACTIVE'
    };
    
    await dataService.createCattlePurchase(cattleLotData);
  }
  
  /**
   * Cria apenas as despesas para uma ordem (sem outras integrações)
   */
  private static async createExpensesForOrder(order: any): Promise<void> {
    const expenses = [];
    
    // Despesa principal - Compra de animais
    if (order.totalValue > 0) {
      expenses.push({
        description: `Compra de Gado - ${order.lotCode}`,
        purchaseValue: order.totalValue,
        category: 'animal_purchase',
        dueDate: order.paymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        isPaid: false,
        impactsCashFlow: true,
        purchaseId: order.id,
        userId: order.userId || 'system',
        notes: `Despesa criada automaticamente via integração retroativa`
      });
    }
    
    // Frete (se houver)
    if (order.freightCost && order.freightCost > 0) {
      expenses.push({
        description: `Frete - ${order.lotCode}`,
        purchaseValue: order.freightCost,
        category: 'freight',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        isPaid: false,
        impactsCashFlow: true,
        purchaseId: order.id,
        userId: order.userId || 'system',
        notes: `Despesa criada automaticamente via integração retroativa`
      });
    }
    
    // Criar todas as despesas
    for (const expense of expenses) {
      await dataService.createExpense(expense);
    }
  }
  
  /**
   * Gera relatório das ordens sem integração
   */
  static async generateIntegrationReport(): Promise<any> {
    
    try {
      const allOrders = await dataService.getAllCattlePurchases();
      const report = {
        totalOrders: allOrders.length,
        integratedOrders: 0,
        partiallyIntegratedOrders: 0,
        nonIntegratedOrders: 0,
        details: []
      };
      
      for (const order of allOrders) {
        const hasLot = await this.checkIfOrderHasLot(order.id);
        const hasExpenses = await this.checkIfOrderHasExpenses(order.id);
        
        const integrationStatus = hasLot && hasExpenses ? 'complete' : 
                                hasLot || hasExpenses ? 'partial' : 'none';
        
        if (integrationStatus === 'complete') report.integratedOrders++;
        else if (integrationStatus === 'partial') report.partiallyIntegratedOrders++;
        else report.nonIntegratedOrders++;
        
        report.details.push({
          lotCode: order.lotCode,
          orderId: order.id,
          totalValue: order.totalValue,
          status: order.status,
          integrationStatus,
          hasLot,
          hasExpenses,
          createdAt: order.createdAt
        });
      }
      
      return report;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      throw error;
    }
  }
}
