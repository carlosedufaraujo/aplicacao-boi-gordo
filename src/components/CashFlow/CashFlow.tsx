import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download,
  Plus,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashFlowForm } from './CashFlowForm';
import { CashFlowChart } from './CashFlowChart';
import { TableWithPagination } from '../Common/TableWithPagination';

interface CashFlowMovement {
  id: string;
  date: Date;
  description: string;
  category: string;
  type: 'entrada' | 'saida';
  amount: number;
  status: string;
  relatedEntity?: string;
}

export const CashFlow: React.FC = () => {
  const { 
    cashFlowEntries,
    expenses,
    saleRecords,
    financialContributions,
    purchaseOrders,
    partners
  } = useAppStore();

  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');

  // Calcular período baseado na seleção
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'day':
        return { start: today, end: today };
      case 'week':
        return { start: subDays(today, 7), end: today };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'year':
        return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  }, [selectedPeriod]);

  // Consolidar todas as movimentações
  const allMovements = useMemo(() => {
    const movements: CashFlowMovement[] = [];

    // Entradas do fluxo de caixa
    cashFlowEntries.forEach(entry => {
      if (entry.type === 'receita' || entry.type === 'aporte' || entry.type === 'financiamento') {
        movements.push({
          id: entry.id,
          date: entry.date,
          description: entry.description,
          category: entry.category,
          type: 'entrada' as const,
          amount: entry.actualAmount || entry.plannedAmount,
          status: entry.status,
          relatedEntity: entry.relatedEntityType
        });
      }
    });

    // Vendas
    saleRecords.forEach(sale => {
      movements.push({
        id: sale.id,
        date: sale.saleDate,
        description: `Venda Lote ${sale.lotId}`,
        category: 'vendas',
        type: 'entrada' as const,
        amount: sale.grossRevenue, // Usar grossRevenue ao invés de netRevenue
        status: 'confirmado',
        relatedEntity: 'sale_record'
      });
    });

    // Aportes e contribuições
    financialContributions.forEach(contrib => {
      if (contrib.status === 'confirmado') {
        movements.push({
          id: contrib.id,
          date: contrib.date,
          description: `${contrib.type === 'aporte_socio' ? 'Aporte' : 'Financiamento'} - ${contrib.contributorName}`,
          category: 'aportes',
          type: 'entrada' as const,
          amount: contrib.amount,
          status: 'confirmado',
          relatedEntity: 'contribution'
        });
      }
    });

    // Despesas (apenas as que impactam o caixa)
    expenses
      .filter(expense => expense.impactsCashFlow !== false) // Filtrar apenas despesas que impactam o caixa
      .forEach(expense => {
        movements.push({
          id: expense.id,
          date: expense.date,
          description: expense.description,
          category: expense.category,
          type: 'saida' as const,
          amount: expense.totalAmount,
          status: expense.paymentStatus,
          relatedEntity: 'expense'
        });
      });

    // Compras (ordens de compra pagas)
    purchaseOrders.forEach(order => {
      if (order.status === 'payment_validation' || order.status === 'reception' || order.status === 'confined') {
        const totalCost = (order.totalWeight / 15) * order.pricePerArroba + order.commission + order.taxes + order.otherCosts;
        const vendor = partners.find(p => p.id === order.vendorId);
        movements.push({
          id: order.id,
          date: order.date,
          description: `Compra de ${order.quantity} animais - ${vendor?.name || 'Fornecedor'}`,
          category: 'compra_gado',
          type: 'saida' as const,
          amount: totalCost,
          status: 'confirmado',
          relatedEntity: 'purchase_order'
        });
      }
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashFlowEntries, expenses, saleRecords, financialContributions, purchaseOrders]);

  // Filtrar movimentações por período e tipo
  const filteredMovements = useMemo(() => {
    return allMovements.filter(movement => {
      const movementDate = new Date(movement.date);
      const inDateRange = isWithinInterval(movementDate, dateRange);
      const matchesType = filterType === 'all' || movement.type === filterType;
      return inDateRange && matchesType;
    });
  }, [allMovements, dateRange, filterType]);

  // Calcular totais
  const totals = useMemo(() => {
    const result = filteredMovements.reduce((acc, movement) => {
      if (movement.type === 'entrada') {
        acc.entradas += movement.amount;
      } else {
        acc.saidas += movement.amount;
      }
      return acc;
    }, { entradas: 0, saidas: 0 });

    return {
      ...result,
      saldo: result.entradas - result.saidas
    };
  }, [filteredMovements]);

  // Calcular saldo acumulado (considerando todo histórico)
  const saldoAcumulado = useMemo(() => {
    return allMovements.reduce((acc, movement) => {
      return movement.type === 'entrada' 
        ? acc + movement.amount 
        : acc - movement.amount;
    }, 0);
  }, [allMovements]);

  const handleExportCSV = () => {
    // Implementar exportação CSV
    console.log('Exportar CSV');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-b3x-navy-900">Fluxo de Caixa</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Acompanhe todas as movimentações financeiras em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCashFlowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <div className="bg-gradient-to-br from-b3x-navy-900 to-b3x-navy-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-75">Acumulado</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            R$ {saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm opacity-75">Saldo em caixa</div>
        </div>

        {/* Entradas do Período */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-success-600" />
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900 mb-1">
            R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-neutral-600">Entradas do período</div>
        </div>

        {/* Saídas do Período */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-error-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-error-600" />
            </div>
            <ArrowDownRight className="w-4 h-4 text-error-600" />
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900 mb-1">
            R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-neutral-600">Saídas do período</div>
        </div>

        {/* Resultado do Período */}
        <div className={`bg-white rounded-xl p-6 border-2 ${
          totals.saldo >= 0 ? 'border-success-300' : 'border-error-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              totals.saldo >= 0 ? 'bg-success-100' : 'bg-error-100'
            }`}>
              <Activity className={`w-6 h-6 ${
                totals.saldo >= 0 ? 'text-success-600' : 'text-error-600'
              }`} />
            </div>
            <span className={`text-sm font-medium ${
              totals.saldo >= 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              {totals.saldo >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900 mb-1">
            R$ {Math.abs(totals.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-neutral-600">Resultado do período</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filtros:</span>
            
            {/* Período */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="day">Hoje</option>
              <option value="week">Última Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>

            {/* Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>

          <div className="text-sm text-neutral-600">
            {filteredMovements.length} movimentações encontradas
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <CashFlowChart 
        movements={filteredMovements}
        period={selectedPeriod}
      />

      {/* Tabela de Movimentações */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-b3x-navy-900">
            Movimentações Detalhadas
          </h3>
        </div>
        
        <TableWithPagination
          data={filteredMovements}
          columns={[
            {
              key: 'date',
              label: 'Data',
              sortable: true,
              render: (value: Date) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
            },
            {
              key: 'description',
              label: 'Descrição',
              sortable: true
            },
            {
              key: 'category',
              label: 'Categoria',
              render: (value: string) => {
                const categoryMap: Record<string, string> = {
                  vendas: 'Vendas',
                  aportes: 'Aportes',
                  financiamento: 'Financiamento',
                  compra_gado: 'Compra de Gado',
                  alimentacao: 'Alimentação',
                  sanidade: 'Sanidade',
                  outros: 'Outros'
                };
                return (
                  <span className="text-sm text-neutral-600">
                    {categoryMap[value] || value}
                  </span>
                );
              }
            },
            {
              key: 'type',
              label: 'Tipo',
              render: (value: string) => (
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  value === 'entrada' 
                    ? 'bg-success-100 text-success-700'
                    : 'bg-error-100 text-error-700'
                }`}>
                  {value === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              )
            },
            {
              key: 'amount',
              label: 'Valor',
              sortable: true,
              render: (value: number, row: any) => (
                <span className={`font-medium ${
                  row.type === 'entrada' ? 'text-success-600' : 'text-error-600'
                }`}>
                  {row.type === 'entrada' ? '+' : '-'}R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (value: string) => {
                const statusMap = {
                  confirmado: { label: 'Confirmado', color: 'success' },
                  pendente: { label: 'Pendente', color: 'warning' },
                  cancelado: { label: 'Cancelado', color: 'error' }
                };
                const status = statusMap[value as keyof typeof statusMap] || { label: value, color: 'neutral' };
                return (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${status.color}-100 text-${status.color}-700`}>
                    {status.label}
                  </span>
                );
              }
            }
          ]}
          itemsPerPage={10}
        />
      </div>

      {/* Modal de Novo Lançamento */}
      {showCashFlowForm && (
        <CashFlowForm
          isOpen={showCashFlowForm}
          onClose={() => setShowCashFlowForm(false)}
        />
      )}
    </div>
  );
}; 