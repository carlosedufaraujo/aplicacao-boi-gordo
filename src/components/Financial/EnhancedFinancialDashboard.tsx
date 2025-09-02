import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Activity,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Percent,
  FileText,
  CreditCard,
  Wallet,
  TrendingUp as Profit,
  Receipt,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { useFinancialApi, FinancialDashboardData, Expense, Revenue, CostCenter } from '@/hooks/api/useFinancialApi';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CostCenterManagement } from './CostCenterManagement';
import { FinancialDFCTable } from './FinancialDFCTable';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  gray: '#6b7280'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.purple,
  COLORS.warning,
  COLORS.pink,
  COLORS.info,
  COLORS.indigo,
  COLORS.danger
];

// Componente do Modal de Novo Lançamento
const NewTransactionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  costCenters: CostCenter[];
}> = ({ open, onClose, onSuccess, costCenters }) => {
  const { createExpense, createRevenue } = useFinancialApi();
  const [type, setType] = useState<'expense' | 'revenue'>('expense');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    costCenterId: '',
    documentNumber: '',
    supplier: '',
    customer: '',
    notes: ''
  });

  const categories = {
    expense: [
      'COMPRA_GADO',
      'TRANSPORTE',
      'ALIMENTACAO',
      'VETERINARIO',
      'MAO_DE_OBRA',
      'ADMINISTRATIVO',
      'MANUTENCAO',
      'ENERGIA',
      'COMBUSTIVEL',
      'IMPOSTOS',
      'OUTROS'
    ],
    revenue: [
      'VENDA_GADO',
      'VENDA_SUBPRODUTO',
      'SERVICOS',
      'ARRENDAMENTO',
      'FINANCEIRO',
      'OUTROS'
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const data = {
        description: formData.description,
        category: formData.category,
        totalAmount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate),
        competenceDate: new Date(formData.dueDate),
        costCenterId: formData.costCenterId || undefined,
        documentNumber: formData.documentNumber || undefined,
        ...(type === 'expense' ? {
          supplier: formData.supplier || undefined,
          isPaid: false
        } : {
          customer: formData.customer || undefined,
          isReceived: false
        })
      };

      if (type === 'expense') {
        await createExpense(data);
        toast.success('Despesa criada com sucesso!');
      } else {
        await createRevenue(data);
        toast.success('Receita criada com sucesso!');
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        description: '',
        category: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        costCenterId: '',
        documentNumber: '',
        supplier: '',
        customer: '',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      toast.error('Erro ao criar lançamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
          <DialogDescription>
            Adicione uma nova despesa ou receita ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Tipo de Lançamento */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => setType('expense')}
                className="flex-1"
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Despesa
              </Button>
              <Button
                type="button"
                variant={type === 'revenue' ? 'default' : 'outline'}
                onClick={() => setType('revenue')}
                className="flex-1"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Receita
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {/* Descrição */}
              <div className="col-span-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite a descrição do lançamento"
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[type].map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Data de Vencimento */}
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              {/* Centro de Custo */}
              <div>
                <Label htmlFor="costCenter">Centro de Custo</Label>
                <Select
                  value={formData.costCenterId}
                  onValueChange={(value) => setFormData({ ...formData, costCenterId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Documento */}
              <div>
                <Label htmlFor="documentNumber">Número do Documento</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="NF, Boleto, etc"
                />
              </div>

              {/* Fornecedor/Cliente */}
              <div>
                <Label htmlFor={type === 'expense' ? 'supplier' : 'customer'}>
                  {type === 'expense' ? 'Fornecedor' : 'Cliente'}
                </Label>
                <Input
                  id={type === 'expense' ? 'supplier' : 'customer'}
                  value={type === 'expense' ? formData.supplier : formData.customer}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    [type === 'expense' ? 'supplier' : 'customer']: e.target.value 
                  })}
                  placeholder={type === 'expense' ? 'Nome do fornecedor' : 'Nome do cliente'}
                />
              </div>

              {/* Observações */}
              <div className="col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente Principal do Dashboard
export const EnhancedFinancialDashboard: React.FC = () => {
  const { 
    getDashboardData, 
    getExpenses, 
    getRevenues, 
    getCostCenters,
    getLotProfitability,
    getCashFlow,
    getFinancialSummary 
  } = useFinancialApi();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [lotProfitability, setLotProfitability] = useState<any[]>([]);
  const [period, setPeriod] = useState('current');
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Hooks para compras e vendas de gado
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  const { saleRecords, loading: salesLoading } = useSaleRecordsApi();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, expenseList, revenueList, centers, profitability, cashFlow, summary] = await Promise.all([
        getDashboardData(),
        getExpenses(),
        getRevenues(),
        getCostCenters(),
        getLotProfitability(),
        getCashFlow(),
        getFinancialSummary(period)
      ]);

      setDashboardData(dashboard);
      setExpenses(expenseList);
      setRevenues(revenueList);
      setCostCenters(centers);
      setLotProfitability(profitability);
      setCashFlowData(cashFlow);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs do Dashboard
  const kpis = dashboardData ? [
    {
      label: 'Receita Total',
      value: dashboardData.totalRevenue,
      change: dashboardData.revenueChange,
      icon: TrendingUp,
      color: COLORS.success,
      format: 'currency' as const
    },
    {
      label: 'Despesas Totais',
      value: dashboardData.totalExpenses,
      change: dashboardData.expenseChange,
      icon: TrendingDown,
      color: COLORS.danger,
      format: 'currency' as const
    },
    {
      label: 'Lucro Líquido',
      value: dashboardData.netProfit,
      change: dashboardData.profitChange,
      icon: DollarSign,
      color: dashboardData.netProfit >= 0 ? COLORS.primary : COLORS.danger,
      format: 'currency' as const
    },
    {
      label: 'Margem de Lucro',
      value: dashboardData.profitMargin,
      change: dashboardData.marginChange,
      icon: Percent,
      color: COLORS.info,
      format: 'percentage' as const
    },
    {
      label: 'ROI Médio',
      value: dashboardData.averageRoi,
      change: dashboardData.roiChange,
      icon: Target,
      color: COLORS.purple,
      format: 'percentage' as const
    },
    {
      label: 'Lotes Ativos',
      value: dashboardData.activeLots,
      change: dashboardData.lotsChange,
      icon: Package,
      color: COLORS.secondary,
      format: 'number' as const
    }
  ] : [];

  // Preparar dados para gráficos
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Outros';
    if (!acc[category]) acc[category] = 0;
    acc[category] += expense.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  const recentTransactions = [...expenses, ...revenues]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centro Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa das finanças</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowNewTransaction(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                  <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {kpi.format === 'currency' 
                      ? formatCurrency(kpi.value)
                      : kpi.format === 'percentage'
                      ? formatPercentage(kpi.value)
                      : kpi.value.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="dfc">DFC</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="revenues">Receitas</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
          <TabsTrigger value="costcenters">Centros de Custo</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Entradas vs Saídas ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="entrada" 
                      stackId="1"
                      stroke={COLORS.success} 
                      fill={COLORS.success} 
                      fillOpacity={0.6}
                      name="Entradas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="saida" 
                      stackId="2"
                      stroke={COLORS.danger} 
                      fill={COLORS.danger} 
                      fillOpacity={0.6}
                      name="Saídas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Despesas por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição das despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>Últimas movimentações financeiras</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => {
                    const isExpense = 'isPaid' in transaction;
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.dueDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.category?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isExpense ? 'destructive' : 'default'}>
                            {isExpense ? 'Despesa' : 'Receita'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          isExpense ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {isExpense ? '-' : '+'} {formatCurrency(transaction.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {isExpense ? (
                            (transaction as Expense).isPaid ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )
                          ) : (
                            (transaction as Revenue).isReceived ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Recebido
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                                A Receber
                              </Badge>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despesas */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Despesas</CardTitle>
              <CardDescription>Todas as despesas registradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.dueDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {expense.category?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.supplier || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(expense.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {expense.isPaid ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receitas */}
        <TabsContent value="revenues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Receitas</CardTitle>
              <CardDescription>Todas as receitas registradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>
                        {format(new Date(revenue.dueDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {revenue.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {revenue.category?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{revenue.customer || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(revenue.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {revenue.isReceived ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Recebido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            A Receber
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fluxo de Caixa */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Detalhado</CardTitle>
              <CardDescription>Análise detalhada do fluxo de caixa</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="entrada" fill={COLORS.success} name="Entradas" />
                  <Bar dataKey="saida" fill={COLORS.danger} name="Saídas" />
                  <Line type="monotone" dataKey="saldo" stroke={COLORS.primary} name="Saldo" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Saídas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(item.entrada)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(item.saida)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          item.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(item.saldo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rentabilidade */}
        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Rentabilidade por Lote</CardTitle>
              <CardDescription>Performance financeira de cada lote</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotProfitability.map((lot) => {
                    const profit = lot.netProfit || 0;
                    const margin = lot.profitMargin || 0;
                    const roi = lot.roi || 0;
                    
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{lot.lotCode}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(lot.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(lot.totalRevenue)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(margin)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          roi >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(roi)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lot.status === 'SOLD' ? 'default' : 'secondary'}>
                            {lot.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Centros de Custo */}
        <TabsContent value="costcenters" className="space-y-4">
          <CostCenterManagement />
        </TabsContent>
        
        {/* DFC Detalhado */}
        <TabsContent value="dfc" className="space-y-4">
          <FinancialDFCTable
            expenses={expenses}
            revenues={revenues}
            cattlePurchases={cattlePurchases || []}
            saleRecords={saleRecords || []}
            costCenters={costCenters}
            loading={loading || purchasesLoading || salesLoading}
            period={period}
            onPeriodChange={setPeriod}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Lançamento */}
      <NewTransactionModal
        open={showNewTransaction}
        onClose={() => setShowNewTransaction(false)}
        onSuccess={loadData}
        costCenters={costCenters}
      />
    </div>
  );
};