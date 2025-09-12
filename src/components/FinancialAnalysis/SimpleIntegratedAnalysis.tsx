import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  AlertCircle,
  Skull
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getCategoryDisplayName, getCategoryColor, groupByCategory } from '@/utils/categoryNormalizer';
import { DREStatement } from './DREStatement';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useIntegratedFinancialAnalysis } from '@/hooks/useIntegratedFinancialAnalysis';

export const SimpleIntegratedAnalysis: React.FC = () => {
  const { cashFlows, categories, loading: cashFlowLoading } = useCashFlow();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [operationalLosses, setOperationalLosses] = useState<number>(0);
  
  // Hook para buscar análise integrada que inclui mortalidades
  const { 
    currentAnalysis, 
    generateAnalysis, 
    loadAnalysisByPeriod,
    loading: analysisLoading 
  } = useIntegratedFinancialAnalysis({ autoLoad: false });

  // Processar dados do cash flow quando disponíveis
  useEffect(() => {
    if (cashFlows && categories && !cashFlowLoading) {
      processFinancialData();
    }
  }, [cashFlows, categories, cashFlowLoading, operationalLosses]); // Reprocessar quando perdas operacionais mudarem

  // Buscar análise integrada para obter perdas operacionais (mortalidades)
  useEffect(() => {
    const fetchOperationalLosses = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Tentar carregar análise do período atual
        const analysis = await loadAnalysisByPeriod(year, month).catch(() => null);
        
        if (analysis && analysis.nonCashBreakdown) {
          // Definir perdas operacionais (mortalidade)
          setOperationalLosses(analysis.nonCashBreakdown.mortality || 0);
          console.log('[SimpleIntegratedAnalysis] Perdas operacionais carregadas:', analysis.nonCashBreakdown.mortality);
        }
      } catch (error) {
        console.log('[SimpleIntegratedAnalysis] Análise integrada não disponível, perdas operacionais não incluídas');
      }
    };
    
    fetchOperationalLosses();
  }, [loadAnalysisByPeriod]);

  const processFinancialData = () => {
    try {
      console.log('[SimpleIntegratedAnalysis] Processando dados:', { 
        cashFlowsCount: cashFlows?.length,
        categoriesCount: categories?.length,
        operationalLosses 
      });
      
      // Separar receitas e despesas
      const expenses = cashFlows.filter(cf => cf.type === 'EXPENSE');
      const revenues = cashFlows.filter(cf => cf.type === 'INCOME');
      
      console.log('[SimpleIntegratedAnalysis] Dados filtrados:', {
        expensesCount: expenses.length,
        revenuesCount: revenues.length,
        operationalLosses,
        expenses: expenses.slice(0, 3), // Mostrar primeiras 3 para debug
        revenues: revenues.slice(0, 3)
      });

      // Calcular totais (incluindo perdas operacionais)
      const totalCashExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalExpenses = totalCashExpenses + operationalLosses; // Adicionar perdas operacionais
      const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0);
      const balance = totalRevenues - totalExpenses;

      // Mapear categoryId para nome da categoria
      const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
      };

      // Agrupar despesas por categoria
      const expensesByCategory: { [key: string]: number } = {};
      expenses.forEach((exp) => {
        const categoryName = getCategoryName(exp.categoryId);
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + exp.amount;
      });
      
      // Adicionar perdas operacionais como categoria separada se houver
      if (operationalLosses > 0) {
        expensesByCategory['Perdas Operacionais (Mortalidade)'] = operationalLosses;
      }

      // Agrupar receitas por categoria
      const revenuesByCategory: { [key: string]: number } = {};
      revenues.forEach((rev) => {
        const categoryName = getCategoryName(rev.categoryId);
        revenuesByCategory[categoryName] = (revenuesByCategory[categoryName] || 0) + rev.amount;
      });

      // Preparar dados para o DRE no formato esperado
      // Despesas devem ser negativas para o DRE calcular corretamente
      const expensesForDRE = Object.entries(expensesByCategory).map(([category, totalAmount]) => ({
        category,
        totalAmount: -Math.abs(totalAmount as number)
      }));
      
      const revenuesForDRE = Object.entries(revenuesByCategory).map(([category, totalAmount]) => ({
        category,
        totalAmount: Math.abs(totalAmount as number)
      }));
      
      console.log('[SimpleIntegratedAnalysis] Dados para DRE:', {
        expensesForDRE,
        revenuesForDRE,
        totalExpenses,
        totalRevenues
      });

      setData({
        totalExpenses,
        totalRevenues,
        balance,
        expenseCount: expenses.length,
        revenueCount: revenues.length,
        expensesByCategory,
        revenuesByCategory,
        expenses: expensesForDRE,  // Formato correto para DRE
        revenues: revenuesForDRE,  // Formato correto para DRE
        rawExpenses: expenses,     // Dados originais se necessário
        rawRevenues: revenues      // Dados originais se necessário
      });
      
      setError(null);

    } catch (err: any) {
      console.error('Erro ao processar dados:', err);
      setError('Erro ao processar dados financeiros');
    }
  };

  if (cashFlowLoading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando análise financeira...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum dado disponível para análise</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalRevenues)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.revenueCount} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas em Caixa</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalExpenses - operationalLosses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.expenseCount} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdas Operacionais</CardTitle>
            <Skull className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(operationalLosses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortalidade do período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das despesas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.expensesByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percentage = ((amount as number) / data.totalExpenses) * 100;
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatCurrency(amount as number)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(data.expensesByCategory).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma despesa registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das receitas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.revenuesByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percentage = data.totalRevenues > 0 
                    ? ((amount as number) / data.totalRevenues) * 100 
                    : 0;
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(amount as number)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(data.revenuesByCategory).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma receita registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demonstrativo de Resultado (DRE) */}
      <DREStatement 
        expenses={data.expenses || []}
        revenues={data.revenues || []}
        period="Período Atual"
      />
    </div>
  );
};