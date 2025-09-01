import { useState, useEffect, useCallback } from 'react';
import { penApi } from '@/services/api/penApi';
import { toast } from 'sonner';

interface PenOccupancy {
  penId: string;
  penNumber: string;
  capacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  status: 'available' | 'partial' | 'full' | 'maintenance';
  lastUpdated: Date;
  activeLots: number;
}

/**
 * Hook para gerenciar ocupação de currais via API Backend
 * Substitui o hook useRealtimePenOccupancy que usava dados mockados
 */
export const usePenOccupancyApi = () => {
  const [occupancyData, setOccupancyData] = useState<PenOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Carrega dados de ocupação dos currais
   */
  const loadOccupancyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Busca todos os currais com suas estatísticas
      const response = await penApi.getAll({ includeStats: true });
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        const pens = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || [];

        // Mapear para formato de ocupação
        const occupancy: PenOccupancy[] = pens.map(pen => {
          const occupancyRate = pen.capacity > 0 
            ? (pen.currentOccupancy / pen.capacity) * 100 
            : 0;

          let status: PenOccupancy['status'] = 'available';
          if (!pen.isActive) {
            status = 'maintenance';
          } else if (occupancyRate >= 95) {
            status = 'full';
          } else if (occupancyRate > 0) {
            status = 'partial';
          }

          return {
            penId: pen.id,
            penNumber: pen.penNumber,
            capacity: pen.capacity,
            currentOccupancy: pen.currentOccupancy || 0,
            occupancyRate,
            status,
            lastUpdated: new Date(pen.updatedAt),
            activeLots: pen.activeLots || 0
          };
        });

        setOccupancyData(occupancy);
        setIsConnected(true);
      } else {
        throw new Error(response.message || 'Erro ao carregar ocupação dos currais');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar ocupação dos currais:', err);
      
      // Não mostrar toast para erros de autenticação
      if (!errorMessage.includes('Token')) {
        toast.error('Erro ao carregar ocupação dos currais');
      }
      
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega estatísticas resumidas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await penApi.getStats();
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      return null;
    }
  }, []);

  /**
   * Atualiza ocupação de um curral específico
   */
  const updatePenOccupancy = useCallback(async (penId: string, newOccupancy: number) => {
    try {
      const response = await penApi.updateOccupancy(penId, newOccupancy);
      
      if (response.status === 'success') {
        // Recarrega dados após atualização
        await loadOccupancyData();
        toast.success('Ocupação atualizada com sucesso');
        return true;
      }
      
      throw new Error(response.message || 'Erro ao atualizar ocupação');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao atualizar ocupação:', err);
      toast.error('Erro ao atualizar ocupação');
      return false;
    }
  }, [loadOccupancyData]);

  // Carrega dados iniciais
  useEffect(() => {
    loadOccupancyData();

    // Atualização periódica a cada 30 segundos
    const interval = setInterval(() => {
      if (!loading) {
        loadOccupancyData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadOccupancyData]);

  return {
    occupancyData,
    loading,
    error,
    isConnected,
    reload: loadOccupancyData,
    loadStats,
    updatePenOccupancy,
    // Estatísticas calculadas
    totalPens: occupancyData.length,
    availablePens: occupancyData.filter(p => p.status === 'available').length,
    partialPens: occupancyData.filter(p => p.status === 'partial').length,
    fullPens: occupancyData.filter(p => p.status === 'full').length,
    maintenancePens: occupancyData.filter(p => p.status === 'maintenance').length,
    totalCapacity: occupancyData.reduce((sum, p) => sum + p.capacity, 0),
    totalOccupancy: occupancyData.reduce((sum, p) => sum + p.currentOccupancy, 0),
    averageOccupancyRate: occupancyData.length > 0 
      ? occupancyData.reduce((sum, p) => sum + p.occupancyRate, 0) / occupancyData.length 
      : 0,
  };
};