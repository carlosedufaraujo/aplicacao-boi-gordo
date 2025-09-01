import React from 'react';
import { SalesKanbanCard } from './SalesKanbanCard';
import { clsx } from 'clsx';
import { formatCompactCurrency } from '@/utils/formatters';

interface SalesKanbanColumnProps {
  stage: {
    id: string;
    title: string;
    color: string;
    icon: React.ElementType;
  };
  items: any[];
}

const colorMap = {
  gray: 'border-neutral-200 bg-neutral-50/50',
  yellow: 'border-warning-200 bg-warning-50/50',
  blue: 'border-info-200 bg-info-50/50',
  purple: 'border-purple-200 bg-purple-50/50',
  green: 'border-success-200 bg-success-50/50',
  lime: 'border-b3x-lime-200 bg-b3x-lime-50/50',
};

export const SalesKanbanColumn: React.FC<SalesKanbanColumnProps> = ({ stage, items }) => {
  const Icon = stage.icon;
  
  // Calculate total value for this column
  const totalValue = items.reduce((sum, item) => {
    if (stage.id === 'next_slaughter' || stage.id === 'shipped') {
      return sum + (item.estimatedValue || 0);
    } else {
      return sum + (item.grossValue || 0);
    }
  }, 0);

  // Calculate total animals in this column
  const totalAnimals = items.reduce((sum, item) => sum + (item.currentQuantity || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Column Header - Com título e informações consolidadas */}
      <div className={clsx(
        'p-3 rounded-t-lg border-2 border-b-0 backdrop-blur-sm shadow-soft',
        colorMap[stage.color as keyof typeof colorMap] || colorMap.gray
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={clsx(
              "p-1.5 rounded-lg flex-shrink-0",
              stage.id === 'next_slaughter' && "bg-warning-100 text-warning-600",
              stage.id === 'shipped' && "bg-info-100 text-info-600",
              stage.id === 'slaughtered' && "bg-purple-100 text-purple-600",
              stage.id === 'reconciled' && "bg-success-100 text-success-600",
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-b3x-navy-900 text-sm truncate">{stage.title}</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-bold text-b3x-navy-900">{items.length}</div>
            <div className="text-xs text-neutral-600">
              {stage.id === 'next_slaughter' || stage.id === 'shipped' ? 'Currais' : 'Lotes'}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-b3x-navy-900">{totalAnimals}</div>
            <div className="text-xs text-neutral-600">Animais</div>
          </div>
          <div>
            <div className="text-sm font-bold text-b3x-lime-600">
              {formatCompactCurrency(totalValue)}
            </div>
            <div className="text-xs text-neutral-600">Valor</div>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 bg-white/60 backdrop-blur-sm border-2 border-t-0 border-neutral-200/50 rounded-b-lg overflow-y-auto space-y-3 shadow-soft min-h-0">
        {items.map((item) => (
          <SalesKanbanCard key={item.id} item={item} stage={stage.id} />
        ))}
        
        {items.length === 0 && (
          <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-neutral-400 text-lg">📋</span>
              </div>
              <p className="text-sm mb-1">Nenhum lote</p>
              <p className="text-xs text-neutral-500">nesta etapa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};