import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';

const COLORS = ['#a6e60d', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const CostAllocationPieChart: React.FC = () => {
  const { costCenters, costAllocations, expenses } = useAppStore();

  // Preparar dados para o gráfico de pizza
  const data = React.useMemo(() => {
    // Se não houver centros de custo, retornar dados simulados
    if (costCenters.length === 0) {
      return [
        { name: 'Aquisição', value: 600000, color: COLORS[0] },
        { name: 'Engorda', value: 250000, color: COLORS[1] },
        { name: 'Administrativo', value: 100000, color: COLORS[2] },
        { name: 'Financeiro', value: 50000, color: COLORS[3] }
      ];
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
        color: COLORS[index % COLORS.length]
      };
    });
  }, [costCenters, costAllocations, expenses]);

  // Se não houver dados reais, usar dados simulados
  const chartData = data.length > 0 ? data : [
    { name: 'Aquisição', value: 600000, color: COLORS[0] },
    { name: 'Engorda', value: 250000, color: COLORS[1] },
    { name: 'Administrativo', value: 100000, color: COLORS[2] },
    { name: 'Financeiro', value: 50000, color: COLORS[3] }
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-b3x-lime-600 font-bold">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-neutral-600">
            {((data.value / total) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  // Componente de legenda personalizado para evitar sobreposição
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-sm mr-1"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-neutral-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 hover:shadow-soft-lg transition-all duration-200">
      <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
        Valor Alocado por Centro de Custo
      </h3>
      
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-b3x-navy-900">
          Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-neutral-600">
          {chartData.length} centros de custo
        </div>
      </div>
    </div>
  );
};