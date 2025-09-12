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
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { useToast } from '@/components/ui/use-toast';
import StatusChangeButton from './StatusChangeButton';

export const CashFlowDashboard: React.FC = () => {
  console.log('CashFlowDashboard - Component loaded with EXACT version from 21:04-22:44!');
  
  const [showForm, setShowForm] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAccountBalance, setEditingAccountBalance] = useState<{ id: string; balance: number } | null>(null);
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


  // Componente da Tabela de Movimentações - Reformulado
  const CashFlowTable = ({ data, type }: { data: any[], type: 'all' | 'income' | 'expense' }) => {
    console.log(`[CashFlowTable] Renderizando tabela tipo: ${type}`);
    console.log(`[CashFlowTable] Dados recebidos:`, data);
    
    // Função para obter o ícone e cor da categoria
    const getCategoryDisplay = (cashFlow: any) => {
      // Mapear categoryId para o nome da categoria
      const categoryIdToName: Record<string, string> = {
        // Despesas
        'cat-exp-01': 'Compra de Gado',
        'cat-exp-02': 'Frete de Gado',
        'cat-exp-03': 'Comissão de Compra',
        'cat-exp-04': 'Ração',
        'cat-exp-05': 'Suplementos',
        'cat-exp-06': 'Sal Mineral',
        'cat-exp-07': 'Silagem',
        'cat-exp-08': 'Vacinas',
        'cat-exp-09': 'Medicamentos',
        'cat-exp-10': 'Veterinário',
        'cat-exp-11': 'Exames Laboratoriais',
        'cat-exp-12': 'Manutenção de Currais',
        'cat-exp-13': 'Manutenção de Cercas',
        'cat-exp-14': 'Construções',
        'cat-exp-15': 'Equipamentos',
        'cat-exp-16': 'Combustível',
        'cat-exp-17': 'Energia Elétrica',
        'cat-exp-18': 'Água',
        'cat-exp-19': 'Telefone/Internet',
        'cat-exp-20': 'Salários',
        'cat-exp-21': 'Encargos Trabalhistas',
        'cat-exp-22': 'Benefícios',
        'cat-exp-23': 'Treinamento',
        'cat-exp-24': 'Material de Escritório',
        'cat-exp-25': 'Contabilidade',
        'cat-exp-26': 'Impostos e Taxas',
        'cat-exp-27': 'Seguros',
        'cat-exp-28': 'Despesas Bancárias',
        'cat-exp-29': 'Juros e Multas',
        'cat-exp-30': 'Outras Despesas',
        // Receitas
        'cat-inc-01': 'Venda de Gado Gordo',
        'cat-inc-02': 'Venda de Bezerros',
        'cat-inc-03': 'Venda de Matrizes',
        'cat-inc-04': 'Venda de Reprodutores',
        'cat-inc-05': 'Arrendamento de Pasto',
        'cat-inc-06': 'Aluguel de Curral',
        'cat-inc-07': 'Prestação de Serviços',
        'cat-inc-08': 'Venda de Esterco',
        'cat-inc-09': 'Venda de Couro',
        'cat-inc-10': 'Rendimentos Financeiros',
        'cat-inc-11': 'Juros Recebidos',
        'cat-inc-12': 'Dividendos',
        'cat-inc-13': 'Indenizações',
        'cat-inc-14': 'Prêmios e Bonificações',
        'cat-inc-15': 'Outras Receitas'
      };
      
      // Primeiro tenta buscar pelo categoryId
      let categoryName = cashFlow.categoryId ? 
        categoryIdToName[cashFlow.categoryId] : 
        (cashFlow.category?.name || cashFlow.category);
      
      // Log para debug
      console.log('CashFlow item:', { 
        id: cashFlow.id, 
        categoryId: cashFlow.categoryId, 
        category: cashFlow.category,
        resolvedName: categoryName 
      });
      
      const categoryMap: Record<string, { label: string; color: string }> = {
        // ===== RECEITAS =====
        // Vendas de Gado
        'Venda de Gado Gordo': { label: 'Venda de Gado Gordo', color: 'bg-green-100 text-green-800 border-green-300' },
        'Venda de Bezerros': { label: 'Venda de Bezerros', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        'Venda de Matrizes': { label: 'Venda de Matrizes', color: 'bg-green-50 text-green-700 border-green-300' },
        'Venda de Reprodutores': { label: 'Venda de Reprodutores', color: 'bg-teal-100 text-teal-800 border-teal-300' },
        
        // Serviços
        'Arrendamento de Pasto': { label: 'Arrendamento de Pasto', color: 'bg-lime-100 text-lime-800 border-lime-300' },
        'Aluguel de Curral': { label: 'Aluguel de Curral', color: 'bg-lime-50 text-lime-700 border-lime-300' },
        'Prestação de Serviços': { label: 'Prestação de Serviços', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
        
        // Subprodutos
        'Venda de Esterco': { label: 'Venda de Esterco', color: 'bg-amber-100 text-amber-800 border-amber-300' },
        'Venda de Couro': { label: 'Venda de Couro', color: 'bg-amber-50 text-amber-700 border-amber-300' },
        
        // Financeiro (Receitas)
        'Rendimentos Financeiros': { label: 'Rendimentos Financeiros', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        'Juros Recebidos': { label: 'Juros Recebidos', color: 'bg-blue-50 text-blue-700 border-blue-300' },
        'Dividendos': { label: 'Dividendos', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
        
        // Outros (Receitas)
        'Indenizações': { label: 'Indenizações', color: 'bg-sky-100 text-sky-800 border-sky-300' },
        'Prêmios e Bonificações': { label: 'Prêmios e Bonificações', color: 'bg-sky-50 text-sky-700 border-sky-300' },
        'Outras Receitas': { label: 'Outras Receitas', color: 'bg-gray-100 text-gray-700 border-gray-300' },
        
        // ===== DESPESAS =====
        // Compras e Vendas de Gado
        'Compra de Gado': { label: 'Compra de Gado', color: 'bg-red-100 text-red-800 border-red-300' },
        'Frete de Gado': { label: 'Frete de Gado', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        'Comissão de Compra': { label: 'Comissão de Compra', color: 'bg-orange-50 text-orange-700 border-orange-300' },
        
        // Alimentação e Nutrição
        'Ração': { label: 'Ração', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        'Suplementos': { label: 'Suplementos', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
        'Sal Mineral': { label: 'Sal Mineral', color: 'bg-amber-100 text-amber-800 border-amber-300' },
        'Silagem': { label: 'Silagem', color: 'bg-lime-100 text-lime-800 border-lime-300' },
        
        // Saúde Animal
        'Vacinas': { label: 'Vacinas', color: 'bg-purple-100 text-purple-800 border-purple-300' },
        'Medicamentos': { label: 'Medicamentos', color: 'bg-purple-50 text-purple-700 border-purple-300' },
        'Veterinário': { label: 'Veterinário', color: 'bg-pink-100 text-pink-800 border-pink-300' },
        'Exames Laboratoriais': { label: 'Exames Laboratoriais', color: 'bg-pink-50 text-pink-700 border-pink-300' },
        
        // Infraestrutura
        'Manutenção de Currais': { label: 'Manutenção de Currais', color: 'bg-gray-100 text-gray-800 border-gray-300' },
        'Manutenção de Cercas': { label: 'Manutenção de Cercas', color: 'bg-gray-50 text-gray-700 border-gray-300' },
        'Construções': { label: 'Construções', color: 'bg-slate-100 text-slate-800 border-slate-300' },
        'Equipamentos': { label: 'Equipamentos', color: 'bg-slate-50 text-slate-700 border-slate-300' },
        
        // Operacional
        'Combustível': { label: 'Combustível', color: 'bg-red-50 text-red-700 border-red-300' },
        'Energia Elétrica': { label: 'Energia Elétrica', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        'Água': { label: 'Água', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
        'Telefone/Internet': { label: 'Telefone/Internet', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        
        // Pessoal
        'Salários': { label: 'Salários', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
        'Encargos Trabalhistas': { label: 'Encargos Trabalhistas', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
        'Benefícios': { label: 'Benefícios', color: 'bg-violet-100 text-violet-800 border-violet-300' },
        'Treinamento': { label: 'Treinamento', color: 'bg-violet-50 text-violet-700 border-violet-300' },
        
        // Administrativo
        'Material de Escritório': { label: 'Material de Escritório', color: 'bg-rose-100 text-rose-800 border-rose-300' },
        'Contabilidade': { label: 'Contabilidade', color: 'bg-rose-50 text-rose-700 border-rose-300' },
        'Impostos e Taxas': { label: 'Impostos e Taxas', color: 'bg-red-100 text-red-800 border-red-300' },
        'Seguros': { label: 'Seguros', color: 'bg-red-50 text-red-700 border-red-300' },
        
        // Outros (Despesas)
        'Despesas Bancárias': { label: 'Despesas Bancárias', color: 'bg-zinc-100 text-zinc-800 border-zinc-300' },
        'Juros e Multas': { label: 'Juros e Multas', color: 'bg-zinc-50 text-zinc-700 border-zinc-300' },
        'Outras Despesas': { label: 'Outras Despesas', color: 'bg-gray-100 text-gray-700 border-gray-300' }
      };
      
      const categoryInfo = categoryName ? categoryMap[categoryName] || { label: categoryName, color: 'bg-gray-100 text-gray-700 border-gray-300' } : null;
      
      return categoryInfo ? (
        <Badge className={cn("text-xs font-medium border", categoryInfo.color)} variant="secondary">
          {categoryInfo.label}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Sem categoria</Badge>
      );
    };
    
    return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium w-[25%]">Descrição</TableHead>
            <TableHead className="text-xs font-medium w-[15%]">Categoria</TableHead>
            <TableHead className="text-xs font-medium w-[15%]">Conta</TableHead>
            <TableHead className="text-xs font-medium w-[12%]">Vencimento</TableHead>
            <TableHead className="text-xs font-medium w-[13%] text-right">Valor</TableHead>
            <TableHead className="text-xs font-medium w-[12%]">Status</TableHead>
            <TableHead className="text-xs font-medium w-[8%] text-center">Ações</TableHead>
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
                <TableCell className="py-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{cashFlow.description}</p>
                    {(cashFlow.supplier || cashFlow.customer) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {cashFlow.supplier || cashFlow.customer}
                      </p>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="py-3">
                  {(() => {
                    // Busca a categoria pelo ID ou nome
                    const category = categories.find(cat => 
                      cat.id === cashFlow.categoryId || 
                      cat.name === cashFlow.category?.name ||
                      cat.name === cashFlow.category
                    );
                    
                    if (category) {
                      return (
                        <Badge 
                          className={cn(
                            "text-xs font-medium border",
                            cashFlow.type === 'INCOME' 
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-red-100 text-red-800 border-red-300"
                          )} 
                          variant="secondary"
                        >
                          {category.name}
                        </Badge>
                      );
                    }
                    
                    return <Badge variant="outline" className="text-xs">Sem categoria</Badge>;
                  })()}
                </TableCell>
                
                <TableCell className="py-3">
                  {cashFlow.account ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{cashFlow.account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{cashFlow.account.bankName}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não informada</span>
                  )}
                </TableCell>
                
                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm">
                      {format(new Date(cashFlow.dueDate || cashFlow.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    {cashFlow.dueDate && (
                      <p className="text-xs text-muted-foreground">
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
                
                <TableCell className="py-3 text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    cashFlow.type === 'INCOME' ? "text-green-600" : "text-red-600"
                  )}>
                    {cashFlow.type === 'INCOME' ? '+' : '-'} {formatCurrency(cashFlow.amount)}
                  </p>
                </TableCell>
                
                <TableCell className="py-3">
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(cashFlow)} className="text-sm">
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(cashFlow.id)} 
                        className="text-sm text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
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
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header com símbolo $ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Centro Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie o fluxo de caixa da fazenda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchCashFlows()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Atualizar</span>
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="text-sm">Nova Movimentação</span>
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
              <div className="text-xl font-semibold">
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
              <div className="text-xl font-semibold text-green-600">
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
              <div className="text-xl font-semibold text-red-600">
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
              <div className="text-xl font-semibold">
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
                    <p className="text-xs text-muted-foreground">
                      {account.bankName} - {account.accountType}
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
                  <span className="text-sm font-medium">Total Geral</span>
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
                      <p className="text-sm font-medium">{event.title}</p>
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
                  <CardTitle className="text-base font-medium">Todas as Movimentações</CardTitle>
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