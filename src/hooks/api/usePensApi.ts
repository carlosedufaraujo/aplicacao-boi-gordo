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
        setPens(response.data);
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
        setPens(prev => [response.data!, ...prev]);
        toast.success('Curral criado com sucesso');
        loadStats();
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
  }, [loadStats]);

  const updatePen = useCallback(async (id: string, data: UpdatePenData): Promise<Pen | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await penApi.update(id, data);
      if (response.status === 'success' && response.data) {
        setPens(prev => prev.map(pen => pen.id === id ? response.data! : pen));
        toast.success('Curral atualizado com sucesso');
        loadStats();
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
  }, [loadStats]);

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
  }, [loadStats]);

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

  useEffect(() => {
    loadPens();
    loadStats();
  }, [loadPens, loadStats]);

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
  };
};
