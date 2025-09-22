import { useState, useEffect, useCallback } from 'react';
import { expenseApi, Expense, CreateExpenseData, UpdateExpenseData, ExpenseFilters, ExpenseStats } from '@/services/api/expenseApi';
import { toast } from 'sonner';
import { activityLogger } from '@/services/activityLogger';

/**
 * Hook para gerenciar Expenses via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const useExpensesApi = (initialFilters: ExpenseFilters = {}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  /**
   * Carrega as despesas
   */
  const loadExpenses = useCallback(async (filters: ExpenseFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseApi.getAll({
        ...initialFilters,
        ...filters,
        page: filters.page || currentPage,
        limit: filters.limit || pageSize
      });

      // Verificar se a resposta é de erro de autenticação
      if (response && response.status === 'error' && response.message === 'Usuário não autenticado') {
        // Não mostrar erro, apenas definir lista vazia
        setExpenses([]);
        setTotalItems(0);
        setTotalPages(1);
        setCurrentPage(1);
        return;
      }

      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];
        setExpenses(items);

        // Atualizar informações de paginação
        if (response.data && !Array.isArray(response.data)) {
          setTotalItems(response.data.total || items.length);
          setTotalPages(response.data.totalPages || Math.ceil((response.data.total || items.length) / pageSize));
          setCurrentPage(response.data.page || 1);
        }
      } else if (!response) {
        // Sem resposta (provavelmente não autenticado)
        setExpenses([]);
      } else {
        throw new Error(response.message || 'Erro ao carregar despesas');
      }
    } catch (err) {
      // Não mostrar erro se for problema de autenticação
      if (!err.message?.includes('autenticado')) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        console.error('Erro ao carregar despesas:', err);
        toast.error('Erro ao carregar despesas');
      }
      setExpenses([]);
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
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || [];
        setExpenses(items);
        
        // Atualizar informações de paginação
        if (response.data && !Array.isArray(response.data)) {
          setTotalItems(response.data.total || items.length);
          setTotalPages(response.data.totalPages || Math.ceil((response.data.total || items.length) / pageSize));
          setCurrentPage(response.data.page || 1);
        }
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

        // Registrar atividade
        activityLogger.logFinancialTransaction(
          'expense',
          `${response.data.description} - ${response.data.category}`,
          response.data.totalAmount,
          response.data.id,
          {
            category: response.data.category,
            vendor: response.data.vendorId,
            dueDate: response.data.dueDate
          }
        );

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
   * Recarrega os dados
   */
  const refresh = useCallback(async (filters?: ExpenseFilters) => {
    await Promise.all([
      loadExpenses(filters),
      loadStats()
    ]);
  }, [loadExpenses, loadStats]);

  /**
   * Busca despesas por ordem de compra
   */
  const getExpensesByCattlePurchase = useCallback(async (purchaseId: string): Promise<Expense[]> => {
    try {
      const response = await expenseApi.getByCattlePurchase(purchaseId);
      
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

  // Carregamento inicial (SEM DEPENDÊNCIAS para evitar loops)
  useEffect(() => {
    loadExpenses({ page: 1, limit: 50 });
    loadStats();
  }, []); // ← CORRIGIDO: sem dependências para evitar loops infinitos

  // Funções de paginação
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
    loadExpenses({ page, limit: pageSize });
  }, [loadExpenses, pageSize]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    loadExpenses({ page: 1, limit: size });
  }, [loadExpenses]);

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
    getExpensesByCattlePurchase,
    refresh,
    // Paginação
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    changePage,
    changePageSize,
  };
};
