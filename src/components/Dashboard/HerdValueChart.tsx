import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, TrendingUp } from "lucide-react";

interface HerdValueChartProps {
  marketPrice: number;
  setMarketPrice: (price: number) => void;
}

export const HerdValueChart: React.FC<HerdValueChartProps> = ({ marketPrice, setMarketPrice }) => {
  const { cattleLots, purchaseOrders } = useAppStore();
  const [periodFilter, setPeriodFilter] = useState('30'); // 30, 60, 90 dias
  const [showTrend, setShowTrend] = useState(true);

  // Calcular valor alocado e valor de mercado baseado no período selecionado
  const data = React.useMemo(() => {
    const today = new Date();
    const result = [];
    const days = parseInt(periodFilter);

    // Filtrar apenas lotes ativos
    const activeLots = cattleLots.filter(lot => lot.status === 'active');
    
    // Se não houver lotes ativos, retornar array vazio
    if (activeLots.length === 0) {
      return [];
    }

    // Calcular para cada dia baseado no período
    for (let i = days; i >= 0; i--) {
      const date = subDays(today, i);
      
      // Calcular valor alocado (soma do valor de compra de todos os lotes)
      let allocatedValue = 0;
      activeLots.forEach(lot => {
        const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
        if (order) {
          // Verificar se o lote já existia nesta data
          if (lot.entryDate <= date) {
            const animalValue = (order.totalWeight / 15) * order.pricePerArroba;
            allocatedValue += animalValue + order.commission + order.taxes + order.otherCosts;
          }
        }
      });

      // Calcular valor de mercado (considerando ganho de peso diário)
      let marketValue = 0;
      activeLots.forEach(lot => {
        // Verificar se o lote já existia nesta data
        if (lot.entryDate <= date) {
          const entryDate = lot.entryDate instanceof Date ? lot.entryDate : new Date(lot.entryDate);
          const daysInConfinement = Math.floor((date.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          const estimatedWeight = lot.entryWeight + (lot.estimatedGmd * lot.entryQuantity * daysInConfinement);
          marketValue += (estimatedWeight / 15) * marketPrice;
        }
      });

      result.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: date,
        allocated: allocatedValue,
        market: marketValue
      });
    }

    return result;
  }, [cattleLots, purchaseOrders, marketPrice, periodFilter]);

  const chartConfig = {
    allocated: {
      label: "Capital Alocado",
      color: "hsl(var(--chart-1))",
    },
    market: {
      label: "Valor de Mercado", 
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Função para exportar gráfico (implementação nativa)
  const exportChart = async () => {
    try {
      // Encontrar o elemento do gráfico
      const chartElement = document.querySelector('[data-chart="herd-value"]');
      if (!chartElement) {
        console.error('Elemento do gráfico não encontrado');
        return;
      }

      // Criar um canvas temporário
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Configurar dimensões
      canvas.width = 800;
      canvas.height = 600;

      // Fundo branco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Título
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Capital Alocado vs. Valor de Mercado', canvas.width / 2, 40);

      // Subtítulo
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`Período: ${periodFilter} dias`, canvas.width / 2, 65);

      // Simular dados do gráfico (seria melhor capturar os dados reais)
      const lastAllocated = data[data.length - 1]?.allocated || 0;
      const lastMarket = data[data.length - 1]?.market || 0;

      // Desenhar informações resumidas
      ctx.font = '16px Arial';
      ctx.fillStyle = '#059669';
      ctx.textAlign = 'left';
      ctx.fillText(`Capital Alocado: R$ ${lastAllocated.toLocaleString('pt-BR')}`, 50, 120);
      
      ctx.fillStyle = '#65a30d';
      ctx.fillText(`Valor de Mercado: R$ ${lastMarket.toLocaleString('pt-BR')}`, 50, 150);

      // Download da imagem
      const link = document.createElement('a');
      link.download = `grafico-capital-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();

      console.log('📊 Gráfico exportado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar gráfico:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Capital Alocado vs. Valor de Mercado
              {showTrend && <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            </CardTitle>
            <CardDescription>
              Comparação entre capital investido e valor atual do rebanho
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-32">
                <CalendarDays className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">R$/@:</span>
              <input
                type="number"
                value={marketPrice}
                onChange={(e) => setMarketPrice(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportChart}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
      
      {data.length > 0 ? (
        <ChartContainer config={chartConfig}>
          <LineChart data={data} data-chart="herd-value">
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <ChartTooltip 
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value: number, name) => [
                  `R$ ${value.toLocaleString('pt-BR')}`,
                  chartConfig[name as keyof typeof chartConfig]?.label || name
                ]}
                labelFormatter={(label) => {
                  const item = data.find(d => d.date === label);
                  return item ? format(item.fullDate, 'dd/MM/yyyy', { locale: ptBR }) : label;
                }}
              />}
            />
            <Line 
              type="monotone" 
              dataKey="allocated" 
              stroke="var(--color-allocated)"
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
              animationBegin={0}
            />
            <Line 
              type="monotone" 
              dataKey="market" 
              stroke="var(--color-market)"
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
              animationBegin={300}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-[250px] text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Sem dados para exibir</p>
            <p className="text-xs mt-1">Registre ordens de compra para visualizar o capital</p>
          </div>
        </div>
      )}

        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold" style={{ color: "var(--color-allocated)" }}>
              R$ {(data[data.length - 1]?.allocated || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">Capital Alocado</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: "var(--color-market)" }}>
              R$ {(data[data.length - 1]?.market || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">Valor de Mercado</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};