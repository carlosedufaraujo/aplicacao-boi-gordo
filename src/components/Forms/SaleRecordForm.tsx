import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign, Truck, Calendar, Users, Scale, Award } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { SaleRecordFormData } from '../../types';

const saleRecordSchema = z.object({
  slaughterhouseId: z.string().min(1, 'Selecione um frigorífico'),
  saleDate: z.date(),
  animalType: z.enum(['male', 'female']),
  currentQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  totalWeight: z.number().min(1, 'Peso total deve ser maior que 0'),
  pricePerArroba: z.number().min(1, 'Preço por arroba deve ser maior que 0'),
  paymentType: z.enum(['cash', 'installment']),
  paymentDate: z.date().optional(),
  // SEÇÃO BONUS: Classificação dos animais
  commonAnimals: z.number().min(0, 'Animais comuns deve ser maior ou igual a 0'),
  chinaAnimals: z.number().min(0, 'China deve ser maior ou igual a 0'),
  angusAnimals: z.number().min(0, 'Angus deve ser maior ou igual a 0'),
  observations: z.string().optional(),
}).refine((data) => {
  // Se for a prazo, data de pagamento é obrigatória
  if (data.paymentType === 'installment' && !data.paymentDate) {
    return false;
  }
  return true;
}, {
  message: "Data de pagamento é obrigatória para pagamento a prazo",
  path: ["paymentDate"]
}).refine((data) => {
  // A soma dos animais classificados deve ser igual à quantidade total
  const totalClassified = data.commonAnimals + data.chinaAnimals + data.angusAnimals;
  return totalClassified === data.currentQuantity;
}, {
  message: "A soma dos animais classificados deve ser igual à quantidade total",
  path: ["commonAnimals"]
});

interface SaleRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
}

export const SaleRecordForm: React.FC<SaleRecordFormProps> = ({
  isOpen,
  onClose,
  lotId
}) => {
  const { 
    cattlePurchases, 
    partners, 
    addSaleRecord, 
    calculateLotCosts,
    calculateZootechnicalPerformance 
  } = useAppStore();

  const lot = cattlePurchases.find(l => l.id === lotId);
  const slaughterhouses = partners.filter(p => p.type === 'slaughterhouse' && p.isActive);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<SaleRecordFormData>({
    resolver: zodResolver(saleRecordSchema),
    defaultValues: {
      lotId,
      saleDate: new Date(),
      animalType: lot?.purchaseId ? 'male' : 'male', // Baseado na ordem de compra
      currentQuantity: lot?.entryQuantity || 0,
      totalWeight: lot?.entryWeight || 0,
      pricePerArroba: 320, // Preço padrão
      paymentType: 'cash',
      commonAnimals: lot?.entryQuantity || 0,
      chinaAnimals: 0,
      angusAnimals: 0
    }
  });

  const watchedValues = watch();
  
  // Calcular valores automaticamente
  const grossRevenue = (watchedValues.totalWeight / 15) * watchedValues.pricePerArroba;
  const totalCosts = lot ? calculateLotCosts(lot.id) : 0;
  const netProfit = grossRevenue - totalCosts;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const profitPerAnimal = watchedValues.currentQuantity > 0 ? netProfit / watchedValues.currentQuantity : 0;

  // Performance zootécnica
  const performance = lot ? calculateZootechnicalPerformance(lot.id) : null;

  // Verificar se a classificação está correta
  const totalClassified = (watchedValues.commonAnimals || 0) + (watchedValues.chinaAnimals || 0) + (watchedValues.angusAnimals || 0);
  const classificationError = totalClassified !== watchedValues.currentQuantity;

  const handleFormSubmit = (data: SaleRecordFormData) => {
    if (!lot) return;

    addSaleRecord({
      ...data,
      lotId,
      grossRevenue,
      netProfit,
      profitMargin
    });
    
    reset();
    onClose();
  };

  // Auto-distribuir animais quando a quantidade mudar
  const handleQuantityChange = (currentQuantity: number) => {
    setValue('currentQuantity', currentQuantity);
    setValue('commonAnimals', currentQuantity);
    setValue('chinaAnimals', 0);
    setValue('angusAnimals', 0);
  };

  if (!isOpen || !lot) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Registro de Venda/Abate</h2>
            <p className="text-success-100 text-sm mt-1">Lote {lot.lotNumber} - Curral {lot.penNumber || 'N/A'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-success-400 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Lot Summary - Mais compacto */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200 shadow-soft">
            <h3 className="text-base font-bold text-b3x-navy-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-success-600" />
              Resumo do Lote
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                <span className="text-xs text-neutral-600 block mb-1">Quantidade:</span>
                <div className="text-lg font-bold text-b3x-navy-900">{lot.entryQuantity}</div>
                <div className="text-xs text-neutral-500">animais</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                <span className="text-xs text-neutral-600 block mb-1">Peso Atual:</span>
                <div className="text-lg font-bold text-b3x-navy-900">{lot.entryWeight.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-neutral-500">kg</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                <span className="text-xs text-neutral-600 block mb-1">GMD:</span>
                <div className="text-lg font-bold text-success-600">{performance?.gmd.toFixed(2) || '1.50'}</div>
                <div className="text-xs text-neutral-500">kg/dia</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center shadow-soft">
                <span className="text-xs text-neutral-600 block mb-1">Dias Confinamento:</span>
                <div className="text-lg font-bold text-info-600">{performance?.daysInConfinement || 0}</div>
                <div className="text-xs text-neutral-500">dias</div>
              </div>
            </div>
          </div>

          {/* Sale Information - Mais compacto */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-bold text-b3x-navy-900 mb-4 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-success-600" />
              Informações da Venda
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Frigorífico *
                </label>
                <select
                  {...register('slaughterhouseId')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
                >
                  <option value="">Selecione o frigorífico</option>
                  {slaughterhouses.map(slaughterhouse => (
                    <option key={slaughterhouse.id} value={slaughterhouse.id}>
                      {slaughterhouse.name} - {slaughterhouse.city}/{slaughterhouse.state}
                    </option>
                  ))}
                </select>
                {errors.slaughterhouseId && (
                  <p className="text-error-500 text-xs mt-1">{errors.slaughterhouseId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data da Venda *
                </label>
                <input
                  type="date"
                  {...register('saleDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
                />
                {errors.saleDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.saleDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Animal *
                </label>
                <select
                  {...register('animalType')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
                >
                  <option value="male">Macho</option>
                  <option value="female">Fêmea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade de Animais *
                </label>
                <input
                  type="number"
                  {...register('currentQuantity', { 
                    valueAsNumber: true,
                    onChange: (e) => handleQuantityChange(Number(e.target.value))
                  })}
                  max={lot.entryQuantity}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
                  placeholder={`Máximo: ${lot.entryQuantity}`}
                />
                {errors.currentQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.currentQuantity.message}</p>
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
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
                  placeholder={`Peso atual: ${lot.entryWeight} kg`}
                />
                {errors.totalWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.totalWeight.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Price and Payment - Mais compacto */}
          <div className="bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-xl p-4 border border-b3x-lime-200 shadow-soft">
            <h3 className="text-base font-bold text-b3x-navy-900 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-b3x-lime-600" />
              Preço e Pagamento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Preço R$/@ (Venda) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePerArroba', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200 font-medium"
                  placeholder="Ex: 320.00"
                />
                {errors.pricePerArroba && (
                  <p className="text-error-500 text-xs mt-1">{errors.pricePerArroba.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Tipo de Pagamento *
                </label>
                <select
                  {...register('paymentType')}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                >
                  <option value="cash">À Vista</option>
                  <option value="installment">A Prazo</option>
                </select>
              </div>
            </div>

            {watchedValues.paymentType === 'installment' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  {...register('paymentDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                />
                {errors.paymentDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.paymentDate.message}</p>
                )}
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-b3x-lime-200 shadow-soft">
              <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm">Resumo Financeiro:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-600">Receita Bruta:</span>
                  <div className="font-bold text-success-600">
                    R$ {grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Custos Totais:</span>
                  <div className="font-bold text-error-600">
                    R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Lucro Líquido:</span>
                  <div className={`font-bold ${netProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Margem:</span>
                  <div className={`font-bold ${profitMargin >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    {profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO BONUS: Classificação dos Animais - Mais compacto */}
          <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200 shadow-soft">
            <h3 className="text-base font-bold text-b3x-navy-900 mb-4 flex items-center">
              <Award className="w-4 h-4 mr-2 text-warning-600" />
              Classificação dos Animais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-warning-700 mb-1">
                  Animais Comuns *
                </label>
                <input
                  type="number"
                  {...register('commonAnimals', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-warning-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 120"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warning-700 mb-1">
                  China *
                </label>
                <input
                  type="number"
                  {...register('chinaAnimals', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-warning-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-warning-700 mb-1">
                  Angus *
                </label>
                <input
                  type="number"
                  {...register('angusAnimals', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-warning-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 10"
                />
              </div>
            </div>

            {/* Validation da Classificação */}
            <div className={`p-3 rounded-lg border ${
              classificationError 
                ? 'bg-error-50 border-error-200' 
                : 'bg-success-50 border-success-200'
            }`}>
              <div className="flex items-center space-x-2">
                {classificationError ? (
                  <>
                    <X className="w-3 h-3 text-error-600" />
                    <span className="text-error-700 font-medium text-xs">
                      Total classificado: {totalClassified} | Quantidade vendida: {watchedValues.currentQuantity}
                    </span>
                  </>
                ) : (
                  <>
                    <Scale className="w-3 h-3 text-success-600" />
                    <span className="text-success-700 font-medium text-xs">
                      ✓ Classificação correta: {totalClassified} animais
                    </span>
                  </>
                )}
              </div>
              {classificationError && (
                <p className="text-error-600 text-xs mt-1">
                  A soma dos animais classificados deve ser igual à quantidade vendida
                </p>
              )}
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200"
              placeholder="Observações sobre a venda/abate..."
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
              disabled={classificationError}
              className="px-4 py-1.5 bg-gradient-to-r from-success-500 to-success-600 text-white font-medium rounded-lg hover:from-success-600 hover:to-success-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign className="w-3 h-3" />
              <span>Registrar Venda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};