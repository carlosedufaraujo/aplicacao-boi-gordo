// Service Worker para funcionamento offline e sincronização
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  pendingOperations: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: string;
      data: any;
      timestamp: Date;
      synced: boolean;
      attempts: number;
    };
  };
  cachedData: {
    key: string;
    value: {
      entity: string;
      data: any;
      timestamp: Date;
      expiresAt: Date;
    };
  };
}

class OfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;

  async initialize() {
    // Inicializar IndexedDB
    this.db = await openDB<OfflineDB>('BoviControlOffline', 1, {
      upgrade(db) {
        // Store para operações pendentes
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }

        // Store para cache de dados
        if (!db.objectStoreNames.contains('cachedData')) {
          const store = db.createObjectStore('cachedData', { keyPath: 'entity' });
          store.createIndex('expiresAt', 'expiresAt');
        }
      }
    });

    // Monitorar status de conexão
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    // Iniciar sincronização periódica
    this.startPeriodicSync();

    console.log('✅ Offline service initialized');
  }

  /**
   * Registrar Service Worker
   */
  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Solicitar permissão para notificações
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Adicionar operação à fila offline
   */
  async queueOperation(type: 'create' | 'update' | 'delete', entity: string, data: any) {
    if (!this.db) return;

    const operation = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      entity,
      data,
      timestamp: new Date(),
      synced: false,
      attempts: 0
    };

    await this.db.add('pendingOperations', operation);
    console.log('Operation queued:', operation);

    // Se estiver online, tentar sincronizar imediatamente
    if (this.isOnline) {
      this.syncOperations();
    }

    return operation.id;
  }

  /**
   * Cachear dados para acesso offline
   */
  async cacheData(entity: string, data: any, ttlMinutes: number = 60) {
    if (!this.db) return;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    await this.db.put('cachedData', {
      entity,
      data,
      timestamp: new Date(),
      expiresAt
    });
  }

  /**
   * Obter dados do cache
   */
  async getCachedData(entity: string): Promise<any | null> {
    if (!this.db) return null;

    const cached = await this.db.get('cachedData', entity);

    if (!cached) return null;

    // Verificar se expirou
    if (new Date() > cached.expiresAt) {
      await this.db.delete('cachedData', entity);
      return null;
    }

    return cached.data;
  }

  /**
   * Sincronizar operações pendentes
   */
  async syncOperations() {
    if (!this.db || !this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('🔄 Starting sync...');

    try {
      const operations = await this.db.getAll('pendingOperations');
      const pending = operations.filter(op => !op.synced);

      for (const operation of pending) {
        try {
          // Enviar operação para o servidor
          const success = await this.sendOperationToServer(operation);

          if (success) {
            // Marcar como sincronizado
            operation.synced = true;
            await this.db.put('pendingOperations', operation);
          } else {
            // Incrementar tentativas
            operation.attempts++;

            if (operation.attempts > 5) {
              // Após 5 tentativas, mover para fila de erros
              console.error('Operation failed after 5 attempts:', operation);
              await this.db.delete('pendingOperations', operation.id);
            } else {
              await this.db.put('pendingOperations', operation);
            }
          }
        } catch (error) {
          console.error('Sync error for operation:', operation, error);
        }
      }

      // Limpar operações sincronizadas antigas
      await this.cleanupSyncedOperations();

      console.log('✅ Sync completed');
      this.notifyUser('Sincronização concluída', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyUser('Erro na sincronização', 'error');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Enviar operação para o servidor
   */
  private async sendOperationToServer(operation: any): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const endpoints: Record<string, Record<string, string>> = {
      'cattle-purchases': {
        create: '/api/v1/cattle-purchases',
        update: `/api/v1/cattle-purchases/${operation.data.id}`,
        delete: `/api/v1/cattle-purchases/${operation.data.id}`
      },
      'sales': {
        create: '/api/v1/sale-records',
        update: `/api/v1/sale-records/${operation.data.id}`,
        delete: `/api/v1/sale-records/${operation.data.id}`
      }
      // Adicionar outros endpoints conforme necessário
    };

    const endpoint = endpoints[operation.entity]?.[operation.type];
    if (!endpoint) return false;

    const methods: Record<string, string> = {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE'
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'https://aplicacao-boi-gordo.pages.dev/api/v1');
      const baseUrl = apiUrl.replace('/api/v1', '');
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: methods[operation.type],
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send operation to server:', error);
      return false;
    }
  }

  /**
   * Limpar operações sincronizadas antigas
   */
  private async cleanupSyncedOperations() {
    if (!this.db) return;

    const operations = await this.db.getAll('pendingOperations');
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24 horas

    for (const op of operations) {
      if (op.synced && op.timestamp < cutoff) {
        await this.db.delete('pendingOperations', op.id);
      }
    }
  }

  /**
   * Handler quando volta online
   */
  private handleOnline() {
    this.isOnline = true;
    console.log('🟢 Back online');
    this.notifyUser('Conexão restaurada', 'success');
    this.syncOperations();
  }

  /**
   * Handler quando fica offline
   */
  private handleOffline() {
    this.isOnline = false;
    console.log('🔴 Gone offline');
    this.notifyUser('Modo offline ativado', 'warning');
  }

  /**
   * Iniciar sincronização periódica
   */
  private startPeriodicSync() {
    // Sincronizar a cada 5 minutos quando online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncOperations();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Parar sincronização periódica
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Notificar usuário
   */
  private notifyUser(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    // Se tiver permissão, usar notificação nativa
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('BoviControl', {
        body: message,
        icon: '/logo.png',
        badge: '/badge.png'
      });
    }

    // Também disparar evento para a UI
    window.dispatchEvent(new CustomEvent('offline-notification', {
      detail: { message, type }
    }));
  }

  /**
   * Obter estatísticas offline
   */
  async getStats() {
    if (!this.db) return null;

    const operations = await this.db.getAll('pendingOperations');
    const cache = await this.db.getAll('cachedData');

    return {
      isOnline: this.isOnline,
      pendingOperations: operations.filter(op => !op.synced).length,
      syncedOperations: operations.filter(op => op.synced).length,
      cachedEntities: cache.length,
      cacheSize: JSON.stringify(cache).length / 1024, // KB
      lastSync: localStorage.getItem('lastSyncTime')
    };
  }

  /**
   * Limpar todos os dados offline
   */
  async clearAll() {
    if (!this.db) return;

    await this.db.clear('pendingOperations');
    await this.db.clear('cachedData');
    localStorage.removeItem('lastSyncTime');
  }

  /**
   * Exportar dados offline para backup
   */
  async exportOfflineData() {
    if (!this.db) return null;

    const operations = await this.db.getAll('pendingOperations');
    const cache = await this.db.getAll('cachedData');

    return {
      operations,
      cache,
      exportedAt: new Date()
    };
  }
}

// Singleton instance
export const offlineService = new OfflineService();
export default offlineService;