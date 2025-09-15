/**
 * Sistema de cache simples para otimização de performance
 * Implementado para resolver problemas de timeout identificados pelo TestSprite
 */

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class SimpleCache {
  private cache: Map<string, CacheItem> = new Map();

  /**
   * Armazena um item no cache
   */
  set(key: string, data: any, ttlSeconds: number = 300): void {
    const ttl = ttlSeconds * 1000; // Converter para milissegundos
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Recupera um item do cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpa itens expirados
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância global do cache
export const cache = new SimpleCache();

// Limpeza automática a cada 5 minutos
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

/**
 * Decorator para cache de métodos
 */
export function cached(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      // Tentar buscar no cache
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Executar método e cachear resultado
      const result = await method.apply(this, args);
      cache.set(cacheKey, result, ttlSeconds);
      
      return result;
    };
  };
}
