import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, DollarSign, HandCoins, FileText, Target, Calendar, CreditCard, Tag, ShoppingCart, Users, MapPin, Package, Scale } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PurchaseOrderFormData, AdditionalCost, PurchaseOrder } from '../../types';
import { PartnerForm } from './PartnerForm';
import { Portal } from '../Common/Portal';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const purchaseOrderSchema = z.object({
  cycleId: z.string().min(1, 'Selecione um ciclo'),
  date: z.date({
    required_error: "Data da compra é obrigatória",
    invalid_type_error: "Data inválida",
  }),
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
  commissionPaymentDate: z.date({
    required_error: "Data de pagamento da comissão é obrigatória para pagamento A Prazo",
    invalid_type_error: "Data inválida",
  }).optional(),
  taxes: z.number().min(0, 'Impostos devem ser maior ou igual a 0').optional(),
  taxesPaymentType: z.enum(['cash', 'installment']).optional(),
  taxesPaymentDate: z.date({
    required_error: "Data de pagamento dos impostos é obrigatória para pagamento A Prazo",
    invalid_type_error: "Data inválida",
  }).optional(),
  otherCostsPaymentType: z.enum(['cash', 'installment']).optional(),
  otherCostsPaymentDate: z.date({
    required_error: "Data de pagamento dos outros custos é obrigatória para pagamento A Prazo",
    invalid_type_error: "Data inválida",
  }).optional(),
  paymentType: z.enum(['cash', 'installment']),
  paymentDate: z.date({
    required_error: "Data de pagamento é obrigatória para pagamento A Prazo",
    invalid_type_error: "Data inválida",
  }).optional(),
  observations: z.string().optional(),
  rcPercentage: z.number().min(40, 'R.C. deve ser maior ou igual a 40%').max(60, 'R.C. deve ser menor ou igual a 60%').optional(),
}).refine((data) => {
  // Se for A Prazo, data de pagamento é obrigatória
  if (data.paymentType === 'installment' && !data.paymentDate) {
    return false;
  }
  // Se comissão for A Prazo, data é obrigatória
  if (data.commission > 0 && data.commissionPaymentType === 'installment' && !data.commissionPaymentDate) {
    return false;
  }
  // Se outros custos for A Prazo, data é obrigatória
  if (data.otherCostsPaymentType === 'installment' && !data.otherCostsPaymentDate) {
    return false;
  }
  return true;
}, {
  message: "Data de pagamento é obrigatória para pagamento A Prazo",
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
    // Verificar se há custos adicionais A Prazo sem data
    const hasInvalidAdditionalCosts = additionalCosts.some(
      cost => cost.paymentType === 'installment' && !cost.paymentDate
    );

    if (hasInvalidAdditionalCosts) {
      alert('Por favor, defina uma data de pagamento para todos os custos adicionais A Prazo.');
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
            {/* Informações do Negócio */}
            <div className="bg-white/50 rounded-lg p-4 border border-neutral-100">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Informações do Negócio</h3>
              
              {/* Basic Information */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Dados Básicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Ciclo *
                    </label>
                    <select
                      {...register('cycleId')}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
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
                      required
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    />
                    {errors.date && (
                      <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor and Broker */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Vendedor e Corretor
                </h4>
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
              </div>

              {/* Location */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Localização
                </h4>
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
              </div>

              {/* Animal Details */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Detalhes dos Animais
                </h4>
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
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
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
              </div>

              {/* Weight */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <Scale className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Peso e Rendimento
                </h4>
                <div className="mb-3">
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

                {/* R.C. % e Peso de Carcaça Estimado */}
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
              </div>
            </div>

            {/* Bloco Financeiro - REFORMULADO */}
            <div className="bg-white/50 rounded-lg p-4 border border-neutral-100">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Bloco Financeiro</h3>
              
              {/* Preço e Condições de Pagamento */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Preço e Condições de Pagamento
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
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
              </div>
              
              {/* Comissão do Lote */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-3 flex items-center">
                  <HandCoins className="w-4 h-4 mr-2 text-b3x-lime-600" />
                  Comissão do Lote
                </h4>
                
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
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
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
              </div>

              {/* Outros Custos */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-b3x-navy-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-b3x-lime-600" />
                    Outros Custos
                  </h4>
                  <button
                    type="button"
                    onClick={addAdditionalCost}
                    className="flex items-center space-x-1 px-2 py-1 bg-b3x-lime-500 text-b3x-navy-900 text-xs font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {additionalCosts.length > 0 ? (
                  <div className="space-y-3">
                    {/* Opções de pagamento para Outros Custos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Tipo de Pagamento (Outros Custos)
                        </label>
                        <select
                          {...register('otherCostsPaymentType')}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
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

                    {/* Lista de custos adicionais */}
                    <div className="space-y-2">
                      {additionalCosts.map((cost) => (
                        <div key={cost.id} className="flex items-center space-x-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1">
                                Tipo de Custo
                              </label>
                              <select
                                value={cost.type}
                                onChange={(e) => updateAdditionalCost(cost.id, 'type', e.target.value as 'Outros Custos' | 'Custos de Viagem' | 'Custos Operacionais')}
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent appearance-none bg-white"
                              >
                                <option value="Outros Custos">Outros Custos</option>
                                <option value="Custos de Viagem">Custos de Viagem</option>
                                <option value="Custos Operacionais">Custos Operacionais</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 mb-1">
                                Valor (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={cost.value}
                                onChange={(e) => updateAdditionalCost(cost.id, 'value', Number(e.target.value))}
                                placeholder="0,00"
                                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAdditionalCost(cost.id)}
                            className="p-2 text-error-500 hover:bg-error-50 rounded-lg transition-colors mt-5"
                            title="Remover custo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Resumo dos custos adicionais */}
                    <div className="bg-neutral-100 rounded-lg p-3 border border-neutral-200">
                      <div className="text-xs font-medium text-neutral-800 mb-2">
                        Total de Outros Custos:
                      </div>
                      <div className="text-sm font-bold text-b3x-navy-900">
                        R$ {totalAdditionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500 text-sm bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                    <Plus className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                    <p>Nenhum custo adicional</p>
                    <p className="text-xs mt-1">Clique em "Adicionar" para incluir custos extras</p>
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
                    Valor dos animais
                    <span className="text-xs text-neutral-500 ml-1">
                      ({watchedValues.paymentType === 'cash' ? 'À Vista' : 
                        watchedValues.paymentDate ? 
                          `A Prazo - ${new Date(watchedValues.paymentDate).toLocaleDateString('pt-BR')}` : 
                          'A Prazo'})
                    </span>:
                  </span>
                  <span className="font-medium text-b3x-navy-900">R$ {animalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 flex items-center">
                    <HandCoins className="w-3 h-3 mr-1 text-b3x-lime-600" />
                    Comissão do Lote
                    {(watchedValues.commission || 0) > 0 && (
                      <span className="text-xs text-neutral-500 ml-1">
                        ({watchedValues.commissionPaymentType === 'cash' ? 'À Vista' : 
                          watchedValues.commissionPaymentDate ? 
                            `A Prazo - ${new Date(watchedValues.commissionPaymentDate).toLocaleDateString('pt-BR')}` : 
                            'A Prazo'})
                      </span>
                    )}:
                  </span>
                  <span className="font-medium text-b3x-navy-900">R$ {(watchedValues.commission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-600 flex items-center">
                    <FileText className="w-3 h-3 mr-1 text-b3x-lime-600" />
                    Outros custos
                    {additionalCosts.length > 0 && (
                      <span className="text-xs text-neutral-500 ml-1">
                        ({watchedValues.otherCostsPaymentType === 'cash' ? 'À Vista' : 
                          watchedValues.otherCostsPaymentDate ? 
                            `A Prazo - ${new Date(watchedValues.otherCostsPaymentDate).toLocaleDateString('pt-BR')}` : 
                            'A Prazo'})
                      </span>
                    )}:
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