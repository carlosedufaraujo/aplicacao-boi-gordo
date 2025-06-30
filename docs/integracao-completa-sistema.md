# Integração Completa do Sistema Financeiro

## Visão Geral

O sistema agora possui uma integração completa entre todos os módulos financeiros, seguindo o fluxo operacional do negócio de confinamento bovino.

## Arquitetura da Integração

### 1. Modelo Híbrido Previsto/Realizado

```typescript
interface Expense {
  // ...
  dueDate: Date;          // Data de vencimento (sempre preenchida)
  paymentDate?: Date;     // Data de pagamento (quando realizado)
  isPaid: boolean;        // Flag simples: false = previsto, true = realizado
  impactsCashFlow: boolean; // Se impacta o caixa
  // ...
}
```

### 2. Estrutura de Centros de Custos e Categorias

#### Centros de Custo Implementados:

1. **AQUISIÇÃO**
   - Compra de Animais (`animal_purchase`)
   - Comissão (`commission`)
   - Frete (`freight`)
   - Outros (`acquisition_other`)

2. **ENGORDA**
   - Alimentação (`feed`)
   - Sanidade (`health_costs`)
   - Custos Operacionais (`operational_costs`)
   - Mortalidade (`deaths`) - Não impacta caixa
   - Quebra de Peso (`weight_loss`) - Não impacta caixa

3. **ADMINISTRATIVO**
   - Administração Geral (`general_admin`)
   - Marketing (`marketing`)
   - Pessoal (`personnel`)
   - Outros (`admin_other`)

4. **FINANCEIRO**
   - Juros (`interest`)
   - Taxas (`fees`)
   - Gestão Financeira (`financial_management`)
   - Outros (`financial_other`)

5. **RECEITAS**
   - Venda de Gado (`cattle_sales`)
   - Prestação de Serviço (`service_revenue`)
   - Venda de Subprodutos (`byproduct_sales`)
   - Outras Receitas (`other_revenue`)

6. **APORTES E FINANCIAMENTOS**
   - Aporte de Sócio (`partner_contribution`)
   - Empréstimo de Sócio (`partner_loan`)
   - Financiamento Bancário (`bank_financing`)
   - Investidor Externo (`external_investor`)

## Fluxos de Integração

### 1. Ordem de Compra → Centro Financeiro

Quando uma ordem de compra é criada:

1. **Despesas Geradas Automaticamente:**
   - Compra de animais (valor principal)
   - Comissão do corretor
   - Outros custos (documentação, veterinário, etc.)
   - Frete (quando recepcionado)

2. **Características:**
   - Todas começam como `isPaid: false` (previsto)
   - Cada despesa tem sua `dueDate` específica
   - Aparecem no Calendário Financeiro
   - São categorizadas automaticamente

### 2. Centro Financeiro → DRE

Despesas lançadas no Centro Financeiro:

1. **Fluxo Normal (impactsCashFlow = true):**
   - Aparecem no Centro Financeiro
   - São consideradas no Calendário Financeiro
   - Alimentam o DRE quando no período

2. **Fluxo Direto (impactsCashFlow = false):**
   - Não aparecem no Centro Financeiro
   - Vão direto para o DRE
   - Exemplos: mortalidade, quebra de peso, depreciação

### 3. Lançamentos Não-Caixa

Registros que não envolvem movimentação financeira:

1. **Mortalidade:**
   ```typescript
   recordMortality(lotId, quantity, cause, notes)
   ```
   - Calcula valor baseado no custo médio por animal
   - Cria NonCashExpense
   - Cria Expense com impactsCashFlow = false
   - Atualiza contador de mortes do lote

2. **Quebra de Peso:**
   ```typescript
   recordWeightLoss(lotId, expectedWeight, actualWeight, notes)
   ```
   - Calcula perda monetária
   - Cria registros não-caixa
   - Impacta apenas DRE

### 4. DRE Integrado

O DRE agora:

1. **Busca Dados de Múltiplas Fontes:**
   - Receitas de vendas (SaleRecords)
   - Custos diretos dos lotes
   - Despesas operacionais do Centro Financeiro
   - Lançamentos não-caixa

2. **Cálculos Automáticos:**
   - Impostos (15% IR + 9% CSLL)
   - Margens e métricas
   - ROI e lucro diário

3. **Níveis de Análise:**
   - Por lote individual
   - Por curral
   - Global (toda operação)

## Componentes Criados/Atualizados

### 1. ExpenseForm.tsx
- Formulário unificado para despesas e receitas
- Suporte ao modelo híbrido
- Seleção de categorias organizadas por centro de custo
- Indicação visual de impacto no caixa

### 2. FinancialIntegration.tsx
- Componente de demonstração da integração
- Mostra fluxo de dados entre módulos
- Tabela de categorias e impactos

### 3. useAppStore.ts
- Modelo híbrido implementado
- Integração entre módulos
- Funções de registro não-caixa
- DRE busca dados do Centro Financeiro

### 4. types/index.ts
- Novas interfaces e tipos
- EXPENSE_CATEGORIES com configurações
- Modelo híbrido nas interfaces

## Como Usar

### 1. Criar uma Ordem de Compra
```typescript
// Automaticamente gera despesas categorizadas
addPurchaseOrder({
  // ... dados da ordem
});
```

### 2. Lançar Despesa Manual
```typescript
// Via ExpenseForm ou diretamente
addExpense({
  category: 'feed',
  totalAmount: 1000,
  dueDate: new Date(),
  isPaid: false,
  impactsCashFlow: true
});
```

### 3. Registrar Mortalidade
```typescript
// Não impacta caixa, vai direto pro DRE
recordMortality(lotId, 2, 'disease', 'Pneumonia');
```

### 4. Gerar DRE
```typescript
// DRE integrado com todos os dados
const dre = generateDREStatement({
  entityType: 'lot',
  entityId: lotId,
  periodStart: startDate,
  periodEnd: endDate
});
```

## Benefícios da Integração

1. **Automatização:** Reduz entrada manual de dados
2. **Consistência:** Dados fluem automaticamente entre módulos
3. **Rastreabilidade:** Cada despesa tem origem clara
4. **Flexibilidade:** Suporta lançamentos manuais e automáticos
5. **Precisão:** Separa corretamente caixa de competência

## Próximos Passos

1. **Conciliação Bancária:** Integrar com extratos bancários
2. **Relatórios Avançados:** Dashboards consolidados
3. **Alertas:** Notificações de vencimentos e anomalias
4. **Mobile:** Acesso via aplicativo móvel
5. **Integrações Externas:** APIs para sistemas contábeis 