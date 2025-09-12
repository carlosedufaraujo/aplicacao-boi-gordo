import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Wallet
} from 'lucide-react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashFlowForm from './CashFlowForm';
import { SimpleIntegratedAnalysis } from '@/components/FinancialAnalysis/SimpleIntegratedAnalysis';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { useToast } from '@/components/ui/use-toast';

export const CashFlowDashboard: React.FC = () => {
  console.log('CashFlowDashboard - Component loaded with EXACT version from 21:04-22:44!');
  
  const [showForm, setShowForm] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
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
        toast({
          title: 'Movimentação atualizada',
          description: 'A movimentação foi atualizada com sucesso.',
          duration: 3000,
        });
      } else {
        await createCashFlow(data);
        toast({
          title: 'Movimentação criada',
          description: 'A nova movimentação foi criada com sucesso.',
          duration: 3000,
        });
      }
      setShowForm(false);
      setEditingCashFlow(null);
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a movimentação. Verifique os dados e tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
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
      toast({
        title: 'Movimentação excluída',
        description: 'A movimentação foi excluída com sucesso.',
        duration: 3000,
      });
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a movimentação. Tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
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
    console.log('[CashFlowDashboard] cashFlows da API:', cashFlows);
    console.log('[CashFlowDashboard] Total de movimentações:', cashFlows?.length || 0);
    
    return {
      all: cashFlows || [],
      income: cashFlows?.filter(flow => flow.type === 'INCOME') || [],
      expense: cashFlows?.filter(flow => flow.type === 'EXPENSE') || []
    };
  }, [cashFlows]);

  // Componente de Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      'PENDING': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'PAID': { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      'RECEIVED': { label: 'Recebido', variant: 'default' as const, icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
      'OVERDUE': { label: 'Vencido', variant: 'destructive' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Componente da Tabela de Movimentações
  const CashFlowTable = ({ data, type }: { data: any[], type: 'all' | 'income' | 'expense' }) => {
    console.log(`[CashFlowTable] Renderizando tabela tipo: ${type}`);
    console.log(`[CashFlowTable] Dados recebidos:`, data);
    
    return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {type === 'income' ? 'Nenhuma receita encontrada' : 
                 type === 'expense' ? 'Nenhuma despesa encontrada' : 
                 'Nenhuma movimentação encontrada'}
              </TableCell>
            </TableRow>
          ) : (
            data.map((cashFlow) => (
              <TableRow key={cashFlow.id}>
                <TableCell className="font-medium">
                  <div>
                    <p>{cashFlow.description}</p>
                    {cashFlow.supplier && (
                      <p className="text-sm text-muted-foreground">{cashFlow.supplier}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {cashFlow.category?.name || 'Sem categoria'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{cashFlow.account?.accountName || 'Conta não informada'}</p>
                    <p className="text-muted-foreground">{cashFlow.account?.bankName}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{format(new Date(cashFlow.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    {cashFlow.dueDate && (
                      <p className="text-muted-foreground">
                        Venc: {format(new Date(cashFlow.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "font-bold text-right",
                    cashFlow.type === 'INCOME' ? "text-green-600" : "text-red-600"
                  )}>
                    {cashFlow.type === 'INCOME' ? '+' : '-'}{formatCurrency(cashFlow.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={cashFlow.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(cashFlow)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(cashFlow.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                      {cashFlow.status === 'PENDING' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(
                            cashFlow.id, 
                            cashFlow.type === 'INCOME' ? 'RECEIVED' : 'PAID'
                          )}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como {cashFlow.type === 'INCOME' ? 'Recebido' : 'Pago'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header com símbolo $ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Centro Financeiro
          </h1>
          <p className="text-muted-foreground">Gerencie o fluxo de caixa da fazenda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCashFlows()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receitas realizadas - Despesas pagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
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
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
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
              <CardTitle className="text-sm font-medium">Projeção</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  summary.balance + summary.pendingIncome - summary.pendingExpense
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo após pendências
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Layout Principal: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área Principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs de Movimentações */}
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Movimentações Financeiras</h2>
                <p className="text-muted-foreground">
                  Gerencie todas as entradas e saídas do fluxo de caixa
                </p>
              </div>
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="income">Receitas</TabsTrigger>
                <TabsTrigger value="expense">Despesas</TabsTrigger>
                <TabsTrigger value="analysis">Análise</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Todas as Movimentações</CardTitle>
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
                  <CardTitle className="text-lg flex items-center gap-2">
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
                  <CardTitle className="text-lg flex items-center gap-2">
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
                  <CardTitle className="text-lg flex items-center gap-2">
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
          </Tabs>
        </div>

        {/* Área Lateral Direita - 1/3 - APENAS 2 CARDS */}
        <div className="space-y-6">
          {/* Card de Próximos Vencimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Próximos Vencimentos
                <Badge variant="outline">{upcomingDueDates?.length || 0}</Badge>
              </CardTitle>
              <CardDescription>
                Próximos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingDueDates?.length > 0 ? (
                upcomingDueDates.map(event => (
                  <div key={event.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        event.type === 'INCOME' ? "text-green-600" : "text-red-600"
                      )}>
                        {event.type === 'INCOME' ? '+' : '-'}{formatCurrency(event.amount)}
                      </p>
                      <Badge variant={event.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                        {event.status === 'overdue' ? 'Vencido' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhum vencimento próximo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card de Saldos das Contas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Saldos das Contas
                <Badge variant="outline">{payerAccounts?.filter(acc => acc.isActive).length || 0}</Badge>
              </CardTitle>
              <CardDescription>
                Informações de cada conta ativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {payerAccounts?.filter(acc => acc.isActive).slice(0, 4).map(account => (
                <div key={account.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.bankName} - {account.accountType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(account.balance || 0)}</p>
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Disponível</span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhuma conta cadastrada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
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