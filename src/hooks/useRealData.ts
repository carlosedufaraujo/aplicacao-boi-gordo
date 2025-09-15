import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface RealDataState {
  lots: any[];
  stats: any;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function useRealData() {
  const [state, setState] = useState<RealDataState>({
    lots: [],
    stats: null,
    loading: true,
    error: null,
    connected: false
  });

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Testar conexão
      const healthResult = await apiService.healthCheck();
      
      // Buscar dados
      const [frontendData, stats] = await Promise.all([
        apiService.getFrontendData(),
        apiService.getStats()
      ]);
      setState({
        lots: frontendData.lots || [],
        stats: stats.stats || {},
        loading: false,
        error: null,
        connected: true
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        connected: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...state,
    refetch: fetchData
  };
}
