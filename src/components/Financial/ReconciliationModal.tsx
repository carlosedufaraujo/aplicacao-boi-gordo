import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Search, Filter, Clock, DollarSign, Calendar, FileText, ArrowRight, Info } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  statementId: string;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  statementId
}) => {
  const { 
    bankStatements, 
    financialAccounts, 
    addFinancialReconciliation,
    updateBankStatement,
    updateFinancialAccount,
    addNotification
  } = useAppStore();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<number>(7);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualDescription, setManualDescription] = useState<string>('');

  const statement = bankStatements.find(s => s.id === statementId);
  
  // Filtrar contas pendentes com base nos critérios
  const pendingAccounts = financialAccounts.filter(acc => {
    // Filtro básico: apenas contas pendentes
    if (acc.status !== 'pending') return false;
    
    // Filtro de tipo (a pagar/receber)
    if (typeFilter !== 'all') {
      if (typeFilter === 'payable' && acc.type !== 'payable') return false;
      if (typeFilter === 'receivable' && acc.type !== 'receivable') return false;
    }
    
    // Filtro de pesquisa
    if (searchTerm && !acc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro de data (dentro do intervalo de dias)
    if (statement && dateRangeFilter > 0) {
      const daysDifference = Math.abs(differenceInDays(acc.dueDate, statement.date));
      if (daysDifference > dateRangeFilter) return false;
    }
    
    // Filtro de valor (se não estiver em modo manual)
    if (!manualMode && statement) {
      // Para débitos (saídas), procurar contas a pagar com valor próximo
      if (statement.type === 'debit' && acc.type === 'payable') {
        // Permitir uma margem de erro de 1%
        const margin = acc.amount * 0.01;
        if (Math.abs(Math.abs(statement.amount) - acc.amount) > margin) {
          return false;
        }
      }
      
      // Para créditos (entradas), procurar contas a receber com valor próximo
      if (statement.type === 'credit' && acc.type === 'receivable') {
        // Permitir uma margem de erro de 1%
        const margin = acc.amount * 0.01;
        if (Math.abs(statement.amount - acc.amount) > margin) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Encontrar sugestões de correspondência automática
  useEffect(() => {
    if (statement) {
      // Filtrar contas com base no tipo de transação
      const matchingTypeAccounts = financialAccounts.filter(acc => {
        if (statement.type === 'debit') return acc.type === 'payable';
        if (statement.type === 'credit') return acc.type === 'receivable';
        return false;
      });
      
      // Calcular pontuação de correspondência para cada conta
      const scoredMatches = matchingTypeAccounts
        .filter(acc => acc.status === 'pending')
        .map(account => {
          let score = 0;
          
          // Pontuação por proximidade de valor (máximo 50 pontos)
          const valueDifference = Math.abs(Math.abs(statement.amount) - account.amount);
          const valuePercentDiff = account.amount > 0 ? valueDifference / account.amount : 1;
          if (valuePercentDiff < 0.001) score += 50; // Diferença menor que 0.1%
          else if (valuePercentDiff < 0.01) score += 40; // Diferença menor que 1%
          else if (valuePercentDiff < 0.05) score += 30; // Diferença menor que 5%
          else if (valuePercentDiff < 0.1) score += 20; // Diferença menor que 10%
          else if (valuePercentDiff < 0.2) score += 10; // Diferença menor que 20%
          
          // Pontuação por proximidade de data (máximo 30 pontos)
          const daysDifference = Math.abs(differenceInDays(account.dueDate, statement.date));
          if (daysDifference === 0) score += 30; // Mesmo dia
          else if (daysDifference <= 1) score += 25; // 1 dia de diferença
          else if (daysDifference <= 3) score += 20; // Até 3 dias
          else if (daysDifference <= 7) score += 15; // Até 1 semana
          else if (daysDifference <= 14) score += 10; // Até 2 semanas
          else if (daysDifference <= 30) score += 5; // Até 1 mês
          
          // Pontuação por correspondência de descrição (máximo 20 pontos)
          const statementDesc = statement.description.toLowerCase();
          const accountDesc = account.description.toLowerCase();
          
          // Verificar palavras-chave comuns
          const keywords = accountDesc.split(' ');
          let keywordMatches = 0;
          keywords.forEach(keyword => {
            if (keyword.length > 3 && statementDesc.includes(keyword)) {
              keywordMatches++;
            }
          });
          
          if (keywordMatches > 2) score += 20;
          else if (keywordMatches > 0) score += 10 * keywordMatches;
          
          return {
            account,
            score,
            valueDifference: valuePercentDiff,
            daysDifference
          };
        })
        .filter(match => match.score >= 30) // Filtrar apenas correspondências com pontuação mínima
        .sort((a, b) => b.score - a.score); // Ordenar por pontuação (maior primeiro)
      
      setSuggestedMatches(scoredMatches.slice(0, 3)); // Pegar as 3 melhores correspondências
      
      // Se houver uma correspondência muito boa (score > 80), selecionar automaticamente
      if (scoredMatches.length > 0 && scoredMatches[0].score > 80) {
        setSelectedAccountId(scoredMatches[0].account.id);
      }
    }
  }, [statement, financialAccounts]);

  const handleReconcile = () => {
    if (!statement) return;

    if (manualMode) {
      // Modo manual: criar uma conciliação sem conta financeira correspondente
      addFinancialReconciliation({
        date: new Date(),
        bankAccount: statement.bankAccount,
        statementId: statement.id,
        financialAccountId: 'manual', // ID especial para conciliações manuais
        amount: statement.amount,
        difference: 0,
        status: 'reconciled',
        notes: manualDescription || notes,
        reconciledBy: 'Usuário',
        reconciledAt: new Date(),
        autoReconciled: false
      });

      updateBankStatement(statement.id, { reconciled: true });
      
      // Notificar o usuário
      addNotification({
        title: 'Conciliação manual realizada',
        message: `Extrato "${statement.description}" foi conciliado manualmente.`,
        type: 'success',
        relatedEntityType: 'financial_account',
        actionUrl: '/financial-reconciliation'
      });
      
      onClose();
      return;
    }

    // Modo normal: conciliar com uma conta financeira
    const account = financialAccounts.find(acc => acc.id === selectedAccountId);
    if (!account) {
      alert('Selecione uma conta financeira para conciliar');
      return;
    }

    const difference = Math.abs(statement.amount) - account.amount;
    const status = Math.abs(difference) < 0.01 ? 'reconciled' : 'discrepancy';

    // Adicionar conciliação
    addFinancialReconciliation({
      date: new Date(),
      bankAccount: statement.bankAccount,
      statementId: statement.id,
      financialAccountId: account.id,
      amount: statement.amount,
      difference,
      status,
      notes,
      reconciledBy: 'Usuário',
      reconciledAt: new Date(),
      autoReconciled: false
    });

    // Atualizar status do extrato
    updateBankStatement(statement.id, { reconciled: true });
    
    // Atualizar status da conta financeira
    updateFinancialAccount(account.id, { 
      status: 'paid',
      paymentDate: statement.date,
      paymentMethod: 'bank_transfer'
    });
    
    // Notificar o usuário
    addNotification({
      title: status === 'reconciled' ? 'Conciliação realizada' : 'Conciliação com discrepância',
      message: `Extrato "${statement.description}" foi conciliado com "${account.description}".`,
      type: status === 'reconciled' ? 'success' : 'warning',
      relatedEntityType: 'financial_account',
      relatedEntityId: account.id,
      actionUrl: '/financial-reconciliation'
    });

    onClose();
  };

  if (!isOpen || !statement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Conciliar Movimentação</h2>
            <p className="text-info-100 text-sm mt-1">
              Associe a movimentação bancária com uma conta financeira
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-info-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Statement Details */}
          <div className="bg-gradient-to-br from-info-50 to-info-100 rounded-xl p-4 border border-info-200">
            <h3 className="font-medium text-b3x-navy-900 mb-3 text-sm">Movimentação Bancária</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-600">Data:</span>
                <div className="font-medium">{format(statement.date, 'dd/MM/yyyy', { locale: ptBR })}</div>
              </div>
              <div>
                <span className="text-neutral-600">Conta:</span>
                <div className="font-medium">{statement.bankAccount}</div>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-600">Descrição:</span>
                <div className="font-medium">{statement.description}</div>
              </div>
              <div>
                <span className="text-neutral-600">Valor:</span>
                <div className={`font-bold ${statement.type === 'credit' ? 'text-success-600' : 'text-error-600'}`}>
                  {statement.type === 'credit' ? '+' : '-'}R$ {Math.abs(statement.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-neutral-600">Tipo:</span>
                <div className="font-medium">
                  {statement.type === 'credit' ? 'Crédito (Entrada)' : 'Débito (Saída)'}
                </div>
              </div>
            </div>
          </div>

          {/* Sugestões de Correspondência */}
          {suggestedMatches.length > 0 && (
            <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-4 h-4 text-success-600" />
                <h3 className="font-medium text-b3x-navy-900 text-sm">Correspondências Sugeridas</h3>
              </div>
              
              <div className="space-y-2">
                {suggestedMatches.map((match) => {
                  const account = match.account;
                  return (
                    <div
                      key={account.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAccountId === account.id
                          ? 'border-success-300 bg-success-50'
                          : 'border-neutral-200 bg-white hover:border-success-300'
                      }`}
                      onClick={() => setSelectedAccountId(account.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-b3x-navy-900 text-sm truncate">{account.description}</div>
                          <div className="text-xs text-neutral-600">
                            Vencimento: {format(account.dueDate, 'dd/MM/yyyy', { locale: ptBR })} • 
                            {account.type === 'payable' ? ' A Pagar' : ' A Receber'}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className={`font-bold text-sm ${account.type === 'receivable' ? 'text-success-600' : 'text-error-600'}`}>
                            R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="flex items-center text-success-600 text-xs mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span>Confiança: {match.score}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalhes da correspondência */}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-1.5 rounded border border-neutral-100">
                          <span className="text-neutral-600">Diferença de valor:</span>
                          <span className="font-medium ml-1">
                            {(match.valueDifference * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-neutral-100">
                          <span className="text-neutral-600">Diferença de data:</span>
                          <span className="font-medium ml-1">
                            {match.daysDifference} {match.daysDifference === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alternar para modo manual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manual-mode"
                checked={manualMode}
                onChange={() => setManualMode(!manualMode)}
                className="rounded border-neutral-300 text-info-600 focus:ring-info-500"
              />
              <label htmlFor="manual-mode" className="text-sm font-medium text-neutral-700">
                Conciliação Manual (sem conta correspondente)
              </label>
            </div>
            
            {!manualMode && (
              <button
                onClick={() => {
                  // Limpar seleção e filtros
                  setSelectedAccountId('');
                  setSearchTerm('');
                  setTypeFilter('all');
                  setDateRangeFilter(7);
                }}
                className="text-xs text-info-600 hover:text-info-800"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {manualMode ? (
            /* Modo de Conciliação Manual */
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-info-600" />
                <h3 className="font-medium text-b3x-navy-900 text-sm">Detalhes da Conciliação Manual</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Descrição da Conciliação *
                  </label>
                  <input
                    type="text"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                    placeholder="Ex: Pagamento de fornecedor não cadastrado"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                    placeholder="Observações sobre a conciliação manual..."
                  />
                </div>
                
                <div className="bg-warning-50 p-3 rounded-lg border border-warning-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-warning-600" />
                    <span className="font-medium text-warning-700 text-sm">Atenção</span>
                  </div>
                  <p className="text-xs text-warning-600">
                    A conciliação manual não será associada a nenhuma conta financeira. 
                    Use esta opção apenas para transações que não possuem correspondência 
                    no sistema ou para ajustes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Modo de Conciliação Normal */
            <>
              {/* Filtros */}
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Filter className="w-4 h-4 text-neutral-600" />
                  <h3 className="font-medium text-b3x-navy-900 text-sm">Filtrar Contas</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Filtro de Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Tipo de Conta
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                    >
                      <option value="all">Todos os Tipos</option>
                      <option value="payable">A Pagar</option>
                      <option value="receivable">A Receber</option>
                    </select>
                  </div>
                  
                  {/* Filtro de Intervalo de Data */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Intervalo de Data
                    </label>
                    <select
                      value={dateRangeFilter}
                      onChange={(e) => setDateRangeFilter(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                    >
                      <option value="3">±3 dias</option>
                      <option value="7">±7 dias</option>
                      <option value="15">±15 dias</option>
                      <option value="30">±30 dias</option>
                      <option value="90">±90 dias</option>
                      <option value="0">Sem limite</option>
                    </select>
                  </div>
                  
                  {/* Busca */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Buscar
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                        placeholder="Buscar por descrição..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Contas */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Selecione a Conta Financeira para Conciliação
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingAccounts.length > 0 ? (
                    pendingAccounts.map((account) => {
                      const difference = Math.abs(statement.amount) - account.amount;
                      const isGoodMatch = Math.abs(difference) < 0.01;
                      const isReasonableMatch = Math.abs(difference) < account.amount * 0.05; // 5% de tolerância
                      
                      return (
                        <div
                          key={account.id}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedAccountId === account.id
                              ? 'border-info-300 bg-info-50'
                              : isGoodMatch
                              ? 'border-success-300 bg-success-50 hover:border-success-400'
                              : isReasonableMatch
                              ? 'border-warning-300 bg-warning-50 hover:border-warning-400'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                          onClick={() => setSelectedAccountId(account.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-b3x-navy-900 text-sm truncate">{account.description}</div>
                              <div className="text-xs text-neutral-600">
                                Vencimento: {format(account.dueDate, 'dd/MM/yyyy', { locale: ptBR })} • 
                                {account.type === 'payable' ? ' A Pagar' : ' A Receber'}
                              </div>
                              
                              {/* Informações adicionais */}
                              <div className="mt-1 text-xs text-neutral-500">
                                {account.relatedEntityType && (
                                  <span>
                                    {account.relatedEntityType === 'purchase_order' ? 'Ordem de Compra' : 
                                     account.relatedEntityType === 'sale_record' ? 'Venda' : 
                                     account.relatedEntityType === 'health_record' ? 'Protocolo Sanitário' : 
                                     'Outro'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className={`font-bold text-sm ${account.type === 'receivable' ? 'text-success-600' : 'text-error-600'}`}>
                                R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              {isGoodMatch ? (
                                <div className="flex items-center text-success-600 text-xs mt-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Correspondência exata
                                </div>
                              ) : (
                                <div className="flex items-center text-warning-600 text-xs mt-1">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Diferença: R$ {Math.abs(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                      <p className="text-neutral-600 text-sm">
                        Nenhuma conta encontrada com os filtros atuais.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setTypeFilter('all');
                          setDateRangeFilter(30);
                        }}
                        className="mt-2 text-info-600 hover:text-info-800 text-xs font-medium"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {!manualMode && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Observações sobre a conciliação..."
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReconcile}
              disabled={!manualMode && !selectedAccountId}
              className="px-4 py-1.5 bg-gradient-to-r from-info-500 to-info-600 text-white font-medium rounded-lg hover:from-info-600 hover:to-info-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Conciliar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};