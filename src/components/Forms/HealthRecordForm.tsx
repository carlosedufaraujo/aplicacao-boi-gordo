import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Heart, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { HealthRecordFormData } from '../../types';

const healthRecordSchema = z.object({
  lotId: z.string().min(1, 'Selecione um lote'),
  penNumber: z.string().min(1, 'Selecione um curral'),
  date: z.date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  protocol: z.string().min(1, 'Protocolo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cost: z.number().min(0, 'Custo deve ser maior ou igual a 0'),
  veterinarian: z.string().optional(),
  supplier: z.string().optional(),
  observations: z.string().optional(),
});

interface HealthRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  lotId?: string;
}

export const HealthRecordForm: React.FC<HealthRecordFormProps> = ({
  isOpen,
  onClose,
  lotId
}) => {
  const { 
    cattleLots, 
    penRegistrations,
    penStatuses, 
    addHealthRecord, 
    allocateCostProportionally,
    getLotesInCurral,
    addNotification 
  } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<HealthRecordFormData>({
    resolver: zodResolver(healthRecordSchema),
    defaultValues: {
      lotId: lotId || '',
      penNumber: '',
      date: new Date(),
      cost: 0
    }
  });

  const selectedPenNumber = watch('penNumber');
  
  // Quando o lotId é fornecido, encontrar o curral correspondente
  React.useEffect(() => {
    if (lotId) {
      const lot = cattleLots.find(l => l.id === lotId);
      if (lot && lot.alocacoesAtuais && lot.alocacoesAtuais.length > 0) {
        // Selecionar o curral com maior quantidade de animais do lote
        const mainAllocation = lot.alocacoesAtuais.reduce((prev, current) => 
          prev.quantidade > current.quantidade ? prev : current
        );
        setValue('penNumber', mainAllocation.curralId);
      }
    }
  }, [lotId, cattleLots, setValue]);
  
  // Obter lotes no curral selecionado
  const lotesInSelectedPen = React.useMemo(() => {
    if (!selectedPenNumber) return [];
    return getLotesInCurral(selectedPenNumber);
  }, [selectedPenNumber, getLotesInCurral]);
  
  // Calcular distribuição de custos
  const costDistribution = React.useMemo(() => {
    if (!selectedPenNumber || !lotesInSelectedPen.length) return [];
    
    const totalCost = watch('cost') || 0;
    const totalAnimalsInPen = lotesInSelectedPen.reduce((sum, { link }) => sum + link.quantidade, 0);
    
    return lotesInSelectedPen.map(({ lote, link }) => ({
      loteId: lote.id,
      loteNumber: lote.lotNumber,
      quantidade: link.quantidade,
      percentual: (link.quantidade / totalAnimalsInPen) * 100,
      valorAlocado: (link.quantidade / totalAnimalsInPen) * totalCost
    }));
  }, [selectedPenNumber, lotesInSelectedPen, watch('cost')]);

  const handleFormSubmit = (data: HealthRecordFormData) => {
    // Criar o registro de saúde
    const healthRecordId = Math.random().toString(36).substr(2, 9); // ID temporário
    
    addHealthRecord({
      ...data,
      lotId: lotesInSelectedPen[0]?.lote.id || '' // Associar ao primeiro lote do curral
    });
    
    // Alocar custos proporcionalmente
    if (data.cost > 0 && selectedPenNumber) {
      allocateCostProportionally(
        healthRecordId,
        'health',
        selectedPenNumber,
        data.cost
      );
      
      // Notificar sobre a alocação
      addNotification({
        title: 'Protocolo Sanitário Aplicado',
        message: `Protocolo aplicado no curral ${selectedPenNumber} com custo de R$ ${data.cost.toFixed(2)} distribuído proporcionalmente entre ${lotesInSelectedPen.length} lotes`,
        type: 'success',
        relatedEntityType: 'health_record',
        relatedEntityId: healthRecordId
      });
    }
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Novo Protocolo Sanitário</h2>
            <p className="text-purple-200 text-sm mt-1">
              Aplicar protocolo por curral com alocação proporcional de custos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Aviso sobre o novo modelo */}
          <div className="bg-info-50 border border-info-200 rounded-lg p-3 flex items-start space-x-2">
            <Info className="w-4 h-4 text-info-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-info-700">
              <p className="font-medium mb-1">Modelo Operacional de Custos</p>
              <p className="text-xs">
                Os custos serão distribuídos proporcionalmente entre todos os lotes presentes no curral selecionado, 
                baseado na quantidade de animais de cada lote.
              </p>
            </div>
          </div>

          {/* Curral Selection - Principal */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Curral *
            </label>
            <select
              {...register('penNumber')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecione um curral</option>
              {penStatuses
                .filter(pen => pen.status === 'occupied')
                .map(pen => {
                  const penReg = penRegistrations.find(pr => pr.penNumber === pen.penNumber);
                  return (
                    <option key={pen.penNumber} value={pen.penNumber}>
                      Curral {pen.penNumber} - {penReg?.location} ({pen.currentAnimals} animais)
                    </option>
                  );
                })
              }
            </select>
            {errors.penNumber && (
              <p className="text-error-500 text-xs mt-1">{errors.penNumber.message}</p>
            )}
          </div>

          {/* Lotes no Curral - Visualização */}
          {selectedPenNumber && lotesInSelectedPen.length > 0 && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-neutral-700 mb-2">
                Lotes no Curral {selectedPenNumber}:
              </h4>
              <div className="space-y-1">
                {lotesInSelectedPen.map(({ lote, link }) => (
                  <div key={lote.id} className="flex justify-between items-center text-xs">
                    <span className="text-neutral-600">
                      Lote {lote.lotNumber}
                    </span>
                    <span className="font-medium text-neutral-800">
                      {link.quantidade} animais ({link.percentualDoCurral.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Data de Aplicação *
            </label>
            <input
              type="date"
              {...register('date', { valueAsDate: true })}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Protocol Details - Mais compacto */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
              <Heart className="w-3 h-3 mr-2" />
              Detalhes do Protocolo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Protocolo *
                </label>
                <select
                  {...register('protocol')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecione o protocolo</option>
                  <option value="Vermifugação">Vermifugação</option>
                  <option value="Vacinação">Vacinação</option>
                  <option value="Antibiótico">Antibiótico</option>
                  <option value="Anti-inflamatório">Anti-inflamatório</option>
                  <option value="Vitaminas">Vitaminas</option>
                  <option value="Carrapaticida">Carrapaticida</option>
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
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 850.00"
                />
                {errors.cost && (
                  <p className="text-error-500 text-xs mt-1">{errors.cost.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição do Protocolo *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Aplicação de vermífugo em todo o lote conforme protocolo veterinário"
              />
              {errors.description && (
                <p className="text-error-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Distribuição de Custos - Preview */}
          {selectedPenNumber && costDistribution.length > 0 && watch('cost') > 0 && (
            <div className="bg-b3x-lime-50 border border-b3x-lime-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-b3x-lime-800">
                  Distribuição Proporcional de Custos
                </h4>
                <span className="text-xs text-b3x-lime-600">
                  Total: R$ {(watch('cost') || 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-1">
                {costDistribution.map(dist => (
                  <div key={dist.loteId} className="flex justify-between items-center text-xs">
                    <span className="text-b3x-lime-700">
                      Lote {dist.loteNumber} ({dist.quantidade} animais)
                    </span>
                    <span className="font-medium text-b3x-lime-800">
                      R$ {dist.valorAlocado.toFixed(2)} ({dist.percentual.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information - Mais compacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Veterinário Responsável
              </label>
              <input
                type="text"
                {...register('veterinarian')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Agropecuária Central"
              />
            </div>
          </div>

          {/* Observations - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <span>Registrar Protocolo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};