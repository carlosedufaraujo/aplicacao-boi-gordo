import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Scale } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { WeightReadingFormData } from '../../types';

const weightReadingSchema = z.object({
  lotId: z.string().min(1, 'Selecione um lote'),
  penNumber: z.string().min(1, 'Selecione um curral'),
  date: z.date(),
  sampleWeight: z.number().min(1, 'Peso da amostra deve ser maior que 0'),
  sampleQuantity: z.number().min(1, 'Quantidade da amostra deve ser maior que 0'),
  technician: z.string().optional(),
  observations: z.string().optional(),
});

interface WeightReadingFormProps {
  isOpen: boolean;
  onClose: () => void;
  lotId?: string;
}

export const WeightReadingForm: React.FC<WeightReadingFormProps> = ({
  isOpen,
  onClose,
  lotId
}) => {
  const { cattleLots, penAllocations, penStatuses, addWeightReading } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<WeightReadingFormData>({
    resolver: zodResolver(weightReadingSchema),
    defaultValues: {
      lotId: lotId || '',
      penNumber: '',
      date: new Date(),
      sampleQuantity: 5
    }
  });

  const watchedValues = watch();
  const selectedLotId = watch('lotId');
  const selectedPenNumber = watch('penNumber');
  
  // Quando o lotId é fornecido diretamente, preencher o penNumber automaticamente
  React.useEffect(() => {
    if (lotId) {
      const lot = cattleLots.find(l => l.id === lotId);
      if (lot && lot.penNumber) {
        setValue('penNumber', lot.penNumber);
      }
    }
  }, [lotId, cattleLots, setValue]);
  
  // Quando o penNumber muda, filtrar os lotes disponíveis
  const lotsInSelectedPen = React.useMemo(() => {
    if (!selectedPenNumber) return [];
    
    // Encontrar alocações para o curral selecionado
    const allocations = penAllocations.filter(alloc => alloc.penNumber === selectedPenNumber);
    
    // Mapear para os lotes correspondentes
    return allocations.map(alloc => {
      const lot = cattleLots.find(l => l.id === alloc.lotId);
      return lot;
    }).filter(Boolean);
  }, [selectedPenNumber, penAllocations, cattleLots]);
  
  // Se houver apenas um lote no curral, selecioná-lo automaticamente
  React.useEffect(() => {
    if (lotsInSelectedPen.length === 1 && !selectedLotId) {
      setValue('lotId', lotsInSelectedPen[0]?.id || '');
    }
  }, [lotsInSelectedPen, selectedLotId, setValue]);
  
  const averageWeight = watchedValues.sampleWeight && watchedValues.sampleQuantity
    ? watchedValues.sampleWeight / watchedValues.sampleQuantity
    : 0;

  const handleFormSubmit = (data: WeightReadingFormData) => {
    addWeightReading({
      ...data,
      averageWeight: data.sampleWeight / data.sampleQuantity
    });
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Nova Pesagem</h2>
            <p className="text-warning-100 text-sm mt-1">
              Registre uma nova pesagem por amostragem
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
          {/* Curral Selection - NOVO */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Curral *
            </label>
            <select
              {...register('penNumber')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              disabled={!!lotId} // Desabilitar se o lotId for fornecido diretamente
            >
              <option value="">Selecione um curral</option>
              {penStatuses
                .filter(pen => pen.status === 'occupied')
                .map(pen => {
                  const penReg = penAllocations.find(alloc => alloc.penNumber === pen.penNumber);
                  return (
                    <option key={pen.penNumber} value={pen.penNumber}>
                      Curral {pen.penNumber} - {pen.currentAnimals} animais
                    </option>
                  );
                })
              }
            </select>
            {errors.penNumber && (
              <p className="text-error-500 text-xs mt-1">{errors.penNumber.message}</p>
            )}
          </div>

          {/* Lot Selection - Filtrado por curral */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Lote *
            </label>
            <select
              {...register('lotId')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              disabled={!!lotId || lotsInSelectedPen.length === 0} // Desabilitar se o lotId for fornecido ou não houver lotes
            >
              <option value="">Selecione um lote</option>
              {lotsInSelectedPen.map(lot => (
                <option key={lot?.id} value={lot?.id}>
                  {lot?.lotNumber} - {lot?.entryQuantity} animais
                </option>
              ))}
            </select>
            {errors.lotId && (
              <p className="text-error-500 text-xs mt-1">{errors.lotId.message}</p>
            )}
            
            {selectedPenNumber && lotsInSelectedPen.length === 0 && (
              <p className="text-warning-500 text-xs mt-1">
                Não há lotes alocados neste curral.
              </p>
            )}
          </div>

          {/* Date - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Data da Pesagem *
            </label>
            <input
              type="date"
              {...register('date', { valueAsDate: true })}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Weight Data - Mais compacto */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
              <Scale className="w-4 h-4 mr-2" />
              Dados da Pesagem
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso Total da Amostra (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('sampleWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                  placeholder="Ex: 2100"
                />
                {errors.sampleWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.sampleWeight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade de Animais na Amostra *
                </label>
                <input
                  type="number"
                  {...register('sampleQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                  placeholder="Ex: 5"
                />
                {errors.sampleQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.sampleQuantity.message}</p>
                )}
              </div>
            </div>

            {/* Calculated Average */}
            {averageWeight > 0 && (
              <div className="bg-white rounded-lg p-3 border-2 border-warning-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-700">Peso Médio por Animal:</span>
                  <span className="text-lg font-bold text-warning-600">
                    {averageWeight.toFixed(1)} kg
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Técnico Responsável
            </label>
            <input
              type="text"
              {...register('technician')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              placeholder="Ex: João Santos"
            />
          </div>

          {/* Observations - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              placeholder="Observações sobre a pesagem..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-lg hover:from-warning-600 hover:to-warning-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Scale className="w-3 h-3" />
              <span>Registrar Pesagem</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};