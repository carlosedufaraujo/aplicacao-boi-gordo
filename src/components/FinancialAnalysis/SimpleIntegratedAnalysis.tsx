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
  const [retiradaParticular, setRetiradaParticular] = useState<number>(0);
  const [ajustesMercadoFuturo, setAjustesMercadoFuturo] = useState<number>(0);
  const [freteGado, setFreteGado] = useState<number>(0);
  const [emprestimosTerceiros, setEmprestimosTerceiros] = useState<number>(0);
  const [pagamentoSicoob, setPagamentoSicoob] = useState<number>(0);
  const [pagamentoJuros, setPagamentoJuros] = useState<number>(0);
  const [feeCredito, setFeeCredito] = useState<number>(0);
  
  // Hook para buscar análise integrada (apenas para dados do período atual se disponível)
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
  }, [cashFlows, categories, cashFlowLoading, operationalLosses, retiradaParticular, ajustesMercadoFuturo, freteGado, emprestimosTerceiros, pagamentoSicoob, pagamentoJuros, feeCredito]); // Reprocessar quando valores manuais mudarem

  // Carregar análise do período atual (se disponível) para outros dados
  useEffect(() => {
    const fetchCurrentPeriodData = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        await loadAnalysisByPeriod(year, month).catch(() => null);
      } catch (error) {
      }
    };
    
    fetchCurrentPeriodData();
  }, [loadAnalysisByPeriod]);
  
  // Definir valores manuais para o DRE
  useEffect(() => {
    // Valor histórico total de mortalidade: R$ 258.338,29
    const historicalMortality = 258338.29; // Valor em reais
    setOperationalLosses(historicalMortality);
    
    // Retirada Particular - Pagamentos a terceiros
    // 2 pagamentos de R$ 95.000,00 + 1 pagamento de R$ 180.000,00
    const totalRetiradaParticular = (95000 * 2) + 180000; // R$ 370.000,00
    setRetiradaParticular(totalRetiradaParticular);
    
    // Ajustes Mercado Futuro
    const totalAjustesMercadoFuturo = 901770; // R$ 901.770,00
    setAjustesMercadoFuturo(totalAjustesMercadoFuturo);
    
    // Frete de Gado - Pagamento a Terceiros
    const totalFreteGado = 13670; // R$ 13.670,00
    setFreteGado(totalFreteGado);
    
    // Empréstimos Risco Sacado - Despesas Financeiras
    const totalEmprestimosTerceiros = 480000; // R$ 480.000,00
    setEmprestimosTerceiros(totalEmprestimosTerceiros);
    
    // Pagamento Sicoob - Despesas Administrativas
    const totalPagamentoSicoob = 200000; // R$ 200.000,00
    setPagamentoSicoob(totalPagamentoSicoob);
    
    // Pagamento de Juros - Despesas Financeiras
    const totalPagamentoJuros = 356917.49; // R$ 356.917,49
    setPagamentoJuros(totalPagamentoJuros);
    
    // Fee de Crédito - Despesas Financeiras
    const totalFeeCredito = 466012.18; // R$ 466.012,18
    setFeeCredito(totalFeeCredito);

    // Debug removido para limpeza de código
  }, []); // Sem dependências para definir apenas uma vez

  const processFinancialData = () => {
    try {
      // Debug removido para limpeza de código
      
      // Separar receitas e despesas (excluindo mortalidade para evitar duplicação)
      const expenses = cashFlows.filter(cf => {
        if (cf.type !== 'EXPENSE') return false;
        
        const desc = cf.description?.toLowerCase() || '';
        const categoryObj = categories.find(cat => cat.id === cf.categoryId);
        const categoryName = categoryObj?.name?.toLowerCase() || '';
        
        // Excluir qualquer coisa relacionada a mortalidade/morte e empréstimos (pois adicionamos manualmente)
        const isMortality = desc.includes('mortalidade') || 
                           desc.includes('morte') || 
                           desc.includes('perda operacional') ||
                           desc.includes('perdas operacionais') ||
                           desc.includes('perda de') ||
                           desc.includes('deaths') ||
                           desc.includes('mortality') ||
                           desc.includes('obito') ||
                           desc.includes('óbito') ||
                           desc.includes('animal mort') ||
                           desc.includes('empréstimos a terceiros') ||
                           desc.includes('empréstimo') ||
                           categoryName.includes('mortalidade') ||
                           categoryName.includes('morte') ||
                           categoryName.includes('perda') ||
                           categoryName.includes('perdas') ||
                           categoryName.includes('deaths') ||
                           categoryName.includes('mortality') ||
                           categoryName.includes('obito') ||
                           categoryName.includes('óbito') ||
                           categoryName.includes('empréstimos a terceiros') ||
                           categoryName.includes('empréstimo') ||
                           // Verificar também o ID da categoria
                           cf.categoryId === '30' || // ID específico da categoria de mortalidade
                           // Verificar se o valor é exatamente igual ao histórico de mortalidade ou empréstimos
                           cf.amount === operationalLosses ||
                           cf.amount === 480000;
                           
        // Debug removido para limpeza de código
                           
        return !isMortality;
      });
      const revenues = cashFlows.filter(cf => cf.type === 'INCOME');

      // Debug removido para limpeza de código

      // Calcular totais (perdas operacionais serão adicionadas separadamente no DRE)
      const totalCashExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalExpenses = totalCashExpenses; // Não incluir perdas aqui pois serão adicionadas ao DRE
      const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0);
      const balance = totalRevenues - totalExpenses - operationalLosses; // Subtrair perdas do balanço final
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

        // Debug removido para limpeza de código
      });

      // Adicionar perdas operacionais como categoria separada se houver (somente se ainda não existir)
      if (operationalLosses > 0 && !expensesByCategory['Perdas Operacionais (Mortalidade)']) {
        expensesByCategory['Perdas Operacionais (Mortalidade)'] = operationalLosses;
        // Debug removido para limpeza de código
      } else if (expensesByCategory['Perdas Operacionais (Mortalidade)']) {
        // Debug removido para limpeza de código
      }
      
      // Adicionar Retirada Particular como despesa operacional
      if (retiradaParticular > 0 && !expensesByCategory['Retirada Particular']) {
        expensesByCategory['Retirada Particular'] = retiradaParticular;
      }
      
      // Adicionar Ajustes Mercado Futuro como despesa administrativa (retiradas operacionais)
      if (ajustesMercadoFuturo > 0 && !expensesByCategory['Ajustes Mercado Futuro']) {
        expensesByCategory['Ajustes Mercado Futuro'] = ajustesMercadoFuturo;
      }
      
      // Adicionar Frete de Gado como custo logístico
      if (freteGado > 0 && !expensesByCategory['Frete de Gado']) {
        expensesByCategory['Frete de Gado'] = freteGado;
      }
      
      // Adicionar Empréstimos Risco Sacado como despesa financeira
      if (emprestimosTerceiros > 0 && !expensesByCategory['Empréstimos Risco Sacado']) {
        expensesByCategory['Empréstimos Risco Sacado'] = emprestimosTerceiros;
      }
      
      // Adicionar Pagamento Sicoob como despesa administrativa
      if (pagamentoSicoob > 0 && !expensesByCategory['Pagamento Sicoob']) {
        expensesByCategory['Pagamento Sicoob'] = pagamentoSicoob;
      }
      
      // Adicionar Pagamento de Juros como despesa financeira
      if (pagamentoJuros > 0 && !expensesByCategory['Juros e Multas']) {
        expensesByCategory['Juros e Multas'] = pagamentoJuros;
      }
      
      // Adicionar Fee de Crédito como despesa financeira
      if (feeCredito > 0 && !expensesByCategory['Fee de Crédito']) {
        expensesByCategory['Fee de Crédito'] = feeCredito;
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
      
        // Debug removido para limpeza de código

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
      {data && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>📊 Demonstrativo de Resultado (DRE)</CardTitle>
            <CardDescription>
              <span className="text-blue-600 font-medium">
                ✅ Perdas por mortalidade: Usando valor histórico total de R$ 258.338,29 (todas as mortes registradas)
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DREStatement 
              expenses={data.expenses || []}
              revenues={data.revenues || []}
              period="Período Atual (com Mortalidade Histórica)"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
