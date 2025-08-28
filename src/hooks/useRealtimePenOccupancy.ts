import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Pen } from '../services/supabaseData';

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

export const useRealtimePenOccupancy = () => {
  const [occupancyData, setOccupancyData] = useState<PenOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Função para calcular ocupação baseada nos lotes ativos
  const calculateOccupancy = async (pens: Pen[]): Promise<PenOccupancy[]> => {
    try {
      // Buscar lotes ativos por curral
      const { data: lotPenLinks, error: linksError } = await supabase
        .from('lot_pen_links')
        .select(`
          penId,
          quantity,
          cattle_lots!lotId(
            id,
            status,
            currentQuantity
          )
        `)
        .eq('cattle_lots.status', 'ACTIVE');

      if (linksError) throw linksError;

      // Agrupar por curral
      const occupancyByPen = new Map<string, number>();
      const lotsByPen = new Map<string, number>();

      lotPenLinks?.forEach(link => {
        const penId = link.penId;
        const quantity = link.quantity || 0;
        
        occupancyByPen.set(penId, (occupancyByPen.get(penId) || 0) + quantity);
        lotsByPen.set(penId, (lotsByPen.get(penId) || 0) + 1);
      });

      // Mapear dados de ocupação
      return pens.map(pen => {
        const currentOccupancy = occupancyByPen.get(pen.id) || 0;
        const occupancyRate = pen.capacity > 0 ? (currentOccupancy / pen.capacity) * 100 : 0;
        const activeLots = lotsByPen.get(pen.id) || 0;

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
          currentOccupancy,
          occupancyRate,
          status,
          lastUpdated: new Date(),
          activeLots
        };
      });
    } catch (err: any) {
      console.error('Erro ao calcular ocupação:', err);
      throw err;
    }
  };

  // Carregar dados iniciais
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: pens, error: pensError } = await supabase
        .from('pens')
        .select('*')
        .eq('isActive', true)
        .order('penNumber');

      if (pensError) throw pensError;

      const occupancyData = await calculateOccupancy(pens || []);
      setOccupancyData(occupancyData);
      
    } catch (err: any) {
      console.error('Erro ao carregar dados de ocupação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Configurar subscriptions em tempo real
  useEffect(() => {
    loadInitialData();

    // Subscription para mudanças nos lotes
    const lotsSubscription = supabase
      .channel('lots-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cattle_lots' 
        }, 
        async (payload) => {
          console.log('🔄 Mudança nos lotes detectada:', payload);
          await loadInitialData(); // Recarregar dados
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'lot_pen_links' 
        }, 
        async (payload) => {
          console.log('🔄 Mudança nas alocações detectada:', payload);
          await loadInitialData(); // Recarregar dados
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão realtime:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscription para mudanças nos currais
    const pensSubscription = supabase
      .channel('pens-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pens' 
        }, 
        async (payload) => {
          console.log('🔄 Mudança nos currais detectada:', payload);
          await loadInitialData(); // Recarregar dados
        }
      )
      .subscribe();

    // Atualização periódica (fallback)
    const interval = setInterval(() => {
      if (!loading) {
        loadInitialData();
      }
    }, 30000); // A cada 30 segundos

    return () => {
      lotsSubscription.unsubscribe();
      pensSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Função para obter ocupação de um curral específico
  const getPenOccupancy = (penId: string): PenOccupancy | null => {
    return occupancyData.find(data => data.penId === penId) || null;
  };

  // Função para obter estatísticas gerais
  const getOccupancyStats = () => {
    const total = occupancyData.length;
    const available = occupancyData.filter(p => p.status === 'available').length;
    const partial = occupancyData.filter(p => p.status === 'partial').length;
    const full = occupancyData.filter(p => p.status === 'full').length;
    const maintenance = occupancyData.filter(p => p.status === 'maintenance').length;
    
    const totalCapacity = occupancyData.reduce((sum, p) => sum + p.capacity, 0);
    const totalOccupancy = occupancyData.reduce((sum, p) => sum + p.currentOccupancy, 0);
    const overallOccupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    return {
      total,
      available,
      partial,
      full,
      maintenance,
      totalCapacity,
      totalOccupancy,
      overallOccupancyRate
    };
  };

  return {
    occupancyData,
    loading,
    error,
    isConnected,
    getPenOccupancy,
    getOccupancyStats,
    refresh: loadInitialData
  };
};
