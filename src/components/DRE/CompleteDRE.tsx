import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  FileDown,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Hooks da Nova Arquitetura API
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

// Interfaces
interface DREItem {
  id: string;
  description: string;
  type: 'revenue' | 'expense';
  category?: string;
  currentMonth: number;
  previousMonth: number;
  yearToDate: number;
  budget?: number;
  variance?: number;
  variancePercentage?: number;
  children?: DREItem[];
}

interface DREFilters {
  period: string;
  comparison: string;
  includeProjections: boolean;
  pricePerArroba: number;
}

// Componente de Item do DRE
const DREItemRow: React.FC<{ 
  item: DREItem; 
  level: number; 
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  showComparison: boolean;
}> = ({ item, level, expandedItems, onToggleExpand, showComparison }) => {
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const indentClass = level === 0 ? '' : level === 1 ? 'pl-6' : 'pl-12';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getVarianceColor = (variance?: number) => {
    if (!variance) return 'text-gray-500';
    return variance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVarianceIcon = (variance?: number) => {
    if (!variance) return null;
    return variance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <>
      <div className={`flex items-center justify-between py-3 px-4 hover:bg-muted/50 ${indentClass} ${level === 0 ? 'border-b font-semibold' : ''}`}>
        <div className="flex items-center space-x-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(item.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}
          <span className={level === 0 ? 'text-lg font-bold' : level === 1 ? 'font-medium' : 'text-sm'}>
            {item.description}
          </span>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <div className={`${level === 0 ? 'text-lg font-bold' : 'text-sm'} ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(item.currentMonth)}
            </div>
          </div>
          
          {showComparison && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {formatCurrency(item.previousMonth)}
              </div>
            </div>
          )}
          
          <div className="text-right">
            <div className={`${level === 0 ? 'text-lg font-bold' : 'text-sm'} ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(item.yearToDate)}
            </div>
          </div>
          
          {item.variance !== undefined && (
            <div className={`text-right flex items-center space-x-1 ${getVarianceColor(item.variance)}`}>
              {getVarianceIcon(item.variance)}
              <span className="text-sm">
                {formatCurrency(Math.abs(item.variance))}
              </span>
              {item.variancePercentage !== undefined && (
                <span className="text-xs">
                  ({item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && item.children?.map((child) => (
        <DREItemRow
          key={child.id}
          item={child}
          level={level + 1}
          expandedItems={expandedItems}
          onToggleExpand={onToggleExpand}
          showComparison={showComparison}
        />
      ))}
    </>
  );
};

export const CompleteDRE: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedComparison, setSelectedComparison] = useState('previous');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['revenues', 'expenses']));
  const [showDetails, setShowDetails] = useState(true);
  const [filters, setFilters] = useState<DREFilters>({
    period: 'current',
    comparison: 'previous',
    includeProjections: false,
    pricePerArroba: 300
  });

  // Hooks da Nova Arquitetura API
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchasesApi();
  const { saleRecords, loading: salesLoading } = useSaleRecordsApi();
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();

  // Calcular períodos
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const previousMonthStart = startOfMonth(subMonths(currentDate, 1));
  const previousMonthEnd = endOfMonth(subMonths(currentDate, 1));
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);

  // Função para filtrar dados por período
  const filterByPeriod = (data: any[], dateField: string, start: Date, end: Date) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Calcular receitas por categoria
  const revenuesByCategory = useMemo(() => {
    const currentMonthRevenues = filterByPeriod(revenues, 'dueDate', currentMonthStart, currentMonthEnd);
    const previousMonthRevenues = filterByPeriod(revenues, 'dueDate', previousMonthStart, previousMonthEnd);
    const yearToDateRevenues = filterByPeriod(revenues, 'dueDate', yearStart, yearEnd);

    const categories = [...new Set(revenues.map(r => r.category))];
    
    return categories.map(category => {
      const currentMonth = currentMonthRevenues
        .filter(r => r.category === category)
        .reduce((sum, r) => sum + r.purchaseValue, 0);
      
      const previousMonth = previousMonthRevenues
        .filter(r => r.category === category)
        .reduce((sum, r) => sum + r.purchaseValue, 0);
      
      const yearToDate = yearToDateRevenues
        .filter(r => r.category === category)
        .reduce((sum, r) => sum + r.purchaseValue, 0);

      const variance = currentMonth - previousMonth;
      const variancePercentage = previousMonth > 0 ? (variance / previousMonth) * 100 : 0;

      return {
        id: `revenue-${category.toLowerCase().replace(/\s+/g, '-')}`,
        description: category,
        type: 'revenue' as const,
        category,
        currentMonth,
        previousMonth,
        yearToDate,
        variance,
        variancePercentage
      };
    });
  }, [revenues, currentMonthStart, currentMonthEnd, previousMonthStart, previousMonthEnd, yearStart, yearEnd]);

  // Calcular despesas por categoria
  const expensesByCategory = useMemo(() => {
    const currentMonthExpenses = filterByPeriod(expenses, 'dueDate', currentMonthStart, currentMonthEnd);
    const previousMonthExpenses = filterByPeriod(expenses, 'dueDate', previousMonthStart, previousMonthEnd);
    const yearToDateExpenses = filterByPeriod(expenses, 'dueDate', yearStart, yearEnd);

    const categories = [...new Set(expenses.map(e => e.category))];
    
    return categories.map(category => {
      const currentMonth = currentMonthExpenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.purchaseValue, 0);
      
      const previousMonth = previousMonthExpenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.purchaseValue, 0);
      
      const yearToDate = yearToDateExpenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.purchaseValue, 0);

      const variance = currentMonth - previousMonth;
      const variancePercentage = previousMonth > 0 ? (variance / previousMonth) * 100 : 0;

      return {
        id: `expense-${category.toLowerCase().replace(/\s+/g, '-')}`,
        description: category,
        type: 'expense' as const,
        category,
        currentMonth,
        previousMonth,
        yearToDate,
        variance,
        variancePercentage
      };
    });
  }, [expenses, currentMonthStart, currentMonthEnd, previousMonthStart, previousMonthEnd, yearStart, yearEnd]);

  // Dados do DRE baseados em dados reais
  const dreData: DREItem[] = useMemo(() => {
    const totalCurrentRevenues = revenuesByCategory.reduce((sum, r) => sum + r.currentMonth, 0);
    const totalPreviousRevenues = revenuesByCategory.reduce((sum, r) => sum + r.previousMonth, 0);
    const totalYearRevenues = revenuesByCategory.reduce((sum, r) => sum + r.yearToDate, 0);
    const revenueVariance = totalCurrentRevenues - totalPreviousRevenues;
    const revenueVariancePercentage = totalPreviousRevenues > 0 ? (revenueVariance / totalPreviousRevenues) * 100 : 0;

    const totalCurrentExpenses = expensesByCategory.reduce((sum, e) => sum + e.currentMonth, 0);
    const totalPreviousExpenses = expensesByCategory.reduce((sum, e) => sum + e.previousMonth, 0);
    const totalYearExpenses = expensesByCategory.reduce((sum, e) => sum + e.yearToDate, 0);
    const expenseVariance = totalCurrentExpenses - totalPreviousExpenses;
    const expenseVariancePercentage = totalPreviousExpenses > 0 ? (expenseVariance / totalPreviousExpenses) * 100 : 0;

    return [
      {
        id: 'revenues',
        description: 'RECEITAS OPERACIONAIS',
        type: 'revenue',
        currentMonth: totalCurrentRevenues,
        previousMonth: totalPreviousRevenues,
        yearToDate: totalYearRevenues,
        variance: revenueVariance,
        variancePercentage: revenueVariancePercentage,
        children: revenuesByCategory
      },
      {
        id: 'expenses',
        description: 'CUSTOS E DESPESAS',
        type: 'expense',
        currentMonth: totalCurrentExpenses,
        previousMonth: totalPreviousExpenses,
        yearToDate: totalYearExpenses,
        variance: expenseVariance,
        variancePercentage: expenseVariancePercentage,
        children: expensesByCategory
      }
    ];
  }, [revenuesByCategory, expensesByCategory]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalRevenues = dreData.find(item => item.id === 'revenues');
    const totalExpenses = dreData.find(item => item.id === 'expenses');
    
    const currentMonthProfit = (totalRevenues?.currentMonth || 0) - (totalExpenses?.currentMonth || 0);
    const previousMonthProfit = (totalRevenues?.previousMonth || 0) - (totalExpenses?.previousMonth || 0);
    const yearToDateProfit = (totalRevenues?.yearToDate || 0) - (totalExpenses?.yearToDate || 0);
    
    const profitVariance = currentMonthProfit - previousMonthProfit;
    const profitVariancePercentage = previousMonthProfit !== 0 ? (profitVariance / Math.abs(previousMonthProfit)) * 100 : 0;

    return {
      currentMonth: {
        revenues: totalRevenues?.currentMonth || 0,
        expenses: totalExpenses?.currentMonth || 0,
        profit: currentMonthProfit,
        margin: totalRevenues?.currentMonth ? (currentMonthProfit / totalRevenues.currentMonth) * 100 : 0
      },
      previousMonth: {
        revenues: totalRevenues?.previousMonth || 0,
        expenses: totalExpenses?.previousMonth || 0,
        profit: previousMonthProfit,
        margin: totalRevenues?.previousMonth ? (previousMonthProfit / totalRevenues.previousMonth) * 100 : 0
      },
      yearToDate: {
        revenues: totalRevenues?.yearToDate || 0,
        expenses: totalExpenses?.yearToDate || 0,
        profit: yearToDateProfit,
        margin: totalRevenues?.yearToDate ? (yearToDateProfit / totalRevenues.yearToDate) * 100 : 0
      },
      variance: {
        profit: profitVariance,
        profitPercentage: profitVariancePercentage
      }
    };
  }, [dreData]);

  // Loading state
  const isLoading = expensesLoading || revenuesLoading || costCentersLoading || lotsLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleToggleExpand = (id: string) => {
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
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Função para gerar PDF do DRE
  const handleGenerateDREPDF = async () => {
    const result = await generatePDFFromElement('dre-content', {
      filename: `dre-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'portrait',
      quality: 2
    });

    if (result.success) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  };

  // Função para gerar relatório DRE estruturado
  const handleGenerateDREReport = async () => {
    const result = await generateReportPDF({
      title: 'Demonstrativo de Resultado do Exercício (DRE)',
      data: {
        totals,
        dreData,
        period: `${format(currentMonthStart, 'MMMM yyyy', { locale: ptBR })}`,
        comparison: `${format(previousMonthStart, 'MMMM yyyy', { locale: ptBR })}`
      },
      filename: `dre-completo-${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'portrait'
    });

    if (result.success) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  };

  return (
    <div id="dre-content" className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DRE - Demonstrativo de Resultado</h1>
          <p className="text-muted-foreground">
            Análise financeira detalhada da operação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateDREPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={handleGenerateDREReport}>
            <Download className="h-4 w-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês Atual</SelectItem>
                  <SelectItem value="previous">Mês Anterior</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comparação</label>
              <Select value={selectedComparison} onValueChange={setSelectedComparison}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Mês Anterior</SelectItem>
                  <SelectItem value="year">Mesmo Mês Ano Anterior</SelectItem>
                  <SelectItem value="budget">Orçamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant={showDetails ? "default" : "outline"}
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar" : "Mostrar"} Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.currentMonth.revenues)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mês atual vs anterior: {totals.previousMonth.revenues > 0 ? 
                formatPercentage(((totals.currentMonth.revenues - totals.previousMonth.revenues) / totals.previousMonth.revenues) * 100) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.currentMonth.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mês atual vs anterior: {totals.previousMonth.expenses > 0 ? 
                formatPercentage(((totals.currentMonth.expenses - totals.previousMonth.expenses) / totals.previousMonth.expenses) * 100) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.currentMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.currentMonth.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Variação: {totals.variance.profitPercentage > 0 ? '+' : ''}{formatPercentage(totals.variance.profitPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.currentMonth.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(totals.currentMonth.margin)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mês anterior: {formatPercentage(totals.previousMonth.margin)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DRE Detalhado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Demonstrativo de Resultado</CardTitle>
              <CardDescription>
                {format(currentMonthStart, 'MMMM yyyy', { locale: ptBR })} vs {format(previousMonthStart, 'MMMM yyyy', { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header da tabela */}
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 font-semibold border-b">
              <div>Descrição</div>
              <div className="flex items-center space-x-8">
                <div className="text-right w-24">Mês Atual</div>
                <div className="text-right w-24">Mês Anterior</div>
                <div className="text-right w-24">Acumulado Ano</div>
                <div className="text-right w-24">Variação</div>
              </div>
            </div>

            {/* Itens do DRE */}
            {dreData.map((item) => (
              <DREItemRow
                key={item.id}
                item={item}
                level={0}
                expandedItems={expandedItems}
                onToggleExpand={handleToggleExpand}
                showComparison={true}
              />
            ))}

            {/* Linha de totais */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 font-bold border-t">
              <div className="text-lg">LUCRO LÍQUIDO</div>
              <div className="flex items-center space-x-8">
                <div className={`text-right w-24 text-lg ${totals.currentMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.currentMonth.profit)}
                </div>
                <div className={`text-right w-24 ${totals.previousMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.previousMonth.profit)}
                </div>
                <div className={`text-right w-24 text-lg ${totals.yearToDate.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.yearToDate.profit)}
                </div>
                <div className={`text-right w-24 flex items-center space-x-1 ${totals.variance.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.variance.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{formatCurrency(Math.abs(totals.variance.profit))}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Margem */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Margem</CardTitle>
          <CardDescription>Evolução da margem líquida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Margem Atual</span>
                <span className={`text-sm font-bold ${totals.currentMonth.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(totals.currentMonth.margin)}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, totals.currentMonth.margin + 50))} 
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Margem Anterior</span>
                <span className={`text-sm font-bold ${totals.previousMonth.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(totals.previousMonth.margin)}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, totals.previousMonth.margin + 50))} 
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Margem Anual</span>
                <span className={`text-sm font-bold ${totals.yearToDate.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(totals.yearToDate.margin)}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, totals.yearToDate.margin + 50))} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};