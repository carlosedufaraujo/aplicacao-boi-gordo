# 📊 PLANO COMPLETO DE RESTAURAÇÃO DO CENTRO FINANCEIRO

## 🎯 OBJETIVO
Restaurar com total fidelidade o Centro Financeiro completo baseado na versão do commit `a60e22e` (02/09/2025) que incluía:
- DFC (Demonstração de Fluxo de Caixa)
- DRE (Demonstração do Resultado do Exercício)
- Dashboard Financeiro Integrado
- Gestão de Cash Flow completa
- Integração financeira com compras de gado

## 📁 ESTRUTURA ORIGINAL IDENTIFICADA

### Frontend - Componentes Principais

#### 1. **Financial/** (src/components/Financial/)
- `IntegratedFinancialDashboard.tsx` - Dashboard principal unificado
- `EnhancedFinancialDashboard.tsx` - Dashboard avançado com KPIs
- `FinancialDFCTable.tsx` - Tabela completa do DFC
- `FinancialDRETable.tsx` - Tabela completa do DRE  
- `CostCenterManagement.tsx` - Gestão de centros de custo

#### 2. **CashFlow/** (src/components/CashFlow/)
- `CashFlowDashboard.tsx` - Dashboard do fluxo de caixa (VERSÃO RECOVERED ENCONTRADA!)
- `CashFlowForm.tsx` - Formulário de lançamentos
- `CashFlowFilters.tsx` - Filtros avançados
- `CashFlowList.tsx` - Lista de movimentações
- `CashFlowTable.tsx` - Tabela de movimentações
- `RegimeSelector.tsx` - Seletor de regime tributário
- `StatusChangeButton.tsx` - Botão de alteração de status

### Backend - Estrutura de Dados

#### Modelos Prisma Originais
```prisma
model CostCenter {
  id        String         @id @default(cuid())
  code      String         @unique
  name      String
  type      CostCenterType
  parentId  String?
  isActive  Boolean        @default(true)
  parent    CostCenter?    @relation("CostCenterHierarchy")
  children  CostCenter[]   @relation("CostCenterHierarchy")
  expenses  Expense[]
  revenues  Revenue[]
}

model Expense {
  id              String               @id @default(cuid())
  category        String
  costCenterId    String?
  description     String
  totalAmount     Float
  dueDate         DateTime
  paymentDate     DateTime?
  isPaid          Boolean              @default(false)
  impactsCashFlow Boolean              @default(true)
  purchaseId      String?
  vendorId        String?
  payerAccountId  String?
  allocations     ExpenseAllocation[]
}

model Revenue {
  id              String               @id @default(cuid())
  category        String
  costCenterId    String?
  description     String
  totalAmount     Float
  dueDate         DateTime
  receiptDate     DateTime?
  isReceived      Boolean              @default(false)
  saleRecordId    String?
  allocations     RevenueAllocation[]
}

model FinancialIntegration {
  sourceType      String
  sourceId        String
  expenseIds      String[]
  revenueIds      String[]
  status          String
  processedAt     DateTime?
  errorMessage    String?
}
```

## 🔧 AÇÕES DE RESTAURAÇÃO

### Fase 1: Estrutura de Dados (Backend)
1. ✅ Adicionar modelos faltantes ao schema.prisma:
   - CostCenter
   - Expense  
   - Revenue
   - ExpenseAllocation
   - RevenueAllocation
   - FinancialIntegration
   
2. ✅ Criar enums necessários:
   - CostCenterType
   - AllocationEntity
   - ContributionType
   - NonCashType

3. ✅ Executar migração do Prisma

### Fase 2: Serviços Backend
1. ✅ Criar/Restaurar services:
   - `financialIntegration.service.ts` - Integração com compras
   - `financial.service.ts` - Serviço geral financeiro
   - `costCenter.service.ts` - Gestão de centros de custo
   - `expense.service.ts` - Gestão de despesas
   - `revenue.service.ts` - Gestão de receitas

2. ✅ Criar/Restaurar controllers:
   - `financial.controller.ts` - Controller principal
   - `costCenter.controller.ts` 
   - `expense.controller.ts`
   - `revenue.controller.ts`

3. ✅ Criar/Restaurar rotas:
   - `financial.routes.ts`
   - `costCenter.routes.ts`
   - `expense.routes.ts`
   - `revenue.routes.ts`

### Fase 3: Componentes Frontend
1. ✅ Restaurar componente Financial/:
   - Copiar `CashFlowDashboard-RECOVERED.tsx` para o local correto
   - Criar `IntegratedFinancialDashboard.tsx`
   - Criar `EnhancedFinancialDashboard.tsx`
   - Criar `FinancialDFCTable.tsx`
   - Criar `FinancialDRETable.tsx`

2. ✅ Atualizar hooks:
   - `useFinancialApi.ts` - Hook completo da API financeira
   - Manter `useCashFlow.ts` existente

3. ✅ Atualizar providers:
   - Melhorar `FinancialDataProvider.tsx`

### Fase 4: Integrações
1. ✅ Integração com Compras de Gado:
   - Criar despesas automaticamente ao registrar compra
   - Alocar custos por lote
   - Calcular comissões e fretes

2. ✅ Integração com Vendas:
   - Criar receitas automaticamente ao registrar venda
   - Calcular lucratividade por lote

3. ✅ Integração com Calendário:
   - Criar eventos para vencimentos
   - Alertas de pagamentos/recebimentos

### Fase 5: Funcionalidades Avançadas
1. ✅ DFC (Demonstração de Fluxo de Caixa):
   - Fluxo operacional
   - Fluxo de investimento  
   - Fluxo de financiamento
   - Projeções

2. ✅ DRE (Demonstração do Resultado):
   - Receitas por categoria
   - Custos e despesas
   - Resultado operacional
   - Lucro líquido

3. ✅ Análises e KPIs:
   - ROI por lote
   - Margem de lucro
   - Ponto de equilíbrio
   - Análise de sensibilidade

## 📝 OBSERVAÇÕES IMPORTANTES

### Código Encontrado (RECOVERED)
- **CashFlowDashboard-RECOVERED.tsx**: Versão exata do período 21:04-22:44
- Contém console.log confirmando versão correta
- Não usa `useCattlePurchasesApi` (não existia na versão original)
- Usa `usePayerAccountsApi` para contas

### Dependências Confirmadas
- shadcn/ui components
- date-fns para datas
- recharts para gráficos
- sonner para toasts
- decimal.js para cálculos precisos

### Padrões a Manter
- Todos valores monetários em FLOAT no banco
- Datas sempre em DateTime
- IDs sempre como cuid()
- Soft deletes com isActive
- Timestamps com createdAt/updatedAt

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Restaurar schema.prisma** com modelos financeiros completos
2. **Copiar CashFlowDashboard-RECOVERED.tsx** para src/components/CashFlow/
3. **Criar componentes Financial/** baseados no git history
4. **Implementar services e controllers** no backend
5. **Testar integração completa**

## ✅ VALIDAÇÃO FINAL

### Critérios de Sucesso:
- [ ] DFC funcionando com dados reais
- [ ] DRE calculando corretamente
- [ ] Cash Flow com CRUD completo
- [ ] Integração automática com compras
- [ ] Dashboard financeiro unificado
- [ ] Centros de custo operacionais
- [ ] Relatórios exportáveis
- [ ] Análises de rentabilidade por lote

---

**NOTA**: Este plano foi criado com base na análise do histórico Git e arquivos encontrados. A versão RECOVERED do CashFlowDashboard confirma a estrutura exata do período mencionado.