import { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import { penApi } from '../services/api/penApi';

interface PenOccupancy {
  penId: string;
  penNumber: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancyRate: number;
  lots: Array<{
    lotId: string;
    lotCode: string;
    quantity: number;
    entryDate: string;
  }>;
}

export const useRealtimePenOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState<PenOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados iniciais via API
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const response = await penApi.getOccupancyStats();
        
        if (response.data) {
          setOccupancyData(response.data);
        }
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar ocupação de currais:', err);
        setError('Erro ao carregar dados de ocupação');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Inscrever-se para atualizações em tempo real via Socket.io
    const handleOccupancyUpdate = (data: any) => {
      
      if (data.type === 'full_update') {
        setOccupancyData(data.occupancy);
      } else if (data.type === 'pen_update') {
        setOccupancyData((prev) => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.penId === data.penId);
          
          if (index >= 0) {
            updated[index] = data.occupancy;
          } else {
            updated.push(data.occupancy);
          }
          
          return updated;
        });
      }
    };

    // Conectar ao socket se houver token
    const token = localStorage.getItem('authToken');
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    // Inscrever-se para atualizações
    socketService.subscribePenOccupancy(handleOccupancyUpdate);

    // Cleanup
    return () => {
      socketService.unsubscribePenOccupancy();
    };
  }, []);

  // Função para atualizar manualmente
  const refresh = async () => {
    try {
      setLoading(true);
      const response = await penApi.getOccupancyStats();
      
      if (response.data) {
        setOccupancyData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('Erro ao atualizar ocupação:', err);
      setError('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas totais
  const totalStats = occupancyData.reduce(
    (acc, pen) => ({
      totalCapacity: acc.totalCapacity + pen.capacity,
      totalOccupied: acc.totalOccupied + pen.occupied,
      totalAvailable: acc.totalAvailable + pen.available,
    }),
    { totalCapacity: 0, totalOccupied: 0, totalAvailable: 0 }
  );

  const overallOccupancyRate = totalStats.totalCapacity > 0
    ? (totalStats.totalOccupied / totalStats.totalCapacity) * 100
    : 0;

  return {
    occupancyData,
    loading,
    error,
    refresh,
    totalStats: {
      ...totalStats,
      occupancyRate: overallOccupancyRate,
    },
  };
};
