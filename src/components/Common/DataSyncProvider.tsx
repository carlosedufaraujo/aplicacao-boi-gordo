// Componente para gerenciar sincronização automática de dados
import React, { useEffect, useState, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, WifiOff, Wifi } from 'lucide-react';
import { useAppStoreWithAPI } from '../../stores/useAppStoreWithAPI';
import api from '../../services/api';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
  pendingChanges: number;
}

interface SyncContextType {
  status: SyncStatus;
  syncNow: () => Promise<void>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const useDataSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within DataSyncProvider');
  }
  return context;
};

interface DataSyncProviderProps {
  children: React.ReactNode;
  autoSync?: boolean;
  syncInterval?: number; // em milissegundos
  showStatus?: boolean;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({
  children,
  autoSync = true,
  syncInterval = 5 * 60 * 1000, // 5 minutos
  showStatus = true,
}) => {
  const store = useAppStoreWithAPI();
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSync: null,
    error: null,
    pendingChanges: 0,
  });

  // Verificar conexão
  const checkConnection = async () => {
    try {
      const isHealthy = await api.healthCheck();
      setStatus(prev => ({ ...prev, isOnline: isHealthy }));
      return isHealthy;
    } catch {
      setStatus(prev => ({ ...prev, isOnline: false }));
      return false;
    }
  };

  // Sincronizar dados
  const syncNow = async () => {
    if (status.isSyncing) return;

    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        throw new Error('Sem conexão com o servidor');
      }

      await store.syncWithBackend();
      
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingChanges: 0,
      }));
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
    }
  };

  // Limpar erro
  const clearError = () => {
    setStatus(prev => ({ ...prev, error: null }));
  };

  // Verificar conexão periodicamente
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Auto-sync
  useEffect(() => {
    if (!autoSync) return;

    // Sync inicial
    syncNow();

    // Sync periódico
    const interval = setInterval(syncNow, syncInterval);
    
    return () => clearInterval(interval);
  }, [autoSync, syncInterval]);

  // Sync quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      syncNow();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ status, syncNow, clearError }}>
      {children}
      {showStatus && <SyncStatusIndicator />}
    </SyncContext.Provider>
  );
};

// Componente de indicador de status
const SyncStatusIndicator: React.FC = () => {
  const { status, syncNow, clearError } = useDataSync();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        bg-white rounded-lg shadow-lg border transition-all duration-300
        ${isExpanded ? 'w-80' : 'w-auto'}
      `}>
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {status.isSyncing ? (
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            ) : status.isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            
            <span className="text-sm font-medium">
              {status.isSyncing ? 'Sincronizando...' : 
               status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {!status.isSyncing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncNow();
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Sincronizar agora"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="border-t px-3 py-2 space-y-2">
            {status.lastSync && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Última sincronização:</span>
                <span className="text-gray-700">
                  {new Date(status.lastSync).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            )}

            {status.pendingChanges > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Alterações pendentes:</span>
                <span className="text-orange-600 font-medium">
                  {status.pendingChanges}
                </span>
              </div>
            )}

            {status.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-700">{status.error}</p>
                    <button
                      onClick={clearError}
                      className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                    >
                      Limpar erro
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <button
                onClick={() => syncNow()}
                disabled={status.isSyncing || !status.isOnline}
                className={`
                  w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors
                  ${status.isSyncing || !status.isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }
                `}
              >
                {status.isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSyncProvider;