import React, { useState, useEffect } from 'react';
import { X, Zap, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Settings, Filter, Eye, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MatchResult {
  statementId: string;
  accountId: string;
  confidence: number;
  difference: number;
  matchReason: string;
}

export const AutoReconciliationModal: React.FC<AutoReconciliationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    bankStatements, 
    financialAccounts, 
    addFinancialReconciliation,
    updateBankStatement,
    updateFinancialAccount,
    addNotification
  } = useAppStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [showOnlyHighConfidence, setShowOnlyHighConfidence] = useState(false);
  
  // Encontrar correspondências automáticas
  useEffect(() => {
    if (isOpen && !isProcessing && matches.length === 0) {
      handleStartMatching();
    }
  }, [isOpen]);

  // Iniciar o processo de correspondência
  const handleStartMatching = () => {
    setIsProcessing(true);
    setProcessingStep(1);
    setProcessingProgress(0);
    setMatches([]);
    setSelectedMatches([]);
    
    // Simular processamento
    const totalSteps = 3;
    const stepsInterval = 1000; // 1 segundo por etapa
    
    // Etapa 1: Analisando extratos
    setTimeout(() => {
      setProcessingProgress(33);
      setProcessingStep(2);
      
      // Etapa 2: Encontrando correspondências
      setTimeout(() => {
        setProcessingProgress(66);
        setProcessingStep(3);
        
        // Etapa 3: Gerando resultados
        setTimeout(() => {
          // Gerar correspondências
          const unreconciledStatements = bankStatements.filter(stmt => !stmt.reconciled);
          const pendingAccounts = financialAccounts.filter(acc => acc.status === 'pending');
          
          const generatedMatches: MatchResult[] = [];
          
          unreconciledStatements.forEach(statement => {
            // Filtrar contas com base no tipo de transação
            const matchingTypeAccounts = pendingAccounts.filter(acc => {
              if (statement.type === 'debit') return acc.type === 'payable';
              if (statement.type === 'credit') return acc.type === 'receivable';
              return false;
            });
            
            // Calcular pontuação de correspondência para cada conta
            const scoredMatches = matchingTypeAccounts.map(account => {
              let score = 0;
              let matchReason = '';
              
              // Pontuação por proximidade de valor (máximo 50 pontos)
              const valueDifference = Math.abs(Math.abs(statement.amount) - account.amount);
              const valuePercentDiff = account.amount > 0 ? valueDifference / account.amount : 1;
              
              if (valuePercentDiff < 0.001) {
                score += 50; // Diferença menor que 0.1%
                matchReason += 'Valor idêntico. ';
              } else if (valuePercentDiff < 0.01) {
                score += 40; // Diferença menor que 1%
                matchReason += 'Valor muito próximo. ';
              } else if (valuePercentDiff < 0.05) {
                score += 30; // Diferença menor que 5%
                matchReason += 'Valor próximo. ';
              } else if (valuePercentDiff < 0.1) {
                score += 20; // Diferença menor que 10%
                matchReason += 'Valor com pequena diferença. ';
              } else if (valuePercentDiff < 0.2) {
                score += 10; // Diferença menor que 20%
                matchReason += 'Valor com diferença significativa. ';
              }
              
              // Pontuação por proximidade de data (máximo 30 pontos)
              const daysDifference = Math.abs(differenceInDays(account.dueDate, statement.date));
              if (daysDifference === 0) {
                score += 30; // Mesmo dia
                matchReason += 'Mesma data. ';
              } else if (daysDifference <= 1) {
                score += 25; // 1 dia de diferença
                matchReason += 'Datas com 1 dia de diferença. ';
              } else if (daysDifference <= 3) {
                score += 20; // Até 3 dias
                matchReason += 'Datas próximas (até 3 dias). ';
              } else if (daysDifference <= 7) {
                score += 15; // Até 1 semana
                matchReason += 'Datas na mesma semana. ';
              } else if (daysDifference <= 14) {
                score += 10; // Até 2 semanas
                matchReason += 'Datas com até 2 semanas de diferença. ';
              } else if (daysDifference <= 30) {
                score += 5; // Até 1 mês
                matchReason += 'Datas no mesmo mês. ';
              }
              
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
              
              if (keywordMatches > 2) {
                score += 20;
                matchReason += 'Múltiplas palavras-chave em comum. ';
              } else if (keywordMatches > 0) {
                score += 10 * keywordMatches;
                matchReason += `${keywordMatches} palavra(s)-chave em comum. `;
              }
              
              return {
                statementId: statement.id,
                accountId: account.id,
                confidence: score,
                difference: valueDifference,
                matchReason: matchReason.trim()
              };
            });
            
            // Encontrar a melhor correspondência para este extrato
            const bestMatch = scoredMatches.sort((a, b) => b.confidence - a.confidence)[0];
            if (bestMatch && bestMatch.confidence >= 30) {
              generatedMatches.push(bestMatch);
            }
          });
          
          setMatches(generatedMatches);
          
          // Pré-selecionar correspondências de alta confiança
          const highConfidenceMatches = generatedMatches
            .filter(match => match.confidence >= confidenceThreshold)
            .map(match => match.statementId);
          
          setSelectedMatches(highConfidenceMatches);
          setProcessingProgress(100);
          setIsProcessing(false);
        }, stepsInterval);
      }, stepsInterval);
    }, stepsInterval);
  };

  // Selecionar/deselecionar todas as correspondências
  const toggleSelectAll = () => {
    if (selectedMatches.length === matches.length) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(matches.map(match => match.statementId));
    }
  };

  // Alternar seleção de uma correspondência
  const toggleMatchSelection = (statementId: string) => {
    if (selectedMatches.includes(statementId)) {
      setSelectedMatches(selectedMatches.filter(id => id !== statementId));
    } else {
      setSelectedMatches([...selectedMatches, statementId]);
    }
  };

  // Aplicar conciliações selecionadas
  const applyReconciliations = () => {
    if (selectedMatches.length === 0) {
      alert('Selecione pelo menos uma correspondência para conciliar');
      return;
    }
    
    // Processar cada correspondência selecionada
    selectedMatches.forEach(statementId => {
      const match = matches.find(m => m.statementId === statementId);
      if (!match) return;
      
      const statement = bankStatements.find(s => s.id === match.statementId);
      const account = financialAccounts.find(a => a.id === match.accountId);
      
      if (!statement || !account) return;
      
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
        notes: `Conciliação automática: ${match.matchReason}`,
        reconciledBy: 'Sistema',
        reconciledAt: new Date(),
        matchConfidence: match.confidence,
        matchReason: match.matchReason,
        autoReconciled: true
      });
      
      // Atualizar status do extrato
      updateBankStatement(statement.id, { reconciled: true });
      
      // Atualizar status da conta financeira
      updateFinancialAccount(account.id, { 
        status: 'paid',
        paymentDate: statement.date,
        paymentMethod: 'bank_transfer'
      });
    });
    
    // Notificar o usuário
    addNotification({
      title: 'Conciliação automática concluída',
      message: `${selectedMatches.length} transações foram conciliadas automaticamente.`,
      type: 'success',
      relatedEntityType: 'financial_account',
      actionUrl: '/financial-reconciliation'
    });
    
    onClose();
  };

  // Obter detalhes de um extrato
  const getStatementDetails = (statementId: string) => {
    return bankStatements.find(s => s.id === statementId);
  };

  // Obter detalhes de uma conta
  const getAccountDetails = (accountId: string) => {
    return financialAccounts.find(a => a.id === accountId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Conciliação Automática</h2>
            <p className="text-b3x-navy-700 text-sm mt-1">
              Encontre e aplique correspondências automáticas entre extratos e contas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-lime-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isProcessing ? (
            /* Tela de Processamento */
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-b3x-lime-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-b3x-lime-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-b3x-navy-900 mb-2">
                Processando Conciliação Automática
              </h3>
              <p className="text-neutral-600 text-sm mb-4">
                {processingStep === 1 ? 'Analisando extratos bancários...' :
                 processingStep === 2 ? 'Encontrando correspondências...' :
                 'Gerando resultados...'}
              </p>
              
              {/* Barra de Progresso */}
              <div className="w-64 h-2 bg-neutral-200 rounded-full mx-auto overflow-hidden">
                <div 
                  className="h-full bg-b3x-lime-500 transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {processingProgress}% concluído
              </p>
            </div>
          ) : (
            /* Resultados da Correspondência */
            <>
              {/* Configurações e Filtros */}
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Settings className="w-4 h-4 text-neutral-600" />
                  <h3 className="font-medium text-b3x-navy-900 text-sm">Configurações de Conciliação</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Limite de Confiança Mínima
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-b3x-navy-900 w-8 text-center">
                        {confidenceThreshold}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showOnlyHighConfidence}
                        onChange={() => setShowOnlyHighConfidence(!showOnlyHighConfidence)}
                        className="rounded border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
                      />
                      <span className="text-sm text-neutral-700">Mostrar apenas alta confiança</span>
                    </label>
                    
                    <button
                      onClick={handleStartMatching}
                      className="px-3 py-1.5 bg-info-500 text-white text-xs rounded-lg hover:bg-info-600 transition-colors flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Recalcular</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="font-medium text-b3x-navy-900 text-sm">
                    Correspondências Encontradas ({matches.length})
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleSelectAll}
                      className="text-xs text-info-600 hover:text-info-800 flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>{selectedMatches.length === matches.length ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
                    </button>
                    
                    <span className="text-xs text-neutral-500">
                      {selectedMatches.length} selecionados
                    </span>
                  </div>
                </div>
                
                {matches.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600 w-10">
                            <input
                              type="checkbox"
                              checked={selectedMatches.length === matches.length}
                              onChange={toggleSelectAll}
                              className="rounded border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Extrato</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Conta Financeira</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Confiança</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Diferença</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {matches
                          .filter(match => !showOnlyHighConfidence || match.confidence >= confidenceThreshold)
                          .map((match) => {
                            const statement = getStatementDetails(match.statementId);
                            const account = getAccountDetails(match.accountId);
                            
                            if (!statement || !account) return null;
                            
                            return (
                              <tr key={match.statementId} className="hover:bg-neutral-50">
                                <td className="px-3 py-2 text-xs text-neutral-700">
                                  <input
                                    type="checkbox"
                                    checked={selectedMatches.includes(match.statementId)}
                                    onChange={() => toggleMatchSelection(match.statementId)}
                                    className="rounded border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
                                  />
                                </td>
                                <td className="px-3 py-2 text-xs text-neutral-700">
                                  <div className="font-medium text-b3x-navy-900">{statement.description}</div>
                                  <div className="text-neutral-500">
                                    {format(statement.date, 'dd/MM/yyyy', { locale: ptBR })} • 
                                    <span className={statement.type === 'credit' ? 'text-success-600' : 'text-error-600'}>
                                      {' '}{statement.type === 'credit' ? '+' : '-'}
                                      R$ {Math.abs(statement.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs text-neutral-700">
                                  <div className="font-medium text-b3x-navy-900">{account.description}</div>
                                  <div className="text-neutral-500">
                                    {format(account.dueDate, 'dd/MM/yyyy', { locale: ptBR })} • 
                                    <span className={account.type === 'receivable' ? 'text-success-600' : 'text-error-600'}>
                                      {' '}R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    match.confidence >= 80 ? 'bg-success-100 text-success-700' :
                                    match.confidence >= 50 ? 'bg-warning-100 text-warning-700' :
                                    'bg-error-100 text-error-700'
                                  }`}>
                                    {match.confidence >= 80 ? (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    ) : match.confidence >= 50 ? (
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                    ) : (
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {match.confidence}%
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {match.matchReason}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {match.difference === 0 ? (
                                    <span className="text-success-600 font-medium">Sem diferença</span>
                                  ) : (
                                    <span className="text-warning-600 font-medium">
                                      R$ {match.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <button
                                    className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-warning-500" />
                    </div>
                    <p className="text-neutral-600 text-sm mb-2">
                      Nenhuma correspondência encontrada
                    </p>
                    <p className="text-neutral-500 text-xs mb-4">
                      Tente ajustar os critérios de correspondência ou adicione mais dados
                    </p>
                    <button
                      onClick={handleStartMatching}
                      className="px-3 py-1.5 bg-info-500 text-white text-sm rounded-lg hover:bg-info-600 transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}
              </div>

              {/* Resumo e Ações */}
              {matches.length > 0 && (
                <div className="bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-lg p-4 border border-b3x-lime-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-4 h-4 text-b3x-lime-600" />
                    <h3 className="font-medium text-b3x-navy-900 text-sm">Resumo da Conciliação Automática</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-b3x-navy-900">{matches.length}</div>
                      <div className="text-xs text-neutral-600">Total de Correspondências</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-success-600">
                        {matches.filter(m => m.confidence >= confidenceThreshold).length}
                      </div>
                      <div className="text-xs text-neutral-600">Acima do Limite ({confidenceThreshold}%)</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-b3x-lime-600">{selectedMatches.length}</div>
                      <div className="text-xs text-neutral-600">Selecionados para Conciliação</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={applyReconciliations}
                      disabled={selectedMatches.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Aplicar {selectedMatches.length} Conciliações</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {isProcessing ? 'Cancelar' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};