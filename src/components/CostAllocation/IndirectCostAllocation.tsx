import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Filter, Download, CheckCircle, 
  XCircle, AlertCircle, TrendingUp, DollarSign,
  Users, Calendar, Weight, FileText
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { IndirectCostAllocation, AllocationGenerationParams } from '../../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AllocationForm } from './AllocationForm';
import { AllocationList } from './AllocationList';
import { AllocationPreview } from './AllocationPreview';
import { TemplateManager } from './TemplateManager';

export const IndirectCostAllocationComponent: React.FC = () => {
  const { 
    indirectCostAllocations,
    generateIndirectCostAllocation,
    saveIndirectCostAllocation,
    approveIndirectCostAllocation,
    applyIndirectCostAllocation,
    deleteIndirectCostAllocation,
    addNotification
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<IndirectCostAllocation | null>(null);
  const [previewAllocation, setPreviewAllocation] = useState<IndirectCostAllocation | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'applied'>('all');

  // Filtrar alocações
  const filteredAllocations = indirectCostAllocations.filter(alloc => {
    if (filter === 'all') return true;
    return alloc.status === filter;
  });

  // Estatísticas
  const stats = {
    total: indirectCostAllocations.length,
    draft: indirectCostAllocations.filter(a => a.status === 'draft').length,
    approved: indirectCostAllocations.filter(a => a.status === 'approved').length,
    applied: indirectCostAllocations.filter(a => a.status === 'applied').length,
    totalValue: indirectCostAllocations
      .filter(a => a.status === 'applied')
      .reduce((sum, a) => sum + a.totalAmount, 0)
  };

  const handleGenerateAllocation = (params: AllocationGenerationParams) => {
    const allocation = generateIndirectCostAllocation(params);
    if (allocation) {
      setPreviewAllocation(allocation);
      setShowForm(false);
    } else {
      addNotification({
        title: 'Erro ao gerar rateio',
        message: 'Não foi possível gerar o rateio com os parâmetros informados',
        type: 'error'
      });
    }
  };

  const handleSaveAllocation = () => {
    if (previewAllocation) {
      saveIndirectCostAllocation(previewAllocation);
      setPreviewAllocation(null);
      addNotification({
        title: 'Rateio salvo',
        message: 'O rateio foi salvo como rascunho',
        type: 'success'
      });
    }
  };

  const handleApproveAllocation = (id: string) => {
    approveIndirectCostAllocation(id, 'Usuário'); // TODO: pegar usuário logado
    addNotification({
      title: 'Rateio aprovado',
      message: 'O rateio foi aprovado e está pronto para ser aplicado',
      type: 'success'
    });
  };

  const handleApplyAllocation = (id: string) => {
    applyIndirectCostAllocation(id);
    addNotification({
      title: 'Rateio aplicado',
      message: 'O rateio foi aplicado e as despesas foram geradas',
      type: 'success'
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'by_heads': return Users;
      case 'by_value': return DollarSign;
      case 'by_days': return Calendar;
      case 'by_weight': return Weight;
      default: return Calculator;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'by_heads': return 'Por Cabeças';
      case 'by_value': return 'Por Valor';
      case 'by_days': return 'Por Dias';
      case 'by_weight': return 'Por Peso';
      default: return 'Customizado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-b3x-navy-900">
            Rateio de Custos Indiretos
          </h1>
          <p className="text-neutral-600 mt-1">
            Distribua custos administrativos e financeiros entre lotes
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 text-b3x-navy-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Rateio
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total de Rateios</span>
            <Calculator className="w-5 h-5 text-b3x-navy-500" />
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Rascunhos</span>
            <AlertCircle className="w-5 h-5 text-warning-500" />
          </div>
          <div className="text-2xl font-bold text-warning-600">{stats.draft}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Aprovados</span>
            <CheckCircle className="w-5 h-5 text-info-500" />
          </div>
          <div className="text-2xl font-bold text-info-600">{stats.approved}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Aplicados</span>
            <CheckCircle className="w-5 h-5 text-success-500" />
          </div>
          <div className="text-2xl font-bold text-success-600">{stats.applied}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Valor Total</span>
            <DollarSign className="w-5 h-5 text-b3x-lime-500" />
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900">
            {stats.totalValue.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 0
            })}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-neutral-700">Filtrar por:</span>
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-b3x-navy-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Todos ({stats.total})
          </button>
          
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'draft'
                ? 'bg-warning-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Rascunhos ({stats.draft})
          </button>
          
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-info-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Aprovados ({stats.approved})
          </button>
          
          <button
            onClick={() => setFilter('applied')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'applied'
                ? 'bg-success-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Aplicados ({stats.applied})
          </button>
        </div>
      </div>

      {/* Lista de Alocações */}
      <AllocationList
        allocations={filteredAllocations}
        onSelect={setSelectedAllocation}
        onApprove={handleApproveAllocation}
        onApply={handleApplyAllocation}
        onDelete={deleteIndirectCostAllocation}
        getMethodIcon={getMethodIcon}
        getMethodLabel={getMethodLabel}
      />

      {/* Formulário de Nova Alocação */}
      {showForm && (
        <AllocationForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onGenerate={handleGenerateAllocation}
        />
      )}

      {/* Preview da Alocação */}
      {previewAllocation && (
        <AllocationPreview
          allocation={previewAllocation}
          onSave={handleSaveAllocation}
          onCancel={() => setPreviewAllocation(null)}
          onEdit={(allocation) => {
            setPreviewAllocation(allocation);
          }}
        />
      )}

      {/* Gerenciador de Templates */}
      {showTemplates && (
        <TemplateManager
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            // Preencher formulário com template
            setShowForm(true);
            setShowTemplates(false);
          }}
        />
      )}
    </div>
  );
}; 