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
  Package
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';
import { useExpenses, useRevenues, useCattleLots, useSaleRecords } from '../../hooks/useSupabaseData';

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

export const ModernDRE: React.FC = () => {
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
  const { cattleLots, loading: lotsLoading } = useCattleLotsApi();
  const { saleRecords, loading: salesLoading } = useSaleRecordsApi();

  // Dados mockados do DRE
  const dreData: DREItem[] = [
    {
      id: 'revenues',
      description: 'RECEITAS',
      type: 'revenue',
      currentMonth: 1850000,
      previousMonth: 1650000,
      yearToDate: 10500000,
      budget: 1800000,
      variance: 50000,
      variancePercentage: 2.78,
      children: [
        {
          id: 'revenue-sales',
          description: 'Vendas de Gado',
          type: 'revenue',
          category: 'operational',
          currentMonth: 1750000,
          previousMonth: 1550000,
          yearToDate: 9900000,
          budget: 1700000,
          variance: 50000,
          variancePercentage: 2.94
        },
        {
          id: 'revenue-services',
          description: 'Serviços e Arrendamentos',
          type: 'revenue',
          category: 'operational',
          currentMonth: 80000,
          previousMonth: 75000,
          yearToDate: 450000,
          budget: 78000,
          variance: 2000,
          variancePercentage: 2.56
        },
        {
          id: 'revenue-other',
          description: 'Outras Receitas',
          type: 'revenue',
          category: 'non-operational',
          currentMonth: 20000,
          previousMonth: 25000,
          yearToDate: 150000,
          budget: 22000,
          variance: -2000,
          variancePercentage: -9.09
        }
      ]
    },
    {
      id: 'expenses',
      description: 'DESPESAS',
      type: 'expense',
      currentMonth: -1235000,
      previousMonth: -1150000,
      yearToDate: -7200000,
      budget: -1200000,
      variance: -35000,
      variancePercentage: -2.92,
      children: [
        {
          id: 'expense-purchase',
          description: 'Compra de Gado',
          type: 'expense',
          category: 'operational',
          currentMonth: -800000,
          previousMonth: -750000,
          yearToDate: -4500000,
          budget: -780000,
          variance: -20000,
          variancePercentage: -2.56
        },
        {
          id: 'expense-feed',
          description: 'Alimentação e Nutrição',
          type: 'expense',
          category: 'operational',
          currentMonth: -180000,
          previousMonth: -165000,
          yearToDate: -1050000,
          budget: -175000,
          variance: -5000,
          variancePercentage: -2.86
        },
        {
          id: 'expense-health',
          description: 'Saúde e Veterinária',
          type: 'expense',
          category: 'operational',
          currentMonth: -45000,
          previousMonth: -40000,
          yearToDate: -260000,
          budget: -43000,
          variance: -2000,
          variancePercentage: -4.65
        },
        {
          id: 'expense-labor',
          description: 'Mão de Obra',
          type: 'expense',
          category: 'operational',
          currentMonth: -85000,
          previousMonth: -85000,
          yearToDate: -510000,
          budget: -85000,
          variance: 0,
          variancePercentage: 0
        },
        {
          id: 'expense-maintenance',
          description: 'Manutenção e Reparos',
          type: 'expense',
          category: 'operational',
          currentMonth: -35000,
          previousMonth: -30000,
          yearToDate: -200000,
          budget: -32000,
          variance: -3000,
          variancePercentage: -9.38
        },
        {
          id: 'expense-transport',
          description: 'Transporte e Logística',
          type: 'expense',
          category: 'operational',
          currentMonth: -55000,
          previousMonth: -50000,
          yearToDate: -320000,
          budget: -52000,
          variance: -3000,
          variancePercentage: -5.77
        },
        {
          id: 'expense-admin',
          description: 'Despesas Administrativas',
          type: 'expense',
          category: 'administrative',
          currentMonth: -25000,
          previousMonth: -23000,
          yearToDate: -150000,
          budget: -24000,
          variance: -1000,
          variancePercentage: -4.17
        },
        {
          id: 'expense-depreciation',
          description: 'Depreciação',
          type: 'expense',
          category: 'non-cash',
          currentMonth: -10000,
          previousMonth: -10000,
          yearToDate: -60000,
          budget: -10000,
          variance: 0,
          variancePercentage: 0
        }
      ]
    }
  ];

  // Calcular totais
  const totals = useMemo(() => {
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
        current: ((revenues?.currentMonth || 0) + (expenses?.currentMonth || 0)) / (revenues?.currentMonth || 1) * 100,
        previous: ((revenues?.previousMonth || 0) + (expenses?.previousMonth || 0)) / (revenues?.previousMonth || 1) * 100
      },
      ebitda: {
        currentMonth: (revenues?.currentMonth || 0) + (expenses?.currentMonth || 0) + 10000, // Adding back depreciation
        previousMonth: (revenues?.previousMonth || 0) + (expenses?.previousMonth || 0) + 10000,
        yearToDate: (revenues?.yearToDate || 0) + (expenses?.yearToDate || 0) + 60000,
        budget: (revenues?.budget || 0) + (expenses?.budget || 0) + 10000
      }
    };
  }, []);

  // Dados para gráficos
  const monthlyTrend = [
    { month: 'Jul', receita: 1450000, despesa: -1050000, lucro: 400000 },
    { month: 'Ago', receita: 1520000, despesa: -1080000, lucro: 440000 },
    { month: 'Set', receita: 1580000, despesa: -1120000, lucro: 460000 },
    { month: 'Out', receita: 1650000, despesa: -1150000, lucro: 500000 },
    { month: 'Nov', receita: 1750000, despesa: -1180000, lucro: 570000 },
    { month: 'Dez', receita: 1850000, despesa: -1235000, lucro: 615000 }
  ];

  const expenseBreakdown = [
    { name: 'Compra de Gado', value: 800000, percentage: 64.8, color: '#10b981' },
    { name: 'Alimentação', value: 180000, percentage: 14.6, color: '#3b82f6' },
    { name: 'Mão de Obra', value: 85000, percentage: 6.9, color: '#f59e0b' },
    { name: 'Transporte', value: 55000, percentage: 4.5, color: '#8b5cf6' },
    { name: 'Veterinária', value: 45000, percentage: 3.6, color: '#ef4444' },
    { name: 'Outros', value: 70000, percentage: 5.6, color: '#6b7280' }
  ];

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
              {item.variance !== 0 && (
                item.variance > 0 
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
              {formatCurrency(dreData[0].currentMonth)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.1%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
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
              {formatCurrency(dreData[1].currentMonth)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-3 w-3 text-red-500" />
              <span className="text-red-600">+7.4%</span>
              <span className="text-muted-foreground">vs mês anterior</span>
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
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+23%</span>
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
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600">+2.7pp</span>
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
              <CardDescription>Período: Dezembro 2024</CardDescription>
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
                        <span className="text-green-600">
                          {formatCurrency(totals.grossProfit.currentMonth)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.previousMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">23.0%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.yearToDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.grossProfit.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="font-mono">
                          {formatCurrency(totals.grossProfit.currentMonth - totals.grossProfit.budget)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    
                    {/* Linha de EBITDA */}
                    <TableRow className="font-bold">
                      <TableCell className="sticky left-0 bg-background">EBITDA</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">
                          {formatCurrency(totals.ebitda.currentMonth)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.ebitda.previousMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">21.5%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.ebitda.yearToDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.ebitda.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="font-mono">
                          {formatCurrency(totals.ebitda.currentMonth - totals.ebitda.budget)}
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
                          {formatCurrency(expense.value)} ({expense.percentage}%)
                        </span>
                      </div>
                      <Progress 
                        value={expense.percentage} 
                        className="h-2"
                        style={{
                          '--progress-background': expense.color
                        } as any}
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
                    margem: (m.lucro / m.receita * 100)
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
                    { categoria: 'Receitas', realizado: 1850000, orcado: 1800000 },
                    { categoria: 'Despesas', realizado: 1235000, orcado: 1200000 },
                    { categoria: 'Lucro', realizado: 615000, orcado: 600000 }
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
                      {dreData[0].children?.map((item) => (
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

                {/* Comparativo de Despesas */}
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
                      {dreData[1].children?.map((item) => (
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
                    <p className="kpi-value">33.2%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margem EBITDA</p>
                    <p className="kpi-value">33.8%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="kpi-value">18.5%</p>
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
                    <p className="kpi-value">R$ 2.470</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Receita/Cabeça</p>
                    <p className="kpi-value">R$ 3.700</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lucro/Cabeça</p>
                    <p className="kpi-value">R$ 1.230</p>
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
                    <span className="text-sm text-muted-foreground">102.8%</span>
                  </div>
                  <Progress value={102.8} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Despesas</span>
                    <span className="text-sm text-muted-foreground">102.9%</span>
                  </div>
                  <Progress value={102.9} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Lucro</span>
                    <span className="text-sm text-muted-foreground">102.5%</span>
                  </div>
                  <Progress value={102.5} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">EBITDA</span>
                    <span className="text-sm text-muted-foreground">105.0%</span>
                  </div>
                  <Progress value={105} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Todos os indicadores estão dentro das metas estabelecidas para o período
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};