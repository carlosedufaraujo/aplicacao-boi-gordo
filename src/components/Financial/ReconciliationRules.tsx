import React, { useState } from 'react';
import { X, Plus, Settings, Edit, Trash2, Check, AlertTriangle, Info, Eye, ArrowUp, ArrowDown, Filter, Search } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface ReconciliationRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Rule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: {
    field: 'description' | 'amount' | 'date' | 'bankAccount' | 'type';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
    value: string | number | Date | [Date, Date];
  }[];
  actions: {
    type: 'assignCategory' | 'assignTags' | 'linkToAccount' | 'autoReconcile';
    value: string | string[] | boolean;
  }[];
  priority: number;
  createdAt: Date;
}

export const ReconciliationRules: React.FC<ReconciliationRulesProps> = ({
  isOpen,
  onClose
}) => {
  // Dados de exemplo para regras
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      name: 'Pagamentos de Fornecedores',
      isActive: true,
      conditions: [
        { field: 'description', operator: 'contains', value: 'Fornecedor' },
        { field: 'type', operator: 'equals', value: 'debit' }
      ],
      actions: [
        { type: 'assignCategory', value: 'feed' },
        { type: 'assignTags', value: ['fornecedor', 'alimentação'] },
        { type: 'autoReconcile', value: true }
      ],
      priority: 1,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Recebimentos de Clientes',
      isActive: true,
      conditions: [
        { field: 'description', operator: 'contains', value: 'Cliente' },
        { field: 'type', operator: 'equals', value: 'credit' }
      ],
      actions: [
        { type: 'assignCategory', value: 'sales' },
        { type: 'assignTags', value: ['cliente', 'venda'] },
        { type: 'autoReconcile', value: true }
      ],
      priority: 2,
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Pagamentos de Impostos',
      isActive: false,
      conditions: [
        { field: 'description', operator: 'contains', value: 'DARF' },
        { field: 'type', operator: 'equals', value: 'debit' }
      ],
      actions: [
        { type: 'assignCategory', value: 'taxes' },
        { type: 'assignTags', value: ['imposto', 'fiscal'] }
      ],
      priority: 3,
      createdAt: new Date()
    }
  ]);
  
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Filtrar regras
  const filteredRules = rules.filter(rule => {
    // Filtro de pesquisa
    if (searchTerm && !rule.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro de status
    if (filterActive === 'active' && !rule.isActive) return false;
    if (filterActive === 'inactive' && rule.isActive) return false;
    
    return true;
  });

  // Alternar status de uma regra
  const toggleRuleStatus = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  // Excluir uma regra
  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  // Editar uma regra
  const editRule = (rule: Rule) => {
    setSelectedRule(rule);
    setShowRuleForm(true);
  };

  // Mover regra para cima (aumentar prioridade)
  const moveRuleUp = (id: string) => {
    const index = rules.findIndex(rule => rule.id === id);
    if (index <= 0) return;
    
    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[index - 1];
    newRules[index - 1] = temp;
    
    // Atualizar prioridades
    newRules[index].priority = index + 1;
    newRules[index - 1].priority = index;
    
    setRules(newRules);
  };

  // Mover regra para baixo (diminuir prioridade)
  const moveRuleDown = (id: string) => {
    const index = rules.findIndex(rule => rule.id === id);
    if (index >= rules.length - 1) return;
    
    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[index + 1];
    newRules[index + 1] = temp;
    
    // Atualizar prioridades
    newRules[index].priority = index + 1;
    newRules[index + 1].priority = index + 2;
    
    setRules(newRules);
  };

  // Renderizar condição em texto legível
  const renderCondition = (condition: any) => {
    const fieldLabels = {
      description: 'Descrição',
      amount: 'Valor',
      date: 'Data',
      bankAccount: 'Conta',
      type: 'Tipo'
    };
    
    const operatorLabels = {
      contains: 'contém',
      equals: 'igual a',
      startsWith: 'começa com',
      endsWith: 'termina com',
      greaterThan: 'maior que',
      lessThan: 'menor que',
      between: 'entre'
    };
    
    let valueText = '';
    if (Array.isArray(condition.value)) {
      valueText = `${condition.value[0]} e ${condition.value[1]}`;
    } else if (condition.value instanceof Date) {
      valueText = condition.value.toLocaleDateString();
    } else if (condition.field === 'type') {
      valueText = condition.value === 'credit' ? 'Crédito' : 'Débito';
    } else {
      valueText = String(condition.value);
    }
    
    return `${fieldLabels[condition.field]} ${operatorLabels[condition.operator]} ${valueText}`;
  };

  // Renderizar ação em texto legível
  const renderAction = (action: any) => {
    const actionLabels = {
      assignCategory: 'Atribuir categoria',
      assignTags: 'Atribuir tags',
      linkToAccount: 'Vincular à conta',
      autoReconcile: 'Conciliar automaticamente'
    };
    
    let valueText = '';
    if (Array.isArray(action.value)) {
      valueText = action.value.join(', ');
    } else if (typeof action.value === 'boolean') {
      valueText = action.value ? 'Sim' : 'Não';
    } else {
      valueText = String(action.value);
    }
    
    return `${actionLabels[action.type]}: ${valueText}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-800 to-b3x-navy-900 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Regras de Conciliação Automática</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Configure regras para automatizar o processo de conciliação
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Informações sobre Regras */}
          <div className="bg-info-50 rounded-lg p-4 border border-info-200">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <Info className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <h3 className="font-medium text-info-800 text-sm mb-1">Como funcionam as regras de conciliação</h3>
                <p className="text-xs text-info-700 mb-2">
                  As regras de conciliação permitem automatizar o processo de categorização e conciliação de transações bancárias.
                </p>
                <ul className="text-xs text-info-700 space-y-1 list-disc list-inside">
                  <li>Crie regras com condições baseadas em descrição, valor, data, etc.</li>
                  <li>Defina ações como categorizar, adicionar tags ou conciliar automaticamente</li>
                  <li>As regras são aplicadas na ordem de prioridade (de cima para baixo)</li>
                  <li>Regras mais específicas devem ter prioridade maior que regras genéricas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Filtros e Botão Adicionar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Status */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                >
                  <option value="all">Todas as Regras</option>
                  <option value="active">Ativas</option>
                  <option value="inactive">Inativas</option>
                </select>
              </div>
              
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar regras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent w-40"
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedRule(null);
                setShowRuleForm(true);
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-b3x-navy-800 text-white rounded-lg hover:bg-b3x-navy-900 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Regra</span>
            </button>
          </div>

          {/* Lista de Regras */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="p-3 bg-neutral-50 border-b border-neutral-200">
              <h3 className="font-medium text-b3x-navy-900 text-sm">Regras de Conciliação ({filteredRules.length})</h3>
            </div>
            
            {filteredRules.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {filteredRules.map((rule) => (
                  <div key={rule.id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {/* Status */}
                        <div className="mt-0.5">
                          <button
                            onClick={() => toggleRuleStatus(rule.id)}
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              rule.isActive 
                                ? 'bg-success-100 text-success-600 hover:bg-success-200' 
                                : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                            }`}
                            title={rule.isActive ? 'Desativar regra' : 'Ativar regra'}
                          >
                            {rule.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </button>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-b3x-navy-900 text-sm flex items-center">
                            {rule.name}
                            {!rule.isActive && (
                              <span className="ml-2 px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                                Inativa
                              </span>
                            )}
                          </h4>
                          
                          {/* Condições */}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-neutral-700">Condições:</p>
                            <ul className="text-xs text-neutral-600 space-y-1 pl-4">
                              {rule.conditions.map((condition, index) => (
                                <li key={index} className="list-disc">
                                  {renderCondition(condition)}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Ações */}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-neutral-700">Ações:</p>
                            <ul className="text-xs text-neutral-600 space-y-1 pl-4">
                              {rule.actions.map((action, index) => (
                                <li key={index} className="list-disc">
                                  {renderAction(action)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex flex-col space-y-1 ml-3">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveRuleUp(rule.id)}
                            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded"
                            title="Aumentar prioridade"
                            disabled={rule.priority <= 1}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveRuleDown(rule.id)}
                            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded"
                            title="Diminuir prioridade"
                            disabled={rule.priority >= rules.length}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-600 text-sm mb-2">
                  {searchTerm ? 'Nenhuma regra encontrada' : 'Nenhuma regra configurada'}
                </p>
                <button
                  onClick={() => {
                    setSelectedRule(null);
                    setShowRuleForm(true);
                  }}
                  className="text-b3x-navy-600 hover:text-b3x-navy-800 text-sm font-medium"
                >
                  Criar primeira regra
                </button>
              </div>
            )}
          </div>

          {/* Formulário de Regra (Modal) */}
          {showRuleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-b3x-navy-800 text-white rounded-t-xl">
                  <h3 className="font-semibold text-lg">
                    {selectedRule ? 'Editar Regra' : 'Nova Regra'}
                  </h3>
                  <button
                    onClick={() => setShowRuleForm(false)}
                    className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Formulário de regra aqui */}
                  <p className="text-neutral-600">
                    Formulário para {selectedRule ? 'editar' : 'criar'} regra de conciliação.
                  </p>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => setShowRuleForm(false)}
                      className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-1.5 bg-b3x-navy-800 text-white font-medium rounded-lg hover:bg-b3x-navy-900 transition-colors text-sm"
                    >
                      {selectedRule ? 'Salvar Alterações' : 'Criar Regra'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};