/**
 * Event Bus simples para comunicação entre componentes
 * Usado para notificar mudanças globais no sistema
 */

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Registra um listener para um evento
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const callbacks = this.events.get(event)!;
    callbacks.push(callback);
    
    // Retorna função para remover o listener
    return () => this.off(event, callback);
  }

  /**
   * Remove um listener de um evento
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emite um evento para todos os listeners
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove todos os listeners de um evento
   */
  clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Instância singleton
export const eventBus = new EventBus();

// Eventos pré-definidos
export const EVENTS = {
  LOT_DELETED: 'lot:deleted',
  LOT_UPDATED: 'lot:updated',
  LOT_CREATED: 'lot:created',
  ORDER_DELETED: 'order:deleted',
  ORDER_UPDATED: 'order:updated',
  ORDER_CREATED: 'order:created',
  REFRESH_FINANCIAL: 'financial:refresh',
  REFRESH_ALL: 'app:refresh_all'
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];