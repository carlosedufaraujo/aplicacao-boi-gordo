# 🏗️ Refatoração de Arquitetura - BoviControl

## Problemas Atuais
1. **Duplicação de autenticação** (JWT vs Supabase Auth)
2. **Múltiplas formas de acesso ao banco** (Prisma vs Supabase Client)
3. **Tipos desincronizados** entre frontend e backend
4. **Configurações expostas** e sem validação
5. **Sem testes automatizados**

## Solução Proposta

### Fase 1: Unificação de Dados (1 dia)
```bash
# Remover Supabase Client do backend
npm uninstall @supabase/supabase-js

# Usar apenas Prisma
- Todas as rotas usando services
- Services usando repositories
- Repositories usando Prisma
```

### Fase 2: Sistema de Tipos (2 horas)
```typescript
// shared/types/models.ts - Gerado do Prisma
npx prisma generate

// shared/types/dto.ts - Tipos de transferência
export interface CreatePartnerDTO {
  name: string;
  type: PartnerType;
  // ... validado com Zod
}
```

### Fase 3: Configuração Segura (1 hora)
```typescript
// config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // ... todas as variáveis
});

export const env = envSchema.parse(process.env);
```

### Fase 4: Camada de Serviços (2 dias)
```typescript
// services/base.service.ts
export abstract class BaseService<T> {
  constructor(protected repository: BaseRepository<T>) {}
  
  async findAll(filters?: any): Promise<T[]> {
    // Lógica de negócio aqui
    return this.repository.findAll(filters);
  }
  
  // Cache, validação, logs, etc
}
```

### Fase 5: Testes Automatizados (1 dia)
```typescript
// __tests__/integration/auth.test.ts
describe('Authentication Flow', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## Estrutura Final

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma apenas
│   │   ├── env.ts           # Validado com Zod
│   │   └── logger.ts        # Winston
│   │
│   ├── controllers/         # Recebe requisições
│   │   └── partner.controller.ts
│   │
│   ├── services/            # Lógica de negócio
│   │   ├── base.service.ts
│   │   └── partner.service.ts
│   │
│   ├── repositories/        # Acesso a dados (Prisma)
│   │   ├── base.repository.ts
│   │   └── partner.repository.ts
│   │
│   ├── middlewares/
│   │   ├── auth.ts         # JWT único
│   │   ├── validation.ts   # Zod
│   │   └── error.ts        # Tratamento global
│   │
│   └── types/              # Gerados do Prisma
│       └── index.ts

shared/                     # Compartilhado com frontend
├── types/
│   ├── models.ts          # Do Prisma
│   ├── dto.ts             # Transferência
│   └── api.ts             # Respostas

frontend/
└── src/
    ├── services/          # Chamadas API
    ├── hooks/             # React hooks
    └── types/             # Importa de shared
```

## Benefícios

✅ **Eliminação de conflitos**: Uma única fonte de verdade
✅ **Type Safety**: Tipos gerados automaticamente
✅ **Segurança**: Variáveis validadas, secrets protegidos
✅ **Manutenibilidade**: Código organizado em camadas
✅ **Testabilidade**: Fácil de mockar e testar
✅ **Performance**: Cache e otimizações centralizadas

## Comandos de Migração

```bash
# 1. Backup atual
git checkout -b backup-current-state
git add . && git commit -m "backup: estado antes da refatoração"

# 2. Nova branch
git checkout -b refactor-architecture

# 3. Instalar dependências
npm install zod dotenv-safe
npm uninstall @supabase/supabase-js

# 4. Gerar tipos
npx prisma generate

# 5. Rodar testes
npm test

# 6. Build de produção
npm run build
```

## Cronograma

- **Dia 1**: Unificar acesso a dados (Prisma only)
- **Dia 2**: Implementar services e repositories
- **Dia 3**: Configuração e tipos compartilhados
- **Dia 4**: Testes e documentação
- **Dia 5**: Deploy e monitoramento

## Métricas de Sucesso

- [ ] 0 erros de TypeScript
- [ ] 100% das rotas com validação
- [ ] 80% cobertura de testes
- [ ] Tempo de build < 30s
- [ ] 0 secrets expostos