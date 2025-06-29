import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Upload, Download, Filter, Search, Calendar, FileText, X, Plus, Settings, RefreshCw, FileUp, Database, Zap, Clock, ChevronDown, ChevronRight, CreditCard, Wallet, BarChart4, Layers } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { BankStatementForm } from '../Forms/BankStatementForm';
import { ReconciliationModal } from './ReconciliationModal';
import { TableWithPagination } from '../Common/TableWithPagination';
import { format, subDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Portal } from '../Common/Portal';
import { clsx } from 'clsx';
import { BankStatementBatchForm } from '../Forms/BankStatementBatchForm';
import { BankStatementImport } from './BankStatementImport';
import { ReconciliationRules } from './ReconciliationRules';
import { AutoReconciliationModal } from './AutoReconciliationModal';

export const FinancialReconciliation: React.FC = () => {
  const { 
    bankStatements, 
    financialAccounts, 
    financialReconciliations,
    payerAccounts,
    addBankStatement,
    addFinancialReconciliation,
    updateBankStatement,
    updateFinancialAccount,
    addNotification
  } = useAppStore();
  
  // Estados para controle de modais e formulários
  const [showStatementForm, setShowStatementForm] = useState(false);
  const [showBatchStatementForm, setShowBatchStatementForm] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAutoReconciliationModal, setShowAutoReconciliationModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'reconciled' | 'unreconciled' | 'discrepancy'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  
  // Estados para exibição
  const [activeTab, setActiveTab] = useState<'statements' | 'reconciliations' | 'analytics'>('statements');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    pendingStatements: true,
    pendingAccounts: true,
    recentReconciliations: true
  });

  // Filtrar extratos não conciliados
  const unreconciledStatements = bankStatements.filter(stmt => 
    !stmt.reconciled && 
    (selectedBankAccount ? stmt.bankAccount === selectedBankAccount : true) &&
    (typeFilter === 'all' || stmt.type === typeFilter) &&
    (searchTerm === '' || stmt.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    isAfter(stmt.date, dateFilter.startDate) && 
    isBefore(stmt.date, dateFilter.endDate)
  );
  
  // Filtrar contas pendentes
  const pendingAccounts = financialAccounts.filter(acc => 
    acc.status === 'pending' &&
    (searchTerm === '' || acc.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    isAfter(acc.dueDate, dateFilter.startDate) && 
    isBefore(acc.dueDate, dateFilter.endDate)
  );

  // Filtrar reconciliações recentes
  const filteredReconciliations = financialReconciliations.filter(rec => 
    (statusFilter === 'all' || 
     (statusFilter === 'reconciled' && rec.status === 'reconciled') ||
     (statusFilter === 'unreconciled' && rec.status === 'pending') ||
     (statusFilter === 'discrepancy' && rec.status === 'discrepancy')) &&
    (selectedBankAccount ? rec.bankAccount === selectedBankAccount : true) &&
    (searchTerm === '' || rec.notes?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    isAfter(rec.date, dateFilter.startDate) && 
    isBefore(rec.date, dateFilter.endDate)
  );

  // Calcular totais
  const totalUnreconciled = unreconciledStatements.reduce((sum, stmt) => sum + Math.abs(stmt.amount), 0);
  const totalPending = pendingAccounts.reduce((sum, acc) => sum + acc.amount, 0);
  const totalReconciled = financialReconciliations
    .filter(r => r.status === 'reconciled')
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  
  // Calcular taxa de conciliação
  const totalStatements = bankStatements.filter(stmt => 
    isAfter(stmt.date, dateFilter.startDate) && 
    isBefore(stmt.date, dateFilter.endDate)
  ).length;
  
  const reconciledStatements = bankStatements.filter(stmt => 
    stmt.reconciled && 
    isAfter(stmt.date, dateFilter.startDate) && 
    isBefore(stmt.date, dateFilter.endDate)
  ).length;
  
  const reconciliationRate = totalStatements > 0 ? (reconciledStatements / totalStatements) * 100 : 0;

  // Executar conciliação automática
  const handleAutoReconciliation = () => {
    setShowAutoReconciliationModal(true);
  };

  // Alternar expansão de seções
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Colunas para a tabela de extratos bancários
  const bankStatementColumns = [
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value: Date) => format(value, 'dd/MM/yyyy')
    },
    {
      key: 'bankAccount',
      label: 'Conta',
      sortable: true,
      render: (value: string) => {
        const account = payerAccounts.find(acc => acc.bankAccount === value);
        return account ? account.name : value;
      }
    },
    {
      key: 'description',
      label: 'Descrição',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-b3x-navy-900 text-sm truncate max-w-xs">{value}</div>
      )
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value: number, row: any) => (
        <span className={`font-medium ${row.type === 'credit' ? 'text-success-600' : 'text-error-600'}`}>
          {row.type === 'credit' ? '+' : '-'}R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'reconciled',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
        }`}>
          {value ? 'Conciliado' : 'Pendente'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          {!row.reconciled && (
            <button
              onClick={() => {
                setSelectedAccount(row.id);
                setShowReconciliationModal(true);
              }}
              className="px-2 py-1 text-xs bg-b3x-lime-500 text-b3x-navy-900 rounded hover:bg-b3x-lime-600 transition-colors"
            >
              Conciliar
            </button>
          )}
        </div>
      )
    }
  ];

  // Colunas para a tabela de conciliações
  const reconciliationColumns = [
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value: Date) => format(value, 'dd/MM/yyyy')
    },
    {
      key: 'bankAccount',
      label: 'Conta Bancária',
      sortable: true
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value: number) => `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'difference',
      label: 'Diferença',
      sortable: true,
      render: (value: number) => (
        <span className={value === 0 ? 'text-success-600' : 'text-error-600'}>
          R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'reconciled' 
            ? 'bg-success-100 text-success-700'
            : value === 'discrepancy'
            ? 'bg-error-100 text-error-700'
            : 'bg-warning-100 text-warning-700'
        }`}>
          {value === 'reconciled' ? 'Conciliado' : 
           value === 'discrepancy' ? 'Discrepância' : 'Pendente'}
        </span>
      )
    },
    {
      key: 'reconciledBy',
      label: 'Conciliado por',
      render: (value: string, row: any) => (
        <div className="flex items-center">
          {row.autoReconciled ? (
            <span className="flex items-center text-info-600">
              <Zap className="w-3 h-3 mr-1" />
              Auto
            </span>
          ) : (
            <span>{value || '-'}</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Abrir modal de detalhes da conciliação
              console.log('Ver detalhes da conciliação', row.id);
            }}
            className="px-2 py-1 text-xs bg-info-500 text-white rounded hover:bg-info-600 transition-colors"
          >
            Detalhes
          </button>
        </div>
      )
    }
  ];

  // Colunas para a tabela de contas financeiras
  const financialAccountColumns = [
    {
      key: 'dueDate',
      label: 'Vencimento',
      sortable: true,
      render: (value: Date) => format(value, 'dd/MM/yyyy')
    },
    {
      key: 'description',
      label: 'Descrição',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-b3x-navy-900 text-sm truncate max-w-xs">{value}</div>
      )
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value: number, row: any) => (
        <span className={`font-medium ${row.type === 'receivable' ? 'text-success-600' : 'text-error-600'}`}>
          {row.type === 'receivable' ? '+' : '-'}R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'paid' 
            ? 'bg-success-100 text-success-700'
            : value === 'overdue'
            ? 'bg-error-100 text-error-700'
            : 'bg-warning-100 text-warning-700'
        }`}>
          {value === 'paid' ? 'Pago' : 
           value === 'overdue' ? 'Vencido' : 'Pendente'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Buscar extrato correspondente
              setSelectedAccount(row.id);
              setShowReconciliationModal(true);
            }}
            className="px-2 py-1 text-xs bg-b3x-lime-500 text-b3x-navy-900 rounded hover:bg-b3x-lime-600 transition-colors"
          >
            Conciliar
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-b3x-navy-900">Conciliação Financeira</h2>
          <p className="text-neutral-600 text-sm mt-1">Reconcilie extratos bancários com contas a pagar e receber</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowStatementForm(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Lançamento Manual</span>
          </button>
          
          <button
            onClick={() => setShowBatchStatementForm(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Lançamento em Lote</span>
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-b3x-navy-800 text-white rounded-lg hover:bg-b3x-navy-900 transition-colors text-sm"
          >
            <FileUp className="w-4 h-4" />
            <span>Importar Extrato</span>
          </button>
          
          <button
            onClick={handleAutoReconciliation}
            className="flex items-center space-x-2 px-3 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            <span>Conciliação Automática</span>
          </button>
          
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Regras</span>
          </button>
        </div>
      </div>

      {/* Tabs e Filtros */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
        {/* Tabs */}
        <div className="bg-neutral-100 rounded-lg p-1 inline-flex mb-4">
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'statements' 
                ? 'bg-white text-b3x-navy-900 shadow-sm' 
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Extratos e Conciliação</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reconciliations')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'reconciliations' 
                ? 'bg-white text-b3x-navy-900 shadow-sm' 
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Histórico de Conciliações</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'analytics' 
                ? 'bg-white text-b3x-navy-900 shadow-sm' 
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart4 className="w-4 h-4" />
              <span>Análise Financeira</span>
            </div>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filtros:</span>
          </div>
          
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
            />
          </div>
          
          {/* Filtro de Conta */}
          <select
            value={selectedBankAccount}
            onChange={(e) => setSelectedBankAccount(e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
          >
            <option value="">Todas as Contas</option>
            {payerAccounts.map(account => (
              <option key={account.id} value={account.bankAccount}>
                {account.name}
              </option>
            ))}
          </select>
          
          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
          >
            <option value="all">Todos os Status</option>
            <option value="reconciled">Conciliados</option>
            <option value="unreconciled">Não Conciliados</option>
            <option value="discrepancy">Com Discrepância</option>
          </select>
          
          {/* Filtro de Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white/50"
          >
            <option value="all">Todos os Tipos</option>
            <option value="credit">Crédito</option>
            <option value="debit">Débito</option>
          </select>
        </div>
      </div>

      {/* Conteúdo da Tab Ativa */}
      {activeTab === 'statements' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Não Conciliados</h3>
                  <p className="text-xs text-neutral-600">Extratos bancários</p>
                </div>
              </div>
              <div className="text-xl font-bold text-warning-600 mb-1">
                {unreconciledStatements.length}
              </div>
              <div className="text-xs text-neutral-600">
                R$ {totalUnreconciled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-error-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-error-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Contas Pendentes</h3>
                  <p className="text-xs text-neutral-600">A pagar/receber</p>
                </div>
              </div>
              <div className="text-xl font-bold text-error-600 mb-1">
                {pendingAccounts.length}
              </div>
              <div className="text-xs text-neutral-600">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Conciliados</h3>
                  <p className="text-xs text-neutral-600">Este período</p>
                </div>
              </div>
              <div className="text-xl font-bold text-success-600 mb-1">
                {financialReconciliations.filter(r => r.status === 'reconciled').length}
              </div>
              <div className="text-xs text-neutral-600">
                R$ {totalReconciled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <BarChart4 className="w-4 h-4 text-info-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Taxa de Conciliação</h3>
                  <p className="text-xs text-neutral-600">Eficiência</p>
                </div>
              </div>
              <div className="text-xl font-bold text-info-600 mb-1">
                {reconciliationRate.toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-600">
                {reconciledStatements} de {totalStatements} transações
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro de Período */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dateFilter.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  />
                  <span className="text-xs text-neutral-600">até</span>
                  <input
                    type="date"
                    value={dateFilter.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Extratos Bancários e Contas Pendentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Extratos Bancários */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
              <div className="p-4 border-b border-neutral-200/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-b3x-navy-900">Extratos Bancários</h3>
                  <span className="px-2 py-1 bg-warning-100 text-warning-800 rounded-full text-xs font-medium">
                    {unreconciledStatements.length} pendentes
                  </span>
                </div>
                <button
                  onClick={() => toggleSection('pendingStatements')}
                  className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                >
                  {expandedSections.pendingStatements ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {expandedSections.pendingStatements && (
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {unreconciledStatements.length > 0 ? (
                    unreconciledStatements.map((statement) => (
                      <div key={statement.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border hover:border-b3x-lime-200 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-b3x-navy-900 text-sm truncate">{statement.description}</div>
                          <div className="text-xs text-neutral-600">
                            {format(statement.date, 'dd/MM/yyyy')} • {statement.bankAccount}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className={`font-bold text-sm ${statement.type === 'credit' ? 'text-success-600' : 'text-error-600'}`}>
                            {statement.type === 'credit' ? '+' : '-'}R$ {Math.abs(statement.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAccount(statement.id);
                              setShowReconciliationModal(true);
                            }}
                            className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700"
                          >
                            Conciliar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success-500" />
                      <p className="text-sm">Todos os extratos foram conciliados!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contas Financeiras */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
              <div className="p-4 border-b border-neutral-200/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-b3x-navy-900">Contas Financeiras</h3>
                  <span className="px-2 py-1 bg-error-100 text-error-800 rounded-full text-xs font-medium">
                    {pendingAccounts.length} pendentes
                  </span>
                </div>
                <button
                  onClick={() => toggleSection('pendingAccounts')}
                  className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                >
                  {expandedSections.pendingAccounts ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {expandedSections.pendingAccounts && (
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {pendingAccounts.length > 0 ? (
                    pendingAccounts.map((account) => (
                      <div key={account.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border hover:border-b3x-lime-200 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-b3x-navy-900 text-sm truncate">{account.description}</div>
                          <div className="text-xs text-neutral-600">
                            Venc: {format(account.dueDate, 'dd/MM/yyyy')} • {account.type === 'payable' ? 'A Pagar' : 'A Receber'}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className={`font-bold text-sm ${account.type === 'receivable' ? 'text-success-600' : 'text-error-600'}`}>
                            R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            account.status === 'overdue' ? 'bg-error-100 text-error-700' : 'bg-warning-100 text-warning-700'
                          }`}>
                            {account.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <DollarSign className="w-10 h-10 mx-auto mb-3 text-success-500" />
                      <p className="text-sm">Nenhuma conta pendente!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conciliações Recentes */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-b3x-navy-900">Conciliações Recentes</h3>
                <span className="px-2 py-1 bg-info-100 text-info-800 rounded-full text-xs font-medium">
                  {filteredReconciliations.length} registros
                </span>
              </div>
              <button
                onClick={() => toggleSection('recentReconciliations')}
                className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              >
                {expandedSections.recentReconciliations ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {expandedSections.recentReconciliations && (
              <TableWithPagination
                data={filteredReconciliations}
                columns={reconciliationColumns}
                itemsPerPage={10}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'reconciliations' && (
        <div className="p-4">
          {/* Histórico de Conciliações */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 mb-6">
            <div className="p-4 border-b border-neutral-200/50">
              <h3 className="text-lg font-semibold text-b3x-navy-900">Histórico Completo de Conciliações</h3>
              <p className="text-sm text-neutral-600 mt-1">Visualize todas as conciliações realizadas no período</p>
            </div>
            
            <TableWithPagination
              data={filteredReconciliations}
              columns={reconciliationColumns}
              itemsPerPage={15}
            />
          </div>
          
          {/* Extratos Bancários */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 mb-6">
            <div className="p-4 border-b border-neutral-200/50">
              <h3 className="text-lg font-semibold text-b3x-navy-900">Extratos Bancários</h3>
              <p className="text-sm text-neutral-600 mt-1">Todos os extratos do período selecionado</p>
            </div>
            
            <TableWithPagination
              data={bankStatements.filter(stmt => 
                (selectedBankAccount ? stmt.bankAccount === selectedBankAccount : true) &&
                (typeFilter === 'all' || stmt.type === typeFilter) &&
                (searchTerm === '' || stmt.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
                isAfter(stmt.date, dateFilter.startDate) && 
                isBefore(stmt.date, dateFilter.endDate)
              )}
              columns={bankStatementColumns}
              itemsPerPage={15}
            />
          </div>
          
          {/* Contas Financeiras */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50">
              <h3 className="text-lg font-semibold text-b3x-navy-900">Contas Financeiras</h3>
              <p className="text-sm text-neutral-600 mt-1">Todas as contas a pagar e receber do período</p>
            </div>
            
            <TableWithPagination
              data={financialAccounts.filter(acc => 
                (searchTerm === '' || acc.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
                isAfter(acc.dueDate, dateFilter.startDate) && 
                isBefore(acc.dueDate, dateFilter.endDate)
              )}
              columns={financialAccountColumns}
              itemsPerPage={15}
            />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="p-4">
          {/* Análise Financeira */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Gráfico de Fluxo de Caixa */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Fluxo de Caixa</h3>
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">Gráfico de fluxo de caixa será exibido aqui</p>
              </div>
            </div>
            
            {/* Gráfico de Conciliação */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Taxa de Conciliação</h3>
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">Gráfico de taxa de conciliação será exibido aqui</p>
              </div>
            </div>
          </div>
          
          {/* Estatísticas de Conciliação */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 mb-6">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Estatísticas de Conciliação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Taxa de Conciliação</h4>
                <div className="text-2xl font-bold text-b3x-navy-900">{reconciliationRate.toFixed(0)}%</div>
                <div className="text-xs text-neutral-600 mt-1">
                  {reconciledStatements} de {totalStatements} transações
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Tempo Médio de Conciliação</h4>
                <div className="text-2xl font-bold text-b3x-navy-900">2.3 dias</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Entre lançamento e conciliação
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Conciliação Automática</h4>
                <div className="text-2xl font-bold text-b3x-navy-900">65%</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Taxa de automação
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Discrepâncias</h4>
                <div className="text-2xl font-bold text-b3x-navy-900">3%</div>
                <div className="text-xs text-neutral-600 mt-1">
                  Taxa de discrepâncias
                </div>
              </div>
            </div>
          </div>
          
          {/* Relatórios Disponíveis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Relatórios Disponíveis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:border-b3x-lime-200 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-b3x-navy-600" />
                  <h4 className="font-medium text-b3x-navy-900">Fluxo de Caixa</h4>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Relatório detalhado de entradas e saídas no período selecionado
                </p>
                <button className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700 font-medium">
                  Gerar Relatório
                </button>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:border-b3x-lime-200 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-b3x-navy-600" />
                  <h4 className="font-medium text-b3x-navy-900">Conciliação Bancária</h4>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Relatório de conciliação bancária com detalhamento de pendências
                </p>
                <button className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700 font-medium">
                  Gerar Relatório
                </button>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 hover:border-b3x-lime-200 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-b3x-navy-600" />
                  <h4 className="font-medium text-b3x-navy-900">DRE Simplificado</h4>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Demonstrativo de Resultado do Exercício com base nas conciliações
                </p>
                <button className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700 font-medium">
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais e Formulários */}
      {showStatementForm && (
        <Portal>
          <BankStatementForm
            isOpen={showStatementForm}
            onClose={() => setShowStatementForm(false)}
          />
        </Portal>
      )}

      {showBatchStatementForm && (
        <Portal>
          <BankStatementBatchForm
            isOpen={showBatchStatementForm}
            onClose={() => setShowBatchStatementForm(false)}
          />
        </Portal>
      )}

      {showReconciliationModal && (
        <Portal>
          <ReconciliationModal
            isOpen={showReconciliationModal}
            onClose={() => setShowReconciliationModal(false)}
            statementId={selectedAccount}
          />
        </Portal>
      )}

      {showImportModal && (
        <Portal>
          <BankStatementImport
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
          />
        </Portal>
      )}

      {showRulesModal && (
        <Portal>
          <ReconciliationRules
            isOpen={showRulesModal}
            onClose={() => setShowRulesModal(false)}
          />
        </Portal>
      )}

      {showAutoReconciliationModal && (
        <Portal>
          <AutoReconciliationModal
            isOpen={showAutoReconciliationModal}
            onClose={() => setShowAutoReconciliationModal(false)}
          />
        </Portal>
      )}
    </div>
  );
};