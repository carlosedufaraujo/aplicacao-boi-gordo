import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CashFlowEntryFormData } from '../../types';
import { format } from 'date-fns';

const cashFlowEntrySchema = z.object({
  date: z.date({
    required_error: 'Data é obrigatória'
  }),
  type: z.enum(['aporte', 'receita', 'despesa', 'financiamento', 'investimento', 'transferencia'], {
    required_error: 'Tipo é obrigatório'
  }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  plannedAmount: z.number().positive('Valor deve ser positivo'),
  actualAmount: z.number().positive('Valor deve ser positivo').optional(),
  status: z.enum(['projetado', 'realizado', 'parcial', 'cancelado']).default('projetado'),
  bankAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

interface CashFlowFormProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: CashFlowEntryFormData & { id: string };
}

export const CashFlowForm: React.FC<CashFlowFormProps> = ({ isOpen, onClose, entryToEdit }) => {
  const { addCashFlowEntry, updateCashFlowEntry, payerAccounts } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CashFlowEntryFormData>({
    resolver: zodResolver(cashFlowEntrySchema),
    defaultValues: entryToEdit || {
      date: new Date(),
      type: 'despesa',
      status: 'projetado',
      plannedAmount: 0
    }
  });

  const watchType = watch('type');
  const watchStatus = watch('status');

  const onSubmit = (data: CashFlowEntryFormData) => {
    if (entryToEdit?.id) {
      updateCashFlowEntry(entryToEdit.id, data);
    } else {
      addCashFlowEntry(data);
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const categoryOptions = {
    aporte: ['Capital Social', 'Empréstimo Sócios', 'Outros Aportes'],
    receita: ['Vendas', 'Rendimentos', 'Outros Recebimentos'],
    despesa: ['Compra de Gado', 'Alimentação', 'Sanidade', 'Operacional', 'Administrativo', 'Outros'],
    financiamento: ['Bancário', 'Fornecedores', 'Outros'],
    investimento: ['Infraestrutura', 'Equipamentos', 'Tecnologia', 'Outros'],
    transferencia: ['Entre Contas', 'Aplicações', 'Resgates']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-b3x-navy-900">
            {entryToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                {...register('date', { valueAsDate: true })}
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="aporte">Aporte</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="financiamento">Financiamento</option>
                <option value="investimento">Investimento</option>
                <option value="transferencia">Transferência</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Categoria *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="">Selecione uma categoria</option>
                {categoryOptions[watchType]?.map(cat => (
                  <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '_')}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subcategoria
              </label>
              <input
                type="text"
                {...register('subcategory')}
                placeholder="Detalhamento opcional"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              {...register('description')}
              placeholder="Descreva o lançamento"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valor Planejado *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('plannedAmount', { valueAsNumber: true })}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
              {errors.plannedAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.plannedAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valor Realizado
              </label>
              <input
                type="number"
                step="0.01"
                {...register('actualAmount', { valueAsNumber: true })}
                placeholder="0,00"
                disabled={watchStatus === 'projetado'}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent disabled:bg-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="projetado">Projetado</option>
                <option value="realizado">Realizado</option>
                <option value="parcial">Parcial</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Conta Bancária
              </label>
              <select
                {...register('bankAccountId')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="">Selecione uma conta</option>
                {payerAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.bankName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Informações adicionais"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600"
            >
              {entryToEdit ? 'Salvar Alterações' : 'Adicionar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 