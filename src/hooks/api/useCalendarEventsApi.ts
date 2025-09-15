import { useState, useEffect, useCallback } from 'react';
import calendarEventService, { 
  CalendarEvent, 
  CreateCalendarEventData, 
  UpdateCalendarEventData, 
  CalendarEventFilters, 
  CalendarEventStats 
} from '@/services/api/calendarEvent';
import { toast } from 'sonner';
import { showErrorNotification, showSuccessNotification } from '@/utils/errorHandler';

export const useCalendarEventsApi = (initialFilters: CalendarEventFilters = {}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarEventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega os eventos
   */
  const loadEvents = useCallback(async (filters: CalendarEventFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const data = await calendarEventService.findAll({ ...initialFilters, ...filters });
      setEvents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      showErrorNotification(err, 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega as estatísticas
   */
  const loadStats = useCallback(async (filters: CalendarEventFilters = {}) => {
    try {
      const data = await calendarEventService.getStats({ ...initialFilters, ...filters });
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, [initialFilters]);

  /**
   * Cria um novo evento
   */
  const createEvent = useCallback(async (data: CreateCalendarEventData) => {
    try {
      const newEvent = await calendarEventService.create(data);
      setEvents(prev => [...prev, newEvent]);
      showSuccessNotification('Evento criado com sucesso!');
      return newEvent;
    } catch (err) {
      showErrorNotification(err, 'Erro ao criar evento');
      throw err;
    }
  }, []);

  /**
   * Atualiza um evento existente
   */
  const updateEvent = useCallback(async (id: string, data: UpdateCalendarEventData) => {
    try {
      const updatedEvent = await calendarEventService.update(id, data);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      showSuccessNotification('Evento atualizado com sucesso!');
      return updatedEvent;
    } catch (err) {
      showErrorNotification(err, 'Erro ao atualizar evento');
      throw err;
    }
  }, []);

  /**
   * Remove um evento
   */
  const deleteEvent = useCallback(async (id: string) => {
    try {
      await calendarEventService.delete(id);
      setEvents(prev => prev.filter(event => event.id !== id));
      showSuccessNotification('Evento removido com sucesso!');
    } catch (err) {
      showErrorNotification(err, 'Erro ao remover evento');
      throw err;
    }
  }, []);

  /**
   * Marca evento como concluído
   */
  const completeEvent = useCallback(async (id: string) => {
    try {
      const updatedEvent = await calendarEventService.completeEvent(id);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      showSuccessNotification('Evento marcado como concluído!');
      return updatedEvent;
    } catch (err) {
      showErrorNotification(err, 'Erro ao marcar evento como concluído');
      throw err;
    }
  }, []);

  /**
   * Cancela um evento
   */
  const cancelEvent = useCallback(async (id: string) => {
    try {
      const updatedEvent = await calendarEventService.cancelEvent(id);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      showSuccessNotification('Evento cancelado!');
      return updatedEvent;
    } catch (err) {
      showErrorNotification(err, 'Erro ao cancelar evento');
      throw err;
    }
  }, []);

  /**
   * Gera eventos automáticos
   */
  const generateAutoEvents = useCallback(async () => {
    try {
      setLoading(true);
      const newEvents = await calendarEventService.generateAutoEvents();
      
      if (newEvents.length > 0) {
        // Recarregar a lista completa para mostrar os novos eventos
        await loadEvents();
        showSuccessNotification(`${newEvents.length} eventos automáticos foram gerados!`);
      } else {
        toast.info('Nenhum evento automático novo para gerar');
      }
      
      return newEvents;
    } catch (err) {
      showErrorNotification(err, 'Erro ao gerar eventos automáticos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadEvents]);

  /**
   * Atualiza eventos em atraso
   */
  const updateOverdueEvents = useCallback(async () => {
    try {
      const result = await calendarEventService.updateOverdueEvents();
      
      if (result.updatedCount > 0) {
        // Recarregar eventos para mostrar as mudanças
        await loadEvents();
        showSuccessNotification(`${result.updatedCount} eventos marcados como atrasados`);
      }
      
      return result;
    } catch (err) {
      showErrorNotification(err, 'Erro ao atualizar eventos atrasados');
      throw err;
    }
  }, [loadEvents]);

  /**
   * Busca um evento específico
   */
  const getEventById = useCallback(async (id: string) => {
    try {
      return await calendarEventService.findById(id);
    } catch (err) {
      showErrorNotification(err, 'Erro ao carregar evento');
      throw err;
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadEvents();
    loadStats();
  }, []); // Executar apenas na montagem

  return {
    events,
    stats,
    loading,
    error,
    
    // Actions
    loadEvents,
    loadStats,
    createEvent,
    updateEvent,
    deleteEvent,
    completeEvent,
    cancelEvent,
    generateAutoEvents,
    updateOverdueEvents,
    getEventById,
    
    // Refresh
    refresh: () => {
      loadEvents();
      loadStats();
    }
  };
};
