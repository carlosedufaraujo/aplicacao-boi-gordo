import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileDown,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  Activity,
  AlertCircle,
  Package,
  Users,
  MapPin,
  Heart,
  Weight,
  Clock,
  ChartBar,
  Filter,
  Download,
  Eye,
  Beef,
  Calculator,
  Target,
  Info,
  PieChart,
  BarChart3,
  LineChart
} from 'lucide-react';

// Hooks
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';
import { useInterventionsApi } from '@/hooks/api/useInterventionsApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { formatSafeCurrency, formatSafeNumber, formatSafeDecimal, toSafeNumber } from '@/utils/dateUtils';
import { normalizeCategory, getCategoryDisplayName } from '@/utils/categoryNormalizer';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Reports() {
  // Estados
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedLot, setSelectedLot] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Buscar dados
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  const { interventions, loading: interventionsLoading } = useInterventionsApi();
  const { pens, loading: pensLoading } = usePensApi();
  const { payerAccounts } = usePayerAccountsApi();

  // Cálculos e métricas
  const [metrics, setMetrics] = useState({
    // Operacionais
    totalAnimals: 0,
    totalLots: 0,
    averageWeight: 0,
    totalArrobas: 0,
    mortalityRate: 0,
    totalDeaths: 0,
    averageDaysConfined: 0,
    
    // Financeiros
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalCapitalAllocated: 0,
    averagePricePerArroba: 0,
    totalFreight: 0,
    totalCommission: 0,
    
    // Por categoria
    expensesByCategory: {} as Record<string, number>,
    
    // Por estado
    purchasesByState: {} as Record<string, { count: number, value: number }>,
    
    // Por lote
    performanceByLot: [] as any[],
    
    // Tendências
    monthlyTrend: [] as any[]
  });

  // Calcular métricas
  useEffect(() => {
    if (!cattlePurchases || !expenses || !revenues || !interventions) return;

    // Filtrar dados por período se necessário
    let filteredPurchases = cattlePurchases;
    let filteredExpenses = expenses;
    let filteredRevenues = revenues;
    
    if (selectedLot !== 'all') {
      filteredPurchases = cattlePurchases.filter(p => p.lotCode === selectedLot);
      filteredExpenses = expenses.filter(e => e.purchaseId && 
        filteredPurchases.some(p => p.id === e.purchaseId));
    }

    // MÉTRICAS OPERACIONAIS
    const totalAnimals = filteredPurchases.reduce((sum, p) => 
      sum + toSafeNumber(p.currentQuantity || p.initialQuantity), 0);
    
    const totalLots = filteredPurchases.length;
    
    const totalWeight = filteredPurchases.reduce((sum, p) => 
      sum + toSafeNumber(p.purchaseWeight || p.totalWeight), 0);
    
    const averageWeight = totalAnimals > 0 ? totalWeight / totalAnimals : 0;
    const totalArrobas = totalWeight / 15;
    
    // Mortalidade
    const deaths = interventions.filter(i => i.type === 'death');
    const totalDeaths = deaths.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const initialAnimals = filteredPurchases.reduce((sum, p) => 
      sum + toSafeNumber(p.initialQuantity), 0);
    const mortalityRate = initialAnimals > 0 ? (totalDeaths / initialAnimals) * 100 : 0;
    
    // Dias confinados (média)
    const today = new Date();
    const daysConfined = filteredPurchases.map(p => {
      const purchaseDate = new Date(p.purchaseDate);
      const days = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      return days;
    });
    const averageDaysConfined = daysConfined.length > 0 
      ? daysConfined.reduce((a, b) => a + b, 0) / daysConfined.length 
      : 0;

    // MÉTRICAS FINANCEIRAS
    const totalRevenue = filteredRevenues.reduce((sum, r) => 
      sum + toSafeNumber(r.totalAmount || r.amount || r.value), 0);
    
    const totalExpenses = filteredExpenses.reduce((sum, e) => 
      sum + toSafeNumber(e.totalAmount || e.amount || e.value), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Capital alocado e preço médio
    let totalCapitalAllocated = 0;
    let totalWeightedPrice = 0;
    let totalPurchaseArrobas = 0;
    
    filteredPurchases.forEach(p => {
      const purchaseValue = toSafeNumber(p.purchaseValue);
      const freight = toSafeNumber(p.freightCost);
      const commission = toSafeNumber(p.commission);
      const arrobas = toSafeNumber(p.purchaseWeight || p.totalWeight) / 15;
      const pricePerArroba = toSafeNumber(p.pricePerArroba);
      
      totalCapitalAllocated += purchaseValue + freight + commission;
      totalWeightedPrice += pricePerArroba * arrobas;
      totalPurchaseArrobas += arrobas;
    });
    
    const averagePricePerArroba = totalPurchaseArrobas > 0 
      ? totalWeightedPrice / totalPurchaseArrobas 
      : 0;
    
    // Total de frete e comissão
    const totalFreight = filteredPurchases.reduce((sum, p) => 
      sum + toSafeNumber(p.freightCost), 0);
    const totalCommission = filteredPurchases.reduce((sum, p) => 
      sum + toSafeNumber(p.commission), 0);

    // DESPESAS POR CATEGORIA
    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const category = getCategoryDisplayName(e.category);
      expensesByCategory[category] = (expensesByCategory[category] || 0) + 
        toSafeNumber(e.totalAmount || e.amount || e.value);
    });

    // COMPRAS POR ESTADO
    const purchasesByState: Record<string, { count: number, value: number }> = {};
    filteredPurchases.forEach(p => {
      const state = p.state || 'N/A';
      if (!purchasesByState[state]) {
        purchasesByState[state] = { count: 0, value: 0 };
      }
      purchasesByState[state].count += toSafeNumber(p.currentQuantity || p.initialQuantity);
      purchasesByState[state].value += toSafeNumber(p.purchaseValue);
    });

    // PERFORMANCE POR LOTE
    const performanceByLot = filteredPurchases.map(p => {
      const lotExpenses = expenses.filter(e => e.purchaseId === p.id);
      const lotRevenues = revenues.filter(r => r.purchaseId === p.id);
      const lotDeaths = interventions.filter(i => 
        i.type === 'death' && i.purchaseId === p.id
      );
      
      const totalLotExpenses = lotExpenses.reduce((sum, e) => 
        sum + toSafeNumber(e.totalAmount || e.amount || e.value), 0);
      const totalLotRevenues = lotRevenues.reduce((sum, r) => 
        sum + toSafeNumber(r.totalAmount || r.amount || r.value), 0);
      const deathCount = lotDeaths.reduce((sum, d) => sum + (d.quantity || 0), 0);
      const mortalityRate = p.initialQuantity > 0 
        ? (deathCount / p.initialQuantity) * 100 
        : 0;
      
      const arrobas = toSafeNumber(p.purchaseWeight || p.totalWeight) / 15;
      const costPerArroba = arrobas > 0 ? totalLotExpenses / arrobas : 0;
      const profitLoss = totalLotRevenues - totalLotExpenses;
      const margin = totalLotRevenues > 0 ? (profitLoss / totalLotRevenues) * 100 : 0;
      
      return {
        lotCode: p.lotCode,
        state: p.state || 'N/A',
        animals: p.currentQuantity || p.initialQuantity,
        arrobas: arrobas,
        purchaseValue: p.purchaseValue,
        totalExpenses: totalLotExpenses,
        totalRevenues: totalLotRevenues,
        profitLoss: profitLoss,
        margin: margin,
        mortalityRate: mortalityRate,
        costPerArroba: costPerArroba,
        pricePerArroba: p.pricePerArroba,
        daysConfined: Math.floor((today.getTime() - new Date(p.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    // TENDÊNCIA MENSAL (últimos 6 meses)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.createdAt || e.dueDate);
        return date >= monthStart && date <= monthEnd;
      });
      
      const monthRevenues = revenues.filter(r => {
        const date = new Date(r.createdAt || r.dueDate);
        return date >= monthStart && date <= monthEnd;
      });
      
      const totalMonthExpenses = monthExpenses.reduce((sum, e) => 
        sum + toSafeNumber(e.totalAmount || e.amount || e.value), 0);
      const totalMonthRevenues = monthRevenues.reduce((sum, r) => 
        sum + toSafeNumber(r.totalAmount || r.amount || r.value), 0);
      
      monthlyTrend.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        expenses: totalMonthExpenses,
        revenues: totalMonthRevenues,
        profit: totalMonthRevenues - totalMonthExpenses
      });
    }

    // Atualizar estado
    setMetrics({
      totalAnimals,
      totalLots,
      averageWeight,
      totalArrobas,
      mortalityRate,
      totalDeaths,
      averageDaysConfined,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalCapitalAllocated,
      averagePricePerArroba,
      totalFreight,
      totalCommission,
      expensesByCategory,
      purchasesByState,
      performanceByLot,
      monthlyTrend
    });
  }, [cattlePurchases, expenses, revenues, interventions, selectedLot]);

  // Função para exportar relatório
  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    
    // Preparar dados para exportação
    const exportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      lot: selectedLot,
      metrics: metrics,
      details: {
        purchases: cattlePurchases,
        expenses: expenses,
        revenues: revenues,
        interventions: interventions
      }
    };
    
    if (format === 'excel') {
      // Criar CSV
      const csvContent = generateCSV(exportData);
      downloadFile(csvContent, `relatorio-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    } else {
      // Por enquanto, exportar como JSON
      const jsonContent = JSON.stringify(exportData, null, 2);
      downloadFile(jsonContent, `relatorio-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }
    
    setIsExporting(false);
  };

  // Função auxiliar para gerar CSV
  const generateCSV = (data: any) => {
    const lines = [];
    
    // Cabeçalho
    lines.push('RELATÓRIO COMPLETO DO SISTEMA BOI GORDO');
    lines.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
    lines.push('');
    
    // Métricas Operacionais
    lines.push('MÉTRICAS OPERACIONAIS');
    lines.push(`Total de Animais,${data.metrics.totalAnimals}`);
    lines.push(`Total de Lotes,${data.metrics.totalLots}`);
    lines.push(`Peso Médio (kg),${data.metrics.averageWeight.toFixed(2)}`);
    lines.push(`Total de Arrobas,${data.metrics.totalArrobas.toFixed(2)}`);
    lines.push(`Taxa de Mortalidade (%),${data.metrics.mortalityRate.toFixed(2)}`);
    lines.push(`Total de Mortes,${data.metrics.totalDeaths}`);
    lines.push(`Média de Dias Confinados,${data.metrics.averageDaysConfined.toFixed(0)}`);
    lines.push('');
    
    // Métricas Financeiras
    lines.push('MÉTRICAS FINANCEIRAS');
    lines.push(`Receita Total,${data.metrics.totalRevenue.toFixed(2)}`);
    lines.push(`Despesas Totais,${data.metrics.totalExpenses.toFixed(2)}`);
    lines.push(`Lucro Líquido,${data.metrics.netProfit.toFixed(2)}`);
    lines.push(`Margem de Lucro (%),${data.metrics.profitMargin.toFixed(2)}`);
    lines.push(`Capital Total Alocado,${data.metrics.totalCapitalAllocated.toFixed(2)}`);
    lines.push(`Preço Médio por Arroba,${data.metrics.averagePricePerArroba.toFixed(2)}`);
    lines.push('');
    
    // Performance por Lote
    lines.push('PERFORMANCE POR LOTE');
    lines.push('Lote,Estado,Animais,Arrobas,Valor Compra,Despesas,Receitas,Lucro/Prejuízo,Margem,Mortalidade,Dias Confinados');
    data.metrics.performanceByLot.forEach((lot: any) => {
      lines.push(`${lot.lotCode},${lot.state},${lot.animals},${lot.arrobas.toFixed(2)},${lot.purchaseValue.toFixed(2)},${lot.totalExpenses.toFixed(2)},${lot.totalRevenues.toFixed(2)},${lot.profitLoss.toFixed(2)},${lot.margin.toFixed(2)}%,${lot.mortalityRate.toFixed(2)}%,${lot.daysConfined}`);
    });
    
    return lines.join('\n');
  };

  // Função auxiliar para download
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isLoading = purchasesLoading || expensesLoading || revenuesLoading || interventionsLoading || pensLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground">
              Análise completa e detalhada de todos os dados do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedLot} onValueChange={setSelectedLot}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os lotes</SelectItem>
                {cattlePurchases?.map(p => (
                  <SelectItem key={p.id} value={p.lotCode}>
                    {p.lotCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Animais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSafeNumber(metrics.totalAnimals)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                em {metrics.totalLots} lotes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Capital Alocado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSafeCurrency(metrics.totalCapitalAllocated)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                R$ {metrics.averagePricePerArroba.toFixed(2)}/@ média
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatSafeCurrency(metrics.netProfit)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Margem: {metrics.profitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Mortalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.mortalityRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.totalDeaths} mortes registradas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com análises detalhadas */}
        <Tabs defaultValue="operational" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="operational">Operacional</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="comparative">Comparativo</TabsTrigger>
          </TabsList>

          {/* Tab Operacional */}
          <TabsContent value="operational" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Distribuição por Estado */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Estado</CardTitle>
                  <CardDescription>
                    Quantidade de animais por estado de origem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.purchasesByState)
                      .sort(([, a], [, b]) => b.count - a.count)
                      .map(([state, data]) => (
                        <div key={state} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{state}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">
                              {formatSafeNumber(data.count)} animais
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatSafeCurrency(data.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Peso e Confinamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Produção</CardTitle>
                  <CardDescription>
                    Indicadores de peso e tempo de confinamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Peso Médio</span>
                      <span className="font-bold">{metrics.averageWeight.toFixed(1)} kg</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total de Arrobas</span>
                      <span className="font-bold">{formatSafeNumber(metrics.totalArrobas)}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Dias Confinados (média)</span>
                      <span className="font-bold">{metrics.averageDaysConfined.toFixed(0)} dias</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>

                  <Separator />

                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa de Mortalidade</span>
                      <Badge variant={metrics.mortalityRate < 2 ? "success" : "destructive"}>
                        {metrics.mortalityRate.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Financeiro */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Despesas por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>
                    Distribuição de custos por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.expensesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([category, value]) => {
                        const percentage = (value / metrics.totalExpenses) * 100;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatSafeCurrency(value)} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatSafeCurrency(metrics.totalExpenses)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                  <CardDescription>
                    Visão geral de receitas e despesas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Receitas</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatSafeCurrency(metrics.totalRevenue)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Despesas</span>
                      </div>
                      <span className="font-bold text-red-600">
                        {formatSafeCurrency(metrics.totalExpenses)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Resultado</span>
                      <span className={`font-bold text-lg ${
                        metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatSafeCurrency(metrics.netProfit)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Margem</span>
                      <Badge variant={metrics.profitMargin >= 0 ? "success" : "destructive"}>
                        {metrics.profitMargin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Custos Adicionais</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete Total</span>
                        <span>{formatSafeCurrency(metrics.totalFreight)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comissões</span>
                        <span>{formatSafeCurrency(metrics.totalCommission)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Performance por Lote */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Detalhada por Lote</CardTitle>
                <CardDescription>
                  Análise individual de cada lote com métricas de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Animais</TableHead>
                        <TableHead className="text-right">Arrobas</TableHead>
                        <TableHead className="text-right">R$/@</TableHead>
                        <TableHead className="text-right">Custo/@</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="text-right">Mortalidade</TableHead>
                        <TableHead className="text-right">Dias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.performanceByLot.map((lot) => (
                        <TableRow key={lot.lotCode}>
                          <TableCell className="font-medium">{lot.lotCode}</TableCell>
                          <TableCell>{lot.state}</TableCell>
                          <TableCell className="text-right">{lot.animals}</TableCell>
                          <TableCell className="text-right">{lot.arrobas.toFixed(0)}</TableCell>
                          <TableCell className="text-right">
                            R$ {lot.pricePerArroba.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {lot.costPerArroba.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            lot.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatSafeCurrency(lot.profitLoss)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={lot.margin >= 0 ? "success" : "destructive"}>
                              {lot.margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={lot.mortalityRate < 2 ? "secondary" : "destructive"}>
                              {lot.mortalityRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{lot.daysConfined}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {metrics.performanceByLot.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum lote encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tendências */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências Mensais</CardTitle>
                <CardDescription>
                  Evolução de receitas, despesas e lucro nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.monthlyTrend.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {formatSafeCurrency(month.revenues)}
                          </Badge>
                          <Badge variant="outline" className="text-red-600">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {formatSafeCurrency(month.expenses)}
                          </Badge>
                          <Badge variant={month.profit >= 0 ? "success" : "destructive"}>
                            {formatSafeCurrency(month.profit)}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Progress 
                          value={(month.revenues / Math.max(...metrics.monthlyTrend.map(m => m.revenues))) * 100} 
                          className="h-2 bg-green-100" 
                        />
                        <Progress 
                          value={(month.expenses / Math.max(...metrics.monthlyTrend.map(m => m.expenses))) * 100} 
                          className="h-2 bg-red-100" 
                        />
                        <Progress 
                          value={month.profit >= 0 ? (month.profit / Math.max(...metrics.monthlyTrend.map(m => Math.abs(m.profit)))) * 100 : 0} 
                          className="h-2 bg-blue-100" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Comparativo */}
          <TabsContent value="comparative" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top 5 Melhores Lotes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Top 5 Melhores Lotes
                  </CardTitle>
                  <CardDescription>
                    Lotes com melhor performance financeira
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.performanceByLot
                      .sort((a, b) => b.margin - a.margin)
                      .slice(0, 5)
                      .map((lot, index) => (
                        <div key={lot.lotCode} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{lot.lotCode}</p>
                              <p className="text-xs text-muted-foreground">{lot.state}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatSafeCurrency(lot.profitLoss)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Margem: {lot.margin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Piores Lotes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Top 5 Lotes Críticos
                  </CardTitle>
                  <CardDescription>
                    Lotes que precisam de atenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.performanceByLot
                      .sort((a, b) => a.margin - b.margin)
                      .slice(0, 5)
                      .map((lot, index) => (
                        <div key={lot.lotCode} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-700">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{lot.lotCode}</p>
                              <p className="text-xs text-muted-foreground">{lot.state}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              {formatSafeCurrency(lot.profitLoss)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Margem: {lot.margin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}