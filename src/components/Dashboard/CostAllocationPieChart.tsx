import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { normalizeCategory, getCategoryDisplayName } from '@/utils/categoryNormalizer';

export const CostAllocationPieChart: React.FC = () => {
  // Buscar despesas do Centro Financeiro
  const { expenses, loading } = useExpensesApi();

  // Preparar dados agrupando despesas por categoria
  const data = React.useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    // Agrupar despesas por categoria normalizada
    const categoryTotals = new Map<string, { normalized: string, display: string, total: number }>();

    expenses.forEach(expense => {
      // Normalizar a categoria
      const normalizedCategory = normalizeCategory(expense.category);
      const displayName = getCategoryDisplayName(normalizedCategory);
      
      const current = categoryTotals.get(normalizedCategory);
      const amount = Number(expense.totalAmount || expense.amount || expense.value || 0);
      
      if (current) {
        categoryTotals.set(normalizedCategory, {
          normalized: normalizedCategory,
          display: displayName,
          total: current.total + amount
        });
      } else {
        categoryTotals.set(normalizedCategory, {
          normalized: normalizedCategory,
          display: displayName,
          total: amount
        });
      }
    });

    // Converter para array e ordenar por valor
    return Array.from(categoryTotals.values())
      .map((item, index) => ({
        name: item.display,
        value: item.total,
        category: item.normalized,
        fill: `var(--color-chart-${(index % 5) + 1})`
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Limitar às 10 maiores categorias
  }, [expenses]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Configuração do gráfico
  const chartConfig = {
    'animal_purchase': {
      label: "Aquisição de Animais",
      color: "hsl(142, 76%, 36%)",
    },
    'freight': {
      label: "Frete", 
      color: "hsl(221, 83%, 53%)",
    },
    'commission': {
      label: "Comissão",
      color: "hsl(39, 100%, 50%)",
    },
    'deaths': {
      label: "Mortalidade",
      color: "hsl(0, 84%, 60%)",
    },
    'feed': {
      label: "Alimentação",
      color: "hsl(271, 76%, 53%)",
    },
    'medications': {
      label: "Medicamentos",
      color: "hsl(186, 76%, 36%)",
    },
    'operational': {
      label: "Operacional",
      color: "hsl(24, 100%, 50%)",
    },
    'other': {
      label: "Outros",
      color: "hsl(200, 18%, 46%)",
    },
  } satisfies ChartConfig;

  // Cores para o gráfico
  const COLORS = [
    'hsl(142, 76%, 36%)', // Verde
    'hsl(221, 83%, 53%)', // Azul
    'hsl(39, 100%, 50%)',  // Amarelo
    'hsl(0, 84%, 60%)',   // Vermelho
    'hsl(271, 76%, 53%)', // Roxo
    'hsl(186, 76%, 36%)', // Cyan
    'hsl(24, 100%, 50%)', // Laranja
    'hsl(200, 18%, 46%)', // Cinza
    'hsl(330, 76%, 53%)', // Rosa
    'hsl(150, 60%, 40%)', // Verde escuro
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alocação de Custos por Categoria</CardTitle>
          <CardDescription>
            Análise de custos e despesas por categoria do Centro Financeiro
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
        <CardTitle>Alocação de Custos por Categoria</CardTitle>
        <CardDescription>
          Análise de custos e despesas por categoria do Centro Financeiro
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent 
                      formatter={(value: number, name) => {
                        const percentage = ((value / total) * 100).toFixed(1);
                        return [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`,
                          name
                        ];
                      }}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">
                    {item.name}
                  </span>
                  <span className="ml-auto font-medium">
                    {((item.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de despesas • {data.length} categorias • {expenses.length} registros
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Sem dados para exibir</p>
              <p className="text-xs mt-1">As despesas do Centro Financeiro aparecerão aqui</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};