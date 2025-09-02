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
  Loader2,
  Wallet,
  Building2,
  TrendingUp as CashIn,
  TrendingDown as CashOut,
  Activity,
  PiggyBank,
  CreditCard
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DFCItem {
  id: string;
  description: string;
  type: 'inflow' | 'outflow' | 'total' | 'subtotal' | 'category';
  category?: 'operational' | 'investment' | 'financing';
  currentMonth: number;
  previousMonth: number;
  yearToDate: number;
  projected: number;
  variance: number;
  variancePercentage: number;
  children?: DFCItem[];
  expanded?: boolean;
  level?: number;
  isPaid?: boolean; // Para diferenciar realizado de projetado
}

interface FinancialDFCTableProps {
  expenses: any[];
  revenues: any[];
  cattlePurchases?: any[];
  saleRecords?: any[];
  costCenters: any[];
  loading?: boolean;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

export const FinancialDFCTable: React.FC<FinancialDFCTableProps> = ({
  expenses = [],
  revenues = [],
  cattlePurchases = [],
  saleRecords = [],
  costCenters = [],
  loading = false,
  period = 'current',
  onPeriodChange
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['operational', 'investment', 'financing'])
  );
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [showProjected, setShowProjected] = useState(true);
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

  // Calcular dados do DFC
  const dfcData = useMemo(() => {
    if (!revenues || !expenses) return [];

    const currentPeriod = getPeriodDates(period);
    const previousPeriod = getPeriodDates('previous');

    // Filtrar por centro de custo
    const filterByCostCenter = (items: any[]) => {
      if (selectedCostCenter === 'all') return items;
      return items.filter(item => item.costCenterId === selectedCostCenter);
    };

    // Separar realizados de projetados
    const filterByStatus = (items: any[], isPaid: boolean) => {
      return items.filter(item => {
        if ('isPaid' in item) return item.isPaid === isPaid;
        if ('isReceived' in item) return item.isReceived === isPaid;
        return false;
      });
    };

    // ENTRADAS - Atividades Operacionais
    const currentReceipts = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= currentPeriod.start && revDate <= currentPeriod.end && rev.isReceived;
    }));

    const previousReceipts = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.receivedDate || rev.dueDate || rev.createdAt);
      return revDate >= previousPeriod.start && revDate <= previousPeriod.end && rev.isReceived;
    }));

    const projectedReceipts = filterByCostCenter(revenues.filter(rev => {
      const revDate = new Date(rev.dueDate || rev.createdAt);
      return revDate >= currentPeriod.start && revDate <= currentPeriod.end && !rev.isReceived;
    }));

    // SAÍDAS - Atividades Operacionais
    const currentPayments = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.paymentDate || exp.dueDate || exp.createdAt);
      return expDate >= currentPeriod.start && expDate <= currentPeriod.end && exp.isPaid;
    }));

    const previousPayments = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.paymentDate || exp.dueDate || exp.createdAt);
      return expDate >= previousPeriod.start && expDate <= previousPeriod.end && exp.isPaid;
    }));

    const projectedPayments = filterByCostCenter(expenses.filter(exp => {
      const expDate = new Date(exp.dueDate || exp.createdAt);
      return expDate >= currentPeriod.start && expDate <= currentPeriod.end && !exp.isPaid;
    }));

    // VENDAS DE GADO (Entradas Operacionais)
    const currentSales = saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.paymentDate || sale.saleDate || sale.createdAt);
      return saleDate >= currentPeriod.start && saleDate <= currentPeriod.end && sale.isPaid;
    });

    const previousSales = saleRecords.filter((sale: any) => {
      const saleDate = new Date(sale.paymentDate || sale.saleDate || sale.createdAt);
      return saleDate >= previousPeriod.start && saleDate <= previousPeriod.end && sale.isPaid;
    });

    // COMPRAS DE GADO (Saídas de Investimento)
    const currentPurchases = cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.paymentDate || purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= currentPeriod.start && purchaseDate <= currentPeriod.end;
    });

    const previousPurchases = cattlePurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.paymentDate || purchase.purchaseDate || purchase.createdAt);
      return purchaseDate >= previousPeriod.start && purchaseDate <= previousPeriod.end;
    });

    // Agrupar por categorias de fluxo de caixa
    const groupByCashFlowCategory = (items: any[], type: 'inflow' | 'outflow') => {
      const categories: Record<string, { current: number, previous: number, ytd: number, projected: number }> = {};

      items.forEach(item => {
        const cat = item.category || 'Outros';
        if (!categories[cat]) {
          categories[cat] = { current: 0, previous: 0, ytd: 0, projected: 0 };
        }
        
        // Somente valores efetivamente pagos/recebidos
        if ((type === 'inflow' && item.isReceived) || (type === 'outflow' && item.isPaid)) {
          const itemDate = new Date(item.paymentDate || item.receivedDate || item.dueDate);
          
          if (itemDate >= currentPeriod.start && itemDate <= currentPeriod.end) {
            categories[cat].current += item.value || item.purchaseValue || item.receivedValue || item.paidValue || 0;
          }
          
          if (itemDate >= previousPeriod.start && itemDate <= previousPeriod.end) {
            categories[cat].previous += item.value || item.purchaseValue || item.receivedValue || item.paidValue || 0;
          }
          
          if (itemDate.getFullYear() === new Date().getFullYear()) {
            categories[cat].ytd += item.value || item.purchaseValue || item.receivedValue || item.paidValue || 0;
          }
        } else {
          // Valores projetados (não pagos/recebidos)
          const itemDate = new Date(item.dueDate || item.createdAt);
          if (itemDate >= currentPeriod.start && itemDate <= currentPeriod.end) {
            categories[cat].projected += item.value || item.purchaseValue || 0;
          }
        }
      });

      return categories;
    };

    // Calcular totais
    const currentReceiptsTotal = currentReceipts.reduce((sum, rev) => 
      sum + (rev.receivedValue || rev.value || 0), 0);
    const currentSalesTotal = currentSales.reduce((sum, sale) => 
      sum + (sale.receivedValue || sale.totalValue || sale.saleValue || 0), 0);
    const currentPaymentsTotal = currentPayments.reduce((sum, exp) => 
      sum + (exp.paidValue || exp.value || exp.purchaseValue || 0), 0);
    const currentPurchasesTotal = currentPurchases.reduce((sum, purchase) => 
      sum + (purchase.paidValue || purchase.purchaseValue || 0), 0);

    const previousReceiptsTotal = previousReceipts.reduce((sum, rev) => 
      sum + (rev.receivedValue || rev.value || 0), 0);
    const previousSalesTotal = previousSales.reduce((sum, sale) => 
      sum + (sale.receivedValue || sale.totalValue || sale.saleValue || 0), 0);
    const previousPaymentsTotal = previousPayments.reduce((sum, exp) => 
      sum + (exp.paidValue || exp.value || exp.purchaseValue || 0), 0);
    const previousPurchasesTotal = previousPurchases.reduce((sum, purchase) => 
      sum + (purchase.paidValue || purchase.purchaseValue || 0), 0);

    const projectedReceiptsTotal = projectedReceipts.reduce((sum, rev) => 
      sum + (rev.value || 0), 0);
    const projectedPaymentsTotal = projectedPayments.reduce((sum, exp) => 
      sum + (exp.value || exp.purchaseValue || 0), 0);

    // Year-to-Date (somente valores realizados)
    const yearToDateReceipts = revenues.filter(rev => rev.isReceived).reduce((sum, rev) => {
      const revDate = new Date(rev.receivedDate || rev.createdAt);
      return revDate.getFullYear() === new Date().getFullYear() 
        ? sum + (rev.receivedValue || rev.value || 0) : sum;
    }, 0);

    const yearToDatePayments = expenses.filter(exp => exp.isPaid).reduce((sum, exp) => {
      const expDate = new Date(exp.paymentDate || exp.createdAt);
      return expDate.getFullYear() === new Date().getFullYear() 
        ? sum + (exp.paidValue || exp.value || exp.purchaseValue || 0) : sum;
    }, 0);

    const yearToDateSales = saleRecords.filter((sale: any) => sale.isPaid).reduce((sum, sale) => {
      const saleDate = new Date(sale.paymentDate || sale.saleDate || sale.createdAt);
      return saleDate.getFullYear() === new Date().getFullYear() 
        ? sum + (sale.receivedValue || sale.totalValue || sale.saleValue || 0) : sum;
    }, 0);

    const yearToDatePurchases = cattlePurchases.reduce((sum, purchase) => {
      const purchaseDate = new Date(purchase.paymentDate || purchase.purchaseDate || purchase.createdAt);
      return purchaseDate.getFullYear() === new Date().getFullYear() 
        ? sum + (purchase.paidValue || purchase.purchaseValue || 0) : sum;
    }, 0);

    // Calcular variações
    const calculateVariance = (current: number, previous: number) => ({
      variance: current - previous,
      variancePercentage: previous > 0 ? ((current - previous) / previous) * 100 : 0
    });

    // Agrupar categorias de entradas e saídas
    const inflowCategories = groupByCashFlowCategory(revenues, 'inflow');
    const outflowCategories = groupByCashFlowCategory(expenses, 'outflow');

    // Fluxo operacional
    const operationalInflow = currentReceiptsTotal + currentSalesTotal;
    const operationalOutflow = currentPaymentsTotal;
    const operationalNet = operationalInflow - operationalOutflow;

    // Fluxo de investimento
    const investmentOutflow = currentPurchasesTotal;
    const investmentNet = -investmentOutflow;

    // Fluxo de financiamento (exemplo - pode incluir empréstimos, aportes, etc)
    const financingInflow = 0; // Adicionar quando houver dados de financiamento
    const financingOutflow = 0;
    const financingNet = financingInflow - financingOutflow;

    // Estruturar dados DFC
    const dfcItems: DFCItem[] = [
      {
        id: 'operational',
        description: 'ATIVIDADES OPERACIONAIS',
        type: 'category',
        category: 'operational',
        currentMonth: operationalNet,
        previousMonth: (previousReceiptsTotal + previousSalesTotal) - previousPaymentsTotal,
        yearToDate: (yearToDateReceipts + yearToDateSales) - yearToDatePayments,
        projected: projectedReceiptsTotal - projectedPaymentsTotal,
        ...calculateVariance(operationalNet, (previousReceiptsTotal + previousSalesTotal) - previousPaymentsTotal),
        children: [
          {
            id: 'operational-inflows',
            description: 'Entradas Operacionais',
            type: 'subtotal',
            currentMonth: operationalInflow,
            previousMonth: previousReceiptsTotal + previousSalesTotal,
            yearToDate: yearToDateReceipts + yearToDateSales,
            projected: projectedReceiptsTotal,
            ...calculateVariance(operationalInflow, previousReceiptsTotal + previousSalesTotal),
            level: 1,
            children: [
              {
                id: 'sales-receipts',
                description: 'Recebimento de Vendas de Gado',
                type: 'inflow',
                currentMonth: currentSalesTotal,
                previousMonth: previousSalesTotal,
                yearToDate: yearToDateSales,
                projected: 0,
                ...calculateVariance(currentSalesTotal, previousSalesTotal),
                level: 2
              },
              ...Object.entries(inflowCategories).map(([cat, values]) => ({
                id: `inflow-${cat}`,
                description: cat,
                type: 'inflow' as const,
                currentMonth: values.current,
                previousMonth: values.previous,
                yearToDate: values.ytd,
                projected: values.projected,
                ...calculateVariance(values.current, values.previous),
                level: 2
              })).filter(item => item.currentMonth > 0 || item.previousMonth > 0 || item.yearToDate > 0)
            ]
          },
          {
            id: 'operational-outflows',
            description: 'Saídas Operacionais',
            type: 'subtotal',
            currentMonth: -operationalOutflow,
            previousMonth: -previousPaymentsTotal,
            yearToDate: -yearToDatePayments,
            projected: -projectedPaymentsTotal,
            ...calculateVariance(-operationalOutflow, -previousPaymentsTotal),
            level: 1,
            children: Object.entries(outflowCategories).map(([cat, values]) => ({
              id: `outflow-${cat}`,
              description: cat,
              type: 'outflow' as const,
              currentMonth: -values.current,
              previousMonth: -values.previous,
              yearToDate: -values.ytd,
              projected: -values.projected,
              ...calculateVariance(-values.current, -values.previous),
              level: 2
            })).filter(item => item.currentMonth < 0 || item.previousMonth < 0 || item.yearToDate < 0)
          }
        ]
      },
      {
        id: 'investment',
        description: 'ATIVIDADES DE INVESTIMENTO',
        type: 'category',
        category: 'investment',
        currentMonth: investmentNet,
        previousMonth: -previousPurchasesTotal,
        yearToDate: -yearToDatePurchases,
        projected: 0,
        ...calculateVariance(investmentNet, -previousPurchasesTotal),
        children: [
          {
            id: 'cattle-purchases',
            description: 'Compra de Gado',
            type: 'outflow',
            currentMonth: -currentPurchasesTotal,
            previousMonth: -previousPurchasesTotal,
            yearToDate: -yearToDatePurchases,
            projected: 0,
            ...calculateVariance(-currentPurchasesTotal, -previousPurchasesTotal),
            level: 1
          }
        ]
      },
      {
        id: 'financing',
        description: 'ATIVIDADES DE FINANCIAMENTO',
        type: 'category',
        category: 'financing',
        currentMonth: financingNet,
        previousMonth: 0,
        yearToDate: 0,
        projected: 0,
        ...calculateVariance(0, 0),
        children: []
      },
      {
        id: 'net-cashflow',
        description: 'VARIAÇÃO LÍQUIDA DE CAIXA',
        type: 'total',
        currentMonth: operationalNet + investmentNet + financingNet,
        previousMonth: ((previousReceiptsTotal + previousSalesTotal) - previousPaymentsTotal) - previousPurchasesTotal,
        yearToDate: ((yearToDateReceipts + yearToDateSales) - yearToDatePayments) - yearToDatePurchases,
        projected: projectedReceiptsTotal - projectedPaymentsTotal,
        ...calculateVariance(
          operationalNet + investmentNet + financingNet,
          ((previousReceiptsTotal + previousSalesTotal) - previousPaymentsTotal) - previousPurchasesTotal
        )
      }
    ];

    return dfcItems;
  }, [expenses, revenues, cattlePurchases, saleRecords, period, selectedCostCenter, showProjected]);

  // Renderizar linha da tabela
  const renderRow = (item: DFCItem, index: number) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const indent = (item.level || 0) * 24;

    return (
      <React.Fragment key={item.id}>
        <TableRow
          className={cn(
            'hover:bg-gray-50 transition-colors',
            item.type === 'total' && 'bg-blue-50 font-bold',
            item.type === 'category' && 'bg-gray-100 font-semibold',
            item.type === 'subtotal' && 'bg-gray-50 font-medium'
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
              {item.category === 'operational' && item.level === 0 && <Activity className="h-4 w-4 text-blue-500" />}
              {item.category === 'investment' && item.level === 0 && <Building2 className="h-4 w-4 text-purple-500" />}
              {item.category === 'financing' && item.level === 0 && <CreditCard className="h-4 w-4 text-orange-500" />}
              {item.type === 'inflow' && <CashIn className="h-3 w-3 text-green-500" />}
              {item.type === 'outflow' && <CashOut className="h-3 w-3 text-red-500" />}
              <span className={cn(
                item.type === 'total' && 'text-base font-bold',
                item.type === 'category' && 'text-sm font-semibold',
                item.type === 'subtotal' && 'text-sm font-medium',
                item.level === 2 && 'text-sm'
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
              {item.currentMonth < 0 && ' (-)'}
            </span>
          </TableCell>

          <TableCell className="text-right text-gray-600">
            {formatCurrency(Math.abs(item.previousMonth))}
            {item.previousMonth < 0 && ' (-)'}
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
            {item.yearToDate < 0 && ' (-)'}
          </TableCell>

          {showProjected && (
            <TableCell className="text-right">
              <span className="text-blue-600 italic">
                {formatCurrency(Math.abs(item.projected))}
                {item.projected < 0 && ' (-)'}
              </span>
            </TableCell>
          )}

          <TableCell className="text-right">
            <span className={cn(
              'font-semibold',
              (item.currentMonth + item.projected) > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(Math.abs(item.currentMonth + item.projected))}
            </span>
          </TableCell>
        </TableRow>

        {hasChildren && isExpanded && item.children?.map((child, childIndex) => renderRow(child, childIndex))}
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
              <Wallet className="h-5 w-5" />
              Demonstração de Fluxo de Caixa (DFC)
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Movimentações de caixa por atividades operacionais, investimento e financiamento
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
              onClick={() => setShowProjected(!showProjected)}
              className="flex items-center gap-2"
            >
              <PiggyBank className="h-4 w-4" />
              {showProjected ? 'Ocultar Projeções' : 'Mostrar Projeções'}
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
                <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[300px]">Descrição</TableHead>
                <TableHead className="text-right min-w-[120px]">Realizado Atual</TableHead>
                <TableHead className="text-right min-w-[120px]">Realizado Anterior</TableHead>
                <TableHead className="text-right min-w-[120px]">Variação R$</TableHead>
                <TableHead className="text-right min-w-[100px]">Variação %</TableHead>
                <TableHead className="text-right min-w-[120px]">Acumulado Ano</TableHead>
                {showProjected && (
                  <TableHead className="text-right min-w-[120px] text-blue-600">Projetado</TableHead>
                )}
                <TableHead className="text-right min-w-[120px]">Total Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dfcData.map((item, index) => renderRow(item, index))}
            </TableBody>
          </Table>
        </div>

        {/* Resumo do Fluxo de Caixa */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-600 font-medium">Fluxo Operacional</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(dfcData.find(d => d.id === 'operational')?.currentMonth || 0)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {dfcData.find(d => d.id === 'operational')?.variancePercentage || 0 > 0 ? '+' : ''}
                {formatPercentage(dfcData.find(d => d.id === 'operational')?.variancePercentage || 0)} vs anterior
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                <p className="text-sm text-purple-600 font-medium">Fluxo de Investimento</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(dfcData.find(d => d.id === 'investment')?.currentMonth || 0)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Compras de gado e ativos
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-orange-600 font-medium">Fluxo de Financiamento</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(dfcData.find(d => d.id === 'financing')?.currentMonth || 0)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Empréstimos e aportes
              </p>
            </div>

            <div className={cn(
              "p-4 rounded-lg",
              (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={cn(
                  "h-4 w-4",
                  (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )} />
                <p className={cn(
                  "text-sm font-medium",
                  (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  Variação Líquida
                </p>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'text-green-700' : 'text-red-700'
              )}>
                {formatCurrency(dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0)}
              </p>
              <p className={cn(
                "text-xs mt-1",
                (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {(dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'Geração de caixa' : 'Consumo de caixa'}
              </p>
            </div>
          </div>

          {/* Indicadores de Liquidez */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Indicadores de Liquidez</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Saldo Inicial</p>
                <p className="text-lg font-semibold">R$ 0,00</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Movimentação do Período</p>
                <p className={cn(
                  "text-lg font-semibold",
                  (dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Saldo Final Projetado</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency((dfcData.find(d => d.id === 'net-cashflow')?.currentMonth || 0) + 
                                 (dfcData.find(d => d.id === 'net-cashflow')?.projected || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};