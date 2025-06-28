import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, DollarSign, HandCoins, FileText, Target, Calendar, CreditCard, Tag, ShoppingCart } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PurchaseOrderFormData, AdditionalCost, PurchaseOrder } from '../../types';
import { PartnerForm } from './PartnerForm';
import { Portal } from '../Common/Portal';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const purchaseOrderSchema = z.object({
  cycleId: z.string().min(1, 'Selecione um ciclo'),
  date: z.date(),
  vendorId: z.string().min(1, 'Selecione um vendedor'),
  brokerId: z.string().optional(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  animalType: z.enum(['male', 'female']),
  estimatedAge: z.number().min(1, 'Idade deve ser maior que 0'),
  totalWeight: z.number().min(1, 'Peso total deve ser maior que 0'),
  pricePerArroba: z.number().min(1, 'Preço por arroba deve ser maior que 0'),
  commission: z.number().min(0, 'Comissão deve ser maior ou igual a 0'),
  commissionPaymentType: z.enum(['cash', 'installment']).optional(),
  commissionPaymentDate: z.date().optional(),
  taxes: z.number().min(0, 'Impostos devem ser maior ou igual a 0').optional(),
  taxesPaymentType: z.enum(['cash', 'installment']).optional(),
  taxesPaymentDate: z.date().optional(),
  otherCostsPaymentType: z.enum(['cash', 'installment']).optional(),
  otherCostsPaymentDate: z.date().optional(),
  paymentType: z.enum(['cash', 'installment']),
  paymentDate: z.date().optional(),
  observations: z.string().optional(),
  rcPercentage: z.number().min(40, 'R.C. deve ser maior ou igual a 40%').max(60, 'R.C. deve ser menor ou igual a 60%').optional(),
}).refine((data) => {
  // Se for a prazo, data de pagamento é obrigatória
  if (data.paymentType === 'installment' && !data.paymentDate) {
    return false;
  }
  // Se comissão for a prazo, data é obrigatória
  if (data.commission > 0 && data.commissionPaymentType === 'installment' && !data.commissionPaymentDate) {
    return false;
  }
  // Se outros custos for a prazo, data é obrigatória
  if (data.otherCostsPaymentType === 'installment' && !data.otherCostsPaymentDate) {
    return false;
  }
  return true;
}, {
  message: "Data de pagamento é obrigatória para pagamento a prazo",
  path: ["paymentDate"]
});

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: PurchaseOrderFormData) => void;
  initialData?: PurchaseOrder;
  isEditing?: boolean;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const { cycles, partners, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, generatePurchaseOrderCode } = useAppStore();
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [showNewBrokerForm, setShowNewBrokerForm] = useState(false);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialData || {
      date: new Date(),
      animalType: 'male',
      commission: 0,
      commissionPaymentType: 'cash',
      taxes: 0,
      taxesPaymentType: 'cash',
      paymentType: 'cash',
      otherCostsPaymentType: 'cash',
      rcPercentage: 50
    }
  });

  const vendors = partners.filter(p => p.type === 'vendor' && p.isActive);
  const brokers = partners.filter(p => p.type === 'broker' && p.isActive);
  const activeCycles = cycles.filter(c => c.status === 'active');

  const watchedValues = watch();
  const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + cost.value, 0);
  
  // 🆕 NOVO: Calcular peso de carcaça estimado e arrobas corretamente
  const rcPercentage = watchedValues.rcPercentage || 50; // Default 50% se não informado
  const estimatedCarcassWeight = watchedValues.totalWeight ? (watchedValues.totalWeight * rcPercentage / 100) : 0;
  const arrobas = estimatedCarcassWeight / 15; // Arrobas de CARCAÇA
  
  const animalValue = watchedValues.pricePerArroba && arrobas
    ? arrobas * watchedValues.pricePerArroba
    : 0;
  const totalValue = animalValue + (watchedValues.commission || 0) + (watchedValues.taxes || 0) + totalAdditionalCosts;
  
  // Calcular custo por arroba incluindo todos os custos
  const costPerArroba = arrobas > 0 
    ? totalValue / arrobas
    : 0;

  const addAdditionalCost = () => {
    const newCost: AdditionalCost = {
      id: Date.now().toString(),
      type: 'Outros Custos',
      value: 0,
      paymentType: 'cash'
    };
    setAdditionalCosts([...additionalCosts, newCost]);
  };

  const updateAdditionalCost = (id: string, field: keyof AdditionalCost, value: any) => {
    setAdditionalCosts(costs => 
      costs.map(cost => 
        cost.id === id ? { ...cost, [field]: value } : cost
      )
    );
  };

  const removeAdditionalCost = (id: string) => {
    setAdditionalCosts(costs => costs.filter(cost => cost.id !== id));
  };

  const handleFormSubmit = (data: any) => {
    // Verificar se há custos adicionais a prazo sem data
    const hasInvalidAdditionalCosts = additionalCosts.some(
      cost => cost.paymentType === 'installment' && !cost.paymentDate
    );

    if (hasInvalidAdditionalCosts) {
      alert('Por favor, defina uma data de pagamento para todos os custos adicionais a prazo.');
      return;
    }

    // Preparar dados da ordem
    const orderData = {
      ...data,
      otherCosts: totalAdditionalCosts,
      otherCostsDescription: additionalCosts.map(cost => 
        `${cost.type}: R$ ${cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cost.paymentType === 'cash' ? 'À Vista' : 'A Prazo' + (cost.paymentDate ? ` - ${cost.paymentDate.toLocaleDateString('pt-BR')}` : '')})`
      ).join('; ')
    };

    if (isEditing && initialData) {
      // Atualizar ordem existente
      updatePurchaseOrder(initialData.id, orderData);
    } else {
      // Criar nova ordem
      const orderCode = generatePurchaseOrderCode();
      addPurchaseOrder({
        ...orderData,
        code: orderCode,
        status: 'order',
        paymentValidated: false
      });
    }
    
    if (onSubmit) {
      onSubmit(orderData);
    }
    
    reset();
    setAdditionalCosts([]);
    onClose();
  };

  const handleNewVendor = () => {
    setShowNewVendorForm(true);
  };

  const handleNewBroker = () => {
    setShowNewBrokerForm(true);
  };

  const handleDeleteOrder = () => {
    if (initialData) {
      deletePurchaseOrder(initialData.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-soft-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
            <div>
              <h2 className="text-lg font-semibold">{isEditing ? 'Editar Ordem de Compra' : 'Nova Ordem de Compra'}</h2>
              <p className="text-b3x-navy-200 text-sm mt-1">
                {isEditing ? `Código: ${initialData?.code}` : `Código: ${generatePurchaseOrderCode()}`}
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Ciclo *
                </label>
                <select
                  {...register('cycleId')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="">Selecione um ciclo</option>
                  {activeCycles.map(cycle => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </select>
                {errors.cycleId && (
                  <p className="text-error-500 text-xs mt-1">{errors.cycleId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data da Compra *
                </label>
                <input
                  type="date"
                  {...register('date', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
                )}
              </div>
            </div>

            {/* Vendor and Broker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Vendedor *
                </label>
                <div className="flex space-x-2">
                  <select
                    {...register('vendorId')}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  >
                    <option value="">Selecione um vendedor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} - {vendor.city}/{vendor.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleNewVendor}
                    className="px-2 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                    title="Adicionar novo vendedor"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.vendorId && (
                  <p className="text-error-500 text-xs mt-1">{errors.vendorId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Corretor
                </label>
                <div className="flex space-x-2">
                  <select
                    {...register('brokerId')}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  >
                    <option value="">Selecione um corretor (opcional)</option>
                    {brokers.map(broker => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name} - {broker.city}/{broker.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleNewBroker}
                    className="px-2 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                    title="Adicionar novo corretor"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: Ribeirão Preto"
                />
                {errors.city && (
                  <p className="text-error-500 text-xs mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Estado *
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: SP"
                  maxLength={2}
                />
                {errors.state && (
                  <p className="text-error-500 text-xs mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            {/* Animal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: 50"
                />
                {errors.quantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Animal *
                </label>
                <select
                  {...register('animalType')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="male">Macho</option>
                  <option value="female">Fêmea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Idade Estimada (meses) *
                </label>
                <input
                  type="number"
                  {...register('estimatedAge', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: 24"
                />
                {errors.estimatedAge && (
                  <p className="text-error-500 text-xs mt-1">{errors.estimatedAge.message}</p>
                )}
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Peso Total da Compra (kg) *
                <span className="text-xs text-neutral-500 ml-1">(Peso Vivo)</span>
              </label>
              <input
                type="number"
                {...register('totalWeight', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder="Ex: 20.000"
              />
              {errors.totalWeight && (
                <p className="text-error-500 text-xs mt-1">{errors.totalWeight.message}</p>
              )}
            </div>

            {/* 🆕 NOVO: R.C. % e Peso de Carcaça Estimado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  R.C. (%) - Rendimento de Carcaça *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('rcPercentage', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: 50"
                  min="40"
                  max="60"
                />
                {errors.rcPercentage && (
                  <p className="text-error-500 text-xs mt-1">{errors.rcPercentage.message}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">Normalmente entre 48% e 54%</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso de Carcaça Estimado
                </label>
                <div className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg">
                  <span className="font-medium text-b3x-navy-900">
                    {estimatedCarcassWeight.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kg
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {arrobas.toFixed(1)} arrobas (@)
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso Médio por Animal
                </label>
                <div className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg">
                  <span className="font-medium text-b3x-navy-900">
                    {watchedValues.quantity && watchedValues.totalWeight ? 
                      (watchedValues.totalWeight / watchedValues.quantity).toFixed(1) : '0'} kg
                  </span>
                  <span className="text-xs text-neutral-500 ml-1">(vivo)</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {watchedValues.quantity && estimatedCarcassWeight ? 
                    (estimatedCarcassWeight / watchedValues.quantity).toFixed(1) : '0'} kg carcaça
                </p>
              </div>
            </div>

            {/* Bloco Financeiro - REFORMULADO */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="w-4 h-4 text-b3x-lime-600" />
                <h3 className="text-base font-semibold text-b3x-navy-900">Bloco Financeiro</h3>
              </div>
              
              {/* Preço por Arroba e Condições de Pagamento - JUNTOS */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-neutral-200">
                <h5 className="font-medium text-b3x-navy-900 mb-2 flex items-center text-sm">
                  <Tag className="w-3 h-3 mr-2 text-b3x-lime-600" />
                  Preço e Condições de Pagamento
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Preço R$/@ Compra *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('pricePerArroba', { valueAsNumber: true })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                      placeholder="Ex: 280,00"
                    />
                    {errors.pricePerArroba && (
                      <p className="text-error-500 text-xs mt-1">{errors.pricePerArroba.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Tipo de Pagamento *
                    </label>
                    <select
                      {...register('paymentType')}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    >
                      <option value="cash">À Vista</option>
                      <option value="installment">A Prazo</option>
                    </select>
                  </div>

                  {watchedValues.paymentType === 'installment' && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Data do Pagamento *
                      </label>
                      <input
                        type="date"
                        {...register('paymentDate', { valueAsDate: true })}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                      />
                      {errors.paymentDate && (
                        <p className="text-error-500 text-xs mt-1">{errors.paymentDate.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 p-2 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-3 h-3 text-b3x-lime-600" />
                    <span className="text-xs font-medium text-neutral-800">Resumo do Pagamento:</span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    {watchedValues.paymentType === 'cash' ? (
                      <p><span className="text-b3x-lime-600">✓</span> Pagamento à vista - Será processado imediatamente após validação</p>
                    ) : (
                      <p><span className="text-b3x-lime-600">📅</span> Pagamento a prazo - {watchedValues.paymentDate ? `Vencimento em ${new Date(watchedValues.paymentDate).toLocaleDateString('pt-BR')}` : 'Defina a data de vencimento'}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comissão do Lote - REFORMULADO */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-neutral-200">
                <h5 className="font-medium text-b3x-navy-900 mb-2 flex items-center text-sm">
                  <HandCoins className="w-3 h-3 mr-2 text-b3x-lime-600" />
                  Comissão do Lote
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Valor da Comissão (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('commission', { valueAsNumber: true })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                      placeholder="Ex: 5.000,00"
                    />
                  </div>

                  {(watchedValues.commission || 0) > 0 && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Tipo de Pagamento
                        </label>
                        <select
                          {...register('commissionPaymentType')}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                        >
                          <option value="cash">À Vista</option>
                          <option value="installment">A Prazo</option>
                        </select>
                      </div>

                      {watchedValues.commissionPaymentType === 'installment' && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Data do Pagamento
                          </label>
                          <input
                            type="date"
                            {...register('commissionPaymentDate', { valueAsDate: true })}
                            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                          />
                          {errors.commissionPaymentDate && (
                            <p className="text-error-500 text-xs mt-1">{errors.commissionPaymentDate.message}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Resumo do pagamento da comissão */}
                {(watchedValues.commission || 0) > 0 && (
                  <div className="mt-3 p-2 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-3 h-3 text-b3x-lime-600" />
                      <span className="text-xs font-medium text-neutral-800">Pagamento da Comissão:</span>
                    </div>
                    <div className="text-xs text-neutral-600">
                      {watchedValues.commissionPaymentType === 'cash' ? (
                        <p><span className="text-b3x-lime-600">✓</span> À Vista - Será processado junto com o pagamento principal</p>
                      ) : (
                        <p><span className="text-b3x-lime-600">📅</span> A Prazo - {watchedValues.commissionPaymentDate ? `Vencimento em ${new Date(watchedValues.commissionPaymentDate).toLocaleDateString('pt-BR')}` : 'Defina a data de vencimento'}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Outros Custos - REFORMULADO COM OPÇÕES DE PAGAMENTO */}
              <div className="p-3 bg-white rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-b3x-lime-600" />
                    <h3 className="text-base font-semibold text-b3x-navy-900">Outros Custos</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addAdditionalCost}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Custo</span>
                  </button>
                </div>

                {/* Opções de pagamento para Outros Custos */}
                {additionalCosts.length > 0 && (
                  <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Tipo de Pagamento (Outros Custos)
                      </label>
                      <select
                        {...register('otherCostsPaymentType')}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                      >
                        <option value="cash">À Vista</option>
                        <option value="installment">A Prazo</option>
                      </select>
                    </div>

                    {watchedValues.otherCostsPaymentType === 'installment' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Data do Pagamento
                        </label>
                        <input
                          type="date"
                          {...register('otherCostsPaymentDate', { valueAsDate: true })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                        />
                        {errors.otherCostsPaymentDate && (
                          <p className="text-error-500 text-xs mt-1">{errors.otherCostsPaymentDate.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {additionalCosts.length > 0 ? (
                  <div className="space-y-2">
                    {additionalCosts.map((cost) => (
                      <div key={cost.id} className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-lg border">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Tipo de Custo
                          </label>
                          <select
                            value={cost.type}
                            onChange={(e) => updateAdditionalCost(cost.id, 'type', e.target.value as 'Outros Custos' | 'Custos de Viagem' | 'Custos Operacionais')}
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                          >
                            <option value="Outros Custos">Outros Custos</option>
                            <option value="Custos de Viagem">Custos de Viagem</option>
                            <option value="Custos Operacionais">Custos Operacionais</option>
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Valor (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={cost.value}
                            onChange={(e) => updateAdditionalCost(cost.id, 'value', Number(e.target.value))}
                            placeholder="Valor"
                            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdditionalCost(cost.id)}
                          className="p-2 text-white bg-error-500 hover:bg-error-600 rounded-lg transition-colors mt-5"
                          title="Remover custo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                      <div className="text-xs font-medium text-neutral-800 mb-2">
                        Resumo dos Outros Custos:
                      </div>
                      {additionalCosts.map((cost) => (
                        <div key={cost.id} className="flex justify-between text-xs text-neutral-700 mb-1">
                          <span>{cost.type}:</span>
                          <span className="font-medium">R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-t border-neutral-300 pt-2 mt-2">
                        <span className="font-semibold text-neutral-800 text-xs">Total Outros Custos:</span>
                        <span className="font-bold text-neutral-600 text-sm">
                          R$ {totalAdditionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {/* Resumo do pagamento de outros custos */}
                      <div className="mt-2 pt-2 border-t border-neutral-300">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-3 h-3 text-b3x-lime-600" />
                          <span className="text-xs font-medium text-neutral-800">Pagamento dos Outros Custos:</span>
                        </div>
                        <div className="text-xs text-neutral-600">
                          {watchedValues.otherCostsPaymentType === 'cash' ? (
                            <p><span className="text-b3x-lime-600">✓</span> À Vista - Será processado junto com o pagamento principal</p>
                          ) : (
                            <p><span className="text-b3x-lime-600">📅</span> A Prazo - {watchedValues.otherCostsPaymentDate ? `Vencimento em ${new Date(watchedValues.otherCostsPaymentDate).toLocaleDateString('pt-BR')}` : 'Defina a data de vencimento'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-600 text-xs bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-neutral-400" />
                    </div>
                    <p className="font-medium">Nenhum custo adicional</p>
                    <p className="text-xs mt-1">Clique em "Adicionar Custo" para incluir custos extras</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo Financeiro da Compra - MELHORADO */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-4 h-4 text-b3x-lime-600" />
                <h3 className="text-base font-semibold text-b3x-navy-900">Resumo Financeiro da Compra</h3>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1 text-b3x-lime-600" />
                    Valor dos animais:
                  </span>
                  <span className="font-medium text-b3x-navy-900">R$ {animalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 flex items-center">
                    <HandCoins className="w-3 h-3 mr-1 text-b3x-lime-600" />
                    Comissão do Lote:
                  </span>
                  <span className="font-medium text-b3x-navy-900">R$ {(watchedValues.commission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-b3x-lime-600" />
                    Outros custos:
                  </span>
                  <span className="font-medium text-b3x-navy-900">R$ {totalAdditionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-b3x-navy-900 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-b3x-lime-600" />
                    Valor Total da Compra:
                  </span>
                  <span className="text-xl font-bold text-b3x-lime-600">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-neutral-50 p-2 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-neutral-600 flex items-center">
                      <ShoppingCart className="w-3 h-3 mr-1 text-b3x-lime-600" />
                      Valor por animal:
                    </span>
                    <span className="text-xs font-medium text-b3x-navy-900">
                      R$ {watchedValues.quantity ? (totalValue / watchedValues.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-neutral-600 flex items-center">
                      <Tag className="w-3 h-3 mr-1 text-b3x-lime-600" />
                      Valor de Compra (R$/@):
                    </span>
                    <span className="text-xs font-medium text-b3x-navy-900">
                      R$ {costPerArroba.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Observações
              </label>
              <textarea
                {...register('observations')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder="Observações adicionais sobre a compra..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-neutral-200">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-sm text-white bg-error-500 border border-error-600 rounded-lg hover:bg-error-600 transition-colors"
                >
                  Excluir Ordem
                </button>
              ) : (
                <div></div> // Empty div to maintain flex layout
              )}
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft text-sm"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Ordem de Compra'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Partner Forms */}
      {showNewVendorForm && (
        <Portal>
          <PartnerForm
            isOpen={showNewVendorForm}
            onClose={() => setShowNewVendorForm(false)}
            type="vendor"
          />
        </Portal>
      )}

      {showNewBrokerForm && (
        <Portal>
          <PartnerForm
            isOpen={showNewBrokerForm}
            onClose={() => setShowNewBrokerForm(false)}
            type="broker"
          />
        </Portal>
      )}

      {/* Confirm Delete Dialog */}
      {showDeleteConfirm && (
        <Portal>
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteOrder}
            title="Excluir Ordem de Compra"
            message="Tem certeza que deseja excluir esta ordem de compra? Esta ação não pode ser desfeita."
            confirmText="Excluir"
            type="danger"
          />
        </Portal>
      )}
    </>
  );
};