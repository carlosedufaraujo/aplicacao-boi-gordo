import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { X, Save, Calendar, FileText, DollarSign, Building2, TrendingUp } from 'lucide-react';

interface RevenueAllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RevenueAllocationForm: React.FC<RevenueAllocationFormProps> = ({ isOpen, onClose }) => {
  const { addCashFlowEntry } = useAppStore();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'vendas',
    plannedAmount: 0,
    actualAmount: 0,
    partner: '',
    invoiceNumber: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Criar entrada de receita no fluxo de caixa
    addCashFlowEntry({
      date: new Date(formData.date),
      type: 'receita',
      category: formData.category,
      description: formData.description,
      plannedAmount: formData.plannedAmount,
      actualAmount: formData.actualAmount || formData.plannedAmount,
      status: formData.actualAmount > 0 ? 'realizado' : 'projetado',
      notes: formData.notes
    });

    // Limpar formulário
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'vendas',
      plannedAmount: 0,
      actualAmount: 0,
      partner: '',
      invoiceNumber: '',
      notes: ''
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Nova Receita</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Registre uma receita e acompanhe suas entradas financeiras
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Data da Receita *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  required
                >
                  <option value="vendas">Vendas de Gado</option>
                  <option value="servicos">Prestação de Serviços</option>
                  <option value="arrendamento">Arrendamento</option>
                  <option value="subprodutos">Venda de Subprodutos</option>
                  <option value="outros">Outras Receitas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Venda Lote 2024-001 para Frigorífico XYZ"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Valores da Receita</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor Previsto (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plannedAmount}
                  onChange={(e) => setFormData({ ...formData, plannedAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                  placeholder="Ex: 250000.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor Realizado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actualAmount}
                  onChange={(e) => setFormData({ ...formData, actualAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="Deixe em branco se ainda não recebido"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status da Receita */}
            <div className="mt-3 bg-neutral-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-success-600" />
                </div>
                <h4 className="text-sm font-medium text-b3x-navy-900">Status da Receita</h4>
              </div>
              <p className="text-xs text-neutral-600 ml-7">
                {formData.actualAmount > 0 ? (
                  <span className="font-medium text-success-700">Realizada - Valor já foi recebido</span>
                ) : (
                  <span className="font-medium text-info-700">Projetada - Aguardando recebimento</span>
                )}
              </p>
            </div>
          </div>

          {/* Cliente e Documento Fiscal */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <Building2 className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Dados do Cliente</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cliente/Parceiro
                </label>
                <input
                  type="text"
                  value={formData.partner}
                  onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                  placeholder="Nome do cliente ou parceiro"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nota Fiscal
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Número da NF"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-b3x-navy-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Observações</h3>
            </div>
            
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent resize-none"
              placeholder="Informações adicionais sobre esta receita..."
            />
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
              <span>Salvar Receita</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
