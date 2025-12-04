import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Save,
  RefreshCw,
  AlertCircle,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachWeekOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/cattlePurchaseCalculations';
import { useCashFlow } from '@/hooks/useCashFlow';
import { useFinancialData } from '@/providers/FinancialDataProvider';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  data: CashFlowLineItem[];
}

interface MonthData {
  month: number;
  year: number;
  weeks: WeekData[];
  consolidated: CashFlowLineItem[];
}

interface CashFlowLineItem {
  category: string;
  subcategory?: string;
  type: 'header' | 'income' | 'expense' | 'financing' | 'investment' | 'balance';
  values: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    total: number;
  };
  editable?: boolean;
  formula?: string;
}

export function WeeklyCashFlow() {
  const { cashFlows, loading: cashFlowLoading, fetchCashFlows } = useCashFlow();
  const { purchases, sales, expenses, revenues, loading: financialLoading, refresh: refreshFinancial } = useFinancialData();

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editMode, setEditMode] = useState(false);
  const [projectionMonths, setProjectionMonths] = useState(3);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  const loading = cashFlowLoading || financialLoading;

  // Estrutura base do fluxo de caixa
  const cashFlowStructure: CashFlowLineItem[] = [
    // Saldo Inicial
    {
      category: 'SALDO INICIAL',
      type: 'balance',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },

    // Atividades Operacionais - Header
    {
      category: 'ATIVIDADES OPERACIONAIS',
      type: 'header',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
    },

    // Ingressos
    {
      category: 'Ingressos',
      type: 'header',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
    },
    {
      category: 'Vendas à vista',
      subcategory: 'ingressos',
      type: 'income',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Recebimentos de vendas a prazo',
      subcategory: 'ingressos',
      type: 'income',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },

    // Desembolsos
    {
      category: 'Desembolsos',
      type: 'header',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
    },
    {
      category: 'Salários + Férias + Tributos sociais',
      subcategory: 'desembolsos',
      type: 'expense',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Desp. Admin',
      subcategory: 'desembolsos',
      type: 'expense',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Fornecedores',
      subcategory: 'desembolsos',
      type: 'expense',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Impostos e vendas',
      subcategory: 'desembolsos',
      type: 'expense',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Outros gastos indiretos',
      subcategory: 'desembolsos',
      type: 'expense',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },

    // Atividades de Financiamento
    {
      category: 'ATIVIDADES DE FINANCIAMENTO',
      type: 'header',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
    },
    {
      category: 'Pagamento empréstimo - principal',
      subcategory: 'financiamento',
      type: 'financing',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },
    {
      category: 'Pagamento empréstimo - juros',
      subcategory: 'financiamento',
      type: 'financing',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },

    // Atividades de Investimento
    {
      category: 'ATIVIDADES DE INVESTIMENTO',
      type: 'header',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 }
    },
    {
      category: 'Compra de venda de Imobilizado',
      subcategory: 'investimento',
      type: 'investment',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      editable: true
    },

    // Saldo Projetado
    {
      category: 'Saldo Projetado de Contas',
      type: 'balance',
      values: { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
      formula: 'calculated'
    }
  ];

  // Processar dados reais do sistema
  const processRealData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Obter semanas do mês
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { locale: ptBR }
    );

    // Inicializar estrutura com zeros
    const processedData = JSON.parse(JSON.stringify(cashFlowStructure));

    // Processar vendas (receitas)
    if (sales) {
      sales.forEach(sale => {
        const saleDate = new Date(sale.saleDate);
        if (isWithinInterval(saleDate, { start: monthStart, end: monthEnd })) {
          const weekIndex = weeks.findIndex(weekStart =>
            isWithinInterval(saleDate, {
              start: weekStart,
              end: endOfWeek(weekStart, { locale: ptBR })
            })
          );

          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `week${weekIndex + 1}` as keyof typeof processedData[0]['values'];

            // Vendas à vista
            const vendasItem = processedData.find(item => item.category === 'Vendas à vista');
            if (vendasItem && sale.paymentStatus === 'PAID') {
              vendasItem.values[weekKey] += sale.totalValue || 0;
            }

            // Vendas a prazo
            const recebimentosItem = processedData.find(item => item.category === 'Recebimentos de vendas a prazo');
            if (recebimentosItem && sale.paymentStatus === 'PENDING') {
              recebimentosItem.values[weekKey] += sale.totalValue || 0;
            }
          }
        }
      });
    }

    // Processar compras (despesas)
    if (purchases) {
      purchases.forEach(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate);
        if (isWithinInterval(purchaseDate, { start: monthStart, end: monthEnd })) {
          const weekIndex = weeks.findIndex(weekStart =>
            isWithinInterval(purchaseDate, {
              start: weekStart,
              end: endOfWeek(weekStart, { locale: ptBR })
            })
          );

          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `week${weekIndex + 1}` as keyof typeof processedData[0]['values'];

            const fornecedoresItem = processedData.find(item => item.category === 'Fornecedores');
            if (fornecedoresItem) {
              fornecedoresItem.values[weekKey] += purchase.totalValue || 0;
            }
          }
        }
      });
    }

    // Processar despesas gerais
    if (expenses) {
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date || expense.createdAt);
        if (isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
          const weekIndex = weeks.findIndex(weekStart =>
            isWithinInterval(expenseDate, {
              start: weekStart,
              end: endOfWeek(weekStart, { locale: ptBR })
            })
          );

          if (weekIndex >= 0 && weekIndex < 4) {
            const weekKey = `week${weekIndex + 1}` as keyof typeof processedData[0]['values'];

            // Categorizar despesas
            const description = expense.description?.toLowerCase() || '';
            let targetItem;

            if (description.includes('salário') || description.includes('folha')) {
              targetItem = processedData.find(item => item.category.includes('Salários'));
            } else if (description.includes('admin')) {
              targetItem = processedData.find(item => item.category === 'Desp. Admin');
            } else if (description.includes('imposto') || description.includes('tributo')) {
              targetItem = processedData.find(item => item.category === 'Impostos e vendas');
            } else {
              targetItem = processedData.find(item => item.category === 'Outros gastos indiretos');
            }

            if (targetItem) {
              targetItem.values[weekKey] += expense.totalAmount || expense.amount || 0;
            }
          }
        }
      });
    }

    // Calcular totais
    processedData.forEach(item => {
      if (item.type !== 'header' && item.formula !== 'calculated') {
        item.values.total = item.values.week1 + item.values.week2 + item.values.week3 + item.values.week4;
      }
    });

    // Calcular totais de headers
    const ingressosTotal = processedData.find(item => item.category === 'Ingressos');
    if (ingressosTotal) {
      const ingressosItems = processedData.filter(item => item.subcategory === 'ingressos');
      ['week1', 'week2', 'week3', 'week4', 'total'].forEach(week => {
        ingressosTotal.values[week as keyof typeof ingressosTotal.values] =
          ingressosItems.reduce((sum, item) => sum + item.values[week as keyof typeof item.values], 0);
      });
    }

    const desembolsosTotal = processedData.find(item => item.category === 'Desembolsos');
    if (desembolsosTotal) {
      const desembolsosItems = processedData.filter(item => item.subcategory === 'desembolsos');
      ['week1', 'week2', 'week3', 'week4', 'total'].forEach(week => {
        desembolsosTotal.values[week as keyof typeof desembolsosTotal.values] =
          desembolsosItems.reduce((sum, item) => sum + item.values[week as keyof typeof item.values], 0);
      });
    }

    // Calcular saldo projetado
    const saldoProjetado = processedData.find(item => item.category === 'Saldo Projetado de Contas');
    const saldoInicial = processedData.find(item => item.category === 'SALDO INICIAL');

    if (saldoProjetado && saldoInicial && ingressosTotal && desembolsosTotal) {
      let saldoAcumulado = saldoInicial.values.week1;

      ['week1', 'week2', 'week3', 'week4'].forEach(week => {
        const weekKey = week as keyof typeof saldoProjetado.values;
        const ingressos = ingressosTotal.values[weekKey];
        const desembolsos = desembolsosTotal.values[weekKey];
        const financiamento = processedData
          .filter(item => item.subcategory === 'financiamento')
          .reduce((sum, item) => sum + item.values[weekKey], 0);
        const investimento = processedData
          .filter(item => item.subcategory === 'investimento')
          .reduce((sum, item) => sum + item.values[weekKey], 0);

        saldoAcumulado = saldoAcumulado + ingressos - desembolsos - financiamento - investimento;
        saldoProjetado.values[weekKey] = saldoAcumulado;
      });

      saldoProjetado.values.total = saldoProjetado.values.week4;
    }

    return processedData;
  }, [selectedMonth, sales, purchases, expenses, cashFlows, editedValues]);

  // Função para editar valor
  const handleValueEdit = (category: string, week: string, value: number) => {
    const key = `${category}-${week}`;
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Função para salvar alterações
  const handleSave = async () => {
    // Implementar salvamento
    console.log('Salvando alterações:', editedValues);
    setEditMode(false);
  };

  // Função para exportar Excel
  const handleExportExcel = () => {
    // Implementar exportação
    console.log('Exportando para Excel');
  };

  // Função para imprimir
  const handlePrint = () => {
    window.print();
  };

  // Renderizar célula de valor
  const renderValueCell = (item: CashFlowLineItem, week: keyof typeof item.values, weekIndex?: number) => {
    const value = item.values[week];
    const isNegative = value < 0;
    const key = `${item.category}-${week}`;
    const editedValue = editedValues[key];
    const displayValue = editedValue !== undefined ? editedValue : value;

    if (item.type === 'header') {
      return (
        <TableCell className="text-right font-semibold bg-gray-50 dark:bg-gray-800">
          {formatCurrency(Math.abs(displayValue))}
        </TableCell>
      );
    }

    if (editMode && item.editable) {
      return (
        <TableCell className="p-0">
          <Input
            type="number"
            className="w-full h-full border-0 text-right text-sm"
            defaultValue={displayValue}
            onChange={(e) => handleValueEdit(item.category, week.toString(), parseFloat(e.target.value) || 0)}
          />
        </TableCell>
      );
    }

    return (
      <TableCell className={cn(
        "text-right",
        isNegative && "text-red-600 dark:text-red-400",
        item.type === 'balance' && "font-semibold bg-blue-50 dark:bg-blue-950/20"
      )}>
        {isNegative && '('}
        {formatCurrency(Math.abs(displayValue))}
        {isNegative && ')'}
      </TableCell>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-xl font-semibold">
              Fluxo de Caixa - {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? <Save className="h-4 w-4 mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
              {editMode ? 'Salvar' : 'Editar'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>

            <Select value={projectionMonths.toString()} onValueChange={(v) => setProjectionMonths(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {editMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Modo de edição ativado. Clique nos valores para editar e depois em "Salvar" para confirmar as alterações.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabela de Fluxo de Caixa */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10 min-w-[250px]">
                    Categoria
                  </TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800">1ª Semana</TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800">2ª Semana</TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800">3ª Semana</TableHead>
                  <TableHead className="text-center bg-gray-50 dark:bg-gray-800">4ª Semana</TableHead>
                  <TableHead className="text-center bg-blue-50 dark:bg-blue-950/20 font-semibold">
                    Consolidado Mês
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processRealData.map((item, index) => (
                  <TableRow key={index} className={cn(
                    item.type === 'header' && "bg-gray-50 dark:bg-gray-800",
                    item.type === 'balance' && "bg-blue-50 dark:bg-blue-950/20"
                  )}>
                    <TableCell className={cn(
                      "sticky left-0 bg-white dark:bg-gray-950 z-10",
                      item.type === 'header' && "font-semibold bg-gray-50 dark:bg-gray-800",
                      item.type === 'balance' && "font-semibold bg-blue-50 dark:bg-blue-950/20",
                      item.subcategory && "pl-8"
                    )}>
                      {item.type === 'income' && <TrendingUp className="inline h-3 w-3 mr-2 text-green-600" />}
                      {item.type === 'expense' && <TrendingDown className="inline h-3 w-3 mr-2 text-red-600" />}
                      {item.type === 'balance' && <DollarSign className="inline h-3 w-3 mr-2 text-blue-600" />}
                      {item.category}
                    </TableCell>
                    {renderValueCell(item, 'week1', 0)}
                    {renderValueCell(item, 'week2', 1)}
                    {renderValueCell(item, 'week3', 2)}
                    {renderValueCell(item, 'week4', 3)}
                    {renderValueCell(item, 'total')}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            <span>Ingressos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
            <span>Desembolsos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>Saldo</span>
          </div>
        </div>
        <span className="text-xs">
          * Valores em parênteses indicam valores negativos
        </span>
      </div>
    </div>
  );
}