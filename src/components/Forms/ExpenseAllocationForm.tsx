import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calculator, Plus, Trash2, DollarSign, Building2, Users, FileText, CreditCard } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const expenseAllocationSchema = z.object({
  date: z.date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  purchaseValue: z.number().min(0.01, 'Valor deve ser maior que 0'),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  allocationType: z.enum(['direct', 'indirect']),
  allocations: z.array(z.object({
    targetType: z.enum(['pen', 'cost_center']), // Mudado de 'lot' para 'pen' (curral)
    targetId: z.string().min(1, 'Selecione um destino'),
    amount: z.number().min(0),
    percentage: z.number().min(0).max(100, 'Percentual deve estar entre 0 e 100'),
    allocationMethod: z.enum(['manual_value', 'percentage_allocation', 'equal_split'])
  })).min(1, 'Pelo menos uma alocação é obrigatória')
});

interface ExpenseAllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseAllocationForm: React.FC<ExpenseAllocationFormProps> = ({
  isOpen,
  onClose
}) => {
  const { costCenters, cattlePurchases, partners, addExpense, penRegistrations, loteCurralLinks } = useAppStore();
  const [equalSplitActive, setEqualSplitActive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(expenseAllocationSchema),
    defaultValues: {
      date: new Date(),
      description: '',
      category: 'feed',
      purchaseValue: 0,
      supplierId: '',
      invoiceNumber: '',
      allocationType: 'direct' as const,
      allocations: [{ 
        targetType: 'pen' as const, 
        targetId: '', 
        amount: 0, 
        percentage: 100, 
        allocationMethod: 'percentage_allocation' as const 
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "allocations"
  });

  const watchedValues = watch();
  const suppliers = partners.filter(p => p.type === 'vendor' && p.isActive);
  const activeCostCenters = costCenters.filter(cc => cc.isActive);
  const activeLots = cattlePurchases.filter(lot => lot.status === 'active');

  // Mapear categorias para tipos de centro de custo
  const categoryToType: Record<string, string> = {
    // Aquisição
    'animal_purchase': 'acquisition',
    'commission': 'acquisition',
    'freight': 'acquisition',
    'acquisition_other': 'acquisition',
    
    // Engorda
    'feed': 'fattening',
    'health_costs': 'fattening',
    'operational_costs': 'fattening',
    'fattening_other': 'fattening',
    
    // Administrativo
    'accounting': 'administrative',
    'office': 'administrative',
    'services': 'administrative',
    'technology': 'administrative',
    
    // Financeiro
    'taxes': 'financial',
    'interest': 'financial',
    'fees': 'financial',
    'insurance': 'financial',
    'capital_cost': 'financial',
    'financial_management': 'financial',
    'deaths': 'financial',
    'default': 'financial',
    'financial_other': 'financial'
  };

  // Obter as categorias de despesa com base no tipo selecionado
  const getExpenseCategories = () => {
    const categories = {
      acquisition: [
        { value: 'animal_purchase', label: 'Compra de Animais' },
        { value: 'commission', label: 'Comissão' },
        { value: 'freight', label: 'Frete' },
        { value: 'acquisition_other', label: 'Outros Custos de Aquisição' }
      ],
      fattening: [
        { value: 'feed', label: 'Alimentação' },
        { value: 'health_costs', label: 'Custos Sanitários' },
        { value: 'operational_costs', label: 'Custos Operacionais' },
        { value: 'fattening_other', label: 'Outros Custos de Engorda' }
      ],
      administrative: [
        { value: 'accounting', label: 'Contabilidade' },
        { value: 'office', label: 'Escritório' },
        { value: 'services', label: 'Prestação de Serviço' },
        { value: 'technology', label: 'Tecnologia' }
      ],
      financial: [
        { value: 'taxes', label: 'Impostos' },
        { value: 'interest', label: 'Juros' },
        { value: 'fees', label: 'Taxas & Emolumentos' },
        { value: 'insurance', label: 'Seguros' },
        { value: 'capital_cost', label: 'Custo de Capital' },
        { value: 'financial_management', label: 'Fee de Gestão Financeira' },
        { value: 'deaths', label: 'Mortes' },
        { value: 'default', label: 'Inadimplência' },
        { value: 'financial_other', label: 'Outros Custos Financeiros' }
      ]
    };

    return Object.values(categories).flat();
  };

  // Obter o nome legível da categoria
  const getCategoryLabel = (categoryValue: string) => {
    const category = getExpenseCategories().find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  // Obter o tipo de centro de custo com base na categoria
  const getCostCenterType = () => {
    return categoryToType[watchedValues.category] || '';
  };

  // Filtrar centros de custo relevantes com base na categoria selecionada
  const getRelevantCostCenters = () => {
    const relevantType = getCostCenterType();
    if (relevantType) {
      return activeCostCenters.filter(cc => cc.type === relevantType);
    }
    return activeCostCenters;
  };

  // Adicionar nova alocação
  const addAllocation = () => {
    append({ 
      targetType: watchedValues.allocationType === 'direct' ? 'pen' : 'cost_center', 
      targetId: '', 
      amount: 0, 
      percentage: 0, 
      allocationMethod: 'manual_value' as const
    });
  };

  // Dividir o valor igualmente entre todas as alocações
  const handleDivideEqually = () => {
    const purchaseValue = watchedValues.purchaseValue || 0;
    const allocationsCount = fields.length;
    
    if (allocationsCount > 0 && purchaseValue > 0) {
      const equalAmount = purchaseValue / allocationsCount;
      const equalPercentage = 100 / allocationsCount;
      
      fields.forEach((_, index) => {
        setValue(`allocations.${index}.amount`, equalAmount);
        setValue(`allocations.${index}.percentage`, equalPercentage);
        setValue(`allocations.${index}.allocationMethod`, 'equal_split');
      });
      
      setEqualSplitActive(true);
    }
  };

  // Atualizar valor quando percentual mudar
  const updateAmountFromPercentage = (index: number, percentage: number) => {
    const purchaseValue = watchedValues.purchaseValue || 0;
    const amount = (purchaseValue * percentage) / 100;
    setValue(`allocations.${index}.amount`, amount);
    setValue(`allocations.${index}.allocationMethod`, 'percentage_allocation');
    setEqualSplitActive(false);
  };

  // Atualizar percentual quando valor mudar
  const updatePercentageFromAmount = (index: number, amount: number) => {
    const purchaseValue = watchedValues.purchaseValue || 0;
    if (purchaseValue > 0) {
      const percentage = (amount / purchaseValue) * 100;
      setValue(`allocations.${index}.percentage`, percentage);
      setValue(`allocations.${index}.allocationMethod`, 'manual_value');
      setEqualSplitActive(false);
    }
  };

  // Atualizar todos os valores quando o valor total mudar
  React.useEffect(() => {
    const purchaseValue = watchedValues.purchaseValue || 0;
    
    if (equalSplitActive && fields.length > 0) {
      handleDivideEqually();
    } else {
      fields.forEach((_, index) => {
        const method = watchedValues.allocations[index]?.allocationMethod;
        const percentage = watchedValues.allocations[index]?.percentage || 0;
        
        if (method === 'percentage_allocation' && purchaseValue > 0) {
          const amount = (purchaseValue * percentage) / 100;
          setValue(`allocations.${index}.amount`, amount);
        }
      });
    }
  }, [watchedValues.purchaseValue]);

  // Atualizar tipo de destino quando o tipo de alocação mudar
  React.useEffect(() => {
    const allocationType = watchedValues.allocationType;
    
    fields.forEach((_, index) => {
      setValue(`allocations.${index}.targetType`, allocationType === 'direct' ? 'lot' : 'cost_center');
      setValue(`allocations.${index}.targetId`, ''); // Limpar seleção anterior
    });
    
    // Se for alocação indireta, configurar automaticamente para 100% no primeiro centro de custo relevante
    if (allocationType === 'indirect') {
      const relevantCenters = getRelevantCostCenters();
      if (relevantCenters.length > 0 && fields.length > 0) {
        setValue(`allocations.0.targetId`, relevantCenters[0].id);
        setValue(`allocations.0.percentage`, 100);
        setValue(`allocations.0.amount`, watchedValues.purchaseValue || 0);
        
        // Remover alocações adicionais se houver
        while (fields.length > 1) {
          remove(fields.length - 1);
        }
      }
    }
  }, [watchedValues.allocationType]);

  // Atualizar tipo de alocação quando a categoria mudar
  React.useEffect(() => {
    const costCenterType = getCostCenterType();
    
    // Para categorias de aquisição e engorda, sugerir alocação direta (lotes)
    // Para categorias administrativas e financeiras, sugerir alocação indireta (centros)
    if (costCenterType === 'acquisition' || costCenterType === 'fattening') {
      setValue('allocationType', 'direct');
    } else {
      setValue('allocationType', 'indirect');
    }
  }, [watchedValues.category]);

  const handleFormSubmit = (data: any) => {
    // Validar se a soma dos percentuais é 100%
    const totalPercentage = data.allocations.reduce((sum: number, allocation: any) => sum + allocation.percentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('A soma dos percentuais deve ser 100%');
      return;
    }

    // Preparar dados para salvar
    const expenseData = {
      ...data,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    addExpense(expenseData);
    reset();
    onClose();
  };

  const totalPercentage = watchedValues.allocations?.reduce((sum, alloc) => sum + (alloc.percentage || 0), 0) || 0;
  const totalAllocated = watchedValues.allocations?.reduce((sum, alloc) => sum + (alloc.amount || 0), 0) || 0;
  const unallocatedAmount = (watchedValues.purchaseValue || 0) - totalAllocated;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Nova Despesa</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Registre uma despesa e aloque aos centros de custo ou lotes
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
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Informações Básicas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data da Despesa *
                </label>
                <input
                  type="date"
                  {...register('date', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchaseValue', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  placeholder="Ex: 15000.00"
                />
                {errors.purchaseValue && (
                  <p className="text-error-500 text-xs mt-1">{errors.purchaseValue.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                {...register('description')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                placeholder="Ex: Compra de ração concentrada"
              />
              {errors.description && (
                <p className="text-error-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Fornecedor e Nota Fiscal */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Dados do Fornecedor</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fornecedor
                </label>
                <select
                  {...register('supplierId')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Número da Nota Fiscal
                </label>
                <input
                  type="text"
                  {...register('invoiceNumber')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  placeholder="Ex: NF-123456"
                />
              </div>
            </div>
          </div>

          {/* Categoria e Tipo de Alocação Unificados */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Categoria e Destino da Despesa</h3>
            </div>
            
            {/* Seleção de Categoria Macro */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                getCostCenterType() === 'acquisition' 
                  ? 'border-b3x-lime-300 bg-b3x-lime-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  name="categoryType" 
                  className="sr-only" 
                  checked={getCostCenterType() === 'acquisition'}
                  onChange={() => setValue('category', 'animal_purchase')}
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-b3x-lime-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-b3x-lime-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Aquisição</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                getCostCenterType() === 'fattening' 
                  ? 'border-success-300 bg-success-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  name="categoryType" 
                  className="sr-only" 
                  checked={getCostCenterType() === 'fattening'}
                  onChange={() => setValue('category', 'feed')}
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-success-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Engorda</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                getCostCenterType() === 'administrative' 
                  ? 'border-info-300 bg-info-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  name="categoryType" 
                  className="sr-only" 
                  checked={getCostCenterType() === 'administrative'}
                  onChange={() => setValue('category', 'accounting')}
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-info-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-info-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Administrativo</div>
                </div>
              </label>
              
              <label className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                getCostCenterType() === 'financial' 
                  ? 'border-warning-300 bg-warning-50' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
                <input 
                  type="radio" 
                  name="categoryType" 
                  className="sr-only" 
                  checked={getCostCenterType() === 'financial'}
                  onChange={() => setValue('category', 'taxes')}
                />
                <div className="text-center">
                  <div className="w-8 h-8 bg-warning-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-warning-600" />
                  </div>
                  <div className="font-medium text-b3x-navy-900 text-sm">Financeiro</div>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Subcategoria */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Subcategoria *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                >
                  {getCostCenterType() === 'acquisition' && (
                    <>
                      <option value="animal_purchase">Compra de Animais</option>
                      <option value="commission">Comissão</option>
                      <option value="freight">Frete</option>
                      <option value="acquisition_other">Outros Custos de Aquisição</option>
                    </>
                  )}
                  
                  {getCostCenterType() === 'fattening' && (
                    <>
                      <option value="feed">Alimentação</option>
                      <option value="health_costs">Custos Sanitários</option>
                      <option value="operational_costs">Custos Operacionais</option>
                      <option value="fattening_other">Outros Custos de Engorda</option>
                    </>
                  )}
                  
                  {getCostCenterType() === 'administrative' && (
                    <>
                      <option value="accounting">Contabilidade</option>
                      <option value="office">Escritório</option>
                      <option value="services">Prestação de Serviço</option>
                      <option value="technology">Tecnologia</option>
                    </>
                  )}
                  
                  {getCostCenterType() === 'financial' && (
                    <>
                      <option value="taxes">Impostos</option>
                      <option value="interest">Juros</option>
                      <option value="fees">Taxas & Emolumentos</option>
                      <option value="insurance">Seguros</option>
                      <option value="capital_cost">Custo de Capital</option>
                      <option value="financial_management">Fee de Gestão Financeira</option>
                      <option value="deaths">Mortes</option>
                      <option value="default">Inadimplência</option>
                      <option value="financial_other">Outros Custos Financeiros</option>
                    </>
                  )}
                </select>
                {errors.category && (
                  <p className="text-error-500 text-xs mt-1">{errors.category.message}</p>
                )}
              </div>

              {/* Tipo de Alocação */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Destino da Alocação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                    watchedValues.allocationType === 'direct' 
                      ? 'border-b3x-lime-300 bg-b3x-lime-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}>
                    <input
                      type="radio"
                      {...register('allocationType')}
                      value="direct"
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border ${
                      watchedValues.allocationType === 'direct' 
                        ? 'border-b3x-lime-500 bg-b3x-lime-500' 
                        : 'border-neutral-300'
                    }`}>
                      {watchedValues.allocationType === 'direct' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-b3x-navy-900">Lotes</span>
                      <div className="text-xs text-neutral-600 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span>Alocação Direta</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                    watchedValues.allocationType === 'indirect' 
                      ? 'border-info-300 bg-info-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}>
                    <input
                      type="radio"
                      {...register('allocationType')}
                      value="indirect"
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border ${
                      watchedValues.allocationType === 'indirect' 
                        ? 'border-info-500 bg-info-500' 
                        : 'border-neutral-300'
                    }`}>
                      {watchedValues.allocationType === 'indirect' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-b3x-navy-900">Centros</span>
                      <div className="text-xs text-neutral-600 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        <span>Alocação Indireta</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Recomendação baseada na categoria */}
            <div className="bg-neutral-50 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 bg-b3x-lime-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-b3x-lime-600" />
                </div>
                <h4 className="text-sm font-medium text-b3x-navy-900">Recomendação de Alocação</h4>
              </div>
              <p className="text-xs text-neutral-600 ml-7">
                {getCostCenterType() === 'acquisition' || getCostCenterType() === 'fattening' ? (
                  <>
                    Para despesas de <span className="font-medium">{getCategoryLabel(watchedValues.category)}</span>, 
                    recomendamos alocação <span className="font-medium text-b3x-lime-700">direta para lotes</span> para 
                    melhor rastreabilidade de custos.
                  </>
                ) : (
                  <>
                    Para despesas de <span className="font-medium">{getCategoryLabel(watchedValues.category)}</span>, 
                    recomendamos alocação <span className="font-medium text-info-700">indireta para centros de custo</span> por 
                    serem custos compartilhados.
                  </>
                )}
              </p>
            </div>

            {/* Seleção de Centro de Custo para Alocação Indireta */}
            {watchedValues.allocationType === 'indirect' && (
              <div className="bg-info-50 p-4 rounded-lg border border-info-200">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-info-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-info-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-b3x-navy-900">
                      Selecione o Centro de Custo
                    </h4>
                    <p className="text-xs text-neutral-600 mt-1">
                      Selecione o centro de custo para alocar 100% desta despesa
                    </p>
                  </div>
                </div>

                <select
                  {...register(`allocations.0.targetId`)}
                  className="w-full px-3 py-2 text-sm border border-info-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-info-500 bg-white/90"
                >
                  <option value="">Selecione o centro de custo</option>
                  {getRelevantCostCenters().map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </option>
                  ))}
                </select>
                {errors.allocations?.[0]?.targetId && (
                  <p className="text-error-500 text-xs mt-1">
                    {errors.allocations?.[0]?.targetId?.message}
                  </p>
                )}
                <input 
                  type="hidden" 
                  {...register(`allocations.0.targetType`)} 
                  value="cost_center" 
                />
                <input 
                  type="hidden" 
                  {...register(`allocations.0.percentage`)} 
                  value="100" 
                />
                <input 
                  type="hidden" 
                  {...register(`allocations.0.amount`)} 
                  value={watchedValues.purchaseValue || 0} 
                />
                <input 
                  type="hidden" 
                  {...register(`allocations.0.allocationMethod`)} 
                  value="percentage_allocation" 
                />
              </div>
            )}
          </div>

          {/* Alocações - Mostrar apenas para alocação direta */}
          {watchedValues.allocationType === 'direct' && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-b3x-navy-600" />
                  <h3 className="text-base font-semibold text-b3x-navy-900">
                    Rateio da Despesa
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleDivideEqually}
                    className="px-3 py-1.5 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors text-xs"
                    disabled={fields.length === 0 || !watchedValues.purchaseValue}
                  >
                    Dividir Igualmente
                  </button>
                  <button
                    type="button"
                    onClick={addAllocation}
                    className="px-3 py-1.5 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors text-xs"
                  >
                    Adicionar Lote
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      {/* Destino (Lote) */}
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Lote
                        </label>
                        <select
                          {...register(`allocations.${index}.targetId`)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                        >
                          <option value="">Selecione</option>
                          {activeLots.map(lot => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotNumber} - {lot.entryQuantity} animais
                            </option>
                          ))}
                        </select>
                        {errors.allocations?.[index]?.targetId && (
                          <p className="text-error-500 text-xs mt-1">
                            {errors.allocations?.[index]?.targetId?.message}
                          </p>
                        )}
                        <input 
                          type="hidden" 
                          {...register(`allocations.${index}.targetType`)} 
                          value="lot" 
                        />
                      </div>

                      {/* Valor */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`allocations.${index}.amount`, { 
                            valueAsNumber: true,
                            onChange: (e) => updatePercentageFromAmount(index, Number(e.target.value))
                          })}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                          placeholder="Valor"
                        />
                      </div>

                      {/* Percentual */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Percentual (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register(`allocations.${index}.percentage`, { 
                            valueAsNumber: true,
                            onChange: (e) => updateAmountFromPercentage(index, Number(e.target.value))
                          })}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                        />
                        <input 
                          type="hidden" 
                          {...register(`allocations.${index}.allocationMethod`)} 
                        />
                      </div>

                      {/* Botão Remover */}
                      <div className="md:col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo de Alocação */}
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-600">Total Alocado:</span>
                  <span className={`font-bold text-sm ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-success-600' : 'text-error-600'}`}>
                    {totalPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-600">Valor Alocado:</span>
                  <span className={`font-bold text-sm ${Math.abs(totalAllocated - (watchedValues.purchaseValue || 0)) < 0.01 ? 'text-success-600' : 'text-error-600'}`}>
                    R$ {totalAllocated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-600">Valor Não Alocado:</span>
                  <span className={`font-bold text-sm ${Math.abs(unallocatedAmount) < 0.01 ? 'text-success-600' : 'text-error-600'}`}>
                    R$ {unallocatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Math.abs(totalPercentage - 100) >= 0.01 && (
                  <p className="text-error-500 text-xs mt-1">
                    O total deve ser exatamente 100%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Ações */}
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
              disabled={watchedValues.allocationType === 'direct' && Math.abs(totalPercentage - 100) >= 0.01}
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-navy-500 to-b3x-navy-600 text-white font-medium rounded-lg hover:from-b3x-navy-600 hover:to-b3x-navy-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-3 h-3" />
              <span>Registrar Despesa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
