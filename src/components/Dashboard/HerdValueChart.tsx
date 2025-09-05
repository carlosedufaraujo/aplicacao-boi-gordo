import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { formatSafeCurrency, formatSafeNumber, toSafeNumber } from '@/utils/dateUtils';
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
      // Dados básicos do lote
      const purchaseWeight = toSafeNumber(purchase.purchaseWeight || purchase.totalWeight || 0);
      const carcassYield = toSafeNumber(purchase.carcassYield); 
      const currentQuantity = toSafeNumber(purchase.currentQuantity || purchase.initialQuantity || 0);
      
      // Calcular dias em confinamento
      const purchaseDate = new Date(purchase.purchaseDate);
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
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl font-bold">
            Análise Completa de Valor do Rebanho
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Análise detalhada considerando ganho de peso, custos de produção e valor de mercado
          </CardDescription>
        </div>
        
        {/* Seção de Parâmetros de Análise */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4" />
            PARÂMETROS DE ANÁLISE CONFIGURÁVEIS
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market-price" className="text-xs font-medium">
                Preço de Mercado (R$/@)
              </Label>
              <Input
                id="market-price"
                type="number"
                value={marketPrice}
                onChange={(e) => setMarketPrice(Number(e.target.value))}
                className="w-full"
                step="10"
              />
              <p className="text-xs text-muted-foreground">Valor atual da arroba</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gmd" className="text-xs font-medium">
                GMD (kg/dia)
              </Label>
              <Input
                id="gmd"
                type="number"
                value={averageGMD}
                onChange={(e) => setAverageGMD(Number(e.target.value))}
                className="w-full"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">Ganho médio diário</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sale-yield" className="text-xs font-medium">
                RC de Venda (%)
              </Label>
              <Input
                id="sale-yield"
                type="number"
                value={saleYield}
                onChange={(e) => setSaleYield(Number(e.target.value))}
                className="w-full"
                step="1"
              />
              <p className="text-xs text-muted-foreground">Rendimento carcaça</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cap" className="text-xs font-medium">
                CAP (R$/@)
              </Label>
              <Input
                id="cap"
                type="number"
                value={producedArrobaCost}
                onChange={(e) => setProducedArrobaCost(Number(e.target.value))}
                className="w-full"
                step="10"
              />
              <p className="text-xs text-muted-foreground">Custo/@ produzida</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalArrobas > 0 ? (
          <div className="space-y-4">
            {/* Gráfico comparativo */}
            <ChartContainer config={chartConfig} className="h-[200px]">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                  domain={[
                    (dataMin: number) => Math.floor(dataMin * 0.9), 
                    (dataMax: number) => Math.ceil(dataMax * 1.1)
                  ]}
                />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />}
                />
                <ReferenceLine 
                  y={averagePurchasePrice} 
                  stroke="hsl(221, 83%, 53%)"
                  strokeDasharray="5 5"
                  opacity={0.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="purchase" 
                  stroke="var(--color-purchase)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="market" 
                  stroke="var(--color-market)"
                  strokeWidth={2}
                  dot={false}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>

            {/* SEÇÃO 1: ANÁLISE DE CUSTOS */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">
                1. ANÁLISE DE CUSTOS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Custo de Compra */}
                <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Custo de Compra</div>
                  <div className="text-xl font-bold">{formatSafeCurrency(totalCapital)}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Inclui: compra + frete + comissão
                  </div>
                </div>
                
                {/* Custo de Produção */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Custo de Produção</div>
                  <div className="text-xl font-bold">{formatSafeCurrency(totalArrobasProduzidas * producedArrobaCost)}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatSafeNumber(totalArrobasProduzidas)} @ × R$ {producedArrobaCost.toFixed(2)}
                  </div>
                </div>
                
                {/* Capital Total */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    CAPITAL TOTAL INVESTIDO
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatSafeCurrency(allocatedCapital)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Custo médio: R$ {averagePurchasePrice.toFixed(2)}/@
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ANÁLISE DE VALOR */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">
                2. VALOR DE MERCADO ATUAL
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor de Mercado */}
                <div className={`p-4 rounded-lg border-2 ${
                  profitMargin >= 0 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      profitMargin >= 0 
                        ? 'text-emerald-700 dark:text-emerald-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>VALOR DE MERCADO</span>
                    {profitMargin >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${
                    profitMargin >= 0 
                      ? 'text-emerald-900 dark:text-emerald-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {formatSafeCurrency(marketValue)}
                  </div>
                  <div className={`text-xs mt-2 ${
                    profitMargin >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatSafeNumber(totalArrobas)} @ × R$ {marketPrice.toFixed(2)}
                  </div>
                </div>
                
                {/* Resultado */}
                <div className={`p-4 rounded-lg border-2 ${
                  profitMargin >= 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="text-xs text-muted-foreground mb-1">RESULTADO PROJETADO</div>
                  <div className={`text-2xl font-bold ${
                    profitMargin >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                  }`}>
                    {profitMargin >= 0 ? '+' : ''}{formatSafeCurrency(Math.abs(marketValue - allocatedCapital))}
                  </div>
                  <div className={`text-sm font-medium mt-2 ${
                    profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    Margem: {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: DETALHAMENTO TÉCNICO */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">
                3. DETALHAMENTO TÉCNICO
              </h3>
              
              {/* Métricas de Produção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">MÉTRICAS DE PRODUÇÃO</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total de Arrobas:</span>
                      <span className="text-lg font-bold">{formatSafeNumber(totalArrobas)} @</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Arrobas Produzidas:</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatSafeNumber(totalArrobasProduzidas)} @
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">RC Médio (Compra):</span>
                        <span className="text-xs font-medium">{averageCarcassYield.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">RC de Venda:</span>
                        <span className="text-xs font-medium">{saleYield}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">GMD Aplicado:</span>
                        <span className="text-xs font-medium">{averageGMD} kg/dia</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">VALORES UNITÁRIOS</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custo Médio Total:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        R$ {averagePurchasePrice.toFixed(2)}/@
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CAP (Custo/@ Produzida):</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        R$ {producedArrobaCost.toFixed(2)}/@
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Preço de Mercado:</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {marketPrice.toFixed(2)}/@
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Diferença:</span>
                        <span className={`text-sm font-bold ${
                          marketPrice - averagePurchasePrice >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {marketPrice - averagePurchasePrice >= 0 ? '+' : ''}
                          R$ {(marketPrice - averagePurchasePrice).toFixed(2)}/@
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Memória de Cálculo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  MEMÓRIA DE CÁLCULO COMPLETA
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-blue-800 dark:text-blue-200">Etapa 1: Cálculo de Peso</div>
                    <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                      <div>→ Peso Atual = Peso Compra + (GMD × Dias × Qtd)</div>
                      <div>→ Peso Atual = Peso Compra + ({averageGMD} × Dias × Qtd)</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-blue-800 dark:text-blue-200">Etapa 2: Conversão em Arrobas</div>
                    <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                      <div>→ Arrobas Totais = (Peso Atual × RC%) ÷ 15</div>
                      <div>→ Arrobas Produzidas = (Ganho Peso × RC%) ÷ 15</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-blue-800 dark:text-blue-200">Etapa 3: Cálculo de Custos</div>
                    <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                      <div>→ Custo Produção = Arrobas Produzidas × CAP</div>
                      <div>→ Custo Produção = {formatSafeNumber(totalArrobasProduzidas)} × R$ {producedArrobaCost.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-blue-800 dark:text-blue-200">Etapa 4: Resultado Final</div>
                    <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                      <div>→ Valor Mercado = Total Arrobas × Preço Mercado</div>
                      <div>→ Resultado = Valor Mercado - Capital Total</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">EQUAÇÃO FINAL</div>
                    <div className="font-mono text-sm font-bold text-blue-900 dark:text-blue-100">
                      {formatSafeCurrency(marketValue)} - {formatSafeCurrency(allocatedCapital)} = 
                      <span className={`ml-2 ${
                        marketValue - allocatedCapital >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {marketValue - allocatedCapital >= 0 ? '+' : ''}{formatSafeCurrency(marketValue - allocatedCapital)}
                      </span>
                    </div>
                    <div className={`text-xs mt-1 font-medium ${
                      profitMargin >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      Margem: {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Sem dados para exibir</p>
              <p className="text-xs mt-1">Registre compras de gado para visualizar o capital alocado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};