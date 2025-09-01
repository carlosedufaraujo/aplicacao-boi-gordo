import React from 'react';
import { Calendar, Filter, TrendingUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePens } from '../../hooks/useSupabaseData';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface DREFiltersProps {
  entityType: 'lot' | 'pen' | 'global';
  entityId: string;
  periodStart: Date;
  periodEnd: Date;
  includeProjections: boolean;
  pricePerArroba: number;
  onEntityTypeChange: (type: 'lot' | 'pen' | 'global') => void;
  onEntityIdChange: (id: string) => void;
  onPeriodStartChange: (date: Date) => void;
  onPeriodEndChange: (date: Date) => void;
  onIncludeProjectionsChange: (include: boolean) => void;
  onPricePerArrobaChange: (price: number) => void;
}

export const DREFilters: React.FC<DREFiltersProps> = ({
  entityType,
  entityId,
  periodStart,
  periodEnd,
  includeProjections,
  pricePerArroba,
  onEntityTypeChange,
  onEntityIdChange,
  onPeriodStartChange,
  onPeriodEndChange,
  onIncludeProjectionsChange,
  onPricePerArrobaChange
}) => {
  const { cattlePurchases } = useAppStore();
  const { pens } = usePens();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-b3x-navy-100 to-b3x-navy-50 rounded-lg">
          <Filter className="w-4 h-4 text-b3x-navy-600" />
        </div>
        <h3 className="text-sm font-semibold text-b3x-navy-900">Filtros e Parâmetros</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tipo de Entidade */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Tipo de Análise
          </label>
          <div className="relative">
            <select
              value={entityType}
              onChange={(e) => {
                onEntityTypeChange(e.target.value as 'lot' | 'pen' | 'global');
                onEntityIdChange('');
              }}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50 appearance-none pr-8"
            >
              <option value="global">Global (Todos os Lotes)</option>
              <option value="lot">Por Lote</option>
              <option value="pen">Por Curral</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Seleção de Entidade */}
        {entityType !== 'global' && (
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              {entityType === 'lot' ? 'Lote' : 'Curral'}
            </label>
            <div className="relative">
              <select
                value={entityId}
                onChange={(e) => onEntityIdChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50 appearance-none pr-8"
              >
                <option value="">Selecione...</option>
                {entityType === 'lot' ? (
                  cattlePurchases
                    .filter(lot => lot.status === 'active' || lot.status === 'sold')
                    .map(lot => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNumber} - {lot.entryQuantity} animais
                      </option>
                    ))
                ) : (
                  pens
                    .filter(pen => pen.isActive)
                    .map(pen => (
                      <option key={pen.id} value={pen.penNumber}>
                        Curral {pen.penNumber} - Capacidade: {pen.capacity}
                      </option>
                    ))
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Data Início */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Data Início
          </label>
          <div className="relative">
            <input
              type="date"
              value={format(periodStart, 'yyyy-MM-dd')}
              onChange={(e) => onPeriodStartChange(new Date(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
            />
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Data Fim
          </label>
          <div className="relative">
            <input
              type="date"
              value={format(periodEnd, 'yyyy-MM-dd')}
              onChange={(e) => onPeriodEndChange(new Date(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
            />
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Opções Adicionais */}
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              id="includeProjections"
              checked={includeProjections}
              onChange={(e) => onIncludeProjectionsChange(e.target.checked)}
              className="h-4 w-4 text-b3x-lime-500 focus:ring-b3x-lime-500 border-neutral-300 rounded cursor-pointer"
            />
            <span className="ml-2 text-sm text-neutral-700 group-hover:text-b3x-navy-900 transition-colors">
              Incluir projeções de vendas
            </span>
          </label>

          {includeProjections && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-b3x-lime-50 to-b3x-lime-100/50 px-3 py-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-b3x-lime-600" />
              <label className="text-sm font-medium text-b3x-navy-900">
                Preço/@:
              </label>
              <input
                type="number"
                value={pricePerArroba}
                onChange={(e) => onPricePerArrobaChange(Number(e.target.value))}
                className="w-20 px-2 py-1 text-sm border border-b3x-lime-200 rounded bg-white/80 focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                min="0"
                step="10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 