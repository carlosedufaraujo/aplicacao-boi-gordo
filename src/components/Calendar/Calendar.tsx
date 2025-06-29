import React, { useState } from 'react';
import { Calendar as CalendarIcon, CreditCard, Receipt, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, TrendingUp, DollarSign, AlertTriangle, Search, Filter, Layers, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TableWithPagination } from '../Common/TableWithPagination';
import { clsx } from 'clsx';

export const Calendar: React.FC = () => {
  const { financialAccounts, bankStatements } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetailsExpanded, setShowDetailsExpanded] = useState(false);
  const [projectedDays, setProjectedDays] = useState<number>(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'settled'>('calendar');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calcular saldo atual
  const currentBalance = bankStatements.reduce((sum, statement) => {
    return statement.type === 'credit' ? sum + statement.amount : sum - Math.abs(statement.amount);
  }, 0);

  // Calcular contas vencidas
  const overdueAccounts = financialAccounts.filter(acc => 
    acc.status === 'overdue' || 
    (acc.status === 'pending' && isBefore(acc.dueDate, new Date()))
  );
  
  const totalOverdueAmount = overdueAccounts.reduce((sum, acc) => sum + acc.amount, 0);
  
  // Calcular média de dias de atraso
  const averageDaysOverdue = overdueAccounts.length > 0 
    ? overdueAccounts.reduce((sum, acc) => sum + differenceInDays(new Date(), acc.dueDate), 0) / overdueAccounts.length 
    : 0;

  // Calcular entradas próximas (baseado no período selecionado)
  const upcomingReceivables = financialAccounts
    .filter(acc => 
      acc.type === 'receivable' && 
      acc.status === 'pending' && 
      isBefore(acc.dueDate, addDays(new Date(), projectedDays))
    )
    .reduce((sum, acc) => sum + acc.amount, 0);

  // Calcular saídas próximas (baseado no período selecionado)
  const upcomingPayables = financialAccounts
    .filter(acc => 
      acc.type === 'payable' && 
      acc.status === 'pending' && 
      isBefore(acc.dueDate, addDays(new Date(), projectedDays))
    )
    .reduce((sum, acc) => sum + acc.amount, 0);

  // Calcular saldo projetado para o período selecionado
  const projectedBalance = currentBalance + upcomingReceivables - upcomingPayables;

  // Calcular índice de liquidez
  const liquidityIndex = upcomingPayables > 0 
    ? (currentBalance + upcomingReceivables) / upcomingPayables 
    : upcomingReceivables > 0 ? 2 : 1; // Se não há contas a pagar, mas há a receber, liquidez é boa

  // Filtrar próximos vencimentos
  const filteredUpcomingDueDates = financialAccounts
    .filter(acc => {
      // Filtro de status
      if (filterStatus !== 'all' && acc.status !== filterStatus) {
        return false;
      }
      
      // Filtro de tipo
      if (filterType !== 'all' && acc.type !== filterType) {
        return false;
      }
      
      // Filtro de pesquisa
      if (searchTerm && !acc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return acc.status === 'pending';
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Filtrar pagamentos liquidados
  const filteredSettledPayments = financialAccounts
    .filter(acc => {
      // Filtro de tipo
      if (filterType !== 'all' && acc.type !== filterType) {
        return false;
      }
      
      // Filtro de pesquisa
      if (searchTerm && !acc.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return acc.status === 'paid';
    })
    .sort((a, b) => (b.paymentDate?.getTime() || 0) - (a.paymentDate?.getTime() || 0));

  const getAccountsForDate = (date: Date) => {
    return financialAccounts.filter(acc => isSameDay(acc.dueDate, date));
  };

  // Função para determinar a intensidade da cor baseada no valor total das transações do dia
  const getHeatmapColorClass = (date: Date) => {
    const accounts = getAccountsForDate(date);
    if (accounts.length === 0) return 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50';
    
    const totalValue = accounts.reduce((sum, acc) => sum + acc.amount, 0);
    
    // Determinar se o dia tem mais contas a pagar ou a receber
    const hasPayable = accounts.some(acc => acc.type === 'payable');
    const hasReceivable = accounts.some(acc => acc.type === 'receivable');
    
    // Calcular a intensidade baseada no valor total (escala de 1 a 5)
    const getIntensity = (value: number) => {
      if (value < 10000) return 1; // até 10 mil
      if (value < 50000) return 2; // até 50 mil
      if (value < 100000) return 3; // até 100 mil
      if (value < 500000) return 4; // até 500 mil
      return 5; // acima de 500 mil
    };
    
    const intensity = getIntensity(totalValue);
    
    // Aplicar cores baseadas no tipo e intensidade
    if (hasPayable && hasReceivable) {
      // Misto - tons de amarelo/laranja
      return [
        'bg-warning-50 border-warning-200 text-warning-800',
        'bg-warning-100 border-warning-300 text-warning-800',
        'bg-warning-200 border-warning-400 text-warning-800',
        'bg-warning-300 border-warning-500 text-warning-800',
        'bg-warning-400 border-warning-600 text-warning-900'
      ][intensity - 1];
    } else if (hasPayable) {
      // Saídas - tons de vermelho
      return [
        'bg-error-50 border-error-200 text-error-800',
        'bg-error-100 border-error-300 text-error-800',
        'bg-error-200 border-error-400 text-error-800',
        'bg-error-300 border-error-500 text-error-800',
        'bg-error-400 border-error-600 text-error-900'
      ][intensity - 1];
    } else {
      // Entradas - tons de verde
      return [
        'bg-success-50 border-success-200 text-success-800',
        'bg-success-100 border-success-300 text-success-800',
        'bg-success-200 border-success-400 text-success-800',
        'bg-success-300 border-success-500 text-success-800',
        'bg-success-400 border-success-600 text-success-900'
      ][intensity - 1];
    }
  };

  // Colunas para a tabela de próximos vencimentos
  const upcomingDueDatesColumns = [
    {
      key: 'dueDate',
      label: 'Data',
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
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'receivable' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
        }`}>
          {value === 'receivable' ? 'A Receber' : 'A Pagar'}
        </span>
      )
    }
  ];

  // Colunas para a tabela de pagamentos liquidados
  const settledPaymentsColumns = [
    {
      key: 'paymentDate',
      label: 'Data Pagamento',
      sortable: true,
      render: (value: Date) => value ? format(value, 'dd/MM/yyyy') : '-'
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
      key: 'paymentMethod',
      label: 'Método',
      render: (value: string) => value || 'Transferência'
    }
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-b3x-navy-900 mb-1">Calendário e Caixa</h2>
          <p className="text-neutral-600 text-sm">Gerencie o fluxo financeiro e acompanhe vencimentos</p>
        </div>
      </div>

      {/* Tabs de navegação */}
      <div className="bg-neutral-100 rounded-lg p-1 mb-6 inline-flex">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'calendar'
              ? 'bg-white text-b3x-navy-900 shadow-sm'
              : 'text-neutral-600 hover:text-b3x-navy-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Calendário</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-b3x-navy-900 shadow-sm'
              : 'text-neutral-600 hover:text-b3x-navy-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Próximos Vencimentos</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('settled')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'settled'
              ? 'bg-white text-b3x-navy-900 shadow-sm'
              : 'text-neutral-600 hover:text-b3x-navy-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Pagamentos Liquidados</span>
          </div>
        </button>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'calendar' && (
        <>
          {/* Barra de Resumo - 5 cards incluindo Saldo Projetado e Saídas Próximas */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {/* Saldo Hoje */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-b3x-navy-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-b3x-navy-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Saldo Hoje</h3>
                </div>
              </div>
              <div className="text-xl font-bold text-b3x-navy-900 mb-1">
                R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-600">
                Saldo consolidado de todas as contas
              </div>
            </div>

            {/* Contas Vencidas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-error-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-error-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Contas Vencidas</h3>
                </div>
              </div>
              <div className="text-xl font-bold text-error-600 mb-1">
                R$ {totalOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-600">
                {overdueAccounts.length} contas • {Math.round(averageDaysOverdue)} dias em média
              </div>
            </div>

            {/* Entradas Próximas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-success-100 rounded-lg">
                  <ArrowUp className="w-4 h-4 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Entradas Próximas</h3>
                </div>
              </div>
              <div className="text-xl font-bold text-success-600 mb-1">
                R$ {upcomingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-600">
                Próximos {projectedDays} dias
              </div>
            </div>

            {/* Saídas Próximas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-error-100 rounded-lg">
                  <ArrowDown className="w-4 h-4 text-error-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Saídas Próximas</h3>
                </div>
              </div>
              <div className="text-xl font-bold text-error-600 mb-1">
                R$ {upcomingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-600">
                Próximos {projectedDays} dias
              </div>
            </div>

            {/* Índice de Liquidez */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  liquidityIndex >= 1 ? 'bg-success-100' : 
                  liquidityIndex > 0.7 ? 'bg-warning-100' : 'bg-error-100'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${
                    liquidityIndex >= 1 ? 'text-success-600' : 
                    liquidityIndex > 0.7 ? 'text-warning-600' : 'text-error-600'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Índice de Liquidez</h3>
                </div>
              </div>
              <div className={`text-xl font-bold mb-1 ${
                liquidityIndex >= 1 ? 'text-success-600' : 
                liquidityIndex > 0.7 ? 'text-warning-600' : 'text-error-600'
              }`}>
                {liquidityIndex.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-600">
                {liquidityIndex >= 1 ? 'Saudável' : liquidityIndex > 0.7 ? 'Atenção' : 'Crítico'}
              </div>
            </div>
          </div>

          {/* Calendário com Saldo Projetado integrado */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              {/* Calendário - 3/4 da largura */}
              <div className="lg:col-span-3 border-r border-neutral-200/50">
                <div className="p-4 border-b border-neutral-200/50 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-b3x-navy-900">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      className="p-2 text-neutral-600 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      className="p-2 text-neutral-600 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid - Mapa de Calor */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-neutral-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day) => {
                      const accounts = getAccountsForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const totalValue = accounts.reduce((sum, acc) => sum + acc.amount, 0);
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => {
                            if (selectedDate && isSameDay(day, selectedDate)) {
                              // Se o mesmo dia for clicado novamente, alternar o estado de expansão
                              setShowDetailsExpanded(!showDetailsExpanded);
                            } else {
                              // Se um novo dia for selecionado, definir como selecionado e expandir detalhes
                              setSelectedDate(day);
                              setShowDetailsExpanded(true);
                            }
                          }}
                          className={clsx(
                            "p-2 h-14 border rounded-lg text-sm transition-all duration-200 relative",
                            getHeatmapColorClass(day),
                            isSelected ? "ring-2 ring-b3x-lime-500" : "",
                            !isSameMonth(day, currentDate) ? "opacity-30" : ""
                          )}
                        >
                          <div className="font-medium">{format(day, 'd')}</div>
                          {accounts.length > 0 && (
                            <div className="absolute bottom-1 left-1 right-1">
                              <div className="text-xs font-medium truncate">
                                R$ {totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Details - Melhorado */}
                  {selectedDate && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-b3x-navy-900 text-sm">
                          {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </h4>
                        
                        {getAccountsForDate(selectedDate).length > 0 && (
                          <button 
                            onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                            className="text-xs text-b3x-lime-600 hover:text-b3x-lime-700 font-medium"
                          >
                            {showDetailsExpanded ? "Recolher lista" : "Ver lista completa"}
                          </button>
                        )}
                      </div>
                      
                      {getAccountsForDate(selectedDate).length > 0 ? (
                        <>
                          {/* Resumo do dia */}
                          <div className="bg-white p-2 rounded border mb-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-neutral-600">Total do dia:</span>
                                <div className="font-bold text-b3x-navy-900">
                                  R$ {getAccountsForDate(selectedDate)
                                    .reduce((sum, acc) => sum + acc.amount, 0)
                                    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <div>
                                <span className="text-neutral-600">Contas:</span>
                                <div className="font-medium">
                                  {getAccountsForDate(selectedDate).filter(acc => acc.type === 'payable').length} a pagar / {' '}
                                  {getAccountsForDate(selectedDate).filter(acc => acc.type === 'receivable').length} a receber
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Lista de contas do dia - mostrar apenas se expandido */}
                          {showDetailsExpanded && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {getAccountsForDate(selectedDate).map((account) => (
                                <div key={account.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                  <div>
                                    <div className="font-medium text-sm">{account.description}</div>
                                    <div className={`text-xs ${account.type === 'payable' ? 'text-error-600' : 'text-success-600'}`}>
                                      {account.type === 'payable' ? 'A Pagar' : 'A Receber'}
                                    </div>
                                  </div>
                                  <div className={`font-bold text-sm ${account.type === 'payable' ? 'text-error-600' : 'text-success-600'}`}>
                                    R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-500 text-sm">Nenhuma conta programada para esta data</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Legenda - Compacta */}
                <div className="p-4 border-t border-neutral-200/50">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-error-100 border border-error-300 rounded"></div>
                      <span className="text-neutral-600">Contas a Pagar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-success-100 border border-success-300 rounded"></div>
                      <span className="text-neutral-600">Contas a Receber</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning-100 border border-warning-300 rounded"></div>
                      <span className="text-neutral-600">Ambos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-error-300 border border-error-400 rounded"></div>
                      <span className="text-neutral-600">Valor Alto</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saldo Projetado com Chips de Período - 1/4 da largura */}
              <div className="lg:col-span-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-b3x-lime-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-b3x-lime-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-b3x-navy-900 text-sm">Saldo Projetado</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Saldo Hoje + Entradas - Saídas
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-2xl font-bold mb-4 ${projectedBalance >= 0 ? 'text-b3x-lime-600' : 'text-error-600'}`}>
                    R$ {projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                {/* Chips de período */}
                <div className="space-y-2">
                  <p className="text-xs text-neutral-600 mb-1">Selecione o período de projeção:</p>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setProjectedDays(7)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        projectedDays === 7 
                          ? 'bg-b3x-lime-500 text-b3x-navy-900' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <span>7 dias</span>
                      <span className={projectedDays === 7 ? 'font-bold' : 'text-neutral-500'}>
                        R$ {(currentBalance + upcomingReceivables - upcomingPayables).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setProjectedDays(15)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        projectedDays === 15 
                          ? 'bg-b3x-lime-500 text-b3x-navy-900' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <span>15 dias</span>
                      <span className={projectedDays === 15 ? 'font-bold' : 'text-neutral-500'}>
                        R$ {(currentBalance + 
                          financialAccounts
                            .filter(acc => acc.type === 'receivable' && acc.status === 'pending' && isBefore(acc.dueDate, addDays(new Date(), 15)))
                            .reduce((sum, acc) => sum + acc.amount, 0) - 
                          financialAccounts
                            .filter(acc => acc.type === 'payable' && acc.status === 'pending' && isBefore(acc.dueDate, addDays(new Date(), 15)))
                            .reduce((sum, acc) => sum + acc.amount, 0)
                        ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setProjectedDays(30)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        projectedDays === 30 
                          ? 'bg-b3x-lime-500 text-b3x-navy-900' 
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <span>30 dias</span>
                      <span className={projectedDays === 30 ? 'font-bold' : 'text-neutral-500'}>
                        R$ {(currentBalance + 
                          financialAccounts
                            .filter(acc => acc.type === 'receivable' && acc.status === 'pending' && isBefore(acc.dueDate, addDays(new Date(), 30)))
                            .reduce((sum, acc) => sum + acc.amount, 0) - 
                          financialAccounts
                            .filter(acc => acc.type === 'payable' && acc.status === 'pending' && isBefore(acc.dueDate, addDays(new Date(), 30)))
                            .reduce((sum, acc) => sum + acc.amount, 0)
                        ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Aba de Próximos Vencimentos */}
      {activeTab === 'upcoming' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
          <div className="p-4 border-b border-neutral-200/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-b3x-navy-900">Próximos Vencimentos</h3>
              <p className="text-sm text-neutral-600 mt-1">Contas a pagar e receber pendentes</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-40"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="payable">A Pagar</option>
                <option value="receivable">A Receber</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
          </div>
          
          <TableWithPagination
            data={filteredUpcomingDueDates}
            columns={upcomingDueDatesColumns}
            itemsPerPage={10}
          />
        </div>
      )}

      {/* Aba de Pagamentos Liquidados */}
      {activeTab === 'settled' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
          <div className="p-4 border-b border-neutral-200/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-b3x-navy-900">Pagamentos Liquidados</h3>
              <p className="text-sm text-neutral-600 mt-1">Histórico de pagamentos realizados</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-40"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="payable">A Pagar</option>
                <option value="receivable">A Receber</option>
              </select>
              
              <button className="p-1.5 text-neutral-600 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <TableWithPagination
            data={filteredSettledPayments}
            columns={settledPaymentsColumns}
            itemsPerPage={10}
          />
        </div>
      )}
    </div>
  );
};