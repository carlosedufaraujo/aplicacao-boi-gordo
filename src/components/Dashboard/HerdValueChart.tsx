import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HerdValueChartProps {
  marketPrice: number;
  setMarketPrice: (price: number) => void;
}

export const HerdValueChart: React.FC<HerdValueChartProps> = ({ marketPrice, setMarketPrice }) => {
  const { cattleLots, purchaseOrders } = useAppStore();

  // Calcular valor alocado e valor de mercado para os últimos 30 dias
  const data = React.useMemo(() => {
    const today = new Date();
    const result = [];

    // Filtrar apenas lotes ativos
    const activeLots = cattleLots.filter(lot => lot.status === 'active');
    
    // Se não houver lotes ativos, retornar array vazio
    if (activeLots.length === 0) {
      return [];
    }

    // Calcular para cada dia
    for (let i = 30; i >= 0; i--) {
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
          const daysInConfinement = Math.floor((date.getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
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
  }, [cattleLots, purchaseOrders, marketPrice]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 hover:shadow-soft-lg transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2 sm:mb-0">
          Capital Alocado vs. Valor de Mercado
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-neutral-600">Preço R$/@:</span>
          <input
            type="number"
            value={marketPrice}
            onChange={(e) => setMarketPrice(Number(e.target.value))}
            className="w-20 px-2 py-1 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey="date" 
              stroke="#737373"
              fontSize={11}
              tickMargin={5}
            />
            <YAxis 
              stroke="#737373"
              fontSize={11}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              tickMargin={5}
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
              labelFormatter={(label) => {
                const item = data.find(d => d.date === label);
                return item ? format(item.fullDate, 'dd/MM/yyyy', { locale: ptBR }) : label;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="allocated" 
              stroke="#22c55e" 
              strokeWidth={3}
              name="Capital Alocado"
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="market" 
              stroke="#a6e60d" 
              strokeWidth={3}
              name="Valor de Mercado"
              dot={{ fill: '#a6e60d', strokeWidth: 2, r: 3 }}
            />
            <ReferenceLine y={data[data.length - 1]?.allocated} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine y={data[data.length - 1]?.market} stroke="#a6e60d" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
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
          <div className="text-lg font-bold text-success-600">
            R$ {(data[data.length - 1]?.allocated || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-neutral-600">Capital Alocado</div>
        </div>
        <div>
          <div className="text-lg font-bold text-b3x-lime-600">
            R$ {(data[data.length - 1]?.market || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-neutral-600">Valor de Mercado</div>
        </div>
      </div>
    </div>
  );
};