import React from 'react';
import { TrendingUp, TrendingDown, Clock, TrendingDown as TrendingDownIcon, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { KPI } from '../../types';
import { clsx } from 'clsx';

interface KPICardProps {
  kpi: KPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  // Mapeamento de ícones com componentes reais do Lucide
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Beef':
        return <div className="w-4 h-4 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded"></div>;
      case 'Clock':
        return <Clock className="w-4 h-4 text-neutral-600" />;
      case 'TrendingDown':
        return <TrendingDownIcon className="w-4 h-4 text-neutral-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-neutral-600" />;
      case 'DollarSign':
        return <DollarSign className="w-4 h-4 text-neutral-600" />;
      case 'ShoppingCart':
        return <ShoppingCart className="w-4 h-4 text-neutral-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">{kpi.label}</p>
          <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{kpi.value}</p>
          
          {kpi.change && (
            <div className="flex items-center mt-1">
              {kpi.changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3 text-success-500 mr-1 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 text-error-500 mr-1 flex-shrink-0" />
              )}
              <span
                className={clsx(
                  'text-xs font-medium',
                  kpi.changeType === 'increase' ? 'text-success-700' : 'text-error-700'
                )}
              >
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
          )}
        </div>
        
        <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
          {getIcon(kpi.icon)}
        </div>
      </div>
    </div>
  );
};