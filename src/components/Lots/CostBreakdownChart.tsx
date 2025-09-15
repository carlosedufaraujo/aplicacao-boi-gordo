import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';

interface CostBreakdownChartProps {
  lotId: string;
}

const COLORS = {
  acquisition: '#a6e60d',
  feed: '#22c55e',
  health: '#3b82f6',
  freight: '#f59e0b',
  financing: '#ef4444',
  other: '#8b5cf6'
};

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ lotId }) => {
  const { calculateLotProfit } = useAppStore();
  
  const saleSimulation = calculateLotProfit(lotId, 320); // Default price for chart
  const costBreakdown = saleSimulation.costBreakdown;

  const data = [
    { name: 'Aquisição', value: costBreakdown.acquisition, color: COLORS.acquisition },
    { name: 'Alimentação', value: costBreakdown.feed, color: COLORS.feed },
    { name: 'Sanidade', value: costBreakdown.health, color: COLORS.health },
    { name: 'Frete', value: costBreakdown.freight, color: COLORS.freight },
    { name: 'Financiamento', value: costBreakdown.financing, color: COLORS.financing },
    { name: 'Outros', value: costBreakdown.other, color: COLORS.other }
  ].filter(item => item.value > 0); // Only show categories with costs

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
            {((data.value / saleSimulation.totalCosts) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-neutral-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-neutral-500">Nenhum custo registrado para este lote</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h4 className="text-lg font-semibold text-b3x-navy-900 mb-4 text-center">
        Composição de Custos
      </h4>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-b3x-navy-900">
          Total: R$ {saleSimulation.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-neutral-600">
          Custo por animal: R$ {(saleSimulation.totalCosts / saleSimulation.daysInConfinement).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};
