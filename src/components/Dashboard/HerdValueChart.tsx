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
          <CardTitle>Capital Alocado vs. Valor de Mercado</CardTitle>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parâmetros de Análise</CardTitle>
              <CardDescription>
                Configure os valores para simular o valor do rebanho
              </CardDescription>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market-price" className="text-sm font-medium">
                Preço de Mercado
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="market-price"
                  type="number"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(Number(e.target.value))}
                  className="h-9"
                  step="10"
                />
                <span className="text-sm text-muted-foreground">R$/@</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gmd" className="text-sm font-medium">
                GMD (Ganho Médio Diário)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gmd"
                  type="number"
                  value={averageGMD}
                  onChange={(e) => setAverageGMD(Number(e.target.value))}
                  className="h-9"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">kg/dia</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sale-yield" className="text-sm font-medium">
                Rendimento de Venda
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sale-yield"
                  type="number"
                  value={saleYield}
                  onChange={(e) => setSaleYield(Number(e.target.value))}
                  className="h-9"
                  step="1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cap" className="text-sm font-medium">
                CAP (Custo Arroba Produzida)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cap"
                  type="number"
                  value={producedArrobaCost}
                  onChange={(e) => setProducedArrobaCost(Number(e.target.value))}
                  className="h-9"
                  step="10"
                />
                <span className="text-sm text-muted-foreground">R$/@</span>
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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Capital Investido
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {formatSafeCurrency(allocatedCapital)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Média: R$ {averagePurchasePrice.toFixed(2)}/@
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <Calculator className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Incluindo CAP
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Valor de Mercado */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Valor de Mercado
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {formatSafeCurrency(marketValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSafeNumber(totalArrobas)} @ × R$ {marketPrice}
                  </p>
                  <div className="flex items-center gap-1">
                    {profitMargin >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`text-xs ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Resultado */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Resultado Projetado
                  </CardTitle>
                  <div className={`h-8 w-8 rounded-lg ${profitMargin >= 0 ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-red-100 dark:bg-red-950'} flex items-center justify-center`}>
                    <Percent className={`h-4 w-4 ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin >= 0 ? '+' : ''}{formatSafeCurrency(Math.abs(marketValue - allocatedCapital))}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={profitMargin >= 0 ? "default" : "destructive"} className="h-5 px-1">
                      {profitMargin >= 0 ? "Lucro" : "Prejuízo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {profitMargin.toFixed(1)}% margem
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Produção */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Produção Total
                  </CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{formatSafeNumber(totalArrobas)}</p>
                    <span className="text-sm text-muted-foreground">@</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Produzidas: {formatSafeNumber(totalArrobasProduzidas)} @
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <Activity className="h-3 w-3 text-amber-600" />
                    <span className="text-amber-600">
                      GMD: {averageGMD} kg/dia
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evolução de Preços</CardTitle>
                  <CardDescription>
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
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
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
                  <CardTitle className="text-base">Composição de Custos</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo de Compra</span>
                  <span className="text-sm font-medium">{formatSafeCurrency(totalCapital)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo de Produção (CAP)</span>
                  <span className="text-sm font-medium">{formatSafeCurrency(totalArrobasProduzidas * producedArrobaCost)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Investido</span>
                    <span className="text-sm font-bold">{formatSafeCurrency(allocatedCapital)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Indicadores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Indicadores Técnicos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RC Médio Compra</span>
                  <span className="text-sm font-medium">{averageCarcassYield.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">RC Venda</span>
                  <span className="text-sm font-medium">{saleYield}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">GMD Aplicado</span>
                  <span className="text-sm font-medium">{averageGMD} kg/dia</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Spread de Preço</span>
                    <span className={`text-sm font-bold ${marketPrice - averagePurchasePrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
              <p className="text-xs text-muted-foreground mt-1">Registre compras de gado para visualizar o capital alocado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};