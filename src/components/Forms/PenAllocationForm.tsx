import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Home, Users } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PenAllocationFormData } from '../../types';

const penAllocationSchema = z.object({
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
  const { cattlePurchases, penStatuses, addPenAllocation } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PenAllocationFormData>({
    resolver: zodResolver(penAllocationSchema),
    defaultValues: {
      penNumber,
      currentQuantity: 1
    }
  });

  const selectedLotId = watch('lotId');
  const selectedLot = cattlePurchases.find(lot => lot.id === selectedLotId);
  const pen = penStatuses.find(p => p.penNumber === penNumber);
  
  // Lotes confinados que ainda têm animais não totalmente alocados
  const availableLots = cattlePurchases.filter(lot => lot.status === 'active');

  const handleFormSubmit = (data: PenAllocationFormData) => {
    if (!selectedLot) return;

    addPenAllocation({
      penNumber,
      lotId: data.lotId,
      currentQuantity: data.currentQuantity,
      entryWeight: (selectedLot.entryWeight / selectedLot.entryQuantity) * data.currentQuantity,
      entryDate: selectedLot.entryDate
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
                  <div className="text-base font-bold text-success-600">{pen.currentAnimals}</div>
                  <div className="text-xs text-neutral-600">Ocupação Atual</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-warning-600">{pen.capacity - pen.currentAnimals}</div>
                  <div className="text-xs text-neutral-600">Disponível</div>
                </div>
              </div>
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
            >
              <option value="">Selecione um lote</option>
              {availableLots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNumber} - {lot.entryQuantity} animais ({lot.entryWeight.toLocaleString('pt-BR')} kg)
                </option>
              ))}
            </select>
            {errors.lotId && (
              <p className="text-error-500 text-xs mt-1">{errors.lotId.message}</p>
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
              max={selectedLot ? selectedLot.entryQuantity : undefined}
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
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
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