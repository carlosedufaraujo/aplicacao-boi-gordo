import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Info, 
  Settings,
  Wallet,
  BarChart3,
  Package,
  Percent,
  Activity,
  Scale,
  Calculator
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { formatSafeCurrency, formatSafeNumber, formatSafeDecimal, toSafeNumber, safeDivision } from '@/utils/dateUtils';
import { calculateLotMetrics, CattlePurchaseData } from '@/utils/cattlePurchaseCalculations';
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HerdValueChartProps {
  marketPrice: number;
  setMarketPrice: (price: number) => void;
}

export const HerdValueChart: React.FC<HerdValueChartProps> = ({ marketPrice, setMarketPrice }) => {
  // Buscar compras de gado do sistema
  const { cattlePurchases, loading } = useCattlePurchasesApi();
  const [totalArrobas, setTotalArrobas] = useState<number>(0);
  const [totalArrobasProduzidas, setTotalArrobasProduzidas] = useState<number>(0);
  const [totalCapital, setTotalCapital] = useState<number>(0);
  const [averagePurchasePrice, setAveragePurchasePrice] = useState<number>(0);
  const [allocatedCapital, setAllocatedCapital] = useState<number>(0);
  const [marketValue, setMarketValue] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(0);

  // Estado adicional para rendimento médio
  const [averageCarcassYield, setAverageCarcassYield] = useState<number>(0);
  
  // Estados para GMD, RC de venda e CAP
  const [averageGMD, setAverageGMD] = useState<number>(1.5); // GMD padrão 1.5 kg/dia
  const [saleYield, setSaleYield] = useState<number>(52); // RC de venda padrão 52%
  const [producedArrobaCost, setProducedArrobaCost] = useState<number>(200); // Custo da arroba produzida padrão R$ 200

  // Calcular métricas baseadas nas compras reais
  useEffect(() => {
    if (!cattlePurchases || cattlePurchases.length === 0) {
      setTotalArrobas(0);
      setTotalArrobasProduzidas(0);
      setTotalCapital(0);
      setAveragePurchasePrice(0);
      setAllocatedCapital(0);
      setMarketValue(0);
      setProfitMargin(0);
      setAverageCarcassYield(0);
      return;
    }

    // Calcular total de arrobas e capital alocado
    let totalArrobasCalc = 0;
    let totalArrobasProduzidasCalc = 0;
    let totalCapitalCalc = 0;
    let totalCapitalComCAP = 0;
    let totalWeightForYield = 0;
    let totalWeightedYield = 0;
    cattlePurchases.forEach(purchase => {
      // Usar função centralizada para calcular métricas do lote
      const metrics = calculateLotMetrics(purchase as CattlePurchaseData);
      const purchaseWeight = metrics.weight;
      const carcassYield = metrics.carcassYield;
      const currentQuantity = metrics.quantity;
      
      // Calcular dias em confinamento
      const purchaseDateStr = purchase.purchaseDate || purchase.createdAt;
      if (!purchaseDateStr) {
        // Pular compras sem data
      }
      
      // Converter data no formato DD/MM/YYYY se necessário
      let purchaseDate: Date;
      if (purchaseDateStr && purchaseDateStr.includes('/')) {
        const [day, month, year] = purchaseDateStr.split('/');
        purchaseDate = new Date(Number(year), Number(month) - 1, Number(day));
      } else if (purchaseDateStr) {
        purchaseDate = new Date(purchaseDateStr);
      } else {
        purchaseDate = new Date(); // Usar data atual se não tiver data
      }
      
      if (isNaN(purchaseDate.getTime())) {
        purchaseDate = new Date(); // Usar data atual se inválida
      }
      
      const today = new Date();
      const diasConfinamento = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      // Calcular ganho de peso total do lote
      const ganhoTotalPeso = averageGMD * diasConfinamento * currentQuantity;
      const pesoAtualLote = purchaseWeight + ganhoTotalPeso;
      
      // Para média ponderada do rendimento
      totalWeightForYield += purchaseWeight;
      totalWeightedYield += carcassYield * purchaseWeight;
      
      // Calcular arrobas COMPRADAS (peso de entrada com RC de compra)
      const carcassWeightCompra = purchaseWeight * (carcassYield / 100);
      const arrobasCompra = carcassWeightCompra / 15;
      
      // Calcular arrobas ATUAIS (peso atual com RC de venda)
      const carcassWeightAtual = pesoAtualLote * (saleYield / 100);
      const arrobasAtual = carcassWeightAtual / 15;
      
      // Calcular arrobas PRODUZIDAS (diferença entre atual e compra)
      const ganhoArrobasCarcaca = (ganhoTotalPeso * (saleYield / 100)) / 15;
      const arrobasProduzidas = ganhoArrobasCarcaca;
      
      // Calcular valor total do lote (incluindo custos adicionais)
      const purchaseValue = toSafeNumber(purchase.purchaseValue || 0);
      const freight = toSafeNumber(purchase.freightCost || 0);
      const commission = toSafeNumber(purchase.commission || 0);
      const otherCosts = toSafeNumber(purchase.otherCosts || purchase.operationalCost || 0);
      const totalLotCost = purchaseValue + freight + commission + otherCosts;
      
      // Calcular custo da arroba produzida (CAP)
      const custoProducao = arrobasProduzidas * producedArrobaCost;
      const totalLotCostComCAP = totalLotCost + custoProducao;
      
      totalArrobasCalc += arrobasAtual;
      totalArrobasProduzidasCalc += arrobasProduzidas;
      totalCapitalCalc += totalLotCost;
      totalCapitalComCAP += totalLotCostComCAP;
    });

    // Calcular preço médio ponderado por arroba de carcaça COM CAP
    const avgPriceComCAP = totalArrobasCalc > 0 ? totalCapitalComCAP / totalArrobasCalc : 0;
    
    // Calcular rendimento médio ponderado
    const avgYield = totalWeightForYield > 0 ? totalWeightedYield / totalWeightForYield : 0;
    
    // Calcular valor de mercado com peso atual (considerando GMD)
    const currentMarketValue = totalArrobasCalc * marketPrice;
    
    // Calcular margem de lucro COM CAP
    const profit = currentMarketValue - totalCapitalComCAP;
    const margin = totalCapitalComCAP > 0 ? (profit / totalCapitalComCAP) * 100 : 0;
    
    setTotalArrobas(totalArrobasCalc);
    setTotalArrobasProduzidas(totalArrobasProduzidasCalc);
    setTotalCapital(totalCapitalCalc);
    setAveragePurchasePrice(avgPriceComCAP);
    setAllocatedCapital(totalCapitalComCAP);
    setMarketValue(currentMarketValue);
    setProfitMargin(margin);
    setAverageCarcassYield(avgYield);
  }, [cattlePurchases, marketPrice, averageGMD, saleYield, producedArrobaCost]);

  // Dados para o gráfico comparativo
  const chartData = React.useMemo(() => {
    // Criar dados dos últimos 30 dias mostrando preço de compra vs mercado
    const data = [];
    const basePrice = averagePurchasePrice || 300;
    
    // Gerar pontos a cada 5 dias
    for (let i = 30; i >= 0; i -= 5) {
      const date = subDays(new Date(), i);
      
      // Variação mais realista do preço de mercado
      // Começa próximo ao preço de compra e varia gradualmente
      let marketVariation = marketPrice;
      if (i > 0) {
        // Para dias anteriores, simular uma tendência gradual
        const daysFactor = (30 - i) / 30; // 0 a 1 conforme se aproxima do presente
        const trendFactor = marketPrice > basePrice ? daysFactor : -daysFactor;
        marketVariation = basePrice + (marketPrice - basePrice) * daysFactor;
        // Adicionar pequena variação aleatória
        marketVariation += (Math.random() - 0.5) * 10;
      }
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: date,
        purchase: basePrice,
        market: Math.max(0, marketVariation) // Garantir valor não negativo
      });
    }
    
    return data;
  }, [averagePurchasePrice, marketPrice]);

  const chartConfig = {
    purchase: {
      label: "Preço de Compra",
      color: "hsl(221, 83%, 53%)",
    },
    market: {
      label: "Preço de Mercado", 
      color: profitMargin >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="card-title">Capital Alocado vs. Valor de Mercado</CardTitle>
          <CardDescription>
            Análise comparativa baseada em arrobas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card de Parâmetros de Análise */}
      <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              CONFIG
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="kpi-value mb-1">Parâmetros</div>
          <p className="kpi-label mb-3">Configure os valores para análise</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="market-price" className="form-label">
                Preço de Mercado
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="market-price"
                  type="number"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(Number(e.target.value))}
                  className="h-8 text-xs"
                  step="10"
                />
                <span className="text-body-sm">R$/@</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gmd" className="form-label">
                GMD
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="gmd"
                  type="number"
                  value={averageGMD}
                  onChange={(e) => setAverageGMD(Number(e.target.value))}
                  className="h-8 text-xs"
                  step="0.1"
                />
                <span className="text-body-sm">kg</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sale-yield" className="form-label">
                Rendimento
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="sale-yield"
                  type="number"
                  value={saleYield}
                  onChange={(e) => setSaleYield(Number(e.target.value))}
                  className="h-8 text-xs"
                  step="1"
                />
                <span className="text-body-sm">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cap" className="form-label">
                CAP
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="cap"
                  type="number"
                  value={producedArrobaCost}
                  onChange={(e) => setProducedArrobaCost(Number(e.target.value))}
                  className="h-8 text-xs"
                  step="10"
                />
                <span className="text-body-sm">R$</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalArrobas > 0 ? (
        <>
          {/* KPIs Cards - Métricas Principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Capital Investido */}
            <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    CAP
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="kpi-value">
                  {formatSafeCurrency(allocatedCapital)}
                </div>
                <p className="kpi-label">Capital Investido</p>
                <p className="text-body-sm mt-1">
                  Média: R$ {averagePurchasePrice.toFixed(2)}/@
                </p>
                <div className="flex items-center gap-1 text-body-sm mt-1">
                  <Calculator className="h-3 w-3 text-muted-foreground" />
                  <span className="text-body-sm">
                    Incluindo CAP
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Valor de Mercado */}
            <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <Badge variant={profitMargin >= 0 ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5">
                    {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="kpi-value">
                  {formatSafeCurrency(marketValue)}
                </div>
                <p className="kpi-label">Valor de Mercado</p>
                <p className="text-body-sm mt-1">
                  {formatSafeNumber(totalArrobas)} @ × R$ {marketPrice}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {profitMargin >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-body-sm ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Margem atual
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Resultado Projetado */}
            <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <Percent className={`h-5 w-5 ${profitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                  <Badge variant={profitMargin >= 0 ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5">
                    {profitMargin >= 0 ? 'LUCRO' : 'PREJUÍZO'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className={`kpi-value ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin >= 0 ? '+' : ''}{formatSafeCurrency(Math.abs(marketValue - allocatedCapital))}
                </div>
                <p className="kpi-label">Resultado Projetado</p>
                <p className="text-body-sm mt-1">
                  Margem: {profitMargin.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {profitMargin >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-body-sm ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Projeção atual
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Produção Total */}
            <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    @
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="kpi-value">
                  {formatSafeNumber(totalArrobas)} @
                </div>
                <p className="kpi-label">Produção Total</p>
                <p className="text-body-sm mt-1">
                  Produzidas: {formatSafeNumber(totalArrobasProduzidas)} @
                </p>
                <div className="flex items-center gap-1 text-body-sm mt-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="text-body-sm">
                    GMD: {averageGMD} kg/dia
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="card-title">Evolução de Preços</CardTitle>
                  <CardDescription className="card-subtitle">
                    Comparação entre preço de compra e valor de mercado
                  </CardDescription>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-body-sm"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-body-sm"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchase" 
                    stroke="var(--color-purchase)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="Preço de Compra"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="market" 
                    stroke="var(--color-market)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-market)', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Preço de Mercado"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Cards de Detalhamento */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Card de Custos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="card-title">Composição de Custos</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm">Custo de Compra</span>
                  <span className="table-cell-important">{formatSafeCurrency(totalCapital)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm">Custo de Produção (CAP)</span>
                  <span className="table-cell-important">{formatSafeCurrency(totalArrobasProduzidas * producedArrobaCost)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="table-cell-important">Total Investido</span>
                    <span className="table-cell-important">{formatSafeCurrency(allocatedCapital)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Indicadores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="card-title">Indicadores Técnicos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm">RC Médio Compra</span>
                  <span className="table-cell-important">{averageCarcassYield.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm">RC Venda</span>
                  <span className="table-cell-important">{saleYield}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm">GMD Aplicado</span>
                  <span className="table-cell-important">{averageGMD} kg/dia</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="table-cell-important">Spread de Preço</span>
                    <span className={`table-cell-important ${marketPrice - averagePurchasePrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketPrice - averagePurchasePrice >= 0 ? '+' : ''}R$ {(marketPrice - averagePurchasePrice).toFixed(2)}/@
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-body-sm">Sem dados para exibir</p>
              <p className="text-body-sm text-muted-foreground mt-1">Registre compras de gado para visualizar o capital alocado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
