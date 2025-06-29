import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, CreditCard, Calendar, FileText, DollarSign, Tag, User, Briefcase } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { BankStatementFormData } from '../../types';

const bankStatementSchema = z.object({
  bankAccount: z.string().min(1, 'Selecione uma conta bancária'),
  date: z.date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().refine(val => val !== 0, 'Valor não pode ser zero'),
  type: z.enum(['debit', 'credit']),
  reference: z.string().optional(),
  category: z.string().optional(),
  payee: z.string().optional(),
  tags: z.array(z.string()).optional()
});

interface BankStatementFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<BankStatementFormData>;
}

export const BankStatementForm: React.FC<BankStatementFormProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addBankStatement, payerAccounts, addNotification } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BankStatementFormData>({
    resolver: zodResolver(bankStatementSchema),
    defaultValues: {
      date: new Date(),
      type: 'debit',
      ...initialData
    }
  });

  const watchedType = watch('type');

  const handleFormSubmit = (data: BankStatementFormData) => {
    // Ajustar o valor com base no tipo (débito deve ser negativo)
    const adjustedAmount = data.type === 'debit' ? -Math.abs(data.amount) : Math.abs(data.amount);
    
    // Adicionar o extrato bancário
    addBankStatement({
      ...data,
      amount: adjustedAmount,
      tags: selectedTags,
      balance: 0, // Seria calculado em uma implementação real
      reconciled: false
    });
    
    // Notificar o usuário
    addNotification({
      title: 'Lançamento bancário registrado',
      message: `${data.type === 'credit' ? 'Entrada' : 'Saída'} de R$ ${Math.abs(adjustedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada com sucesso.`,
      type: 'success',
      relatedEntityType: 'financial_account',
      actionUrl: '/financial-reconciliation'
    });
    
    reset();
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const categories = [
    { value: 'feed', label: 'Alimentação' },
    { value: 'health', label: 'Sanidade' },
    { value: 'freight', label: 'Frete' },
    { value: 'commission', label: 'Comissão' },
    { value: 'taxes', label: 'Impostos' },
    { value: 'salaries', label: 'Salários' },
    { value: 'utilities', label: 'Serviços Públicos' },
    { value: 'rent', label: 'Aluguel' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'supplies', label: 'Suprimentos' },
    { value: 'sales', label: 'Vendas' },
    { value: 'investments', label: 'Investimentos' },
    { value: 'other', label: 'Outros' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Registrar Lançamento Bancário</h2>
            <p className="text-info-100 text-sm mt-1">
              Adicione uma movimentação bancária manualmente
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
          {/* Bank Account */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
              <CreditCard className="w-3 h-3 mr-1 text-neutral-500" />
              Conta Bancária *
            </label>
            <select
              {...register('bankAccount')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
            >
              <option value="">Selecione a conta bancária</option>
              {payerAccounts.map(account => (
                <option key={account.id} value={account.bankAccount}>
                  {account.name} - {account.bankName} ({account.bankAccount})
                </option>
              ))}
            </select>
            {errors.bankAccount && (
              <p className="text-error-500 text-xs mt-1">{errors.bankAccount.message}</p>
            )}
          </div>

          {/* Date and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-neutral-500" />
                Data da Movimentação *
              </label>
              <input
                type="date"
                {...register('date', { valueAsDate: true })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-1 text-neutral-500" />
                Tipo de Movimentação *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                  watchedType === 'credit' 
                    ? 'border-success-300 bg-success-50' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}>
                  <input
                    type="radio"
                    {...register('type')}
                    value="credit"
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border ${
                    watchedType === 'credit' 
                      ? 'border-success-500 bg-success-500' 
                      : 'border-neutral-300'
                  }`}>
                    {watchedType === 'credit' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="text-sm">Entrada</span>
                </label>
                
                <label className={`flex items-center justify-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                  watchedType === 'debit' 
                    ? 'border-error-300 bg-error-50' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}>
                  <input
                    type="radio"
                    {...register('type')}
                    value="debit"
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border ${
                    watchedType === 'debit' 
                      ? 'border-error-500 bg-error-500' 
                      : 'border-neutral-300'
                  }`}>
                    {watchedType === 'debit' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="text-sm">Saída</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <FileText className="w-3 h-3 mr-1 text-neutral-500" />
                Descrição *
              </label>
              <input
                type="text"
                {...register('description')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Ex: Pagamento Fornecedor XYZ"
              />
              {errors.description && (
                <p className="text-error-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <DollarSign className="w-3 h-3 mr-1 text-neutral-500" />
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Ex: 1500.00"
              />
              {errors.amount && (
                <p className="text-error-500 text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <Briefcase className="w-3 h-3 mr-1 text-neutral-500" />
                Categoria
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <User className="w-3 h-3 mr-1 text-neutral-500" />
                Beneficiário/Pagador
              </label>
              <input
                type="text"
                {...register('payee')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Ex: Fornecedor XYZ"
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
              <FileText className="w-3 h-3 mr-1 text-neutral-500" />
              Referência/Documento
            </label>
            <input
              type="text"
              {...register('reference')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
              placeholder="Ex: NF 12345, Contrato 789"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
              <Tag className="w-3 h-3 mr-1 text-neutral-500" />
              Tags
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Adicionar tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
              >
                Adicionar
              </button>
            </div>
            
            {/* Tags selecionadas */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-100 text-info-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-info-600 hover:text-info-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <h3 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
              <Upload className="w-3 h-3 mr-1 text-neutral-600" />
              Anexar Comprovante
            </h3>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center">
              <Upload className="w-6 h-6 mx-auto mb-3 text-neutral-400" />
              <p className="text-xs text-neutral-600 mb-2">
                Arraste um arquivo ou clique para selecionar
              </p>
              <p className="text-xs text-neutral-500">
                Formatos: PDF, JPG, PNG (máx. 5MB)
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer"
              >
                Selecionar Arquivo
              </label>
            </div>
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
              <DollarSign className="w-3 h-3" />
              <span>Registrar Lançamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};