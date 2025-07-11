import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';

export const PurchaseByBrokerChart: React.FC = () => {
  const { purchaseOrders, partners } = useAppStore();

  // Agrupar compras por corretor
  const data = React.useMemo(() => {
    const brokerMap = new Map<string, { quantity: number, value: number, name: string }>();
    
    // Inicializar com "Sem Corretor" para compras diretas
    brokerMap.set('direct', { quantity: 0, value: 0, name: 'N/A' });
    
    purchaseOrders.forEach(order => {
      const brokerId = order.brokerId || 'direct';
      const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
      const brokerName = broker ? broker.name : 'N/A';
      
      const current = brokerMap.get(brokerId) || { quantity: 0, value: 0, name: brokerName };
      
      brokerMap.set(brokerId, {
        quantity: current.quantity + order.quantity,
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
        quantity: data.quantity,
        value: data.value
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6); // Limitar aos 6 maiores
  }, [purchaseOrders, partners]);

  // Usar dados reais ou array vazio
  const chartData = data;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#a6e60d'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium">{payload[0].payload.fullName}</p>
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
        Compra por Corretor
      </h3>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey="name" 
              stroke="#737373" 
              fontSize={12}
            />
            <YAxis 
              stroke="#737373" 
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="quantity" 
              name="Quantidade" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[250px] text-neutral-400">
          <div className="text-center">
            <p className="text-sm">Sem dados para exibir</p>
            <p className="text-xs mt-1">Registre ordens de compra para visualizar por corretor</p>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-b3x-navy-900">
          {chartData.reduce((sum, item) => sum + item.quantity, 0)} animais
        </div>
        <div className="text-sm text-neutral-600">
          Total de animais intermediados
        </div>
      </div>
    </div>
  );
};