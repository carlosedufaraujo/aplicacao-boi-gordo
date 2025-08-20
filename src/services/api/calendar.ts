// Serviço para Calendário Financeiro
import { apiRequest } from './index';

export const calendarService = {
  getEvents: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    return apiRequest(`/calendar/events?${params}`);
  },

  createEvent: async (data: any) => apiRequest('/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: async (id: string, data: any) => apiRequest(`/calendar/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: async (id: string) => apiRequest(`/calendar/events/${id}`, { method: 'DELETE' }),
  
  getReminders: async () => apiRequest('/calendar/reminders'),
  setReminder: async (eventId: string, days: number) => 
    apiRequest(`/calendar/events/${eventId}/reminder`, { method: 'POST', body: JSON.stringify({ days }) }),
};