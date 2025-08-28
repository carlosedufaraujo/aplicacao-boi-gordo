import { useState, useEffect, useCallback } from 'react';
import { expenseApi, Expense, CreateExpenseData, UpdateExpenseData, ExpenseFilters, ExpenseStats } from '@/services/api/expenseApi';
import { toast } from 'sonner';

/**
 * Hook para gerenciar Expenses via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const useExpensesApi = (initialFilters: ExpenseFilters = {}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExpenseStats | null>(null);

  /**
   * Carrega as despesas
   */
  const loadExpenses = useCallback(async (filters: ExpenseFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        setExpenses(response.data);
      } else {
        throw new Error(response.message || 'Erro ao carregar despesas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar despesas:', err);
      toast.error('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await expenseApi.getStats();
      
      if (response.status === 'success' && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria uma nova despesa
   */
  const createExpense = useCallback(async (data: CreateExpenseData): Promise<Expense | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.create(data);
      
      if (response.status === 'success' && response.data) {
        setExpenses(prev => [response.data!, ...prev]);
        toast.success('Despesa criada com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar despesa');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar despesa:', err);
      toast.error('Erro ao criar despesa');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Atualiza uma despesa
   */
  const updateExpense = useCallback(async (id: string, data: UpdateExpenseData): Promise<Expense | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        setExpenses(prev => prev.map(expense => 
          expense.id === id ? response.data! : expense
        ));
        toast.success('Despesa atualizada com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar despesa');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar despesa:', err);
      toast.error('Erro ao atualizar despesa');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Marca uma despesa como paga
   */
  const markExpenseAsPaid = useCallback(async (id: string, paidValue?: number, paidDate?: string): Promise<Expense | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.markAsPaid(id, paidValue, paidDate);
      
      if (response.status === 'success' && response.data) {
        setExpenses(prev => prev.map(expense => 
          expense.id === id ? response.data! : expense
        ));
        toast.success('Despesa marcada como paga');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao marcar despesa como paga');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao marcar despesa como paga:', err);
      toast.error('Erro ao marcar despesa como paga');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Remove uma despesa
   */
  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.remove(id);
      
      if (response.status === 'success') {
        setExpenses(prev => prev.filter(expense => expense.id !== id));
        toast.success('Despesa removida com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover despesa');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover despesa:', err);
      toast.error('Erro ao remover despesa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Busca uma despesa por ID
   */
  const getExpenseById = useCallback(async (id: string): Promise<Expense | null> => {
    try {
      const response = await expenseApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar despesa');
      }
    } catch (err) {
      console.error('Erro ao buscar despesa:', err);
      return null;
    }
  }, []);

  /**
   * Busca despesas por status
   */
  const getExpensesByStatus = useCallback(async (status: string): Promise<Expense[]> => {
    try {
      const response = await expenseApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar despesas por status');
      }
    } catch (err) {
      console.error('Erro ao buscar despesas por status:', err);
      return [];
    }
  }, []);

  /**
   * Busca despesas por categoria
   */
  const getExpensesByCategory = useCallback(async (categoryId: string): Promise<Expense[]> => {
    try {
      const response = await expenseApi.getByCategory(categoryId);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar despesas por categoria');
      }
    } catch (err) {
      console.error('Erro ao buscar despesas por categoria:', err);
      return [];
    }
  }, []);

  /**
   * Busca despesas por ordem de compra
   */
  const getExpensesByPurchaseOrder = useCallback(async (purchaseOrderId: string): Promise<Expense[]> => {
    try {
      const response = await expenseApi.getByPurchaseOrder(purchaseOrderId);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar despesas por ordem de compra');
      }
    } catch (err) {
      console.error('Erro ao buscar despesas por ordem de compra:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(() => {
    loadExpenses();
    loadStats();
  }, [loadExpenses, loadStats]);

  // Carregamento inicial
  useEffect(() => {
    loadExpenses();
    loadStats();
  }, [loadExpenses, loadStats]);

  return {
    expenses,
    loading,
    error,
    stats,
    createExpense,
    updateExpense,
    markExpenseAsPaid,
    deleteExpense,
    getExpenseById,
    getExpensesByStatus,
    getExpensesByCategory,
    getExpensesByPurchaseOrder,
    refresh,
  };
};
