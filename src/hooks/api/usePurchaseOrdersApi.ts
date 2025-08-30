import { useState, useEffect, useCallback } from 'react';
import { purchaseOrderApi, PurchaseOrder, CreatePurchaseOrderData, PurchaseOrderFilters, PurchaseOrderStats } from '@/services/api/purchaseOrderApi';
import { toast } from 'sonner';

/**
 * Hook para gerenciar Purchase Orders via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const usePurchaseOrdersApi = (initialFilters: PurchaseOrderFilters = {}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);

  /**
   * Carrega as ordens de compra
   */
  const loadPurchaseOrders = useCallback(async (filters: PurchaseOrderFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await purchaseOrderApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const orders = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        setPurchaseOrders(orders);
      } else {
        throw new Error(response.message || 'Erro ao carregar ordens de compra');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar ordens de compra:', err);
      toast.error('Erro ao carregar ordens de compra');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await purchaseOrderApi.getStats();
      
      if (response.status === 'success' && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria uma nova ordem de compra
   */
  const createPurchaseOrder = useCallback(async (data: CreatePurchaseOrderData): Promise<PurchaseOrder | null> => {
    try {
      const response = await purchaseOrderApi.create(data);
      
      if (response.status === 'success' && response.data) {
        // Recarregar a lista
        await loadPurchaseOrders();
        await loadStats();
        
        toast.success('Ordem de compra criada com sucesso!');
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar ordem de compra');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao criar ordem de compra: ${errorMessage}`);
      console.error('Erro ao criar ordem de compra:', err);
      return null;
    }
  }, [loadPurchaseOrders, loadStats]);

  /**
   * Atualiza uma ordem de compra
   */
  const updatePurchaseOrder = useCallback(async (id: string, data: Partial<CreatePurchaseOrderData>): Promise<PurchaseOrder | null> => {
    try {
      const response = await purchaseOrderApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        // Atualizar na lista local
        setPurchaseOrders(prev => 
          prev.map(order => 
            order.id === id ? response.data! : order
          )
        );
        
        await loadStats();
        toast.success('Ordem de compra atualizada com sucesso!');
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar ordem de compra');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar ordem de compra: ${errorMessage}`);
      console.error('Erro ao atualizar ordem de compra:', err);
      return null;
    }
  }, [loadStats]);

  /**
   * Atualiza a etapa de uma ordem
   */
  const updateStage = useCallback(async (id: string, stage: string): Promise<boolean> => {
    try {
      const response = await purchaseOrderApi.updateStage(id, stage);
      
      if (response.status === 'success' && response.data) {
        // Atualizar na lista local
        setPurchaseOrders(prev => 
          prev.map(order => 
            order.id === id ? { ...order, currentStage: stage } : order
          )
        );
        
        toast.success('Etapa atualizada com sucesso!');
        return true;
      } else {
        throw new Error(response.message || 'Erro ao atualizar etapa');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar etapa: ${errorMessage}`);
      console.error('Erro ao atualizar etapa:', err);
      return false;
    }
  }, []);

  /**
   * Remove uma ordem de compra
   */
  const deletePurchaseOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await purchaseOrderApi.delete(id);
      
      if (response.status === 'success') {
        // Remover da lista local
        setPurchaseOrders(prev => prev.filter(order => order.id !== id));
        
        await loadStats();
        toast.success('Ordem de compra removida com sucesso!');
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover ordem de compra');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao remover ordem de compra: ${errorMessage}`);
      console.error('Erro ao remover ordem de compra:', err);
      return false;
    }
  }, [loadStats]);

  /**
   * Busca uma ordem por ID
   */
  const getPurchaseOrderById = useCallback(async (id: string): Promise<PurchaseOrder | null> => {
    try {
      const response = await purchaseOrderApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Ordem não encontrada');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar ordem de compra:', err);
      return null;
    }
  }, []);

  /**
   * Busca ordens por status
   */
  const getPurchaseOrdersByStatus = useCallback(async (status: string): Promise<PurchaseOrder[]> => {
    try {
      const response = await purchaseOrderApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar ordens por status');
      }
    } catch (err) {
      console.error('Erro ao buscar ordens por status:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(async (filters?: PurchaseOrderFilters) => {
    await Promise.all([
      loadPurchaseOrders(filters),
      loadStats()
    ]);
  }, [loadPurchaseOrders, loadStats]);

  // Carregamento inicial
  // Carregamento inicial (SEM DEPENDÊNCIAS para evitar loops)
  useEffect(() => {
    loadPurchaseOrders();
    loadStats();
  }, []); // ← CORRIGIDO: sem dependências para evitar loops infinitos

  return {
    // Estados
    purchaseOrders,
    loading,
    error,
    stats,
    
    // Ações
    loadPurchaseOrders,
    loadStats,
    createPurchaseOrder,
    updatePurchaseOrder,
    updateStage,
    deletePurchaseOrder,
    getPurchaseOrderById,
    getPurchaseOrdersByStatus,
    refresh,
    
    // Utilitários
    reload: () => refresh(),
    filter: (filters: PurchaseOrderFilters) => loadPurchaseOrders(filters),
  };
};
