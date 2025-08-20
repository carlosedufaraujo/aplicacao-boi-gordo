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
      console.log('🔄 Iniciando busca de dados...');
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Testar conexão
      console.log('🧪 Testando health check...');
      const healthResult = await apiService.healthCheck();
      console.log('✅ Health check OK:', healthResult);
      
      // Buscar dados
      console.log('📊 Buscando dados...');
      const [frontendData, stats] = await Promise.all([
        apiService.getFrontendData(),
        apiService.getStats()
      ]);

      console.log('📦 Dados recebidos:', { frontendData, stats });

      setState({
        lots: frontendData.lots || [],
        stats: stats.stats || {},
        loading: false,
        error: null,
        connected: true
      });

      console.log('✅ Estado atualizado com sucesso!');
      console.log('📊 Stats finais:', stats.stats);
      console.log('🐄 Lotes finais:', frontendData.lots);
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
