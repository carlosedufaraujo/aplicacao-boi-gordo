# 🚀 Guia de Otimização de Performance - BoviControl

## 1. 🔴 Redis Cache

### Instalação
```bash
# macOS
brew install redis
brew services start redis

# Linux/Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### Implementação no Backend

#### 1. Instalar dependências
```bash
cd backend
npm install ioredis
npm install --save-dev @types/ioredis
```

#### 2. Configurar Redis Client
```typescript
// backend/src/config/redis.ts
import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis({
  host: env.REDIS_HOST || 'localhost',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => {
  console.log('✅ Redis conectado');
});

redis.on('error', (err) => {
  console.error('❌ Redis erro:', err);
});
```

#### 3. Middleware de Cache
```typescript
// backend/src/middlewares/cache.ts
import { Request, Response, NextFunction } from 'express';
import { redis } from '@/config/redis';

export const cacheMiddleware = (ttl: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Interceptar response para salvar no cache
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

#### 4. Usar Cache nas Rotas
```typescript
// backend/src/routes/report.routes.ts
router.get(
  '/lot-performance',
  authenticate,
  cacheMiddleware(300), // Cache por 5 minutos
  reportController.lotPerformance
);
```

## 2. ⚡ Otimizações de Database

### Índices Importantes
```sql
-- Índices para queries frequentes
CREATE INDEX idx_cattle_purchases_status ON cattle_purchases(status);
CREATE INDEX idx_cattle_purchases_created_at ON cattle_purchases(created_at DESC);
CREATE INDEX idx_pens_status ON pens(status);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_revenues_date ON revenues(date);
```

### Query Optimization com Prisma
```typescript
// ❌ Ruim - N+1 queries
const purchases = await prisma.cattlePurchase.findMany();
for (const purchase of purchases) {
  const pen = await prisma.pen.findUnique({ where: { id: purchase.penId } });
}

// ✅ Bom - 1 query com include
const purchases = await prisma.cattlePurchase.findMany({
  include: { pen: true }
});

// ✅ Ótimo - Select apenas campos necessários
const purchases = await prisma.cattlePurchase.findMany({
  select: {
    id: true,
    code: true,
    pen: {
      select: {
        name: true,
        capacity: true
      }
    }
  }
});
```

## 3. 📦 Frontend Optimizations

### Code Splitting
```typescript
// ❌ Ruim - Carrega tudo
import { LotPerformanceReport } from '@/components/Reports/LotPerformanceReport';

// ✅ Bom - Lazy loading
const LotPerformanceReport = lazy(() => 
  import('@/components/Reports/LotPerformanceReport')
);

// Usar com Suspense
<Suspense fallback={<Loading />}>
  <LotPerformanceReport />
</Suspense>
```

### React Query para Cache de API
```bash
npm install @tanstack/react-query
```

```typescript
// src/hooks/useApiCache.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useLotPerformance() {
  return useQuery({
    queryKey: ['lot-performance'],
    queryFn: () => reportApi.getLotPerformance(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}
```

### Virtualização de Listas
```bash
npm install @tanstack/react-virtual
```

```typescript
// Para listas grandes (>1000 items)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 4. 🔄 Debounce e Throttle

### Implementação
```typescript
// src/utils/performance.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

### Uso em Componentes
```typescript
// Busca com debounce
const handleSearch = useMemo(
  () => debounce((query: string) => {
    searchApi(query);
  }, 500),
  []
);

// Scroll com throttle
const handleScroll = useMemo(
  () => throttle(() => {
    updateScrollPosition();
  }, 100),
  []
);
```

## 5. 📊 Monitoramento de Performance

### Frontend - Web Vitals
```typescript
// src/utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry) {
    getCLS(onPerfEntry);  // Cumulative Layout Shift
    getFID(onPerfEntry);  // First Input Delay
    getFCP(onPerfEntry);  // First Contentful Paint
    getLCP(onPerfEntry);  // Largest Contentful Paint
    getTTFB(onPerfEntry); // Time to First Byte
  }
}
```

### Backend - Performance Monitoring
```typescript
// backend/src/middlewares/performance.ts
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // Enviar métricas para sistema de monitoramento
    metrics.recordLatency(req.route.path, duration);
  });
  
  next();
};
```

## 6. 🎯 Checklist de Otimização

### Imediato (Quick Wins)
- [ ] Implementar paginação em todas as listagens
- [ ] Adicionar índices no banco de dados
- [ ] Configurar cache de 5min para relatórios
- [ ] Lazy loading de componentes pesados

### Curto Prazo (1-2 semanas)
- [ ] Instalar e configurar Redis
- [ ] Implementar React Query
- [ ] Adicionar virtualização em listas grandes
- [ ] Otimizar bundle size

### Médio Prazo (1 mês)
- [ ] Sistema de filas com Bull (Redis)
- [ ] CDN para assets estáticos
- [ ] Service Workers para cache offline
- [ ] Compressão gzip/brotli

### Métricas de Sucesso
- **TTFB**: < 200ms
- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **Bundle Size**: < 500KB inicial
- **API Response**: < 300ms p95

## 7. 🔧 Comandos Úteis

```bash
# Analisar bundle size
npm run build -- --analyze

# Verificar performance do banco
cd backend && npx prisma db execute --sql "EXPLAIN ANALYZE SELECT ..."

# Monitor Redis
redis-cli monitor

# Stress test da API
npm install -g autocannon
autocannon -c 100 -d 30 http://localhost:3333/api/v1/reports/lot-performance
```

## 8. 📚 Recursos Adicionais

- [Redis Best Practices](https://redis.io/docs/best-practices/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance)
- [Web Vitals](https://web.dev/vitals/)