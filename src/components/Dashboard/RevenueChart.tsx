import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const RevenueChart: React.FC = () => {
  const { cattleLots, purchaseOrders, saleRecords } = useAppStore();

  // Gerar dados reais baseados nas transações do sistema
  const data = React.useMemo(() => {
    const result = [];
    const today = new Date();
    
    // Gerar dados para os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calcular valor alocado (compras no mês)
      let allocatedValue = 0;
      purchaseOrders.forEach(order => {
        if (order.date >= monthStart && order.date <= monthEnd) {
          const animalValue = (order.totalWeight / 15) * order.pricePerArroba;
          allocatedValue += animalValue + order.commission + order.taxes + order.otherCosts;
        }
      });
      
      // Calcular valor de mercado (vendas no mês)
      let marketValue = 0;
      saleRecords.forEach(sale => {
        if (sale.saleDate >= monthStart && sale.saleDate <= monthEnd) {
          marketValue += sale.grossRevenue;
        }
      });
      
      // Se não houver dados reais, usar valores simulados decrescentes
      if (allocatedValue === 0 && marketValue === 0) {
        const baseValue = 3000000 - (i * 100000);
        allocatedValue = baseValue - 200000;
        marketValue = baseValue;
      }
      
      result.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        allocated: allocatedValue,
        market: marketValue
      });
    }
    
    return result;
  }, [cattleLots, purchaseOrders, saleRecords]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 hover:shadow-soft-lg transition-all duration-200">
      <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
        Capital Total Alocado vs. Valor de Mercado
      </h3>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis 
            dataKey="month" 
            stroke="#737373"
            fontSize={12}
          />
          <YAxis 
            stroke="#737373"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
            labelStyle={{ color: '#404040' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(166, 230, 13, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="allocated" 
            stroke="#22c55e" 
            strokeWidth={3}
            name="Capital Alocado"
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="market" 
            stroke="#a6e60d" 
            strokeWidth={3}
            name="Valor de Mercado"
            dot={{ fill: '#a6e60d', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            R$ {(data.reduce((sum, month) => sum + month.allocated, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-neutral-600">Capital Alocado (6 meses)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-b3x-lime-600">
            R$ {(data.reduce((sum, month) => sum + month.market, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-neutral-600">Valor de Mercado (6 meses)</div>
        </div>
      </div>
    </div>
  );
};