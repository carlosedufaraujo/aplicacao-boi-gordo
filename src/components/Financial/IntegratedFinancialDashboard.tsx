import React, { useState, useEffect } from 'react';
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
  Percent
} from 'lucide-react';
import { useFinancialApi } from '@/hooks/api/useFinancialApi';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialKPI {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
  format: 'currency' | 'percentage' | 'number';
}

interface LotProfitability {
  lotCode: string;
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  status: string;
  daysInOperation: number;
}

export const IntegratedFinancialDashboard: React.FC = () => {
  const { 
    getDashboardData, 
    getExpenses, 
    getRevenues,
    getLotProfitability,
    getCashFlow,
    loading 
  } = useFinancialApi();

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });

  const [selectedView, setSelectedView] = useState<'overview' | 'expenses' | 'revenues' | 'profitability'>('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [lotProfitability, setLotProfitability] = useState<LotProfitability[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      const [dashboard, exp, rev, profit, cash] = await Promise.all([
        getDashboardData(dateRange),
        getExpenses(dateRange),
        getRevenues(dateRange),
        getLotProfitability(),
        getCashFlow(dateRange)
      ]);

      setDashboardData(dashboard);
      setExpenses(exp);
      setRevenues(rev);
      setLotProfitability(profit);
      setCashFlowData(cash);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    }
  };

  const kpis: FinancialKPI[] = [
    {
      label: 'Receita Total',
      value: dashboardData?.totalRevenue || 0,
      change: dashboardData?.revenueChange || 0,
      changeType: dashboardData?.revenueChange >= 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
      color: 'text-green-600',
      format: 'currency'
    },
    {
      label: 'Despesas Totais',
      value: dashboardData?.totalExpenses || 0,
      change: dashboardData?.expenseChange || 0,
      changeType: dashboardData?.expenseChange >= 0 ? 'increase' : 'decrease',
      icon: TrendingDown,
      color: 'text-red-600',
      format: 'currency'
    },
    {
      label: 'Lucro Líquido',
      value: dashboardData?.netProfit || 0,
      change: dashboardData?.profitChange || 0,
      changeType: dashboardData?.profitChange >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: dashboardData?.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      format: 'currency'
    },
    {
      label: 'Margem de Lucro',
      value: dashboardData?.profitMargin || 0,
      change: dashboardData?.marginChange || 0,
      changeType: dashboardData?.marginChange >= 0 ? 'increase' : 'decrease',
      icon: Percent,
      color: 'text-blue-600',
      format: 'percentage'
    },
    {
      label: 'ROI Médio',
      value: dashboardData?.averageRoi || 0,
      change: dashboardData?.roiChange || 0,
      changeType: dashboardData?.roiChange >= 0 ? 'increase' : 'decrease',
      icon: Target,
      color: 'text-purple-600',
      format: 'percentage'
    },
    {
      label: 'Lotes Ativos',
      value: dashboardData?.activeLots || 0,
      change: dashboardData?.lotsChange || 0,
      changeType: 'increase',
      icon: Package,
      color: 'text-orange-600',
      format: 'number'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  // Dados para gráfico de despesas por categoria
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = { name: category, value: 0 };
    }
    acc[category].value += expense.totalAmount;
    return acc;
  }, {});

  const expenseCategoryData = Object.values(expensesByCategory);

  // Cores para o gráfico de pizza
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-white rounded-xl shadow-soft-xl border border-neutral-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-b3x-navy-900">Centro Financeiro Integrado</h1>
            <p className="text-neutral-600 mt-1">Visão completa da saúde financeira do negócio</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(start, end) => setDateRange({ start, end })}
            />
            
            <Select
              value={selectedView}
              onValueChange={(value) => setSelectedView(value as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecione a visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Visão Geral</SelectItem>
                <SelectItem value="expenses">Despesas</SelectItem>
                <SelectItem value="revenues">Receitas</SelectItem>
                <SelectItem value="profitability">Rentabilidade</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>

            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                  {formatValue(kpi.value, kpi.format)}
                </p>
                <div className="flex items-center mt-2">
                  {kpi.changeType === 'increase' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-sm text-neutral-500 ml-1">vs mês anterior</span>
                </div>
              </div>
              <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-20`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Conteúdo Principal baseado na view selecionada */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Fluxo de Caixa */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="entrada" stroke="#10b981" name="Entradas" />
                <Line type="monotone" dataKey="saida" stroke="#ef4444" name="Saídas" />
                <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Despesas por Categoria */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Despesas por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </RePieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Tabela de Rentabilidade por Lote */}
      {selectedView === 'profitability' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Rentabilidade por Lote</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Lote</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Custo Total</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Receita Total</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Lucro Líquido</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Margem</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">ROI</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Dias</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {lotProfitability.map((lot) => (
                  <tr key={lot.lotCode} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4 font-medium">{lot.lotCode}</td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(lot.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency(lot.totalRevenue)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      lot.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(lot.netProfit)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        lot.profitMargin >= 15 ? 'bg-green-100 text-green-800' :
                        lot.profitMargin >= 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(lot.profitMargin)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        lot.roi >= 20 ? 'bg-purple-100 text-purple-800' :
                        lot.roi >= 0 ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(lot.roi)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{lot.daysInOperation}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        lot.status === 'SOLD' ? 'bg-gray-100 text-gray-800' :
                        lot.status === 'READY_FOR_SALE' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-neutral-600">Lucro Total</p>
                <p className={`text-xl font-bold ${
                  lotProfitability.reduce((sum, lot) => sum + lot.netProfit, 0) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(lotProfitability.reduce((sum, lot) => sum + lot.netProfit, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Margem Média</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatPercentage(
                    lotProfitability.reduce((sum, lot) => sum + lot.profitMargin, 0) / 
                    (lotProfitability.length || 1)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">ROI Médio</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatPercentage(
                    lotProfitability.reduce((sum, lot) => sum + lot.roi, 0) / 
                    (lotProfitability.length || 1)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Lotes Rentáveis</p>
                <p className="text-xl font-bold text-green-600">
                  {lotProfitability.filter(lot => lot.netProfit > 0).length} / {lotProfitability.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Despesas Pendentes */}
      {selectedView === 'expenses' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Despesas Pendentes</h3>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {expenses.filter(e => !e.isPaid).length} pendentes
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {formatCurrency(expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.totalAmount, 0))}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {expenses.filter(e => !e.isPaid).slice(0, 10).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {new Date(expense.dueDate) < new Date() ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium text-b3x-navy-900">{expense.description}</p>
                    <p className="text-sm text-neutral-600">
                      {expense.category} • Venc: {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{formatCurrency(expense.totalAmount)}</p>
                  <Button variant="outline" size="sm" className="mt-1">
                    Registrar Pagamento
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de Receitas a Receber */}
      {selectedView === 'revenues' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Receitas a Receber</h3>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {revenues.filter(r => !r.isReceived).length} pendentes
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {formatCurrency(revenues.filter(r => !r.isReceived).reduce((sum, r) => sum + r.totalAmount, 0))}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {revenues.filter(r => !r.isReceived).slice(0, 10).map((revenue) => (
              <div key={revenue.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {new Date(revenue.dueDate) < new Date() ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-b3x-navy-900">{revenue.description}</p>
                    <p className="text-sm text-neutral-600">
                      {revenue.category} • Prev: {new Date(revenue.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(revenue.totalAmount)}</p>
                  <Button variant="outline" size="sm" className="mt-1">
                    Confirmar Recebimento
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};