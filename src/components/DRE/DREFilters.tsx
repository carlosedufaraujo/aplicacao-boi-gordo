import React from 'react';
import { Calendar, Filter, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format } from 'date-fns';

interface DREFiltersProps {
  selectedEntityType: 'lot' | 'pen' | 'global';
  setSelectedEntityType: (type: 'lot' | 'pen' | 'global') => void;
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
  periodStart: Date;
  setPeriodStart: (date: Date) => void;
  periodEnd: Date;
  setPeriodEnd: (date: Date) => void;
  includeProjections: boolean;
  setIncludeProjections: (include: boolean) => void;
  pricePerArroba: number;
  setPricePerArroba: (price: number) => void;
}

export const DREFilters: React.FC<DREFiltersProps> = ({
  selectedEntityType,
  setSelectedEntityType,
  selectedEntityId,
  setSelectedEntityId,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  includeProjections,
  setIncludeProjections,
  pricePerArroba,
  setPricePerArroba
}) => {
  const { cattleLots, penRegistrations } = useAppStore();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center mb-4">
        <Filter className="w-5 h-5 text-b3x-navy-700 mr-2" />
        <h3 className="text-lg font-semibold text-b3x-navy-900">Filtros do DRE</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tipo de Entidade */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tipo de Análise
          </label>
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value as 'lot' | 'pen' | 'global');
              setSelectedEntityId('');
            }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
          >
            <option value="global">Global (Todos os Lotes)</option>
            <option value="lot">Por Lote</option>
            <option value="pen">Por Curral</option>
          </select>
        </div>

        {/* Seleção de Entidade */}
        {selectedEntityType !== 'global' && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {selectedEntityType === 'lot' ? 'Lote' : 'Curral'}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              {selectedEntityType === 'lot' ? (
                cattleLots
                  .filter(lot => lot.status === 'active' || lot.status === 'sold')
                  .map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNumber} - {lot.entryQuantity} animais
                    </option>
                  ))
              ) : (
                penRegistrations
                  .filter(pen => pen.isActive)
                  .map(pen => (
                    <option key={pen.id} value={pen.penNumber}>
                      Curral {pen.penNumber} - Capacidade: {pen.capacity}
                    </option>
                  ))
              )}
            </select>
          </div>
        )}

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Data Início
          </label>
          <input
            type="date"
            value={format(periodStart, 'yyyy-MM-dd')}
            onChange={(e) => setPeriodStart(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            value={format(periodEnd, 'yyyy-MM-dd')}
            onChange={(e) => setPeriodEnd(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Opções Adicionais */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeProjections"
              checked={includeProjections}
              onChange={(e) => setIncludeProjections(e.target.checked)}
              className="h-4 w-4 text-b3x-lime-500 focus:ring-b3x-lime-500 border-neutral-300 rounded"
            />
            <label htmlFor="includeProjections" className="ml-2 text-sm text-neutral-700">
              Incluir projeções de vendas
            </label>
          </div>

          {includeProjections && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-neutral-500" />
              <label className="text-sm text-neutral-700">
                Preço/@:
              </label>
              <input
                type="number"
                value={pricePerArroba}
                onChange={(e) => setPricePerArroba(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-neutral-300 rounded text-sm"
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