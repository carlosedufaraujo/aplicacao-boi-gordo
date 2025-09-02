import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DREItem {
  id: string;
  description: string;
  type: 'revenue' | 'expense' | 'total' | 'subtotal';
  category?: string;
  currentMonth: number;
  previousMonth: number;
  yearToDate: number;
  budget: number;
  variance: number;
  variancePercentage: number;
  children?: DREItem[];
  expanded?: boolean;
  level?: number;
}

interface FinancialDRETableProps {
  expenses: any[];
  revenues: any[];
  cattlePurchases?: any[];
  saleRecords?: any[];
  costCenters: any[];
  loading?: boolean;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export const FinancialDRETable: React.FC<FinancialDRETableProps> = ({
  expenses = [],
  revenues = [],
  cattlePurchases = [],
  saleRecords = [],
  costCenters = [],
  loading = false,
  period = 'current',
  onPeriodChange
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['revenues', 'expenses']));
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(true);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null, to: Date | null }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Função para calcular período
  const getPeriodDates = (periodType: string) => {
    const now = new Date();
    switch (periodType) {
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

  // Toggle expansão
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Calcular dados do DRE
  const dreData = useMemo(() => {
    if (!revenues || !expenses) return [];

    const currentPeriod = getPeriodDates(period);
    const previousPeriod = getPeriodDates('previous');

    // Filtrar por centro de custo
    const filterByCostCenter = (items: any[]) => {
      if (selectedCostCenter === 'all') return items;
      return items.filter(item => item.costCenterId === selectedCostCenter);
    };

    // RECEITAS
    const currentRevenues = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= currentPeriod.start && revDate <= currentPeriod.end;
    }));

    const previousRevenues = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= previousPeriod.start && revDate <= previousPeriod.end;
    }));

    // DESPESAS
    const currentExpenses = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate >= currentPeriod.start && expDate <= currentPeriod.end;
    }));

    const previousExpenses = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate >= previousPeriod.start && expDate <= previousPeriod.end;
    }));

    // VENDAS DE GADO
    const currentSales = saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= currentPeriod.start && saleDate <= currentPeriod.end;
    });

    const previousSales = saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate >= previousPeriod.start && saleDate <= previousPeriod.end;
    });

    // COMPRAS DE GADO
    const currentPurchases = cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= currentPeriod.start && purchaseDate <= currentPeriod.end;
    });

    const previousPurchases = cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= previousPeriod.start && purchaseDate <= previousPeriod.end;
    });

    // Calcular totais
    const currentRevenueTotal = currentRevenues.reduce((sum, rev) => sum + (rev.value || 0), 0);
    const previousRevenueTotal = previousRevenues.reduce((sum, rev) => sum + (rev.value || 0), 0);
    const currentSalesTotal = currentSales.reduce((sum, sale) => sum + (sale.totalValue || sale.saleValue || 0), 0);
    const previousSalesTotal = previousSales.reduce((sum, sale) => sum + (sale.totalValue || sale.saleValue || 0), 0);
    const currentRevenueFinal = currentRevenueTotal + currentSalesTotal;
    const previousRevenueFinal = previousRevenueTotal + previousSalesTotal;

    const currentExpenseTotal = currentExpenses.reduce((sum, exp) => sum + (exp.value || exp.purchaseValue || 0), 0);
    const previousExpenseTotal = previousExpenses.reduce((sum, exp) => sum + (exp.value || exp.purchaseValue || 0), 0);
    const currentPurchaseTotal = currentPurchases.reduce((sum, purchase) => sum + (purchase.purchaseValue || 0), 0);
    const previousPurchaseTotal = previousPurchases.reduce((sum, purchase) => sum + (purchase.purchaseValue || 0), 0);
    const currentExpenseFinal = currentExpenseTotal + currentPurchaseTotal;
    const previousExpenseFinal = previousExpenseTotal + previousPurchaseTotal;

    // Year-to-Date
    const yearToDateRevenue = revenues.reduce((sum, rev) => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate.getFullYear() === new Date().getFullYear() ? sum + (rev.value || 0) : sum;
    }, 0) + saleRecords.reduce((sum, sale) => {
      const saleDate = new Date(sale.saleDate || sale.createdAt);
      return saleDate.getFullYear() === new Date().getFullYear() ? sum + (sale.totalValue || sale.saleValue || 0) : sum;
    }, 0);

    const yearToDateExpense = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate.getFullYear() === new Date().getFullYear() ? sum + (exp.value || exp.purchaseValue || 0) : sum;
    }, 0) + cattlePurchases.reduce((sum, purchase) => {
      const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt);
      return purchaseDate.getFullYear() === new Date().getFullYear() ? sum + (purchase.purchaseValue || 0) : sum;
    }, 0);

    // Agrupar por categorias
    const groupByCategory = (items: any[], type: 'revenue' | 'expense') => {
      const categories: Record<string, { current: number, previous: number, ytd: number }> = {};

      // Processar itens atuais
      const currentItems = type === 'revenue' ? currentRevenues : currentExpenses;
      const previousItems = type === 'revenue' ? previousRevenues : previousExpenses;
      const allItems = type === 'revenue' ? revenues : expenses;

      currentItems.forEach(item => {
        const cat = item.category || 'Outros';
        if (!categories[cat]) categories[cat] = { current: 0, previous: 0, ytd: 0 };
        categories[cat].current += item.value || item.purchaseValue || 0;
      });

      previousItems.forEach(item => {
        const cat = item.category || 'Outros';
        if (!categories[cat]) categories[cat] = { current: 0, previous: 0, ytd: 0 };
        categories[cat].previous += item.value || item.purchaseValue || 0;
      });

      allItems.forEach(item => {
        const itemDate = new Date(item.receivedDate || item.dueDate || item.createdAt);
        if (itemDate.getFullYear() === new Date().getFullYear()) {
          const cat = item.category || 'Outros';
          if (!categories[cat]) categories[cat] = { current: 0, previous: 0, ytd: 0 };
          categories[cat].ytd += item.value || item.purchaseValue || 0;
        }
      });

      // Adicionar vendas/compras de gado
      if (type === 'revenue' && currentSalesTotal > 0) {
        categories['Venda de Gado'] = {
          current: currentSalesTotal,
          previous: previousSalesTotal,
          ytd: saleRecords.reduce((sum, sale) => {
            const saleDate = new Date(sale.saleDate || sale.createdAt);
            return saleDate.getFullYear() === new Date().getFullYear() ? sum + (sale.totalValue || sale.saleValue || 0) : sum;
          }, 0)
        };
      }

      if (type === 'expense' && currentPurchaseTotal > 0) {
        categories['Compra de Gado'] = {
          current: currentPurchaseTotal,
          previous: previousPurchaseTotal,
          ytd: cattlePurchases.reduce((sum, p) => {
            const pDate = new Date(p.purchaseDate || p.createdAt);
            return pDate.getFullYear() === new Date().getFullYear() ? sum + (p.purchaseValue || 0) : sum;
          }, 0)
        };
      }

      return categories;
    };

    const revenueCategories = groupByCategory(revenues, 'revenue');
    const expenseCategories = groupByCategory(expenses, 'expense');

    // Calcular variações
    const calculateVariance = (current: number, previous: number) => ({
      variance: current - previous,
      variancePercentage: previous > 0 ? ((current - previous) / previous) * 100 : 0
    });

    const revenueVariance = calculateVariance(currentRevenueFinal, previousRevenueFinal);
    const expenseVariance = calculateVariance(currentExpenseFinal, previousExpenseFinal);

    // Estruturar dados DRE
    const dreItems: DREItem[] = [
      {
        id: 'revenues',
        description: 'RECEITAS OPERACIONAIS',
        type: 'revenue',
        currentMonth: currentRevenueFinal,
        previousMonth: previousRevenueFinal,
        yearToDate: yearToDateRevenue,
        budget: currentRevenueFinal * 0.95,
        ...revenueVariance,
        children: Object.entries(revenueCategories).map(([cat, values]) => ({
          id: `revenue-${cat}`,
          description: cat,
          type: 'revenue' as const,
          currentMonth: values.current,
          previousMonth: values.previous,
          yearToDate: values.ytd,
          budget: values.current * 0.95,
          ...calculateVariance(values.current, values.previous),
          level: 1
        })).filter(item => item.currentMonth > 0 || item.previousMonth > 0 || item.yearToDate > 0)
      },
      {
        id: 'expenses',
        description: 'DESPESAS OPERACIONAIS',
        type: 'expense',
        currentMonth: -currentExpenseFinal,
        previousMonth: -previousExpenseFinal,
        yearToDate: -yearToDateExpense,
        budget: -currentExpenseFinal * 1.05,
        variance: -expenseVariance.variance,
        variancePercentage: -expenseVariance.variancePercentage,
        children: Object.entries(expenseCategories).map(([cat, values]) => ({
          id: `expense-${cat}`,
          description: cat,
          type: 'expense' as const,
          currentMonth: -values.current,
          previousMonth: -values.previous,
          yearToDate: -values.ytd,
          budget: -values.current * 1.05,
          ...calculateVariance(-values.current, -values.previous),
          level: 1
        })).filter(item => item.currentMonth < 0 || item.previousMonth < 0 || item.yearToDate < 0)
      },
      {
        id: 'gross-profit',
        description: 'LUCRO BRUTO',
        type: 'subtotal',
        currentMonth: currentRevenueFinal - currentExpenseFinal,
        previousMonth: previousRevenueFinal - previousExpenseFinal,
        yearToDate: yearToDateRevenue - yearToDateExpense,
        budget: (currentRevenueFinal * 0.95) - (currentExpenseFinal * 1.05),
        ...calculateVariance(currentRevenueFinal - currentExpenseFinal, previousRevenueFinal - previousExpenseFinal)
      },
      {
        id: 'net-profit',
        description: 'LUCRO LÍQUIDO',
        type: 'total',
        currentMonth: currentRevenueFinal - currentExpenseFinal,
        previousMonth: previousRevenueFinal - previousExpenseFinal,
        yearToDate: yearToDateRevenue - yearToDateExpense,
        budget: (currentRevenueFinal * 0.95) - (currentExpenseFinal * 1.05),
        ...calculateVariance(currentRevenueFinal - currentExpenseFinal, previousRevenueFinal - previousExpenseFinal)
      }
    ];

    return dreItems;
  }, [expenses, revenues, cattlePurchases, saleRecords, period, selectedCostCenter]);

  // Renderizar linha da tabela
  const renderRow = (item: DREItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const indent = (item.level || 0) * 24;

    return (
      <React.Fragment key={item.id}>
        <TableRow
          className={cn(
            'hover:bg-gray-50 transition-colors',
            item.type === 'total' && 'bg-gray-100 font-bold',
            item.type === 'subtotal' && 'bg-gray-50 font-semibold'
          )}
        >
          <TableCell className="sticky left-0 bg-white z-10">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-5 w-5"
                  onClick={() => toggleExpanded(item.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <span className={cn(
                item.type === 'total' && 'text-base font-bold',
                item.type === 'subtotal' && 'text-sm font-semibold',
                item.level === 1 && 'text-sm'
              )}>
                {item.description}
              </span>
            </div>
          </TableCell>

          <TableCell className="text-right">
            <span className={cn(
              item.currentMonth < 0 ? 'text-red-600' : 'text-green-600',
              item.type === 'total' && 'font-bold'
            )}>
              {formatCurrency(Math.abs(item.currentMonth))}
            </span>
          </TableCell>

          <TableCell className="text-right text-gray-600">
            {formatCurrency(Math.abs(item.previousMonth))}
          </TableCell>

          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              {item.variance !== 0 && (
                item.variance > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )
              )}
              <span className={cn(
                item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-gray-600',
                item.type === 'total' && 'font-bold'
              )}>
                {formatCurrency(Math.abs(item.variance))}
              </span>
            </div>
          </TableCell>

          <TableCell className="text-right">
            <Badge variant={item.variancePercentage > 0 ? 'success' : item.variancePercentage < 0 ? 'destructive' : 'secondary'}>
              {item.variancePercentage > 0 && '+'}
              {formatPercentage(item.variancePercentage)}
            </Badge>
          </TableCell>

          <TableCell className="text-right text-gray-600">
            {formatCurrency(Math.abs(item.yearToDate))}
          </TableCell>

          <TableCell className="text-right text-gray-600">
            {formatCurrency(Math.abs(item.budget))}
          </TableCell>

          <TableCell className="text-right">
            <Badge
              variant={
                Math.abs(item.currentMonth) > Math.abs(item.budget) * 1.1 ? 'destructive' :
                Math.abs(item.currentMonth) > Math.abs(item.budget) ? 'warning' : 'success'
              }
            >
              {formatPercentage((item.currentMonth / item.budget) * 100)}
            </Badge>
          </TableCell>
        </TableRow>

        {hasChildren && isExpanded && showDetails && item.children?.map((child, childIndex) => renderRow(child, childIndex))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Demonstrativo de Resultados (DRE)
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Análise detalhada de receitas e despesas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Mês Atual</SelectItem>
                <SelectItem value="previous">Mês Anterior</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Ano Atual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Centros</SelectItem>
                {costCenters.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
            </Button>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[250px]">Descrição</TableHead>
                <TableHead className="text-right min-w-[120px]">Mês Atual</TableHead>
                <TableHead className="text-right min-w-[120px]">Mês Anterior</TableHead>
                <TableHead className="text-right min-w-[120px]">Variação R$</TableHead>
                <TableHead className="text-right min-w-[100px]">Variação %</TableHead>
                <TableHead className="text-right min-w-[120px]">Acumulado Ano</TableHead>
                <TableHead className="text-right min-w-[120px]">Orçamento</TableHead>
                <TableHead className="text-right min-w-[100px]">Real vs Orç.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dreData.map((item, index) => renderRow(item, index))}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(dreData.find(d => d.id === 'revenues')?.currentMonth || 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {dreData.find(d => d.id === 'revenues')?.variancePercentage || 0 > 0 ? '+' : ''}
                {formatPercentage(dreData.find(d => d.id === 'revenues')?.variancePercentage || 0)} vs mês anterior
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Despesa Total</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(Math.abs(dreData.find(d => d.id === 'expenses')?.currentMonth || 0))}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {dreData.find(d => d.id === 'expenses')?.variancePercentage || 0 > 0 ? '+' : ''}
                {formatPercentage(Math.abs(dreData.find(d => d.id === 'expenses')?.variancePercentage || 0))} vs mês anterior
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-lg",
              (dreData.find(d => d.id === 'net-profit')?.currentMonth || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            )}>
              <p className={cn(
                "text-sm font-medium",
                (dreData.find(d => d.id === 'net-profit')?.currentMonth || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              )}>
                Resultado Líquido
              </p>
              <p className={cn(
                "text-2xl font-bold",
                (dreData.find(d => d.id === 'net-profit')?.currentMonth || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
              )}>
                {formatCurrency(dreData.find(d => d.id === 'net-profit')?.currentMonth || 0)}
              </p>
              <p className={cn(
                "text-xs mt-1",
                (dreData.find(d => d.id === 'net-profit')?.currentMonth || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              )}>
                Margem: {formatPercentage(
                  ((dreData.find(d => d.id === 'net-profit')?.currentMonth || 0) / 
                  (dreData.find(d => d.id === 'revenues')?.currentMonth || 1)) * 100
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};