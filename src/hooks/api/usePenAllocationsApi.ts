import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { getApiBaseUrl } from '@/config/api.config';
const API_BASE_URL = import.meta.env.VITE_API_URL || getApiBaseUrl();

interface PenAllocation {
  id: string;
  penId: string;
  lotId: string;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  status: 'ACTIVE' | 'REMOVED';
  createdAt: string;
  updatedAt: string;
}

interface CreateAllocationData {
  penId: string;
  lotId: string;
  quantity: number;
  entryDate: string;
}

export const usePenAllocationsApi = () => {
  const [allocations, setAllocations] = useState<PenAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pen-allocations`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAllocations(data);
    } catch (err: any) {
      console.error('Erro ao buscar alocações:', err);
      setError(err.message || 'Erro ao carregar alocações');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAllocation = async (data: CreateAllocationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pen-allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      setAllocations(prev => [...prev, responseData]);
      toast.success('Animais alocados com sucesso');
      
      // Atualizar lista de alocações
      await fetchAllocations();
      
      return responseData;
    } catch (err: any) {
      console.error('Erro ao criar alocação:', err);
      const errorMessage = err.message || 'Erro ao alocar animais';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateAllocation = async (id: string, data: Partial<PenAllocation>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pen-allocations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      setAllocations(prev => prev.map(alloc => 
        alloc.id === id ? responseData : alloc
      ));
      toast.success('Alocação atualizada com sucesso');
      return responseData;
    } catch (err: any) {
      console.error('Erro ao atualizar alocação:', err);
      const errorMessage = err.message || 'Erro ao atualizar alocação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeAllocation = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pen-allocations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      setAllocations(prev => prev.filter(alloc => alloc.id !== id));
      toast.success('Alocação removida com sucesso');
    } catch (err: any) {
      console.error('Erro ao remover alocação:', err);
      const errorMessage = err.message || 'Erro ao remover alocação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAllocationsByPen = useCallback((penId: string) => {
    return allocations.filter(alloc => alloc.penId === penId && alloc.status === 'ACTIVE');
  }, [allocations]);

  const getAllocationsByLot = useCallback((lotId: string) => {
    return allocations.filter(alloc => alloc.lotId === lotId && alloc.status === 'ACTIVE');
  }, [allocations]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  return {
    allocations,
    loading,
    error,
    createAllocation,
    updateAllocation,
    removeAllocation,
    getAllocationsByPen,
    getAllocationsByLot,
    refresh: fetchAllocations
  };
};
