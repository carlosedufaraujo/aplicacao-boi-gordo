import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';

export const PurchaseByStateChart: React.FC = () => {
  const { purchaseOrders } = useAppStore();

  // Agrupar compras por estado
  const data = React.useMemo(() => {
    const stateMap = new Map<string, { quantity: number, value: number }>();
    
    purchaseOrders.forEach(order => {
      const state = order.state;
      const current = stateMap.get(state) || { quantity: 0, value: 0 };
      
      stateMap.set(state, {
        quantity: current.quantity + order.quantity,
        value: current.value + ((order.totalWeight / 15) * order.pricePerArroba)
      });
    });
    
    // Converter para array e ordenar por quantidade
    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        quantity: data.quantity,
        value: data.value
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [purchaseOrders]);

  // Se não houver dados reais, usar dados simulados
  const chartData = data.length > 0 ? data : [
    { state: 'SP', quantity: 450, value: 1350000 },
    { state: 'MS', quantity: 320, value: 960000 },
    { state: 'MT', quantity: 280, value: 840000 },
    { state: 'GO', quantity: 210, value: 630000 },
    { state: 'MG', quantity: 180, value: 540000 },
    { state: 'PR', quantity: 120, value: 360000 }
  ];

  const COLORS = ['#a6e60d', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium">Estado: {label}</p>
          <p className="text-b3x-navy-900">
            <span className="font-bold">{payload[0].value}</span> animais
          </p>
          <p className="text-b3x-lime-600 font-medium">
            R$ {payload[0].payload.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 hover:shadow-soft-lg transition-all duration-200">
      <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
        Compra de Animais por Estado
      </h3>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
          <XAxis type="number" stroke="#737373" fontSize={12} />
          <YAxis 
            dataKey="state" 
            type="category" 
            stroke="#737373" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="quantity" 
            name="Quantidade" 
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-b3x-navy-900">
          {chartData.reduce((sum, item) => sum + item.quantity, 0)} animais
        </div>
        <div className="text-sm text-neutral-600">
          Total de animais comprados
        </div>
      </div>
    </div>
  );
};