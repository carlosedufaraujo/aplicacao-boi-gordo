import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";

export const PurchaseByStateChart: React.FC = () => {
  const { cattlePurchases } = useAppStore();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [drillDownLevel, setDrillDownLevel] = useState<'state' | 'details'>('state');

  // Agrupar compras por estado
  const data = React.useMemo(() => {
    const stateMap = new Map<string, { currentQuantity: number, value: number }>();
    
    cattlePurchases.forEach(order => {
      const state = order.state;
      const current = stateMap.get(state) || { currentQuantity: 0, value: 0 };
      
      stateMap.set(state, {
        currentQuantity: current.currentQuantity + order.currentQuantity,
        value: current.value + ((order.totalWeight / 15) * order.pricePerArroba)
      });
    });
    
    // Converter para array e ordenar por quantidade
    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        currentQuantity: data.currentQuantity,
        value: data.value
      }))
      .sort((a, b) => b.currentQuantity - a.currentQuantity);
  }, [cattlePurchases]);

  // Usar dados reais ou array vazio
  const chartData = data;

  // Dados detalhados para drill-down
  const detailData = React.useMemo(() => {
    if (!selectedState) return [];
    
    return cattlePurchases
      .filter(order => order.state === selectedState)
      .map(order => ({
        id: order.id,
        broker: order.brokerId || 'Direto',
        currentQuantity: order.currentQuantity,
        value: (order.totalWeight / 15) * order.pricePerArroba,
        date: order.date
      }))
      .slice(0, 10); // Limitar a 10 itens
  }, [cattlePurchases, selectedState]);

  const chartConfig = {
    currentQuantity: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Função para drill-down
  const handleBarClick = (data: any) => {
    if (drillDownLevel === 'state') {
      setSelectedState(data.state);
      setDrillDownLevel('details');
    }
  };

  // Função para voltar
  const handleBack = () => {
    setSelectedState(null);
    setDrillDownLevel('state');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {drillDownLevel === 'details' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="p-1 h-6 w-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {drillDownLevel === 'state' ? 'Compra de Animais por Estado' : `Detalhes - ${selectedState}`}
            </CardTitle>
            <CardDescription>
              {drillDownLevel === 'state' 
                ? 'Distribuição das compras de gado por estado de origem (clique para detalhar)'
                : `Ordens de compra detalhadas para ${selectedState}`
              }
            </CardDescription>
          </div>
          
          {drillDownLevel === 'state' && (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {drillDownLevel === 'state' ? (
          // Vista principal por estados
          chartData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }} onClick={handleBarClick}>
                <CartesianGrid horizontal={false} />
                <XAxis 
                  type="number" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  dataKey="state" 
                  type="category" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value: number, name, props) => [
                      `${value} animais`,
                      chartConfig[name as keyof typeof chartConfig]?.label || name
                    ]}
                    labelFormatter={(label) => `Estado: ${label} (clique para detalhar)`}
                  />}
                />
                <Bar 
                  dataKey="currentQuantity" 
                  fill="var(--color-currentQuantity)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1200}
                  animationBegin={200}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-neutral-400">
              <div className="text-center">
                <p className="text-sm">Sem dados para exibir</p>
                <p className="text-xs mt-1">Registre ordens de compra para visualizar por estado</p>
              </div>
            </div>
          )
        ) : (
          // Vista detalhada
          <div className="space-y-4">
            {detailData.length > 0 ? (
              <div className="space-y-2">
                {detailData.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards'
                    }}
                  >
                    <div>
                      <div className="font-medium">Ordem #{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        Corretor: {order.broker} • {order.currentQuantity} animais
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        R$ {order.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-neutral-400">
                <div className="text-center">
                  <p className="text-sm">Nenhuma ordem encontrada</p>
                  <p className="text-xs mt-1">para o estado {selectedState}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {drillDownLevel === 'state' && (
          <div className="mt-4 text-center">
            <div className="text-lg font-bold">
              {chartData.reduce((sum, item) => sum + item.currentQuantity, 0)} animais
            </div>
            <div className="text-sm text-muted-foreground">
              Total de animais comprados
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};