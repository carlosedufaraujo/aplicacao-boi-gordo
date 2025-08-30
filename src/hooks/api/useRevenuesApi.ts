import { useState, useEffect, useCallback } from 'react';
import { revenueApi, Revenue, CreateRevenueData, UpdateRevenueData, RevenueFilters, RevenueStats } from '@/services/api/revenueApi';
import { toast } from 'sonner';

/**
 * Hook para gerenciar Revenues via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const useRevenuesApi = (initialFilters: RevenueFilters = {}) => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RevenueStats | null>(null);

  /**
   * Carrega as receitas
   */
  const loadRevenues = useCallback(async (filters: RevenueFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await revenueApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        setRevenues(items);
      } else {
        throw new Error(response.message || 'Erro ao carregar receitas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar receitas:', err);
      toast.error('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await revenueApi.getStats();
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        setRevenues(items);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria uma nova receita
   */
  const createRevenue = useCallback(async (data: CreateRevenueData): Promise<Revenue | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await revenueApi.create(data);
      
      if (response.status === 'success' && response.data) {
        setRevenues(prev => [response.data!, ...prev]);
        toast.success('Receita criada com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar receita');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar receita:', err);
      toast.error('Erro ao criar receita');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Atualiza uma receita
   */
  const updateRevenue = useCallback(async (id: string, data: UpdateRevenueData): Promise<Revenue | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await revenueApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        setRevenues(prev => prev.map(revenue => 
          revenue.id === id ? response.data! : revenue
        ));
        toast.success('Receita atualizada com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar receita');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar receita:', err);
      toast.error('Erro ao atualizar receita');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Marca uma receita como recebida
   */
  const markRevenueAsReceived = useCallback(async (id: string, receivedValue?: number, receivedDate?: string): Promise<Revenue | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await revenueApi.markAsReceived(id, receivedValue, receivedDate);
      
      if (response.status === 'success' && response.data) {
        setRevenues(prev => prev.map(revenue => 
          revenue.id === id ? response.data! : revenue
        ));
        toast.success('Receita marcada como recebida');
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao marcar receita como recebida');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao marcar receita como recebida:', err);
      toast.error('Erro ao marcar receita como recebida');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Remove uma receita
   */
  const deleteRevenue = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await revenueApi.remove(id);
      
      if (response.status === 'success') {
        setRevenues(prev => prev.filter(revenue => revenue.id !== id));
        toast.success('Receita removida com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover receita');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover receita:', err);
      toast.error('Erro ao remover receita');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Busca uma receita por ID
   */
  const getRevenueById = useCallback(async (id: string): Promise<Revenue | null> => {
    try {
      const response = await revenueApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar receita');
      }
    } catch (err) {
      console.error('Erro ao buscar receita:', err);
      return null;
    }
  }, []);

  /**
   * Busca receitas por status
   */
  const getRevenuesByStatus = useCallback(async (status: string): Promise<Revenue[]> => {
    try {
      const response = await revenueApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar receitas por status');
      }
    } catch (err) {
      console.error('Erro ao buscar receitas por status:', err);
      return [];
    }
  }, []);

  /**
   * Busca receitas por categoria
   */
  const getRevenuesByCategory = useCallback(async (categoryId: string): Promise<Revenue[]> => {
    try {
      const response = await revenueApi.getByCategory(categoryId);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar receitas por categoria');
      }
    } catch (err) {
      console.error('Erro ao buscar receitas por categoria:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(async (filters?: RevenueFilters) => {
    await Promise.all([
      loadRevenues(filters),
      loadStats()
    ]);
  }, [loadRevenues, loadStats]);

  /**
   * Busca receitas por registro de venda
   */
  const getRevenuesBySaleRecord = useCallback(async (saleRecordId: string): Promise<Revenue[]> => {
    try {
      const response = await revenueApi.getBySaleRecord(saleRecordId);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar receitas por venda');
      }
    } catch (err) {
      console.error('Erro ao buscar receitas por venda:', err);
      return [];
    }
  }, []);

  // Carregamento inicial (SEM DEPENDÊNCIAS para evitar loops)
  useEffect(() => {
    loadRevenues();
    loadStats();
  }, []); // ← CORRIGIDO: sem dependências para evitar loops infinitos

  return {
    revenues,
    loading,
    error,
    stats,
    createRevenue,
    updateRevenue,
    markRevenueAsReceived,
    deleteRevenue,
    getRevenueById,
    getRevenuesByStatus,
    getRevenuesByCategory,
    getRevenuesBySaleRecord,
    refresh,
  };
};
