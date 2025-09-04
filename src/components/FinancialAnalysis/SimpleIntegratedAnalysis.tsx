import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getCategoryDisplayName, getCategoryColor, groupByCategory } from '@/utils/categoryNormalizer';
import { DREStatement } from './DREStatement';

export const SimpleIntegratedAnalysis: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Buscar despesas
      const expensesResponse = await fetch('http://localhost:3002/api/v1/expenses', { headers });
      const expensesData = await expensesResponse.json();
      
      // Buscar receitas
      const revenuesResponse = await fetch('http://localhost:3002/api/v1/revenues', { headers });
      const revenuesData = await revenuesResponse.json();

      // Processar dados
      const expenses = expensesData.data?.items || [];
      const revenues = revenuesData.data?.items || [];

      // Calcular totais
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.totalAmount, 0);
      const totalRevenues = revenues.reduce((sum: number, rev: any) => sum + rev.totalAmount, 0);
      const balance = totalRevenues - totalExpenses;

      // Agrupar despesas por categoria normalizada
      const expensesByCategory: { [key: string]: number } = {};
      expenses.forEach((exp: any) => {
        const category = getCategoryDisplayName(exp.category);
        expensesByCategory[category] = (expensesByCategory[category] || 0) + exp.totalAmount;
      });

      // Agrupar receitas por categoria normalizada
      const revenuesByCategory: { [key: string]: number } = {};
      revenues.forEach((rev: any) => {
        const category = getCategoryDisplayName(rev.category);
        revenuesByCategory[category] = (revenuesByCategory[category] || 0) + rev.totalAmount;
      });

      setData({
        totalExpenses,
        totalRevenues,
        balance,
        expenseCount: expenses.length,
        revenueCount: revenues.length,
        expensesByCategory,
        revenuesByCategory,
        expenses,
        revenues
      });

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando análise financeira...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum dado disponível para análise</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalRevenues)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.revenueCount} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.expenseCount} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das despesas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.expensesByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percentage = ((amount as number) / data.totalExpenses) * 100;
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatCurrency(amount as number)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(data.expensesByCategory).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma despesa registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das receitas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.revenuesByCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, amount]) => {
                  const percentage = data.totalRevenues > 0 
                    ? ((amount as number) / data.totalRevenues) * 100 
                    : 0;
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(amount as number)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(data.revenuesByCategory).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma receita registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demonstrativo de Resultado (DRE) */}
      <DREStatement 
        expenses={data.expenses || []}
        revenues={data.revenues || []}
        period="Período Atual"
      />
    </div>
  );
};