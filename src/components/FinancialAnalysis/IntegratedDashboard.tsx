import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Filter,
  FilterX
} from 'lucide-react';

import { useIntegratedFinancialAnalysis } from '@/hooks/useIntegratedFinancialAnalysis';

interface IntegratedDashboardProps {
  className?: string;
}

export const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({ className }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filtersEnabled, setFiltersEnabled] = useState<boolean>(true);

  const {
    currentAnalysis,
    dashboard,
    yearAnalyses,
    allTransactions,
    loading,
    error,
    generateAnalysis,
    loadAnalysisByPeriod,
    loadDashboard,
    loadAllTransactions,
    hasAnalysisForPeriod,
    getAnalysisForPeriod,
    formatCurrency,
    formatPercentage,
    calculateGrowth,
    getReconciliationStatus,
    getReconciliationColor,
    calculateQualityIndicators
  } = useIntegratedFinancialAnalysis({ autoLoad: true, defaultYear: selectedYear });

  // Carregar dados quando ano/mês mudar ou filtros forem alterados
  useEffect(() => {
    if (filtersEnabled) {
      loadDashboard(selectedYear);
    } else {
      // Carregar todas as transações quando filtros estiverem desabilitados
      loadAllTransactions?.();
    }
  }, [selectedYear, filtersEnabled, loadDashboard, loadAllTransactions]);

  // Tentar carregar análise do período selecionado
  useEffect(() => {
    if (filtersEnabled) {
      const existingAnalysis = getAnalysisForPeriod(selectedYear, selectedMonth);
      if (existingAnalysis && !currentAnalysis) {
        loadAnalysisByPeriod(selectedYear, selectedMonth);
      }
    }
  }, [selectedYear, selectedMonth, filtersEnabled, getAnalysisForPeriod, currentAnalysis, loadAnalysisByPeriod]);

  const handleGenerateAnalysis = async () => {
    try {
      await generateAnalysis({
        year: selectedYear,
        month: selectedMonth,
        includeNonCashItems: true
      });
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
    }
  };

  const handlePeriodChange = async (month: number) => {
    setSelectedMonth(month);
    try {
      await loadAnalysisByPeriod(selectedYear, month);
    } catch (error) {
      // Análise não existe ainda para este período
      console.log(`Análise não existe para ${month}/${selectedYear}`);
    }
  };

  // Dados para os cards de resumo
  const summaryCards = dashboard ? [
    {
      title: 'Receita Total',
      value: formatCurrency(dashboard.summary.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Despesas Total',
      value: formatCurrency(dashboard.summary.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Resultado Líquido',
      value: formatCurrency(dashboard.summary.totalNetIncome),
      icon: dashboard.summary.totalNetIncome >= 0 ? TrendingUp : TrendingDown,
      color: dashboard.summary.totalNetIncome >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: dashboard.summary.totalNetIncome >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Fluxo de Caixa',
      value: formatCurrency(dashboard.summary.totalCashFlow),
      icon: BarChart3,
      color: dashboard.summary.totalCashFlow >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: dashboard.summary.totalCashFlow >= 0 ? 'bg-blue-50' : 'bg-red-50'
    }
  ] : [];

  const qualityIndicators = currentAnalysis ? calculateQualityIndicators(currentAnalysis) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise Financeira Integrada</h1>
          <p className="text-muted-foreground">
            Análise financeira completa e integrada do agronegócio
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setFiltersEnabled(!filtersEnabled)}
            variant={filtersEnabled ? "default" : "outline"}
            className="gap-2"
          >
            {filtersEnabled ? <Filter className="h-4 w-4" /> : <FilterX className="h-4 w-4" />}
            {filtersEnabled ? "Filtros Ativos" : "Filtros Inativos"}
          </Button>

          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(parseInt(value))}
            disabled={!filtersEnabled}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => handlePeriodChange(parseInt(value))}
            disabled={!filtersEnabled}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2023, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerateAnalysis}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Gerar Análise
          </Button>
        </div>
      </div>

      {/* Status da Análise */}
      {!filtersEnabled ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Exibindo todas as transações financeiras sem filtro de período.
            {allTransactions && (
              <span className="ml-2">
                Total de transações: <Badge variant="secondary">{allTransactions.length}</Badge>
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : hasAnalysisForPeriod(selectedYear, selectedMonth) ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Análise integrada disponível para {selectedMonth}/{selectedYear}
            {currentAnalysis && (
              <span className="ml-2">
                - Status: <Badge variant="secondary">{currentAnalysis.status}</Badge>
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma análise encontrada para {selectedMonth}/{selectedYear}. 
            Clique em "Gerar Análise" para criar uma nova.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo Anual */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`h-8 w-8 rounded-full ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                {dashboard.summary.totalRevenue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {card.title.includes('Resultado') && (
                      `Margem: ${formatPercentage(dashboard.summary.netMargin)}`
                    )}
                    {card.title.includes('Fluxo') && (
                      `Margem: ${formatPercentage(dashboard.summary.cashFlowMargin)}`
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs principais */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliação</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {currentAnalysis ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Resumo do Período */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Resumo - {selectedMonth}/{selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Receitas:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(currentAnalysis.totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Despesas:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(currentAnalysis.totalExpenses)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Resultado:</span>
                      <span className={currentAnalysis.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(currentAnalysis.netIncome)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Qualidade dos Dados */}
              {qualityIndicators && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Indicadores de Qualidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Conversão para Caixa:</span>
                        <span className="font-medium">
                          {formatPercentage(qualityIndicators.cashConversion * 100)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Itens Não-Caixa:</span>
                        <span className="font-medium">
                          {formatPercentage(qualityIndicators.nonCashPortion * 100)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precisão da Reconciliação:</span>
                        <span className={`font-medium ${getReconciliationColor(getReconciliationStatus(currentAnalysis.reconciliationDifference, currentAnalysis.netIncome))}`}>
                          {formatPercentage(qualityIndicators.reconciliationAccuracy * 100)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg text-muted-foreground">
                  Selecione um período e gere uma análise para visualizar os dados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Reconciliação */}
        <TabsContent value="reconciliation" className="space-y-4">
          {currentAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle>Reconciliação DRE x DFC</CardTitle>
                <CardDescription>
                  Análise das diferenças entre resultado contábil e fluxo de caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Resultado Contábil (DRE)</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(currentAnalysis.reconciliation.netIncome)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Fluxo de Caixa Líquido (DFC)</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(currentAnalysis.reconciliation.netCashFlow)}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ajustes Não-Caixa:</span>
                      <span className="font-medium">
                        {formatCurrency(currentAnalysis.reconciliation.nonCashAdjustments)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Diferença de Reconciliação:</span>
                      <span className={`${getReconciliationColor(getReconciliationStatus(currentAnalysis.reconciliation.difference, currentAnalysis.netIncome))}`}>
                        {formatCurrency(currentAnalysis.reconciliation.difference)}
                      </span>
                    </div>
                  </div>
                  
                  {Math.abs(currentAnalysis.reconciliation.difference) > 1000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Diferença significativa detectada. Verifique se todas as transações 
                        foram classificadas corretamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Gere uma análise para visualizar a reconciliação DRE x DFC
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Fluxo de Caixa */}
        <TabsContent value="cashflow" className="space-y-4">
          {currentAnalysis ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Atividades Operacionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recebimentos:</span>
                      <span className="text-green-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.operating.receipts)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pagamentos:</span>
                      <span className="text-red-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.operating.payments)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Líquido:</span>
                      <span className={currentAnalysis.cashFlowBreakdown.operating.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.operating.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Atividades de Investimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recebimentos:</span>
                      <span className="text-green-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.investing.receipts)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pagamentos:</span>
                      <span className="text-red-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.investing.payments)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Líquido:</span>
                      <span className={currentAnalysis.cashFlowBreakdown.investing.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.investing.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Atividades de Financiamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recebimentos:</span>
                      <span className="text-green-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.financing.receipts)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pagamentos:</span>
                      <span className="text-red-600">
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.financing.payments)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Líquido:</span>
                      <span className={currentAnalysis.cashFlowBreakdown.financing.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(currentAnalysis.cashFlowBreakdown.financing.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Gere uma análise para visualizar o detalhamento do fluxo de caixa
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Tendências */}
        <TabsContent value="trends" className="space-y-4">
          {dashboard && dashboard.trends.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Tendências Anuais - {selectedYear}</CardTitle>
                <CardDescription>
                  Evolução mensal dos indicadores financeiros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.trends.map((trend, index) => {
                    const monthName = new Date(selectedYear, trend.month - 1).toLocaleDateString('pt-BR', { month: 'long' });
                    const previousTrend = dashboard.trends[index - 1];
                    const revenueGrowth = previousTrend ? calculateGrowth(trend.revenue, previousTrend.revenue) : 0;
                    
                    return (
                      <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium capitalize">{monthName}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Receita: </span>
                              <span className="font-medium">{formatCurrency(trend.revenue)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Resultado: </span>
                              <span className={`font-medium ${trend.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(trend.netIncome)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {index > 0 && (
                          <div className="flex items-center gap-2">
                            {revenueGrowth >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(Math.abs(revenueGrowth))}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Dados insuficientes para análise de tendências. Gere mais análises mensais.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};