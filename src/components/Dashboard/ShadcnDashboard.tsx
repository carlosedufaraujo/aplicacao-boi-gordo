import React, { useState, useEffect, useMemo } from "react";
import { subDays, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSafeDate, formatSafeDateTime, formatSafeShortDate, safeDifferenceInDays, toSafeDate, formatSafeCurrency, formatSafeNumber, formatSafeDecimal, toSafeNumber, safeDivision, safeMultiplication } from '@/utils/dateUtils';
import { calculateAggregateMetrics, CattlePurchaseData } from '@/utils/cattlePurchaseCalculations';
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
  ArrowRightLeft,
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
import { useFinancialData } from '@/providers/FinancialDataProvider';
import { useInterventionsApi } from '@/hooks/api/useInterventionsApi';
import { useNavigate } from 'react-router-dom';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { toast } from 'sonner';

// Componentes de gráficos locais
import { HerdValueChart } from './HerdValueChart';
import { CostAllocationPieChart } from './CostAllocationPieChart';
import { PurchaseByStateChart } from './PurchaseByStateChart';
import { AdvancedSensitivityAnalysis } from './AdvancedSensitivityAnalysis';
import { SystemActivities } from './SystemActivities';

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
  const [activityFilter, setActivityFilter] = useState('all');
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Hooks da Nova Arquitetura API
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchasesApi();
  const { cattlePurchases: orders, loading: ordersLoading } = useCattlePurchasesApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  const { payerAccounts, loading: accountsLoading } = usePayerAccountsApi();
  const { getInterventionStatistics } = useInterventionsApi();

  // Hook para geração de PDF
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();
  
  // Provider de dados financeiros integrados
  const { metrics: financialMetrics, sales: saleRecords } = useFinancialData();

  // Estados para dados calculados
  const [totalAcquisitionCost, setTotalAcquisitionCost] = useState<number>(0);
  const [averagePurchaseCostPerArroba, setAveragePurchaseCostPerArroba] = useState<number>(0);
  const [pendingOrdersValue, setPendingOrdersValue] = useState<number>(0);
  const [confirmedAnimals, setConfirmedAnimals] = useState<number>(0);
  const [pendingAnimals, setPendingAnimals] = useState<number>(0);
  const [averageDaysConfined, setAverageDaysConfined] = useState<number>(0);
  const [mortalityCount, setMortalityCount] = useState<number>(0);
  const [mortalityRate, setMortalityRate] = useState<number>(0);
  
  // Estados para métricas financeiras integradas
  const [totalRevenues, setTotalRevenues] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netCashFlow, setNetCashFlow] = useState<number>(0);
  const [totalAccountBalance, setTotalAccountBalance] = useState<number>(0);
  const [pendingRevenues, setPendingRevenues] = useState<number>(0);
  const [pendingExpenses, setPendingExpenses] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(0);
  
  // Estados para estatísticas de intervenções
  const [interventionStats, setInterventionStats] = useState<any>(null);

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

  // Calcular dados quando os dados mudarem usando função centralizada
  useEffect(() => {
    if (cattlePurchases && cattlePurchases.length > 0) {
      // Usar a função centralizada para calcular todas as métricas
      const metrics = calculateAggregateMetrics(cattlePurchases as CattlePurchaseData[]);
      
      // Definir valores calculados - usar quantidade ATUAL (real) de animais vivos
      setConfirmedAnimals(metrics.currentAnimals);
      setTotalAcquisitionCost(metrics.totalCost);
      setAveragePurchaseCostPerArroba(metrics.averagePricePerArroba);
      
      // Calcular animais pendentes separadamente - usar quantidade atual para pendentes também
      const animalsPending = cattlePurchases
        .filter(order => order.status === 'PENDING')
        .reduce((total, order) => total + (order.currentQuantity || order.initialQuantity || order.quantity || 0), 0);
      setPendingAnimals(animalsPending);
      
      // Calcular valor das ordens pendentes
      const pendingPurchases = cattlePurchases.filter(order => order.status === 'PENDING');
      if (pendingPurchases.length > 0) {
        const pendingMetrics = calculateAggregateMetrics(pendingPurchases as CattlePurchaseData[]);
        setPendingOrdersValue(pendingMetrics.totalCost);
      } else {
        setPendingOrdersValue(0);
      }
    }

    // Calcular métricas dos lotes já são calculadas acima com calculateAggregateMetrics
    // Apenas calcular média de dias desde a primeira compra
    if (cattlePurchases && cattlePurchases.length > 0) {
      // Calcular média de dias desde a primeira compra até hoje
      const today = new Date();
      let firstPurchaseDate: Date | null = null;
      
      // Encontrar a primeira data de compra válida
      cattlePurchases.forEach(purchase => {
        const purchaseDateStr = purchase.purchaseDate || purchase.createdAt;
        if (purchaseDateStr) {
          let purchaseDate: Date;
          // Converter data no formato DD/MM/YYYY se necessário
          if (purchaseDateStr.includes('/')) {
            const [day, month, year] = purchaseDateStr.split('/');
            purchaseDate = new Date(Number(year), Number(month) - 1, Number(day));
          } else {
            purchaseDate = new Date(purchaseDateStr);
          }
          
          if (!isNaN(purchaseDate.getTime())) {
            if (!firstPurchaseDate || purchaseDate < firstPurchaseDate) {
              firstPurchaseDate = purchaseDate;
            }
          }
        }
      });
      
      // Calcular dias totais desde a primeira compra
      let avgDays = 0;
      if (firstPurchaseDate) {
        const totalDays = Math.floor((today.getTime() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        avgDays = Math.abs(totalDays);
      }
      setAverageDaysConfined(avgDays);

      // Calcular mortalidade (simulado - baseado em dados existentes)
      const totalAnimals = confirmedAnimals + pendingAnimals;
      const mortalitySimulated = Math.floor(totalAnimals * 0.02); // 2% de mortalidade simulada
      const mortalityRateCalculated = totalAnimals > 0 ? (mortalitySimulated / totalAnimals) * 100 : 0;

      setMortalityCount(mortalitySimulated);
      setMortalityRate(mortalityRateCalculated);
    }
  }, [cattlePurchases, cattlePurchases]);

  // Calcular métricas financeiras integradas
  useEffect(() => {
    if (revenues.length > 0 || expenses.length > 0 || payerAccounts.length > 0) {
      
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

      // Debug removido para limpeza de código
    }
  }, [revenues, expenses, payerAccounts]);

  // Carregar estatísticas de intervenções
  useEffect(() => {
    const loadInterventionStats = async () => {
      try {
        const stats = await getInterventionStatistics();
        setInterventionStats(stats);
      } catch (_error) {
        console.error('❌ Erro ao carregar estatísticas de intervenções:', error);
      }
    };
    
    loadInterventionStats();
  }, []); // Carrega apenas uma vez quando o componente monta
  // Loading geral
  const isLoading = lotsLoading || ordersLoading || expensesLoading || revenuesLoading || accountsLoading || partnersLoading;

  // Dados para o gráfico de Receita vs Custos - INTEGRADO COM SISTEMA REAL
  const revenueData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calcular receitas do mês (vendas + outras receitas)
      const monthSalesRevenue = (saleRecords || []).filter(s => {
        const date = toSafeDate(s.saleDate || s.createdAt);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, s) => sum + toSafeNumber(s.totalValue || s.netValue, 0), 0);
      
      const monthOtherRevenues = (revenues || []).filter(r => {
        const date = toSafeDate(r.date || r.createdAt || r.dueDate);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, r) => sum + toSafeNumber(r.amount || r.totalAmount, 0), 0);
      
      const totalRevenues = monthSalesRevenue + monthOtherRevenues;

      // Calcular custos do mês (compras + despesas)
      const monthPurchases = (cattlePurchases || []).filter(order => {
        const date = toSafeDate(order.createdAt || order.purchaseDate);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, order) => sum + toSafeNumber(order.totalValue || order.purchaseValue, 0), 0);
      
      const monthExpenses = (expenses || []).filter(e => {
        const date = toSafeDate(e.date || e.createdAt || e.dueDate);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, e) => sum + toSafeNumber(e.amount || e.totalAmount, 0), 0);

      const totalCosts = monthPurchases + monthExpenses;
      const profit = totalRevenues - totalCosts;

      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        receita: totalRevenues,
        custo: totalCosts,
        lucro: profit,
        compras: monthPurchases,
        despesas: monthExpenses,
        vendas: monthSalesRevenue,
        outrasReceitas: monthOtherRevenues
      });
    }
    
    return months;
  }, [revenues, expenses, cattlePurchases, saleRecords]);

  // Atividades recentes combinadas
  const recentActivities = useMemo(() => {
    const activities = [];

    // Adicionar ordens de compra
    (cattlePurchases || []).forEach(order => {
      const quantity = order.currentQuantity || order.initialQuantity || order.quantity || 0;
      const value = order.purchaseValue || order.totalValue || 0;
      const dateStr = order.purchaseDate || order.createdAt;
      
      if (dateStr) {
        activities.push({
          id: `order-${order.id}`,
          type: 'purchase',
          description: `Compra de ${quantity} animais - ${order.lotCode || 'N/A'}`,
          user: order.vendor?.name || order.vendorName || 'Direto',
          time: formatSafeDateTime(dateStr),
          amount: formatSafeCurrency(value),
          status: order.status || 'CONFIRMED',
          date: toSafeDate(dateStr),
        });
      }
    });

    // Adicionar despesas
    (expenses || []).forEach(expense => {
      const value = expense.totalAmount || expense.amount || expense.value || 0;
      const dateStr = expense.date || expense.dueDate || expense.createdAt;
      const description = expense.description || expense.category || 'Despesa';
      
      if (dateStr && value > 0) {
        activities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          description: description,
          user: expense.supplierName || expense.supplier?.name || 'Sistema',
          time: formatSafeDateTime(dateStr),
          amount: formatSafeCurrency(value),
          status: expense.status || 'paid',
          date: toSafeDate(dateStr),
        });
      }
    });

    // Adicionar receitas
    (revenues || []).forEach(revenue => {
      const value = revenue.amount || revenue.value || revenue.totalAmount || 0;
      const dateStr = revenue.date || revenue.receivedDate || revenue.createdAt;
      const description = revenue.description || 'Receita';
      
      if (dateStr && value > 0) {
        activities.push({
          id: `revenue-${revenue.id}`,
          type: 'sale',
          description: description,
          user: revenue.clientName || revenue.client?.name || 'Cliente',
          time: formatSafeDateTime(dateStr),
          amount: formatSafeCurrency(value),
          status: revenue.status || 'received',
          date: toSafeDate(dateStr),
        });
      }
    });

    // Ordenar por data e filtrar apenas por tipo (SEM FILTRO DE DATA)
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter(activity => {
        // Filtro de tipo
        if (activityFilter !== 'all' && activity.type !== activityFilter) {
          return false;
        }
        return true;
      })
      .slice(0, showAllActivities ? undefined : 5);
  }, [cattlePurchases, expenses, revenues, activityFilter, showAllActivities]);

  // Handler para exportar dados
  const handleExport = () => {
    const data = {
      dashboard: {
        confirmedAnimals,
        pendingAnimals,
        totalAcquisitionCost,
        averagePurchaseCostPerArroba,
        averageDaysConfined,
      },
      recentActivities,
      period: 'Todos os dados do sistema',
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
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* KPI 1: Animais Ativos */}
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Beef className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {pendingAnimals > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    +{pendingAnimals}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="kpi-value">{formatSafeNumber(confirmedAnimals)}</div>
              <p className="kpi-label">Animais Ativos</p>
            </CardContent>
          </Card>

          {/* KPI 2: Média Dias Confinados */}
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  dias
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="kpi-value">{averageDaysConfined}</div>
              <p className="kpi-label">Média Confinamento</p>
            </CardContent>
          </Card>

          {/* KPI 3: Custo Total */}
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {pendingOrdersValue > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    <TrendingUp className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="kpi-value">{formatSafeCurrency(totalAcquisitionCost)}</div>
              <p className="kpi-label">Custo Total</p>
            </CardContent>
          </Card>

          {/* KPI 4: Média R$/@ */}
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  R$/@
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="kpi-value">{formatSafeCurrency(averagePurchaseCostPerArroba)}</div>
              <p className="kpi-label">Média por Arroba</p>
            </CardContent>
          </Card>

          {/* KPI 5: Taxa de Mortalidade */}
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  {mortalityRate.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="kpi-value">{mortalityCount}</div>
              <p className="kpi-label">Mortalidade</p>
            </CardContent>
          </Card>
        </div>
        {/* Tabs com gráficos e atividades */}
        <div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="herd-value">Valor do Rebanho</TabsTrigger>
            <TabsTrigger value="sensitivity">Sensibilidade</TabsTrigger>
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
                      <CardTitle className="card-title">Receita vs Custos</CardTitle>
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
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                                <p className="font-medium text-sm mb-2">{label}</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-green-600">Receita Total:</span>
                                    <span className="font-medium">{formatSafeCurrency(data.receita)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-muted-foreground ml-2">
                                    <span>• Vendas:</span>
                                    <span>{formatSafeCurrency(data.vendas)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-muted-foreground ml-2">
                                    <span>• Outras Receitas:</span>
                                    <span>{formatSafeCurrency(data.outrasReceitas)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-red-600">Custo Total:</span>
                                    <span className="font-medium">{formatSafeCurrency(data.custo)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-muted-foreground ml-2">
                                    <span>• Compras:</span>
                                    <span>{formatSafeCurrency(data.compras)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-muted-foreground ml-2">
                                    <span>• Despesas:</span>
                                    <span>{formatSafeCurrency(data.despesas)}</span>
                                  </div>
                                  <Separator className="my-2" />
                                  <div className="flex justify-between items-center">
                                    <span className={`font-medium text-sm ${data.lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                      {data.lucro >= 0 ? 'Lucro:' : 'Prejuízo:'}
                                    </span>
                                    <span className={`font-medium text-sm ${data.lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                      {formatSafeCurrency(Math.abs(data.lucro))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
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
                    {revenueData.length > 1 && revenueData[revenueData.length - 1].lucro > revenueData[revenueData.length - 2].lucro ? (
                      <>
                        Tendência de crescimento no lucro
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </>
                    ) : (
                      <>
                        Monitorar performance financeira
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Dados integrados: vendas, compras, receitas e despesas reais dos últimos 6 meses
                  </div>
                </CardFooter>
              </Card>

              {/* Gráfico de Pizza - Atividades Operacionais */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="card-title">Atividades Operacionais</CardTitle>
                      <CardDescription>
                        Distribuição das intervenções e atividades do período
                      </CardDescription>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    protocolos: {
                      label: "Protocolos Sanitários",
                      color: "hsl(142, 76%, 36%)",
                    },
                    movimentacoes: {
                      label: "Movimentações",
                      color: "hsl(221, 83%, 53%)",
                    },
                    pesagens: {
                      label: "Pesagens",
                      color: "hsl(48, 96%, 53%)",
                    },
                    mortalidades: {
                      label: "Mortalidades",
                      color: "hsl(0, 84%, 60%)",
                    },
                  }} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Protocolos Sanitários",
                            value: interventionStats?.healthInterventions || 0,
                            fill: "hsl(142, 76%, 36%)"
                          },
                          {
                            name: "Movimentações",
                            value: interventionStats?.movements || 0,
                            fill: "hsl(221, 83%, 53%)"
                          },
                          {
                            name: "Pesagens",
                            value: interventionStats?.weightReadings || 0,
                            fill: "hsl(48, 96%, 53%)"
                          },
                          {
                            name: "Mortalidades",
                            value: interventionStats?.totalMortalities || 0,
                            fill: "hsl(0, 84%, 60%)"
                          }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[
                          { name: "Protocolos Sanitários", value: interventionStats?.healthInterventions || 0, fill: "hsl(142, 76%, 36%)" },
                          { name: "Movimentações", value: interventionStats?.movements || 0, fill: "hsl(221, 83%, 53%)" },
                          { name: "Pesagens", value: interventionStats?.weightReadings || 0, fill: "hsl(48, 96%, 53%)" },
                          { name: "Mortalidades", value: interventionStats?.totalMortalities || 0, fill: "hsl(0, 84%, 60%)" }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const total = (interventionStats?.healthInterventions || 0) + 
                                        (interventionStats?.movements || 0) + 
                                        (interventionStats?.weightReadings || 0) + 
                                        (interventionStats?.totalMortalities || 0);
                            const percentage = total > 0 ? ((data.value as number) / total * 100).toFixed(1) : '0';
                            
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-medium text-sm">{data.name}</p>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between items-center gap-4">
                                    <span>Quantidade:</span>
                                    <span className="font-medium">{data.value}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-4">
                                    <span>Percentual:</span>
                                    <span className="font-medium">{percentage}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-4 w-full text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Mortalidade:</span>
                      <span className={`font-medium ${(interventionStats?.mortalityRate || 0) > 0.02 ? 'text-destructive' : 'text-success'}`}>
                        {((interventionStats?.mortalityRate || 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso Médio:</span>
                      <span className="font-medium">
                        {formatSafeDecimal(interventionStats?.averageWeight || 0, 1)} kg
                      </span>
                    </div>
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Dados consolidados das atividades operacionais do período
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Segunda linha de gráficos */}
            <div className="grid gap-4 md:grid-cols-2">
              <CostAllocationPieChart />
              <PurchaseByStateChart />
            </div>
          </TabsContent>

          {/* Aba separada para Valor do Rebanho */}
          <TabsContent value="herd-value" className="space-y-4">
            <HerdValueChart marketPrice={marketPrice} setMarketPrice={setMarketPrice} />
          </TabsContent>

          {/* Aba separada para Análise de Sensibilidade */}
          <TabsContent value="sensitivity" className="space-y-4">
            <AdvancedSensitivityAnalysis 
              defaultValues={{
                purchasePrice: 280,
                purchaseWeight: 400,
                purchaseYield: 50,
                salePrice: marketPrice,
                saleWeight: 550,
                saleYield: 52,
                productionCost: 200
              }}
            />
          </TabsContent>

          {/* Aba de Análise agora vazia - pode adicionar outros componentes futuramente */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="card-title">Análises Adicionais</CardTitle>
                <CardDescription>
                  Esta seção estará disponível em breve com novas análises e relatórios.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Novas análises em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <SystemActivities />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ShadcnDashboard;
