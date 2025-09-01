import React, { useState } from 'react';
import { Plus, Filter, Search, Calendar, DollarSign, Truck, Clipboard, CheckCircle, ChevronDown } from 'lucide-react';
import { SalesKanbanColumn } from './SalesKanbanColumn';
import { useCattlePurchasesApi } from '../../hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '../../hooks/api/useSaleRecordsApi';
import { SaleDesignationForm } from './SaleDesignationForm';
import { Portal } from '../Common/Portal';
import { clsx } from 'clsx';

const stages = [
  { id: 'next_slaughter', title: 'Próximo Abate', color: 'yellow', icon: Calendar },
  { id: 'shipped', title: 'Embarcado', color: 'blue', icon: Truck },
  { id: 'slaughtered', title: 'Abatido', color: 'purple', icon: Clipboard },
  { id: 'reconciled', title: 'Conciliado', color: 'green', icon: CheckCircle },
];

export const SalesPipeline: React.FC = () => {
  const { cattlePurchases } = useCattlePurchasesApi();
  const { saleRecords } = useSaleRecordsApi();
  const [showDesignationForm, setShowDesignationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Simulate sales pipeline data based on existing pens, lots and sales
  // In a real implementation, you would have a dedicated sales pipeline state
  const getSalesPipelineData = () => {
    // Get occupied pens with their lots
    const occupiedPens = penStatuses
      .filter(pen => pen.status === 'occupied')
      .map(pen => {
        // Get allocations for this pen
        const allocations = penAllocations.filter(alloc => alloc.penNumber === pen.penNumber);
        
        // Get lots in this pen
        const lotsInPen = allocations.map(alloc => {
          const lot = cattlePurchases.find(l => l.id === alloc.lotId);
          return {
            allocation: alloc,
            lot
          };
        }).filter(item => item.lot && item.lot.status === 'active');
        
        // Calculate total animals and currentWeight in this pen
        const totalAnimals = lotsInPen.reduce((sum, item) => sum + (item.allocation?.currentQuantity || 0), 0);
        const totalWeight = lotsInPen.reduce((sum, item) => sum + (item.allocation?.entryWeight || 0), 0);
        
        return {
          id: `pen-${pen.penNumber}`,
          penNumber: pen.penNumber,
          isPen: true,
          stage: 'next_slaughter',
          currentQuantity: totalAnimals,
          estimatedWeight: totalWeight,
          scheduledDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          slaughterhouse: null,
          estimatedValue: (totalWeight / 15) * 320, // Estimated value at R$320/@
          lotsInPen: lotsInPen.map(item => item.lot?.lotNumber).filter(Boolean)
        };
      });
    
    // Simulate some pens in the "shipped" stage
    const shippedPens = penStatuses
      .filter(pen => pen.status === 'occupied' && Math.random() > 0.7) // Random selection for demo
      .map(pen => {
        // Get allocations for this pen
        const allocations = penAllocations.filter(alloc => alloc.penNumber === pen.penNumber);
        
        // Get lots in this pen
        const lotsInPen = allocations.map(alloc => {
          const lot = cattlePurchases.find(l => l.id === alloc.lotId);
          return {
            allocation: alloc,
            lot
          };
        }).filter(item => item.lot && item.lot.status === 'active');
        
        // Calculate total animals and currentWeight in this pen
        const totalAnimals = lotsInPen.reduce((sum, item) => sum + (item.allocation?.currentQuantity || 0), 0);
        const totalWeight = lotsInPen.reduce((sum, item) => sum + (item.allocation?.entryWeight || 0), 0);
        
        return {
          id: `pen-${pen.penNumber}-shipped`,
          penNumber: pen.penNumber,
          isPen: true,
          stage: 'shipped',
          currentQuantity: totalAnimals,
          exitWeight: totalWeight * 1.05, // Simulate some currentWeight gain
          shipDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          slaughterhouse: 'Frigorífico Boi Gordo',
          transportCompany: 'Transportes Rápidos',
          estimatedValue: (totalWeight * 1.05 / 15) * 320,
          lotsInPen: lotsInPen.map(item => item.lot?.lotNumber).filter(Boolean)
        };
      });
    
    // Use actual sale records for "slaughtered" stage
    const slaughteredLots = saleRecords
      .filter(sale => !sale.reconciled)
      .map(sale => {
        const lot = cattlePurchases.find(l => l.id === sale.lotId);
        return {
          id: sale.id,
          lotNumber: lot?.lotNumber || 'Unknown',
          stage: 'slaughtered',
          currentQuantity: sale.currentQuantity,
          slaughterWeight: sale.totalWeight,
          slaughterDate: sale.saleDate,
          slaughterhouse: sale.slaughterhouseId,
          grossValue: sale.grossRevenue,
          netValue: sale.netProfit,
          invoiceNumber: `NF-${Math.floor(10000 + Math.random() * 90000)}`,
          paymentDueDate: new Date(sale.saleDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after sale
        };
      });
    
    // Simulate some reconciled sales
    const reconciledLots = saleRecords
      .filter(sale => sale.reconciled)
      .map(sale => {
        const lot = cattlePurchases.find(l => l.id === sale.lotId);
        return {
          id: sale.id,
          lotNumber: lot?.lotNumber || 'Unknown',
          stage: 'reconciled',
          currentQuantity: sale.currentQuantity,
          slaughterWeight: sale.totalWeight,
          slaughterDate: sale.saleDate,
          slaughterhouse: sale.slaughterhouseId,
          grossValue: sale.grossRevenue,
          netValue: sale.netProfit,
          invoiceNumber: `NF-${Math.floor(10000 + Math.random() * 90000)}`,
          paymentDate: new Date(sale.saleDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after sale
          reconciliationDate: new Date(),
        };
      });
    
    // Filter based on search and status
    return {
      next_slaughter: occupiedPens.filter(pen => 
        filterStatus === 'all' || filterStatus === 'next_slaughter'
      ).filter(pen => 
        searchTerm === '' || 
        pen.penNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pen.lotsInPen && pen.lotsInPen.some(lotNumber => 
          lotNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      ),
      shipped: shippedPens.filter(pen => 
        filterStatus === 'all' || filterStatus === 'shipped'
      ).filter(pen => 
        searchTerm === '' || 
        pen.penNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pen.lotsInPen && pen.lotsInPen.some(lotNumber => 
          lotNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      ),
      slaughtered: slaughteredLots.filter(lot => 
        filterStatus === 'all' || filterStatus === 'slaughtered'
      ).filter(lot => 
        searchTerm === '' || lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      reconciled: reconciledLots.filter(lot => 
        filterStatus === 'all' || filterStatus === 'reconciled'
      ).filter(lot => 
        searchTerm === '' || lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    };
  };
  
  const pipelineData = getSalesPipelineData();

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-b3x-navy-900">Pipeline de Abate e Venda</h2>
            <p className="text-sm text-neutral-600 mt-1">Gerencie o fluxo de venda e abate dos currais prontos</p>
          </div>
          
          <button
            onClick={() => setShowDesignationForm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Designar para Abate</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="p-1.5 bg-gradient-to-br from-b3x-navy-100 to-b3x-navy-50 rounded-lg">
                <Filter className="w-4 h-4 text-b3x-navy-600" />
              </div>
              <span className="font-semibold text-b3x-navy-900">Filtros:</span>
            </div>
            
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar currais ou lotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50 appearance-none pr-8"
              >
                <option value="all">Todas as Etapas</option>
                <option value="next_slaughter">Próximo Abate</option>
                <option value="shipped">Embarcado</option>
                <option value="slaughtered">Abatido</option>
                <option value="reconciled">Conciliado</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board - Agora com colunas responsivas */}
      <div className="flex-1 min-h-0">
        <div className="h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 h-full auto-rows-fr">
            {stages.map((stage) => (
              <div key={stage.id} className="min-h-0">
                <SalesKanbanColumn
                  stage={stage}
                  items={pipelineData[stage.id as keyof typeof pipelineData]}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Designation Form Modal */}
      {showDesignationForm && (
        <Portal>
          <SaleDesignationForm
            isOpen={showDesignationForm}
            onClose={() => setShowDesignationForm(false)}
          />
        </Portal>
      )}
    </div>
  );
};