import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, FileText, DollarSign } from 'lucide-react';
import { DatePickerField } from '@/components/Common/DatePickerField';
import { useAppStore } from '../../stores/useAppStore';
import { FatteningCycle } from '../../types';

const cycleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  startDate: z.date({
    required_error: "Data de início é obrigatória",
    invalid_type_error: "Data inválida",
  }),
  endDate: z.date({
    required_error: "Data de término é obrigatória",
    invalid_type_error: "Data inválida",
  }).optional(),
  status: z.enum(['active', 'completed', 'planned']),
  description: z.string().optional(),
  budget: z.number().min(0, 'Orçamento deve ser maior ou igual a 0').optional(),
  targetAnimals: z.number().min(0, 'Número de animais deve ser maior ou igual a 0').optional(),
});

type CycleFormData = z.infer<typeof cycleSchema>;

interface CycleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: FatteningCycle;
}

export const CycleForm: React.FC<CycleFormProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addCycle, updateCycle } = useAppStore();
  const isEditing = !!initialData;

  const form = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: new Date(initialData.startDate),
      endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
    } : {
      status: 'planned',
      startDate: new Date()
    }
  });

  const onSubmit = (data: CycleFormData) => {
    if (isEditing && initialData) {
      updateCycle(initialData.id, data);
    } else {
      addCycle(data);
    }
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Editar Ciclo' : 'Novo Ciclo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Nome do Ciclo */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nome do Ciclo *
            </label>
            <div className="relative">
              <input
                type="text"
                {...form.form.register('name')}
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder="Ex: Ciclo 2024-01"
              />
              <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
            {form.formState.errors.name && (
              <p className="text-error-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Status *
            </label>
            <select
              {...form.register('status')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="planned">Planejado</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
            </select>
            {form.formState.errors.status && (
              <p className="text-error-500 text-xs mt-1">{form.formState.errors.status.message}</p>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <DatePickerField
              control={form.control}
              name="startDate"
              label="Data de Início"
              placeholder="Selecione a data de início"
              required
            />

            <DatePickerField
              control={form.control}
              name="endDate"
              label="Data de Término"
              placeholder="Selecione a data de término"
              minDate={form.watch('startDate')}
            />
          </div>

          {/* Orçamento e Meta de Animais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Orçamento (R$)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  {...form.register('budget', { valueAsNumber: true })}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="0,00"
                />
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
              {form.formState.errors.budget && (
                <p className="text-error-500 text-xs mt-1">{form.formState.errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Meta de Animais
              </label>
              <input
                type="number"
                {...form.register('targetAnimals', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder="0"
              />
              {form.formState.errors.targetAnimals && (
                <p className="text-error-500 text-xs mt-1">{form.formState.errors.targetAnimals.message}</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Descrição
            </label>
            <textarea
              {...form.register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent resize-none"
              placeholder="Observações sobre o ciclo..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-700 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft"
            >
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 