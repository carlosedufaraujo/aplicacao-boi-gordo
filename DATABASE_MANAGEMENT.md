# 📊 Guia de Gerenciamento do Banco de Dados - BoviControl

## 🚀 Estado Atual

### ✅ Migração Completa
- **Frontend**: 100% usando Backend API (sem Supabase direto)
- **Backend**: Prisma ORM conectado ao PostgreSQL (Supabase)
- **Autenticação**: JWT próprio via Backend
- **APIs**: Todas funcionando com autenticação

### 🏗️ Arquitetura Atual
```
[Frontend React] 
      ↓
[Backend API (Express + JWT)]
      ↓
[Prisma ORM]
      ↓
[PostgreSQL (Supabase)]
```

## 📝 Como Atualizar/Alterar Tabelas

### 1️⃣ **Modificar o Schema Prisma**
```bash
# Edite o arquivo schema.prisma
backend/prisma/schema.prisma
```

Exemplo de adição de novo campo:
```prisma
model Partner {
  id        String   @id @default(cuid())
  name      String
  type      PartnerType
  cpfCnpj   String?  @unique
  phone     String?
  email     String?
  address   String?
  notes     String?
  isActive  Boolean  @default(true)
  // NOVO CAMPO
  rating    Int?     @default(5)  // ← Adicione aqui
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2️⃣ **Criar Migration**
```bash
cd backend

# Criar migration com nome descritivo
npx prisma migrate dev --name add_rating_to_partners

# Isso vai:
# - Criar arquivo SQL em prisma/migrations/
# - Aplicar mudanças no banco
# - Regenerar Prisma Client
```

### 3️⃣ **Atualizar o Backend**

#### A. Repository (se necessário)
```typescript
// backend/src/repositories/partner.repository.ts
async findByRating(minRating: number) {
  return this.prisma.partner.findMany({
    where: { rating: { gte: minRating } }
  });
}
```

#### B. Service (se necessário)
```typescript
// backend/src/services/partner.service.ts
async getTopRatedPartners() {
  return this.partnerRepository.findByRating(4);
}
```

#### C. Controller (se necessário)
```typescript
// backend/src/controllers/partner.controller.ts
async topRated(req: Request, res: Response) {
  const partners = await this.partnerService.getTopRatedPartners();
  res.json({ status: 'success', data: partners });
}
```

#### D. Routes (se necessário)
```typescript
// backend/src/routes/partner.routes.ts
router.get('/top-rated', partnerController.topRated);
```

### 4️⃣ **Atualizar o Frontend**

#### A. Tipos
```typescript
// src/services/supabaseData.ts
export interface Partner {
  // ... campos existentes
  rating?: number; // ← Adicione aqui
}
```

#### B. Hooks/Components
```typescript
// src/hooks/api/usePartnersApi.ts
// ou componentes que usam Partner
```

## 🔧 Comandos Úteis Prisma

### Desenvolvimento
```bash
# Ver estado do banco
npx prisma db pull

# Criar migration
npx prisma migrate dev --name nome_da_mudanca

# Aplicar migrations pendentes
npx prisma migrate deploy

# Reset do banco (CUIDADO!)
npx prisma migrate reset

# Abrir Prisma Studio (interface visual)
npx prisma studio

# Gerar cliente após mudanças manuais
npx prisma generate
```

### Produção
```bash
# Aplicar migrations em produção
npx prisma migrate deploy

# Verificar status das migrations
npx prisma migrate status
```

## 📊 Organização das Tabelas

### Estrutura Atual
```
├── Users (autenticação)
├── Partners (parceiros/fornecedores)
├── PayerAccounts (contas pagadoras)
├── PurchaseOrders (ordens de compra)
├── CattleLots (lotes de gado)
├── Pens (currais)
├── Cycles (ciclos de produção)
├── Expenses (despesas)
├── Revenues (receitas)
├── SaleRecords (registros de venda)
├── FinancialContributions (contribuições)
└── CostCenters (centros de custo)
```

### Relacionamentos Principais
- **PurchaseOrder** → Partner (vendor/broker)
- **CattleLot** → PurchaseOrder
- **CattleLot** → Pen
- **Expense/Revenue** → PayerAccount
- **SaleRecord** → Partner (buyer)

## 🛡️ Boas Práticas

### ✅ SEMPRE Fazer
1. **Backup antes de migrations em produção**
2. **Testar migrations em desenvolvimento primeiro**
3. **Nomear migrations de forma descritiva**
4. **Manter schema.prisma como fonte única de verdade**
5. **Documentar mudanças significativas**

### ❌ NUNCA Fazer
1. **Editar arquivos de migration após criados**
2. **Deletar migrations aplicadas**
3. **Fazer mudanças diretas no banco sem Prisma**
4. **Usar `migrate reset` em produção**

## 🔄 Fluxo de Trabalho Recomendado

1. **Planejar** a mudança no schema
2. **Editar** schema.prisma
3. **Criar** migration com nome claro
4. **Testar** localmente
5. **Atualizar** código backend (repository/service/controller)
6. **Atualizar** código frontend (tipos/hooks)
7. **Testar** integração completa
8. **Documentar** a mudança
9. **Deploy** para produção

## 📚 Exemplos Comuns

### Adicionar Nova Tabela
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

### Adicionar Enum
```prisma
enum ProductStatus {
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
}

model Product {
  // ...
  status ProductStatus @default(ACTIVE)
}
```

### Adicionar Relacionamento
```prisma
model Product {
  id         String @id @default(cuid())
  supplierId String
  supplier   Partner @relation(fields: [supplierId], references: [id])
}

model Partner {
  // ...
  products Product[]
}
```

## 🚨 Troubleshooting

### Erro: "Migration failed"
```bash
# Verificar logs
npx prisma migrate status

# Se necessário, marcar como resolvido
npx prisma migrate resolve --applied "migration_name"
```

### Erro: "Schema drift"
```bash
# Sincronizar schema com banco
npx prisma db pull

# Depois criar nova migration
npx prisma migrate dev
```

### Erro: "Client out of sync"
```bash
# Regenerar cliente
npx prisma generate

# Reiniciar servidor
npm run dev
```

## 📞 Suporte

- **Documentação Prisma**: https://www.prisma.io/docs
- **Supabase Dashboard**: https://app.supabase.com
- **Logs do Backend**: `backend/logs/`

---

**Última atualização**: 28/08/2025
**Versão**: 1.0.0
**Responsável**: Sistema migrado com sucesso via Claude