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
import { useFinancialApi } from '@/hooks/api/useFinancialApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';

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
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Hooks de integração financeira unificada
  const { 
    getCostCenters,
    getLotProfitability,
    getDashboardData 
  } = useFinancialApi();
  
  // Usar hooks específicos para expenses e revenues
  const { expenses, loading: expensesLoading, refresh: refreshExpenses } = useExpensesApi();
  const { revenues, loading: revenuesLoading, refresh: refreshRevenues } = useRevenuesApi();
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  const { saleRecords, loading: salesLoading } = useSaleRecordsApi();

  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [lotProfitability, setLotProfitability] = useState<any[]>([]);

  // Carregar dados financeiros
  useEffect(() => {
    const loadFinancialData = async () => {
      setLoading(true);
      try {
        const [centerData, profitData] = await Promise.all([
          getCostCenters(),
          getLotProfitability()
        ]);
        
        setCostCenters(centerData);
        setLotProfitability(profitData);
        
        // Atualizar dados de expenses e revenues através dos hooks
        await Promise.all([
          refreshExpenses(),
          refreshRevenues()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, [selectedPeriod, selectedCostCenter]);

  const isLoading = loading || expensesLoading || revenuesLoading || purchasesLoading || salesLoading;

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

  // Calcular dados do DRE baseados nos dados reais integrados
  const dreData = useMemo(() => {
    if (isLoading || !revenues || !expenses || !Array.isArray(revenues) || !Array.isArray(expenses)) {
      return [];
    }

    const currentPeriod = getPeriodDates(selectedPeriod);
    const previousPeriod = getPeriodDates('previous');

    // Filtrar por centro de custo se selecionado
    const filterByCostCenter = (items: any[]) => {
      if (selectedCostCenter === 'all') return items;
      return items.filter(item => item.costCenterId === selectedCostCenter);
    };

    // RECEITAS - Usar value (frontend) ou totalAmount (backend)
    const currentRevenues = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= currentPeriod.start && revDate <= currentPeriod.end;
    }));

    const previousRevenues = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= previousPeriod.start && revDate <= previousPeriod.end;
    }));

    // DESPESAS - Usar value ou purchaseValue como campo correto
    const currentExpenses = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate >= currentPeriod.start && expDate <= currentPeriod.end;
    }));

    const previousExpenses = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate >= previousPeriod.start && expDate <= previousPeriod.end;
    }));

    // VENDAS DE GADO - Processar vendas como receita
    const currentSales = saleRecords ? saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= currentPeriod.start && saleDate <= currentPeriod.end;
    }) : [];

    const previousSales = saleRecords ? saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= previousPeriod.start && saleDate <= previousPeriod.end;
    }) : [];

    // COMPRAS DE GADO - Processar como despesa
    const currentPurchases = cattlePurchases ? cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= currentPeriod.start && purchaseDate <= currentPeriod.end;
    }) : [];

    const previousPurchases = cattlePurchases ? cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= previousPeriod.start && purchaseDate <= previousPeriod.end;
    }) : [];

    // Calcular totais de RECEITAS (usar value)
    const currentRevenueTotal = currentRevenues.reduce((sum, rev) => sum + (rev.value || 0), 0);
    const previousRevenueTotal = previousRevenues.reduce((sum, rev) => sum + (rev.value || 0), 0);
    
    // Adicionar vendas de gado às receitas
    const currentSalesTotal = currentSales.reduce((sum, sale) => sum + (sale.totalValue || sale.saleValue || 0), 0);
    const previousSalesTotal = previousSales.reduce((sum, sale) => sum + (sale.totalValue || sale.saleValue || 0), 0);
    
    const currentRevenueFinal = currentRevenueTotal + currentSalesTotal;
    const previousRevenueFinal = previousRevenueTotal + previousSalesTotal;

    // Calcular totais de DESPESAS (usar value ou purchaseValue)
    const currentExpenseTotal = currentExpenses.reduce((sum, exp) => sum + (exp.value || exp.purchaseValue || 0), 0);
    const previousExpenseTotal = previousExpenses.reduce((sum, exp) => sum + (exp.value || exp.purchaseValue || 0), 0);
    
    // Adicionar compras de gado às despesas
    const currentPurchaseTotal = currentPurchases.reduce((sum, purchase) => sum + (purchase.purchaseValue || 0), 0);
    const previousPurchaseTotal = previousPurchases.reduce((sum, purchase) => sum + (purchase.purchaseValue || 0), 0);
    
    const currentExpenseFinal = currentExpenseTotal + currentPurchaseTotal;
    const previousExpenseFinal = previousExpenseTotal + previousPurchaseTotal;

    // Calcular Year-to-Date
    const yearToDateRevenue = revenues.reduce((sum, rev) => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate.getFullYear() === new Date().getFullYear() ? sum + (rev.value || 0) : sum;
    }, 0) + (saleRecords ? saleRecords.reduce((sum, sale) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate.getFullYear() === new Date().getFullYear() ? sum + (sale.totalValue || sale.saleValue || 0) : sum;
    }, 0) : 0);

    const yearToDateExpense = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate.getFullYear() === new Date().getFullYear() ? sum + (exp.value || exp.purchaseValue || 0) : sum;
    }, 0) + (cattlePurchases ? cattlePurchases.reduce((sum, purchase) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate.getFullYear() === new Date().getFullYear() ? sum + (purchase.purchaseValue || 0) : sum;
    }, 0) : 0);

    // Calcular variações
    const revenueVariance = currentRevenueFinal - previousRevenueFinal;
    const revenueVariancePercentage = previousRevenueFinal > 0 ? (revenueVariance / previousRevenueFinal) * 100 : 0;
    
    const expenseVariance = currentExpenseFinal - previousExpenseFinal;
    const expenseVariancePercentage = previousExpenseFinal > 0 ? (expenseVariance / previousExpenseFinal) * 100 : 0;

    // Função auxiliar para calcular percentual de variação
    const calculateVariancePercentage = (current: number, previous: number) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    };

    // Agrupar despesas por categoria
    const groupExpensesByCategory = (expenseList: any[]) => {
      const categories: Record<string, { current: number, previous: number, ytd: number }> = {};
      
      // Categorias padrão
      const defaultCategories = [
        'Compra de Gado',
        'Transporte',
        'Alimentação',
        'Veterinário',
        'Mão de Obra',
        'Administrativo',
        'Manutenção',
        'Energia',
        'Combustível',
        'Impostos'
      ];
      
      // Inicializar categorias
      defaultCategories.forEach(cat => {
        categories[cat] = { current: 0, previous: 0, ytd: 0 };
      });
      categories['Outros'] = { current: 0, previous: 0, ytd: 0 };

      currentExpenses.forEach(exp => {
        const cat = exp.category || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { current: 0, previous: 0, ytd: 0 };
        }
        categories[cat].current += exp.value || exp.purchaseValue || 0;
      });

      previousExpenses.forEach(exp => {
        const cat = exp.category || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { current: 0, previous: 0, ytd: 0 };
        }
        categories[cat].previous += exp.value || exp.purchaseValue || 0;
      });

      expenses.forEach(exp => {
        const expDate = new Date(exp.dueDate || exp.createdAt);
        if (expDate.getFullYear() === new Date().getFullYear()) {
          const cat = exp.category || 'Outros';
          if (!categories[cat]) {
            categories[cat] = { current: 0, previous: 0, ytd: 0 };
          }
          categories[cat].ytd += exp.value || exp.purchaseValue || 0;
        }
      });

      // Adicionar compras de gado
      if (!categories['Compra de Gado']) {
        categories['Compra de Gado'] = { current: 0, previous: 0, ytd: 0 };
      }
      categories['Compra de Gado'].current += currentPurchaseTotal;
      categories['Compra de Gado'].previous += previousPurchaseTotal;
      categories['Compra de Gado'].ytd += cattlePurchases ? cattlePurchases.reduce((sum, p) => {
        const pDate = new Date(p.purchaseDate || p.createdAt);
        return pDate.getFullYear() === new Date().getFullYear() ? sum + (p.purchaseValue || 0) : sum;
      }, 0) : 0;

      return categories;
    };

    const expenseCategories = groupExpensesByCategory(expenses);

    // Agrupar receitas por categoria
    const groupRevenuesByCategory = (revenueList: any[]) => {
      const categories: Record<string, { current: number, previous: number, ytd: number }> = {};
      
      // Inicializar com vendas de gado
      categories['Venda de Gado'] = { 
        current: currentSalesTotal, 
        previous: previousSalesTotal, 
        ytd: saleRecords ? saleRecords.reduce((sum, sale) => {
          const saleDate = new Date(sale.saleDate || sale.createdAt);
          return saleDate.getFullYear() === new Date().getFullYear() ? sum + (sale.totalValue || sale.saleValue || 0) : sum;
        }, 0) : 0
      };
      
      // Outras categorias padrão
      const defaultCategories = [
        'Venda de Subproduto',
        'Serviços',
        'Arrendamento',
        'Financeiro'
      ];
      
      defaultCategories.forEach(cat => {
        categories[cat] = { current: 0, previous: 0, ytd: 0 };
      });
      categories['Outros'] = { current: 0, previous: 0, ytd: 0 };

      currentRevenues.forEach(rev => {
        const cat = rev.category || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { current: 0, previous: 0, ytd: 0 };
        }
        categories[cat].current += rev.value || 0;
      });

      previousRevenues.forEach(rev => {
        const cat = rev.category || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { current: 0, previous: 0, ytd: 0 };
        }
        categories[cat].previous += rev.value || 0;
      });

      revenues.forEach(rev => {
        const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
        if (revDate.getFullYear() === new Date().getFullYear()) {
          const cat = rev.category || 'Outros';
          if (!categories[cat]) {
            categories[cat] = { current: 0, previous: 0, ytd: 0 };
          }
          categories[cat].ytd += rev.value || 0;
        }
      });

      return categories;
    };

    const revenueCategories = groupRevenuesByCategory(revenues);

    return [
      {
        id: 'revenues',
        description: 'RECEITAS',
        type: 'revenue' as const,
        currentMonth: currentRevenueFinal,
        previousMonth: previousRevenueFinal,
        yearToDate: yearToDateRevenue,
        budget: currentRevenueFinal * 0.95,
        variance: revenueVariance,
        variancePercentage: revenueVariancePercentage,
        children: Object.entries(revenueCategories).map(([cat, values]) => ({
          id: `revenue-${cat}`,
          description: cat,
          type: 'revenue' as const,
          category: 'operational',
          currentMonth: values.current,
          previousMonth: values.previous,
          yearToDate: values.ytd,
          budget: values.current * 0.95,
          variance: values.current - values.previous,
          variancePercentage: calculateVariancePercentage(values.current, values.previous)
        })).filter(item => item.currentMonth > 0 || item.previousMonth > 0 || item.yearToDate > 0)
      },
      {
        id: 'expenses',
        description: 'DESPESAS',
        type: 'expense' as const,
        currentMonth: -currentExpenseFinal,
        previousMonth: -previousExpenseFinal,
        yearToDate: -yearToDateExpense,
        budget: -currentExpenseFinal * 1.05,
        variance: -expenseVariance,
        variancePercentage: -expenseVariancePercentage,
        children: Object.entries(expenseCategories).map(([cat, values]) => ({
          id: `expense-${cat}`,
          description: cat,
          type: 'expense' as const,
          category: 'operational',
          currentMonth: -values.current,
          previousMonth: -values.previous,
          yearToDate: -values.ytd,
          budget: -values.current * 1.05,
          variance: -(values.current - values.previous),
          variancePercentage: -calculateVariancePercentage(values.current, values.previous)
        })).filter(item => item.currentMonth < 0 || item.previousMonth < 0 || item.yearToDate < 0)
      },
      {
        id: 'gross-profit',
        description: 'LUCRO BRUTO',
        type: 'total' as const,
        currentMonth: currentRevenueFinal - currentExpenseFinal,
        previousMonth: previousRevenueFinal - previousExpenseFinal,
        yearToDate: yearToDateRevenue - yearToDateExpense,
        budget: (currentRevenueFinal * 0.95) - (currentExpenseFinal * 1.05),
        variance: (currentRevenueFinal - currentExpenseFinal) - (previousRevenueFinal - previousExpenseFinal),
        variancePercentage: calculateVariancePercentage(
          currentRevenueFinal - currentExpenseFinal,
          previousRevenueFinal - previousExpenseFinal
        )
      },
      {
        id: 'net-profit',
        description: 'LUCRO LÍQUIDO',
        type: 'total' as const,
        currentMonth: currentRevenueFinal - currentExpenseFinal,
        previousMonth: previousRevenueFinal - previousExpenseFinal,
        yearToDate: yearToDateRevenue - yearToDateExpense,
        budget: (currentRevenueFinal * 0.95) - (currentExpenseFinal * 1.05),
        variance: (currentRevenueFinal - currentExpenseFinal) - (previousRevenueFinal - previousExpenseFinal),
        variancePercentage: calculateVariancePercentage(
          currentRevenueFinal - currentExpenseFinal,
          previousRevenueFinal - previousExpenseFinal
        )
      }
    ];
  }, [selectedPeriod, customDateRange, expenses, revenues, cattlePurchases, saleRecords, isLoading, selectedCostCenter]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    if (!dreData || dreData.length === 0) return [];
    
    return dreData
      .filter(item => item.type !== 'total')
      .map(item => ({
        name: item.description,
        atual: Math.abs(item.currentMonth),
        anterior: Math.abs(item.previousMonth),
        orçamento: Math.abs(item.budget)
      }));
  }, [dreData]);

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getVarianceColor = (variance: number, type: string) => {
    if (type === 'expense') {
      return variance > 0 ? 'text-red-600' : 'text-green-600';
    }
    return variance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVarianceIcon = (variance: number, type: string) => {
    if (type === 'expense') {
      return variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
    }
    return variance > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const exportToExcel = () => {
    // Implementar exportação
    console.log('Exportando para Excel...');
  };

  const printDRE = () => {
    window.print();
  };

  // Componente de linha da tabela DRE
  const DRETableRow: React.FC<{ item: DREItem; level?: number }> = ({ item, level = 0 }) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isTotal = item.type === 'total';
    
    return (
      <>
        <TableRow className={cn(
          "hover:bg-muted/50 transition-colors",
          isTotal && "font-bold bg-muted/30",
          level > 0 && "text-sm"
        )}>
          <TableCell className="sticky left-0 bg-background">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <span className={cn(isTotal && "font-semibold")}>{item.description}</span>
            </div>
          </TableCell>
          
          <TableCell className="text-right">
            {formatCurrency(item.currentMonth)}
          </TableCell>
          
          <TableCell className="text-right text-muted-foreground">
            {formatCurrency(item.previousMonth)}
          </TableCell>
          
          <TableCell className="text-right">
            <div className={cn("flex items-center justify-end gap-1", getVarianceColor(item.variance, item.type))}>
              {getVarianceIcon(item.variance, item.type)}
              <span>{formatCurrency(Math.abs(item.variance))}</span>
            </div>
          </TableCell>
          
          <TableCell className="text-right">
            <Badge variant={item.variancePercentage > 0 ? "default" : "secondary"}>
              {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
            </Badge>
          </TableCell>
          
          <TableCell className="text-right text-muted-foreground">
            {formatCurrency(item.yearToDate)}
          </TableCell>
          
          <TableCell className="text-right text-muted-foreground">
            {formatCurrency(item.budget)}
          </TableCell>
          
          <TableCell className="text-right">
            <Progress 
              value={Math.min(Math.abs((item.currentMonth / item.budget) * 100), 100)} 
              className="w-20"
            />
          </TableCell>
        </TableRow>
        
        {hasChildren && isExpanded && showDetails && item.children?.map(child => (
          <DRETableRow key={child.id} item={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Demonstração de Resultados (DRE)</h2>
            <p className="text-muted-foreground">Análise detalhada de receitas e despesas</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printDRE}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Mês Atual</SelectItem>
                    <SelectItem value="previous">Mês Anterior</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Centro de Custo</Label>
                <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {costCenters.map(center => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.code} - {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Comparar com</Label>
                <Select value={selectedComparison} onValueChange={setSelectedComparison}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous">Período Anterior</SelectItem>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="year">Mesmo Período Ano Anterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <Eye className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
                </Button>
              </div>
            </div>

            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from ? format(customDateRange.from, 'PPP', { locale: ptBR }) : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customDateRange.from || undefined}
                        onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.to ? format(customDateRange.to, 'PPP', { locale: ptBR }) : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customDateRange.to || undefined}
                        onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {dreData.filter(item => item.type === 'total').map(item => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.description}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(item.currentMonth)}
              </div>
              <div className={cn("flex items-center gap-1 text-sm mt-1", getVarianceColor(item.variance, 'revenue'))}>
                {getVarianceIcon(item.variance, 'revenue')}
                <span>{item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%</span>
                <span className="text-muted-foreground">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs com visualizações */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">
            <FileText className="h-4 w-4 mr-2" />
            Tabela DRE
          </TabsTrigger>
          <TabsTrigger value="chart">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gráfico Comparativo
          </TabsTrigger>
          <TabsTrigger value="trend">
            <Activity className="h-4 w-4 mr-2" />
            Análise de Tendência
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <PieChart className="h-4 w-4 mr-2" />
            Composição
          </TabsTrigger>
        </TabsList>

        {/* Tabela DRE */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração Detalhada</CardTitle>
              <CardDescription>
                Comparativo entre períodos com análise de variação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Descrição</TableHead>
                        <TableHead className="text-right">Período Atual</TableHead>
                        <TableHead className="text-right">Período Anterior</TableHead>
                        <TableHead className="text-right">Variação R$</TableHead>
                        <TableHead className="text-right">Variação %</TableHead>
                        <TableHead className="text-right">Acumulado Ano</TableHead>
                        <TableHead className="text-right">Orçamento</TableHead>
                        <TableHead className="text-right">Realizado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dreData.map(item => (
                        <DRETableRow key={item.id} item={item} />
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico Comparativo */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Períodos</CardTitle>
              <CardDescription>
                Visualização gráfica das receitas e despesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="atual" fill="#10b981" name="Período Atual" />
                  <Bar dataKey="anterior" fill="#6b7280" name="Período Anterior" />
                  <Bar dataKey="orçamento" fill="#3b82f6" name="Orçamento" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise de Tendência */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendência</CardTitle>
              <CardDescription>
                Evolução dos resultados ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Análise de tendência baseada nos últimos 12 meses
                </AlertDescription>
              </Alert>
              
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="atual" stroke="#10b981" name="Realizado" strokeWidth={2} />
                    <Line type="monotone" dataKey="orçamento" stroke="#3b82f6" name="Orçamento" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Composição */}
        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Composição de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={dreData.find(d => d.id === 'revenues')?.children || []}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="description" type="category" width={120} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="currentMonth" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Composição de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={dreData.find(d => d.id === 'expenses')?.children?.map(c => ({
                      ...c,
                      currentMonth: Math.abs(c.currentMonth)
                    })) || []}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="description" type="category" width={120} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="currentMonth" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights e Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Principais Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lotProfitability && lotProfitability.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ROI Médio dos Lotes</span>
                  <Badge variant="outline">
                    {(lotProfitability.reduce((sum, lot) => sum + (lot.roi || 0), 0) / lotProfitability.length).toFixed(1)}%
                  </Badge>
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Margem Bruta</span>
              <Badge variant={dreData.find(d => d.id === 'gross-profit')?.currentMonth || 0 > 0 ? 'default' : 'destructive'}>
                {((dreData.find(d => d.id === 'gross-profit')?.currentMonth || 0) / 
                  (dreData.find(d => d.id === 'revenues')?.currentMonth || 1) * 100).toFixed(1)}%
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ponto de Equilíbrio</span>
              <Badge variant="outline">
                {formatCurrency(Math.abs(dreData.find(d => d.id === 'expenses')?.currentMonth || 0))}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Liquidez</span>
              <Badge variant="outline">
                {((dreData.find(d => d.id === 'revenues')?.currentMonth || 0) / 
                  Math.abs(dreData.find(d => d.id === 'expenses')?.currentMonth || 1)).toFixed(2)}x
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dreData.find(d => d.id === 'expenses')?.variancePercentage || 0 > 10 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Despesas aumentaram {Math.abs(dreData.find(d => d.id === 'expenses')?.variancePercentage || 0).toFixed(1)}% 
                  em relação ao período anterior. Revisar centros de custo.
                </AlertDescription>
              </Alert>
            )}
            
            {dreData.find(d => d.id === 'revenues')?.variancePercentage || 0 < -5 && (
              <Alert>
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  Receitas diminuíram {Math.abs(dreData.find(d => d.id === 'revenues')?.variancePercentage || 0).toFixed(1)}% 
                  em relação ao período anterior. Avaliar estratégia de vendas.
                </AlertDescription>
              </Alert>
            )}
            
            {dreData.find(d => d.id === 'net-profit')?.currentMonth || 0 < 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Resultado negativo no período. Implementar medidas de redução de custos.
                </AlertDescription>
              </Alert>
            )}
            
            {dreData.find(d => d.id === 'net-profit')?.currentMonth || 0 > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Resultado positivo de {formatCurrency(dreData.find(d => d.id === 'net-profit')?.currentMonth || 0)} 
                  no período.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};