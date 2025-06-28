import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { X, Save, Calendar, FileText, DollarSign, Users, Building2, TrendingUp, CreditCard, Calculator } from 'lucide-react';

interface ContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContributionForm: React.FC<ContributionFormProps> = ({ isOpen, onClose }) => {
  const { addFinancialContribution } = useAppStore();
  
  const [formData, setFormData] = useState({
    type: 'aporte_socio' as 'aporte_socio' | 'emprestimo_socio' | 'financiamento_bancario' | 'investidor',
    contributorName: '',
    contributorDocument: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    returnType: 'capital' as 'capital' | 'emprestimo' | 'participacao',
    interestRate: 0,
    paybackPeriod: 0,
    participationPercentage: 0,
    contractNumber: '',
    notes: '',
    // Novos campos para detalhamento de pagamento
    capitalPaymentType: 'mensal' as 'mensal' | 'bullet',
    interestPaymentType: 'mensal' as 'mensal' | 'bullet',
    capitalInstallments: 1,
    interestInstallments: 1,
    capitalPaymentInterval: 1, // Em meses
    firstCapitalPaymentDate: '',
    firstInterestPaymentDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Criar contribuição financeira
    addFinancialContribution({
      type: formData.type,
      contributorName: formData.contributorName,
      contributorDocument: formData.contributorDocument,
      date: new Date(formData.date),
      amount: formData.amount,
      returnType: formData.returnType,
      interestRate: formData.returnType === 'emprestimo' ? formData.interestRate : undefined,
      paybackPeriod: formData.returnType === 'emprestimo' ? formData.paybackPeriod : undefined,
      participationPercentage: formData.returnType === 'participacao' ? formData.participationPercentage : undefined,
      contractNumber: formData.contractNumber,
      notes: formData.notes
    });

    // Limpar formulário
    setFormData({
      type: 'aporte_socio',
      contributorName: '',
      contributorDocument: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      returnType: 'capital',
      interestRate: 0,
      paybackPeriod: 0,
      participationPercentage: 0,
      contractNumber: '',
      notes: '',
      capitalPaymentType: 'mensal',
      interestPaymentType: 'mensal',
      capitalInstallments: 1,
      interestInstallments: 1,
      capitalPaymentInterval: 1,
      firstCapitalPaymentDate: '',
      firstInterestPaymentDate: ''
    });

    onClose();
  };

  // Calcular valor das parcelas
  const calculateCapitalInstallment = () => {
    if (formData.capitalPaymentType === 'bullet') {
      return formData.amount;
    }
    return formData.amount / formData.capitalInstallments;
  };

  const calculateInterestInstallment = () => {
    const monthlyInterest = (formData.amount * formData.interestRate) / 100;
    if (formData.interestPaymentType === 'bullet') {
      return monthlyInterest * formData.paybackPeriod;
    }
    return monthlyInterest;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Novo Aporte/Contribuição</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Registre aportes de sócios, empréstimos e investimentos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Informações Básicas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Contribuição *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                >
                  <option value="aporte_socio">Aporte de Sócio</option>
                  <option value="emprestimo_socio">Empréstimo de Sócio</option>
                  <option value="financiamento_bancario">Financiamento Bancário</option>
                  <option value="investidor">Investidor Externo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Contribuidor */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Dados do Contribuidor</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nome do Contribuidor *
                </label>
                <input
                  type="text"
                  value={formData.contributorName}
                  onChange={(e) => setFormData({ ...formData, contributorName: e.target.value })}
                  placeholder="Nome completo ou razão social"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={formData.contributorDocument}
                  onChange={(e) => setFormData({ ...formData, contributorDocument: e.target.value })}
                  placeholder="Documento do contribuidor"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Valores e Condições */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Valores e Condições</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor do Aporte (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  placeholder="Ex: 100000.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Retorno *
                </label>
                <select
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                >
                  <option value="capital">Capital (sem retorno)</option>
                  <option value="emprestimo">Empréstimo (com juros)</option>
                  <option value="participacao">Participação nos lucros</option>
                </select>
              </div>
            </div>

            {/* Condições de Retorno (condicional) */}
            {formData.returnType === 'emprestimo' && (
              <div className="bg-info-50 p-3 rounded-lg border border-info-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-info-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-3 h-3 text-info-600" />
                  </div>
                  <h4 className="text-sm font-medium text-b3x-navy-900">Condições do Empréstimo</h4>
                </div>
                
                {/* Taxa e Prazo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Taxa de Juros (% a.m.) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                      placeholder="Ex: 1.5"
                      required={formData.returnType === 'emprestimo'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Prazo Total (meses) *
                    </label>
                    <input
                      type="number"
                      value={formData.paybackPeriod}
                      onChange={(e) => setFormData({ ...formData, paybackPeriod: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                      placeholder="Ex: 12"
                      required={formData.returnType === 'emprestimo'}
                    />
                  </div>
                </div>

                {/* Metodologia de Pagamento do Capital */}
                <div className="bg-white p-3 rounded-lg mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="w-4 h-4 text-b3x-navy-600" />
                    <h5 className="text-sm font-medium text-b3x-navy-900">Pagamento do Capital (Principal)</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Forma de Pagamento *
                      </label>
                      <select
                        value={formData.capitalPaymentType}
                        onChange={(e) => setFormData({ ...formData, capitalPaymentType: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                      >
                        <option value="mensal">Parcelado (mensal)</option>
                        <option value="bullet">Bullet (no vencimento)</option>
                      </select>
                    </div>

                    {formData.capitalPaymentType === 'mensal' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Número de Parcelas *
                        </label>
                        <input
                          type="number"
                          value={formData.capitalInstallments}
                          onChange={(e) => setFormData({ ...formData, capitalInstallments: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    )}
                  </div>

                  {formData.capitalPaymentType === 'mensal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Intervalo entre Parcelas (meses)
                        </label>
                        <input
                          type="number"
                          value={formData.capitalPaymentInterval}
                          onChange={(e) => setFormData({ ...formData, capitalPaymentInterval: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                          min="1"
                          placeholder="Ex: 5 (a cada 5 meses)"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Data 1ª Parcela Capital
                        </label>
                        <input
                          type="date"
                          value={formData.firstCapitalPaymentDate}
                          onChange={(e) => setFormData({ ...formData, firstCapitalPaymentDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 p-2 bg-neutral-50 rounded">
                    <p className="text-xs text-neutral-600">
                      Valor por parcela: <span className="font-bold text-b3x-navy-900">
                        R$ {calculateCapitalInstallment().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Metodologia de Pagamento dos Juros */}
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-b3x-navy-600" />
                    <h5 className="text-sm font-medium text-b3x-navy-900">Pagamento dos Juros</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Forma de Pagamento *
                      </label>
                      <select
                        value={formData.interestPaymentType}
                        onChange={(e) => setFormData({ ...formData, interestPaymentType: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="bullet">Bullet (no vencimento)</option>
                      </select>
                    </div>

                    {formData.interestPaymentType === 'mensal' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Data 1º Pagamento Juros
                        </label>
                        <input
                          type="date"
                          value={formData.firstInterestPaymentDate}
                          onChange={(e) => setFormData({ ...formData, firstInterestPaymentDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 p-2 bg-neutral-50 rounded">
                    <p className="text-xs text-neutral-600">
                      Valor dos juros: <span className="font-bold text-b3x-navy-900">
                        R$ {calculateInterestInstallment().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {formData.interestPaymentType === 'mensal' ? '/mês' : ' total'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Exemplos de Metodologias */}
                <div className="mt-3 p-2 bg-info-100 rounded-lg">
                  <p className="text-xs text-info-700 font-medium mb-1">Exemplos de metodologias:</p>
                  <ul className="text-xs text-info-600 space-y-0.5">
                    <li>• Juros mensais + Principal em parcelas a cada 5 meses</li>
                    <li>• Juros mensais + Principal bullet no final</li>
                    <li>• Capital e Juros mensais</li>
                    <li>• Capital e Juros bullet (pagamento único)</li>
                  </ul>
                </div>
              </div>
            )}

            {formData.returnType === 'participacao' && (
              <div className="bg-success-50 p-3 rounded-lg border border-success-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-success-600" />
                  </div>
                  <h4 className="text-sm font-medium text-b3x-navy-900">Participação nos Lucros</h4>
                </div>
                
                <div className="ml-7">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Percentual de Participação (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.participationPercentage}
                    onChange={(e) => setFormData({ ...formData, participationPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                    placeholder="Ex: 10.00"
                    required={formData.returnType === 'participacao'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Documentação */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Documentação</h3>
            </div>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Número do Contrato
              </label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                placeholder="Identificação do contrato ou documento"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent resize-none"
                placeholder="Informações adicionais sobre este aporte..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Aporte</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 