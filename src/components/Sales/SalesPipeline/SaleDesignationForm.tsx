import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Users, Scale, DollarSign, Building, Home, Filter, Search, AlertTriangle, Plus, Truck } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

const saleDesignationSchema = z.object({
  penNumbers: z.array(z.string()).min(1, 'Selecione pelo menos um curral'),
  scheduledDate: z.date({
    required_error: "Data de abate é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  slaughterhouseId: z.string().min(1, 'Selecione um frigorífico'),
  estimatedPricePerArroba: z.number().min(1, 'Preço deve ser maior que 0'),
  observations: z.string().optional(),
});

interface SaleDesignationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDesignationForm: React.FC<SaleDesignationFormProps> = ({
  isOpen,
  onClose
}) => {
  const { cattlePurchases, partners, penStatuses, penAllocations } = useAppStore();
  const [selectedPens, setSelectedPens] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterOccupation, setFilterOccupation] = useState<'all' | 'full' | 'partial'>('all');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(saleDesignationSchema),
    defaultValues: {
      penNumbers: [],
      scheduledDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
      estimatedPricePerArroba: 320, // Default price
    }
  });
  
  const watchedPricePerArroba = watch('estimatedPricePerArroba');
  
  // Update form value when selectedPens changes
  useEffect(() => {
    setValue('penNumbers', selectedPens);
  }, [selectedPens, setValue]);
  
  // Get slaughterhouses
  const slaughterhouses = partners.filter(p => p.type === 'slaughterhouse' && p.isActive);
  
  // Get all occupied pens with their lots
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
      
      // Get sector from pen registration
      const penReg = pen.penNumber;
      
      return {
        ...pen,
        lotsInPen,
        totalAnimals,
        totalWeight,
        sector: penReg
      };
    });
  
  // Group pens by sector
  const sectors = [...new Set(occupiedPens.map(pen => {
    // Extract sector from location (e.g., "Setor A" -> "A")
    const sectorMatch = pen.sector.match(/Setor\s+(\w+)/i);
    return sectorMatch ? sectorMatch[1] : 'Sem Setor';
  }))];
  
  // Filter pens based on search and filters
  const filteredPens = occupiedPens.filter(pen => {
    // Filter by search term
    if (searchTerm && !pen.penNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
      // Also check if any lot in this pen matches the search
      const lotMatches = pen.lotsInPen.some(item => 
        item.lot?.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!lotMatches) return false;
    }
    
    // Filter by sector
    if (filterSector !== 'all') {
      const sectorMatch = pen.sector.match(/Setor\s+(\w+)/i);
      const penSector = sectorMatch ? sectorMatch[1] : 'Sem Setor';
      if (penSector !== filterSector) return false;
    }
    
    // Filter by occupation
    if (filterOccupation !== 'all') {
      const occupationRate = pen.currentAnimals / pen.capacity;
      if (filterOccupation === 'full' && occupationRate < 0.9) return false;
      if (filterOccupation === 'partial' && occupationRate >= 0.9) return false;
    }
    
    return true;
  });
  
  // Calculate totals for selected pens
  const selectedPensData = occupiedPens.filter(pen => selectedPens.includes(pen.penNumber));
  const totalSelectedAnimals = selectedPensData.reduce((sum, pen) => sum + pen.totalAnimals, 0);
  const totalSelectedWeight = selectedPensData.reduce((sum, pen) => sum + pen.totalWeight, 0);
  const totalArrobas = totalSelectedWeight / 15;
  const estimatedRevenue = totalArrobas * watchedPricePerArroba;
  
  // Toggle pen selection
  const togglePenSelection = (penNumber: string) => {
    if (selectedPens.includes(penNumber)) {
      setSelectedPens(selectedPens.filter(p => p !== penNumber));
    } else {
      setSelectedPens([...selectedPens, penNumber]);
    }
  };
  
  // Select all filtered pens
  const selectAllFilteredPens = () => {
    const filteredPenNumbers = filteredPens.map(pen => pen.penNumber);
    setSelectedPens(filteredPenNumbers);
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    setSelectedPens([]);
  };

  const handleFormSubmit = (data: any) => {
    // In a real implementation, this would add the selected pens to the sales pipeline
    
    // Show success notification
    alert(`${selectedPens.length} currais designados para abate com sucesso!`);
    
    reset();
    setSelectedPens([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Designar Currais para Abate</h2>
            <p className="text-warning-100 text-sm mt-1">
              Selecione os currais que serão enviados para abate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warning-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-b3x-navy-900 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-warning-600" />
                Filtrar Currais
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar curral ou lote..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent w-48"
                  />
                </div>
                
                {/* Sector Filter */}
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                >
                  <option value="all">Todos os Setores</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>Setor {sector}</option>
                  ))}
                </select>
                
                {/* Occupation Filter */}
                <select
                  value={filterOccupation}
                  onChange={(e) => setFilterOccupation(e.target.value as 'all' | 'full' | 'partial')}
                  className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                >
                  <option value="all">Qualquer Ocupação</option>
                  <option value="full">Lotação Completa (≥90%)</option>
                  <option value="partial">Lotação Parcial (≤90%)</option>
                </select>
                
                {/* Select/Clear All */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredPens}
                    className="px-3 py-2 text-xs bg-warning-500 text-white rounded-lg hover:bg-warning-600 transition-colors"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={clearAllSelections}
                    className="px-3 py-2 text-xs bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                  >
                    Limpar Seleção
                  </button>
                </div>
              </div>
            </div>
            
            {/* Pens Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-2">
              {filteredPens.length > 0 ? (
                filteredPens.map(pen => (
                  <div
                    key={pen.penNumber}
                    className={clsx(
                      "border-2 rounded-lg p-3 cursor-pointer transition-all duration-200",
                      selectedPens.includes(pen.penNumber)
                        ? "border-warning-400 bg-warning-50 shadow-md"
                        : "border-neutral-200 hover:border-warning-300 bg-white"
                    )}
                    onClick={() => togglePenSelection(pen.penNumber)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-b3x-navy-900 text-sm flex items-center">
                        <Home className="w-3 h-3 mr-1 text-warning-600" />
                        Curral {pen.penNumber}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded-full">
                        {pen.currentAnimals}/{pen.capacity}
                      </span>
                    </div>
                    
                    {/* Lots in this pen */}
                    <div className="space-y-1 mt-2">
                      {pen.lotsInPen.map(({ lot, allocation }) => (
                        <div key={lot?.id} className="text-xs flex justify-between items-center">
                          <span className="text-neutral-700">Lote {lot?.lotNumber}</span>
                          <span className="font-medium text-b3x-navy-900">{allocation.currentQuantity} animais</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-neutral-100 flex justify-between text-xs">
                      <span className="text-neutral-600">Peso total:</span>
                      <span className="font-medium text-b3x-navy-900">{pen.totalWeight.toLocaleString('pt-BR')} kg</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Home className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 text-sm">Nenhum curral encontrado com os filtros atuais</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Pens Summary */}
          <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-warning-600" />
              Resumo da Seleção
            </h3>
            
            {selectedPens.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-base font-bold text-b3x-navy-900">{selectedPens.length}</div>
                    <div className="text-xs text-neutral-600">Currais Selecionados</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-base font-bold text-b3x-navy-900">{totalSelectedAnimals}</div>
                    <div className="text-xs text-neutral-600">Animais</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-base font-bold text-b3x-navy-900">{totalSelectedWeight.toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-neutral-600">Peso Total (kg)</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-base font-bold text-b3x-navy-900">{totalArrobas.toFixed(1)}</div>
                    <div className="text-xs text-neutral-600">Arrobas (@)</div>
                  </div>
                </div>
                
                {/* Selected pens list */}
                <div className="bg-white rounded-lg p-3 border border-neutral-200 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {selectedPensData.map(pen => (
                      <div key={pen.penNumber} className="px-2 py-1 bg-warning-100 text-warning-800 rounded-lg text-xs flex items-center">
                        <span>Curral {pen.penNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePenSelection(pen.penNumber);
                          }}
                          className="ml-1 p-0.5 hover:bg-warning-200 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg p-4 text-center border border-neutral-200">
                <AlertTriangle className="w-6 h-6 text-warning-500 mx-auto mb-2" />
                <p className="text-neutral-600 text-sm">Nenhum curral selecionado</p>
                <p className="text-xs text-neutral-500 mt-1">Selecione pelo menos um curral para continuar</p>
              </div>
            )}
            
            {errors.penNumbers && (
              <p className="text-error-500 text-xs mt-2">{errors.penNumbers.message}</p>
            )}
          </div>

          {/* Slaughter Details */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Detalhes do Abate
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data Programada *
                </label>
                <input
                  type="date"
                  {...register('scheduledDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                />
                {errors.scheduledDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.scheduledDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Frigorífico *
                </label>
                <select
                  {...register('slaughterhouseId')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                >
                  <option value="">Selecione um frigorífico</option>
                  {slaughterhouses.map(slaughterhouse => (
                    <option key={slaughterhouse.id} value={slaughterhouse.id}>
                      {slaughterhouse.name} - {slaughterhouse.city}/{slaughterhouse.state}
                    </option>
                  ))}
                </select>
                {errors.slaughterhouseId && (
                  <p className="text-error-500 text-xs mt-1">{errors.slaughterhouseId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Preço R$/@ Estimado *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('estimatedPricePerArroba', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                />
                {errors.estimatedPricePerArroba && (
                  <p className="text-error-500 text-xs mt-1">{errors.estimatedPricePerArroba.message}</p>
                )}
              </div>
            </div>
            
            {/* Financial Summary */}
            {selectedPens.length > 0 && (
              <div className="mt-4 bg-warning-50 rounded-lg p-3 border border-warning-200">
                <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                  <DollarSign className="w-3 h-3 mr-2 text-warning-600" />
                  Resumo Financeiro Estimado
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      {totalArrobas.toFixed(1)}
                    </div>
                    <div className="text-xs text-neutral-600">Arrobas</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      R$ {watchedPricePerArroba?.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-600">Preço/@</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-success-600">
                      R$ {estimatedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Receita Bruta</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-lime-600">
                      R$ {(estimatedRevenue / totalSelectedAnimals).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Valor/Animal</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transport Planning */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Planejamento de Transporte
            </h3>
            
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-b3x-navy-900">Caminhões Necessários</span>
                  <div className="ml-2 px-2 py-1 bg-info-100 text-info-700 rounded-full text-xs">
                    Estimativa
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-info-600 hover:text-info-700 flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Transportadora
                </button>
              </div>
              
              {selectedPens.length > 0 ? (
                <div className="space-y-2">
                  {/* Truck calculation based on 30 animals per truck */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600">Caminhões de 30 animais:</span>
                    <span className="font-medium text-b3x-navy-900">
                      {Math.ceil(totalSelectedAnimals / 30)} caminhões
                    </span>
                  </div>
                  
                  {/* Truck calculation based on 18 animals per truck */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600">Caminhões de 18 animais:</span>
                    <span className="font-medium text-b3x-navy-900">
                      {Math.ceil(totalSelectedAnimals / 18)} caminhões
                    </span>
                  </div>
                  
                  <div className="mt-3 p-2 bg-info-50 rounded-lg border border-info-200 text-xs text-info-700">
                    <p>
                      <span className="font-medium">Dica:</span> O planejamento detalhado de transporte será feito na etapa de embarque.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-neutral-500 text-sm">
                  Selecione currais para ver a estimativa de caminhões
                </div>
              )}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              placeholder="Observações sobre o abate programado..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={selectedPens.length === 0}
              className="px-4 py-1.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-lg hover:from-warning-600 hover:to-warning-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-3 h-3" />
              <span>Confirmar Designação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
