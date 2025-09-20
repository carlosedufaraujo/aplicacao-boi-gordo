import React, { useMemo, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/cattlePurchaseCalculations';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, isWithinInterval as isInRange, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Check, X, TrendingUp, TrendingDown, Activity, Percent, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { categoryMappings, mapCategoryToStructured, getCategoriesBySection, getCategoriesBySubsection } from '@/config/categoryMapping';

interface StructuredCashFlowTableProps {
  data: {
    startDate: Date;
    endDate: Date;
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
  };
  currentDate: Date;
  initialBalance: number;
  onBalanceChange: (value: number) => void;
}

interface WeekData {
  startDate: Date;
  endDate: Date;
  label: string;
  entries: typeof data.entries;
}

export function StructuredCashFlowTable({ data, currentDate, initialBalance, onBalanceChange }: StructuredCashFlowTableProps) {
  const [editingBalance, setEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(initialBalance.toString());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Obter a data atual para comparação
  const today = new Date();

  // Dividir o mês em semanas baseado no currentDate
  const weeks = useMemo((): WeekData[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weeksData: WeekData[] = [];

    let currentWeekStart = startOfWeek(monthStart, { locale: ptBR });
    let weekNumber = 1;

    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { locale: ptBR });

      // Filtrar entradas da semana
      const weekEntries = data.entries.filter(entry =>
        isWithinInterval(entry.date, {
          start: currentWeekStart,
          end: currentWeekEnd
        })
      );

      weeksData.push({
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        label: `Semana ${weekNumber}`,
        entries: weekEntries
      });

      currentWeekStart = addWeeks(currentWeekStart, 1);
      weekNumber++;
    }

    return weeksData;
  }, [data, currentDate]);

  // Calcular valores por categoria e semana com mapeamento dinâmico
  const calculateCategoryValues = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    // Inicializar estrutura com categorias do mapeamento
    categoryMappings.forEach(mapping => {
      result[mapping.structuredName] = {};
      weeks.forEach(week => {
        result[mapping.structuredName][week.label] = 0;
      });
      result[mapping.structuredName]['Total'] = 0;
    });

    // Calcular valores usando mapeamento dinâmico
    weeks.forEach(week => {
      week.entries.forEach(entry => {
        // Mapear categoria do sistema para categoria estruturada
        const mappedCategory = mapCategoryToStructured(entry.category);

        if (mappedCategory) {
          const structuredName = mappedCategory.structuredName;
          result[structuredName][week.label] = (result[structuredName][week.label] || 0) + entry.amount;
          result[structuredName]['Total'] = (result[structuredName]['Total'] || 0) + entry.amount;
        } else {
          // Se não houver mapeamento, tentar categorizar genericamente
          const fallbackCategory = entry.type === 'INCOME' ? 'Outras receitas' : 'Outras despesas';
          if (result[fallbackCategory]) {
            result[fallbackCategory][week.label] = (result[fallbackCategory][week.label] || 0) + entry.amount;
            result[fallbackCategory]['Total'] = (result[fallbackCategory]['Total'] || 0) + entry.amount;
          }
        }
      });
    });

    return result;
  }, [weeks]);

  // Calcular totais
  const totals = useMemo(() => {
    const calc: Record<string, Record<string, number>> = {};

    // Total Entradas - dinâmico
    calc['TOTAL ENTRADAS'] = {};
    const entradaCategories = getCategoriesBySubsection('ENTRADAS');

    weeks.forEach(week => {
      calc['TOTAL ENTRADAS'][week.label] = entradaCategories.reduce(
        (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.[week.label] || 0), 0
      );
    });
    calc['TOTAL ENTRADAS']['Total'] = entradaCategories.reduce(
      (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.['Total'] || 0), 0
    );

    // Total Saídas - dinâmico
    calc['TOTAL SAÍDAS'] = {};
    const saidaCategories = getCategoriesBySubsection('SAIDAS');

    weeks.forEach(week => {
      calc['TOTAL SAÍDAS'][week.label] = saidaCategories.reduce(
        (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.[week.label] || 0), 0
      );
    });
    calc['TOTAL SAÍDAS']['Total'] = saidaCategories.reduce(
      (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.['Total'] || 0), 0
    );

    // Saldo Operacional
    calc['SALDO OPERACIONAL'] = {};
    weeks.forEach(week => {
      calc['SALDO OPERACIONAL'][week.label] =
        calc['TOTAL ENTRADAS'][week.label] - calc['TOTAL SAÍDAS'][week.label];
    });
    calc['SALDO OPERACIONAL']['Total'] =
      calc['TOTAL ENTRADAS']['Total'] - calc['TOTAL SAÍDAS']['Total'];

    // Saldo Financiamento - dinâmico
    calc['SALDO FINANCIAMENTO'] = {};
    const financiamentoCategories = getCategoriesBySection('FINANCIAMENTO');

    weeks.forEach(week => {
      let weekFinancing = 0;
      financiamentoCategories.forEach(cat => {
        const value = calculateCategoryValues[cat.structuredName]?.[week.label] || 0;
        // Empréstimos tomados são positivos, pagamentos e juros são negativos
        if (cat.structuredName === 'Empréstimos tomados') {
          weekFinancing += value;
        } else {
          weekFinancing -= value;
        }
      });
      calc['SALDO FINANCIAMENTO'][week.label] = weekFinancing;
    });

    let totalFinancing = 0;
    financiamentoCategories.forEach(cat => {
      const value = calculateCategoryValues[cat.structuredName]?.['Total'] || 0;
      if (cat.structuredName === 'Empréstimos tomados') {
        totalFinancing += value;
      } else {
        totalFinancing -= value;
      }
    });
    calc['SALDO FINANCIAMENTO']['Total'] = totalFinancing;

    // Saldo Investimento - dinâmico
    calc['SALDO INVESTIMENTO'] = {};
    const investimentoCategories = getCategoriesBySection('INVESTIMENTO');

    weeks.forEach(week => {
      calc['SALDO INVESTIMENTO'][week.label] = -investimentoCategories.reduce(
        (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.[week.label] || 0), 0
      );
    });
    calc['SALDO INVESTIMENTO']['Total'] = -investimentoCategories.reduce(
      (sum, cat) => sum + (calculateCategoryValues[cat.structuredName]?.['Total'] || 0), 0
    );

    // Saldo Final (acumulado)
    calc['SALDO FINAL'] = {};
    let accumulatedBalance = initialBalance;

    weeks.forEach(week => {
      const weekMovement =
        calc['SALDO OPERACIONAL'][week.label] +
        calc['SALDO FINANCIAMENTO'][week.label] +
        calc['SALDO INVESTIMENTO'][week.label];
      accumulatedBalance += weekMovement;
      calc['SALDO FINAL'][week.label] = accumulatedBalance;
    });
    calc['SALDO FINAL']['Total'] = accumulatedBalance;

    return calc;
  }, [weeks, calculateCategoryValues, initialBalance]);

  // Função para alternar expansão de categoria
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  const handleBalanceEdit = () => {
    if (editingBalance) {
      const newBalance = parseFloat(tempBalance) || 0;
      onBalanceChange(newBalance);
      setEditingBalance(false);
    } else {
      setEditingBalance(true);
    }
  };

  const cancelBalanceEdit = () => {
    setTempBalance(initialBalance.toString());
    setEditingBalance(false);
  };

  const renderRow = (
    name: string,
    type: 'header' | 'subheader' | 'item' | 'total' | 'balance',
    level: number,
    values?: Record<string, number>,
    isExpandable?: boolean,
    parentCategory?: string
  ) => {
    const rowClass = () => {
      switch (type) {
        case 'header':
      {
          return 'bg-muted/50 font-bold text-sm uppercase tracking-wide';
        case 'subheader':
      {
          return 'bg-muted/30 font-semibold text-sm';
        case 'total':
      {
          return 'bg-primary/5 dark:bg-primary/10 font-bold border-t border-b';
        case 'balance':
      {
          return 'bg-gradient-to-r from-primary/10 to-primary/5 font-bold text-lg';
        default:
          return 'hover:bg-muted/30 transition-colors';
      }
    };

    const cellClass = (value: number) => {
      if (type === 'balance' || type === 'total') {
        return value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';
      }
      if (name.includes('ENTRADAS') || name.includes('Vendas') || name.includes('receitas')) {
        return 'text-emerald-600 dark:text-emerald-400';
      }
      if (name.includes('SAÍDAS') || (values && type === 'item' && !name.includes('Empréstimos tomados'))) {
        return 'text-destructive';
      }
      return '';
    };

    const paddingClass = level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : level === 3 ? 'pl-16' : 'pl-4';
    const isExpanded = expandedCategories.has(parentCategory || name);
    const hasValues = values && Object.keys(values).some(k => values[k] !== 0);

    // Não mostrar itens se a categoria pai estiver colapsada
    if (parentCategory && !expandedCategories.has(parentCategory) && type === 'item') {
      return null;
    }

    return (
      <TableRow key={name} className={rowClass()}>
        <TableCell className={`sticky left-0 bg-background z-10 ${paddingClass} min-w-[250px]`}>
          {name === 'SALDO INICIAL' && editingBalance ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempBalance}
                onChange={(e) => setTempBalance(e.target.value)}
                className="w-32 h-8"
                step="0.01"
              />
              <Button size="icon" variant="ghost" onClick={handleBalanceEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelBalanceEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isExpandable && hasValues && (
                <button
                  onClick={() => toggleCategory(name)}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!isExpandable && type === 'item' && <span className="w-5" />}
              {name}
              {name === 'SALDO INICIAL' && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingBalance(true)}
                  className="h-6 w-6"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
        {weeks.map(week => {
          // Verificar se é a semana atual
          const isCurrentWeek = isWithinInterval(today, {
            start: week.startDate,
            end: week.endDate
          });

          return (
          <TableCell
            key={week.label}
            className={`text-right ${cellClass(values?.[week.label] || 0)} ${
              isCurrentWeek ? 'bg-primary/5 dark:bg-primary/10' : ''
            }`}
          >
            {name === 'SALDO INICIAL' && week.label === 'Semana 1' ? (
              formatCurrency(initialBalance)
            ) : values?.[week.label] ? (
              <span className={type === 'subheader' || type === 'header' ? 'font-semibold' : ''}>
                {formatCurrency(Math.abs(values[week.label]))}
              </span>
            ) : type === 'header' || type === 'subheader' ? (
              ''
            ) : (
              '-'
            )}
          </TableCell>
          );
        })}
        <TableCell className={`text-right font-bold ${cellClass(values?.['Total'] || 0)}`}>
          {name === 'SALDO INICIAL' ? (
            formatCurrency(initialBalance)
          ) : values?.['Total'] ? (
            <span className={type === 'subheader' || type === 'header' ? 'font-bold text-base' : ''}>
              {formatCurrency(Math.abs(values['Total']))}
            </span>
          ) : (
            ''
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bot\u00e3o para expandir/colapsar tudo */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (expandedCategories.size > 0) {
              setExpandedCategories(new Set());
            } else {
              setExpandedCategories(new Set(['Entradas', 'Sa\u00eddas', 'ATIVIDADES DE FINANCIAMENTO', 'ATIVIDADES DE INVESTIMENTO']));
            }
          }}
          className="flex items-center gap-2"
        >
          {expandedCategories.size > 0 ? (
            <>
              <ChevronRight className="h-4 w-4" />
              Recolher Detalhes
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expandir Detalhes
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[250px] font-semibold">
                  Categoria
                </TableHead>
                {weeks.map(week => {
                  // Verificar se a semana atual contém o dia de hoje
                  const isCurrentWeek = isWithinInterval(today, {
                    start: week.startDate,
                    end: week.endDate
                  });

                  return (
                  <TableHead
                    key={week.label}
                    className={`text-center min-w-[140px] px-3 relative ${
                      isCurrentWeek
                        ? 'bg-primary/20 dark:bg-primary/30 ring-2 ring-primary/50 ring-inset'
                        : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        {isCurrentWeek && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                        <div className="font-semibold text-foreground">
                          {week.label}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(week.startDate, 'dd/MM')} - {format(week.endDate, 'dd/MM')}
                      </div>
                      {isCurrentWeek && (
                        <div className="text-xs font-medium text-primary">
                          Semana Atual
                        </div>
                      )}
                    </div>
                  </TableHead>
                  );
                })}
                <TableHead className="text-center min-w-[140px] px-3 bg-primary/10">
                  <div className="font-bold text-foreground">Total Mês</div>
                </TableHead>
              </TableRow>
            </TableHeader>
        <TableBody>
          {renderRow('SALDO INICIAL', 'balance', 0, { 'Total': initialBalance })}

          {renderRow('ATIVIDADES OPERACIONAIS', 'header', 0)}

          {/* Entradas - Expansível com totais sempre visíveis */}
          {renderRow('Entradas', 'subheader', 1, totals['TOTAL ENTRADAS'], true)}
          {getCategoriesBySubsection('ENTRADAS').map(cat =>
            renderRow(cat.structuredName, 'item', 2, calculateCategoryValues[cat.structuredName], false, 'Entradas')
          )}

          {/* Saídas - Expansível com totais sempre visíveis */}
          {renderRow('Saídas', 'subheader', 1, totals['TOTAL SAÍDAS'], true)}
          {getCategoriesBySubsection('SAIDAS').map(cat =>
            renderRow(cat.structuredName, 'item', 2, calculateCategoryValues[cat.structuredName], false, 'Saídas')
          )}

          {renderRow('SALDO OPERACIONAL', 'total', 0, totals['SALDO OPERACIONAL'])}

          {/* Financiamento - Expansível */}
          {renderRow('ATIVIDADES DE FINANCIAMENTO', 'header', 0, totals['SALDO FINANCIAMENTO'], true)}
          {getCategoriesBySection('FINANCIAMENTO').map(cat =>
            renderRow(cat.structuredName, 'item', 1, calculateCategoryValues[cat.structuredName], false, 'ATIVIDADES DE FINANCIAMENTO')
          )}

          {/* Investimento - Expansível */}
          {renderRow('ATIVIDADES DE INVESTIMENTO', 'header', 0, totals['SALDO INVESTIMENTO'], true)}
          {getCategoriesBySection('INVESTIMENTO').map(cat =>
            renderRow(cat.structuredName, 'item', 1, calculateCategoryValues[cat.structuredName], false, 'ATIVIDADES DE INVESTIMENTO')
          )}

          {renderRow('SALDO FINAL', 'balance', 0, totals['SALDO FINAL'])}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Indicadores de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Resultado Operacional</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {totals['SALDO OPERACIONAL']['Total'] >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Entradas - Saídas operacionais</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={`text-2xl font-bold ${totals['SALDO OPERACIONAL']['Total'] >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {formatCurrency(totals['SALDO OPERACIONAL']['Total'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa de Crescimento</span>
              <Badge variant={totals['SALDO FINAL']['Total'] > initialBalance ? 'default' : 'destructive'} className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                {initialBalance > 0
                  ? `${(((totals['SALDO FINAL']['Total'] - initialBalance) / initialBalance) * 100).toFixed(1)}%`
                  : 'N/A'}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold">
                {formatCurrency(totals['SALDO FINAL']['Total'] - initialBalance)}
              </div>
              <div className="text-xs text-muted-foreground">
                De {formatCurrency(initialBalance)} para {formatCurrency(totals['SALDO FINAL']['Total'])}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Margem Operacional</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {totals['TOTAL ENTRADAS']['Total'] > 0
                        ? `${((totals['SALDO OPERACIONAL']['Total'] / totals['TOTAL ENTRADAS']['Total']) * 100).toFixed(1)}%`
                        : '0%'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Saldo Operacional / Total de Entradas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold">
                {totals['TOTAL ENTRADAS']['Total'] > 0
                  ? `${((totals['SALDO OPERACIONAL']['Total'] / totals['TOTAL ENTRADAS']['Total']) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(totals['SALDO OPERACIONAL']['Total'])} de {formatCurrency(totals['TOTAL ENTRADAS']['Total'])}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}