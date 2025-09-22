import { useEffect, useState } from 'react';
import { activityLogger, Activity, ActivityCategory, ActivityType } from '@/services/activityLogger';

/**
 * Hook para usar o Activity Logger e receber atualizações em tempo real
 */
export const useActivityLogger = (options?: {
  category?: ActivityCategory;
  type?: ActivityType;
  limit?: number;
  autoRefresh?: boolean;
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega atividades iniciais
    loadActivities();

    // Se autoRefresh estiver ativado, inscreve para atualizações
    if (options?.autoRefresh !== false) {
      const unsubscribe = activityLogger.subscribe((newActivity) => {
        // Verifica se a nova atividade atende aos filtros
        if (options?.category && newActivity.category !== options.category) return;
        if (options?.type && newActivity.type !== options.type) return;

        setActivities(prev => {
          const updated = [newActivity, ...prev];
          return options?.limit ? updated.slice(0, options.limit) : updated;
        });
      });

      return unsubscribe;
    }
  }, [options?.category, options?.type, options?.limit, options?.autoRefresh]);

  const loadActivities = () => {
    setLoading(true);
    try {
      let result = activityLogger.getAll();

      // Aplica filtros se especificados
      if (options?.category) {
        result = result.filter(a => a.category === options.category);
      }
      if (options?.type) {
        result = result.filter(a => a.type === options.type);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }

      setActivities(result);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = activityLogger.log.bind(activityLogger);
  const logCreate = activityLogger.logCreate.bind(activityLogger);
  const logUpdate = activityLogger.logUpdate.bind(activityLogger);
  const logDelete = activityLogger.logDelete.bind(activityLogger);
  const logStatusChange = activityLogger.logStatusChange.bind(activityLogger);
  const logFinancialTransaction = activityLogger.logFinancialTransaction.bind(activityLogger);

  const searchActivities = (query: string) => {
    const result = activityLogger.search(query);
    setActivities(result);
  };

  const filterByDateRange = (startDate: Date, endDate: Date) => {
    const result = activityLogger.getByDateRange(startDate, endDate);
    setActivities(result);
  };

  const refresh = () => {
    loadActivities();
  };

  const clearAll = () => {
    activityLogger.clear();
    setActivities([]);
  };

  return {
    activities,
    loading,
    logActivity,
    logCreate,
    logUpdate,
    logDelete,
    logStatusChange,
    logFinancialTransaction,
    searchActivities,
    filterByDateRange,
    refresh,
    clearAll
  };
};