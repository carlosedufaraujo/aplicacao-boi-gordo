import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

/**
 * Reporta métricas de Web Vitals
 * @param onPerfEntry Callback para processar métricas
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);  // Cumulative Layout Shift
    onINP(onPerfEntry);  // Interaction to Next Paint (substituiu FID)
    onFCP(onPerfEntry);  // First Contentful Paint
    onLCP(onPerfEntry);  // Largest Contentful Paint
    onTTFB(onPerfEntry); // Time to First Byte
  }
}

/**
 * Envia métricas para o console (desenvolvimento)
 */
export function logWebVitals() {
  reportWebVitals((metric) => {
    const { name, value, id } = metric;
    const emoji = getMetricEmoji(name);
    const status = getMetricStatus(name, value);
    
    console.log(`${emoji} ${name}: ${value.toFixed(2)}ms [${status}] (${id})`);
  });
}

/**
 * Envia métricas para Google Analytics
 */
export function sendToGoogleAnalytics(metric: Metric) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
}

/**
 * Salva métricas no localStorage para análise
 */
export function saveMetricsToStorage(metric: Metric) {
  const key = 'web-vitals-metrics';
  const existing = localStorage.getItem(key);
  const metrics = existing ? JSON.parse(existing) : [];
  
  metrics.push({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
  
  // Manter apenas últimas 100 métricas
  if (metrics.length > 100) {
    metrics.shift();
  }
  
  localStorage.setItem(key, JSON.stringify(metrics));
}

/**
 * Obtém emoji para métrica
 */
function getMetricEmoji(name: string): string {
  const emojis: Record<string, string> = {
    CLS: '📐',
    FID: '⚡',
    FCP: '🎨',
    LCP: '🖼️',
    TTFB: '⏱️',
  };
  return emojis[name] || '📊';
}

/**
 * Obtém status da métrica (good/needs-improvement/poor)
 */
function getMetricStatus(name: string, value: number): string {
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  };
  
  const threshold = thresholds[name];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return '✅ Good';
  if (value <= threshold.poor) return '⚠️ Needs Improvement';
  return '❌ Poor';
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  
  /**
   * Marca início de uma operação
   */
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  /**
   * Mede duração desde a marca
   */
  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark '${startMark}' not found`);
      return 0;
    }
    
    const duration = performance.now() - start;
    
    // Armazenar medida
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  /**
   * Obtém estatísticas de uma medida
   */
  getStats(name: string) {
    const values = this.measures.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  
  /**
   * Limpa todas as marcas e medidas
   */
  clear() {
    this.marks.clear();
    this.measures.clear();
  }
  
  /**
   * Exporta relatório de performance
   */
  getReport() {
    const report: Record<string, any> = {};
    
    this.measures.forEach((_values, name) => {
      report[name] = this.getStats(name);
    });
    
    return report;
  }
}

// Instância global
export const perfMonitor = new PerformanceMonitor();

// Type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}