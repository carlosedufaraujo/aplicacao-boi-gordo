import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  FileText, 
  Download, 
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Weight,
  Heart,
  Activity,
  BarChart3,
  Info,
  AlertCircle,
  CheckCircle,
  Percent,
  ShoppingBag,
  Receipt,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useFinancialData } from '@/providers/FinancialDataProvider';
import { formatSafeDate } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/utils/cattlePurchaseCalculations';

export default function Reports() {
  const { 
    purchases, 
    sales, 
    expenses, 
    revenues, 
    metrics, 
    lotProfitability,
    loading,
    refresh 
  } = useFinancialData();
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Debug removido para limpeza de código

  // Função para exportar relatório
  const handleExport = (format: 'json' | 'csv') => {
    if (!metrics) return;
    
    try {
      if (format === 'json') {
        const data = {
          timestamp: new Date().toISOString(),
          metrics,
          lotProfitability,
          totalPurchases: purchases.length,
          totalSales: sales.length,
          metadata: {
            generatedBy: 'Sistema Boi Gordo - Relatórios Integrados',
            period: selectedPeriod
          }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-integrado-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Relatório exportado com sucesso!');
      } else {
        toast.info('Exportação CSV em desenvolvimento');
      }
    } catch (_error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  const getStatusColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <ChevronRight className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Integrados</h1>
          <p className="text-muted-foreground mt-1">
            Análise completa de compras, vendas e lucratividade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {metrics.totalSales} vendas
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(metrics.paidSalesValue)} pagos
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalCosts)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {metrics.totalPurchases} compras
              </Badge>
              <span className="text-xs text-muted-foreground">
                + {formatCurrency(metrics.totalExpenses)} despesas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
            {metrics.grossProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.grossProfit)}`}>
              {formatCurrency(metrics.grossProfit)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={metrics.netMargin >= 0 ? "default" : "destructive"} className="text-xs">
                {metrics.netMargin.toFixed(1)}% margem
              </Badge>
              {getStatusIcon(metrics.grossProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.roi)}`}>
              {metrics.roi.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {metrics.totalProfitableLots} lotes lucrativos
              </Badge>
              <span className="text-xs text-muted-foreground">
                {metrics.totalLossLots} com prejuízo
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="lots">Análise por Lote</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Resumo de Compras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Resumo de Compras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Informações básicas */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Lotes</span>
                  <span className="font-semibold">{metrics.totalPurchases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Animais Comprados</span>
                  <span className="font-semibold">{formatNumber(metrics.totalAnimals)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantidade de Arrobas</span>
                  <span className="font-semibold">{formatNumber(metrics.totalArrobas)} @</span>
                </div>
                
                {/* Breakdown de Despesas */}
                <Separator />
                <div className="text-xs text-muted-foreground font-medium mb-2">Breakdown de Custos</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo de Compra dos Animais</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(metrics.totalPurchaseValue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Despesas com Comissão</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(metrics.totalCommissionExpenses)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Despesas com Frete</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(metrics.totalFreightExpenses)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outras Despesas</span>
                  <span className="font-semibold text-purple-600">
                    {formatCurrency(metrics.totalOtherPurchaseExpenses)}
                  </span>
                </div>
                
                {/* Totais Calculados */}
                <Separator />
                <div className="text-xs text-muted-foreground font-medium mb-2">Totais Consolidados</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo Total (Animais + Despesas)</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(
                      metrics.totalPurchaseValue + 
                      metrics.totalCommissionExpenses + 
                      metrics.totalFreightExpenses + 
                      metrics.totalOtherPurchaseExpenses
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo Médio/Animal (Total)</span>
                  <span className="font-semibold">
                    {formatCurrency(metrics.totalAnimals > 0 ? 
                      (metrics.totalPurchaseValue + 
                       metrics.totalCommissionExpenses + 
                       metrics.totalFreightExpenses + 
                       metrics.totalOtherPurchaseExpenses) / metrics.totalAnimals : 0
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo Médio R$/@</span>
                  <span className="font-semibold text-indigo-600">
                    {formatCurrency(metrics.averageCostPerArroba)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Resumo de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Informações básicas */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Vendas</span>
                  <span className="font-semibold">{metrics.totalSales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Animais Vendidos</span>
                  <span className="font-semibold">{formatNumber(metrics.totalAnimalsSold)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantidade de Arrobas</span>
                  <span className="font-semibold">{formatNumber(metrics.totalSalesArrobas)} @</span>
                </div>
                
                {/* Breakdown Financeiro de Vendas */}
                <Separator />
                <div className="text-xs text-muted-foreground font-medium mb-2">Breakdown Financeiro</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Deduções Fiscais</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(metrics.totalTaxDeductions)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Antecipações de Recebíveis</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(metrics.totalReceivableAdvances)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Despesas com Frete</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(metrics.totalSalesFreightExpenses)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outros Custos</span>
                  <span className="font-semibold text-purple-600">
                    {formatCurrency(metrics.totalSalesOtherCosts)}
                  </span>
                </div>
                
                {/* Totais Consolidados */}
                <Separator />
                <div className="text-xs text-muted-foreground font-medium mb-2">Totais Consolidados</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Receita Total (Líquida)</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(metrics.totalSalesRevenue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Receita Média/Animal (Total)</span>
                  <span className="font-semibold">
                    {formatCurrency(metrics.averageRevenuePerAnimal)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Receita Média R$/@</span>
                  <span className="font-semibold text-indigo-600">
                    {formatCurrency(metrics.averageRevenuePerArroba)}
                  </span>
                </div>
                
                {/* Status de Pagamento */}
                <Separator />
                <div className="text-xs text-muted-foreground font-medium mb-2">Status de Pagamento</div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vendas Pagas</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(metrics.paidSalesValue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vendas Pendentes</span>
                  <span className="font-semibold text-yellow-600">
                    {formatCurrency(metrics.pendingSalesValue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise de Desempenho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise de Desempenho
              </CardTitle>
              <CardDescription>
                Indicadores de performance e lucratividade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Margem Líquida</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.abs(metrics.netMargin)} 
                      className="w-32" 
                    />
                    <span className={`text-sm font-bold ${getStatusColor(metrics.netMargin)}`}>
                      {metrics.netMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ROI (Retorno sobre Investimento)</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.abs(metrics.roi)} 
                      className="w-32" 
                    />
                    <span className={`text-sm font-bold ${getStatusColor(metrics.roi)}`}>
                      {metrics.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={metrics.totalAnimals > 0 ? (metrics.totalAnimalsSold / metrics.totalAnimals) * 100 : 0} 
                      className="w-32" 
                    />
                    <span className="text-sm font-bold">
                      {metrics.totalAnimals > 0 
                        ? ((metrics.totalAnimalsSold / metrics.totalAnimals) * 100).toFixed(1) 
                        : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Margem Bruta</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.abs(metrics.grossMargin)} 
                      className="w-32" 
                    />
                    <span className={`text-sm font-bold ${getStatusColor(metrics.grossMargin)}`}>
                      {metrics.grossMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">NET Animais (Comprados - Vendidos)</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${metrics.netAnimalsBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {metrics.netAnimalsBalance > 0 ? '+' : ''}{formatNumber(metrics.netAnimalsBalance)} animais
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{metrics.totalProfitableLots}</p>
                  <p className="text-xs text-muted-foreground">Lotes Lucrativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{metrics.totalLossLots}</p>
                  <p className="text-xs text-muted-foreground">Lotes com Prejuízo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.averageMargin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Margem Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Análise por Lote */}
        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lucratividade por Lote</CardTitle>
              <CardDescription>
                Análise detalhada de cada lote com vendas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lotProfitability.map((lot) => (
                  <div key={lot.purchase.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          Lote {lot.purchase.lotCode || lot.purchase.id.slice(-6)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatSafeDate(lot.purchase.purchaseDate)} • {lot.purchase.initialQuantity || lot.purchase.quantity || 0} animais
                        </p>
                      </div>
                      <Badge 
                        variant={lot.status === 'profit' ? 'default' : lot.status === 'loss' ? 'destructive' : 'secondary'}
                      >
                        {lot.status === 'profit' ? 'Lucro' : lot.status === 'loss' ? 'Prejuízo' : 'Pendente'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Custo Total</p>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(lot.totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(lot.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro/Prejuízo</p>
                        <p className={`font-semibold ${getStatusColor(lot.profit)}`}>
                          {formatCurrency(lot.profit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margem</p>
                        <p className={`font-semibold ${getStatusColor(lot.margin)}`}>
                          {lot.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {lot.sales.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {lot.sales.length} venda(s) realizada(s) • {lot.totalSold} animais vendidos
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {lotProfitability.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum lote com vendas realizadas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
