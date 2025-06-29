import React, { useState } from 'react';
import { Plus, FileText, CreditCard, Truck, CheckCircle, Search, Filter } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';
import { useAppStore } from '../../stores/useAppStore';
import { Portal } from '../Common/Portal';

const stages = [
  { id: 'order', title: 'Ordem de Compra', color: 'gray', icon: FileText },
  { id: 'payment_validation', title: 'Validação de Pagamento', color: 'yellow', icon: CreditCard },
  { id: 'reception', title: 'Recepção no Confinamento', color: 'blue', icon: Truck },
  { id: 'confined', title: 'Confinado', color: 'lime', icon: CheckCircle },
];

export const Pipeline: React.FC = () => {
  const { purchaseOrders, partners } = useAppStore();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtrar ordens baseado na busca e status
  const getFilteredOrders = (stageId: string) => {
    return purchaseOrders
      .filter(order => order.status === stageId)
      .filter(order => {
        if (filterStatus !== 'all' && order.status !== filterStatus) {
          return false;
        }
        
        if (searchTerm === '') return true;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar por código da ordem
        if (order.code.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por cidade/estado
        if (order.city.toLowerCase().includes(searchLower)) return true;
        if (order.state.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por nome do vendedor
        const vendor = partners.find(p => p.id === order.vendorId);
        if (vendor && vendor.name.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por nome do corretor
        if (order.brokerId) {
          const broker = partners.find(p => p.id === order.brokerId);
          if (broker && broker.name.toLowerCase().includes(searchLower)) return true;
        }
        
        return false;
      });
  };

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col">
      {/* Header - Mais compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-b3x-navy-900 mb-1">Pipeline de Compras</h2>
          <p className="text-xs lg:text-sm text-neutral-600">Gerencie o fluxo de aquisição de novos lotes</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar ordens, cidades, vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-48"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
          >
            <option value="all">Todas as Etapas</option>
            <option value="order">Ordem de Compra</option>
            <option value="payment_validation">Validação de Pagamento</option>
            <option value="reception">Recepção no Confinamento</option>
            <option value="confined">Confinado</option>
          </select>
          
          <button
            onClick={() => setShowNewOrderForm(true)}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ordem</span>
          </button>
        </div>
      </div>

      {/* Kanban Board - Agora com colunas responsivas */}
      <div className="flex-1 min-h-0">
        <div className="h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 h-full auto-rows-fr">
            {stages.map((stage) => (
              <div key={stage.id} className="min-h-0">
                <KanbanColumn
                  stage={stage}
                  orders={getFilteredOrders(stage.id)}
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