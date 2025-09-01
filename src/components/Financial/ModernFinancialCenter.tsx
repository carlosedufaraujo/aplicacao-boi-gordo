import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  Wallet,
  Calendar,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileDown
} from 'lucide-react';

// Hooks do Supabase
import { useExpenses, useRevenues, usePayerAccounts, useCostCenters } from '@/hooks/useSupabaseData';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

// Interfaces
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'cash' | 'credit';
  balance: number;
  institution?: string;
  color: string;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  category: string;
  type: 'revenue' | 'expense';
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  account: string;
  tags?: string[];
  payee?: string;
}

interface Budget {
  category: string;
  planned: number;
  actual: number;
  percentage: number;
}

export const ModernFinancialCenter: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Hooks do Supabase para dados reais
  const { expenses, loading: expensesLoading } = useExpenses();
  const { revenues, loading: revenuesLoading } = useRevenues();
  const { payerAccounts, loading: accountsLoading } = usePayerAccounts();
  const { costCenters, loading: costCentersLoading } = useCostCenters();
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();
  
  // Converter PayerAccounts para formato Account
  const accounts: Account[] = useMemo(() => {
    return payerAccounts.map(account => ({
      id: account.id,
      name: account.accountName || account.bankName || 'Conta sem nome',
      type: account.accountType?.toLowerCase() as 'checking' | 'savings' | 'investment' | 'cash',
      balance: account.balance || 0,
      institution: account.bankName,
      color: getAccountColor(account.accountType)
    }));
  }, [payerAccounts]);
  
  // Converter dados do Supabase para formato Transaction
  const transactions: Transaction[] = useMemo(() => {
    const expenseTransactions = expenses.map(expense => ({
      id: expense.id,
      date: new Date(expense.dueDate),
      description: expense.description,
      category: expense.category,
      type: 'expense' as const,
      amount: expense.purchaseValue,
      status: expense.isPaid ? 'paid' as const : 
              (new Date(expense.dueDate) < new Date() ? 'overdue' as const : 'pending' as const),
      account: payerAccounts.find(acc => acc.id === expense.payerAccountId)?.accountName || 'Conta não identificada',
      tags: [],
      payee: expense.vendorId ? 'Fornecedor' : undefined
    }));
    
    const revenueTransactions = revenues.map(revenue => ({
      id: revenue.id,
      date: new Date(revenue.dueDate),
      description: revenue.description,
      category: revenue.category,
      type: 'revenue' as const,
      amount: revenue.purchaseValue,
      status: revenue.isReceived ? 'paid' as const : 
              (new Date(revenue.dueDate) < new Date() ? 'overdue' as const : 'pending' as const),
      account: payerAccounts.find(acc => acc.id === revenue.payerAccountId)?.accountName || 'Conta não identificada',
      tags: [],
      payee: revenue.buyerId ? 'Cliente' : undefined
    }));
    
    return [...expenseTransactions, ...revenueTransactions];
  }, [expenses, revenues, payerAccounts]);

  // Dados de orçamento baseados nos centros de custo
  const budgetData: Budget[] = useMemo(() => {
    return costCenters.map(center => {
      const actualExpenses = expenses
        .filter(expense => expense.costCenterId === center.id)
        .reduce((sum, expense) => sum + expense.purchaseValue, 0);
      
      const actualRevenues = revenues
        .filter(revenue => revenue.costCenterId === center.id)
        .reduce((sum, revenue) => sum + revenue.purchaseValue, 0);
      
      const actual = center.type === 'REVENUE' ? actualRevenues : actualExpenses;
      const planned = center.budget || 0;
      const percentage = planned > 0 ? (actual / planned) * 100 : 0;
      
      return {
        category: center.name,
        planned,
        actual,
        percentage: Math.round(percentage)
      };
    });
  }, [costCenters, expenses, revenues]);
  
  // Função auxiliar para cores das contas
  const getAccountColor = (accountType?: string) => {
    switch (accountType?.toUpperCase()) {
      case 'CHECKING': return 'bg-blue-500';
      case 'SAVINGS': return 'bg-green-500';
      case 'INVESTMENT': return 'bg-purple-500';
      case 'CASH': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Loading state
  const isLoading = expensesLoading || revenuesLoading || accountsLoading || costCentersLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Dados para gráficos baseados em dados reais
  const cashFlowData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthRevenues = revenues
        .filter(r => {
          const rDate = new Date(r.dueDate);
          return rDate >= monthStart && rDate <= monthEnd;
        })
        .reduce((sum, r) => sum + r.purchaseValue, 0);
      
      const monthExpenses = expenses
        .filter(e => {
          const eDate = new Date(e.dueDate);
          return eDate >= monthStart && eDate <= monthEnd;
        })
        .reduce((sum, e) => sum + e.purchaseValue, 0);
      
      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        receitas: monthRevenues,
        despesas: monthExpenses,
        lucro: monthRevenues - monthExpenses
      });
    }
    return months;
  }, [revenues, expenses]);

  const expensesByCategory = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.purchaseValue;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];
    
    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [expenses]);

  // Filtros aplicados
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, selectedType, selectedStatus]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalRevenues = revenues.reduce((sum, r) => sum + r.purchaseValue, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.purchaseValue, 0);
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const pendingPayments = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.purchaseValue, 0);
    
    return {
      totalRevenues,
      totalExpenses,
      totalBalance,
      pendingPayments,
      netProfit: totalRevenues - totalExpenses
    };
  }, [revenues, expenses, accounts]);

  // Função para gerar PDF do Centro Financeiro
  const handleGenerateFinancialPDF = async () => {
    const result = await generatePDFFromElement('financial-content', {
      filename: `centro-financeiro-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'landscape',
      quality: 2
    });

    if (result.success) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  };

  // Função para gerar relatório financeiro estruturado
  const handleGenerateFinancialReport = async () => {
    const result = await generateReportPDF({
      title: 'Relatório Financeiro Completo',
      data: {
        metrics,
        transactions: filteredTransactions,
        budgetData,
        cashFlowData,
        expensesByCategory
      },
      filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'portrait'
    });

    if (result.success) {
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Vencido'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div id="financial-content" className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro Financeiro</h1>
          <p className="text-muted-foreground">
            Gestão completa das finanças da operação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateFinancialPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={handleGenerateFinancialReport}>
            <Download className="h-4 w-4 mr-2" />
            Relatório Completo
          </Button>
          <Button onClick={() => setShowNewTransaction(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo consolidado das contas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.totalRevenues)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de receitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(metrics.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
          <CardDescription>Saldos das contas bancárias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center space-x-4 rounded-lg border p-4">
                <div className={`h-12 w-12 rounded-full ${account.color} flex items-center justify-center`}>
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.institution}</p>
                  <p className={`text-sm font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(account.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Receitas vs Despesas (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(value)
                  ]}
                />
                <Area type="monotone" dataKey="receitas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="despesas" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição dos gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(value)
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orçamento */}
      {budgetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamento vs Realizado</CardTitle>
            <CardDescription>Acompanhamento por centro de custo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetData.map((budget) => (
                <div key={budget.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(budget.actual)} de {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(budget.planned)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${budget.percentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                        {budget.percentage}%
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentage, 100)} 
                    className={`w-full ${budget.percentage > 100 ? 'bg-red-100' : ''}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transações</CardTitle>
              <CardDescription>Histórico de receitas e despesas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="revenue">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.account}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className={`font-bold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'revenue' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(transaction.amount)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};