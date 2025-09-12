import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { calculateAggregateMetrics, CattlePurchaseData } from '@/utils/cattlePurchaseCalculations';
import { formatSafeCurrency, formatSafeDecimal } from '@/utils/dateUtils';

export const CostAllocationPieChart: React.FC = () => {
  // Buscar compras de gado do sistema
  const { cattlePurchases, loading } = useCattlePurchasesApi();

  // Preparar dados para o TreeMap usando dados reais
  const data = React.useMemo(() => {
    if (!cattlePurchases || cattlePurchases.length === 0) {
      return [];
    }

    // Calcular métricas agregadas usando a função centralizada
    const metrics = calculateAggregateMetrics(cattlePurchases as CattlePurchaseData[]);
    
    const totalCost = metrics.totalCost;

    // Calcular percentuais em relação ao custo total
    const calculatePercentage = (value: number) => {
      return totalCost > 0 ? (value / totalCost) * 100 : 0;
    };
    
    // Função para ajustar valores para melhor visualização
    // Aplica uma transformação que aumenta significativamente a visibilidade de valores pequenos
    const adjustValueForDisplay = (value: number, percentage: number) => {
      // Garantir visualização mínima adequada para todos os valores
      if (percentage > 0) {
        // Aplicar escala mais agressiva baseada na raiz quadrada
        // Isso comprime valores grandes e expande valores pequenos
        const minSize = 0.15; // Garantir pelo menos 15% de área visual
        const scaledPercentage = Math.sqrt(percentage / 100) * 100;
        
        // Garantir que mesmo o menor valor tenha pelo menos minSize
        const adjustedPercentage = Math.max(scaledPercentage, minSize * 100);
        
        // Retornar valor proporcional ao ajuste
        return (adjustedPercentage / percentage) * value;
      }
      return value;
    };
    
    // Preparar dados com valores reais
    const rawData = [
      {
        name: 'Compra de Animais',
        realValue: metrics.purchaseValue,
        percentage: calculatePercentage(metrics.purchaseValue),
        color: '#22c55e'
      },
      {
        name: 'Frete',
        realValue: metrics.freightCost,
        percentage: calculatePercentage(metrics.freightCost),
        color: '#3b82f6'
      },
      {
        name: 'Comissões',
        realValue: metrics.commissionCost,
        percentage: calculatePercentage(metrics.commissionCost),
        color: '#eab308'
      },
      {
        name: 'Custos Operacionais',
        realValue: metrics.otherCosts,
        percentage: calculatePercentage(metrics.otherCosts),
        color: '#f97316'
      }
    ].filter(item => item.realValue > 0);
    
    // Aplicar ajuste de visualização
    const treeData = rawData.map(item => ({
      ...item,
      value: adjustValueForDisplay(item.realValue, item.percentage),
      displayValue: item.realValue // Manter o valor real para exibição
    }));
    
    return treeData;
  }, [cattlePurchases]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Componente customizado para o conteúdo do TreeMap
  const CustomContent: React.FC<any> = (props) => {
    const { x, y, width, height, value, name, color, percentage, displayValue } = props;
    
    // Validações de segurança
    if (x === undefined || y === undefined || !width || !height) return null;
    if (width < 25 || height < 15) return null;
    if (!name) return null;
    
    const fontSize = Math.min(width / 10, height / 5, 12);
    const showPercentage = width > 40 && height > 30;
    const showValue = width > 60 && height > 40;
    
    // Truncar nome se necessário
    const displayName = name && name.length > 15 && width < 100 
      ? name.substring(0, 12) + '...' 
      : name || '';
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 1,
            strokeOpacity: 0.8,
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPercentage ? fontSize * 0.5 : 0)}
          textAnchor="middle"
          fill="#fff"
          fontSize={fontSize}
          fontWeight="600"
        >
          {displayName}
        </text>
        {showPercentage && (
          <text
            x={x + width / 2}
            y={y + height / 2 + fontSize * 0.8}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize * 0.85}
            opacity={0.95}
          >
            {formatSafeDecimal(percentage, 1)}%
          </text>
        )}
        {showValue && (
          <text
            x={x + width / 2}
            y={y + height / 2 + fontSize * 1.8}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize * 0.75}
            opacity={0.85}
          >
            {formatSafeCurrency(displayValue || value)}
          </text>
        )}
      </g>
    );
  };

  // Tooltip customizado
  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p className="flex justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">Valor:</span>
            <span className="font-medium">{formatSafeCurrency(data.displayValue || data.realValue || data.value)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">Percentual:</span>
            <span className="font-medium">{formatSafeDecimal(data.percentage, 1)}%</span>
          </p>
        </div>
      </div>
    );
  };

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
          <CardTitle>Distribuição de Custos</CardTitle>
          <CardDescription>
            Análise comparativa dos custos de aquisição de gado
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
        <CardTitle>Distribuição de Custos</CardTitle>
        <CardDescription>
          Análise comparativa dos custos de aquisição de gado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={350}>
              <Treemap
                data={data}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={(props) => <CustomContent {...props} {...props.payload} />}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>

            {/* Detalhamento dos valores */}
            <div className="mt-4 space-y-2">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.percentage.toFixed(1)}% do total)
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatSafeCurrency(item.displayValue || item.realValue || item.value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Custo Total</span>
                <span className="text-lg font-bold">
                  R$ {(cattlePurchases && cattlePurchases.length > 0 
                    ? calculateAggregateMetrics(cattlePurchases as CattlePurchaseData[]).totalCost 
                    : 0
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Baseado em {cattlePurchases?.length || 0} compras registradas
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Sem dados para exibir</p>
              <p className="text-xs mt-1">Os custos de compra de gado aparecerão aqui</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};