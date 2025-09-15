import { useState, useEffect, useCallback } from 'react';
import { payerAccountApi, PayerAccount, CreatePayerAccountData, UpdatePayerAccountData, PayerAccountFilters, PayerAccountStats } from '@/services/api/payerAccountApi';
import { toast } from 'sonner';
import { showErrorNotification, showSuccessNotification } from '@/utils/errorHandler';

/**
 * Hook para gerenciar PayerAccounts via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const usePayerAccountsApi = (initialFilters: PayerAccountFilters = {}) => {
  const [payerAccounts, setPayerAccounts] = useState<PayerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PayerAccountStats | null>(null);

  /**
   * Carrega as contas pagadoras
   */
  const loadPayerAccounts = useCallback(async (filters: PayerAccountFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || [];
        setPayerAccounts(items);
      } else {
        throw new Error(response.message || 'Erro ao carregar contas pagadoras');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar contas pagadoras:', err);
      showErrorNotification(err, 'Erro ao carregar contas pagadoras');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await payerAccountApi.getStats();
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || [];
        setPayerAccounts(items);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria uma nova conta pagadora
   */
  const createPayerAccount = useCallback(async (data: CreatePayerAccountData): Promise<PayerAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.create(data);
      
      if (response.status === 'success' && response.data) {
        showSuccessNotification('Conta pagadora criada com sucesso');
        
        // Recarregar a lista completa para garantir sincronização
        await loadPayerAccounts();
        await loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar conta pagadora');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar conta pagadora:', err);
      showErrorNotification(err, 'Erro ao criar conta pagadora');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPayerAccounts, loadStats]);

  /**
   * Atualiza uma conta pagadora
   */
  const updatePayerAccount = useCallback(async (id: string, data: UpdatePayerAccountData): Promise<PayerAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        showSuccessNotification('Conta pagadora atualizada com sucesso');
        
        // Recarregar a lista completa para garantir sincronização
        await loadPayerAccounts();
        await loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar conta pagadora');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar conta pagadora:', err);
      showErrorNotification(err, 'Erro ao atualizar conta pagadora');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPayerAccounts, loadStats]);

  /**
   * Atualiza o saldo de uma conta
   */
  const updateAccountBalance = useCallback(async (id: string, balance: number, operation: 'ADD' | 'SUBTRACT' | 'SET'): Promise<PayerAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.updateBalance(id, balance, operation);
      
      if (response.status === 'success' && response.data) {
        setPayerAccounts(prev => prev.map(account => 
          account.id === id ? response.data! : account
        ));
        showSuccessNotification('Saldo atualizado com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar saldo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar saldo:', err);
      showErrorNotification(err, 'Erro ao atualizar saldo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPayerAccounts, loadStats]);

  /**
   * Ativa/desativa uma conta
   */
  const toggleAccountStatus = useCallback(async (id: string, isActive: boolean): Promise<PayerAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.toggleStatus(id, isActive);
      
      if (response.status === 'success' && response.data) {
        setPayerAccounts(prev => prev.map(account => 
          account.id === id ? response.data! : account
        ));
        showSuccessNotification(`Conta ${isActive ? 'ativada' : 'desativada'} com sucesso`);
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao alterar status da conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao alterar status da conta:', err);
      showErrorNotification(err, 'Erro ao alterar status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPayerAccounts, loadStats]);

  /**
   * Remove uma conta pagadora
   */
  const deletePayerAccount = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await payerAccountApi.remove(id);
      
      if (response.status === 'success') {
        setPayerAccounts(prev => prev.filter(account => account.id !== id));
        showSuccessNotification('Conta pagadora removida com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover conta pagadora');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover conta pagadora:', err);
      showErrorNotification(err, 'Erro ao remover conta pagadora');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPayerAccounts, loadStats]);

  /**
   * Busca uma conta pagadora por ID
   */
  const getPayerAccountById = useCallback(async (id: string): Promise<PayerAccount | null> => {
    try {
      const response = await payerAccountApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar conta pagadora');
      }
    } catch (err) {
      console.error('Erro ao buscar conta pagadora:', err);
      return null;
    }
  }, []);

  /**
   * Busca contas por status
   */
  const getPayerAccountsByStatus = useCallback(async (status: string): Promise<PayerAccount[]> => {
    try {
      const response = await payerAccountApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar contas por status');
      }
    } catch (err) {
      console.error('Erro ao buscar contas por status:', err);
      return [];
    }
  }, []);

  /**
   * Busca contas por tipo
   */
  const getPayerAccountsByType = useCallback(async (accountType: string): Promise<PayerAccount[]> => {
    try {
      const response = await payerAccountApi.getByType(accountType);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar contas por tipo');
      }
    } catch (err) {
      console.error('Erro ao buscar contas por tipo:', err);
      return [];
    }
  }, []);

  /**
   * Busca apenas contas ativas
   */
  const getActivePayerAccounts = useCallback(async (): Promise<PayerAccount[]> => {
    try {
      const response = await payerAccountApi.getActive();
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar contas ativas');
      }
    } catch (err) {
      console.error('Erro ao buscar contas ativas:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(() => {
    loadPayerAccounts();
    loadStats();
  }, [loadPayerAccounts, loadStats]);

  // Carregamento inicial
  useEffect(() => {
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Carregar payer accounts e stats em paralelo
        const [accountsResponse, statsResponse] = await Promise.all([
          payerAccountApi.getAll(initialFilters),
          payerAccountApi.getStats()
        ]);
        
        if (accountsResponse.status === 'success' && accountsResponse.data) {
          const items = Array.isArray(accountsResponse.data) 
            ? accountsResponse.data 
            : accountsResponse.data.items || [];
          setPayerAccounts(items);
        }
        
        if (statsResponse.status === 'success' && statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        console.error('[usePayerAccountsApi] Erro no carregamento inicial:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); // Executar apenas na montagem

  return {
    accounts: payerAccounts, // Alias para compatibilidade
    payerAccounts,
    loading,
    error,
    stats,
    loadAccounts: loadPayerAccounts,
    loadPayerAccounts,
    loadStats,
    createPayerAccount,
    updatePayerAccount,
    updateAccountBalance,
    toggleAccountStatus,
    deletePayerAccount,
    getPayerAccountById,
    getPayerAccountsByStatus,
    getPayerAccountsByType,
    getActivePayerAccounts,
    refresh,
    reload: refresh, // Alias para compatibilidade com DebugRegistrations
  };
};
