import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Edit, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattlePurchase } from '../../types';
import { format } from 'date-fns';

const lotEditSchema = z.object({
  lotNumber: z.string().min(1, 'Número do lote é obrigatório'),
  entryQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  entryWeight: z.number().min(1, 'Peso deve ser maior que 0'),
  deaths: z.number().min(0, 'Mortes deve ser maior ou igual a 0'),
  observations: z.string().optional(),
  freightKm: z.number().min(0, 'Distância deve ser maior ou igual a 0').optional(),
  freightCostPerKm: z.number().min(0, 'Valor por km deve ser maior ou igual a 0').optional(),
  transportCompanyId: z.string().optional(),
});

interface LotEditModalProps {
  lot: CattlePurchase;
  isOpen: boolean;
  onClose: () => void;
}

export const LotEditModal: React.FC<LotEditModalProps> = ({ lot, isOpen, onClose }) => {
  const { 
    updateCattlePurchase, 
    penRegistrations, 
    loteCurralLinks,
    partners,
    cattlePurchases
  } = useAppStore();

  const [showFreightInfo, setShowFreightInfo] = useState(false);

  // Obter ordem de compra relacionada
  const purchaseOrder = cattlePurchases.find(po => po.id === lot.purchaseId);
  
  // Obter currais atuais do lote
  const currentPens = (loteCurralLinks || [])
    .filter(link => link.loteId === lot.id && link.status === 'active')
    .map(link => {
      const pen = penRegistrations.find(p => p.penNumber === link.curralId);
      return {
        ...link,
        penInfo: pen
      };
    });

  // Obter transportadoras
  const transportCompanies = partners.filter(p => 
    p.isTransporter === true && p.isActive
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(lotEditSchema),
    defaultValues: {
      lotNumber: lot.lotNumber,
      entryQuantity: lot.entryQuantity,
      entryWeight: lot.entryWeight,
      deaths: lot.deaths,
      observations: lot.observations || '',
      freightKm: lot.freightKm || 0,
      freightCostPerKm: lot.freightCostPerKm || 0,
      transportCompanyId: lot.transportCompany || ''
    }
  });

  const entryWeight = watch('entryWeight');
  const entryQuantity = watch('entryQuantity');
  const avgWeight = entryQuantity > 0 ? entryWeight / entryQuantity : 0;

  useEffect(() => {
    setShowFreightInfo((lot.freightKm || 0) > 0 || (lot.freightCostPerKm || 0) > 0);
  }, [lot]);

  const handleFormSubmit = (data: any) => {
    updateCattlePurchase(lot.id, {
      ...data,
      // Garantir que os valores de frete sejam números
      freightKm: data.freightKm || 0,
      freightCostPerKm: data.freightCostPerKm || 0,
      transportCompanyId: data.transportCompanyId || undefined
    });
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Editar Lote</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Lote {lot.lotNumber} • {format(lot.entryDate, 'dd/MM/yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Informações da Compra (Não editável) */}
          {purchaseOrder && (
            <div className="bg-info-50 rounded-lg p-3 border border-info-200">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-info-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-info-800 mb-1">Informações da Ordem de Compra</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-info-700">
                    <div>
                      <span className="font-medium">Ordem:</span> {purchaseOrder.code}
                    </div>
                    <div>
                      <span className="font-medium">Quantidade:</span> {purchaseOrder.currentQuantity} animais
                    </div>
                    <div>
                      <span className="font-medium">Peso Total:</span> {purchaseOrder.totalWeight.toLocaleString('pt-BR')} kg
                    </div>
                    <div>
                      <span className="font-medium">R.C.%:</span> {purchaseOrder.rcPercentage || 50}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-medium text-b3x-navy-900 mb-3 text-sm">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Número do Lote *
                </label>
                <input
                  type="text"
                  {...register('lotNumber')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                />
                {errors.lotNumber && (
                  <p className="text-error-500 text-xs mt-1">{errors.lotNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade Recebida *
                </label>
                <input
                  type="number"
                  {...register('entryQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                />
                {errors.entryQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.entryQuantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso Total Recebido (kg) *
                </label>
                <input
                  type="number"
                  {...register('entryWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                />
                {errors.entryWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.entryWeight.message}</p>
                )}
              </div>
            </div>

            {/* Peso médio calculado */}
            <div className="mt-3 bg-neutral-50 rounded-lg p-2">
              <p className="text-xs text-neutral-600">
                Peso médio por animal: <span className="font-medium text-b3x-navy-900">{avgWeight.toFixed(1)} kg</span>
              </p>
            </div>
          </div>

          {/* Mortalidade */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="font-medium text-b3x-navy-900 mb-3 text-sm">Mortalidade</h3>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Mortalidade (Transporte) *
              </label>
              <input
                type="number"
                {...register('deaths', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
              {errors.deaths && (
                <p className="text-error-500 text-xs mt-1">{errors.deaths.message}</p>
              )}
            </div>
          </div>

          {/* Informações de Frete */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-b3x-navy-900 text-sm">Informações de Frete</h3>
              <button
                type="button"
                onClick={() => setShowFreightInfo(!showFreightInfo)}
                className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700"
              >
                {showFreightInfo ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showFreightInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Transportadora
                  </label>
                  <select
                    {...register('transportCompanyId')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {transportCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Distância (km)
                  </label>
                  <input
                    type="number"
                    {...register('freightKm', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Valor por km (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('freightCostPerKm', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Alocações em Currais (Não editável aqui) */}
          {currentPens.length > 0 && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm">Alocações Atuais em Currais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {currentPens.map(pen => (
                  <div key={pen.id} className="bg-white rounded-lg p-2 border border-neutral-200">
                    <p className="text-xs font-medium text-b3x-navy-900">Curral {pen.curralId}</p>
                    <p className="text-xs text-neutral-600">{pen.quantidade} animais ({pen.percentualDoLote.toFixed(1)}%)</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                * Para alterar alocações, use a função de movimentação de lotes
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              placeholder="Observações sobre o lote..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Edit className="w-3 h-3" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}