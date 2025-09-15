import { useState, useEffect, useCallback } from 'react';
import { salesApi, Sale, CreateSaleData, UpdateSaleData, SaleFilters, SaleStats } from '@/services/api/salesApi';
import { toast } from 'sonner';

export const useSalesApi = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SaleStats | null>(null);

  // Carregar vendas
  const loadSales = useCallback(async (filters?: SaleFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await salesApi.findAll(filters);
      
      setSales(data || []);
    } catch (err: any) {
      console.error('❌ Erro ao carregar vendas:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar vendas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const statsData = await salesApi.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas de vendas:', err);
    }
  }, []);

  // Buscar venda por ID
  const getSaleById = useCallback(async (id: string): Promise<Sale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const sale = await salesApi.findById(id);
      
      return sale;
    } catch (err: any) {
      console.error('❌ Erro ao buscar venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova venda
  const createSale = useCallback(async (saleData: CreateSaleData): Promise<Sale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newSale = await salesApi.create(saleData);
      
      // Atualizar lista local
      setSales(prev => [newSale, ...prev]);
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Venda criada com sucesso!');
      return newSale;
    } catch (err: any) {
      console.error('❌ Erro ao criar venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Atualizar venda
  const updateSale = useCallback(async (id: string, updates: UpdateSaleData): Promise<Sale | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSale = await salesApi.update(id, updates);
      
      // Atualizar lista local
      setSales(prev => prev.map(sale => 
        sale.id === id ? updatedSale : sale
      ));
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Venda atualizada com sucesso!');
      return updatedSale;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Excluir venda
  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await salesApi.delete(id);
      
      // Remover da lista local
      setSales(prev => prev.filter(sale => sale.id !== id));
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Venda excluída com sucesso!');
      return true;
    } catch (err: any) {
      console.error('❌ Erro ao excluir venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Refresh (recarregar dados)
  const refresh = useCallback(async (filters?: SaleFilters) => {
    await Promise.all([
      loadSales(filters),
      loadStats()
    ]);
  }, [loadSales, loadStats]);

  // Carregar dados iniciais
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // Estado
    sales,
    loading,
    error,
    stats,
    
    // Funções
    getSaleById,
    createSale,
    updateSale,
    deleteSale,
    refresh,
    loadSales
  };
};
