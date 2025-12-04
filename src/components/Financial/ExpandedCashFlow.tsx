import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Wallet,
  Target,
  Activity,
  Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addWeeks, subMonths, subWeeks, isWithinInterval, parseISO, isSameMonth, isSameWeek, getWeekOfMonth, differenceInWeeks, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/cattlePurchaseCalculations';
import { useCashFlow } from '@/hooks/useCashFlow';
import { getCategoryById } from '@/data/defaultCategories';
import { useFinancialData } from '@/providers/FinancialDataProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StructuredCashFlowTable } from './StructuredCashFlowTable';

interface CashFlowPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
  entries: Array<{
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    status: string;
    isPaid: boolean;
  }>;
  summary: {
    totalIncome: number;
    totalExpense: number;
    paidIncome: number;
    paidExpense: number;
    pendingIncome: number;
    pendingExpense: number;
    balance: number;
    projectedBalance: number;
  };
}

// Estrutura hierárquica do fluxo de caixa
interface CashFlowCategory {
  name: string;
  type: 'header' | 'subheader' | 'item' | 'total' | 'balance';
  level: number;
  category?: string;
  isCalculated?: boolean;
}

const CASHFLOW_STRUCTURE: CashFlowCategory[] = [
  { name: 'SALDO INICIAL', type: 'balance', level: 0 },
  { name: 'ATIVIDADES OPERACIONAIS', type: 'header', level: 0 },
  { name: 'Ingressos', type: 'subheader', level: 1 },
  { name: 'Vendas à vista', type: 'item', level: 2, category: 'Venda de Gado' },
  { name: 'Vendas a prazo recebidas', type: 'item', level: 2, category: 'Venda de Gado' },
  { name: 'Outras receitas', type: 'item', level: 2, category: 'Outras Receitas' },
  { name: 'TOTAL INGRESSOS', type: 'total', level: 1, isCalculated: true },
  { name: 'Saídas', type: 'subheader', level: 1 },
  { name: 'Compra de animais', type: 'item', level: 2, category: 'Compra de Animais' },
  { name: 'Alimentação', type: 'item', level: 2, category: 'Alimentação' },
  { name: 'Medicamentos e vacinas', type: 'item', level: 2, category: 'Saúde Animal' },
  { name: 'Mão de obra', type: 'item', level: 2, category: 'Mão de Obra' },
  { name: 'Energia e combustível', type: 'item', level: 2, category: 'Energia' },
  { name: 'Manutenção', type: 'item', level: 2, category: 'Manutenção' },
  { name: 'Frete', type: 'item', level: 2, category: 'Frete' },
  { name: 'Comissão', type: 'item', level: 2, category: 'Comissão' },
  { name: 'Impostos e taxas', type: 'item', level: 2, category: 'Impostos' },
  { name: 'Outras despesas', type: 'item', level: 2, category: 'Outras Despesas' },
  { name: 'TOTAL SAÍDAS', type: 'total', level: 1, isCalculated: true },
  { name: 'SALDO OPERACIONAL', type: 'total', level: 0, isCalculated: true },
  { name: 'ATIVIDADES DE FINANCIAMENTO', type: 'header', level: 0 },
  { name: 'Empréstimos tomados', type: 'item', level: 1, category: 'Empréstimo' },
  { name: 'Pagamento de empréstimos', type: 'item', level: 1, category: 'Pagamento Empréstimo' },
  { name: 'Juros pagos', type: 'item', level: 1, category: 'Juros' },
  { name: 'SALDO FINANCIAMENTO', type: 'total', level: 0, isCalculated: true },
  { name: 'ATIVIDADES DE INVESTIMENTO', type: 'header', level: 0 },
  { name: 'Compra de equipamentos', type: 'item', level: 1, category: 'Equipamentos' },
  { name: 'Melhorias em instalações', type: 'item', level: 1, category: 'Infraestrutura' },
  { name: 'SALDO INVESTIMENTO', type: 'total', level: 0, isCalculated: true },
  { name: 'SALDO FINAL', type: 'balance', level: 0, isCalculated: true }
];

interface ExpandedCashFlowProps {
  type?: 'revenue' | 'expense';
  onNewTransaction?: () => void;
}

export function ExpandedCashFlow({ type, onNewTransaction }: ExpandedCashFlowProps = {}) {
  const { cashFlows, loading: cashFlowLoading, fetchCashFlows } = useCashFlow();
  const { purchases, sales, expenses, revenues, loading: financialLoading, refresh: refreshFinancial } = useFinancialData();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'structured'>('structured');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProjections, setShowProjections] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showIntegratedData, setShowIntegratedData] = useState(true);
  const [initialBalance, setInitialBalance] = useState<number>(0);

  const loading = cashFlowLoading || financialLoading;

  // Função para atualizar todos os dados
  const refreshAll = async () => {
    await Promise.all([
      fetchCashFlows(),
      refreshFinancial && refreshFinancial()
    ]);
  };

  // Calcular informações sobre a semana no mês
  const getWeekInfo = (date: Date) => {
    const monthStart = startOfMonth(date);
    const weekStart = startOfWeek(date, { locale: ptBR });
    const weekEnd = endOfWeek(date, { locale: ptBR });

    // Calcular número da semana no mês
    const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
    const weekNumber = Math.floor(differenceInWeeks(weekStart, firstWeekStart)) + 1;

    // Verificar se a semana pertence a múltiplos meses
    const startsInMonth = isSameMonth(weekStart, date);
    const endsInMonth = isSameMonth(weekEnd, date);
    const isPartialWeek = !startsInMonth || !endsInMonth;

    return {
      weekNumber,
      isPartialWeek,
      monthName: format(date, 'MMMM', { locale: ptBR }),
      year: format(date, 'yyyy'),
    };
  };

  // Navegar entre períodos
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'month' || viewMode === 'structured') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  // Navegar para uma semana específica do mês
  const goToWeekOfMonth = (weekNumber: number) => {
    const monthStart = startOfMonth(currentDate);
    const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
    const targetDate = addWeeks(firstWeekStart, weekNumber - 1);
    setCurrentDate(targetDate);
  };

  // Processar dados do período atual
  const currentPeriodData = useMemo((): CashFlowPeriod => {
    // Para o modo estruturado, sempre usar o mês completo
    const startDate = viewMode === 'month' || viewMode === 'structured'
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate, { locale: ptBR });

    const endDate = viewMode === 'month' || viewMode === 'structured'
      ? endOfMonth(currentDate)
      : endOfWeek(currentDate, { locale: ptBR });

    // Criar label do período com informações detalhadas
    let periodLabel = '';
    if (viewMode === 'month' || viewMode === 'structured') {
      periodLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else {
      const weekInfo = getWeekInfo(currentDate);
      periodLabel = `Semana ${weekInfo.weekNumber} de ${weekInfo.monthName} ${weekInfo.year}`;
      if (weekInfo.isPartialWeek) {
        periodLabel += ` (${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')})`;
      } else {
        periodLabel += ` - ${format(startDate, 'dd')} a ${format(endDate, 'dd/MM')}`;
      }
    }

    let allEntries: any[] = [];

    // 1. Adicionar movimentações do fluxo de caixa
    const cashFlowEntries = cashFlows
      .filter(cf => {
        // Usar data principal da movimentação (date), ou dueDate, ou paymentDate como fallback
        const dateToUse = cf.date || cf.dueDate || cf.paymentDate || cf.createdAt;
        if (!dateToUse) return false;

        const cfDate = new Date(dateToUse);
        return isWithinInterval(cfDate, { start: startDate, end: endDate });
      })
      .filter(cf => selectedCategory === 'all' || cf.categoryId === selectedCategory)
      .map(cf => {
        // Priorizar: 1. date (data principal), 2. dueDate (vencimento), 3. paymentDate (pagamento), 4. createdAt
        const dateToUse = cf.date || cf.dueDate || cf.paymentDate || cf.createdAt || new Date();

        return {
          id: cf.id,
          date: new Date(dateToUse),
          description: cf.description,
          amount: cf.amount,
          type: cf.type as 'INCOME' | 'EXPENSE',
          category: getCategoryById(cf.categoryId)?.name || cf.categoryName || 'Outros',
          status: cf.status,
          isPaid: cf.status === 'PAID' || cf.status === 'RECEIVED',
          source: 'cashflow'
        };
      });

    allEntries = [...cashFlowEntries];

    // 2. Adicionar compras de gado se showIntegratedData estiver ativo
    if (showIntegratedData && purchases && selectedCategory === 'all') {
      // Filtrar compras do período primeiro
      const purchasesInPeriod = purchases.filter(purchase => {
        if (!purchase.purchaseDate) return false;
        const purchaseDate = new Date(purchase.purchaseDate);
        return isWithinInterval(purchaseDate, { start: startDate, end: endDate });
      });

      // Adicionar as compras principais
      const purchaseEntries = purchasesInPeriod
        .filter(purchase => purchase.totalValue && purchase.totalValue > 0) // Apenas compras com valor
        .map(purchase => ({
          id: `purchase-${purchase.id}`,
          date: new Date(purchase.purchaseDate),
          description: `Compra de Gado - Lote ${purchase.lotCode || purchase.id.slice(-6)} (${purchase.quantity || 0} animais)`,
          amount: purchase.totalValue,
          type: 'EXPENSE' as const,
          category: 'Compra de Animais',
          status: purchase.paymentStatus || 'PENDING',
          isPaid: purchase.paymentStatus === 'PAID',
          source: 'purchase'
        }));

      allEntries = [...allEntries, ...purchaseEntries];

      // Adicionar despesas associadas APENAS das compras do período
      // E APENAS se não existir já uma movimentação correspondente no fluxo de caixa
      purchasesInPeriod.forEach(purchase => {
        const lotIdentifier = purchase.lotCode || purchase.id.slice(-6);

        // Verificar se já existe comissão lançada no fluxo de caixa para este lote
        const hasCommissionInCashFlow = cashFlowEntries.some(entry =>
          entry.description.toLowerCase().includes('comissão') &&
          entry.description.includes(lotIdentifier)
        );

        // Só adicionar comissão da compra se não existir no fluxo de caixa
        if (purchase.commission && purchase.commission > 0 && !hasCommissionInCashFlow) {
          allEntries.push({
            id: `commission-${purchase.id}`,
            date: new Date(purchase.purchaseDate),
            description: `Comissão - Lote ${lotIdentifier}`,
            amount: purchase.commission,
            type: 'EXPENSE' as const,
            category: 'Comissão',
            status: purchase.paymentStatus || 'PENDING',
            isPaid: purchase.paymentStatus === 'PAID',
            source: 'purchase'
          });
        }

        // Verificar se já existe frete lançado no fluxo de caixa para este lote
        const hasFreightInCashFlow = cashFlowEntries.some(entry =>
          entry.description.toLowerCase().includes('frete') &&
          entry.description.includes(lotIdentifier)
        );

        // Só adicionar frete da compra se não existir no fluxo de caixa
        if (purchase.freight && purchase.freight > 0 && !hasFreightInCashFlow) {
          allEntries.push({
            id: `freight-${purchase.id}`,
            date: new Date(purchase.purchaseDate),
            description: `Frete - Lote ${lotIdentifier}`,
            amount: purchase.freight,
            type: 'EXPENSE' as const,
            category: 'Frete',
            status: purchase.paymentStatus || 'PENDING',
            isPaid: purchase.paymentStatus === 'PAID',
            source: 'purchase'
          });
        }
      });
    }

    // 3. Adicionar vendas de gado se showIntegratedData estiver ativo
    if (showIntegratedData && sales && selectedCategory === 'all') {
      const saleEntries = sales
        .filter(sale => {
          if (!sale.saleDate) return false;
          const saleDate = new Date(sale.saleDate);
          return isWithinInterval(saleDate, { start: startDate, end: endDate });
        })
        .filter(sale => sale.totalValue && sale.totalValue > 0) // Apenas vendas com valor
        .map(sale => ({
          id: `sale-${sale.id}`,
          date: new Date(sale.saleDate),
          description: `Venda de Gado - ${sale.buyerName || 'Cliente'} (${sale.quantity || 0} animais)`,
          amount: sale.totalValue,
          type: 'INCOME' as const,
          category: 'Venda de Gado',
          status: sale.paymentStatus || 'PENDING',
          isPaid: sale.paymentStatus === 'PAID',
          source: 'sale'
        }));

      allEntries = [...allEntries, ...saleEntries];
    }

    // 4. Adicionar outras despesas operacionais se showIntegratedData estiver ativo
    if (showIntegratedData && expenses && selectedCategory === 'all') {
      const expenseEntries = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date || expense.createdAt);
          return isWithinInterval(expenseDate, { start: startDate, end: endDate });
        })
        .filter(expense => !expense.description?.includes('Compra de Gado')) // Evitar duplicação
        .filter(expense => (expense.totalAmount || expense.amount) && (expense.totalAmount || expense.amount) > 0) // Apenas despesas com valor
        .map(expense => ({
          id: `expense-${expense.id}`,
          date: new Date(expense.date || expense.dueDate || expense.createdAt),
          description: expense.description || 'Despesa operacional',
          amount: expense.totalAmount || expense.amount,
          type: 'EXPENSE' as const,
          category: expense.category || 'Outras Despesas',
          status: 'PAID',
          isPaid: true,
          source: 'expense'
        }));

      allEntries = [...allEntries, ...expenseEntries];
    }

    // 5. Adicionar receitas adicionais se showIntegratedData estiver ativo
    if (showIntegratedData && revenues && selectedCategory === 'all') {
      const revenueEntries = revenues
        .filter(revenue => {
          const revenueDate = new Date(revenue.date || revenue.createdAt);
          return isWithinInterval(revenueDate, { start: startDate, end: endDate });
        })
        .filter(revenue => !revenue.description?.includes('Venda de Gado')) // Evitar duplicação
        .filter(revenue => revenue.amount && revenue.amount > 0) // Apenas receitas com valor
        .map(revenue => ({
          id: `revenue-${revenue.id}`,
          date: new Date(revenue.date || revenue.createdAt),
          description: revenue.description || 'Receita operacional',
          amount: revenue.amount,
          type: 'INCOME' as const,
          category: revenue.category || 'Outras Receitas',
          status: 'RECEIVED',
          isPaid: true,
          source: 'revenue'
        }));

      allEntries = [...allEntries, ...revenueEntries];
    }

    // Ordenar todas as entradas por data
    const periodEntries = allEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcular sumário
    const summary = periodEntries.reduce((acc, entry) => {
      if (entry.type === 'INCOME') {
        acc.totalIncome += entry.amount;
        if (entry.isPaid) {
          acc.paidIncome += entry.amount;
        } else {
          acc.pendingIncome += entry.amount;
        }
      } else {
        acc.totalExpense += entry.amount;
        if (entry.isPaid) {
          acc.paidExpense += entry.amount;
        } else {
          acc.pendingExpense += entry.amount;
        }
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      paidIncome: 0,
      paidExpense: 0,
      pendingIncome: 0,
      pendingExpense: 0,
      balance: 0,
      projectedBalance: 0
    });

    summary.balance = summary.paidIncome - summary.paidExpense;
    summary.projectedBalance = summary.totalIncome - summary.totalExpense;

    return {
      startDate,
      endDate,
      label: periodLabel,
      entries: periodEntries,
      summary
    };
  }, [cashFlows, purchases, sales, expenses, revenues, currentDate, viewMode, selectedCategory, showIntegratedData]);

  // Obter dados históricos para comparação
  const historicalComparison = useMemo(() => {
    const prevDate = viewMode === 'month'
      ? subMonths(currentDate, 1)
      : subWeeks(currentDate, 1);

    const prevStartDate = viewMode === 'month'
      ? startOfMonth(prevDate)
      : startOfWeek(prevDate, { locale: ptBR });

    const prevEndDate = viewMode === 'month'
      ? endOfMonth(prevDate)
      : endOfWeek(prevDate, { locale: ptBR });

    const prevPeriodFlows = cashFlows.filter(cf => {
      if (!cf.dueDate) return false;
      const cfDate = new Date(cf.dueDate);
      return isWithinInterval(cfDate, { start: prevStartDate, end: prevEndDate });
    });

    const prevIncome = prevPeriodFlows
      .filter(cf => cf.type === 'INCOME' && (cf.status === 'RECEIVED'))
      .reduce((sum, cf) => sum + cf.amount, 0);

    const prevExpense = prevPeriodFlows
      .filter(cf => cf.type === 'EXPENSE' && (cf.status === 'PAID'))
      .reduce((sum, cf) => sum + cf.amount, 0);

    return {
      income: prevIncome,
      expense: prevExpense,
      balance: prevIncome - prevExpense,
      incomeChange: currentPeriodData.summary.paidIncome - prevIncome,
      expenseChange: currentPeriodData.summary.paidExpense - prevExpense
    };
  }, [cashFlows, currentDate, viewMode, currentPeriodData]);

  // Agrupar entradas por dia
  const entriesByDay = useMemo(() => {
    const grouped: Record<string, typeof currentPeriodData.entries> = {};

    currentPeriodData.entries.forEach(entry => {
      const dayKey = format(entry.date, 'yyyy-MM-dd');
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(entry);
    });

    return grouped;
  }, [currentPeriodData]);

  // Obter categorias únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    cashFlows.forEach(cf => {
      if (cf.categoryId) {
        categories.add(cf.categoryId);
      }
    });
    return Array.from(categories);
  }, [cashFlows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold capitalize">
                {currentPeriodData.label}
              </h3>

              {/* Seletor rápido de semanas quando em visualização semanal */}
              {viewMode === 'week' && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground mr-2">Ir para:</span>
                  {[1, 2, 3, 4, 5].map(week => {
                    const weekInfo = getWeekInfo(currentDate);
                    const isCurrentWeek = weekInfo.weekNumber === week;
                    return (
                      <Button
                        key={week}
                        variant={isCurrentWeek ? "default" : "outline"}
                        size="sm"
                        className="h-6 w-12 text-xs"
                        onClick={() => goToWeekOfMonth(week)}
                      >
                        S{week}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {viewMode !== 'structured' && (
              <>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {uniqueCategories.map(catId => {
                      const category = getCategoryById(catId);
                      return (
                        <SelectItem key={catId} value={catId}>
                          {category?.name || 'Outros'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProjections(!showProjections)}
                >
                  {showProjections ? <Target className="h-4 w-4 mr-2" /> : <Target className="h-4 w-4 mr-2 opacity-50" />}
                  Projeções
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIntegratedData(!showIntegratedData)}
            >
              {showIntegratedData ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Compras/Vendas
            </Button>

            {/* Botão Nova Movimentação - visível quando há callback ou quando type está definido */}
            {(onNewTransaction || type) && (
              <Button
                size="sm"
                onClick={() => {
                  if (onNewTransaction) {
                    onNewTransaction();
                  } else {
                    // Redirecionar para página de centro financeiro com formulário aberto
                    // Ou usar navegação para abrir formulário
                    window.location.hash = '#financial';
                  }
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">
                  {type === 'expense' ? 'Nova Despesa' : type === 'revenue' ? 'Nova Receita' : 'Nova Movimentação'}
                </span>
              </Button>
            )}

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week' | 'structured')}>
              <TabsList>
                <TabsTrigger value="month" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Mês
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Semana
                </TabsTrigger>
                <TabsTrigger value="structured" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Estruturado
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Cards de resumo */}
        {viewMode !== 'structured' && (
        <div className="space-y-4">
          {/* Indicador de período quando em visualização semanal */}
          {viewMode === 'week' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-semibold">
                      {getWeekInfo(currentDate).monthName} de {getWeekInfo(currentDate).year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você está visualizando a {getWeekInfo(currentDate).weekNumber}ª semana do mês
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {format(currentPeriodData.startDate, 'dd/MM')} - {format(currentPeriodData.endDate, 'dd/MM')}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Use os botões S1-S5 para navegar rapidamente entre as semanas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-5">
            {/* Saldo Atual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Realizado</CardTitle>
              </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${currentPeriodData.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(currentPeriodData.summary.balance)}
              </div>
              {historicalComparison.balance !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {historicalComparison.balance > 0 ? '+' : ''}{formatCurrency(currentPeriodData.summary.balance - historicalComparison.balance)} vs período anterior
                </p>
              )}
            </CardContent>
          </Card>

          {/* Entradas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(currentPeriodData.summary.paidIncome)}
              </div>
              {currentPeriodData.summary.pendingIncome > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{formatCurrency(currentPeriodData.summary.pendingIncome)} pendente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Saídas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
                Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(currentPeriodData.summary.paidExpense)}
              </div>
              {currentPeriodData.summary.pendingExpense > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{formatCurrency(currentPeriodData.summary.pendingExpense)} pendente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Projeção */}
          {showProjections && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Projeção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${currentPeriodData.summary.projectedBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {formatCurrency(currentPeriodData.summary.projectedBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Incluindo pendentes
                </p>
              </CardContent>
            </Card>
          )}

            {/* Taxa de Realização */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa Realização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Receitas</span>
                    <span className="text-xs font-bold text-green-600">
                      {currentPeriodData.summary.totalIncome > 0
                        ? Math.round((currentPeriodData.summary.paidIncome / currentPeriodData.summary.totalIncome) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Despesas</span>
                    <span className="text-xs font-bold text-red-600">
                      {currentPeriodData.summary.totalExpense > 0
                        ? Math.round((currentPeriodData.summary.paidExpense / currentPeriodData.summary.totalExpense) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>

      {/* Fluxo estruturado ou detalhado por dia */}
      {viewMode === 'structured' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Fluxo de Caixa Estruturado
              {isSameMonth(currentDate, new Date()) && (
                <Badge variant="default" className="ml-2">
                  Mês Atual
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Visão gerencial do fluxo de caixa por categoria de atividade - {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StructuredCashFlowTable
              data={currentPeriodData}
              currentDate={currentDate}
              initialBalance={initialBalance}
              onBalanceChange={setInitialBalance}
            />
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Detalhadas</CardTitle>
          <CardDescription>
            Fluxo de caixa diário do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(entriesByDay).length > 0 ? (
              Object.entries(entriesByDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dayKey, dayEntries]) => {
                  const dayDate = parseISO(dayKey);
                  const dayIncome = dayEntries
                    .filter(e => e.type === 'INCOME')
                    .reduce((sum, e) => sum + e.amount, 0);
                  const dayExpense = dayEntries
                    .filter(e => e.type === 'EXPENSE')
                    .reduce((sum, e) => sum + e.amount, 0);
                  const dayBalance = dayIncome - dayExpense;

                  return (
                    <div key={dayKey} className="space-y-2">
                      {/* Header do dia */}
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(dayDate, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {dayEntries.length} movimentações
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          {dayIncome > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                              +{formatCurrency(dayIncome)}
                            </span>
                          )}
                          {dayExpense > 0 && (
                            <span className="text-sm text-red-600 font-medium">
                              -{formatCurrency(dayExpense)}
                            </span>
                          )}
                          <span className={`text-sm font-bold ${dayBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            = {formatCurrency(dayBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Movimentações do dia */}
                      <div className="pl-6 space-y-1">
                        {dayEntries.map(entry => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1 rounded ${entry.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {entry.type === 'INCOME' ? (
                                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{entry.description}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {entry.category}
                                  </p>
                                  {entry.source && entry.source !== 'cashflow' && (
                                    <Badge variant="outline" className="text-xs h-4 px-1">
                                      {entry.source === 'purchase' && '🐮 Compra'}
                                      {entry.source === 'sale' && '💰 Venda'}
                                      {entry.source === 'expense' && '📊 Operacional'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={entry.isPaid ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {entry.isPaid ? 'Realizado' : 'Pendente'}
                              </Badge>
                              <span className={`text-sm font-bold ${entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma movimentação neste período</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Alertas e insights */}
      {currentPeriodData.summary.pendingExpense > currentPeriodData.summary.paidIncome && (
        <Alert className="border-orange-500">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Atenção:</strong> As despesas pendentes ({formatCurrency(currentPeriodData.summary.pendingExpense)})
            excedem as receitas realizadas ({formatCurrency(currentPeriodData.summary.paidIncome)}) neste período.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}