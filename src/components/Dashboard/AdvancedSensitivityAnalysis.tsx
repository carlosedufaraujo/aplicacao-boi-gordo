import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Download,
  AlertCircle,
  Calculator,
  Settings,
  RefreshCw
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSafeCurrency } from '@/utils/dateUtils';

interface AdvancedSensitivityAnalysisProps {
  defaultValues?: {
    purchasePrice?: number;
    purchaseWeight?: number;
    purchaseYield?: number;
    salePrice?: number;
    saleWeight?: number;
    saleYield?: number;
    productionCost?: number;
  };
}

export const AdvancedSensitivityAnalysis: React.FC<AdvancedSensitivityAnalysisProps> = ({
  defaultValues = {}
}) => {
  // Parâmetros base configuráveis
  const [baseParams, setBaseParams] = useState({
    purchasePrice: defaultValues.purchasePrice || 280, // R$/@
    purchaseWeight: defaultValues.purchaseWeight || 400, // kg
    purchaseYield: defaultValues.purchaseYield || 50, // %
    salePrice: defaultValues.salePrice || 320, // R$/@
    saleWeight: defaultValues.saleWeight || 550, // kg
    saleYield: defaultValues.saleYield || 52, // %
    productionCost: defaultValues.productionCost || 200, // R$/@ produzida (CAP)
    gmd: defaultValues.gmd || 1.5, // GMD em kg/dia
    animalsCount: 100 // quantidade de animais
  });

  // Variáveis selecionadas para os eixos
  const [xAxisVariable, setXAxisVariable] = useState('purchasePrice');
  const [yAxisVariable, setYAxisVariable] = useState('productionCost');

  // Configurações das variáveis disponíveis
  const variableConfig = {
    purchasePrice: { 
      label: 'Preço Compra (R$/@)', 
      min: 230, 
      max: 330, 
      step: 10,
      format: (v: number) => `R$ ${v}`
    },
    purchaseWeight: { 
      label: 'Peso Compra (kg)', 
      min: 350, 
      max: 450, 
      step: 10,
      format: (v: number) => `${v} kg`
    },
    purchaseYield: { 
      label: 'RC Compra (%)', 
      min: 48, 
      max: 52, 
      step: 0.5,
      format: (v: number) => `${v}%`
    },
    salePrice: { 
      label: 'Preço Venda (R$/@)', 
      min: 280, 
      max: 380, 
      step: 10,
      format: (v: number) => `R$ ${v}`
    },
    saleWeight: { 
      label: 'Peso Venda (kg)', 
      min: 500, 
      max: 600, 
      step: 10,
      format: (v: number) => `${v} kg`
    },
    saleYield: { 
      label: 'RC Venda (%)', 
      min: 50, 
      max: 54, 
      step: 0.5,
      format: (v: number) => `${v}%`
    },
    productionCost: { 
      label: 'CAP (R$/@)', 
      min: 100, 
      max: 300, 
      step: 20,
      format: (v: number) => `R$ ${v}`
    },
    gmd: {
      label: 'GMD (kg/dia)',
      min: 0.8,
      max: 2.0,
      step: 0.1,
      format: (v: number) => `${v} kg/dia`
    }
  };

  // Cálculo correto do resultado financeiro
  const calculateProfit = (params: any) => {
    // Arrobas na compra
    const purchaseArrobas = (params.purchaseWeight * (params.purchaseYield / 100)) / 15;
    
    // Arrobas na venda
    const saleArrobas = (params.saleWeight * (params.saleYield / 100)) / 15;
    
    // Arrobas produzidas no confinamento
    const producedArrobas = saleArrobas - purchaseArrobas;
    
    // Custos
    const purchaseCost = purchaseArrobas * params.purchasePrice;
    const productionCostTotal = producedArrobas * params.productionCost;
    const totalCost = purchaseCost + productionCostTotal;
    
    // Receita
    const revenue = saleArrobas * params.salePrice;
    
    // Resultado
    const profitPerAnimal = revenue - totalCost;
    const totalProfit = profitPerAnimal * params.animalsCount;
    const margin = totalCost > 0 ? (profitPerAnimal / totalCost) * 100 : 0;
    
    // Cálculo de dias de confinamento baseado no GMD
    const weightGain = params.saleWeight - params.purchaseWeight;
    const confinementDays = params.gmd > 0 ? Math.round(weightGain / params.gmd) : 0;
    
    return {
      profitPerAnimal,
      totalProfit,
      margin,
      revenue,
      totalCost,
      purchaseArrobas,
      saleArrobas,
      producedArrobas,
      purchaseCost,
      productionCostTotal,
      weightGain,
      gmd: params.gmd,
      confinementDays
    };
  };

  // Gerar ranges dinâmicos baseados nas variáveis selecionadas
  const generateRange = (variable: string) => {
    const config = variableConfig[variable as keyof typeof variableConfig];
    const range = [];
    for (let i = config.min; i <= config.max; i += config.step) {
      range.push(i);
    }
    return range;
  };

  const xRange = useMemo(() => generateRange(xAxisVariable), [xAxisVariable]);
  const yRange = useMemo(() => generateRange(yAxisVariable), [yAxisVariable]);

  // Gerar matriz de sensibilidade
  const sensitivityMatrix = useMemo(() => {
    return yRange.map(yValue => {
      return xRange.map(xValue => {
        const params = {
          ...baseParams,
          [xAxisVariable]: xValue,
          [yAxisVariable]: yValue
        };
        return calculateProfit(params);
      });
    });
  }, [xRange, yRange, baseParams, xAxisVariable, yAxisVariable]);

  // Encontrar valores mínimos e máximos para a escala de cores
  const { minProfit, maxProfit } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    
    sensitivityMatrix.forEach(row => {
      row.forEach(cell => {
        if (cell.profitPerAnimal < min) min = cell.profitPerAnimal;
        if (cell.profitPerAnimal > max) max = cell.profitPerAnimal;
      });
    });
    
    return { minProfit: min, maxProfit: max };
  }, [sensitivityMatrix]);

  // Função para obter a cor baseada no lucro
  const getColorForProfit = (profit: number) => {
    const range = maxProfit - minProfit;
    if (range === 0) return 'rgba(134, 239, 172, 0.5)';
    
    const normalized = (profit - minProfit) / range;
    
    if (profit < -500) {
      return 'rgba(220, 38, 38, 0.8)'; // Vermelho forte
    } else if (profit < 0) {
      return 'rgba(239, 68, 68, 0.6)'; // Vermelho médio
    } else if (profit < 200) {
      return 'rgba(251, 191, 36, 0.5)'; // Amarelo
    } else if (profit < 500) {
      return 'rgba(134, 239, 172, 0.5)'; // Verde claro
    } else if (profit < 1000) {
      return 'rgba(74, 222, 128, 0.6)'; // Verde médio
    } else {
      return 'rgba(34, 197, 94, 0.7)'; // Verde escuro
    }
  };

  // Calcular cenário atual
  const currentScenario = useMemo(() => {
    return calculateProfit(baseParams);
  }, [baseParams]);

  // Encontrar cenário ótimo
  const optimalScenario = useMemo(() => {
    let best = { 
      profit: -Infinity, 
      xValue: 0, 
      yValue: 0,
      result: null as any
    };
    
    yRange.forEach(yValue => {
      xRange.forEach(xValue => {
        const params = {
          ...baseParams,
          [xAxisVariable]: xValue,
          [yAxisVariable]: yValue
        };
        const result = calculateProfit(params);
        if (result.profitPerAnimal > best.profit) {
          best = {
            profit: result.profitPerAnimal,
            xValue,
            yValue,
            result
          };
        }
      });
    });
    
    return best;
  }, [xRange, yRange, baseParams, xAxisVariable, yAxisVariable]);

  // Cenários pré-definidos
  const applyScenario = (scenario: string) => {
    switch(scenario) {
      case 'high-market':
        setBaseParams(prev => ({
          ...prev,
          salePrice: prev.salePrice * 1.2,
          purchasePrice: prev.purchasePrice * 1.1
        }));
        break;
      case 'drought':
        setBaseParams(prev => ({
          ...prev,
          productionCost: prev.productionCost * 1.3,
          saleWeight: prev.saleWeight * 0.95
        }));
        break;
      case 'favorable':
        setBaseParams(prev => ({
          ...prev,
          purchasePrice: prev.purchasePrice * 0.9,
          salePrice: prev.salePrice * 1.1,
          productionCost: prev.productionCost * 0.95
        }));
        break;
      case 'reset':
        setBaseParams({
          purchasePrice: defaultValues.purchasePrice || 280,
          purchaseWeight: defaultValues.purchaseWeight || 400,
          purchaseYield: defaultValues.purchaseYield || 50,
          salePrice: defaultValues.salePrice || 320,
          saleWeight: defaultValues.saleWeight || 550,
          saleYield: defaultValues.saleYield || 52,
          productionCost: defaultValues.productionCost || 200,
          gmd: defaultValues.gmd || 1.5,
          animalsCount: 100
        });
        break;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Análise Avançada de Sensibilidade
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Análise completa com cálculos corretos de custo de produção e lucratividade
          </CardDescription>
        </div>

        {/* Parâmetros Base */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Settings className="h-4 w-4" />
              PARÂMETROS BASE
            </h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => applyScenario('high-market')}
              >
                Mercado Alta
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => applyScenario('drought')}
              >
                Seca
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => applyScenario('favorable')}
              >
                Favorável
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => applyScenario('reset')}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Resetar
              </Button>
            </div>
          </div>
          
          {/* Linha 1: Dados de Compra */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">COMPRA</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="purchase-price" className="text-xs">Preço (R$/@)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  value={baseParams.purchasePrice}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="purchase-weight" className="text-xs">Peso (kg)</Label>
                <Input
                  id="purchase-weight"
                  type="number"
                  value={baseParams.purchaseWeight}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, purchaseWeight: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="purchase-yield" className="text-xs">RC (%)</Label>
                <Input
                  id="purchase-yield"
                  type="number"
                  value={baseParams.purchaseYield}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, purchaseYield: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Linha 2: Dados de Venda */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">VENDA</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sale-price" className="text-xs">Preço (R$/@)</Label>
                <Input
                  id="sale-price"
                  type="number"
                  value={baseParams.salePrice}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sale-weight" className="text-xs">Peso (kg)</Label>
                <Input
                  id="sale-weight"
                  type="number"
                  value={baseParams.saleWeight}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, saleWeight: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sale-yield" className="text-xs">RC (%)</Label>
                <Input
                  id="sale-yield"
                  type="number"
                  value={baseParams.saleYield}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, saleYield: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Linha 3: Produção e Lote */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">PRODUÇÃO</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="production-cost" className="text-xs">CAP (R$/@)</Label>
                <Input
                  id="production-cost"
                  type="number"
                  value={baseParams.productionCost}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, productionCost: Number(e.target.value) }))}
                  className="h-8 text-sm"
                  step="10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gmd" className="text-xs">GMD (kg/dia)</Label>
                <Input
                  id="gmd"
                  type="number"
                  value={baseParams.gmd}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, gmd: Number(e.target.value) }))}
                  className="h-8 text-sm"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="animals-count" className="text-xs">Qtd Animais</Label>
                <Input
                  id="animals-count"
                  type="number"
                  value={baseParams.animalsCount}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, animalsCount: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seletores de Variáveis */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            ESCOLHA AS VARIÁVEIS PARA ANÁLISE
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x-axis" className="text-xs font-medium">
                Eixo Horizontal (X)
              </Label>
              <Select value={xAxisVariable} onValueChange={setXAxisVariable}>
                <SelectTrigger id="x-axis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(variableConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} disabled={key === yAxisVariable}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="y-axis" className="text-xs font-medium">
                Eixo Vertical (Y)
              </Label>
              <Select value={yAxisVariable} onValueChange={setYAxisVariable}>
                <SelectTrigger id="y-axis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(variableConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} disabled={key === xAxisVariable}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resumo do Cenário Base */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">@ Compradas</div>
            <div className="text-lg font-bold">{currentScenario.purchaseArrobas.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              {baseParams.purchaseWeight}kg × {baseParams.purchaseYield}%
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">@ Produzidas</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {currentScenario.producedArrobas.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentScenario.confinementDays} dias × {currentScenario.gmd} kg/dia
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">@ Vendidas</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {currentScenario.saleArrobas.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {baseParams.saleWeight}kg × {baseParams.saleYield}%
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            currentScenario.profitPerAnimal >= 0 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="text-xs text-muted-foreground mb-1">Lucro/Animal</div>
            <div className={`text-lg font-bold ${
              currentScenario.profitPerAnimal >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatSafeCurrency(currentScenario.profitPerAnimal)}
            </div>
            <div className="text-xs text-muted-foreground">
              Margem: {currentScenario.margin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Matriz de Sensibilidade */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                MATRIZ DE SENSIBILIDADE - LUCRO POR ANIMAL
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                X: {variableConfig[xAxisVariable as keyof typeof variableConfig].label} | 
                Y: {variableConfig[yAxisVariable as keyof typeof variableConfig].label}
              </p>
            </div>

            <div className="relative">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-medium text-muted-foreground border bg-gray-50 dark:bg-gray-900">
                      Y \ X
                    </th>
                    {xRange.map(xValue => (
                      <th key={xValue} className="p-2 text-xs font-medium border bg-gray-50 dark:bg-gray-900">
                        {variableConfig[xAxisVariable as keyof typeof variableConfig].format(xValue)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yRange.map((yValue, rowIndex) => (
                    <tr key={yValue}>
                      <td className="p-2 text-xs font-medium border bg-gray-50 dark:bg-gray-900">
                        {variableConfig[yAxisVariable as keyof typeof variableConfig].format(yValue)}
                      </td>
                      {xRange.map((xValue, colIndex) => {
                        const result = sensitivityMatrix[rowIndex][colIndex];
                        const isCurrentScenario = 
                          Math.abs(xValue - baseParams[xAxisVariable as keyof typeof baseParams]) < 0.01 && 
                          Math.abs(yValue - baseParams[yAxisVariable as keyof typeof baseParams]) < 0.01;
                        
                        return (
                          <TooltipProvider key={`${yValue}-${xValue}`}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <td 
                                  className={`p-2 text-center border cursor-pointer transition-all hover:scale-105 ${
                                    isCurrentScenario ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: getColorForProfit(result.profitPerAnimal),
                                    color: result.profitPerAnimal > 200 ? 'black' : 'white'
                                  }}
                                >
                                  <div className="font-bold">
                                    {result.profitPerAnimal >= 0 ? '+' : ''}
                                    {result.profitPerAnimal.toFixed(0)}
                                  </div>
                                  <div className="text-[10px] opacity-75">
                                    {result.margin.toFixed(0)}%
                                  </div>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2 p-1">
                                  <p className="text-xs font-semibold">Detalhes do Cenário</p>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                    <div>@ Compradas: {result.purchaseArrobas.toFixed(2)}</div>
                                    <div>@ Produzidas: {result.producedArrobas.toFixed(2)}</div>
                                    <div>@ Vendidas: {result.saleArrobas.toFixed(2)}</div>
                                    <div>Dias Confinamento: {result.confinementDays}</div>
                                    <div>GMD: {result.gmd.toFixed(2)} kg/dia</div>
                                    <div>Ganho Total: {result.weightGain} kg</div>
                                  </div>
                                  <div className="border-t pt-1 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Custo Compra:</span>
                                      <span className="font-medium">{formatSafeCurrency(result.purchaseCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Custo Produção:</span>
                                      <span className="font-medium">{formatSafeCurrency(result.productionCostTotal)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t pt-1">
                                      <span>Lucro/Animal:</span>
                                      <span>{formatSafeCurrency(result.profitPerAnimal)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>Lote ({baseParams.animalsCount}):</span>
                                      <span>{formatSafeCurrency(result.totalProfit)}</span>
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legenda */}
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(220, 38, 38, 0.8)' }}></div>
                  <span className="text-xs">Prejuízo Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.5)' }}></div>
                  <span className="text-xs">Baixo Lucro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(74, 222, 128, 0.6)' }}></div>
                  <span className="text-xs">Lucro Médio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }}></div>
                  <span className="text-xs">Lucro Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-blue-600"></div>
                  <span className="text-xs font-medium">Cenário Atual</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Análise de Cenários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cenário Ótimo */}
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                CENÁRIO ÓTIMO IDENTIFICADO
              </span>
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {formatSafeCurrency(optimalScenario.profit)}/animal
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].label}:
                  </span>
                  <span className="font-medium text-emerald-900 dark:text-emerald-100">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].format(optimalScenario.xValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-300">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].label}:
                  </span>
                  <span className="font-medium text-emerald-900 dark:text-emerald-100">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].format(optimalScenario.yValue)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-300 dark:border-emerald-700">
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Potencial de melhoria: {formatSafeCurrency(optimalScenario.profit - currentScenario.profitPerAnimal)}/animal
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Impacto no lote: {formatSafeCurrency((optimalScenario.profit - currentScenario.profitPerAnimal) * baseParams.animalsCount)}
                </div>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                MEMÓRIA DE CÁLCULO
              </span>
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="font-medium text-blue-900 dark:text-blue-100">1. Dias de Confinamento</div>
                <div className="text-blue-700 dark:text-blue-300 pl-2">
                  = (Peso Saída - Peso Entrada) ÷ GMD
                </div>
                <div className="text-blue-600 dark:text-blue-400 pl-2">
                  = ({baseParams.saleWeight} - {baseParams.purchaseWeight}) ÷ {baseParams.gmd} = {currentScenario.confinementDays} dias
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium text-blue-900 dark:text-blue-100">2. Arrobas Compradas</div>
                <div className="text-blue-700 dark:text-blue-300 pl-2">
                  = (Peso Compra × RC%) ÷ 15
                </div>
                <div className="text-blue-600 dark:text-blue-400 pl-2">
                  = ({baseParams.purchaseWeight} × {baseParams.purchaseYield}%) ÷ 15 = {currentScenario.purchaseArrobas.toFixed(2)} @
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium text-blue-900 dark:text-blue-100">3. Arrobas Produzidas</div>
                <div className="text-blue-700 dark:text-blue-300 pl-2">
                  = @ Vendidas - @ Compradas
                </div>
                <div className="text-blue-600 dark:text-blue-400 pl-2">
                  = {currentScenario.saleArrobas.toFixed(2)} - {currentScenario.purchaseArrobas.toFixed(2)} = {currentScenario.producedArrobas.toFixed(2)} @
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium text-blue-900 dark:text-blue-100">4. Custos</div>
                <div className="text-blue-700 dark:text-blue-300 pl-2">
                  Compra = @ Compradas × Preço
                </div>
                <div className="text-blue-600 dark:text-blue-400 pl-2">
                  = {currentScenario.purchaseArrobas.toFixed(2)} × R$ {baseParams.purchasePrice} = {formatSafeCurrency(currentScenario.purchaseCost)}
                </div>
                <div className="text-blue-700 dark:text-blue-300 pl-2">
                  Produção = @ Produzidas × CAP
                </div>
                <div className="text-blue-600 dark:text-blue-400 pl-2">
                  = {currentScenario.producedArrobas.toFixed(2)} × R$ {baseParams.productionCost} = {formatSafeCurrency(currentScenario.productionCostTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};