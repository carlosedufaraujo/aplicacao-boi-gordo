import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import cashFlowService, { 
  CashFlow, 
  CashFlowSummary,
  FinancialCategory,
  FinancialAccount 
} from '@/services/api/cashFlow';
import { getCategoryDisplayName } from '@/utils/categoryNormalizer';

export const useCashFlow = () => { // Sem filtros - sempre busca todos os dados
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCashFlows = useCallback(async () => { // Sem filtros - busca tudo
    setLoading(true);
    setError(null);
    try {
      // Buscar despesas e receitas das APIs reais
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Buscar despesas
      const expensesResponse = await fetch('http://localhost:3002/api/v1/expenses', { headers });
      const expensesResult = await expensesResponse.json();
      
      // Buscar receitas
      const revenuesResponse = await fetch('http://localhost:3002/api/v1/revenues', { headers });
      const revenuesResult = await revenuesResponse.json();

      // Transformar despesas para o formato CashFlow
      const expenses = (expensesResult.data?.items || []).map((expense: any) => ({
        id: expense.id,
        type: 'EXPENSE' as const,
        categoryId: expense.costCenterId || '',
        categoryName: getCategoryDisplayName(expense.category),
        accountId: expense.payerAccountId || '',
        description: expense.description,
        amount: expense.totalAmount,
        date: expense.dueDate,
        dueDate: expense.dueDate,
        paymentDate: expense.paymentDate,
        status: expense.isPaid ? 'PAID' : 'PENDING',
        notes: expense.notes,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }));

      // Transformar receitas para o formato CashFlow
      const revenues = (revenuesResult.data?.items || []).map((revenue: any) => ({
        id: revenue.id,
        type: 'INCOME' as const,
        categoryId: revenue.costCenterId || '',
        categoryName: getCategoryDisplayName(revenue.category),
        accountId: revenue.payerAccountId || '',
        description: revenue.description,
        amount: revenue.totalAmount,
        date: revenue.dueDate,
        dueDate: revenue.dueDate,
        paymentDate: revenue.receiptDate,
        status: revenue.isReceived ? 'RECEIVED' : 'PENDING',
        notes: revenue.notes,
        createdAt: revenue.createdAt,
        updatedAt: revenue.updatedAt
      }));

      // Combinar todas as movimentações
      const data = [...expenses, ...revenues];
      
      console.log('[useCashFlow] Despesas:', expenses.length);
      console.log('[useCashFlow] Receitas:', revenues.length);
      console.log('[useCashFlow] Total de movimentações:', data.length);
      console.log('[useCashFlow] Primeiras 3 movimentações:', data.slice(0, 3));
      
      setCashFlows(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro ao carregar movimentações',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Removido initialFilters

  const fetchSummary = useCallback(async () => { // Sem filtros
    try {
      // Calcular resumo baseado nos cashFlows carregados
      const summaryData = cashFlows.reduce((acc, flow) => {
        if (flow.type === 'INCOME') {
          acc.totalIncome += flow.amount;
          if (flow.status === 'RECEIVED' || flow.status === 'PAID') {
            acc.paidIncome += flow.amount;
          } else {
            acc.pendingIncome += flow.amount;
          }
        } else {
          acc.totalExpense += flow.amount;
          if (flow.status === 'PAID') {
            acc.paidExpense += flow.amount;
          } else {
            acc.pendingExpense += flow.amount;
          }
        }
        return acc;
      }, {
        totalIncome: 0,
        totalExpense: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        paidIncome: 0,
        paidExpense: 0,
        balance: 0
      });
      
      summaryData.balance = summaryData.totalIncome - summaryData.totalExpense;
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Erro ao carregar resumo:', err);
    }
  }, [cashFlows]);

  const fetchCategories = useCallback(async (type?: 'INCOME' | 'EXPENSE') => {
    try {
      // Temporariamente desabilitado - categorias financeiras ainda não implementadas
      // const data = await cashFlowService.getCategories(type);
      // setCategories(data);
      setCategories([]);
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setCategories([]);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      // Usando PayerAccount API unificada ao invés de FinancialAccount
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/v1/payer-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        console.warn('Resposta vazia da API de contas');
        setAccounts([]);
        return;
      }
      
      const result = JSON.parse(text);
      if (result.status === 'success' && result.data) {
        const payerAccounts = result.data.items || result.data;
        // Mapeando PayerAccount para FinancialAccount interface
        const mappedAccounts = payerAccounts.map((account: any) => ({
          id: account.id,
          accountName: account.accountName,
          accountType: account.accountType,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          agency: account.agency,
          balance: account.balance,
          initialBalance: account.initialBalance || 0,
          isActive: account.isActive
        }));
        setAccounts(mappedAccounts);
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err);
      setAccounts([]);
    }
  }, []);

  const createCashFlow = useCallback(async (data: Partial<CashFlow>) => {
    setLoading(true);
    try {
      const newCashFlow = await cashFlowService.create(data);
      setCashFlows(prev => [newCashFlow, ...prev]);
      toast({
        title: 'Movimentação criada',
        description: 'A movimentação foi criada com sucesso.',
      });
      await fetchSummary();
      return newCashFlow;
    } catch (err: any) {
      toast({
        title: 'Erro ao criar movimentação',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, toast]);

  const updateCashFlow = useCallback(async (id: string, data: Partial<CashFlow>) => {
    setLoading(true);
    try {
      const updatedCashFlow = await cashFlowService.update(id, data);
      setCashFlows(prev => prev.map(cf => cf.id === id ? updatedCashFlow : cf));
      toast({
        title: 'Movimentação atualizada',
        description: 'A movimentação foi atualizada com sucesso.',
      });
      await fetchSummary();
      return updatedCashFlow;
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar movimentação',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, toast]);

  const deleteCashFlow = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await cashFlowService.delete(id);
      setCashFlows(prev => prev.filter(cf => cf.id !== id));
      toast({
        title: 'Movimentação excluída',
        description: 'A movimentação foi excluída com sucesso.',
      });
      await fetchSummary();
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir movimentação',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, toast]);

  const updateStatus = useCallback(async (id: string, status: string, paymentDate?: string) => {
    setLoading(true);
    try {
      const updatedCashFlow = await cashFlowService.updateStatus(id, status, paymentDate);
      setCashFlows(prev => prev.map(cf => cf.id === id ? updatedCashFlow : cf));
      toast({
        title: 'Status atualizado',
        description: 'O status da movimentação foi atualizado.',
      });
      await fetchSummary();
      return updatedCashFlow;
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSummary, toast]);


  useEffect(() => {
    fetchCashFlows();
    fetchSummary();
    // fetchCategories(); // Temporariamente desabilitado
    fetchAccounts();
  }, []); // Executar apenas na montagem


  return {
    cashFlows,
    summary,
    categories,
    accounts,
    loading,
    error,
    fetchCashFlows,
    fetchSummary,
    createCashFlow,
    updateCashFlow,
    deleteCashFlow,
    updateStatus,
  };
};