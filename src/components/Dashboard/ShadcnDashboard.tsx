import React, { useState, useEffect, useMemo } from "react";
import { subDays, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSafeDate, formatSafeDateTime, formatSafeShortDate, safeDifferenceInDays, toSafeDate, formatSafeCurrency, formatSafeNumber, formatSafeDecimal, toSafeNumber, safeDivision, safeMultiplication } from '@/utils/dateUtils';
import { cn } from "@/lib/utils";
import { useSettings } from '@/providers/SettingsProvider';

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar as CalendarIcon,
  MoreVertical,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Eye,
  FileText,
  FileDown,
  Beef,
  Weight,
  Heart,
  BarChart3,
  CreditCard,
  Wallet,
  Percent,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Hooks e serviços - NOVA ARQUITETURA API
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { useNavigate } from 'react-router-dom';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { toast } from 'sonner';

// Componentes de gráficos locais
import { HerdValueChart } from './HerdValueChart';
import { CostAllocationPieChart } from './CostAllocationPieChart';
import { PurchaseByStateChart } from './PurchaseByStateChart';
import { PurchaseByBrokerChart } from './PurchaseByBrokerChart';

// Componente de integração
import { FinancialIntegrationStatus } from '../Integration/FinancialIntegrationStatus';

// Tipo para o filtro de data
type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export function ShadcnDashboard() {
  const navigate = useNavigate();
  
  // Estados
  const [marketPrice, setMarketPrice] = useState<number>(320);
  const [dateFilter, setDateFilter] = useState('30');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Hooks da Nova Arquitetura API
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchasesApi();
  const { cattlePurchases: orders, loading: ordersLoading } = useCattlePurchasesApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  const { payerAccounts, loading: accountsLoading } = usePayerAccountsApi();

  // Hook para geração de PDF
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();

  // Estados para dados calculados
  const [totalAcquisitionCost, setTotalAcquisitionCost] = useState<number>(0);
  const [averagePurchaseCostPerArroba, setAveragePurchaseCostPerArroba] = useState<number>(0);
  const [pendingOrdersValue, setPendingOrdersValue] = useState<number>(0);
  const [confirmedAnimals, setConfirmedAnimals] = useState<number>(0);
  const [pendingAnimals, setPendingAnimals] = useState<number>(0);
  const [averageDaysConfined, setAverageDaysConfined] = useState<number>(0);
  const [averageWeightLoss, setAverageWeightLoss] = useState<number>(0);
  const [mortalityRate, setMortalityRate] = useState<number>(0);
  
  // Estados para métricas financeiras integradas
  const [totalRevenues, setTotalRevenues] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netCashFlow, setNetCashFlow] = useState<number>(0);
  const [totalAccountBalance, setTotalAccountBalance] = useState<number>(0);
  const [pendingRevenues, setPendingRevenues] = useState<number>(0);
  const [pendingExpenses, setPendingExpenses] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(0);

  // Função para gerar PDF do Dashboard
  const handleGenerateDashboardPDF = async () => {
    const result = await generatePDFFromElement('dashboard-content', {
      filename: `dashboard-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'landscape',
      quality: 2
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // Função para gerar relatório estruturado
  const handleGenerateStructuredReport = async () => {
    const reportData = {
      title: 'Relatório Executivo - Dashboard Integrado',
      subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')} | Dados Financeiros e Operacionais`,
      data: [
        {
          metrica: 'Lotes Ativos',
          valor: cattlePurchases?.filter(lot => lot.status === 'ACTIVE').length || 0,
          unidade: 'lotes'
        },
        {
          metrica: 'Total de Animais',
          valor: (cattlePurchases || []).reduce((sum, lot) => sum + (lot.currentQuantity || 0), 0),
          unidade: 'cabeças'
        },
        {
          metrica: 'Custo Total de Aquisição',
          valor: formatSafeCurrency(totalAcquisitionCost),
          unidade: ''
        },
        {
          metrica: 'Total de Receitas',
          valor: formatSafeCurrency(totalRevenues),
          unidade: ''
        },
        {
          metrica: 'Total de Despesas',
          valor: formatSafeCurrency(totalExpenses),
          unidade: ''
        },
        {
          metrica: 'Fluxo de Caixa Líquido',
          valor: formatSafeCurrency(netCashFlow),
          unidade: ''
        },
        {
          metrica: 'Margem de Lucro',
          valor: `${formatSafeDecimal(profitMargin, 1)}%`,
          unidade: ''
        },
        {
          metrica: 'Saldo Total das Contas',
          valor: formatSafeCurrency(totalAccountBalance),
          unidade: ''
        },
        {
          metrica: 'Receitas Pendentes',
          valor: formatSafeCurrency(pendingRevenues),
          unidade: ''
        },
        {
          metrica: 'Despesas Pendentes',
          valor: formatSafeCurrency(pendingExpenses),
          unidade: ''
        },
        {
          metrica: 'Custo Médio por Arroba',
          valor: `R$ ${formatSafeDecimal(averagePurchaseCostPerArroba, 2)}`,
          unidade: '/arroba'
        },
        {
          metrica: 'Valor Pendente (Compras)',
          valor: formatSafeCurrency(pendingOrdersValue),
          unidade: ''
        }
      ],
      columns: [
        { key: 'metrica', label: 'Métrica', width: 80 },
        { key: 'valor', label: 'Valor', width: 60 },
        { key: 'unidade', label: 'Unidade', width: 40 }
      ],
      summary: {
        'Data de Geração': formatSafeDateTime(new Date()),
        'Total de Lotes': cattlePurchases?.length || 0,
        'Total de Contas': payerAccounts.length,
        'Total de Receitas': formatSafeCurrency(totalRevenues),
        'Total de Despesas': formatSafeCurrency(totalExpenses),
        'Resultado Líquido': formatSafeCurrency(netCashFlow),
        'Margem de Lucro': `${formatSafeDecimal(profitMargin, 1)}%`,
        'Status do Sistema': 'Operacional - Integrado'
      }
    };

    const result = await generateReportPDF(reportData, {
      filename: `relatorio-executivo-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'portrait'
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // Calcular dados quando os dados mudarem
  useEffect(() => {
    if (cattlePurchases && cattlePurchases.length > 0) {
      // Calcular animais confirmados vs pendentes
      const animalsConfirmed = cattlePurchases
        .filter(order => order.status !== 'PENDING')
        .reduce((total, order) => total + order.animalCount, 0);
      
      const animalsPending = cattlePurchases
        .filter(order => order.status === 'PENDING')
        .reduce((total, order) => total + order.animalCount, 0);
      
      setConfirmedAnimals(animalsConfirmed);
      setPendingAnimals(animalsPending);
      
      // Calcular custo total de aquisição
      const acquisitionCost = cattlePurchases
        .filter(order => order.status !== 'PENDING')
        .reduce((total, order) => {
          const carcassWeight = safeMultiplication(
            toSafeNumber(order.totalWeight), 
            safeDivision(toSafeNumber(order.carcassYield), 100)
          );
          const arrobas = safeDivision(carcassWeight, 15);
          const animalValue = safeMultiplication(arrobas, toSafeNumber(order.pricePerArroba));
          const orderTotal = animalValue + toSafeNumber(order.commission) + toSafeNumber(order.otherCosts);
          return total + orderTotal;
        }, 0);
      
      setTotalAcquisitionCost(acquisitionCost);
      
      // Calcular valor das ordens pendentes
      const pendingValue = cattlePurchases
        .filter(order => order.status === 'PENDING')
        .reduce((total, order) => {
          const carcassWeight = safeMultiplication(
            toSafeNumber(order.totalWeight), 
            safeDivision(toSafeNumber(order.carcassYield), 100)
          );
          const arrobas = safeDivision(carcassWeight, 15);
          const animalValue = safeMultiplication(arrobas, toSafeNumber(order.pricePerArroba));
          const orderTotal = animalValue + toSafeNumber(order.commission) + toSafeNumber(order.otherCosts);
          return total + orderTotal;
        }, 0);
      
      setPendingOrdersValue(pendingValue);
      
      // Calcular custo médio de compra por arroba
      const totalArrobas = cattlePurchases
        .filter(order => order.status !== 'PENDING')
        .reduce((total, order) => {
          const carcassWeight = safeMultiplication(
            toSafeNumber(order.totalWeight), 
            safeDivision(toSafeNumber(order.carcassYield), 100)
          );
          const arrobas = safeDivision(carcassWeight, 15);
          return total + arrobas;
        }, 0);
      
      const avgCostPerArroba = safeDivision(acquisitionCost, totalArrobas);
      setAveragePurchaseCostPerArroba(avgCostPerArroba);
    }

    // Calcular métricas dos lotes
    if (cattlePurchases && cattlePurchases.length > 0) {
      const activeLots = cattlePurchases.filter(lot => lot.status === 'ACTIVE');
      
      if (activeLots.length > 0) {
        // Média de dias confinados
        const today = new Date();
        const totalDays = activeLots.reduce((total, lot) => {
          const days = safeDifferenceInDays(today, lot.entryDate);
          return total + days;
        }, 0);
        const avgDays = safeDivision(totalDays, activeLots.length);
        setAverageDaysConfined(Math.round(avgDays));

        // Taxa de mortalidade simulada
        const deaths = activeLots.reduce((total, lot) => {
          return total + toSafeNumber(lot.deaths, 0);
        }, 0);
        const totalAnimals = activeLots.reduce((total, lot) => total + toSafeNumber(lot.entryQuantity, 0), 0);
        const mortalityPercentage = safeMultiplication(safeDivision(deaths, totalAnimals), 100);
        setMortalityRate(mortalityPercentage);

        // Média de quebra de peso simulada
        setAverageWeightLoss(3.5); // Valor fixo para demo
      }
    }
  }, [cattlePurchases, cattlePurchases]);

  // Calcular métricas financeiras integradas
  useEffect(() => {
    if (revenues.length > 0 || expenses.length > 0 || payerAccounts.length > 0) {
      console.log('🔄 Calculando métricas financeiras integradas...');
      
      // Calcular total de receitas
      const revenuesTotal = revenues.reduce((total, revenue) => {
        return total + toSafeNumber(revenue.amount || revenue.value || revenue.purchaseValue, 0);
      }, 0);
      setTotalRevenues(revenuesTotal);
      
      // Calcular total de despesas
      const expensesTotal = expenses.reduce((total, expense) => {
        return total + toSafeNumber(expense.amount || expense.value || expense.purchaseValue, 0);
      }, 0);
      setTotalExpenses(expensesTotal);
      
      // Calcular fluxo de caixa líquido
      const cashFlow = revenuesTotal - expensesTotal;
      setNetCashFlow(cashFlow);
      
      // Calcular margem de lucro
      const margin = revenuesTotal > 0 ? (cashFlow / revenuesTotal) * 100 : 0;
      setProfitMargin(margin);
      
      // Calcular saldo total das contas
      const accountsBalance = payerAccounts.reduce((total, account) => {
        return total + toSafeNumber(account.balance, 0);
      }, 0);
      setTotalAccountBalance(accountsBalance);
      
      // Calcular receitas pendentes
      const pendingRevenuesTotal = revenues
        .filter(revenue => !revenue.isReceived && revenue.status !== 'paid')
        .reduce((total, revenue) => {
          return total + toSafeNumber(revenue.amount || revenue.value || revenue.purchaseValue, 0);
        }, 0);
      setPendingRevenues(pendingRevenuesTotal);
      
      // Calcular despesas pendentes
      const pendingExpensesTotal = expenses
        .filter(expense => expense.status === 'pending' || expense.status === 'overdue')
        .reduce((total, expense) => {
          return total + toSafeNumber(expense.amount || expense.value || expense.purchaseValue, 0);
        }, 0);
      setPendingExpenses(pendingExpensesTotal);
      
      console.log('✅ Métricas financeiras calculadas:', {
        receitas: revenuesTotal,
        despesas: expensesTotal,
        fluxoCaixa: cashFlow,
        margem: margin,
        saldoContas: accountsBalance,
        receitasPendentes: pendingRevenuesTotal,
        despesasPendentes: pendingExpensesTotal
      });
    }
  }, [revenues, expenses, payerAccounts]);

  // Atualizar período quando mudar o filtro
  useEffect(() => {
    if (!isCustomDate) {
      const days = parseInt(dateFilter);
      setCustomDateRange({
        from: subDays(new Date(), days),
        to: new Date(),
      });
    }
  }, [dateFilter, isCustomDate]);

  // Loading geral
  const isLoading = lotsLoading || ordersLoading || expensesLoading || revenuesLoading || accountsLoading || partnersLoading;

  // Dados para o gráfico de Receita vs Custos (últimos 6 meses)
  const revenueData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calcular receitas do mês
      const monthRevenues = revenues.filter(r => {
        const date = toSafeDate(r.date || r.createdAt);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, r) => sum + toSafeNumber(r.amount || r.value || r.purchaseValue, 0), 0);

      // Calcular despesas do mês
      const monthExpenses = expenses.filter(e => {
        const date = toSafeDate(e.date || e.createdAt);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, e) => sum + toSafeNumber(e.amount || e.value || e.purchaseValue, 0), 0);

      // Calcular compras do mês (ordens de compra)
      const monthPurchases = (cattlePurchases || []).filter(order => {
        const date = toSafeDate(order.createdAt || order.purchaseDate);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, order) => sum + toSafeNumber(order.totalValue, 0), 0);

      const totalCosts = monthExpenses + monthPurchases;
      const profit = monthRevenues - totalCosts;

      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        receita: monthRevenues,
        custo: totalCosts,
        lucro: profit,
        compras: monthPurchases,
        despesas: monthExpenses
      });
    }
    
    return months;
  }, [revenues, expenses, cattlePurchases]);

  // Atividades recentes combinadas
  const recentActivities = useMemo(() => {
    const activities = [];

    // Adicionar ordens de compra
    (cattlePurchases || []).slice(0, 5).forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'purchase',
        description: `Compra de ${order.animalCount} animais`,
        user: order.vendor?.name || 'Fornecedor',
        time: formatSafeDateTime(order.createdAt),
        amount: formatSafeCurrency(order.totalValue),
        status: order.status,
        date: toSafeDate(order.createdAt),
      });
    });

    // Adicionar despesas
    expenses.slice(0, 3).forEach(expense => {
      activities.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        description: expense.description,
        user: 'Sistema',
        time: formatSafeDateTime(expense.date || expense.dueDate),
        amount: formatSafeCurrency(expense.value || expense.purchaseValue || expense.totalAmount || 0),
        status: 'paid',
        date: toSafeDate(expense.date || expense.dueDate),
      });
    });

    // Adicionar receitas
    revenues.slice(0, 3).forEach(revenue => {
      activities.push({
        id: `revenue-${revenue.id}`,
        type: 'sale',
        description: revenue.description,
        user: 'Sistema',
        time: formatSafeDateTime(revenue.date || revenue.receivedDate),
        amount: formatSafeCurrency(revenue.value || revenue.totalAmount || 0),
        status: 'received',
        date: toSafeDate(revenue.date || revenue.receivedDate),
      });
    });

    // Ordenar por data e filtrar
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter(activity => {
        // Filtro de tipo
        if (activityFilter !== 'all' && activity.type !== activityFilter) {
          return false;
        }
        // Filtro de data
        if (customDateRange.from && customDateRange.to) {
          return activity.date >= customDateRange.from && activity.date <= customDateRange.to;
        }
        return true;
      })
      .slice(0, showAllActivities ? undefined : 5);
  }, [cattlePurchases, expenses, revenues, activityFilter, showAllActivities, customDateRange]);

  // Handler para exportar dados
  const handleExport = () => {
    const data = {
      dashboard: {
        confirmedAnimals,
        pendingAnimals,
        totalAcquisitionCost,
        averagePurchaseCostPerArroba,
        averageDaysConfined,
        mortalityRate,
        averageWeightLoss,
      },
      recentActivities,
      period: isCustomDate ? customDateRange : `Últimos ${dateFilter} dias`,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${formatSafeDate(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handler para ver detalhes de atividade
  const handleActivityClick = (activity: any) => {
    if (activity.type === 'purchase') {
      navigate(`/pipeline?order=${activity.id}`);
    }
  };

  // Configuração dos gráficos
  const chartConfig = {
    receita: {
      label: "Receita",
      color: "hsl(142, 76%, 36%)", // Verde
    },
    custo: {
      label: "Custo",
      color: "hsl(0, 84%, 60%)", // Vermelho
    },
    lucro: {
      label: "Lucro",
      color: "hsl(221, 83%, 53%)", // Azul
    },
  } satisfies ChartConfig;

  // Calcular variações percentuais
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div id="dashboard-content" className="flex-1 space-y-6">
        {/* Header com Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="page-title">Dashboard</h2>
            <p className="text-muted-foreground">
              Visão geral do sistema e métricas principais
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de período ou data personalizada */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {isCustomDate && customDateRange.from && customDateRange.to ? (
                    <>
                      {formatSafeShortDate(customDateRange.from)} - {formatSafeShortDate(customDateRange.to)}
                    </>
                  ) : (
                    <span>Selecionar período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  {/* Opções rápidas */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Período rápido</p>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateFilter('7');
                          setIsCustomDate(false);
                        }}
                      >
                        Últimos 7 dias
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateFilter('30');
                          setIsCustomDate(false);
                        }}
                      >
                        Últimos 30 dias
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateFilter('90');
                          setIsCustomDate(false);
                        }}
                      >
                        Últimos 90 dias
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomDateRange({
                            from: startOfMonth(new Date()),
                            to: endOfMonth(new Date()),
                          });
                          setIsCustomDate(true);
                        }}
                      >
                        Este mês
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Calendário para seleção personalizada */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Período personalizado</p>
                    <Calendar
                      mode="range"
                      selected={{
                        from: customDateRange.from,
                        to: customDateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range) {
                          setCustomDateRange({
                            from: range.from,
                            to: range.to,
                          });
                          setIsCustomDate(true);
                        }
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={handleGenerateDashboardPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF Visual
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateStructuredReport}>
              <FileText className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs Grid - Estilo moderno com cards shadcn */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* KPI 1: Animais Ativos */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Animais Ativos
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <Beef className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="kpi-value">
                  {formatSafeNumber(confirmedAnimals)}
                </p>
                {pendingAnimals > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Badge variant="secondary" className="px-1.5 py-0">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {pendingAnimals}
                    </Badge>
                    <span className="text-muted-foreground">pendentes</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Média Dias Confinados */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Média Dias
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="kpi-value">{averageDaysConfined}</p>
                <p className="text-xs text-muted-foreground">dias confinados</p>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Quebra de Peso */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Quebra Peso
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <Weight className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <p className="kpi-value">{formatSafeDecimal(averageWeightLoss, 1)}</p>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">média</p>
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Taxa de Mortalidade */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Mortalidade
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <p className="kpi-value">{formatSafeDecimal(mortalityRate, 1)}</p>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={mortalityRate < 2 ? "default" : "destructive"} className="h-5 px-1">
                    {mortalityRate < 2 ? "Baixa" : "Alta"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI 5: Custo Total */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Custo Total
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="kpi-value">
                  R$ {formatSafeDecimal(safeDivision(totalAcquisitionCost, 1000), 0)}k
                </p>
                {pendingOrdersValue > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-amber-600" />
                    <span className="text-amber-600">
                      +R$ {formatSafeDecimal(safeDivision(pendingOrdersValue, 1000), 0)}k
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPI 6: Média R$/@ */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="kpi-label">
                  Média R$/@
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="kpi-value">
                  R$ {formatSafeDecimal(averagePurchaseCostPerArroba, 0)}
                </p>
                <p className="text-xs text-muted-foreground">por arroba</p>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Tabs com gráficos e atividades */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Grid de gráficos principais */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gráfico de Receita vs Custos - Atualizado */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Receita vs Custos</CardTitle>
                      <CardDescription>
                        Comparação mensal de receitas, custos e lucro
                      </CardDescription>
                    </div>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${formatSafeDecimal(safeDivision(value, 1000), 0)}k`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReceita)"
                      />
                      <Area
                        type="monotone"
                        dataKey="custo"
                        stroke="hsl(0, 84%, 60%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCusto)"
                      />
                      <Line
                        type="monotone"
                        dataKey="lucro"
                        stroke="hsl(221, 83%, 53%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none">
                    Tendência de alta de 12.5% este mês
                    <TrendingUp className="h-4 w-4 icon-success icon-transition" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Mostrando dados dos últimos 6 meses
                  </div>
                </CardFooter>
              </Card>

              {/* Capital Alocado vs Valor de Mercado */}
              <HerdValueChart marketPrice={marketPrice} setMarketPrice={setMarketPrice} />
            </div>

            {/* Segunda linha de gráficos */}
            <div className="grid gap-4 md:grid-cols-2">
              <CostAllocationPieChart />
              <PurchaseByStateChart />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PurchaseByBrokerChart />
              
              {/* Card de métricas adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle>Indicadores de Performance</CardTitle>
                  <CardDescription>
                    Métricas de eficiência operacional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-medium">Taxa de Ocupação</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-medium">Eficiência de Conversão</span>
                      <span className="text-sm text-muted-foreground">6.2:1</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-medium">GMD Médio</span>
                      <span className="text-sm text-muted-foreground">1.4 kg/dia</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ciclo Médio</span>
                      <span className="text-sm text-muted-foreground">96 dias</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Atividades Recentes</CardTitle>
                    <CardDescription>
                      Últimas movimentações no sistema
                    </CardDescription>
                  </div>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar atividades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="purchase">Compras</SelectItem>
                      <SelectItem value="sale">Vendas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between hover:bg-muted/50 p-3 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-xs">
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {activity.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.user} • {activity.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              activity.type === 'purchase' ? 'default' :
                              activity.type === 'sale' ? 'secondary' :
                              activity.type === 'expense' ? 'destructive' :
                              'outline'
                            }
                          >
                            {activity.amount}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Gerar relatório
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma atividade encontrada no período selecionado</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {recentActivities.length > 0 && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                  >
                    {showAllActivities ? 'Ver menos' : 'Ver todas as atividades'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}