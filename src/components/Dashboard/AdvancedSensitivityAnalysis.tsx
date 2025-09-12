import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  BarChart3,
  Package,
  DollarSign,
  Scale,
  Activity,
  Percent,
  ChartBar,
  Sliders,
  ShoppingCart,
  TrendingUpIcon,
  Wallet,
  Lock,
  Unlock
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSafeCurrency, formatSafeDecimal } from '@/utils/dateUtils';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { calculateAggregateMetrics, CattlePurchaseData } from '@/utils/cattlePurchaseCalculations';

interface AdvancedSensitivityAnalysisProps {
  defaultValues?: {
    purchasePrice?: number;
    purchaseWeight?: number;
    purchaseYield?: number;
    salePrice?: number;
    saleWeight?: number;
    saleYield?: number;
    productionCost?: number;
    gmd?: number;
  };
}

export const AdvancedSensitivityAnalysis: React.FC<AdvancedSensitivityAnalysisProps> = ({
  defaultValues = {}
}) => {
  // Buscar dados reais do sistema
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  
  // Estado para o modo de análise
  const [analysisMode, setAnalysisMode] = useState<'current' | 'custom'>('current');
  
  // Valores iniciais do cenário atual
  const initialParams = {
    purchasePrice: defaultValues.purchasePrice || 280, // R$/@
    purchaseWeight: defaultValues.purchaseWeight || 400, // kg
    purchaseYield: defaultValues.purchaseYield || 50, // %
    salePrice: defaultValues.salePrice || 320, // R$/@
    saleWeight: defaultValues.saleWeight || 550, // kg
    saleYield: defaultValues.saleYield || 52, // %
    productionCost: defaultValues.productionCost || 200, // R$/@ produzida (CAP)
    gmd: defaultValues.gmd || 1.5, // GMD em kg/dia
    animalsCount: 100 // quantidade de animais
  };

  // Parâmetros base configuráveis
  const [baseParams, setBaseParams] = useState(initialParams);
  
  // Calcular métricas reais do sistema quando os dados estiverem disponíveis
  useEffect(() => {
    if (cattlePurchases && cattlePurchases.length > 0 && analysisMode === 'current') {
      const metrics = calculateAggregateMetrics(cattlePurchases as CattlePurchaseData[]);
      
      // Atualizar apenas parâmetros de compra com dados reais
      setBaseParams(prev => ({
        ...prev,
        purchasePrice: Number((metrics.averagePricePerArroba || prev.purchasePrice).toFixed(2)),
        purchaseWeight: Number((metrics.totalAnimals > 0 ? metrics.totalWeight / metrics.totalAnimals : prev.purchaseWeight).toFixed(2)),
        purchaseYield: Number((metrics.averageCarcassYield || prev.purchaseYield).toFixed(2)),
        animalsCount: metrics.currentAnimals || prev.animalsCount,
        // Manter valores de venda e produção como estão (editáveis)
        salePrice: prev.salePrice,
        saleWeight: prev.saleWeight,
        saleYield: prev.saleYield,
        productionCost: prev.productionCost,
        gmd: prev.gmd
      }));
    }
  }, [cattlePurchases, analysisMode]);

  // Variáveis selecionadas para os eixos
  const [xAxisVariable, setXAxisVariable] = useState('purchasePrice');
  const [yAxisVariable, setYAxisVariable] = useState('salePrice');

  // Configurações das variáveis disponíveis
  const variableConfig = {
    purchasePrice: { 
      label: 'Compra (R$/@)', 
      min: 230, 
      max: 330, 
      step: 10,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      format: (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    },
    salePrice: { 
      label: 'Venda (R$/@)', 
      min: 280, 
      max: 380, 
      step: 10,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      format: (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    },
    productionCost: { 
      label: 'CAP (R$/@)', 
      min: 100, 
      max: 300, 
      step: 20,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    gmd: {
      label: 'GMD (kg/dia)',
      min: 0.8,
      max: 2.0,
      step: 0.1,
      format: (v: number) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/dia`
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

  // Cálculo das métricas atuais
  const currentScenario = useMemo(() => calculateProfit(baseParams), [baseParams]);

  // Geração de ranges para os eixos - dinâmico baseado nos parâmetros atuais
  const xRange = useMemo(() => {
    const config = variableConfig[xAxisVariable as keyof typeof variableConfig];
    const currentValue = baseParams[xAxisVariable as keyof typeof baseParams];
    const values = [];
    
    // Para variáveis de preço, usar step de 5 e centralizar no valor atual
    if (xAxisVariable === 'purchasePrice' || xAxisVariable === 'salePrice' || xAxisVariable === 'productionCost') {
      const step = 5;
      const numSteps = 5; // 5 para cada lado + o centro = 11 valores
      
      for (let i = -numSteps; i <= numSteps; i++) {
        const value = currentValue + (i * step);
        // Garantir que o valor está dentro de limites razoáveis
        if (value > 0) {
          values.push(value);
        }
      }
    } else {
      // Para outras variáveis, manter o comportamento original
      for (let v = config.min; v <= config.max; v += config.step) {
        values.push(v);
      }
    }
    
    return values;
  }, [xAxisVariable, baseParams]);

  const yRange = useMemo(() => {
    const config = variableConfig[yAxisVariable as keyof typeof variableConfig];
    const currentValue = baseParams[yAxisVariable as keyof typeof baseParams];
    const values = [];
    
    // Para variáveis de preço, usar step de 5 e centralizar no valor atual
    if (yAxisVariable === 'purchasePrice' || yAxisVariable === 'salePrice' || yAxisVariable === 'productionCost') {
      const step = 5;
      const numSteps = 5; // 5 para cada lado + o centro = 11 valores
      
      for (let i = -numSteps; i <= numSteps; i++) {
        const value = currentValue + (i * step);
        // Garantir que o valor está dentro de limites razoáveis
        if (value > 0) {
          values.push(value);
        }
      }
    } else {
      // Para outras variáveis, manter o comportamento original
      for (let v = config.min; v <= config.max; v += config.step) {
        values.push(v);
      }
    }
    
    return values;
  }, [yAxisVariable, baseParams]);

  // Encontrar índices do cenário atual na matriz
  const currentIndices = useMemo(() => {
    const xValue = baseParams[xAxisVariable as keyof typeof baseParams];
    const yValue = baseParams[yAxisVariable as keyof typeof baseParams];
    
    // Encontrar o índice mais próximo no xRange
    let xIndex = 0;
    let minXDiff = Math.abs(xRange[0] - xValue);
    xRange.forEach((val, idx) => {
      const diff = Math.abs(val - xValue);
      if (diff < minXDiff) {
        minXDiff = diff;
        xIndex = idx;
      }
    });
    
    // Encontrar o índice mais próximo no yRange
    let yIndex = 0;
    let minYDiff = Math.abs(yRange[0] - yValue);
    yRange.forEach((val, idx) => {
      const diff = Math.abs(val - yValue);
      if (diff < minYDiff) {
        minYDiff = diff;
        yIndex = idx;
      }
    });
    
    return { xIndex, yIndex };
  }, [xRange, yRange, xAxisVariable, yAxisVariable, baseParams]);

  // Cálculo da matriz de sensibilidade
  const sensitivityMatrix = useMemo(() => {
    const matrix: any[][] = [];
    
    yRange.forEach(yValue => {
      const row: any[] = [];
      xRange.forEach(xValue => {
        const params = {
          ...baseParams,
          [xAxisVariable]: xValue,
          [yAxisVariable]: yValue
        };
        const result = calculateProfit(params);
        row.push({
          xValue,
          yValue,
          profit: result.profitPerAnimal,
          margin: result.margin,
          totalProfit: result.totalProfit
        });
      });
      matrix.push(row);
    });
    
    return matrix;
  }, [xRange, yRange, baseParams, xAxisVariable, yAxisVariable]);

  // Função para obter cor baseada no lucro e margem
  const getColorForProfit = (profit: number, margin: number) => {
    if (profit < -1000) return 'bg-red-600 text-white';
    if (profit < -500) return 'bg-red-500 text-white';
    if (profit < 0) return 'bg-red-400 text-white';
    if (profit < 500) return 'bg-yellow-400 text-gray-900';
    if (profit < 1000) return 'bg-green-400 text-gray-900';
    if (profit < 1500) return 'bg-green-500 text-white';
    return 'bg-green-600 text-white';
  };

  // Cálculo de margem de impacto
  const calculateImpact = (variable: string, delta: number) => {
    const modifiedParams = { ...baseParams, [variable]: baseParams[variable as keyof typeof baseParams] + delta };
    const modifiedResult = calculateProfit(modifiedParams);
    return modifiedResult.margin - currentScenario.margin;
  };

  // Identificação do melhor cenário
  const bestScenario = useMemo(() => {
    let best = { profit: -Infinity, xValue: 0, yValue: 0, result: null as any };
    
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

  // Identificação do pior cenário
  const worstScenario = useMemo(() => {
    let worst = { profit: Infinity, xValue: 0, yValue: 0, result: null as any };
    
    yRange.forEach(yValue => {
      xRange.forEach(xValue => {
        const params = {
          ...baseParams,
          [xAxisVariable]: xValue,
          [yAxisVariable]: yValue
        };
        const result = calculateProfit(params);
        if (result.profitPerAnimal < worst.profit) {
          worst = {
            profit: result.profitPerAnimal,
            xValue,
            yValue,
            result
          };
        }
      });
    });
    
    return worst;
  }, [xRange, yRange, baseParams, xAxisVariable, yAxisVariable]);

  // Função para aplicar mudança de modo
  const handleModeChange = (mode: 'current' | 'custom') => {
    setAnalysisMode(mode);
    
    if (mode === 'current' && cattlePurchases && cattlePurchases.length > 0) {
      // Aplicar dados reais do sistema
      const metrics = calculateAggregateMetrics(cattlePurchases as CattlePurchaseData[]);
      setBaseParams(prev => ({
        ...prev,
        purchasePrice: Number((metrics.averagePricePerArroba || prev.purchasePrice).toFixed(2)),
        purchaseWeight: Number((metrics.totalAnimals > 0 ? metrics.totalWeight / metrics.totalAnimals : prev.purchaseWeight).toFixed(2)),
        purchaseYield: Number((metrics.averageCarcassYield || prev.purchaseYield).toFixed(2)),
        animalsCount: metrics.currentAnimals || prev.animalsCount,
      }));
    }
  };
  
  // Função para resetar valores
  const handleReset = () => {
    if (analysisMode === 'custom') {
      // No modo custom, zera todos os valores
      setBaseParams({
        purchasePrice: 0,
        purchaseWeight: 0,
        purchaseYield: 0,
        salePrice: 0,
        saleWeight: 0,
        saleYield: 0,
        productionCost: 0,
        gmd: 0,
        animalsCount: 0
      });
    } else {
      // No modo current, restaura valores do sistema
      handleModeChange('current');
    }
  };
  
  // Determinar se um campo deve ser bloqueado
  const isFieldLocked = (field: string) => {
    if (analysisMode === 'custom') return false;
    
    // No modo current, campos de compra são bloqueados
    const lockedFields = ['purchasePrice', 'purchaseWeight', 'purchaseYield', 'animalsCount'];
    return lockedFields.includes(field);
  };

  return (
    <div className="space-y-4">
      {/* Card de Controle de Cenários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modo de Análise</CardTitle>
              <CardDescription>
                {analysisMode === 'current' 
                  ? 'Usando dados reais do sistema para compra. Ajuste apenas parâmetros de venda.'
                  : 'Personalize todos os parâmetros livremente para sua análise.'}
              </CardDescription>
            </div>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
              <Sliders className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={analysisMode === 'current' ? 'default' : 'outline'}
                onClick={() => handleModeChange('current')}
                className="flex-1"
                disabled={purchasesLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                Cenário Atual
              </Button>
              <Button 
                variant={analysisMode === 'custom' ? 'default' : 'outline'}
                onClick={() => handleModeChange('custom')}
                className="flex-1"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Personalizado
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Zerar Tudo
              </Button>
            </div>
            
            {/* Indicador de dados carregados */}
            {analysisMode === 'current' && cattlePurchases && cattlePurchases.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600">
                  Dados de {cattlePurchases.length} compras carregados automaticamente
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Parâmetros Base */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card de Parâmetros de Compra */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Parâmetros de Compra</CardTitle>
                {analysisMode === 'current' && (
                  <CardDescription className="text-xs mt-1">
                    <Lock className="h-3 w-3 inline mr-1" />
                    Dados reais do sistema (bloqueados)
                  </CardDescription>
                )}
              </div>
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-price" className="text-sm font-medium">
                  Preço de Compra
                  {isFieldLocked('purchasePrice') && (
                    <Lock className="h-3 w-3 inline ml-1 text-muted-foreground" />
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="purchase-price"
                    type="number"
                    value={baseParams.purchasePrice}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                    className="h-9"
                    step="0.01"
                    disabled={isFieldLocked('purchasePrice')}
                  />
                  <span className="text-sm text-muted-foreground">R$/@</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase-weight" className="text-sm font-medium">
                  Peso de Entrada
                  {isFieldLocked('purchaseWeight') && (
                    <Lock className="h-3 w-3 inline ml-1 text-muted-foreground" />
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="purchase-weight"
                    type="number"
                    value={baseParams.purchaseWeight}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, purchaseWeight: Number(e.target.value) }))}
                    className="h-9"
                    step="0.01"
                    disabled={isFieldLocked('purchaseWeight')}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase-yield" className="text-sm font-medium">
                  Rendimento de Carcaça
                  {isFieldLocked('purchaseYield') && (
                    <Lock className="h-3 w-3 inline ml-1 text-muted-foreground" />
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="purchase-yield"
                    type="number"
                    value={baseParams.purchaseYield}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, purchaseYield: Number(e.target.value) }))}
                    className="h-9"
                    step="0.01"
                    disabled={isFieldLocked('purchaseYield')}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Parâmetros de Venda */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Parâmetros de Venda</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <TrendingUpIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale-price" className="text-sm font-medium">
                  Preço de Venda
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sale-price"
                    type="number"
                    value={baseParams.salePrice}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                    className="h-9"
                  />
                  <span className="text-sm text-muted-foreground">R$/@</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale-weight" className="text-sm font-medium">
                  Peso de Saída
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sale-weight"
                    type="number"
                    value={baseParams.saleWeight}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, saleWeight: Number(e.target.value) }))}
                    className="h-9"
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale-yield" className="text-sm font-medium">
                  Rendimento de Carcaça
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sale-yield"
                    type="number"
                    value={baseParams.saleYield}
                    onChange={(e) => setBaseParams(prev => ({ ...prev, saleYield: Number(e.target.value) }))}
                    className="h-9"
                    step="0.5"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Parâmetros de Produção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Parâmetros de Produção</CardTitle>
              <CardDescription>
                Configure os custos de produção e informações do lote
              </CardDescription>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="production-cost" className="text-sm font-medium">
                CAP (Custo Arroba Produzida)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="production-cost"
                  type="number"
                  value={baseParams.productionCost}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, productionCost: Number(e.target.value) }))}
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
                  value={baseParams.gmd}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, gmd: Number(e.target.value) }))}
                  className="h-9"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">kg/dia</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="animals-count" className="text-sm font-medium">
                Quantidade de Animais
                {isFieldLocked('animalsCount') && (
                  <Lock className="h-3 w-3 inline ml-1 text-muted-foreground" />
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="animals-count"
                  type="number"
                  value={baseParams.animalsCount}
                  onChange={(e) => setBaseParams(prev => ({ ...prev, animalsCount: Number(e.target.value) }))}
                  className="h-9"
                  disabled={isFieldLocked('animalsCount')}
                />
                <span className="text-sm text-muted-foreground">cabeças</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Cenário Atual */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Lucro por Animal */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Lucro por Animal
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${currentScenario.profitPerAnimal >= 0 ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'} flex items-center justify-center`}>
                <DollarSign className={`h-4 w-4 ${currentScenario.profitPerAnimal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${currentScenario.profitPerAnimal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatSafeCurrency(currentScenario.profitPerAnimal)}
              </p>
              <p className="text-xs text-muted-foreground">
                Por cabeça
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Margem de Lucro */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Margem de Lucro
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${currentScenario.margin >= 0 ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-red-100 dark:bg-red-950'} flex items-center justify-center`}>
                <Percent className={`h-4 w-4 ${currentScenario.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <p className={`text-2xl font-bold ${currentScenario.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatSafeDecimal(currentScenario.margin, 1)}
                </p>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Badge variant={currentScenario.margin >= 15 ? "default" : currentScenario.margin >= 0 ? "secondary" : "destructive"} className="h-5 px-1">
                {currentScenario.margin >= 15 ? "Ótima" : currentScenario.margin >= 0 ? "Regular" : "Negativa"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Lucro Total */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Lucro Total do Lote
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {formatSafeCurrency(currentScenario.totalProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {baseParams.animalsCount} animais
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Dias de Confinamento */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Dias de Confinamento
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{currentScenario.confinementDays}</p>
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
              <p className="text-xs text-muted-foreground">
                GMD: {baseParams.gmd} kg/dia
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Configuração da Matriz */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração da Análise de Sensibilidade</CardTitle>
              <CardDescription>
                Escolha as variáveis para os eixos da matriz de sensibilidade
              </CardDescription>
            </div>
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <ChartBar className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x-axis" className="text-sm font-medium">
                Eixo Horizontal (X)
              </Label>
              <Select value={xAxisVariable} onValueChange={setXAxisVariable}>
                <SelectTrigger id="x-axis" className="h-9">
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
              <Label htmlFor="y-axis" className="text-sm font-medium">
                Eixo Vertical (Y)
              </Label>
              <Select value={yAxisVariable} onValueChange={setYAxisVariable}>
                <SelectTrigger id="y-axis" className="h-9">
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
        </CardContent>
      </Card>

      {/* Card da Matriz de Sensibilidade */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matriz de Sensibilidade</CardTitle>
              <CardDescription>
                <div className="space-y-1">
                  <div>Análise do impacto das variáveis selecionadas no lucro por animal</div>
                  <div className="text-xs">
                    <span className="font-bold">Eixo Y (↓):</span> <span className="font-medium">{variableConfig[yAxisVariable as keyof typeof variableConfig].label}</span> | 
                    <span className="font-bold"> Eixo X (→):</span> <span className="font-medium">{variableConfig[xAxisVariable as keyof typeof variableConfig].label}</span>
                  </div>
                </div>
              </CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium text-muted-foreground border-b border-r">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{variableConfig[yAxisVariable as keyof typeof variableConfig].label}</span>
                      <span>↓</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="truncate">{variableConfig[xAxisVariable as keyof typeof variableConfig].label}</span>
                      <span>→</span>
                    </div>
                  </th>
                  {xRange.map(xValue => (
                    <th key={xValue} className="p-2 text-center font-medium text-muted-foreground border-b min-w-[100px]">
                      {variableConfig[xAxisVariable as keyof typeof variableConfig].format(xValue)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sensitivityMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-b-0">
                    <td className="p-2 text-right font-medium text-muted-foreground border-r whitespace-nowrap">
                      {variableConfig[yAxisVariable as keyof typeof variableConfig].format(yRange[rowIndex])}
                    </td>
                    {row.map((cell, colIndex) => {
                      const isCurrentScenario = rowIndex === currentIndices.yIndex && colIndex === currentIndices.xIndex;
                      return (
                        <td 
                          key={colIndex}
                          className={`p-2 text-center font-semibold transition-all ${getColorForProfit(cell.profit, cell.margin)} hover:scale-105 cursor-default relative ${
                            isCurrentScenario ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''
                          }`}
                          title={`${isCurrentScenario ? 'CENÁRIO ATUAL | ' : ''}Lucro: ${formatSafeCurrency(cell.profit)} | Margem: ${cell.margin.toFixed(1)}%`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs">{formatSafeCurrency(cell.profit)}</div>
                            <div className="text-[10px] opacity-90">{cell.margin.toFixed(1)}%</div>
                          </div>
                          {isCurrentScenario && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs text-muted-foreground">Escala de Lucro:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-xs">Prejuízo Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs">Baixo Lucro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs">Lucro Bom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-xs">Lucro Ótimo</span>
                </div>
                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded relative">
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-xs font-medium text-blue-600">Cenário Atual</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Pior e Melhor Cenário */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card de Pior Cenário */}
        {worstScenario.result && (
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Pior Cenário Identificado
                  </CardTitle>
                  <CardDescription>
                    Combinação crítica das variáveis analisadas
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="bg-red-600">
                  Maior Prejuízo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].label}
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].format(worstScenario.xValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].label}
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].format(worstScenario.yValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prejuízo por Animal</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatSafeCurrency(worstScenario.profit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem</p>
                  <p className="text-lg font-bold text-red-600">
                    {worstScenario.result.margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Melhor Cenário */}
        {bestScenario.result && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Melhor Cenário Identificado
                  </CardTitle>
                  <CardDescription>
                    Combinação ótima das variáveis analisadas
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Lucro Máximo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].label}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {variableConfig[xAxisVariable as keyof typeof variableConfig].format(bestScenario.xValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].label}
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {variableConfig[yAxisVariable as keyof typeof variableConfig].format(bestScenario.yValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro por Animal</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatSafeCurrency(bestScenario.profit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem</p>
                  <p className="text-lg font-bold text-green-600">
                    {bestScenario.result.margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cards de Análise de Impacto */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card de Análise de Custos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Análise de Impacto - Custos</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preço de Compra (+R$ 10/@)</span>
              <span className={`text-sm font-medium ${calculateImpact('purchasePrice', 10) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('purchasePrice', 10) >= 0 ? '+' : ''}{calculateImpact('purchasePrice', 10).toFixed(1)}% margem
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CAP (+R$ 20/@)</span>
              <span className={`text-sm font-medium ${calculateImpact('productionCost', 20) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('productionCost', 20) >= 0 ? '+' : ''}{calculateImpact('productionCost', 20).toFixed(1)}% margem
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peso Compra (+10 kg)</span>
              <span className={`text-sm font-medium ${calculateImpact('purchaseWeight', 10) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('purchaseWeight', 10) >= 0 ? '+' : ''}{calculateImpact('purchaseWeight', 10).toFixed(1)}% margem
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card de Análise de Receitas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Análise de Impacto - Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preço de Venda (+R$ 10/@)</span>
              <span className={`text-sm font-medium ${calculateImpact('salePrice', 10) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('salePrice', 10) >= 0 ? '+' : ''}{calculateImpact('salePrice', 10).toFixed(1)}% margem
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peso Venda (+10 kg)</span>
              <span className={`text-sm font-medium ${calculateImpact('saleWeight', 10) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('saleWeight', 10) >= 0 ? '+' : ''}{calculateImpact('saleWeight', 10).toFixed(1)}% margem
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">GMD (+0.2 kg/dia)</span>
              <span className={`text-sm font-medium ${calculateImpact('gmd', 0.2) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateImpact('gmd', 0.2) >= 0 ? '+' : ''}{calculateImpact('gmd', 0.2).toFixed(1)}% margem
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};