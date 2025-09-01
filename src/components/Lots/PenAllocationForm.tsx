import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Home, Users, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PenAllocationFormData } from '../../types';
import { usePensApi } from '../../hooks/api/usePensApi';

const penAllocationSchema = z.object({
  penNumber: z.string().min(1, 'Número do curral é obrigatório'),
  lotId: z.string().min(1, 'Selecione um lote'),
  currentQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
});

interface PenAllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  penNumber: string;
}

export const PenAllocationForm: React.FC<PenAllocationFormProps> = ({
  isOpen,
  onClose,
  penNumber
}) => {
  const { cattlePurchases, penAllocations, addPenAllocation, updateCattlePurchase } = useAppStore();
  const { pens, loading: pensLoading } = usePensApi();
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [existingAllocations, setExistingAllocations] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PenAllocationFormData>({
    resolver: zodResolver(penAllocationSchema),
    defaultValues: {
      penNumber,
      lotId: '',
      currentQuantity: 1
    }
  });

  const selectedLotId = watch('lotId');
  const selectedLot = cattlePurchases.find(lot => lot.id === selectedLotId);
  const pen = pens.find(p => p.penNumber === penNumber);
  
  // Atualizar a lista de lotes disponíveis quando o componente montar
  useEffect(() => {
    if (penNumber) {
      // Obter todos os lotes ativos (status 'confined' para lotes já confinados)
      const activeLots = cattlePurchases.filter(lot => lot.status === 'confined' || lot.status === 'reception');
      
      // Obter alocações existentes para este curral
      const currentPenAllocations = penAllocations.filter(alloc => alloc.penNumber === penNumber);
      setExistingAllocations(currentPenAllocations);
      
      // Obter IDs de lotes já alocados neste curral
      const lotsInThisPen = currentPenAllocations.map(alloc => alloc.lotId);
      
      // Filtrar lotes que ainda não foram totalmente alocados
      const lotsWithAvailableAnimals = activeLots.filter(lot => {
        // Obter todas as alocações existentes para este lote
        const lotAllocations = penAllocations.filter(alloc => alloc.lotId === lot.id);
        
        // Calcular o total de animais já alocados
        const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.currentQuantity, 0);
        
        // Incluir lotes que:
        // 1. Já estão neste curral (para permitir adicionar mais animais)
        // 2. OU ainda têm animais disponíveis para alocar
        return lotsInThisPen.includes(lot.id) || totalAllocated < lot.entryQuantity;
      });
      
      setAvailableLots(lotsWithAvailableAnimals);
    }
  }, [penNumber, cattlePurchases, penAllocations]);

  // Quando o lote é selecionado, atualizar a quantidade máxima
  useEffect(() => {
    if (selectedLotId) {
      const lot = cattlePurchases.find(l => l.id === selectedLotId);
      if (lot) {
        // Obter todas as alocações existentes para este lote
        const lotAllocations = penAllocations.filter(alloc => alloc.lotId === lot.id);
        
        // Calcular o total de animais já alocados
        const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.currentQuantity, 0);
        
        // Calcular quantos animais ainda estão disponíveis para alocar
        const availableQuantity = lot.entryQuantity - totalAllocated;
        
        // Definir a quantidade como o mínimo entre os animais disponíveis e a capacidade restante do curral
        const penCapacityRemaining = pen ? pen.capacity - pen.currentOccupancy : 0;
        const maxQuantity = Math.min(availableQuantity, penCapacityRemaining);
        
        setValue('currentQuantity', maxQuantity);
      }
    }
  }, [selectedLotId, cattlePurchases, penAllocations, pen, setValue]);

  const handleFormSubmit = (data: PenAllocationFormData) => {
    if (!selectedLot) return;

    // Verificar se a quantidade não excede o disponível
    const lotAllocations = penAllocations.filter(alloc => alloc.lotId === data.lotId);
    const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.currentQuantity, 0);
    const availableQuantity = selectedLot.entryQuantity - totalAllocated;
    
    if (data.currentQuantity > availableQuantity) {
      alert(`Quantidade excede o disponível. Máximo disponível: ${availableQuantity} animais.`);
      return;
    }

    // Verificar se a capacidade do curral não será excedida
    if (pen && pen.currentOccupancy + data.currentQuantity > pen.capacity) {
      alert(`Capacidade do curral será excedida. Capacidade restante: ${pen.capacity - pen.currentOccupancy} animais.`);
      return;
    }

    // Calcular o peso proporcional
    const currentWeightProportion = selectedLot.entryWeight / selectedLot.entryQuantity * data.currentQuantity;

    // Adicionar alocação
    addPenAllocation({
      penNumber: data.penNumber,
      lotId: data.lotId,
      currentQuantity: data.currentQuantity,
      entryWeight: currentWeightProportion,
      entryDate: new Date()
    });

    // Atualizar o lote com informações de alocação
    updateCattlePurchase(selectedLot.id, { 
      status: 'confined',
      currentQuantity: selectedLot.currentQuantity ? selectedLot.currentQuantity - data.currentQuantity : selectedLot.entryQuantity - data.currentQuantity
    });
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Alocar Animais no Curral</h2>
            <p className="text-b3x-navy-700 text-sm mt-1">Curral {penNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-lime-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Pen Info - Mais compacto */}
          {pen && (
            <div className="bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-xl p-4 border border-b3x-lime-200">
              <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2 text-b3x-lime-600" />
                Informações do Curral {penNumber}
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-b3x-navy-900">{pen.capacity}</div>
                  <div className="text-xs text-neutral-600">Capacidade</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-success-600">{pen.currentOccupancy}</div>
                  <div className="text-xs text-neutral-600">Ocupação Atual</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-warning-600">{pen.capacity - pen.currentOccupancy}</div>
                  <div className="text-xs text-neutral-600">Disponível</div>
                </div>
              </div>
              
              {/* Mostrar alocações existentes neste curral */}
              {existingAllocations.length > 0 && (
                <div className="mt-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-3 h-3 text-neutral-600" />
                    <span className="font-medium text-neutral-700 text-xs">Lotes Alocados Neste Curral</span>
                  </div>
                  <div className="space-y-1">
                    {existingAllocations.map(alloc => {
                      const lot = cattlePurchases.find(l => l.id === alloc.lotId);
                      return (
                        <div key={alloc.id} className="flex justify-between text-xs">
                          <span>Lote {lot?.lotNumber || 'Desconhecido'}:</span>
                          <span className="font-medium">{alloc.currentQuantity} animais</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lot Selection - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Lote *
            </label>
            <select
              {...register('lotId')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              disabled={pensLoading}
            >
              <option value="">{pensLoading ? 'Carregando...' : 'Selecione um lote'}</option>
              {availableLots.map(lot => {
                // Calcular animais já alocados
                const lotAllocations = penAllocations.filter(alloc => alloc.lotId === lot.id);
                const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.currentQuantity, 0);
                const availableQuantity = lot.entryQuantity - totalAllocated;
                
                // Verificar se este lote já está alocado neste curral
                const isAllocatedInThisPen = lotAllocations.some(alloc => alloc.penNumber === penNumber);
                
                return (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotNumber} - {availableQuantity} animais disponíveis
                    {isAllocatedInThisPen ? ' (já neste curral)' : ''}
                  </option>
                );
              })}
            </select>
            {errors.lotId && (
              <p className="text-error-500 text-xs mt-1">{errors.lotId.message}</p>
            )}
            
            {availableLots.length === 0 && (
              <p className="text-warning-500 text-xs mt-1">
                Não há lotes disponíveis para alocação. Todos os lotes já estão totalmente alocados.
              </p>
            )}
          </div>

          {/* Quantity - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Quantidade de Animais *
            </label>
            <input
              type="number"
              {...register('currentQuantity', { valueAsNumber: true })}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              placeholder={selectedLot ? `Máximo: ${selectedLot.entryQuantity}` : 'Selecione um lote primeiro'}
            />
            {errors.currentQuantity && (
              <p className="text-error-500 text-xs mt-1">{errors.currentQuantity.message}</p>
            )}
          </div>

          {/* Lot Details - Mais compacto */}
          {selectedLot && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h4 className="font-medium text-b3x-navy-900 mb-2 text-xs flex items-center">
                <Users className="w-3 h-3 mr-2" />
                Detalhes do Lote {selectedLot.lotNumber}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-600">Quantidade Total:</span>
                  <div className="font-medium">{selectedLot.entryQuantity} animais</div>
                </div>
                <div>
                  <span className="text-neutral-600">Peso Total:</span>
                  <div className="font-medium">{selectedLot.entryWeight.toLocaleString('pt-BR')} kg</div>
                </div>
                <div>
                  <span className="text-neutral-600">Data de Entrada:</span>
                  <div className="font-medium">{selectedLot.entryDate.toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <span className="text-neutral-600">Peso Médio:</span>
                  <div className="font-medium">
                    {(selectedLot.entryWeight / selectedLot.entryQuantity).toFixed(1)} kg/animal
                  </div>
                </div>
              </div>
              
              {/* Mostrar alocações existentes */}
              {penAllocations.filter(alloc => alloc.lotId === selectedLot.id).length > 0 && (
                <div className="mt-3 p-2 bg-warning-50 rounded-lg border border-warning-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-warning-600" />
                    <span className="font-medium text-warning-700 text-xs">Alocações Existentes</span>
                  </div>
                  <div className="space-y-1">
                    {penAllocations.filter(alloc => alloc.lotId === selectedLot.id).map(alloc => (
                      <div key={alloc.id} className="flex justify-between text-xs">
                        <span>Curral {alloc.penNumber}:</span>
                        <span className="font-medium">{alloc.currentQuantity} animais</span>
                      </div>
                    ))}
                    <div className="border-t border-warning-200 pt-1 mt-1 flex justify-between text-xs font-medium">
                      <span>Total Alocado:</span>
                      <span>
                        {penAllocations
                          .filter(alloc => alloc.lotId === selectedLot.id)
                          .reduce((sum, alloc) => sum + alloc.currentQuantity, 0)} 
                        de {selectedLot.entryQuantity} animais
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={!selectedLot || availableLots.length === 0}
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Home className="w-3 h-3" />
              <span>Alocar Animais</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};