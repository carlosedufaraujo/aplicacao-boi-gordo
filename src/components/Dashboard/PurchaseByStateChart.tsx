import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { formatSafeCurrency, formatSafeNumber } from '@/utils/dateUtils';

export const PurchaseByStateChart: React.FC = () => {
  // Buscar compras de gado do sistema
  const { cattlePurchases, loading } = useCattlePurchasesApi();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [drillDownLevel, setDrillDownLevel] = useState<'state' | 'details'>('state');

  // Agrupar compras por estado
  const data = React.useMemo(() => {
    if (!cattlePurchases || cattlePurchases.length === 0) {
      return [];
    }

    const stateMap = new Map<string, { 
      quantity: number, 
      value: number,
      lotCount: number 
    }>();
    
    cattlePurchases.forEach(purchase => {
      const state = purchase.state || 'N/A';
      const current = stateMap.get(state) || { quantity: 0, value: 0, lotCount: 0 };
      
      const quantity = Number(purchase.currentQuantity || purchase.initialQuantity || 0);
      const value = Number(purchase.purchaseValue || purchase.totalValue || 0);
      
      stateMap.set(state, {
        quantity: current.quantity + quantity,
        value: current.value + value,
        lotCount: current.lotCount + 1
      });
    });
    
    // Converter para array e ordenar por quantidade
    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        quantity: data.quantity,
        value: data.value,
        lotCount: data.lotCount
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10 estados
  }, [cattlePurchases]);

  // Dados detalhados para drill-down
  const detailData = React.useMemo(() => {
    if (!selectedState || !cattlePurchases) return [];
    
    return cattlePurchases
      .filter(purchase => purchase.state === selectedState)
      .map(purchase => ({
        id: purchase.id,
        lotCode: purchase.lotCode,
        vendor: purchase.vendor?.name || 'Direto',
        quantity: Number(purchase.currentQuantity || purchase.initialQuantity || 0),
        value: Number(purchase.purchaseValue || purchase.totalValue || 0),
        date: purchase.purchaseDate || purchase.createdAt,
        city: purchase.city || 'N/A'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 compras do estado
  }, [cattlePurchases, selectedState]);

  const chartConfig = {
    quantity: {
      label: "Quantidade de Animais",
      color: "hsl(142, 76%, 36%)",
    },
  } satisfies ChartConfig;

  // Função customizada para renderizar labels
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, index, state, quantity } = props;
    const total = data.reduce((sum, d) => sum + d.quantity, 0);
    const percent = ((quantity / total) * 100).toFixed(0);
    
    // Não mostrar label para valores menores que 5%
    if (parseInt(percent) < 5) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        <tspan x={x} dy="-0.3em">{state}</tspan>
        <tspan x={x} dy="1.2em">{percent}%</tspan>
      </text>
    );
  };

  // Cores para os estados
  const COLORS = [
    'hsl(142, 76%, 36%)', // Verde
    'hsl(221, 83%, 53%)', // Azul
    'hsl(39, 100%, 50%)',  // Amarelo
    'hsl(271, 76%, 53%)', // Roxo
    'hsl(186, 76%, 36%)', // Cyan
    'hsl(24, 100%, 50%)', // Laranja
    'hsl(0, 84%, 60%)',   // Vermelho
    'hsl(330, 76%, 53%)', // Rosa
    'hsl(150, 60%, 40%)', // Verde escuro
    'hsl(200, 18%, 46%)', // Cinza
  ];

  // Função para drill-down
  const handleBarClick = (data: any, index?: number, e?: React.MouseEvent) => {
    if (drillDownLevel === 'state' && data) {
      setSelectedState(data.state);
      setDrillDownLevel('details');
    }
  };

  // Função para voltar
  const handleBack = () => {
    setSelectedState(null);
    setDrillDownLevel('state');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compra de Animais por Estado</CardTitle>
          <CardDescription>
            Quantidade de animais adquiridos filtrados por estado
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
                ? 'Quantidade de animais adquiridos por estado (clique para detalhar)'
                : `Lotes de compra detalhados para ${selectedState}`
              }
            </CardDescription>
          </div>
          
          {drillDownLevel === 'state' && (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {drillDownLevel === 'state' ? (
          // Vista principal por estados
          data.length > 0 ? (
            <div>
              <ChartContainer config={chartConfig} className="h-[350px]">
                <PieChart>
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent 
                      formatter={(value: number, name, props) => {
                        const item = props.payload;
                        const percentage = ((value / data.reduce((sum, d) => sum + d.quantity, 0)) * 100).toFixed(1);
                        return [
                          <div key="tooltip" className="space-y-1">
                            <div>{formatSafeNumber(value)} animais ({percentage}%)</div>
                            <div className="text-xs text-muted-foreground">
                              {item.lotCount} lote(s) • {formatSafeCurrency(item.value)}
                            </div>
                          </div>,
                          name
                        ];
                      }}
                    />}
                  />
                  <Pie
                    data={data}
                    dataKey="quantity"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                    strokeWidth={0}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">
                    {formatSafeNumber(data.reduce((sum, item) => sum + item.quantity, 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">Total de animais</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {data.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Estados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatSafeCurrency(data.reduce((sum, item) => sum + item.value, 0), true)}
                  </div>
                  <div className="text-xs text-muted-foreground">Valor total</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sem dados para exibir</p>
                <p className="text-xs mt-1">Registre compras de gado para visualizar por estado</p>
              </div>
            </div>
          )
        ) : (
          // Vista detalhada
          <div className="space-y-4">
            {detailData.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {detailData.map((purchase, index) => (
                  <div 
                    key={purchase.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{purchase.lotCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.vendor} • {purchase.city}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold">
                        {formatSafeNumber(purchase.quantity)} animais
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatSafeCurrency(purchase.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Nenhum lote encontrado</p>
                  <p className="text-xs mt-1">para o estado {selectedState}</p>
                </div>
              </div>
            )}

            {detailData.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {formatSafeNumber(detailData.reduce((sum, item) => sum + item.quantity, 0))} animais
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total em {detailData.length} lote(s) • {formatSafeCurrency(detailData.reduce((sum, item) => sum + item.value, 0))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);