import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ExpenseFormData, EXPENSE_CATEGORIES } from '../../types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

const expenseSchema = z.object({
  date: z.date(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.enum([
    // Aquisição
    'animal_purchase', 'commission', 'freight', 'acquisition_other',
    // Engorda
    'feed', 'health_costs', 'operational_costs', 'fattening_other', 'deaths', 'currentWeight_loss',
    // Administrativo
    'general_admin', 'marketing', 'accounting', 'personnel', 'office', 'services', 'technology', 'admin_other', 'depreciation',
    // Financeiro
    'taxes', 'interest', 'fees', 'insurance', 'capital_cost', 'financial_management', 'default', 'tax_deductions', 'slaughterhouse_advance', 'financial_other',
    // Vendas
    'sales_commission', 'sales_freight', 'grading_costs', 'sales_other',
    // Receitas
    'cattle_sales', 'service_revenue', 'byproduct_sales', 'other_revenue',
    // Aportes e Financiamentos
    'partner_contribution', 'partner_loan', 'bank_financing', 'external_investor'
  ]),
  purchaseValue: z.number().positive('Valor deve ser positivo'),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dueDate: z.date(),
  isPaid: z.boolean(),
  allocationType: z.enum(['direct', 'indirect']),
  allocations: z.array(z.object({
    targetType: z.enum(['lot', 'cost_center']),
    targetId: z.string(),
    amount: z.number(),
    percentage: z.number(),
    allocationMethod: z.enum(['manual_value', 'percentage_allocation', 'equal_split'])
  })).optional()
});

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: any; // Para edição
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, expense }) => {
  const { partners, cattlePurchases, costCenters, addExpense, updateExpense } = useAppStore();
  const [showAllocations, setShowAllocations] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      isPaid: false,
      dueDate: new Date(),
      allocationType: 'direct',
      allocations: []
    }
  });

  const selectedCategory = watch('category');
  const allocationType = watch('allocationType');
  const purchaseValue = watch('purchaseValue');

  // Agrupar categorias por centro de custo
  const categoriesByCenter = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.costCenter]) acc[cat.costCenter] = [];
    acc[cat.costCenter].push(cat);
    return acc;
  }, {} as Record<string, typeof EXPENSE_CATEGORIES>);

  // Obter informações da categoria selecionada
  const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.category === selectedCategory);
  const isRevenue = categoryInfo?.isRevenue || false;

  useEffect(() => {
    if (expense) {
      reset({
        ...expense,
        date: new Date(expense.date),
        dueDate: new Date(expense.dueDate)
      });
    }
  }, [expense, reset]);

  const onSubmit = (data: ExpenseFormData) => {
    if (expense) {
      updateExpense(expense.id, data);
    } else {
      addExpense(data);
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {expense ? 'Editar' : 'Nova'} {isRevenue ? 'Receita' : 'Despesa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  {...register('date', { valueAsDate: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Selecione...</option>
                  {Object.entries(categoriesByCenter).map(([center, categories]) => (
                    <optgroup key={center} label={center.replace(/_/g, ' ').toUpperCase()}>
                      {categories.map(cat => (
                        <option key={cat.category} value={cat.category}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva a despesa..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchaseValue', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
                {errors.purchaseValue && (
                  <p className="text-red-500 text-xs mt-1">{errors.purchaseValue.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor (opcional)
                </label>
                <select
                  {...register('supplierId')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Selecione...</option>
                  {partners
                    .filter(p => p.type === 'vendor')
                    .map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nº Nota Fiscal (opcional)
                </label>
                <input
                  type="text"
                  {...register('invoiceNumber')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="NF-123456"
                />
              </div>
            </div>
          </div>

          {/* Modelo Híbrido - Previsto/Realizado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status do Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  {...register('dueDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isPaid')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isRevenue ? 'Recebido' : 'Pago'}
                  </span>
                </label>
              </div>
            </div>

            {/* Informação sobre impacto no caixa */}
            {categoryInfo && !categoryInfo.impactsCashFlow && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta categoria não impacta o fluxo de caixa e será enviada diretamente para o DRE.
                </p>
              </div>
            )}
          </div>

          {/* Alocação */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Tipo de Alocação</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="direct"
                    {...register('allocationType')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Direta</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="indirect"
                    {...register('allocationType')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Rateada</span>
                </label>
              </div>
            </div>

            {allocationType === 'indirect' && (
              <button
                type="button"
                onClick={() => setShowAllocations(!showAllocations)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAllocations ? 'Ocultar' : 'Configurar'} Rateio
              </button>
            )}

            {showAllocations && allocationType === 'indirect' && (
              <div className="border rounded-lg p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Configure como o valor será distribuído entre lotes ou centros de custo.
                </p>
                {/* TODO: Implementar interface de rateio */}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {expense ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 