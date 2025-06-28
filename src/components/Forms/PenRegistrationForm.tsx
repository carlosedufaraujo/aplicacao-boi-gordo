import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Home } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PenRegistrationFormData } from '../../types';

const penRegistrationSchema = z.object({
  penNumber: z.string().min(1, 'Número do curral é obrigatório'),
  capacity: z.number().min(1, 'Capacidade deve ser maior que 0'),
  location: z.string().optional(),
  description: z.string().optional(),
});

interface PenRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  penNumber?: string; // Para edição
}

export const PenRegistrationForm: React.FC<PenRegistrationFormProps> = ({
  isOpen,
  onClose,
  penNumber
}) => {
  const { addPenRegistration, updatePenRegistration, penRegistrations, penStatuses } = useAppStore();

  const existingPen = penNumber ? penRegistrations.find(pen => pen.penNumber === penNumber) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm<PenRegistrationFormData>({
    resolver: zodResolver(penRegistrationSchema),
    defaultValues: {
      penNumber: existingPen?.penNumber || penNumber || '',
      capacity: existingPen?.capacity || 130,
      location: existingPen?.location || '',
      description: existingPen?.description || ''
    }
  });

  const handleFormSubmit = (data: PenRegistrationFormData) => {
    if (existingPen) {
      // Editar curral existente
      updatePenRegistration(existingPen.id, data);
      
      // Atualizar todos os currais com a mesma localização anterior para a nova localização
      if (data.location !== existingPen.location) {
        const pensInSameSector = penRegistrations.filter(
          pen => pen.location === existingPen.location && pen.id !== existingPen.id
        );
        
        pensInSameSector.forEach(pen => {
          updatePenRegistration(pen.id, { location: data.location });
        });
      }
    } else {
      // Verificar se o número do curral já existe
      const existingPenByNumber = penRegistrations.find(pen => pen.penNumber === data.penNumber);
      if (existingPenByNumber) {
        setError('penNumber', {
          type: 'manual',
          message: 'Este número de curral já existe'
        });
        return;
      }

      addPenRegistration({
        ...data,
        isActive: true
      });
    }
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">
              {existingPen ? 'Editar Curral' : 'Cadastrar Novo Curral'}
            </h2>
            <p className="text-success-100 text-sm mt-1">
              {existingPen ? `Curral ${existingPen.penNumber}` : 'Adicione um novo curral ao sistema'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-success-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Basic Information - Mais compacto */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Home className="w-4 h-4 mr-2 text-success-600" />
              Informações do Curral
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-success-700 mb-1">
                  Número do Curral *
                </label>
                <input
                  type="text"
                  {...register('penNumber')}
                  disabled={!!existingPen} // Não permitir editar número se já existe
                  className="w-full px-3 py-2 text-sm border border-success-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white/90 transition-all duration-200 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  placeholder="Ex: 25, A1, B2"
                />
                {errors.penNumber && (
                  <p className="text-error-500 text-xs mt-1">{errors.penNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-success-700 mb-1">
                  Capacidade (animais) *
                </label>
                <input
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-success-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 130"
                />
                {errors.capacity && (
                  <p className="text-error-500 text-xs mt-1">{errors.capacity.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information - Mais compacto */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Localização
              </label>
              <input
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="Ex: Setor A, Área Norte, Bloco 1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="Observações sobre o curral..."
              />
            </div>
          </div>

          {/* Preview - Mais compacto */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-b3x-navy-900 mb-2">Preview do Curral:</h4>
            <div className="bg-white rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-b3x-navy-900 text-sm">
                    Curral {penNumber || 'Número'}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Capacidade: 130 animais
                  </div>
                </div>
                <div className="px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs">
                  Disponível
                </div>
              </div>
            </div>
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
              className="px-4 py-1.5 bg-gradient-to-r from-success-500 to-success-600 text-white font-medium rounded-lg hover:from-success-600 hover:to-success-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Home className="w-3 h-3" />
              <span>{existingPen ? 'Salvar Alterações' : 'Cadastrar Curral'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};