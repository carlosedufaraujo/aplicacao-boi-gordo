import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Building, CreditCard, Truck } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PartnerFormData } from '../../types';

const partnerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountType: z.enum(['checking', 'savings']).optional(),
  observations: z.string().optional(),
  isTransporter: z.boolean().optional(),
});

interface PartnerFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'vendor' | 'broker' | 'slaughterhouse' | 'financial';
  isTransporter?: boolean;
  onSubmit?: (data: PartnerFormData) => void;
}

export const PartnerForm: React.FC<PartnerFormProps> = ({
  isOpen,
  onClose,
  type,
  isTransporter = false,
  onSubmit
}) => {
  const { addPartner } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      bankAccountType: 'checking',
      isTransporter: isTransporter
    }
  });

  const typeLabels = {
    vendor: isTransporter ? 'Transportadora' : 'Vendedor',
    broker: 'Corretor',
    slaughterhouse: 'Frigorífico',
    financial: 'Instituição Financeira'
  };

  const watchedFields = watch(['name', 'cpfCnpj', 'bankName', 'bankAgency', 'bankAccount', 'bankAccountType']);
  const [name, cpfCnpj, bankName, bankAgency, bankAccount, bankAccountType] = watchedFields;
  
  // Verificar se há dados bancários OU dados pessoais para mostrar o resumo
  const hasBankData = [bankName, bankAgency, bankAccount].some(field => field && field.trim() !== '');
  const hasPersonalData = name && name.trim() !== '';
  const showSummary = hasBankData || hasPersonalData;

  const handleFormSubmit = (data: PartnerFormData) => {
    // Adicionar o tipo automaticamente baseado no prop
    const partnerData = {
      ...data,
      type,
      isActive: true,
      isTransporter: isTransporter
    };

    addPartner(partnerData);
    
    if (onSubmit) {
      onSubmit(partnerData);
    }
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">
              {isTransporter ? 'Nova Transportadora' : `Novo ${typeLabels[type]}`}
            </h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Cadastre {isTransporter ? 'uma nova transportadora' : `um novo ${typeLabels[type].toLowerCase()}`} no sistema
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
          {/* Basic Information - Mais compacto */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              {isTransporter ? (
                <Truck className="w-4 h-4 mr-2" />
              ) : (
                <Building className="w-4 h-4 mr-2" />
              )}
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder={`Ex: ${isTransporter ? 'Transportes Rápidos Ltda' : 'Fazenda São João Ltda'}`}
                />
                {errors.name && (
                  <p className="text-error-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  {...register('cpfCnpj')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  placeholder="Ex: 12.345.678/0001-90"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Cadastro
                </label>
                <input
                  type="text"
                  value={isTransporter ? 'Transportadora' : typeLabels[type]}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
                />
              </div>
              
              {/* Campo oculto para marcar como transportadora */}
              <input
                type="hidden"
                {...register('isTransporter')}
                value={isTransporter ? 'true' : 'false'}
              />
            </div>
          </div>

          {/* Location - Mais compacto */}
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

          {/* Address - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              placeholder="Ex: Rua das Flores, 123, Centro"
            />
          </div>

          {/* Contact Information - Mais compacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder="Ex: (16) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                placeholder={`Ex: ${isTransporter ? 'contato@transportes.com.br' : 'contato@fazenda.com.br'}`}
              />
              {errors.email && (
                <p className="text-error-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Bank Information - Mais compacto */}
          <div className="bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-xl p-4 border border-b3x-lime-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-b3x-lime-600" />
              Dados Bancários
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  {...register('bankName')}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  {...register('bankAgency')}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 1234-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Conta
                </label>
                <input
                  type="text"
                  {...register('bankAccount')}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                  placeholder="Ex: 12345-6"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-b3x-navy-700 mb-1">
                  Tipo de Conta
                </label>
                <select
                  {...register('bankAccountType')}
                  className="w-full px-3 py-2 text-sm border border-b3x-lime-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500 bg-white/90 transition-all duration-200"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Poupança</option>
                </select>
              </div>
            </div>

            {/* Preview dos dados bancários - INCLUINDO NOME E CPF */}
            {showSummary && (
              <div className="mt-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-b3x-lime-200 shadow-soft">
                <h4 className="text-xs font-medium text-b3x-navy-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-b3x-lime-500 rounded-full mr-2"></span>
                  Resumo dos Dados Bancários:
                </h4>
                <div className="text-xs text-b3x-navy-700 space-y-1">
                  {/* DADOS PESSOAIS */}
                  {name && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">Nome:</strong> 
                      <span className="flex-1">{name}</span>
                    </div>
                  )}
                  {cpfCnpj && (
                    <div className="flex items-start space-x-2">
                      <strong className="min-w-[60px]">CPF:</strong> 
                      <span className="flex-1">{cpfCnpj}</span>
                    </div>
                  )}
                  
                  {/* SEPARADOR SE HOUVER DADOS PESSOAIS E BANCÁRIOS */}
                  {hasPersonalData && hasBankData && (
                    <div className="border-t border-b3x-lime-300 my-2 pt-2"></div>
                  )}
                  
                  {/* DADOS BANCÁRIOS */}
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

          {/* Observations - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              placeholder={`Observações adicionais sobre ${isTransporter ? 'a transportadora' : 'o parceiro'}...`}
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
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft text-sm"
            >
              Cadastrar {isTransporter ? 'Transportadora' : typeLabels[type]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};