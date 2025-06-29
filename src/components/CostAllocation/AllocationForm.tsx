import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { AllocationGenerationParams } from '../../types';
import { format } from 'date-fns';
import { Portal } from '../Common/Portal';

interface AllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: AllocationGenerationParams) => void;
}

export const AllocationForm: React.FC<AllocationFormProps> = ({
  isOpen,
  onClose,
  onGenerate
}) => {
  const { indirectCostCenters, allocationTemplates } = useAppStore();
  
  const [formData, setFormData] = useState<AllocationGenerationParams>({
    costType: 'administrative',
    period: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    },
    totalAmount: 0,
    allocationMethod: 'by_heads',
    includeInactiveLots: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalAmount <= 0) {
      alert('O valor total deve ser maior que zero');
      return;
    }
    onGenerate(formData);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6 text-b3x-navy-700" />
              <h2 className="text-xl font-bold text-b3x-navy-900">
                Gerar Novo Rateio
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Tipo de Custo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo de Custo
              </label>
              <select
                value={formData.costType}
                onChange={(e) => setFormData({ ...formData, costType: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                required
              >
                <option value="administrative">Administrativo</option>
                <option value="financial">Financeiro</option>
                <option value="operational">Operacional</option>
                <option value="marketing">Marketing</option>
                <option value="other">Outros</option>
              </select>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={format(formData.period.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({
                    ...formData,
                    period: {
                      ...formData.period,
                      startDate: new Date(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={format(formData.period.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({
                    ...formData,
                    period: {
                      ...formData.period,
                      endDate: new Date(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Valor Total */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valor Total a Ratear
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
                  R$
                </span>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Método de Rateio */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Método de Rateio
              </label>
              <select
                value={formData.allocationMethod}
                onChange={(e) => setFormData({ ...formData, allocationMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                required
              >
                <option value="by_heads">Por Cabeças (quantidade de animais)</option>
                <option value="by_value">Por Valor (custo total do lote)</option>
                <option value="by_days">Por Dias (tempo × quantidade)</option>
                <option value="by_weight">Por Peso (peso total do lote)</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                {formData.allocationMethod === 'by_heads' && 'O custo será dividido proporcionalmente pela quantidade de animais em cada lote'}
                {formData.allocationMethod === 'by_value' && 'O custo será dividido proporcionalmente pelo valor investido em cada lote'}
                {formData.allocationMethod === 'by_days' && 'O custo será dividido proporcionalmente pelos dias de confinamento × quantidade de animais'}
                {formData.allocationMethod === 'by_weight' && 'O custo será dividido proporcionalmente pelo peso total de cada lote'}
              </p>
            </div>

            {/* Centro de Custo */}
            {indirectCostCenters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Centro de Custo (opcional)
                </label>
                <select
                  value={formData.costCenterId || ''}
                  onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {indirectCostCenters
                    .filter(center => center.isActive)
                    .map(center => (
                      <option key={center.id} value={center.id}>
                        {center.code} - {center.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Template */}
            {allocationTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Template (opcional)
                </label>
                <select
                  value={formData.templateId || ''}
                  onChange={(e) => {
                    const template = allocationTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setFormData({
                        ...formData,
                        templateId: template.id,
                        costType: template.costType,
                        allocationMethod: template.allocationMethod
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {allocationTemplates
                    .filter(template => template.isActive)
                    .map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Incluir Lotes Inativos */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeInactive"
                checked={formData.includeInactiveLots}
                onChange={(e) => setFormData({ ...formData, includeInactiveLots: e.target.checked })}
                className="h-4 w-4 text-b3x-lime-500 focus:ring-b3x-lime-500 border-neutral-300 rounded"
              />
              <label htmlFor="includeInactive" className="ml-2 text-sm text-neutral-700">
                Incluir lotes vendidos/abatidos no rateio
              </label>
            </div>
          </form>

          <div className="p-6 border-t border-neutral-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600"
            >
              Gerar Preview
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}; 