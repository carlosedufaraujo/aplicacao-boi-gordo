import { useState, useEffect, useCallback } from 'react';
import { cycleApi, Cycle, CreateCycleData, UpdateCycleData, CycleFilters, CycleStats } from '@/services/api/cycleApi';
import { toast } from 'sonner';

export const useCyclesApi = (initialFilters: CycleFilters = {}) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CycleStats | null>(null);

  const loadCycles = useCallback(async (filters: CycleFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleApi.getAll({ ...initialFilters, ...filters });
      if (response.status === 'success' && response.data) {
        setCycles(response.data);
      } else {
        throw new Error(response.message || 'Erro ao carregar ciclos');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar ciclos:', err);
      toast.error('Erro ao carregar ciclos');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await cycleApi.getStats();
      if (response.status === 'success' && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const createCycle = useCallback(async (data: CreateCycleData): Promise<Cycle | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleApi.create(data);
      if (response.status === 'success' && response.data) {
        setCycles(prev => [response.data!, ...prev]);
        toast.success('Ciclo criado com sucesso');
        loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar ciclo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar ciclo:', err);
      toast.error('Erro ao criar ciclo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  const updateCycle = useCallback(async (id: string, data: UpdateCycleData): Promise<Cycle | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleApi.update(id, data);
      if (response.status === 'success' && response.data) {
        setCycles(prev => prev.map(cycle => cycle.id === id ? response.data! : cycle));
        toast.success('Ciclo atualizado com sucesso');
        loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar ciclo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar ciclo:', err);
      toast.error('Erro ao atualizar ciclo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  const completeCycle = useCallback(async (id: string, actualEndDate?: string): Promise<Cycle | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleApi.complete(id, actualEndDate);
      if (response.status === 'success' && response.data) {
        setCycles(prev => prev.map(cycle => cycle.id === id ? response.data! : cycle));
        toast.success('Ciclo completado com sucesso');
        loadStats();
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao completar ciclo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao completar ciclo:', err);
      toast.error('Erro ao completar ciclo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  const deleteCycle = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await cycleApi.remove(id);
      if (response.status === 'success') {
        setCycles(prev => prev.filter(cycle => cycle.id !== id));
        toast.success('Ciclo removido com sucesso');
        loadStats();
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover ciclo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover ciclo:', err);
      toast.error('Erro ao remover ciclo');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  const getCurrentCycle = useCallback(async (): Promise<Cycle | null> => {
    try {
      const response = await cycleApi.getCurrent();
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar ciclo atual:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(() => {
    loadCycles();
    loadStats();
  }, [loadCycles, loadStats]);

  useEffect(() => {
    loadCycles();
    loadStats();
  }, [loadCycles, loadStats]);

  return {
    cycles,
    loading,
    error,
    stats,
    createCycle,
    updateCycle,
    completeCycle,
    deleteCycle,
    getCurrentCycle,
    refresh,
  };
};
