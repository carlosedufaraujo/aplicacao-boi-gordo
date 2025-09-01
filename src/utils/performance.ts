/**
 * Utilitários de performance e otimização
 */

/**
 * Debounce - Adia a execução até parar de chamar por X ms
 * Útil para: Campos de busca, validações, auto-save
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttle - Limita execuções a 1 por intervalo
 * Útil para: Scroll, resize, mouse move
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          throttled(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Memoize - Cache de resultados de funções puras
 * Útil para: Cálculos pesados, formatações
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limitar tamanho do cache
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * Lazy Load - Carrega componente sob demanda
 */
export const lazyLoadComponent = (
  importFunc: () => Promise<any>,
  delay: number = 0
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(importFunc());
    }, delay);
  });
};

/**
 * Batch Updates - Agrupa múltiplas atualizações
 */
export class BatchProcessor<T> {
  private items: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private processor: (items: T[]) => void,
    private delay: number = 100
  ) {}
  
  add(item: T) {
    this.items.push(item);
    
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  flush() {
    if (this.items.length > 0) {
      this.processor([...this.items]);
      this.items = [];
    }
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Request Idle Callback - Executa em momento ocioso
 */
export const idleCallback = (
  callback: () => void,
  options?: IdleRequestOptions
) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback
  return setTimeout(callback, 1);
};

/**
 * Cancel Idle Callback
 */
export const cancelIdleCallback = (id: number) => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Measure Performance
 */
export const measurePerformance = (name: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      // Enviar para analytics se configurado
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance',
        });
      }
      
      return duration;
    },
  };
};

/**
 * Virtual Scroll Helper
 */
export const calculateVisibleItems = <T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Chunk Array - Divide array em pedaços
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  
  return chunks;
};

/**
 * Preload Image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload Multiple Images
 */
export const preloadImages = async (
  srcs: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> => {
  let loaded = 0;
  const total = srcs.length;
  
  const promises = srcs.map(async (src) => {
    await preloadImage(src);
    loaded++;
    onProgress?.(loaded, total);
  });
  
  await Promise.all(promises);
};

/**
 * Web Worker Helper
 */
export const createWorker = (workerFunction: () => void) => {
  const blob = new Blob(
    [`(${workerFunction.toString()})()`],
    { type: 'application/javascript' }
  );
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  
  // Cleanup
  worker.addEventListener('error', () => {
    URL.revokeObjectURL(url);
  });
  
  return worker;
};

// Type declarations para gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  }
}