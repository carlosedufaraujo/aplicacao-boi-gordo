import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { LotMovementFormData } from '../../types';

const lotMovementSchema = z.object({
  lotId: z.string().min(1, 'Selecione um lote'),
  penNumber: z.string().min(1, 'Selecione um curral'),
  fromPen: z.string().optional(),
  toPen: z.string().min(1, 'Curral de destino é obrigatório'),
  currentQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  observations: z.string().optional(),
});

interface LotMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  lotId?: string;
}

export const LotMovementForm: React.FC<LotMovementFormProps> = ({
  isOpen,
  onClose,
  lotId
}) => {
  const { cattlePurchases, penAllocations, penStatuses, addLotMovement, getAvailablePens } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<LotMovementFormData>({
    resolver: zodResolver(lotMovementSchema),
    defaultValues: {
      lotId: lotId || '',
      penNumber: '',
      currentQuantity: 1
    }
  });

  const selectedLotId = watch('lotId');
  const selectedPenNumber = watch('penNumber');
  const selectedLot = cattlePurchases.find(lot => lot.id === selectedLotId);
  const availablePens = getAvailablePens();

  // Quando o lotId é fornecido diretamente, preencher o penNumber automaticamente
  React.useEffect(() => {
    if (lotId) {
      const lot = cattlePurchases.find(l => l.id === lotId);
      if (lot && lot.penNumber) {
        setValue('penNumber', lot.penNumber);
        setValue('fromPen', lot.penNumber);
      }
    }
  }, [lotId, cattlePurchases, setValue]);
  
  // Quando o penNumber muda, filtrar os lotes disponíveis e atualizar fromPen
  const lotsInSelectedPen = React.useMemo(() => {
    if (!selectedPenNumber) return [];
    
    // Encontrar alocações para o curral selecionado
    const allocations = penAllocations.filter(alloc => alloc.penNumber === selectedPenNumber);
    
    // Mapear para os lotes correspondentes
    return allocations.map(alloc => {
      const lot = cattlePurchases.find(l => l.id === alloc.lotId);
      return lot;
    }).filter(Boolean);
  }, [selectedPenNumber, penAllocations, cattlePurchases]);
  
  // Se houver apenas um lote no curral, selecioná-lo automaticamente
  React.useEffect(() => {
    if (lotsInSelectedPen.length === 1 && !selectedLotId) {
      setValue('lotId', lotsInSelectedPen[0]?.id || '');
    }
  }, [lotsInSelectedPen, selectedLotId, setValue]);
  
  // Quando o lote é selecionado, atualizar a quantidade máxima e o curral de origem
  React.useEffect(() => {
    if (selectedLotId) {
      const lot = cattlePurchases.find(l => l.id === selectedLotId);
      if (lot) {
        setValue('fromPen', lot.penNumber);
        setValue('currentQuantity', lot.entryQuantity - lot.deaths);
      }
    }
  }, [selectedLotId, cattlePurchases, setValue]);

  const handleFormSubmit = (data: LotMovementFormData) => {
    // Garantir que fromPen esteja definido
    const fromPen = data.fromPen || selectedLot?.penNumber || '';
    
    addLotMovement({
      ...data,
      fromPen,
      date: new Date()
    });
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-neutral-700 to-neutral-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Movimentação de Curral</h2>
            <p className="text-neutral-300 text-sm mt-1">
              Registre a movimentação de animais entre currais
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Curral Selection - NOVO */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Curral de Origem *
            </label>
            <select
              {...register('penNumber')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
              disabled={!!lotId} // Desabilitar se o lotId for fornecido diretamente
            >
              <option value="">Selecione um curral</option>
              {penStatuses
                .filter(pen => pen.status === 'occupied')
                .map(pen => {
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
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

          {/* Movement Details - Mais compacto */}
          {selectedLot && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm">Detalhes da Movimentação</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Curral Atual
                  </label>
                  <input
                    type="text"
                    value={`Curral ${selectedLot.penNumber}`}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600"
                  />
                  <input type="hidden" {...register('fromPen')} value={selectedLot.penNumber} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Curral de Destino *
                  </label>
                  <select
                    {...register('toPen')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                  >
                    <option value="">Selecione o curral de destino</option>
                    {availablePens
                      .filter(pen => pen.penNumber !== selectedLot.penNumber) // Excluir o curral atual
                      .map(pen => (
                        <option key={pen.penNumber} value={pen.penNumber}>
                          Curral {pen.penNumber} - {pen.currentAnimals}/{pen.capacity} animais
                        </option>
                      ))
                    }
                  </select>
                  {errors.toPen && (
                    <p className="text-error-500 text-xs mt-1">{errors.toPen.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Quantidade de Animais *
                  </label>
                  <input
                    type="number"
                    {...register('currentQuantity', { valueAsNumber: true })}
                    max={selectedLot.entryQuantity - selectedLot.deaths}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                    placeholder={`Máximo: ${selectedLot.entryQuantity - selectedLot.deaths}`}
                  />
                  {errors.currentQuantity && (
                    <p className="text-error-500 text-xs mt-1">{errors.currentQuantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Motivo *
                  </label>
                  <select
                    {...register('reason')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                  >
                    <option value="">Selecione o motivo</option>
                    <option value="Separação por peso">Separação por peso</option>
                    <option value="Separação por sexo">Separação por sexo</option>
                    <option value="Tratamento sanitário">Tratamento sanitário</option>
                    <option value="Manutenção do curral">Manutenção do curral</option>
                    <option value="Otimização de espaço">Otimização de espaço</option>
                    <option value="Outros">Outros</option>
                  </select>
                  {errors.reason && (
                    <p className="text-error-500 text-xs mt-1">{errors.reason.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observations - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
              placeholder="Observações adicionais sobre a movimentação..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white font-medium rounded-lg hover:from-neutral-700 hover:to-neutral-800 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <ArrowRight className="w-3 h-3" />
              <span>Registrar Movimentação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};