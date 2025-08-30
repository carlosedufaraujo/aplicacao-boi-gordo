import { useState, useEffect, useCallback } from 'react';
import { penApi, Pen, PenOccupancy, CreatePenData, UpdatePenData, PenFilters, PenStats } from '@/services/api/penApi';
import { toast } from 'sonner';

export const usePensApi = (initialFilters: PenFilters = {}) => {
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PenStats | null>(null);

  const loadPens = useCallback(async (filters: PenFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await penApi.getAll({ ...initialFilters, ...filters });
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];
        setPens(items);
      } else {
        throw new Error(response.message || 'Erro ao carregar currais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar currais:', err);
      toast.error('Erro ao carregar currais');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await penApi.getStats();
      if (response.status === 'success' && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const createPen = useCallback(async (data: CreatePenData): Promise<Pen | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await penApi.create(data);
      if (response.status === 'success' && response.data) {
        toast.success('Curral criado com sucesso');
        // Recarregar a lista completa para garantir sincronização
        await loadPens();
        await loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar curral');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar curral:', err);
      toast.error('Erro ao criar curral');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPens, loadStats]);

  const updatePen = useCallback(async (id: string, data: UpdatePenData): Promise<Pen | null> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[updatePen] Atualizando curral:', { id, data });
      const response = await penApi.update(id, data);
      console.log('[updatePen] Resposta:', response);
      if (response.status === 'success' && response.data) {
        toast.success('Curral atualizado com sucesso');
        // Recarregar a lista completa para garantir sincronização
        await loadPens();
        await loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar curral');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar curral:', err);
      toast.error('Erro ao atualizar curral');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPens, loadStats]);

  const deletePen = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await penApi.remove(id);
      if (response.status === 'success') {
        setPens(prev => prev.filter(pen => pen.id !== id));
        toast.success('Curral removido com sucesso');
        loadStats();
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover curral');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover curral:', err);
      toast.error('Erro ao remover curral');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPens, loadStats]);

  const getPenOccupancy = useCallback(async (): Promise<PenOccupancy[]> => {
    try {
      const response = await penApi.getOccupancy();
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Erro ao buscar ocupação:', err);
      return [];
    }
  }, []);

  const refresh = useCallback(() => {
    loadPens();
    loadStats();
  }, [loadPens, loadStats]);

  // Carregamento inicial
  useEffect(() => {
    console.log('[usePensApi] Montando componente, iniciando carregamento...');
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Carregar pens e stats em paralelo
        const [pensResponse, statsResponse] = await Promise.all([
          penApi.getAll(initialFilters),
          penApi.getStats()
        ]);
        
        if (pensResponse.status === 'success' && pensResponse.data) {
          const items = Array.isArray(pensResponse.data) 
            ? pensResponse.data 
            : pensResponse.data.data || [];
          setPens(items);
        }
        
        if (statsResponse.status === 'success' && statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        console.error('[usePensApi] Erro no carregamento inicial:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); // Executar apenas na montagem

  return {
    pens,
    loading,
    error,
    stats,
    createPen,
    updatePen,
    deletePen,
    getPenOccupancy,
    refresh,
    reload: refresh, // Alias para compatibilidade
  };
};
