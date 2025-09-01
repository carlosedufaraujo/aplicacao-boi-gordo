import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Heart, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattlePurchase, HealthProtocolFormData } from '../../types';

const healthProtocolSchema = z.object({
  protocoledQuantity: z.number().min(1, 'Quantidade protocolada deve ser maior que 0'),
  totalWeight: z.number().min(1, 'Peso total deve ser maior que 0'),
  sickAnimals: z.number().min(0, 'Animais enfermos deve ser maior ou igual a 0'),
  protocol: z.string().min(1, 'Protocolo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cost: z.number().min(0, 'Custo deve ser maior ou igual a 0'),
  veterinarian: z.string().optional(),
  supplier: z.string().optional(),
  observations: z.string().optional(),
});

interface HealthProtocolFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: CattlePurchase;
}

export const HealthProtocolForm: React.FC<HealthProtocolFormProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { addHealthProtocol, moveCattlePurchaseToNextStage, cattlePurchases } = useAppStore();

  // Encontrar o lote relacionado a esta ordem
  const relatedLot = cattlePurchases.find(lot => lot.purchaseId === order.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError
  } = useForm<HealthProtocolFormData>({
    resolver: zodResolver(healthProtocolSchema),
    defaultValues: {
      date: new Date(),
      protocoledQuantity: relatedLot?.entryQuantity || order.currentQuantity,
      totalWeight: relatedLot?.entryWeight || order.totalWeight,
      sickAnimals: 0,
      cost: 0
    }
  });

  const watchedValues = watch();
  
  // Verificar se quantidade protocolada é diferente da quantidade de entrada
  const currentQuantityDifference = relatedLot && watchedValues.protocoledQuantity !== relatedLot.entryQuantity;
  const currentQuantityLoss = relatedLot ? relatedLot.entryQuantity - (watchedValues.protocoledQuantity || 0) : 0;

  const handleFormSubmit = (data: HealthProtocolFormData) => {
    if (!relatedLot) {
      setError('protocoledQuantity', {
        type: 'manual',
        message: 'Lote não encontrado para esta ordem'
      });
      return;
    }

    // Adicionar protocolo sanitário
    addHealthProtocol({
      ...data,
      lotId: relatedLot.id
    });

    // Avançar para próxima etapa (confined)
    moveCattlePurchaseToNextStage(order.id);
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Protocolo Sanitário</h2>
            <p className="text-purple-200 text-sm mt-1">Ordem: {order.code} {relatedLot && `• Lote: ${relatedLot.lotNumber}`}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Lot Summary - Mais compacto */}
          {relatedLot && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 shadow-soft">
              <h3 className="text-base font-bold text-b3x-navy-900 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-2 text-purple-600" />
                Resumo do Lote
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                  <span className="text-xs text-neutral-600 block mb-1">Lote:</span>
                  <div className="text-lg font-bold text-b3x-navy-900">{relatedLot.lotNumber}</div>
                  <div className="text-xs text-neutral-500">Curral {relatedLot.penNumber}</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                  <span className="text-xs text-neutral-600 block mb-1">Quantidade:</span>
                  <div className="text-lg font-bold text-b3x-navy-900">{relatedLot.entryQuantity}</div>
                  <div className="text-xs text-neutral-500">animais</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                  <span className="text-xs text-neutral-600 block mb-1">Peso Total:</span>
                  <div className="text-lg font-bold text-b3x-navy-900">{relatedLot.entryWeight.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-neutral-500">kg</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                  <span className="text-xs text-neutral-600 block mb-1">Data Entrada:</span>
                  <div className="text-base font-bold text-purple-600">{relatedLot.entryDate.toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Protocol Data - Mais compacto */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-bold text-b3x-navy-900 mb-4 flex items-center">
              <Heart className="w-4 h-4 mr-2 text-purple-600" />
              Dados do Protocolo Sanitário
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade de Animais Protocolados *
                </label>
                <input
                  type="number"
                  {...register('protocoledQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder={relatedLot ? `Entrada: ${relatedLot.entryQuantity}` : `Compra: ${order.currentQuantity}`}
                />
                {errors.protocoledQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.protocoledQuantity.message}</p>
                )}
                
                {/* Alerta de diferença na quantidade */}
                {currentQuantityDifference && (
                  <div className={`mt-2 p-2 rounded-lg ${currentQuantityLoss > 0 ? 'bg-error-50 border border-error-200' : 'bg-info-50 border border-info-200'}`}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`w-3 h-3 ${currentQuantityLoss > 0 ? 'text-error-600' : 'text-info-600'}`} />
                      <p className={`text-xs font-medium ${currentQuantityLoss > 0 ? 'text-error-700' : 'text-info-700'}`}>
                        {currentQuantityLoss > 0 
                          ? `⚠️ Quantidade a menos: ${currentQuantityLoss} animais`
                          : `ℹ️ Quantidade a mais: ${Math.abs(currentQuantityLoss)} animais`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso Total (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('totalWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder={relatedLot ? `Entrada: ${relatedLot.entryWeight}` : `Compra: ${order.totalWeight}`}
                />
                {errors.totalWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.totalWeight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Animais Enfermos *
                </label>
                <input
                  type="number"
                  {...register('sickAnimals', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Ex: 0"
                />
                {errors.sickAnimals && (
                  <p className="text-error-500 text-xs mt-1">{errors.sickAnimals.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Protocolo *
                </label>
                <select
                  {...register('protocol')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                >
                  <option value="">Selecione o protocolo</option>
                  <option value="Vermifugação">Vermifugação</option>
                  <option value="Vacinação">Vacinação</option>
                  <option value="Antibiótico">Antibiótico</option>
                  <option value="Anti-inflamatório">Anti-inflamatório</option>
                  <option value="Vitaminas">Vitaminas</option>
                  <option value="Carrapaticida">Carrapaticida</option>
                  <option value="Protocolo Completo">Protocolo Completo</option>
                  <option value="Outros">Outros</option>
                </select>
                {errors.protocol && (
                  <p className="text-error-500 text-xs mt-1">{errors.protocol.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Custo Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('cost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Ex: 1500.00"
                />
                {errors.cost && (
                  <p className="text-error-500 text-xs mt-1">{errors.cost.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Descrição do Protocolo *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="Ex: Aplicação de protocolo sanitário completo conforme normas técnicas..."
            />
            {errors.description && (
              <p className="text-error-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Veterinário Responsável
              </label>
              <input
                type="text"
                {...register('veterinarian')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Ex: Dr. Carlos Mendes"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                {...register('supplier')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Ex: Agropecuária Central"
              />
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="Observações adicionais sobre o protocolo..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Heart className="w-3 h-3" />
              <span>Confirmar Protocolo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};