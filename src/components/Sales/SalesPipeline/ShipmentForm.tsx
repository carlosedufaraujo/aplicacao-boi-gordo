import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Truck, Scale, Calendar, User, MapPin, Building, Home, Plus, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PartnerForm } from '../Forms/PartnerForm';
import { Portal } from '../Common/Portal';

const shipmentSchema = z.object({
  shipDate: z.date(),
  transportCompanyId: z.string().min(1, 'Selecione uma transportadora'),
  exitQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  exitWeight: z.number().min(1, 'Peso deve ser maior que 0'),
  freightCost: z.number().min(0, 'Custo do frete deve ser maior ou igual a 0'),
  observations: z.string().optional(),
});

interface ShipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  lot: any;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({
  isOpen,
  onClose,
  lot
}) => {
  const { partners, penStatuses, penAllocations, cattlePurchases } = useAppStore();
  const [showTransportCompanyForm, setShowTransportCompanyForm] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      shipDate: new Date(),
      exitQuantity: lot.currentQuantity,
      exitWeight: lot.estimatedWeight,
      freightCost: 0
    }
  });
  
  const watchedExitQuantity = watch('exitQuantity');
  const watchedExitWeight = watch('exitWeight');
  
  // Get transporters
  const transporters = partners.filter(p => p.type === 'vendor' && p.isActive && p.isTransporter);
  
  // Calculate average currentWeight per animal
  const averageWeight = watchedExitQuantity && watchedExitWeight
    ? watchedExitWeight / watchedExitQuantity
    : 0;
    
  // Get pen information if this is a pen-based shipment
  const getPenInfo = () => {
    if (!lot.penNumber) return null;
    
    const pen = penStatuses.find(p => p.penNumber === lot.penNumber);
    if (!pen) return null;
    
    // Get allocations for this pen
    const allocations = penAllocations.filter(alloc => alloc.penNumber === lot.penNumber);
    
    // Get lots in this pen
    const lotsInPen = allocations.map(alloc => {
      const lot = cattlePurchases.find(l => l.id === alloc.lotId);
      return {
        allocation: alloc,
        lot
      };
    }).filter(item => item.lot && item.lot.status === 'active');
    
    return {
      pen,
      lotsInPen,
      totalAnimals: pen.currentAnimals,
      totalWeight: lotsInPen.reduce((sum, item) => sum + (item.allocation?.entryWeight || 0), 0)
    };
  };
  
  const penInfo = getPenInfo();

  const handleFormSubmit = (data: any) => {
    // In a real implementation, this would update the lot status to "shipped"
    
    // Show success notification
    alert('Embarque registrado com sucesso!');
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Registrar Embarque</h2>
            <p className="text-info-100 text-sm mt-1">
              {penInfo ? `Curral ${lot.penNumber}` : `Lote ${lot.lotNumber}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-info-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Summary - Pen or Lot based */}
          <div className="bg-gradient-to-br from-info-50 to-info-100 rounded-xl p-4 border border-info-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              {penInfo ? (
                <>
                  <Home className="w-4 h-4 mr-2 text-info-600" />
                  Resumo do Curral
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2 text-info-600" />
                  Resumo do Lote
                </>
              )}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">
                  {penInfo ? penInfo.totalAnimals : lot.currentQuantity}
                </div>
                <div className="text-xs text-neutral-600">Animais</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">
                  {penInfo 
                    ? (penInfo.totalWeight / penInfo.totalAnimals).toFixed(0) 
                    : (lot.estimatedWeight / lot.currentQuantity).toFixed(0)
                  }
                </div>
                <div className="text-xs text-neutral-600">Peso Médio (kg)</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">
                  {penInfo 
                    ? penInfo.totalWeight.toLocaleString('pt-BR')
                    : lot.estimatedWeight.toLocaleString('pt-BR')
                  }
                </div>
                <div className="text-xs text-neutral-600">Peso Total (kg)</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-lime-600">
                  {penInfo 
                    ? (penInfo.totalWeight / 15).toFixed(1)
                    : (lot.estimatedWeight / 15).toFixed(1)
                  }
                </div>
                <div className="text-xs text-neutral-600">Arrobas (@)</div>
              </div>
            </div>
            
            {/* If this is a pen, show the lots in it */}
            {penInfo && penInfo.lotsInPen.length > 0 && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-info-200">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-2">Lotes neste Curral:</h4>
                <div className="space-y-1">
                  {penInfo.lotsInPen.map(({ lot, allocation }) => (
                    <div key={lot?.id} className="flex justify-between text-xs">
                      <span>Lote {lot?.lotNumber}:</span>
                      <span className="font-medium">{allocation.currentQuantity} animais</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Detalhes do Embarque
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data do Embarque *
                </label>
                <input
                  type="date"
                  {...register('shipDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                />
                {errors.shipDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.shipDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Transportadora *
                </label>
                <div className="flex space-x-2">
                  <select
                    {...register('transportCompanyId')}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma transportadora</option>
                    {transporters.map(transporter => (
                      <option key={transporter.id} value={transporter.id}>
                        {transporter.name} - {transporter.city}/{transporter.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowTransportCompanyForm(true)}
                    className="px-2 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors"
                    title="Adicionar nova transportadora"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.transportCompanyId && (
                  <p className="text-error-500 text-xs mt-1">{errors.transportCompanyId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade de Saída *
                </label>
                <input
                  type="number"
                  {...register('exitQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                />
                {errors.exitQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.exitQuantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso de Saída (kg) *
                </label>
                <input
                  type="number"
                  {...register('exitWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                />
                {errors.exitWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.exitWeight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Custo do Frete (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('freightCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                />
                {errors.freightCost && (
                  <p className="text-error-500 text-xs mt-1">{errors.freightCost.message}</p>
                )}
              </div>
            </div>
            
            {/* Weight Summary */}
            {watchedExitQuantity && watchedExitWeight && (
              <div className="mt-4 bg-info-50 rounded-lg p-3 border border-info-200">
                <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                  <Scale className="w-3 h-3 mr-2 text-info-600" />
                  Resumo do Peso
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      {averageWeight.toFixed(0)}
                    </div>
                    <div className="text-xs text-neutral-600">Peso Médio (kg)</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      {(watchedExitWeight / 15).toFixed(1)}
                    </div>
                    <div className="text-xs text-neutral-600">Arrobas</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-info-600">
                      {((watchedExitWeight / (penInfo ? penInfo.totalWeight : lot.estimatedWeight)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-neutral-600">do Peso Estimado</div>
                  </div>
                </div>
                
                {/* Alert about pen emptying */}
                {penInfo && watchedExitQuantity >= penInfo.totalAnimals && (
                  <div className="mt-3 p-2 bg-warning-50 rounded-lg border border-warning-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-3 h-3 text-warning-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-warning-700">
                        Você está embarcando todos os animais deste curral. O curral ficará vazio após o embarque.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Building className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Destino
            </h3>
            
            <div className="bg-neutral-50 rounded-lg p-3">
              <div className="flex items-center space-x-3 mb-2">
                <User className="w-4 h-4 text-neutral-600" />
                <div>
                  <div className="font-medium text-b3x-navy-900">{lot.slaughterhouse || 'Frigorífico a definir'}</div>
                  <div className="text-xs text-neutral-600">Escala para: {lot.scheduledDate.toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
              placeholder="Observações sobre o embarque..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-info-500 to-info-600 text-white font-medium rounded-lg hover:from-info-600 hover:to-info-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Truck className="w-3 h-3" />
              <span>Confirmar Embarque</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Transportadora Form */}
      {showTransportCompanyForm && (
        <Portal>
          <PartnerForm
            isOpen={showTransportCompanyForm}
            onClose={() => setShowTransportCompanyForm(false)}
            type="vendor"
            isTransporter={true}
          />
        </Portal>
      )}
    </div>
  );
};
