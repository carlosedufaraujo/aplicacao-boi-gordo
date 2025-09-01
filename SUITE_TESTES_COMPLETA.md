# 🧪 Suíte Completa de Testes Automatizados - BoviControl

## 📊 Status Atual dos Testes

### ✅ Configurado
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright (pode ser adicionado)

### ⚠️ Implementação Parcial
- Apenas testes de utils implementados
- Sem testes de componentes
- Sem testes de API
- Sem testes E2E

## 🎯 Plano de Implementação de Testes

### 1. Frontend - Testes Unitários

#### Componentes React
```typescript
// src/components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('renderiza corretamente', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('desabilita quando prop disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

#### Hooks Customizados
```typescript
// src/hooks/useCattlePurchaseQuery.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCattlePurchaseList } from './useCattlePurchaseQuery';
import { vi } from 'vitest';

// Mock da API
vi.mock('@/services/api/cattlePurchaseApi', () => ({
  cattlePurchaseApi: {
    getAll: vi.fn().mockResolvedValue({
      items: [{ id: '1', code: 'CP001' }],
      total: 1,
      page: 1,
      totalPages: 1
    })
  }
}));

describe('useCattlePurchaseList', () => {
  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })}>
      {children}
    </QueryClientProvider>
  );

  it('carrega dados com sucesso', async () => {
    const { result } = renderHook(
      () => useCattlePurchaseList({ page: 1 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].code).toBe('CP001');
  });
});
```

### 2. Backend - Testes de API

#### Testes de Rotas
```typescript
// backend/src/routes/report.routes.test.ts
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/config/database';
import jwt from 'jsonwebtoken';

describe('Report Routes', () => {
  let authToken: string;

  beforeAll(() => {
    // Criar token de teste
    authToken = jwt.sign(
      { userId: 'test-user', email: 'test@test.com', role: 'ADMIN' },
      process.env.JWT_SECRET!
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/reports/pen-occupancy', () => {
    it('retorna dados sem autenticação', async () => {
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .expect(401);

      expect(response.body.message).toBe('Token não fornecido');
    });

    it('retorna dados com autenticação', async () => {
      const response = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('usa cache na segunda requisição', async () => {
      // Primeira requisição
      const response1 = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response1.headers['x-cache']).toBe('MISS');

      // Segunda requisição (deve vir do cache)
      const response2 = await request(app)
        .get('/api/v1/reports/pen-occupancy')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response2.headers['x-cache']).toBe('HIT');
    });
  });
});
```

#### Testes de Serviços
```typescript
// backend/src/services/cattlePurchase.service.test.ts
import { CattlePurchaseService } from './cattlePurchase.service';
import { prisma } from '@/config/database';
import { cache } from '@/config/redis';

jest.mock('@/config/database', () => ({
  prisma: {
    cattlePurchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    }
  }
}));

describe('CattlePurchaseService', () => {
  let service: CattlePurchaseService;

  beforeEach(() => {
    service = new CattlePurchaseService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('cria nova compra com sucesso', async () => {
      const mockData = {
        code: 'CP001',
        quantity: 100,
        pricePerKg: 15.50
      };

      (prisma.cattlePurchase.create as jest.Mock).mockResolvedValue({
        id: '123',
        ...mockData
      });

      const result = await service.create(mockData);

      expect(result.id).toBe('123');
      expect(result.code).toBe('CP001');
      expect(prisma.cattlePurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining(mockData)
      });
    });

    it('invalida cache após criar', async () => {
      const clearSpy = jest.spyOn(cache, 'clearPattern');
      
      await service.create({ code: 'CP002' });

      expect(clearSpy).toHaveBeenCalledWith('cattle-purchase:list:*');
    });
  });
});
```

### 3. Testes de Integração

#### Teste do Fluxo Completo
```typescript
// tests/integration/purchase-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Compra de Gado', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Login
    await page.fill('[name="email"]', 'admin@boigordo.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
  });

  test('criar nova compra de gado', async ({ page }) => {
    // Navegar para compras
    await page.click('text=Compras');
    await page.click('text=Nova Compra');

    // Preencher formulário
    await page.fill('[name="quantity"]', '100');
    await page.fill('[name="pricePerKg"]', '15.50');
    await page.selectOption('[name="penId"]', { label: 'Curral 01' });
    
    // Submeter
    await page.click('button:has-text("Salvar")');

    // Verificar sucesso
    await expect(page.locator('.toast-success')).toContainText('Compra criada');
    
    // Verificar na listagem
    await expect(page.locator('table')).toContainText('100');
  });
});
```

### 4. Testes de Performance

```typescript
// tests/performance/api-load.test.ts
import autocannon from 'autocannon';

describe('Performance Tests', () => {
  it('aguenta 100 requisições simultâneas', async () => {
    const result = await autocannon({
      url: 'http://localhost:3333/api/v1/reports/pen-occupancy',
      connections: 100,
      duration: 10,
      headers: {
        'Authorization': 'Bearer TOKEN_HERE'
      }
    });

    expect(result.errors).toBe(0);
    expect(result.latency.p99).toBeLessThan(1000); // < 1s no p99
  });
});
```

### 5. Testes de Sintaxe e Linting

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:api": "cd backend && npm test",
    "test:lint": "eslint . --ext .ts,.tsx",
    "test:type": "tsc --noEmit",
    "test:all": "npm run test:lint && npm run test:type && npm run test:coverage && npm run test:api"
  }
}
```

## 🚀 Comandos para Executar Testes

```bash
# Frontend
npm test                  # Roda testes com watch
npm run test:coverage     # Gera relatório de cobertura
npm run test:ui          # Interface visual dos testes

# Backend
cd backend && npm test    # Testes do backend
cd backend && npm run test:watch  # Watch mode

# E2E
npx playwright install    # Instalar browsers
npm run test:e2e         # Rodar testes E2E

# Todos os testes
npm run test:all         # Lint + Type + Unit + API
```

## 📈 Métricas de Qualidade

### Cobertura Alvo
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Tipos de Teste
- ✅ **Unit Tests**: Componentes, Hooks, Utils
- ✅ **Integration Tests**: API Routes, Services
- ✅ **E2E Tests**: Fluxos críticos
- ✅ **Performance Tests**: Load testing
- ✅ **Smoke Tests**: Deploy validation

## 🔧 Configuração de CI/CD

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run linting
        run: npm run test:lint
      
      - name: Run type checking
        run: npm run test:type
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run API tests
        run: cd backend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info,./backend/coverage/lcov.info
```

## ✅ Checklist de Implementação

- [ ] Instalar dependências de teste
- [ ] Criar testes para componentes principais
- [ ] Criar testes para hooks customizados
- [ ] Criar testes para rotas da API
- [ ] Criar testes para serviços
- [ ] Configurar testes E2E
- [ ] Configurar CI/CD
- [ ] Documentar processo de testes
- [ ] Treinar equipe