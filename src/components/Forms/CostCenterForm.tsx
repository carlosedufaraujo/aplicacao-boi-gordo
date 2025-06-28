import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Building2 } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const costCenterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().min(1, 'Código é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['acquisition', 'fattening', 'administrative', 'financial']),
  parentId: z.string().optional(),
});

interface CostCenterFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CostCenterForm: React.FC<CostCenterFormProps> = ({
  isOpen,
  onClose
}) => {
  const { costCenters, addCostCenter } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(costCenterSchema),
    defaultValues: {
      type: 'fattening'
    }
  });

  const selectedType = watch('type');

  // Filtrar apenas centros de custo ativos para seleção como pai
  const activeCostCenters = costCenters.filter(cc => cc.isActive);
  
  // Filtrar centros de custo do mesmo tipo para seleção como pai
  const parentCandidates = activeCostCenters.filter(cc => cc.type === selectedType);

  const handleFormSubmit = (data: any) => {
    addCostCenter({
      ...data,
      isActive: true
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
            <h2 className="text-lg font-semibold">Novo Centro de Custo</h2>
            <p className="text-warning-100 text-sm mt-1">
              Crie um novo centro de custo para rateio de despesas
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
          {/* Tipo de Centro de Custo - Destacado */}
          <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-warning-600" />
              Tipo de Centro de Custo
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === 'acquisition' 
                  ? 'border-b3x-lime-300 bg-b3x-lime-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  {...register('type')} 
                  value="acquisition" 
                  className="sr-only" 
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-b3x-lime-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-b3x-lime-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Aquisição</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === 'fattening' 
                  ? 'border-success-300 bg-success-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  {...register('type')} 
                  value="fattening" 
                  className="sr-only" 
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-success-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Engorda</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === 'administrative' 
                  ? 'border-info-300 bg-info-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  {...register('type')} 
                  value="administrative" 
                  className="sr-only" 
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-info-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-info-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Administrativo</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === 'financial' 
                  ? 'border-warning-300 bg-warning-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  {...register('type')} 
                  value="financial" 
                  className="sr-only" 
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-warning-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-warning-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Financeiro</div>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Information - Mais compacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Nome do Centro de Custo *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                placeholder="Ex: Alimentação - Lote A"
              />
              {errors.name && (
                <p className="text-error-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                {...register('code')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                placeholder="Ex: ALIM-A"
              />
              {errors.code && (
                <p className="text-error-500 text-xs mt-1">{errors.code.message}</p>
              )}
            </div>
          </div>

          {/* Parent Center */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Centro de Custo Pai
            </label>
            <select
              {...register('parentId')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
            >
              <option value="">Nenhum (Centro Principal)</option>
              {parentCandidates.map(costCenter => (
                <option key={costCenter.id} value={costCenter.id}>
                  {costCenter.name} ({costCenter.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              💡 Selecione um centro de custo do mesmo tipo para criar uma hierarquia
            </p>
          </div>

          {/* Description - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
              placeholder="Descrição detalhada do centro de custo..."
            />
          </div>

          {/* Subcategorias Sugeridas - Baseado no tipo selecionado */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm">Subcategorias Sugeridas</h3>
            
            {selectedType === 'acquisition' && (
              <div className="text-xs text-neutral-600">
                <ul className="space-y-0.5">
                  <li>• Compra de Animais</li>
                  <li>• Comissão</li>
                  <li>• Frete</li>
                  <li>• Outros Custos de Aquisição</li>
                </ul>
              </div>
            )}
            
            {selectedType === 'fattening' && (
              <div className="text-xs text-neutral-600">
                <ul className="space-y-0.5">
                  <li>• Alimentação</li>
                  <li>• Custos Sanitários</li>
                  <li>• Custos Operacionais</li>
                  <li>• Outros Custos de Engorda</li>
                </ul>
              </div>
            )}
            
            {selectedType === 'administrative' && (
              <div className="text-xs text-neutral-600">
                <ul className="space-y-0.5">
                  <li>• Administrativo Geral</li>
                  <li>• Marketing</li>
                  <li>• Contabilidade</li>
                  <li>• Pessoal</li>
                  <li>• Escritório</li>
                  <li>• Prestação de Serviço</li>
                  <li>• Tecnologia</li>
                  <li>• Outros Custos Administrativos</li>
                </ul>
              </div>
            )}
            
            {selectedType === 'financial' && (
              <div className="text-xs text-neutral-600">
                <ul className="space-y-0.5">
                  <li>• Impostos</li>
                  <li>• Juros</li>
                  <li>• Taxas & Emolumentos</li>
                  <li>• Seguros</li>
                  <li>• Custo de Capital</li>
                  <li>• Fee de Gestão</li>
                  <li>• Mortes</li>
                  <li>• Inadimplência</li>
                  <li>• Outros Custos Financeiros</li>
                </ul>
              </div>
            )}
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
              <Building2 className="w-3 h-3" />
              <span>Criar Centro de Custo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};