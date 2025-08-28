import { useState, useEffect, useCallback } from 'react';
import { cattleLotApi, CattleLot, CreateCattleLotData, CattleLotFilters, CattleLotStats, PenAllocation } from '@/services/api/cattleLotApi';
import { toast } from 'sonner';

/**
 * Hook para gerenciar Cattle Lots via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const useCattleLotsApi = (initialFilters: CattleLotFilters = {}) => {
  const [cattleLots, setCattleLots] = useState<CattleLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CattleLotStats | null>(null);

  /**
   * Carrega os lotes de gado
   */
  const loadCattleLots = useCallback(async (filters: CattleLotFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await cattleLotApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        setCattleLots(response.data);
      } else {
        throw new Error(response.message || 'Erro ao carregar lotes de gado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar lotes de gado:', err);
      toast.error('Erro ao carregar lotes de gado');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await cattleLotApi.getStats();
      
      if (response.status === 'success' && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria um novo lote de gado
   */
  const createCattleLot = useCallback(async (data: CreateCattleLotData): Promise<CattleLot | null> => {
    try {
      const response = await cattleLotApi.create(data);
      
      if (response.status === 'success' && response.data) {
        // Recarregar a lista
        await loadCattleLots();
        await loadStats();
        
        toast.success('Lote de gado criado com sucesso!');
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar lote de gado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao criar lote de gado: ${errorMessage}`);
      console.error('Erro ao criar lote de gado:', err);
      return null;
    }
  }, [loadCattleLots, loadStats]);

  /**
   * Atualiza um lote de gado
   */
  const updateCattleLot = useCallback(async (id: string, data: Partial<CreateCattleLotData>): Promise<CattleLot | null> => {
    try {
      const response = await cattleLotApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        // Atualizar na lista local
        setCattleLots(prev => 
          prev.map(lot => 
            lot.id === id ? response.data! : lot
          )
        );
        
        await loadStats();
        toast.success('Lote de gado atualizado com sucesso!');
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar lote de gado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar lote de gado: ${errorMessage}`);
      console.error('Erro ao atualizar lote de gado:', err);
      return null;
    }
  }, [loadStats]);

  /**
   * Aloca animais em currais
   */
  const allocateToPens = useCallback(async (id: string, allocations: PenAllocation[]): Promise<boolean> => {
    try {
      const response = await cattleLotApi.allocateToPens(id, allocations);
      
      if (response.status === 'success') {
        // Recarregar o lote específico
        await loadCattleLots();
        
        toast.success('Animais alocados com sucesso!');
        return true;
      } else {
        throw new Error(response.message || 'Erro ao alocar animais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao alocar animais: ${errorMessage}`);
      console.error('Erro ao alocar animais:', err);
      return false;
    }
  }, [loadCattleLots]);

  /**
   * Remove um lote de gado
   */
  const deleteCattleLot = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await cattleLotApi.delete(id);
      
      if (response.status === 'success') {
        // Remover da lista local
        setCattleLots(prev => prev.filter(lot => lot.id !== id));
        
        await loadStats();
        toast.success('Lote de gado removido com sucesso!');
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover lote de gado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao remover lote de gado: ${errorMessage}`);
      console.error('Erro ao remover lote de gado:', err);
      return false;
    }
  }, [loadStats]);

  /**
   * Busca um lote por ID
   */
  const getCattleLotById = useCallback(async (id: string): Promise<CattleLot | null> => {
    try {
      const response = await cattleLotApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Lote não encontrado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar lote de gado:', err);
      return null;
    }
  }, []);

  /**
   * Busca lotes por status
   */
  const getCattleLotsByStatus = useCallback(async (status: string): Promise<CattleLot[]> => {
    try {
      const response = await cattleLotApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar lotes por status');
      }
    } catch (err) {
      console.error('Erro ao buscar lotes por status:', err);
      return [];
    }
  }, []);

  /**
   * Busca lotes por ordem de compra
   */
  const getCattleLotsByPurchaseOrder = useCallback(async (purchaseOrderId: string): Promise<CattleLot[]> => {
    try {
      const response = await cattleLotApi.getByPurchaseOrder(purchaseOrderId);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar lotes por ordem de compra');
      }
    } catch (err) {
      console.error('Erro ao buscar lotes por ordem de compra:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(async (filters?: CattleLotFilters) => {
    await Promise.all([
      loadCattleLots(filters),
      loadStats()
    ]);
  }, [loadCattleLots, loadStats]);

  // Carregamento inicial
  useEffect(() => {
    loadCattleLots();
    loadStats();
  }, [loadCattleLots, loadStats]);

  return {
    // Estados
    cattleLots,
    loading,
    error,
    stats,
    
    // Ações
    createCattleLot,
    updateCattleLot,
    allocateToPens,
    deleteCattleLot,
    getCattleLotById,
    getCattleLotsByStatus,
    getCattleLotsByPurchaseOrder,
    refresh,
    
    // Utilitários
    reload: () => refresh(),
    filter: (filters: CattleLotFilters) => loadCattleLots(filters),
  };
};
