import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export const CostAllocationPieChart: React.FC = () => {
  const { costCenters, costAllocations, expenses } = useAppStore();

  // Preparar dados para o gráfico de pizza
  const data = React.useMemo(() => {
    // Se não houver centros de custo, retornar array vazio
    if (costCenters.length === 0) {
      return [];
    }

    // Agrupar por tipo de centro de custo
    const costCenterTotals = new Map<string, number>();

    // Considerar alocações para centros de custo
    costAllocations.forEach(allocation => {
      const costCenter = costCenters.find(cc => cc.id === allocation.costCenterId);
      if (costCenter) {
        const current = costCenterTotals.get(costCenter.type) || 0;
        costCenterTotals.set(costCenter.type, current + allocation.amount);
      }
    });

    // Mapear para o formato esperado pelo gráfico
    return Array.from(costCenterTotals.entries()).map(([type, amount], index) => {
      // Converter tipo para nome legível
      const typeLabels: Record<string, string> = {
        'acquisition': 'Aquisição',
        'fattening': 'Engorda',
        'administrative': 'Administrativo',
        'financial': 'Financeiro'
      };
      
      return {
        name: typeLabels[type] || type,
        value: amount,
        fill: `var(--color-${type})`
      };
    });
  }, [costCenters, costAllocations, expenses]);

  // Usar dados reais ou array vazio
  const chartData = data;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = {
    acquisition: {
      label: "Aquisição",
      color: "hsl(var(--chart-1))",
    },
    fattening: {
      label: "Engorda", 
      color: "hsl(var(--chart-2))",
    },
    administrative: {
      label: "Administrativo",
      color: "hsl(var(--chart-3))",
    },
    financial: {
      label: "Financeiro",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;



  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocação de Custos por Centro</CardTitle>
        <CardDescription>
          Distribuição dos custos entre os diferentes centros de custo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  formatter={(value: number, name) => [
                    `R$ ${value.toLocaleString('pt-BR')}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name
                  ]}
                />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend 
                content={<ChartLegendContent nameKey="name" />}
                className="flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-[220px] text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Sem dados para exibir</p>
            <p className="text-xs mt-1">Registre despesas para visualizar a alocação</p>
          </div>
        </div>
      )}

        <div className="mt-4 text-center">
          <div className="text-lg font-bold">
            Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            {chartData.length} centros de custo
          </div>
        </div>
      </CardContent>
    </Card>
  );
};