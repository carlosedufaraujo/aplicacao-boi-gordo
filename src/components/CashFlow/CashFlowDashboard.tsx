import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Building2,
  PieChart,
  Wallet,
  Settings2,
  Check,
  X
} from 'lucide-react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashFlowForm from './CashFlowForm';
import { SimpleIntegratedAnalysis } from '@/components/FinancialAnalysis/SimpleIntegratedAnalysis';
import { ExpandedCashFlow } from '@/components/Financial/ExpandedCashFlow';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import StatusChangeButton from './StatusChangeButton';
import { categoryService } from '@/services/categoryService';
import { useEffect } from 'react';

import { useSafeToast } from '@/hooks/useSafeToast';
export const CashFlowDashboard: React.FC = () => {
  const toast = useSafeToast();

  const [showForm, setShowForm] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAccountBalance, setEditingAccountBalance] = useState<{ id: string; balance: number } | null>(null);
  const [, forceUpdate] = useState({});
  // Subscribe to category changes for real-time updates
  useEffect(() => {
    const unsubscribe = categoryService.addChangeListener(() => {
      forceUpdate({}); // Force component re-render when categories change
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  const {
    cashFlows,
    summary,
    categories,
    accounts,
    loading,
    fetchCashFlows,
    createCashFlow,
    updateCashFlow,
    deleteCashFlow,
    updateStatus,
  } = useCashFlow();

  // Integrações adicionais - SEM useCattlePurchasesApi (não existia na versão correta)
  const { accounts: payerAccounts } = usePayerAccountsApi();
  
  // Calcular saldos reais baseados nas movimentações
  const accountBalances = useMemo(() => {
    if (!payerAccounts || !cashFlows) return [];
    
    return payerAccounts.map(account => {
      // Usar saldo inicial 0 se não existir
      const initialBalance = account.initialBalance ?? 0;
      
      // Filtrar movimentações desta conta que já foram pagas/recebidas
      const accountTransactions = cashFlows.filter(cf => 
        cf.accountId === account.id && 
        (cf.status === 'PAID' || cf.status === 'RECEIVED')
      );
      
      // Calcular o saldo baseado nas transações
      const balance = accountTransactions.reduce((sum, transaction) => {
        if (transaction.type === 'INCOME') {
          return sum + transaction.amount;
        } else {
          return sum - transaction.amount;
        }
      }, initialBalance);
      
      return {
        ...account,
        initialBalance: initialBalance,
        calculatedBalance: balance
      };
    });
  }, [payerAccounts, cashFlows]);
  
  // Simular dados de próximos vencimentos até ter API real
  const upcomingDueDates = useMemo(() => {
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return cashFlows
      ?.filter(cf => {
        const dueDate = new Date(cf.dueDate || cf.date);
        return cf.status === 'PENDING' && dueDate >= today && dueDate <= next30Days;
      })
      .sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime())
      .slice(0, 5)
      .map(cf => ({
        id: cf.id,
        title: cf.description,
        date: cf.dueDate || cf.date,
        amount: cf.amount,
        type: cf.type,
        status: new Date(cf.dueDate || cf.date) < today ? 'overdue' : 'pending'
      }));
  }, [cashFlows]);

  const handleSubmit = async (data: any) => {
    try {
      if (editingCashFlow) {
        await updateCashFlow(editingCashFlow.id, data);
      } else {
        await createCashFlow(data);
      }
      setShowForm(false);
      setEditingCashFlow(null);
    } catch (_error) {
      console.error('Erro ao salvar movimentação:', error);
      toast.error('Não foi possível salvar a movimentação. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (cashFlow: any) => {
    setEditingCashFlow(cashFlow);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    setIsDeleting(true);
    try {
      await deleteCashFlow(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (_error) {
      toast.error('Não foi possível excluir a movimentação. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const paymentDate = status === 'PAID' || status === 'RECEIVED' 
      ? new Date().toISOString() 
      : undefined;
    await updateStatus(id, status, paymentDate);
  };

  // Filtrar movimentações por tipo para as abas
  const filteredCashFlows = useMemo(() => {
    
    return {
      all: cashFlows || [],
      income: cashFlows?.filter(flow => flow.type === 'INCOME') || [],
      expense: cashFlows?.filter(flow => flow.type === 'EXPENSE') || []
    };
  }, [cashFlows]);
  // Componente da Tabela de Movimentações - Reformulado
  const CashFlowTable = ({ data, type }: { data: any[], type: 'all' | 'income' | 'expense' }) => {

    // Função para obter o ícone e cor da categoria
    const getCategoryDisplay = (cashFlow: any) => {
      // Buscar categoria dinamicamente do CategoryService
      let category = null;
      let categoryName = '';

      // Tentar buscar pelo categoryId ou código da categoria
      if (cashFlow.categoryId) {
        category = categoryService.getById(cashFlow.categoryId) || categoryService.getByCode(cashFlow.categoryId);
      }

      // Se não encontrou, tentar pelo nome da categoria
      if (!category && cashFlow.category) {
        const categoryValue = typeof cashFlow.category === 'string' ? cashFlow.category : cashFlow.category.name;
        category = categoryService.getByCode(categoryValue);
        if (!category) {
          // Buscar pelo nome se não encontrou pelo código
          const allCategories = categoryService.getAll();
          category = allCategories.find(cat => cat.name === categoryValue);
        }
      }

      // Definir o nome da categoria
      if (category) {
        categoryName = category.name;
      } else if (cashFlow.category) {
        categoryName = typeof cashFlow.category === 'string' ? cashFlow.category : cashFlow.category.name;
      }

      // Mapear cores baseado no tipo e centro de custo da categoria
      const getColorByCategory = (cat: any) => {
        if (!cat) return 'bg-gray-100 text-gray-700 border-gray-300';

        // Usar a cor da categoria se estiver definida
        if (cat.color && cat.color !== '#6B7280') {
          // Converter cor hex para classes Tailwind aproximadas
          const colorMap: Record<string, string> = {
            '#EF4444': 'bg-red-100 text-red-800 border-red-300',
            '#F59E0B': 'bg-amber-100 text-amber-800 border-amber-300',
            '#10B981': 'bg-green-100 text-green-800 border-green-300',
            '#6B7280': 'bg-gray-100 text-gray-700 border-gray-300',
            '#84CC16': 'bg-lime-100 text-lime-800 border-lime-300',
            '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-300',
            '#8B5CF6': 'bg-violet-100 text-violet-800 border-violet-300',
            '#DC2626': 'bg-red-100 text-red-800 border-red-300',
            '#F97316': 'bg-orange-100 text-orange-800 border-orange-300',
            '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-300',
            '#EC4899': 'bg-pink-100 text-pink-800 border-pink-300',
            '#14B8A6': 'bg-teal-100 text-teal-800 border-teal-300',
            '#6366F1': 'bg-indigo-100 text-indigo-800 border-indigo-300'
          };

          return colorMap[cat.color] || 'bg-gray-100 text-gray-700 border-gray-300';
        }

        // Cores padrão baseadas no tipo
        if (cat.type === 'INCOME') {
          return 'bg-green-100 text-green-800 border-green-300';
        } else {
          // Cores por centro de custo para despesas
          const costCenterColors: Record<string, string> = {
            'acquisition': 'bg-red-100 text-red-800 border-red-300',
            'fattening': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'administrative': 'bg-blue-100 text-blue-800 border-blue-300',
            'financial': 'bg-purple-100 text-purple-800 border-purple-300',
            'sales': 'bg-orange-100 text-orange-800 border-orange-300'
          };

          return costCenterColors[cat.cost_center || ''] || 'bg-gray-100 text-gray-700 border-gray-300';
        }
      };

      const color = getColorByCategory(category);
      const categoryInfo = categoryName ? { label: categoryName, color } : null;
      
      return categoryInfo ? (
        <Badge className={cn("text-xs font-medium border", categoryInfo.color)} variant="secondary">
          {categoryInfo.label}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Sem categoria</Badge>
      );
    };
    
    return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <div className="min-w-[640px] md:min-w-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="table-header w-[25%] min-w-[150px]">Descrição</TableHead>
              <TableHead className="table-header w-[15%] hidden md:table-cell">Categoria</TableHead>
              <TableHead className="table-header w-[15%] hidden lg:table-cell">Conta</TableHead>
              <TableHead className="table-header w-[12%] min-w-[100px]">Vencimento</TableHead>
              <TableHead className="table-header w-[13%] text-right min-w-[100px]">Valor</TableHead>
              <TableHead className="table-header w-[12%] hidden sm:table-cell">Status</TableHead>
              <TableHead className="table-header w-[8%] text-center min-w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {type === 'income' ? 'Nenhuma receita encontrada' : 
                     type === 'expense' ? 'Nenhuma despesa encontrada' : 
                     'Nenhuma movimentação encontrada'}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((cashFlow) => (
              <TableRow key={cashFlow.id} className="hover:bg-muted/50">
                <TableCell className="py-3 min-w-[150px]">
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{cashFlow.description}</p>
                    {(cashFlow.supplier || cashFlow.customer) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {cashFlow.supplier || cashFlow.customer}
                      </p>
                    )}
                    {/* Mostrar categoria em mobile */}
                    <div className="md:hidden mt-1">
                      {(() => {
                        const category = categories.find(cat => cat.id === cashFlow.categoryId);
                        if (category) {
                          return (
                            <Badge
                              className={cn(
                                "text-xs font-medium border",
                                !category.color && (category.type === 'INCOME'
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-red-100 text-red-800 border-red-300")
                              )}
                              variant="secondary"
                            >
                              {category.name}
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-3 hidden md:table-cell">
                  {(() => {
                    // Busca a categoria pelo ID
                    const category = categories.find(cat => cat.id === cashFlow.categoryId);

                    if (category) {
                      // Usar a cor da categoria se existir
                      const badgeStyle = category.color && category.color !== '#6B7280'
                        ? {
                            backgroundColor: `${category.color}20`,
                            borderColor: category.color,
                            color: category.color
                          }
                        : {};

                      return (
                        <Badge
                          className={cn(
                            "text-xs font-medium border",
                            !category.color && (category.type === 'INCOME'
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-red-100 text-red-800 border-red-300")
                          )}
                          style={badgeStyle}
                          variant="secondary"
                        >
                          {category.name}
                        </Badge>
                      );
                    }

                    return <Badge variant="outline" className="text-xs">Sem categoria</Badge>;
                  })()}
                </TableCell>
                
                <TableCell className="py-3 hidden lg:table-cell">
                  {cashFlow.account ? (
                    <div className="space-y-0.5">
                      <p className="kpi-label">{cashFlow.account.accountName}</p>
                      <p className="kpi-variation text-muted-foreground">{cashFlow.account.bankName}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não informada</span>
                  )}
                </TableCell>
                
                <TableCell className="py-3 min-w-[100px]">
                  <div className="space-y-0.5">
                    <p className="text-sm">
                      {format(new Date(cashFlow.dueDate || cashFlow.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    {cashFlow.dueDate && cashFlow.status === 'PENDING' && (
                      <p className="kpi-variation text-muted-foreground">
                        {(() => {
                          const days = Math.ceil((new Date(cashFlow.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (days < 0) return `Vencido há ${Math.abs(days)} dias`;
                          if (days === 0) return 'Vence hoje';
                          if (days === 1) return 'Vence amanhã';
                          return `Em ${days} dias`;
                        })()}
                      </p>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="py-3 text-right min-w-[100px]">
                  <p className={cn(
                    "text-sm font-semibold",
                    cashFlow.type === 'INCOME' ? "text-green-600" : "text-red-600"
                  )}>
                    {cashFlow.type === 'INCOME' ? '+' : '-'} {formatCurrency(cashFlow.amount)}
                  </p>
                </TableCell>
                
                <TableCell className="py-3 hidden sm:table-cell">
                  <StatusChangeButton
                    currentStatus={cashFlow.status}
                    transactionType={cashFlow.type}
                    onStatusChange={(newStatus) => handleStatusChange(cashFlow.id, newStatus)}
                    size="sm"
                  />
                </TableCell>
                
                <TableCell className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        aria-label={`Ações para movimentação ${cashFlow.description}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => handleEdit(cashFlow)} 
                        className="text-sm"
                        aria-label={`Editar movimentação ${cashFlow.description}`}
                      >
                        <Edit className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(cashFlow.id)} 
                        className="text-sm text-destructive focus:text-destructive"
                        aria-label={`Excluir movimentação ${cashFlow.description}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header com símbolo $ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            Centro Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie o fluxo de caixa da fazenda</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCashFlows()}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            aria-label="Atualizar lista de movimentações"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            aria-label="Criar nova movimentação financeira"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">Nova Movimentação</span>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">
                {formatCurrency(summary.balance)}
              </div>
              <p className="kpi-variation text-muted-foreground">
                Receitas realizadas - Despesas pagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">
                  Recebido: {formatCurrency(summary.paidIncome)}
                </span>
                <span className="text-yellow-600">
                  Pendente: {formatCurrency(summary.pendingIncome)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-red-600">
                {formatCurrency(summary.totalExpense)}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-600">
                  Pago: {formatCurrency(summary.paidExpense)}
                </span>
                <span className="text-yellow-600">
                  Pendente: {formatCurrency(summary.pendingExpense)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Projeção</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">
                {formatCurrency(
                  summary.balance + summary.pendingIncome - summary.pendingExpense
                )}
              </div>
              <p className="kpi-variation text-muted-foreground">
                Saldo após pendências
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Layout Segunda Linha: Saldos das Contas (1/3) + Próximos Vencimentos (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Saldos das Contas - 1/3 (à esquerda) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Saldos das Contas
              <Badge variant="outline">{accountBalances?.filter(acc => acc.isActive).length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Informações de cada conta ativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {accountBalances?.filter(acc => acc.isActive).slice(0, 4).map(account => (
              <div key={account.id} className="group relative">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{account.accountName}</p>
                    <p className="kpi-variation text-muted-foreground">
                      {account.bankName} - {(() => {
                        const types: Record<string, string> = {
                          'CHECKING': 'Conta Corrente',
                          'SAVINGS': 'Poupança',
                          'INVESTMENT': 'Investimento',
                          'CASH': 'Dinheiro',
                          'CREDIT_CARD': 'Cartão de Crédito',
                          'OTHER': 'Outros'
                        };
                        return types[account.accountType] || account.accountType;
                      })()}
                    </p>
                    {editingAccountBalance?.id === account.id ? (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Saldo inicial:</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-6 w-24 text-xs"
                          defaultValue={account.initialBalance}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat((e.target as HTMLInputElement).value) || 0;
                              // Aqui implementaríamos a atualização do saldo inicial
                              setEditingAccountBalance(null);
                              toast({
                                title: 'Saldo inicial atualizado',
                                description: `Novo saldo inicial: ${formatCurrency(value)}`,
                                duration: 3000,
                              });
                            } else if (e.key === 'Escape') {
                              setEditingAccountBalance(null);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditingAccountBalance(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Saldo inicial: {formatCurrency(account.initialBalance)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold text-sm",
                        account.calculatedBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(account.calculatedBalance || 0)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Atual</span>
                      </div>
                    </div>
                    {!editingAccountBalance && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingAccountBalance({ id: account.id, balance: account.initialBalance })}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhuma conta cadastrada
              </p>
            )}
            
            {accountBalances?.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="kpi-label">Total Geral</span>
                  <span className={cn(
                    "text-sm font-bold",
                    accountBalances.reduce((sum, acc) => sum + (acc.calculatedBalance || 0), 0) >= 0 
                      ? "text-green-600" 
                      : "text-red-600"
                  )}>
                    {formatCurrency(
                      accountBalances.reduce((sum, acc) => sum + (acc.calculatedBalance || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Próximos Vencimentos - 2/3 (à direita) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Próximos Vencimentos
              <Badge variant="outline">{upcomingDueDates?.length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Movimentações previstas para os próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDueDates?.length > 0 ? (
                upcomingDueDates.map(event => (
                  <div key={event.id} className="flex justify-between items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <p className="kpi-label">{event.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <Badge variant={event.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {event.status === 'overdue' ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-base font-semibold",
                        event.type === 'INCOME' ? "text-green-600" : "text-red-600"
                      )}>
                        {event.type === 'INCOME' ? '+' : '-'}{formatCurrency(event.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum vencimento nos próximos 30 dias</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Movimentações - Largura Total */}
      <div className="space-y-6">
        {/* Tabs de Movimentações */}
        <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Movimentações Financeiras</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie todas as entradas e saídas do fluxo de caixa
                </p>
              </div>
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="income">Receitas</TabsTrigger>
                <TabsTrigger value="expense">Despesas</TabsTrigger>
                <TabsTrigger value="analysis">Análise</TabsTrigger>
                <TabsTrigger value="cashflow">Fluxo</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="card-title">Todas as Movimentações</CardTitle>
                  <CardDescription>
                    Visualize todas as entradas e saídas do fluxo de caixa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Carregando movimentações...</p>
                    </div>
                  ) : (
                    <CashFlowTable data={filteredCashFlows.all} type="all" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Receitas
                  </CardTitle>
                  <CardDescription>
                    Entradas de dinheiro e valores a receber
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Carregando receitas...</p>
                    </div>
                  ) : (
                    <CashFlowTable data={filteredCashFlows.income} type="income" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expense" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Despesas
                  </CardTitle>
                  <CardDescription>
                    Saídas de dinheiro e valores a pagar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Carregando despesas...</p>
                    </div>
                  ) : (
                    <CashFlowTable data={filteredCashFlows.expense} type="expense" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Análise Integrada
                  </CardTitle>
                  <CardDescription>
                    Visão completa dos dados financeiros com gráficos e relatórios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleIntegratedAnalysis />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    Fluxo de Caixa Expandido
                  </CardTitle>
                  <CardDescription>
                    Visualização detalhada por período com projeções e análises
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpandedCashFlow />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <CashFlowForm
          cashFlow={editingCashFlow}
          categories={categories}
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCashFlow(null);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir Movimentação"
        message="Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default CashFlowDashboard;
