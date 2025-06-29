import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CreditCard, Building } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PayerAccountFormData } from '../../types';

const payerAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  bankName: z.string().min(1, 'Nome do banco é obrigatório'),
  bankAgency: z.string().min(1, 'Agência é obrigatória'),
  bankAccount: z.string().min(1, 'Número da conta é obrigatório'),
  bankAccountType: z.enum(['checking', 'savings']),
  isDefault: z.boolean()
});

interface PayerAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayerAccountForm: React.FC<PayerAccountFormProps> = ({
  isOpen,
  onClose
}) => {
  const { addPayerAccount } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PayerAccountFormData>({
    resolver: zodResolver(payerAccountSchema),
    defaultValues: {
      bankAccountType: 'checking',
      isDefault: false
    }
  });

  const watchedFields = watch(['name', 'bankName', 'bankAgency', 'bankAccount', 'bankAccountType']);
  const [name, bankName, bankAgency, bankAccount, bankAccountType] = watchedFields;
  
  const showPreview = [name, bankName, bankAgency, bankAccount].some(field => field && field.trim() !== '');

  const handleFormSubmit = (data: PayerAccountFormData) => {
    addPayerAccount({
      ...data,
      isActive: true
    });
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Nova Conta Pagadora</h2>
            <p className="text-info-100 text-sm mt-1">
              Cadastre uma conta bancária para pagamentos
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
          {/* Account Name - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nome da Conta *
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
              placeholder="Ex: Conta Principal - Fazenda"
            />
            {errors.name && (
              <p className="text-error-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Bank Information - Mais compacto */}
          <div className="bg-neutral-100 rounded-xl p-4 border border-neutral-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Building className="w-4 h-4 mr-2 text-neutral-600" />
              Dados Bancários
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  {...register('bankName')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                  placeholder="Ex: Banco do Brasil"
                />
                {errors.bankName && (
                  <p className="text-error-500 text-xs mt-1">{errors.bankName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Agência *
                </label>
                <input
                  type="text"
                  {...register('bankAgency')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                  placeholder="Ex: 1234-5"
                />
                {errors.bankAgency && (
                  <p className="text-error-500 text-xs mt-1">{errors.bankAgency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Conta *
                </label>
                <input
                  type="text"
                  {...register('bankAccount')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                  placeholder="Ex: 12345-6"
                />
                {errors.bankAccount && (
                  <p className="text-error-500 text-xs mt-1">{errors.bankAccount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Conta *
                </label>
                <select
                  {...register('bankAccountType')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                </select>
              </div>
            </div>

            {/* Preview da conta - Mais compacto */}
            {showPreview && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-neutral-200">
                <h4 className="text-xs font-medium text-b3x-navy-900 mb-2 flex items-center">
                  <CreditCard className="w-3 h-3 mr-2 text-neutral-600" />
                  Preview da Conta:
                </h4>
                <div className="text-xs text-neutral-700 space-y-1">
                  {name && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">Nome:</strong> 
                      <span className="flex-1">{name}</span>
                    </div>
                  )}
                  {bankName && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">Banco:</strong> 
                      <span className="flex-1">{bankName}</span>
                    </div>
                  )}
                  {bankAgency && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">Agência:</strong> 
                      <span className="flex-1">{bankAgency}</span>
                    </div>
                  )}
                  {bankAccount && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">Conta:</strong> 
                      <span className="flex-1">{bankAccount} ({bankAccountType === 'checking' ? 'Conta Corrente' : 'Poupança'})</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Default Account - Mais compacto */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('isDefault')}
                className="rounded border-neutral-300 text-info-600 focus:ring-info-500"
              />
              <div>
                <span className="font-medium text-b3x-navy-900 text-sm">Definir como conta padrão</span>
                <p className="text-xs text-neutral-600">Esta conta será selecionada automaticamente em novas ordens de compra</p>
              </div>
            </label>
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
              <CreditCard className="w-3 h-3" />
              <span>Cadastrar Conta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};