import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar as CalendarIcon,
  Download,
  Upload,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Eye,
  Printer,
  Share2,
  Calculator,
  Target,
  Activity,
  Percent,
  Building2,
  Users,
  Package,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';
import { useExpensesApi } from '../../hooks/api/useExpensesApi';
import { useRevenuesApi } from '../../hooks/api/useRevenuesApi';
import { useCattlePurchasesApi } from '../../hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '../../hooks/api/useSaleRecordsApi';

interface DREItem {
  id: string;
  description: string;
  type: 'revenue' | 'expense' | 'total';
  category?: string;
  currentMonth: number;
  previousMonth: number;
  yearToDate: number;
  budget: number;
  variance: number;
  variancePercentage: number;
  children?: DREItem[];
  expanded?: boolean;
}

interface DREPeriod {
  month: number;
  year: number;
  label: string;
}

export const ModernDREWithSupabase: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [selectedComparison, setSelectedComparison] = useState<string>('previous');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['revenues', 'expenses']));
  const [showDetails, setShowDetails] = useState(true);
  const [customDateRange, setCustomDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Hooks da Nova Arquitetura API
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchasesApi();
  const { saleRecords, loading: salesLoading } = useSaleRecordsApi();

  const isLoading = expensesLoading || revenuesLoading || lotsLoading || salesLoading;

  // Função para calcular período
  const getPeriodDates = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'current':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'previous':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'quarter':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: customDateRange.from || startOfMonth(now), 
          end: customDateRange.to || endOfMonth(now) 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  // Calcular dados do DRE baseados nos dados reais
  const dreData = useMemo(() => {
    if (isLoading || !revenues || !expenses || !Array.isArray(revenues) || !Array.isArray(expenses)) {
      return [];
    }

    const currentPeriod = getPeriodDates(selectedPeriod);
    const previousPeriod = getPeriodDates('previous');

    // Filtrar receitas por período
    const currentRevenues = revenues.filter(rev => {
      const revDate = new Date(rev.date);
      return revDate >= currentPeriod.start && revDate <= currentPeriod.end;
    });

    const previousRevenues = revenues.filter(rev => {
      const revDate = new Date(rev.date);
      return revDate >= previousPeriod.start && revDate <= previousPeriod.end;
    });

    // Filtrar despesas por período
    const currentExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= currentPeriod.start && expDate <= currentPeriod.end;
    });

    const previousExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= previousPeriod.start && expDate <= previousPeriod.end;
    });

    // Calcular totais de receitas
    const currentRevenueTotal = currentRevenues.reduce((sum, rev) => sum + rev.purchaseValue, 0);
    const previousRevenueTotal = previousRevenues.reduce((sum, rev) => sum + rev.purchaseValue, 0);
    const yearToDateRevenue = revenues.reduce((sum, rev) => {
      const revDate = new Date(rev.date);
      return revDate.getFullYear() === new Date().getFullYear() ? sum + rev.purchaseValue : sum;
    }, 0);

    // Calcular totais de despesas
    const currentExpenseTotal = currentExpenses.reduce((sum, exp) => sum + exp.purchaseValue, 0);
    const previousExpenseTotal = previousExpenses.reduce((sum, exp) => sum + exp.purchaseValue, 0);
    const yearToDateExpense = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === new Date().getFullYear() ? sum + exp.purchaseValue : sum;
    }, 0);

    // Calcular variações
    const revenueVariance = currentRevenueTotal - previousRevenueTotal;
    const revenueVariancePercentage = previousRevenueTotal > 0 ? (revenueVariance / previousRevenueTotal) * 100 : 0;
    
    const expenseVariance = currentExpenseTotal - previousExpenseTotal;
    const expenseVariancePercentage = previousExpenseTotal > 0 ? (expenseVariance / previousExpenseTotal) * 100 : 0;

    // Função auxiliar para calcular percentual de variação
    const calculateVariancePercentage = (current: number, previous: number) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    };

    return [
      {
        id: 'revenues',
        description: 'RECEITAS',
        type: 'revenue' as const,
        currentMonth: currentRevenueTotal,
        previousMonth: previousRevenueTotal,
        yearToDate: yearToDateRevenue,
        budget: currentRevenueTotal * 0.95, // Estimativa de orçamento
        variance: revenueVariance,
        variancePercentage: revenueVariancePercentage,
        children: [
          {
            id: 'revenue-sales',
            description: 'Vendas de Gado',
            type: 'revenue' as const,
            category: 'operational',
            currentMonth: currentRevenues.filter(r => r.category === 'cattle_sales').reduce((sum, r) => sum + r.purchaseValue, 0),
            previousMonth: previousRevenues.filter(r => r.category === 'cattle_sales').reduce((sum, r) => sum + r.purchaseValue, 0),
            yearToDate: revenues.filter(r => r.category === 'cattle_sales' && new Date(r.date).getFullYear() === new Date().getFullYear()).reduce((sum, r) => sum + r.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: calculateVariancePercentage(
              currentRevenues.filter(r => r.category === 'cattle_sales').reduce((sum, r) => sum + r.purchaseValue, 0),
              previousRevenues.filter(r => r.category === 'cattle_sales').reduce((sum, r) => sum + r.purchaseValue, 0)
            )
          },
          {
            id: 'revenue-services',
            description: 'Serviços e Arrendamentos',
            type: 'revenue' as const,
            category: 'operational',
            currentMonth: currentRevenues.filter(r => r.category === 'services').reduce((sum, r) => sum + r.purchaseValue, 0),
            previousMonth: previousRevenues.filter(r => r.category === 'services').reduce((sum, r) => sum + r.purchaseValue, 0),
            yearToDate: revenues.filter(r => r.category === 'services' && new Date(r.date).getFullYear() === new Date().getFullYear()).reduce((sum, r) => sum + r.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: calculateVariancePercentage(
              currentRevenues.filter(r => r.category === 'services').reduce((sum, r) => sum + r.purchaseValue, 0),
              previousRevenues.filter(r => r.category === 'services').reduce((sum, r) => sum + r.purchaseValue, 0)
            )
          },
          {
            id: 'revenue-other',
            description: 'Outras Receitas',
            type: 'revenue' as const,
            category: 'non-operational',
            currentMonth: currentRevenues.filter(r => !['cattle_sales', 'services'].includes(r.category)).reduce((sum, r) => sum + r.purchaseValue, 0),
            previousMonth: previousRevenues.filter(r => !['cattle_sales', 'services'].includes(r.category)).reduce((sum, r) => sum + r.purchaseValue, 0),
            yearToDate: revenues.filter(r => !['cattle_sales', 'services'].includes(r.category) && new Date(r.date).getFullYear() === new Date().getFullYear()).reduce((sum, r) => sum + r.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: calculateVariancePercentage(
              currentRevenues.filter(r => !['cattle_sales', 'services'].includes(r.category)).reduce((sum, r) => sum + r.purchaseValue, 0),
              previousRevenues.filter(r => !['cattle_sales', 'services'].includes(r.category)).reduce((sum, r) => sum + r.purchaseValue, 0)
            )
          }
        ]
      },
      {
        id: 'expenses',
        description: 'DESPESAS',
        type: 'expense' as const,
        currentMonth: -currentExpenseTotal,
        previousMonth: -previousExpenseTotal,
        yearToDate: -yearToDateExpense,
        budget: -currentExpenseTotal * 1.05, // Estimativa de orçamento
        variance: -expenseVariance,
        variancePercentage: -expenseVariancePercentage,
        children: [
          {
            id: 'expense-purchase',
            description: 'Compra de Gado',
            type: 'expense' as const,
            category: 'operational',
            currentMonth: -currentExpenses.filter(e => e.category === 'cattle_purchase').reduce((sum, e) => sum + e.purchaseValue, 0),
            previousMonth: -previousExpenses.filter(e => e.category === 'cattle_purchase').reduce((sum, e) => sum + e.purchaseValue, 0),
            yearToDate: -expenses.filter(e => e.category === 'cattle_purchase' && new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((sum, e) => sum + e.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: -calculateVariancePercentage(
              currentExpenses.filter(e => e.category === 'cattle_purchase').reduce((sum, e) => sum + e.purchaseValue, 0),
              previousExpenses.filter(e => e.category === 'cattle_purchase').reduce((sum, e) => sum + e.purchaseValue, 0)
            )
          },
          {
            id: 'expense-feed',
            description: 'Alimentação e Nutrição',
            type: 'expense' as const,
            category: 'operational',
            currentMonth: -currentExpenses.filter(e => e.category === 'feed').reduce((sum, e) => sum + e.purchaseValue, 0),
            previousMonth: -previousExpenses.filter(e => e.category === 'feed').reduce((sum, e) => sum + e.purchaseValue, 0),
            yearToDate: -expenses.filter(e => e.category === 'feed' && new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((sum, e) => sum + e.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: -calculateVariancePercentage(
              currentExpenses.filter(e => e.category === 'feed').reduce((sum, e) => sum + e.purchaseValue, 0),
              previousExpenses.filter(e => e.category === 'feed').reduce((sum, e) => sum + e.purchaseValue, 0)
            )
          },
          {
            id: 'expense-health',
            description: 'Saúde e Veterinária',
            type: 'expense' as const,
            category: 'operational',
            currentMonth: -currentExpenses.filter(e => e.category === 'health').reduce((sum, e) => sum + e.purchaseValue, 0),
            previousMonth: -previousExpenses.filter(e => e.category === 'health').reduce((sum, e) => sum + e.purchaseValue, 0),
            yearToDate: -expenses.filter(e => e.category === 'health' && new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((sum, e) => sum + e.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: -calculateVariancePercentage(
              currentExpenses.filter(e => e.category === 'health').reduce((sum, e) => sum + e.purchaseValue, 0),
              previousExpenses.filter(e => e.category === 'health').reduce((sum, e) => sum + e.purchaseValue, 0)
            )
          },
          {
            id: 'expense-labor',
            description: 'Mão de Obra',
            type: 'expense' as const,
            category: 'operational',
            currentMonth: -currentExpenses.filter(e => e.category === 'personnel').reduce((sum, e) => sum + e.purchaseValue, 0),
            previousMonth: -previousExpenses.filter(e => e.category === 'personnel').reduce((sum, e) => sum + e.purchaseValue, 0),
            yearToDate: -expenses.filter(e => e.category === 'personnel' && new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((sum, e) => sum + e.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: -calculateVariancePercentage(
              currentExpenses.filter(e => e.category === 'personnel').reduce((sum, e) => sum + e.purchaseValue, 0),
              previousExpenses.filter(e => e.category === 'personnel').reduce((sum, e) => sum + e.purchaseValue, 0)
            )
          },
          {
            id: 'expense-admin',
            description: 'Despesas Administrativas',
            type: 'expense' as const,
            category: 'administrative',
            currentMonth: -currentExpenses.filter(e => ['general_admin', 'office', 'admin_other'].includes(e.category)).reduce((sum, e) => sum + e.purchaseValue, 0),
            previousMonth: -previousExpenses.filter(e => ['general_admin', 'office', 'admin_other'].includes(e.category)).reduce((sum, e) => sum + e.purchaseValue, 0),
            yearToDate: -expenses.filter(e => ['general_admin', 'office', 'admin_other'].includes(e.category) && new Date(e.date).getFullYear() === new Date().getFullYear()).reduce((sum, e) => sum + e.purchaseValue, 0),
            budget: 0,
            variance: 0,
            variancePercentage: -calculateVariancePercentage(
              currentExpenses.filter(e => ['general_admin', 'office', 'admin_other'].includes(e.category)).reduce((sum, e) => sum + e.purchaseValue, 0),
              previousExpenses.filter(e => ['general_admin', 'office', 'admin_other'].includes(e.category)).reduce((sum, e) => sum + e.purchaseValue, 0)
            )
          }
        ]
      }
    ];
  }, [expenses, revenues, selectedPeriod, customDateRange, isLoading]);

  // Calcular totais
  const totals = useMemo(() => {
    if (!dreData || !Array.isArray(dreData) || dreData.length === 0) {
      return {
        grossProfit: { currentMonth: 0, previousMonth: 0, yearToDate: 0, budget: 0 },
        grossMargin: { current: 0, previous: 0 },
        ebitda: { currentMonth: 0, previousMonth: 0, yearToDate: 0, budget: 0 }
      };
    }

    const revenues = dreData.find(d => d.id === 'revenues');
    const expenses = dreData.find(d => d.id === 'expenses');
    
    return {
      grossProfit: {
        currentMonth: (revenues?.currentMonth || 0) + (expenses?.currentMonth || 0),
        previousMonth: (revenues?.previousMonth || 0) + (expenses?.previousMonth || 0),
        yearToDate: (revenues?.yearToDate || 0) + (expenses?.yearToDate || 0),
        budget: (revenues?.budget || 0) + (expenses?.budget || 0)
      },
      grossMargin: {
        current: revenues?.currentMonth ? ((revenues.currentMonth + (expenses?.currentMonth || 0)) / revenues.currentMonth) * 100 : 0,
        previous: revenues?.previousMonth ? ((revenues.previousMonth + (expenses?.previousMonth || 0)) / revenues.previousMonth) * 100 : 0
      },
      ebitda: {
        currentMonth: (revenues?.currentMonth || 0) + (expenses?.currentMonth || 0),
        previousMonth: (revenues?.previousMonth || 0) + (expenses?.previousMonth || 0),
        yearToDate: (revenues?.yearToDate || 0) + (expenses?.yearToDate || 0),
        budget: (revenues?.budget || 0) + (expenses?.budget || 0)
      }
    };
  }, [dreData]);

  // Dados para gráficos baseados nos dados reais
  const monthlyTrend = useMemo(() => {
    if (isLoading) return [];

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRevenues = revenues.filter(r => {
        const rDate = new Date(r.date);
        return rDate >= monthStart && rDate <= monthEnd;
      }).reduce((sum, r) => sum + r.purchaseValue, 0);

      const monthExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= monthStart && eDate <= monthEnd;
      }).reduce((sum, e) => sum + e.purchaseValue, 0);

      last6Months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        receita: monthRevenues,
        despesa: -monthExpenses,
        lucro: monthRevenues - monthExpenses
      });
    }

    return last6Months;
  }, [revenues, expenses, isLoading]);

  const expenseBreakdown = useMemo(() => {
    if (isLoading || !dreData || !Array.isArray(dreData) || dreData.length === 0) return [];

    const expensesData = dreData.find(d => d.id === 'expenses');
    if (!expensesData?.children) return [];

    const total = Math.abs(expensesData.currentMonth);
    
    return expensesData.children.map((expense, index) => ({
      name: expense.description,
      value: Math.abs(expense.currentMonth),
      percentage: total > 0 ? (Math.abs(expense.currentMonth) / total) * 100 : 0,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'][index % 6]
    }));
  }, [dreData, isLoading]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(Math.abs(value));
  };

  const renderDRERow = (item: DREItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isTotal = item.type === 'total' || !item.category;
    
    return (
      <React.Fragment key={item.id}>
        <TableRow className={cn(
          isTotal && "font-semibold bg-muted/50",
          level > 0 && "hover:bg-muted/30"
        )}>
          <TableCell className={cn("sticky left-0 bg-background", level > 0 && "pl-8")}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              )}
              <span className={cn(isTotal && "font-semibold")}>{item.description}</span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <span className={cn(
              item.type === 'expense' && "text-red-600",
              item.type === 'revenue' && "text-green-600"
            )}>
              {formatCurrency(item.currentMonth)}
            </span>
          </TableCell>
          <TableCell className="text-right text-muted-foreground">
            {formatCurrency(item.previousMonth)}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              {item.variancePercentage !== 0 && (
                item.variancePercentage > 0 
                  ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                  : <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                item.variancePercentage > 0 && "text-green-600",
                item.variancePercentage < 0 && "text-red-600"
              )}>
                {Math.abs(item.variancePercentage).toFixed(1)}%
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            {formatCurrency(item.yearToDate)}
          </TableCell>
          <TableCell className="text-right text-muted-foreground">
            {formatCurrency(item.budget)}
          </TableCell>
          <TableCell className="text-right">
            <Badge variant={item.variance >= 0 ? "default" : "destructive"} className="font-mono">
              {formatCurrency(item.variance)}
            </Badge>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && showDetails && item.children?.map(child => renderDRERow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do DRE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Demonstração do Resultado (DRE)</h1>
          <p className="text-muted-foreground">Análise detalhada de receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-green-600">
              {dreData.length > 0 ? formatCurrency(dreData[0].currentMonth) : 'R$ 0,00'}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {dreData.length > 0 && dreData[0].variancePercentage > 0 && (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+{dreData[0].variancePercentage.toFixed(1)}%</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </>
              )}
              {dreData.length > 0 && dreData[0].variancePercentage < 0 && (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{dreData[0].variancePercentage.toFixed(1)}%</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-red-600">
              {dreData.length > 1 ? formatCurrency(dreData[1].currentMonth) : 'R$ 0,00'}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {dreData.length > 1 && dreData[1].variancePercentage < 0 && (
                <>
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">+{Math.abs(dreData[1].variancePercentage).toFixed(1)}%</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              {formatCurrency(totals.grossProfit.currentMonth)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {totals.grossProfit.currentMonth > totals.grossProfit.previousMonth ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">
                    +{totals.grossProfit.previousMonth > 0 ? (((totals.grossProfit.currentMonth - totals.grossProfit.previousMonth) / totals.grossProfit.previousMonth) * 100).toFixed(1) : '0'}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">
                    {totals.grossProfit.previousMonth > 0 ? (((totals.grossProfit.currentMonth - totals.grossProfit.previousMonth) / totals.grossProfit.previousMonth) * 100).toFixed(1) : '0'}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              {totals.grossMargin.current.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              {totals.grossMargin.current > totals.grossMargin.previous ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+{(totals.grossMargin.current - totals.grossMargin.previous).toFixed(1)}pp</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{(totals.grossMargin.current - totals.grossMargin.previous).toFixed(1)}pp</span>
                </>
              )}
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Período e Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês Atual</SelectItem>
                <SelectItem value="previous">Mês Anterior</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Ano Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedComparison} onValueChange={setSelectedComparison}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">Período Anterior</SelectItem>
                <SelectItem value="year">Mesmo Período Ano Anterior</SelectItem>
                <SelectItem value="budget">Orçamento</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`
                      : 'Selecione o período'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDateRange.from || undefined}
                    onSelect={(date) => setCustomDateRange({ ...customDateRange, from: date || null })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="show-details">Mostrar detalhes</Label>
              <input
                type="checkbox"
                id="show-details"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="statement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="statement">Demonstrativo</TabsTrigger>
          <TabsTrigger value="analysis">Análise Gráfica</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          <TabsTrigger value="indicators">Indicadores</TabsTrigger>
        </TabsList>

        {/* Tab Demonstrativo */}
        <TabsContent value="statement">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração do Resultado</CardTitle>
              <CardDescription>
                Período: {format(getPeriodDates(selectedPeriod).start, 'MMMM yyyy', { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background min-w-[250px]">Descrição</TableHead>
                      <TableHead className="text-right">Mês Atual</TableHead>
                      <TableHead className="text-right">Mês Anterior</TableHead>
                      <TableHead className="text-right">Var %</TableHead>
                      <TableHead className="text-right">Acumulado Ano</TableHead>
                      <TableHead className="text-right">Orçamento</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreData.map(item => renderDRERow(item))}
                    
                    {/* Linha de Lucro Bruto */}
                    <TableRow className="font-bold bg-muted">
                      <TableCell className="sticky left-0 bg-muted">LUCRO BRUTO</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          totals.grossProfit.currentMonth >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(totals.grossProfit.currentMonth)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.previousMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {totals.grossProfit.currentMonth > totals.grossProfit.previousMonth ? (
                            <>
                              <ArrowUpRight className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">
                                +{totals.grossProfit.previousMonth > 0 ? (((totals.grossProfit.currentMonth - totals.grossProfit.previousMonth) / totals.grossProfit.previousMonth) * 100).toFixed(1) : '0'}%
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3 text-red-500" />
                              <span className="text-red-600">
                                {totals.grossProfit.previousMonth > 0 ? (((totals.grossProfit.currentMonth - totals.grossProfit.previousMonth) / totals.grossProfit.previousMonth) * 100).toFixed(1) : '0'}%
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.yearToDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={totals.grossProfit.currentMonth - totals.grossProfit.budget >= 0 ? "default" : "destructive"} className="font-mono">
                          {formatCurrency(totals.grossProfit.currentMonth - totals.grossProfit.budget)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Análise Gráfica */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Receitas, Despesas e Lucro</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receita" fill="#10b981" name="Receita" />
                    <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                    <Line type="monotone" dataKey="lucro" stroke="#3b82f6" name="Lucro" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Composição de Despesas</CardTitle>
                <CardDescription>Principais categorias de gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((expense) => (
                    <div key={expense.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{expense.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(expense.value)} ({expense.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress 
                        value={expense.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Margem de Lucro</CardTitle>
                <CardDescription>Evolução da margem líquida</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrend.map(m => ({
                    ...m,
                    margem: m.receita > 0 ? (m.lucro / m.receita * 100) : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Area 
                      type="monotone" 
                      dataKey="margem" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.3}
                      name="Margem %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Realizado vs Orçado</CardTitle>
                <CardDescription>Comparativo com o orçamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      categoria: 'Receitas', 
                      realizado: dreData.length > 0 ? dreData[0].currentMonth : 0, 
                      orcado: dreData.length > 0 ? dreData[0].budget : 0 
                    },
                    { 
                      categoria: 'Despesas', 
                      realizado: dreData.length > 1 ? Math.abs(dreData[1].currentMonth) : 0, 
                      orcado: dreData.length > 1 ? Math.abs(dreData[1].budget) : 0 
                    },
                    { 
                      categoria: 'Lucro', 
                      realizado: totals.grossProfit.currentMonth, 
                      orcado: totals.grossProfit.budget 
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="realizado" fill="#10b981" name="Realizado" />
                    <Bar dataKey="orcado" fill="#94a3b8" name="Orçado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Comparativo */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa</CardTitle>
              <CardDescription>Comparação entre períodos</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Valores positivos indicam aumento em relação ao período de comparação
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-6">
                {/* Comparativo de Receitas */}
                {dreData.length > 0 && dreData[0].children && (
                  <div>
                    <h3 className="font-semibold mb-3">Receitas</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Atual</TableHead>
                          <TableHead className="text-right">Anterior</TableHead>
                          <TableHead className="text-right">Variação R$</TableHead>
                          <TableHead className="text-right">Variação %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dreData[0].children.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.currentMonth)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.previousMonth)}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                item.currentMonth - item.previousMonth > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(item.currentMonth - item.previousMonth)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={item.variancePercentage > 0 ? "default" : "destructive"}>
                                {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Comparativo de Despesas */}
                {dreData.length > 1 && dreData[1].children && (
                  <div>
                    <h3 className="font-semibold mb-3">Despesas</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Atual</TableHead>
                          <TableHead className="text-right">Anterior</TableHead>
                          <TableHead className="text-right">Variação R$</TableHead>
                          <TableHead className="text-right">Variação %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dreData[1].children.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.currentMonth)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.previousMonth)}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                Math.abs(item.currentMonth) - Math.abs(item.previousMonth) > 0 ? "text-red-600" : "text-green-600"
                              )}>
                                {formatCurrency(Math.abs(item.currentMonth) - Math.abs(item.previousMonth))}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={item.variancePercentage < 0 ? "destructive" : "default"}>
                                {item.variancePercentage > 0 ? '+' : ''}{Math.abs(item.variancePercentage).toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Indicadores */}
        <TabsContent value="indicators" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Rentabilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margem Bruta</p>
                    <p className="kpi-value">{totals.grossMargin.current.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margem EBITDA</p>
                    <p className="kpi-value">{totals.grossMargin.current.toFixed(1)}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="kpi-value">
                      {dreData.length > 1 && Math.abs(dreData[1].currentMonth) > 0 
                        ? ((totals.grossProfit.currentMonth / Math.abs(dreData[1].currentMonth)) * 100).toFixed(1)
                        : '0'
                      }%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores Operacionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Custo/Cabeça</p>
                    <p className="kpi-value">
                      {cattlePurchases && cattlePurchases.length > 0 
                        ? formatCurrency((dreData.length > 1 ? Math.abs(dreData[1].currentMonth) : 0) / cattlePurchases.reduce((sum, lot) => sum + lot.entryQuantity, 0))
                        : 'R$ 0'
                      }
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Receita/Cabeça</p>
                    <p className="kpi-value">
                      {cattlePurchases && cattlePurchases.length > 0 
                        ? formatCurrency((dreData.length > 0 ? dreData[0].currentMonth : 0) / cattlePurchases.reduce((sum, lot) => sum + lot.entryQuantity, 0))
                        : 'R$ 0'
                      }
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lucro/Cabeça</p>
                    <p className="kpi-value">
                      {cattlePurchases && cattlePurchases.length > 0 
                        ? formatCurrency(totals.grossProfit.currentMonth / cattlePurchases.reduce((sum, lot) => sum + lot.entryQuantity, 0))
                        : 'R$ 0'
                      }
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas e Realização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Receita</span>
                    <span className="text-sm text-muted-foreground">
                      {dreData.length > 0 && dreData[0].budget > 0 
                        ? ((dreData[0].currentMonth / dreData[0].budget) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                  <Progress 
                    value={dreData.length > 0 && dreData[0].budget > 0 
                      ? (dreData[0].currentMonth / dreData[0].budget) * 100
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Despesas</span>
                    <span className="text-sm text-muted-foreground">
                      {dreData.length > 1 && dreData[1].budget < 0 
                        ? ((Math.abs(dreData[1].currentMonth) / Math.abs(dreData[1].budget)) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                  <Progress 
                    value={dreData.length > 1 && dreData[1].budget < 0 
                      ? (Math.abs(dreData[1].currentMonth) / Math.abs(dreData[1].budget)) * 100
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Lucro</span>
                    <span className="text-sm text-muted-foreground">
                      {totals.grossProfit.budget > 0 
                        ? ((totals.grossProfit.currentMonth / totals.grossProfit.budget) * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                  </div>
                  <Progress 
                    value={totals.grossProfit.budget > 0 
                      ? (totals.grossProfit.currentMonth / totals.grossProfit.budget) * 100
                      : 0
                    } 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Sistema integrado com dados reais do Supabase - Análise baseada em informações atualizadas
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};
