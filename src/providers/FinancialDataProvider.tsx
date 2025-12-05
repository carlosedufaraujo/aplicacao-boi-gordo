import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';
import { CattlePurchaseData, calculateAggregateMetrics, calculateLotMetrics } from '@/utils/cattlePurchaseCalculations';
import { SaleRecord } from '@/services/api/saleRecordsApi';

interface LotProfitability {
  purchase: CattlePurchaseData;
  sales: SaleRecord[];
  expenses: any[];
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  margin: number;
  status: 'profit' | 'loss' | 'pending';
}

interface FinancialMetrics {
  // Compras
  totalPurchases: number;
  totalPurchaseValue: number;
  totalAnimals: number;
  totalArrobas: number;
  
  // Vendas
  totalSales: number;
  totalSalesValue: number;
  totalAnimalsSold: number;
  pendingSalesValue: number;
  paidSalesValue: number;
  
  // Breakdown Financeiro de Vendas
  totalTaxDeductions: number;        // Deduções Fiscais (Deduzidos em Folha)
  totalReceivableAdvances: number;   // Antecipações de Recebíveis
  totalSalesOtherCosts: number;      // Outros Custos de Vendas
  totalSalesArrobas: number;         // Quantidade de Arrobas Vendidas
  totalSalesFreightExpenses: number; // Despesas com Frete de Vendas
  totalSalesRevenue: number;         // Receita Total (Valor Total - Custos)
  averageRevenuePerAnimal: number;   // Receita Média/Animal (Total)
  averageRevenuePerArroba: number;   // Receita Média R$/@
  
  // Despesas e Receitas
  totalExpenses: number;
  totalOtherRevenues: number;
  
  // Breakdown de Despesas das Compras
  totalCommissionExpenses: number;
  totalFreightExpenses: number;
  totalOtherPurchaseExpenses: number;
  
  // Métricas Consolidadas
  totalCosts: number;        // Compras + Despesas
  totalRevenue: number;       // Vendas + Outras Receitas
  grossProfit: number;        // Receita Total - Custo Total
  netMargin: number;          // Margem líquida percentual
  roi: number;                // Retorno sobre investimento
  averageCostPerArroba: number; // Custo médio por arroba (incluindo todas as despesas)
  
  // Status
  totalProfitableLots: number;
  totalLossLots: number;
  averageMargin: number;
  
  // Análise de Desempenho
  netAnimalsBalance: number;         // NET Animais (Comprados - Vendidos)
  grossMargin: number;              // Margem Bruta (%)
}

interface FinancialDataContextType {
  // Dados brutos
  purchases: CattlePurchaseData[];
  sales: SaleRecord[];
  expenses: any[];
  revenues: any[];
  
  // Métricas calculadas
  metrics: FinancialMetrics;
  lotProfitability: LotProfitability[];
  
  // Estados
  loading: boolean;
  error: string | null;
  
  // Funções
  refresh: () => Promise<void>;
  getLotProfitability: (purchaseId: string) => LotProfitability | null;
  getMonthlyMetrics: (month: Date) => FinancialMetrics;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};

export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hooks de API
  const { cattlePurchases, loading: purchasesLoading, refresh: refreshPurchases } = useCattlePurchasesApi();
  const { saleRecords, loading: salesLoading, refresh: refreshSales } = useSaleRecordsApi();
  const { expenses, loading: expensesLoading, refresh: refreshExpenses } = useExpensesApi();
  const { revenues, loading: revenuesLoading, refresh: refreshRevenues } = useRevenuesApi();
  
  const [error, setError] = useState<string | null>(null);
  
  const loading = purchasesLoading || salesLoading || expensesLoading || revenuesLoading;
  
  // Calcular métricas consolidadas
  const metrics = useMemo((): FinancialMetrics => {
    // Métricas de Compras
    const totalPurchases = cattlePurchases?.length || 0;
    const totalPurchaseValue = cattlePurchases?.reduce((sum, p) => sum + (p.purchaseValue || p.totalValue || 0), 0) || 0;
    const totalAnimals = cattlePurchases?.reduce((sum, p) => sum + (p.initialQuantity || p.quantity || 0), 0) || 0;
    
    // Calcular total de arrobas (peso da carcaça / 15)
    const totalArrobas = cattlePurchases?.reduce((sum, p) => {
      const weight = p.purchaseWeight || p.totalWeight || 0;
      const carcassYield = p.carcassYield || p.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = (weight * carcassYield) / 100;
      const arrobas = carcassWeight / 15; // 1 arroba = 15kg
      return sum + arrobas;
    }, 0) || 0;

    // Métricas de Vendas
    const totalSales = saleRecords?.length || 0;
    const totalSalesValue = saleRecords?.reduce((sum, s) => sum + (s.totalValue || 0), 0) || 0;
    const totalAnimalsSold = saleRecords?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
    const pendingSalesValue = saleRecords?.filter(s => s.status === 'PENDING')
      .reduce((sum, s) => sum + (s.totalValue || 0), 0) || 0;
    const paidSalesValue = saleRecords?.filter(s => s.status === 'PAID')
      .reduce((sum, s) => sum + (s.totalValue || 0), 0) || 0;
    
    // Despesas e Outras Receitas
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const totalOtherRevenues = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    
    // Breakdown de Despesas das Compras
    const totalCommissionExpenses = cattlePurchases?.reduce((sum, p) => {
      const commission = p.brokerCommission || p.commission || 0;
      return sum + commission;
    }, 0) || 0;
    
    const totalFreightExpenses = cattlePurchases?.reduce((sum, p) => {
      const freight = p.freightCost || 0;
      return sum + freight;
    }, 0) || 0;
    
    const totalOtherPurchaseExpenses = cattlePurchases?.reduce((sum, p) => {
      const otherCosts = p.otherCosts || p.operationalCost || 0;
      return sum + otherCosts;
    }, 0) || 0;
    
    // Breakdown Financeiro de Vendas
    const totalTaxDeductions = saleRecords?.reduce((sum, s) => {
      const deductions = s.deductions || 0;
      return sum + deductions;
    }, 0) || 0;
    
    // Antecipações de Recebíveis (baseado em despesas financeiras relacionadas a vendas)
    const totalReceivableAdvances = expenses?.filter(e => 
      e.category === 'financial' && 
      e.description?.toLowerCase().includes('antecipa')
    ).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    // Outros Custos de Vendas (despesas operacionais relacionadas a vendas)
    const totalSalesOtherCosts = expenses?.filter(e => 
      e.category === 'sales_costs' || 
      (e.description?.toLowerCase().includes('venda') && e.category === 'operational')
    ).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    // Quantidade de Arrobas Vendidas
    const totalSalesArrobas = saleRecords?.reduce((sum, s) => {
      const arrobas = s.arrobas || 0;
      return sum + arrobas;
    }, 0) || 0;
    
    // Despesas com Frete de Vendas (despesas de frete relacionadas a vendas)
    const totalSalesFreightExpenses = expenses?.filter(e => 
      e.category === 'freight' && 
      (e.description?.toLowerCase().includes('venda') || e.description?.toLowerCase().includes('entrega'))
    ).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    // Receita Total (Valor Total das Vendas - Todos os Custos de Vendas)
    const totalSalesRevenue = totalSalesValue - (totalTaxDeductions + totalReceivableAdvances + totalSalesOtherCosts + totalSalesFreightExpenses);
    
    // Receita Média por Animal (Total)
    const averageRevenuePerAnimal = totalAnimalsSold > 0 ? totalSalesRevenue / totalAnimalsSold : 0;
    
    // Receita Média por Arroba
    const averageRevenuePerArroba = totalSalesArrobas > 0 ? totalSalesRevenue / totalSalesArrobas : 0;
    
    // Métricas Consolidadas
    const totalCosts = totalPurchaseValue + totalExpenses;
    const totalRevenue = totalSalesValue + totalOtherRevenues;
    const grossProfit = totalRevenue - totalCosts;
    const netMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const roi = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;
    
    // Análise de Lotes
    let totalProfitableLots = 0;
    let totalLossLots = 0;
    let totalMargin = 0;
    let lotCount = 0;
    
    // Calcular lucratividade por lote
    cattlePurchases?.forEach(purchase => {
      const lotSales = saleRecords?.filter(s => s.purchaseId === purchase.id) || [];
      const lotRevenue = lotSales.reduce((sum, s) => sum + (s.totalValue || 0), 0);
      const lotExpenses = expenses?.filter(e => e.purchaseId === purchase.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const lotCost = (purchase.purchaseValue || purchase.totalValue || 0) + lotExpenses;
      const lotProfit = lotRevenue - lotCost;
      
      if (lotSales.length > 0) {
        if (lotProfit > 0) totalProfitableLots++;
        else if (lotProfit < 0) totalLossLots++;
        
        const margin = lotRevenue > 0 ? (lotProfit / lotRevenue) * 100 : 0;
        totalMargin += margin;
        lotCount++;
      }
    });
    
    const averageMargin = lotCount > 0 ? totalMargin / lotCount : 0;
    
    // Calcular custo médio por arroba (incluindo todas as despesas)
    const totalCostWithExpenses = totalPurchaseValue + totalCommissionExpenses + totalFreightExpenses + totalOtherPurchaseExpenses;
    const averageCostPerArroba = totalArrobas > 0 ? totalCostWithExpenses / totalArrobas : 0;
    
    // Análise de Desempenho
    // NET Animais (Comprados - Vendidos) - saldo de animais em estoque
    const netAnimalsBalance = totalAnimals - totalAnimalsSold;
    
    // Margem Bruta (%) - (Receita de Vendas - Custo dos Produtos Vendidos) / Receita de Vendas * 100
    const grossMargin = totalSalesValue > 0 ? ((totalSalesValue - totalCostWithExpenses) / totalSalesValue) * 100 : 0;
    
    return {
      totalPurchases,
      totalPurchaseValue,
      totalAnimals,
      totalArrobas,
      totalSales,
      totalSalesValue,
      totalAnimalsSold,
      pendingSalesValue,
      paidSalesValue,
      totalTaxDeductions,
      totalReceivableAdvances,
      totalSalesOtherCosts,
      totalSalesArrobas,
      totalSalesFreightExpenses,
      totalSalesRevenue,
      averageRevenuePerAnimal,
      averageRevenuePerArroba,
      totalExpenses,
      totalOtherRevenues,
      totalCommissionExpenses,
      totalFreightExpenses,
      totalOtherPurchaseExpenses,
      totalCosts,
      totalRevenue,
      grossProfit,
      netMargin,
      roi,
      averageCostPerArroba,
      totalProfitableLots,
      totalLossLots,
      averageMargin,
      netAnimalsBalance,
      grossMargin
    };
  }, [cattlePurchases, saleRecords, expenses, revenues]);
  
  // Calcular lucratividade por lote
  const lotProfitability = useMemo((): LotProfitability[] => {
    if (!cattlePurchases) return [];
    
    return cattlePurchases.map(purchase => {
      const lotSales = saleRecords?.filter(s => s.purchaseId === purchase.id) || [];
      const lotExpenses = expenses?.filter(e => e.purchaseId === purchase.id) || [];
      
      const totalSold = lotSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const totalRevenue = lotSales.reduce((sum, s) => sum + (s.totalValue || 0), 0);
      const expensesTotal = lotExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalCost = (purchase.purchaseValue || purchase.totalValue || 0) + expensesTotal;
      const profit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      let status: 'profit' | 'loss' | 'pending' = 'pending';
      if (lotSales.length > 0) {
        status = profit > 0 ? 'profit' : 'loss';
      }
      
      return {
        purchase,
        sales: lotSales,
        expenses: lotExpenses,
        totalSold,
        totalRevenue,
        totalCost,
        profit,
        margin,
        status
      };
    });
  }, [cattlePurchases, saleRecords, expenses]);
  
  // Função para atualizar todos os dados
  const refresh = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        refreshPurchases(),
        refreshSales(),
        refreshExpenses(),
        refreshRevenues()
      ]);
    } catch (err) {
      setError('Erro ao atualizar dados financeiros');
      console.error('Erro ao atualizar dados:', err);
    }
  }, [refreshPurchases, refreshSales, refreshExpenses, refreshRevenues]);
  
  // Função para obter lucratividade de um lote específico
  const getLotProfitability = useCallback((purchaseId: string): LotProfitability | null => {
    return lotProfitability.find(lot => lot.purchase.id === purchaseId) || null;
  }, [lotProfitability]);
  
  // Função para obter métricas de um mês específico
  const getMonthlyMetrics = useCallback((month: Date): FinancialMetrics => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Filtrar dados do mês
    const monthPurchases = cattlePurchases?.filter(p => {
      const date = new Date(p.purchaseDate);
      return date >= startOfMonth && date <= endOfMonth;
    }) || [];
    
    const monthSales = saleRecords?.filter(s => {
      const date = new Date(s.saleDate);
      return date >= startOfMonth && date <= endOfMonth;
    }) || [];
    
    const monthExpenses = expenses?.filter(e => {
      const date = new Date(e.date);
      return date >= startOfMonth && date <= endOfMonth;
    }) || [];
    
    const monthRevenues = revenues?.filter(r => {
      const date = new Date(r.date);
      return date >= startOfMonth && date <= endOfMonth;
    }) || [];
    
    // Recalcular métricas para o mês
    const totalPurchaseValue = monthPurchases.reduce((sum, p) => sum + (p.purchaseValue || p.totalValue || 0), 0);
    const totalSalesValue = monthSales.reduce((sum, s) => sum + (s.totalValue || 0), 0);
    const totalExpensesValue = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRevenuesValue = monthRevenues.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const totalCosts = totalPurchaseValue + totalExpensesValue;
    const totalRevenue = totalSalesValue + totalRevenuesValue;
    const grossProfit = totalRevenue - totalCosts;
    
    return {
      ...metrics, // Usar estrutura base
      totalPurchases: monthPurchases.length,
      totalPurchaseValue,
      totalSales: monthSales.length,
      totalSalesValue,
      totalExpenses: totalExpensesValue,
      totalOtherRevenues: totalRevenuesValue,
      totalCosts,
      totalRevenue,
      grossProfit,
      netMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      roi: totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0
    };
  }, [cattlePurchases, saleRecords, expenses, revenues, metrics]);
  
  // Atualizar dados ao montar
  useEffect(() => {
    refresh();
  }, []);
  
  const value: FinancialDataContextType = {
    purchases: cattlePurchases || [],
    sales: saleRecords || [],
    expenses: expenses || [],
    revenues: revenues || [],
    metrics,
    lotProfitability,
    loading,
    error,
    refresh,
    getLotProfitability,
    getMonthlyMetrics
  };
  
  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
};
