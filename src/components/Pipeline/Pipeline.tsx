import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';
import { useAppStore } from '../../stores/useAppStore';
import { Portal } from '../Common/Portal';

const stages = [
  { id: 'order', title: 'Ordem de Compra', color: 'gray' },
  { id: 'payment_validation', title: 'Validação de Pagamento', color: 'yellow' },
  { id: 'reception', title: 'Recepção no Confinamento', color: 'blue' },
  { id: 'confined', title: 'Confinado', color: 'lime' },
];

export const Pipeline: React.FC = () => {
  const { purchaseOrders } = useAppStore();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col">
      {/* Header - Mais compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-b3x-navy-900 mb-1">Pipeline de Compras</h2>
          <p className="text-xs lg:text-sm text-neutral-600">Gerencie o fluxo de aquisição de novos lotes</p>
        </div>
        
        <button
          onClick={() => setShowNewOrderForm(true)}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem</span>
        </button>
      </div>

      {/* Kanban Board - Agora ocupa todo o espaço disponível */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2 lg:gap-3 h-full pb-2" style={{ minWidth: 'max-content' }}>
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-64 sm:w-72 lg:w-76 h-full">
                <KanbanColumn
                  stage={stage}
                  orders={purchaseOrders.filter(order => order.status === stage.id)}
                  onNewOrder={stage.id === 'order' ? () => setShowNewOrderForm(true) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Order Form Modal */}
      {showNewOrderForm && (
        <Portal>
          <PurchaseOrderForm
            isOpen={showNewOrderForm}
            onClose={() => setShowNewOrderForm(false)}
          />
        </Portal>
      )}
    </div>
  );
};