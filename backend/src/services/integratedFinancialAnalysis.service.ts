import { PrismaClient, FinancialTransaction, IntegratedFinancialAnalysis, FinancialTransactionCategory, CashFlowClassification, IntegratedAnalysisStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface IntegratedAnalysisData {
  referenceMonth: Date;
  includeNonCashItems?: boolean;
  cycleId?: string | null;
}

interface AnalysisResult extends IntegratedFinancialAnalysis {
  items: any[];
  cashFlowBreakdown: {
    operating: { receipts: number; payments: number; net: number };
    investing: { receipts: number; payments: number; net: number };
    financing: { receipts: number; payments: number; net: number };
  };
  nonCashBreakdown: {
    depreciation: number;
    mortality: number;
    biologicalAdjustments: number;
    other: number;
  };
  reconciliation: {
    netIncome: number;
    nonCashAdjustments: number;
    netCashFlow: number;
    difference: number;
  };
}

export class IntegratedFinancialAnalysisService {
  
  /**
   * Cria ou atualiza uma análise financeira integrada para um período
   */
  async createOrUpdateAnalysis(data: IntegratedAnalysisData, userId?: string): Promise<AnalysisResult> {
    const { referenceMonth } = data;
    
    // Buscar ou criar a análise
    let analysis = await prisma.integratedFinancialAnalysis.findUnique({
      where: { referenceMonth }
    });
    
    if (!analysis) {
      const createData: any = {
        referenceMonth,
        referenceYear: referenceMonth.getFullYear(),
        status: IntegratedAnalysisStatus.DRAFT
      };
      
      // Só adiciona userId se for válido
      if (userId && userId.length > 0) {
        createData.userId = userId;
      }
      
      analysis = await prisma.integratedFinancialAnalysis.create({
        data: createData
      });
    }
    
    // Gerar transações financeiras do período
    await this.generateFinancialTransactions(referenceMonth);
    
    // Calcular métricas da análise
    const analysisResult = await this.calculateAnalysisMetrics(analysis.id);
    
    // Atualizar a análise com os valores calculados
    const updatedAnalysis = await prisma.integratedFinancialAnalysis.update({
      where: { id: analysis.id },
      data: {
        totalRevenue: analysisResult.totalRevenue,
        totalExpenses: analysisResult.totalExpenses,
        netIncome: analysisResult.netIncome,
        cashReceipts: analysisResult.cashReceipts,
        cashPayments: analysisResult.cashPayments,
        netCashFlow: analysisResult.netCashFlow,
        nonCashItems: analysisResult.nonCashItems,
        depreciation: analysisResult.depreciation,
        biologicalAssetChange: analysisResult.biologicalAssetChange,
        reconciliationDifference: analysisResult.reconciliationDifference
      },
      include: {
        items: {
          include: {
            transaction: true
          }
        }
      }
    });
    
    return {
      ...updatedAnalysis,
      cashFlowBreakdown: analysisResult.cashFlowBreakdown,
      nonCashBreakdown: analysisResult.nonCashBreakdown,
      reconciliation: analysisResult.reconciliation
    } as AnalysisResult;
  }
  
  /**
   * Gera transações financeiras a partir dos dados existentes
   */
  private async generateFinancialTransactions(referenceMonth: Date): Promise<void> {
    const startDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), 1);
    const endDate = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() + 1, 0);
    
    // 1. Vendas de gado (revenues)
    const revenues = await prisma.revenue.findMany({
      where: {
        receiptDate: { gte: startDate, lte: endDate },
        isReceived: true
      },
      include: { payerAccount: true }
    });
    
    for (const revenue of revenues) {
      await this.createOrUpdateTransaction({
        referenceDate: revenue.receiptDate || revenue.dueDate,
        description: `Venda de gado - ${revenue.description}`,
        amount: revenue.totalAmount,
        category: FinancialTransactionCategory.CATTLE_SALES,
        impactsCash: true,
        cashFlowDate: revenue.receiptDate,
        cashFlowType: CashFlowClassification.OPERATING,
        accountId: revenue.payerAccountId,
        partnerId: revenue.buyerId
      });
    }
    
    // 2. Compras de gado (cattle purchases)
    const purchases = await prisma.cattlePurchase.findMany({
      where: {
        purchaseDate: { gte: startDate, lte: endDate }
      },
      include: { vendor: true, payerAccount: true }
    });
    
    for (const purchase of purchases) {
      await this.createOrUpdateTransaction({
        referenceDate: purchase.purchaseDate,
        description: `Compra de gado - ${purchase.lotCode}`,
        amount: -purchase.purchaseValue, // Negativo por ser despesa
        category: FinancialTransactionCategory.CATTLE_ACQUISITION,
        impactsCash: true,
        cashFlowDate: purchase.purchaseDate,
        cashFlowType: CashFlowClassification.OPERATING,
        purchaseId: purchase.id,
        partnerId: purchase.vendorId,
        accountId: purchase.payerAccountId
      });
    }
    
    // 3. Despesas operacionais (expenses)
    const expenses = await prisma.expense.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        isPaid: true
      },
      include: { payerAccount: true, costCenter: true, purchase: true }
    });
    
    for (const expense of expenses) {
      let category = this.mapExpenseCategory(expense.category);
      
      await this.createOrUpdateTransaction({
        referenceDate: expense.paymentDate || expense.dueDate,
        description: expense.description,
        amount: -expense.totalAmount, // Negativo por ser despesa
        category: category,
        impactsCash: expense.impactsCashFlow,
        cashFlowDate: expense.paymentDate,
        cashFlowType: CashFlowClassification.OPERATING,
        purchaseId: expense.purchaseId,
        partnerId: expense.vendorId,
        accountId: expense.payerAccountId,
        penId: expense.penId
      });
    }
    
    // 4. Mortalidade (non-cash)
    const mortalityRecords = await prisma.deathRecord.findMany({
      where: {
        deathDate: { gte: startDate, lte: endDate }
      },
      include: { purchase: true, pen: true }
    });
    
    for (const mortality of mortalityRecords) {
      // Calcular custo ponderado da mortalidade
      const weightedCost = await this.calculateMortalityCost(mortality);
      
      await this.createOrUpdateTransaction({
        referenceDate: mortality.deathDate,
        description: `Mortalidade - ${mortality.cause}`,
        amount: -weightedCost, // Negativo por ser perda
        category: FinancialTransactionCategory.MORTALITY,
        impactsCash: false, // Mortalidade não afeta caixa diretamente
        cashFlowDate: null,
        cashFlowType: null,
        purchaseId: mortality.purchaseId,
        penId: mortality.penId
      });
    }
  }
  
  /**
   * Cria ou atualiza uma transação financeira
   */
  private async createOrUpdateTransaction(transactionData: any): Promise<FinancialTransaction> {
    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        referenceDate: transactionData.referenceDate,
        description: transactionData.description,
        amount: transactionData.amount,
        category: transactionData.category
      }
    });
    
    if (existingTransaction) {
      return await prisma.financialTransaction.update({
        where: { id: existingTransaction.id },
        data: transactionData
      });
    } else {
      return await prisma.financialTransaction.create({
        data: transactionData
      });
    }
  }
  
  /**
   * Mapeia categorias de despesa para as novas categorias integradas
   */
  private mapExpenseCategory(expenseCategory: string): FinancialTransactionCategory {
    switch (expenseCategory.toLowerCase()) {
      case 'feed':
      case 'ração':
      case 'alimentação':
        return FinancialTransactionCategory.FEED_COSTS;
      case 'veterinary':
      case 'veterinaria':
      case 'medicamentos':
        return FinancialTransactionCategory.VETERINARY_COSTS;
      case 'labor':
      case 'mao_de_obra':
        return FinancialTransactionCategory.LABOR_COSTS;
      case 'administrative':
      case 'administrativo':
        return FinancialTransactionCategory.ADMINISTRATIVE;
      case 'infrastructure':
      case 'infraestrutura':
        return FinancialTransactionCategory.INFRASTRUCTURE;
      default:
        return FinancialTransactionCategory.OPERATIONAL_COSTS;
    }
  }
  
  /**
   * Calcula o custo ponderado da mortalidade
   */
  private async calculateMortalityCost(mortality: any): Promise<number> {
    if (!mortality.purchase) return 0;
    
    const purchase = mortality.purchase;
    const totalCostPerHead = purchase.totalCost / purchase.initialQuantity;
    return totalCostPerHead * mortality.quantity;
  }
  
  /**
   * Calcula todas as métricas da análise
   */
  private async calculateAnalysisMetrics(analysisId: string) {
    const analysis = await prisma.integratedFinancialAnalysis.findUnique({
      where: { id: analysisId },
      include: { items: { include: { transaction: true } } }
    });
    
    if (!analysis) throw new Error('Análise não encontrada');
    
    const startDate = new Date(analysis.referenceMonth.getFullYear(), analysis.referenceMonth.getMonth(), 1);
    const endDate = new Date(analysis.referenceMonth.getFullYear(), analysis.referenceMonth.getMonth() + 1, 0);
    
    // Buscar transações do período
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        referenceDate: { gte: startDate, lte: endDate }
      }
    });
    
    // Calcular totais
    const totalRevenue = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const netIncome = totalRevenue - totalExpenses;
    
    // Calcular fluxos de caixa
    const cashTransactions = transactions.filter(t => t.impactsCash);
    const cashReceipts = cashTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cashPayments = Math.abs(cashTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const netCashFlow = cashReceipts - cashPayments;
    
    // Calcular itens não-caixa
    const nonCashTransactions = transactions.filter(t => !t.impactsCash);
    const nonCashItems = Math.abs(nonCashTransactions
      .reduce((sum, t) => sum + t.amount, 0));
    
    const depreciation = Math.abs(nonCashTransactions
      .filter(t => t.category === FinancialTransactionCategory.DEPRECIATION)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const mortality = Math.abs(nonCashTransactions
      .filter(t => t.category === FinancialTransactionCategory.MORTALITY)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const biologicalAssetChange = nonCashTransactions
      .filter(t => t.category === FinancialTransactionCategory.BIOLOGICAL_ADJUSTMENT)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Reconciliação DRE x Fluxo de Caixa
    const reconciliationDifference = netIncome - netCashFlow;
    
    // Breakdown por tipo de fluxo de caixa
    const operatingTransactions = cashTransactions.filter(t => t.cashFlowType === CashFlowClassification.OPERATING);
    const investingTransactions = cashTransactions.filter(t => t.cashFlowType === CashFlowClassification.INVESTING);
    const financingTransactions = cashTransactions.filter(t => t.cashFlowType === CashFlowClassification.FINANCING);
    
    const cashFlowBreakdown = {
      operating: {
        receipts: operatingTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
        payments: Math.abs(operatingTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
        net: operatingTransactions.reduce((sum, t) => sum + t.amount, 0)
      },
      investing: {
        receipts: investingTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
        payments: Math.abs(investingTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
        net: investingTransactions.reduce((sum, t) => sum + t.amount, 0)
      },
      financing: {
        receipts: financingTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
        payments: Math.abs(financingTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
        net: financingTransactions.reduce((sum, t) => sum + t.amount, 0)
      }
    };
    
    const nonCashBreakdown = {
      depreciation,
      mortality,
      biologicalAdjustments: biologicalAssetChange,
      other: nonCashItems - depreciation - mortality - Math.abs(biologicalAssetChange)
    };
    
    const reconciliation = {
      netIncome,
      nonCashAdjustments: nonCashItems,
      netCashFlow,
      difference: reconciliationDifference
    };
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      cashReceipts,
      cashPayments,
      netCashFlow,
      nonCashItems,
      depreciation,
      biologicalAssetChange,
      reconciliationDifference,
      cashFlowBreakdown,
      nonCashBreakdown,
      reconciliation
    };
  }
  
  /**
   * Busca análise por período
   */
  async getAnalysisByPeriod(referenceMonth: Date): Promise<AnalysisResult | null> {
    const analysis = await prisma.integratedFinancialAnalysis.findUnique({
      where: { referenceMonth },
      include: {
        items: {
          include: {
            transaction: true
          }
        }
      }
    });
    
    if (!analysis) return null;
    
    const metrics = await this.calculateAnalysisMetrics(analysis.id);
    
    return {
      ...analysis,
      cashFlowBreakdown: metrics.cashFlowBreakdown,
      nonCashBreakdown: metrics.nonCashBreakdown,
      reconciliation: metrics.reconciliation
    } as AnalysisResult;
  }
  
  /**
   * Lista análises por ano
   */
  async getAnalysesByYear(year: number) {
    const analyses = await prisma.integratedFinancialAnalysis.findMany({
      where: { referenceYear: year },
      include: {
        items: {
          include: {
            transaction: true
          }
        }
      },
      orderBy: { referenceMonth: 'asc' }
    });
    
    return Promise.all(analyses.map(async analysis => {
      const metrics = await this.calculateAnalysisMetrics(analysis.id);
      return {
        ...analysis,
        cashFlowBreakdown: metrics.cashFlowBreakdown,
        nonCashBreakdown: metrics.nonCashBreakdown,
        reconciliation: metrics.reconciliation
      };
    }));
  }

  /**
   * Busca todas as transações financeiras sem filtro de período
   */
  async getAllFinancialTransactions() {
    const transactions = await prisma.financialTransaction.findMany({
      orderBy: { referenceDate: 'desc' }
    });
    
    return transactions.map(transaction => ({
      id: transaction.id,
      referenceDate: transaction.referenceDate,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      subcategory: transaction.subcategory,
      impactsCash: transaction.impactsCash,
      cashFlowDate: transaction.cashFlowDate,
      cashFlowType: transaction.cashFlowType,
      isReconciled: transaction.isReconciled,
      notes: transaction.notes
    }));
  }
}

export const integratedFinancialAnalysisService = new IntegratedFinancialAnalysisService();