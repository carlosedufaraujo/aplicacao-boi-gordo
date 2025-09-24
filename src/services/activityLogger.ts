/**
 * Serviço centralizado para registrar todas as atividades do sistema
 */

export interface Activity {
  id: string;
  timestamp: Date;
  type: ActivityType;
  action: ActivityAction;
  category: ActivityCategory;
  title: string;
  description: string;
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
  icon?: string;
  color?: string;
}

export type ActivityType =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'sync'
  | 'status_change'
  | 'payment'
  | 'transfer';

export type ActivityAction =
  | 'added'
  | 'edited'
  | 'deleted'
  | 'viewed'
  | 'exported'
  | 'imported'
  | 'synced'
  | 'status_changed'
  | 'paid'
  | 'received'
  | 'transferred';

export type ActivityCategory =
  | 'cattle_purchase'
  | 'sale'
  | 'lot'
  | 'financial'
  | 'expense'
  | 'revenue'
  | 'partner'
  | 'pen'
  | 'intervention'
  | 'report'
  | 'settings'
  | 'user'
  | 'system';

class ActivityLoggerService {
  private activities: Activity[] = [];
  private maxActivities = 1000; // Limite de atividades em memória
  private listeners: ((activity: Activity) => void)[] = [];
  private storageKey = 'system_activities';

  constructor() {
    this.loadActivities();
  }

  /**
   * Registra uma nova atividade
   */
  public log(params: {
    type: ActivityType;
    action: ActivityAction;
    category: ActivityCategory;
    title: string;
    description: string;
    entityId?: string;
    entityName?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
    importance?: 'low' | 'medium' | 'high';
    icon?: string;
    color?: string;
  }): Activity {
    const activity: Activity = {
      id: this.generateId(),
      timestamp: new Date(),
      type: params.type,
      action: params.action,
      category: params.category,
      title: params.title,
      description: params.description,
      entityId: params.entityId,
      entityName: params.entityName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      metadata: params.metadata,
      importance: params.importance || 'medium',
      icon: params.icon || this.getDefaultIcon(params.category),
      color: params.color || this.getDefaultColor(params.type)
    };

    this.activities.unshift(activity); // Adiciona no início (mais recente primeiro)

    // Limita o número de atividades em memória
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    this.saveActivities();
    this.notifyListeners(activity);

    return activity;
  }

  /**
   * Registra criação de entidade
   */
  public logCreate(category: ActivityCategory, entityName: string, entityId?: string, details?: any) {
    return this.log({
      type: 'create',
      action: 'added',
      category,
      title: `${this.getCategoryName(category)} Criado`,
      description: `${entityName} foi adicionado ao sistema`,
      entityId,
      entityName,
      newValue: details,
      importance: 'high',
      icon: 'Plus',
      color: '#10b981'
    });
  }

  /**
   * Registra atualização de entidade
   */
  public logUpdate(category: ActivityCategory, entityName: string, entityId?: string, oldValue?: any, newValue?: any) {
    return this.log({
      type: 'update',
      action: 'edited',
      category,
      title: `${this.getCategoryName(category)} Atualizado`,
      description: `${entityName} foi modificado`,
      entityId,
      entityName,
      oldValue,
      newValue,
      importance: 'medium',
      icon: 'Edit',
      color: '#3b82f6'
    });
  }

  /**
   * Registra exclusão de entidade
   */
  public logDelete(category: ActivityCategory, entityName: string, entityId?: string, details?: any) {
    return this.log({
      type: 'delete',
      action: 'deleted',
      category,
      title: `${this.getCategoryName(category)} Excluído`,
      description: `${entityName} foi removido do sistema`,
      entityId,
      entityName,
      oldValue: details,
      importance: 'high',
      icon: 'Trash',
      color: '#ef4444'
    });
  }

  /**
   * Registra mudança de status
   */
  public logStatusChange(category: ActivityCategory, entityName: string, oldStatus: string, newStatus: string, entityId?: string) {
    return this.log({
      type: 'status_change',
      action: 'status_changed',
      category,
      title: `Status Alterado`,
      description: `${entityName} mudou de ${oldStatus} para ${newStatus}`,
      entityId,
      entityName,
      oldValue: oldStatus,
      newValue: newStatus,
      importance: 'high',
      icon: 'RefreshCw',
      color: '#f59e0b'
    });
  }

  /**
   * Registra transação financeira
   */
  public logFinancialTransaction(
    type: 'expense' | 'revenue',
    description: string,
    amount: number,
    entityId?: string,
    metadata?: Record<string, any>
  ) {
    return this.log({
      type: 'payment',
      action: type === 'expense' ? 'paid' : 'received',
      category: 'financial',
      title: type === 'expense' ? 'Despesa Registrada' : 'Receita Registrada',
      description,
      entityId,
      newValue: amount,
      metadata,
      importance: 'high',
      icon: 'DollarSign',
      color: type === 'expense' ? '#ef4444' : '#10b981'
    });
  }

  /**
   * Obtém todas as atividades
   */
  public getAll(): Activity[] {
    return [...this.activities];
  }

  /**
   * Obtém atividades por categoria
   */
  public getByCategory(category: ActivityCategory): Activity[] {
    return this.activities.filter(a => a.category === category);
  }

  /**
   * Obtém atividades por tipo
   */
  public getByType(type: ActivityType): Activity[] {
    return this.activities.filter(a => a.type === type);
  }

  /**
   * Obtém atividades recentes
   */
  public getRecent(limit: number = 50): Activity[] {
    return this.activities.slice(0, limit);
  }

  /**
   * Obtém atividades por período
   */
  public getByDateRange(startDate: Date, endDate: Date): Activity[] {
    return this.activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  /**
   * Busca atividades
   */
  public search(query: string): Activity[] {
    const lowerQuery = query.toLowerCase();
    return this.activities.filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.description.toLowerCase().includes(lowerQuery) ||
      a.entityName?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Limpa todas as atividades
   */
  public clear() {
    this.activities = [];
    this.saveActivities();
  }

  /**
   * Adiciona listener para novas atividades
   */
  public subscribe(listener: (activity: Activity) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Métodos privados
   */
  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 'system';
  }

  private getCurrentUserName(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || user.email || 'Sistema';
  }

  private getCategoryName(category: ActivityCategory): string {
    const names: Record<ActivityCategory, string> = {
      cattle_purchase: 'Compra de Gado',
      sale: 'Venda',
      lot: 'Lote',
      financial: 'Financeiro',
      expense: 'Despesa',
      revenue: 'Receita',
      partner: 'Parceiro',
      pen: 'Curral',
      intervention: 'Intervenção',
      report: 'Relatório',
      settings: 'Configuração',
      user: 'Usuário',
      system: 'Sistema'
    };
    return names[category] || category;
  }

  private getDefaultIcon(category: ActivityCategory): string {
    const icons: Record<ActivityCategory, string> = {
      cattle_purchase: 'ShoppingCart',
      sale: 'TrendingUp',
      lot: 'Package',
      financial: 'DollarSign',
      expense: 'TrendingDown',
      revenue: 'TrendingUp',
      partner: 'Users',
      pen: 'Home',
      intervention: 'Activity',
      report: 'FileText',
      settings: 'Settings',
      user: 'User',
      system: 'Monitor'
    };
    return icons[category] || 'Circle';
  }

  private getDefaultColor(type: ActivityType): string {
    const colors: Record<ActivityType, string> = {
      create: '#10b981',
      update: '#3b82f6',
      delete: '#ef4444',
      view: '#6b7280',
      export: '#8b5cf6',
      import: '#ec4899',
      sync: '#06b6d4',
      status_change: '#f59e0b',
      payment: '#10b981',
      transfer: '#3b82f6'
    };
    return colors[type] || '#6b7280';
  }

  private notifyListeners(activity: Activity) {
    this.listeners.forEach(listener => {
      try {
        listener(activity);
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  private loadActivities() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.activities = parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  private saveActivities() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.activities));
    } catch (error) {
      console.error('Error saving activities:', error);
      // Se o localStorage estiver cheio, limpa atividades antigas
      if (this.activities.length > 100) {
        this.activities = this.activities.slice(0, 100);
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.activities));
        } catch (e) {
          console.error('Still cannot save activities:', e);
        }
      }
    }
  }
}

// Singleton instance with lazy initialization and error handling
let activityLoggerInstance: ActivityLoggerService | null = null;

export const getActivityLogger = (): ActivityLoggerService => {
  if (!activityLoggerInstance) {
    try {
      activityLoggerInstance = new ActivityLoggerService();
    } catch (error) {
      console.error('Error creating ActivityLoggerService instance:', error);
      // Create a minimal fallback instance
      activityLoggerInstance = new ActivityLoggerService();
    }
  }
  return activityLoggerInstance;
};

// Export for backward compatibility - completely deferred initialization
export const activityLogger = {
  get instance() {
    return getActivityLogger();
  },
  // Proxy all methods to the singleton instance
  logCreate(entity: string, entityId: string, details?: any) { 
    return this.instance.logCreate(entity, entityId, details); 
  },
  logUpdate(entity: string, entityId: string, changes?: any, details?: any) { 
    return this.instance.logUpdate(entity, entityId, changes, details); 
  },
  logDelete(entity: string, entityId: string, details?: any) { 
    return this.instance.logDelete(entity, entityId, details); 
  },
  logCustom(action: string, entity: string, entityId: string, details?: any) { 
    return this.instance.logCustom(action, entity, entityId, details); 
  },
  getActivities(filters?: any) { 
    return this.instance.getActivities(filters); 
  },
  getEntityHistory(entity: string, entityId: string) { 
    return this.instance.getEntityHistory(entity, entityId); 
  },
  getUserActivities(userId: string, limit?: number) { 
    return this.instance.getUserActivities(userId, limit); 
  },
  getRecentActivities(limit?: number) { 
    return this.instance.getRecentActivities(limit); 
  },
  clearOldActivities(daysToKeep?: number) { 
    return this.instance.clearOldActivities(daysToKeep); 
  }
};

// Exporta também a classe para testes
export { ActivityLoggerService };