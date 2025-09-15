import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const PurchaseByBrokerChart: React.FC = () => {
  const { cattlePurchases, partners } = useAppStore();

  // Agrupar compras por corretor
  const data = React.useMemo(() => {
    const brokerMap = new Map<string, { currentQuantity: number, value: number, name: string }>();
    
    // Inicializar com "Sem Corretor" para compras diretas
    brokerMap.set('direct', { currentQuantity: 0, value: 0, name: 'N/A' });
    
    cattlePurchases.forEach(order => {
      const brokerId = order.brokerId || 'direct';
      const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
      const brokerName = broker ? broker.name : 'N/A';
      
      const current = brokerMap.get(brokerId) || { currentQuantity: 0, value: 0, name: brokerName };
      
      brokerMap.set(brokerId, {
        currentQuantity: current.currentQuantity + order.currentQuantity,
        value: current.value + ((order.totalWeight / 15) * order.pricePerArroba),
        name: brokerName
      });
    });
    
    // Converter para array e ordenar por quantidade
    return Array.from(brokerMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name.split(' ')[0], // Pegar apenas o primeiro nome para o gráfico
        fullName: data.name,
        currentQuantity: data.currentQuantity,
        value: data.value
      }))
      .sort((a, b) => b.currentQuantity - a.currentQuantity)
      .slice(0, 6); // Limitar aos 6 maiores
  }, [cattlePurchases, partners]);

  // Usar dados reais ou array vazio
  const chartData = data;

  const chartConfig = {
    currentQuantity: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compra por Corretor</CardTitle>
        <CardDescription>
          Quantidade de animais intermediados por cada corretor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent 
                  formatter={(value: number, name, props) => [
                    `${value} animais`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? item.fullName : label;
                  }}
                />}
              />
              <Bar 
                dataKey="currentQuantity" 
                fill="var(--color-currentQuantity)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-[250px] text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Sem dados para exibir</p>
            <p className="text-xs mt-1">Registre ordens de compra para visualizar por corretor</p>
          </div>
        </div>
      )}

        <div className="mt-4 text-center">
          <div className="text-lg font-bold">
            {chartData.reduce((sum, item) => sum + item.currentQuantity, 0)} animais
          </div>
          <div className="text-sm text-muted-foreground">
            Total de animais intermediados
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
