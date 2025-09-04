import React, { useState, useEffect, useMemo } from 'react';
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
  Download, 
  Upload, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Building2,
  CalendarDays,
  PieChart,
  Wallet,
  FileText,
  Info
} from 'lucide-react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CashFlowForm from './CashFlowForm';
import { SimpleIntegratedAnalysis } from '@/components/FinancialAnalysis/SimpleIntegratedAnalysis';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useCalendarEventsApi } from '@/hooks/api/useCalendarEventsApi';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { getCategoryDisplayName } from '@/utils/categoryNormalizer';

export const CashFlowDashboard: React.FC = () => {
  console.log('CashFlowDashboard - Component loaded with new layout!');
  
  const [showForm, setShowForm] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState(null);
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
  } = useCashFlow(); // Sempre busca todos os dados sem filtros

  // Integrações adicionais
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  const { payerAccounts, loading: accountsLoading } = usePayerAccountsApi();
  const { events: upcomingDueDates, loading: eventsLoading } = useCalendarEventsApi({
    type: 'FINANCE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próximos 30 dias
  });

  // Dados serão carregados via API real - sem dados mocados

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


  const handleIntegratePurchases = async () => {
    if (!cattlePurchases?.length) {
      alert('Nenhuma compra de gado encontrada para integrar.');
      return;
    }

    try {
      let integratedCount = 0;

      for (const purchase of cattlePurchases) {
        // Criar movimentação para valor principal do gado
        if (purchase.purchaseValue > 0) {
          await createCashFlow({
            type: 'EXPENSE',
            categoryId: 'cattle-purchase', // Categoria específica para compra de gado
            accountId: purchase.payerAccountId,
            description: `Compra de Gado - ${purchase.lotCode}`,
            amount: purchase.purchaseValue,
            date: purchase.purchaseDate,
            dueDate: purchase.principalDueDate,
            reference: purchase.lotCode,
            supplier: purchase.vendor?.name,
            notes: `Integração automática - ${purchase.animalType} - ${purchase.initialQuantity} animais`,
            tags: ['gado', 'compra', 'integração']
          });
          integratedCount++;
        }

        // Criar movimentação para comissão
        if (purchase.commission > 0) {
          await createCashFlow({
            type: 'EXPENSE',
            categoryId: 'commission',
            accountId: purchase.payerAccountId,
            description: `Comissão - ${purchase.lotCode}`,
            amount: purchase.commission,
            date: purchase.purchaseDate,
            dueDate: purchase.commissionDueDate,
            reference: purchase.lotCode,
            supplier: purchase.broker?.name,
            notes: `Comissão de corretagem - ${purchase.lotCode}`,
            tags: ['comissão', 'corretor', 'integração']
          });
          integratedCount++;
        }

        // Criar movimentação para frete
        if (purchase.freightCost > 0) {
          await createCashFlow({
            type: 'EXPENSE',
            categoryId: 'freight',
            accountId: purchase.payerAccountId,
            description: `Frete - ${purchase.lotCode}`,
            amount: purchase.freightCost,
            date: purchase.purchaseDate,
            dueDate: purchase.freightDueDate,
            reference: purchase.lotCode,
            supplier: purchase.transportCompany?.name,
            notes: `Transporte de gado - ${purchase.freightDistance}km`,
            tags: ['frete', 'transporte', 'integração']
          });
          integratedCount++;
        }
      }

      alert(`${integratedCount} movimentações criadas a partir de ${cattlePurchases.length} compras de gado!`);
      fetchCashFlows(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao integrar compras:', error);
      alert('Erro ao integrar compras de gado. Verifique o console para detalhes.');
    }
  };

  // Filtrar movimentações por tipo para as abas
  const filteredCashFlows = useMemo(() => {
    // Debug: verificar dados recebidos
    console.log('[CashFlowDashboard] cashFlows da API:', cashFlows);
    console.log('[CashFlowDashboard] Total de movimentações:', cashFlows?.length || 0);
    
    return {
      all: cashFlows || [],
      income: cashFlows?.filter(flow => flow.type === 'INCOME') || [],
      expense: cashFlows?.filter(flow => flow.type === 'EXPENSE') || []
    };
  }, [cashFlows]);

  // Função para determinar se uma categoria impacta o fluxo de caixa
  const getCategoryImpactsCashFlow = (category: string): boolean => {
    // Categorias que NÃO impactam o fluxo de caixa
    const nonCashCategories = ['deaths', 'weight_loss', 'depreciation'];
    return !nonCashCategories.includes(category);
  };

  // Componente de Badge de Impacto no Caixa
  const CashImpactBadge = ({ category, type }: { category: string; type: string }) => {
    // Receitas sempre impactam o caixa
    if (type === 'INCOME') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
          <Wallet className="h-3 w-3" />
          Entrada Caixa
        </Badge>
      );
    }
    
    // Para despesas, verificar se impacta
    const impactsCash = getCategoryImpactsCashFlow(category);
    
    if (impactsCash) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-600">
          <Wallet className="h-3 w-3" />
          Saída Caixa
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-amber-600 border-amber-600">
          <FileText className="h-3 w-3" />
          Lançamento Contábil
        </Badge>
      );
    }
  };

  // Componente de Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      'PENDING': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'PAID': { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      'RECEIVED': { label: 'Recebido', variant: 'default' as const, icon: CheckCircle },
      'CANCELLED': { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
      'OVERDUE': { label: 'Vencido', variant: 'destructive' as const, icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig['PENDING'];
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
    // DEBUG: Log dos dados sendo renderizados
    console.log(`[CashFlowTable] Renderizando tabela tipo: ${type}`);
    console.log(`[CashFlowTable] Dados recebidos:`, data);
    console.log(`[CashFlowTable] Primeiras 3 descrições:`, data.slice(0, 3).map(d => d.description));
    
    return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Impacto</TableHead>
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
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    {getCategoryDisplayName(cashFlow.categoryName || cashFlow.category?.name || cashFlow.category)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <CashImpactBadge 
                    category={cashFlow.categoryId || cashFlow.category} 
                    type={cashFlow.type}
                  />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Centro Financeiro</h1>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleIntegratePurchases}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Integrar Compras
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

      {/* Legenda de Impacto no Caixa */}
      <Card className="bg-muted/50">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Entenda o Impacto no Fluxo de Caixa</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
                <Wallet className="h-3 w-3" />
                Entrada Caixa
              </Badge>
              <span className="text-muted-foreground">Dinheiro que entra na conta</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-600">
                <Wallet className="h-3 w-3" />
                Saída Caixa
              </Badge>
              <span className="text-muted-foreground">Dinheiro que sai da conta</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-amber-600 border-amber-600">
                <FileText className="h-3 w-3" />
                Lançamento Contábil
              </Badge>
              <span className="text-muted-foreground">Apenas registro (ex: mortalidade)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Compras de Gado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Compras de Gado
              <Badge variant="outline">{cattlePurchases?.length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Integração com compras de animais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cattlePurchases?.slice(0, 3).map(purchase => {
              const totalValue = purchase.purchaseValue + purchase.commission + purchase.freightCost;
              return (
                <div key={purchase.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium">{purchase.lotCode}</p>
                    <p className="text-sm text-muted-foreground">
                      Gado: {formatCurrency(purchase.purchaseValue)} | 
                      Comissão: {formatCurrency(purchase.commission)} | 
                      Frete: {formatCurrency(purchase.freightCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.status}
                    </p>
                  </div>
                </div>
              );
            })}
            {cattlePurchases?.length > 3 && (
              <p className="text-xs text-center text-muted-foreground">
                +{cattlePurchases.length - 3} compras adicionais
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card de Contas Integradas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Contas Cadastradas
              <Badge variant="outline">{payerAccounts?.filter(acc => acc.isActive).length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Contas do sistema de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {payerAccounts?.filter(acc => acc.isActive).slice(0, 4).map(account => (
              <div key={account.id} className="flex justify-between items-center p-2 bg-muted rounded">
                <div>
                  <p className="font-medium">{account.accountName}</p>
                  <p className="text-sm text-muted-foreground">
                    {account.bankName} - {account.accountType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(account.balance)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card de Vencimentos no Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Próximos Vencimentos
              <Badge variant="outline">{upcomingDueDates?.length || 0}</Badge>
            </CardTitle>
            <CardDescription>
              Integração com calendário financeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDueDates?.slice(0, 4).map(event => (
              <div key={event.id} className="flex justify-between items-center p-2 bg-muted rounded">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={event.status === 'overdue' ? 'destructive' : 'secondary'}>
                    {event.status}
                  </Badge>
                  {event.amount && (
                    <p className="text-sm font-semibold">{formatCurrency(event.amount)}</p>
                  )}
                </div>
              </div>
            ))}
            {!upcomingDueDates?.length && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhum vencimento próximo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
          <CardDescription>
            Gerencie todas as entradas e saídas financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Todas
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Receitas
                <Badge variant="secondary" className="ml-1">
                  {filteredCashFlows.income.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Despesas
                <Badge variant="secondary" className="ml-1">
                  {filteredCashFlows.expense.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="integrated" className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-600" />
                Análise Integrada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Carregando movimentações...</p>
                </div>
              ) : (
                <CashFlowTable data={filteredCashFlows.all} type="all" />
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Carregando receitas...</p>
                </div>
              ) : (
                <CashFlowTable data={filteredCashFlows.income} type="income" />
              )}
            </TabsContent>

            <TabsContent value="expense" className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Carregando despesas...</p>
                </div>
              ) : (
                <CashFlowTable data={filteredCashFlows.expense} type="expense" />
              )}
            </TabsContent>


            <TabsContent value="integrated" className="mt-6">
              <SimpleIntegratedAnalysis />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
        description="Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};