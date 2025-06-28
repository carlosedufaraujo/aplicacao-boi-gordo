import React, { useState } from 'react';
import { Plus, Filter, Search, Calendar, DollarSign, Truck, Clipboard, CheckCircle } from 'lucide-react';
import { SalesKanbanColumn } from './SalesKanbanColumn';
import { useAppStore } from '../../stores/useAppStore';
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
  const { cattleLots, saleRecords, penStatuses, penAllocations } = useAppStore();
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
          const lot = cattleLots.find(l => l.id === alloc.lotId);
          return {
            allocation: alloc,
            lot
          };
        }).filter(item => item.lot && item.lot.status === 'active');
        
        // Calculate total animals and weight in this pen
        const totalAnimals = lotsInPen.reduce((sum, item) => sum + (item.allocation?.quantity || 0), 0);
        const totalWeight = lotsInPen.reduce((sum, item) => sum + (item.allocation?.entryWeight || 0), 0);
        
        return {
          id: `pen-${pen.penNumber}`,
          penNumber: pen.penNumber,
          isPen: true,
          stage: 'next_slaughter',
          quantity: totalAnimals,
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
          const lot = cattleLots.find(l => l.id === alloc.lotId);
          return {
            allocation: alloc,
            lot
          };
        }).filter(item => item.lot && item.lot.status === 'active');
        
        // Calculate total animals and weight in this pen
        const totalAnimals = lotsInPen.reduce((sum, item) => sum + (item.allocation?.quantity || 0), 0);
        const totalWeight = lotsInPen.reduce((sum, item) => sum + (item.allocation?.entryWeight || 0), 0);
        
        return {
          id: `pen-${pen.penNumber}-shipped`,
          penNumber: pen.penNumber,
          isPen: true,
          stage: 'shipped',
          quantity: totalAnimals,
          exitWeight: totalWeight * 1.05, // Simulate some weight gain
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
        const lot = cattleLots.find(l => l.id === sale.lotId);
        return {
          id: sale.id,
          lotNumber: lot?.lotNumber || 'Unknown',
          stage: 'slaughtered',
          quantity: sale.quantity,
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
        const lot = cattleLots.find(l => l.id === sale.lotId);
        return {
          id: sale.id,
          lotNumber: lot?.lotNumber || 'Unknown',
          stage: 'reconciled',
          quantity: sale.quantity,
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
          lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      ),
      shipped: shippedPens.filter(pen => 
        filterStatus === 'all' || filterStatus === 'shipped'
      ).filter(pen => 
        searchTerm === '' || 
        pen.penNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pen.lotsInPen && pen.lotsInPen.some(lotNumber => 
          lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
  
  // Calculate totals for each stage
  const stageTotals = {
    next_slaughter: {
      items: pipelineData.next_slaughter.length,
      animals: pipelineData.next_slaughter.reduce((sum, item) => sum + item.quantity, 0),
      value: pipelineData.next_slaughter.reduce((sum, item) => sum + item.estimatedValue, 0),
    },
    shipped: {
      items: pipelineData.shipped.length,
      animals: pipelineData.shipped.reduce((sum, item) => sum + item.quantity, 0),
      value: pipelineData.shipped.reduce((sum, item) => sum + item.estimatedValue, 0),
    },
    slaughtered: {
      items: pipelineData.slaughtered.length,
      animals: pipelineData.slaughtered.reduce((sum, item) => sum + item.quantity, 0),
      value: pipelineData.slaughtered.reduce((sum, item) => sum + item.grossValue, 0),
    },
    reconciled: {
      items: pipelineData.reconciled.length,
      animals: pipelineData.reconciled.reduce((sum, item) => sum + item.quantity, 0),
      value: pipelineData.reconciled.reduce((sum, item) => sum + item.grossValue, 0),
    },
  };

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col">
      {/* Header - Mais compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-b3x-navy-900 mb-1">Pipeline de Abate e Venda</h2>
          <p className="text-xs lg:text-sm text-neutral-600">Gerencie o fluxo de venda e abate dos currais prontos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar currais ou lotes..."
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
            <option value="next_slaughter">Próximo Abate</option>
            <option value="shipped">Embarcado</option>
            <option value="slaughtered">Abatido</option>
            <option value="reconciled">Conciliado</option>
          </select>
          
          <button
            onClick={() => setShowDesignationForm(true)}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Designar para Abate</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {stages.map((stage) => {
          const stageData = stageTotals[stage.id as keyof typeof stageTotals];
          const Icon = stage.icon;
          
          return (
            <div 
              key={stage.id}
              className={clsx(
                "bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3",
                "hover:shadow-soft-lg transition-all duration-200"
              )}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={clsx(
                  "p-2 rounded-lg",
                  stage.id === 'next_slaughter' && "bg-warning-100 text-warning-600",
                  stage.id === 'shipped' && "bg-info-100 text-info-600",
                  stage.id === 'slaughtered' && "bg-purple-100 text-purple-600",
                  stage.id === 'reconciled' && "bg-success-100 text-success-600",
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">{stage.title}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-b3x-navy-900">{stageData.items}</div>
                  <div className="text-xs text-neutral-600">
                    {stage.id === 'next_slaughter' || stage.id === 'shipped' ? 'Currais' : 'Lotes'}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-b3x-navy-900">{stageData.animals}</div>
                  <div className="text-xs text-neutral-600">Animais</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-b3x-lime-600">
                    {(stageData.value / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-neutral-600">Valor</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board - Agora ocupa todo o espaço disponível */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2 lg:gap-3 h-full pb-2" style={{ minWidth: 'max-content' }}>
            {stages.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-64 sm:w-72 lg:w-76 h-full">
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