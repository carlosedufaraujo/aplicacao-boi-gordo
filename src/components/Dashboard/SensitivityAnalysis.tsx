import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Download,
  AlertCircle
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSafeCurrency } from '@/utils/dateUtils';

interface SensitivityAnalysisProps {
  currentPurchasePrice?: number;
  currentProductionCost?: number;
  currentMarketPrice?: number;
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({
  currentPurchasePrice = 280,
  currentProductionCost = 200,
  currentMarketPrice = 320,
}) => {
  // Parâmetros configuráveis
  const [marketPrice, setMarketPrice] = useState(currentMarketPrice);
  const [entryWeight, setEntryWeight] = useState(400); // kg
  const [exitWeight, setExitWeight] = useState(550); // kg
  const [fatteningDays, setFatteningDays] = useState(100); // dias
  const [animalsCount, setAnimalsCount] = useState(100); // cabeças
  const [carcassYieldEntry, setCarcassYieldEntry] = useState(50); // %
  const [carcassYieldExit, setCarcassYieldExit] = useState(52); // %

  // Ranges para a matriz
  const purchasePriceRange = useMemo(() => {
    const base = currentPurchasePrice || 280;
    return Array.from({ length: 11 }, (_, i) => base - 50 + (i * 10));
  }, [currentPurchasePrice]);

  const productionCostRange = useMemo(() => {
    const base = currentProductionCost || 200;
    return Array.from({ length: 11 }, (_, i) => base - 100 + (i * 20));
  }, [currentProductionCost]);

  // Cálculo do resultado financeiro
  const calculateProfit = (purchasePrice: number, productionCost: number) => {
    // Arrobas de entrada
    const entryArrobas = (entryWeight * (carcassYieldEntry / 100)) / 15;
    
    // Arrobas de saída
    const exitArrobas = (exitWeight * (carcassYieldExit / 100)) / 15;
    
    // Arrobas produzidas
    const producedArrobas = exitArrobas - entryArrobas;
    
    // Custos
    const purchaseCost = entryArrobas * purchasePrice;
    const producedCost = producedArrobas * productionCost;
    const totalCost = purchaseCost + producedCost;
    
    // Receita
    const revenue = exitArrobas * marketPrice;
    
    // Lucro por animal
    const profitPerAnimal = revenue - totalCost;
    
    // Lucro total do lote
    const totalProfit = profitPerAnimal * animalsCount;
    
    // Margem percentual
    const margin = totalCost > 0 ? ((profitPerAnimal / totalCost) * 100) : 0;
    
    return {
      profitPerAnimal,
      totalProfit,
      margin,
      revenue,
      totalCost
    };
  };

  // Gerar matriz de sensibilidade
  const sensitivityMatrix = useMemo(() => {
    return productionCostRange.map(prodCost => {
      return purchasePriceRange.map(purchPrice => {
        return calculateProfit(purchPrice, prodCost);
      });
    });
  }, [purchasePriceRange, productionCostRange, marketPrice, entryWeight, exitWeight, carcassYieldEntry, carcassYieldExit, animalsCount]);

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
    const normalized = (profit - minProfit) / range;
    
    if (profit < 0) {
      // Prejuízo - tons de vermelho
      const intensity = Math.abs(profit / minProfit);
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`;
    } else if (profit === 0) {
      // Break-even - amarelo
      return 'rgba(251, 191, 36, 0.5)';
    } else if (normalized < 0.3) {
      // Lucro baixo - amarelo para verde claro
      return `rgba(251, 191, 36, ${0.3 + normalized})`;
    } else if (normalized < 0.6) {
      // Lucro médio - verde claro
      return `rgba(134, 239, 172, ${0.5 + normalized * 0.3})`;
    } else {
      // Lucro alto - verde escuro
      return `rgba(34, 197, 94, ${0.4 + normalized * 0.4})`;
    }
  };

  // Identificar cenário atual
  const currentScenario = useMemo(() => {
    return calculateProfit(currentPurchasePrice, currentProductionCost);
  }, [currentPurchasePrice, currentProductionCost, marketPrice, entryWeight, exitWeight, carcassYieldEntry, carcassYieldExit, animalsCount]);

  // Encontrar cenário ótimo
  const optimalScenario = useMemo(() => {
    let best = { profit: -Infinity, purchasePrice: 0, productionCost: 0 };
    
    productionCostRange.forEach(prodCost => {
      purchasePriceRange.forEach(purchPrice => {
        const result = calculateProfit(purchPrice, prodCost);
        if (result.profitPerAnimal > best.profit) {
          best = {
            profit: result.profitPerAnimal,
            purchasePrice: purchPrice,
            productionCost: prodCost
          };
        }
      });
    });
    
    return best;
  }, [purchasePriceRange, productionCostRange, marketPrice, entryWeight, exitWeight, carcassYieldEntry, carcassYieldExit, animalsCount]);

  // Encontrar ponto de equilíbrio
  const breakEvenPoint = useMemo(() => {
    let closestToZero = { diff: Infinity, purchasePrice: 0, productionCost: 0 };
    
    productionCostRange.forEach(prodCost => {
      purchasePriceRange.forEach(purchPrice => {
        const result = calculateProfit(purchPrice, prodCost);
        const diff = Math.abs(result.profitPerAnimal);
        if (diff < closestToZero.diff) {
          closestToZero = {
            diff,
            purchasePrice: purchPrice,
            productionCost: prodCost
          };
        }
      });
    });
    
    return closestToZero;
  }, [purchasePriceRange, productionCostRange, marketPrice, entryWeight, exitWeight, carcassYieldEntry, carcassYieldExit, animalsCount]);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl font-bold">
            Análise de Sensibilidade - Matriz de Lucratividade
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Avalie o impacto de diferentes combinações de custos na lucratividade da operação
          </CardDescription>
        </div>

        {/* Parâmetros Configuráveis */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4" />
            PARÂMETROS DA ANÁLISE
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market-price-sens" className="text-xs font-medium">
                Preço Venda (R$/@)
              </Label>
              <Input
                id="market-price-sens"
                type="number"
                value={marketPrice}
                onChange={(e) => setMarketPrice(Number(e.target.value))}
                className="w-full"
                step="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entry-weight" className="text-xs font-medium">
                Peso Entrada (kg)
              </Label>
              <Input
                id="entry-weight"
                type="number"
                value={entryWeight}
                onChange={(e) => setEntryWeight(Number(e.target.value))}
                className="w-full"
                step="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exit-weight" className="text-xs font-medium">
                Peso Saída (kg)
              </Label>
              <Input
                id="exit-weight"
                type="number"
                value={exitWeight}
                onChange={(e) => setExitWeight(Number(e.target.value))}
                className="w-full"
                step="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fattening-days" className="text-xs font-medium">
                Dias Engorda
              </Label>
              <Input
                id="fattening-days"
                type="number"
                value={fatteningDays}
                onChange={(e) => setFatteningDays(Number(e.target.value))}
                className="w-full"
                step="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yield-entry" className="text-xs font-medium">
                RC Entrada (%)
              </Label>
              <Input
                id="yield-entry"
                type="number"
                value={carcassYieldEntry}
                onChange={(e) => setCarcassYieldEntry(Number(e.target.value))}
                className="w-full"
                step="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yield-exit" className="text-xs font-medium">
                RC Saída (%)
              </Label>
              <Input
                id="yield-exit"
                type="number"
                value={carcassYieldExit}
                onChange={(e) => setCarcassYieldExit(Number(e.target.value))}
                className="w-full"
                step="1"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Matriz de Sensibilidade */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                MATRIZ DE LUCRATIVIDADE POR ANIMAL
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Eixo X: Custo de Compra (@) | Eixo Y: Custo de Produção (@)
              </p>
            </div>

            <div className="relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-medium text-muted-foreground border">
                      Prod\Compra
                    </th>
                    {purchasePriceRange.map(price => (
                      <th key={price} className="p-2 text-xs font-medium border">
                        R$ {price}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productionCostRange.map((prodCost, rowIndex) => (
                    <tr key={prodCost}>
                      <td className="p-2 text-xs font-medium border">
                        R$ {prodCost}
                      </td>
                      {purchasePriceRange.map((purchPrice, colIndex) => {
                        const result = sensitivityMatrix[rowIndex][colIndex];
                        const isCurrentScenario = 
                          Math.abs(purchPrice - currentPurchasePrice) < 5 && 
                          Math.abs(prodCost - currentProductionCost) < 10;
                        
                        return (
                          <TooltipProvider key={`${prodCost}-${purchPrice}`}>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <td 
                                  className={`p-2 text-center border cursor-pointer transition-all hover:scale-105 ${
                                    isCurrentScenario ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: getColorForProfit(result.profitPerAnimal),
                                    color: result.profitPerAnimal > 0 ? 'black' : 'white'
                                  }}
                                >
                                  <div className="text-xs font-bold">
                                    {result.profitPerAnimal >= 0 ? '+' : ''}
                                    {result.profitPerAnimal.toFixed(0)}
                                  </div>
                                  <div className="text-[10px] opacity-75">
                                    {result.margin.toFixed(0)}%
                                  </div>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1 p-1">
                                  <p className="text-xs font-semibold">Detalhes do Cenário</p>
                                  <p className="text-xs">Custo Compra: R$ {purchPrice}/@</p>
                                  <p className="text-xs">Custo Produção: R$ {prodCost}/@</p>
                                  <p className="text-xs">Lucro/Animal: {formatSafeCurrency(result.profitPerAnimal)}</p>
                                  <p className="text-xs">Lucro Total ({animalsCount} cab): {formatSafeCurrency(result.totalProfit)}</p>
                                  <p className="text-xs">Margem: {result.margin.toFixed(1)}%</p>
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
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}></div>
                  <span className="text-xs">Prejuízo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.5)' }}></div>
                  <span className="text-xs">Equilíbrio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(134, 239, 172, 0.6)' }}></div>
                  <span className="text-xs">Lucro Médio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }}></div>
                  <span className="text-xs">Lucro Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-blue-600"></div>
                  <span className="text-xs">Cenário Atual</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo da Análise */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cenário Atual */}
          <div className={`p-4 rounded-lg border-2 ${
            currentScenario.profitPerAnimal >= 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">CENÁRIO ATUAL</span>
              {currentScenario.profitPerAnimal >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold">
                {formatSafeCurrency(currentScenario.profitPerAnimal)}/cab
              </div>
              <div className="text-xs text-muted-foreground">
                Total Lote: {formatSafeCurrency(currentScenario.totalProfit)}
              </div>
              <div className="text-xs">
                Margem: {currentScenario.margin.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Cenário Ótimo */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">CENÁRIO ÓTIMO</span>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {formatSafeCurrency(optimalScenario.profit)}/cab
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Compra: R$ {optimalScenario.purchasePrice}/@
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Produção: R$ {optimalScenario.productionCost}/@
              </div>
            </div>
          </div>

          {/* Ponto de Equilíbrio */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PONTO EQUILÍBRIO</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Break-even
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Compra: R$ {breakEvenPoint.purchasePrice}/@
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Produção: R$ {breakEvenPoint.productionCost}/@
              </div>
            </div>
          </div>
        </div>

        {/* Análise Detalhada */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">ANÁLISE DETALHADA</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ganho de Peso por Animal:</span>
                <span className="font-medium">{exitWeight - entryWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GMD (Ganho Médio Diário):</span>
                <span className="font-medium">{((exitWeight - entryWeight) / fatteningDays).toFixed(2)} kg/dia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrobas Produzidas/Animal:</span>
                <span className="font-medium">
                  {(((exitWeight * carcassYieldExit / 100) - (entryWeight * carcassYieldEntry / 100)) / 15).toFixed(2)} @
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem de Segurança:</span>
                <span className={`font-medium ${
                  currentScenario.profitPerAnimal > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentScenario.profitPerAnimal > 0 
                    ? `R$ ${Math.abs(currentScenario.profitPerAnimal - breakEvenPoint.diff).toFixed(2)}/cab`
                    : 'Abaixo do ponto de equilíbrio'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Potencial de Melhoria:</span>
                <span className="font-medium text-blue-600">
                  R$ {(optimalScenario.profit - currentScenario.profitPerAnimal).toFixed(2)}/cab
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impacto Total no Lote:</span>
                <span className="font-medium text-blue-600">
                  {formatSafeCurrency((optimalScenario.profit - currentScenario.profitPerAnimal) * animalsCount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};