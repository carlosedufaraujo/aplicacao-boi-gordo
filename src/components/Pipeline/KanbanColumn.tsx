import React from 'react';
import { Plus } from 'lucide-react';
import { PurchaseOrderCard } from './PurchaseOrderCard';
import { PurchaseOrder } from '../../types';
import { clsx } from 'clsx';

interface KanbanColumnProps {
  stage: {
    id: string;
    title: string;
    color: string;
  };
  orders: PurchaseOrder[];
  onNewOrder?: () => void;
}

const colorMap = {
  gray: 'border-neutral-200 bg-neutral-50/50',
  yellow: 'border-warning-200 bg-warning-50/50',
  blue: 'border-info-200 bg-info-50/50',
  purple: 'border-purple-200 bg-purple-50/50',
  green: 'border-success-200 bg-success-50/50',
  lime: 'border-b3x-lime-200 bg-b3x-lime-50/50',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, orders, onNewOrder }) => {
  const totalValue = orders.reduce((sum, order) => {
    return sum + ((order.totalWeight / 15) * order.pricePerArroba + order.commission + order.taxes + order.otherCosts);
  }, 0);

  // 🆕 NOVO: Calcular total de animais na etapa
  const totalAnimals = orders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Column Header - Com contagem de animais */}
      <div className={clsx(
        'p-3 rounded-t-lg border-2 border-b-0 backdrop-blur-sm shadow-soft',
        colorMap[stage.color as keyof typeof colorMap] || colorMap.gray
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-b3x-navy-900 text-sm truncate">{stage.title}</h3>
            <div className="flex items-center space-x-2 text-xs text-neutral-600">
              <span>{orders.length} ordem{orders.length !== 1 ? 's' : ''}</span>
              {totalAnimals > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-b3x-lime-700">
                    {totalAnimals.toLocaleString('pt-BR')} animais
                  </span>
                </>
              )}
            </div>
          </div>
          {onNewOrder && (
            <button 
              onClick={onNewOrder}
              className="p-1.5 bg-white/80 backdrop-blur-sm rounded-md shadow-soft hover:shadow-soft-lg hover:bg-b3x-lime-50 transition-all duration-200 border border-neutral-200/50 flex-shrink-0 ml-2"
            >
              <Plus className="w-3 h-3 text-b3x-navy-600" />
            </button>
          )}
        </div>
        
        {totalValue > 0 && (
          <div className="text-xs text-neutral-600">
            Total: R$ {(totalValue/1000).toFixed(0)}k
          </div>
        )}
      </div>

      {/* Column Content - Melhor enquadramento dos cards */}
      <div className="flex-1 p-3 bg-white/60 backdrop-blur-sm border-2 border-t-0 border-neutral-200/50 rounded-b-lg overflow-y-auto space-y-3 shadow-soft min-h-0">
        {orders.map((order) => (
          <PurchaseOrderCard key={order.id} order={order} />
        ))}
        
        {orders.length === 0 && (
          <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-neutral-400 text-lg">📋</span>
              </div>
              <p className="text-sm mb-1">Nenhuma ordem</p>
              <p className="text-xs text-neutral-500">nesta etapa</p>
              {onNewOrder && (
                <button
                  onClick={onNewOrder}
                  className="text-b3x-lime-600 hover:text-b3x-lime-700 text-xs mt-2 underline"
                >
                  Criar primeira ordem
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};