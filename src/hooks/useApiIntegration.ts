// Hook para facilitar a integração com API
import { useEffect, useState } from 'react';
import { useAppStoreWithAPI } from '../stores/useAppStoreWithAPI';
import api from '../services/api';

export const useApiIntegration = () => {
  const store = useAppStoreWithAPI();
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await api.healthCheck();
        setConnectionStatus(isHealthy ? 'online' : 'offline');
        
        if (isHealthy && !isInitialized) {
          // Sincronizar dados iniciais
          await store.syncWithBackend();
          setIsInitialized(true);
        }
      } catch (_error) {
        console.error('Erro ao verificar conexão:', error);
        setConnectionStatus('offline');
      }
    };

    checkConnection();
    
    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [store, isInitialized]);

  return {
    ...store,
    connectionStatus,
    isInitialized,
    isOnline: connectionStatus === 'online',
  };
};

// Hook para componentes que precisam de dados específicos
export const useApiData = (dataType: string, filters?: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        switch (dataType) {
          case 'pens':
      {
            result = await api.cadastros.pens.getAll();
            }
      break;
          case 'partners':
      {
            result = await api.cadastros.partners.getAll(filters?.type);
            }
      break;
          case 'cycles':
      {
            result = await api.cadastros.cycles.getAll();
            }
      break;
          case 'cattlePurchases':
      {
            result = await api.pipeline.cattlePurchases.getAll(filters);
            }
      break;
          case 'lots':
      {
            result = await api.lots.lots.getAll(filters);
            }
      break;
          case 'expenses':
      {
            result = await api.financial.expenses.getAll(filters);
            }
      break;
          case 'dashboard':
      {
            result = await api.dashboard.getAll(filters?.period);
            }
      break;
          default:
            throw new Error(`Tipo de dados não suportado: ${dataType}`);
        }
        
        setData(result);
      } catch (err) {
        console.error(`Erro ao carregar ${dataType}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataType, JSON.stringify(filters)]);

  const refresh = async () => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        switch (dataType) {
          case 'pens':
      {
            result = await api.cadastros.pens.getAll();
            }
      break;
          case 'partners':
      {
            result = await api.cadastros.partners.getAll(filters?.type);
            }
      break;
          case 'cycles':
      {
            result = await api.cadastros.cycles.getAll();
            }
      break;
          case 'cattlePurchases':
      {
            result = await api.pipeline.cattlePurchases.getAll(filters);
            }
      break;
          case 'lots':
      {
            result = await api.lots.lots.getAll(filters);
            }
      break;
          case 'expenses':
      {
            result = await api.financial.expenses.getAll(filters);
            }
      break;
          case 'dashboard':
      {
            result = await api.dashboard.getAll(filters?.period);
            }
      break;
          default:
            throw new Error(`Tipo de dados não suportado: ${dataType}`);
        }
        
        setData(result);
      } catch (err) {
        console.error(`Erro ao carregar ${dataType}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    await fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
};

export default useApiIntegration;
