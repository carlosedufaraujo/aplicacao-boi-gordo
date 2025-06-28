# Integração Financeira: Centro de Custos + Calendário + DRC

## Visão Geral

A integração dos três módulos financeiros visa criar um **Centro de Comando Financeiro Unificado** que evite a pulverização de informações e proporcione uma visão 360° das finanças da operação.

## Problemas Identificados

1. **Duplicação de Dados**: Informações financeiras espalhadas em múltiplos lugares
2. **Falta de Sincronização**: Atualizações em um módulo não refletem nos outros
3. **Navegação Complexa**: Usuário precisa acessar múltiplas telas para ter visão completa
4. **Inconsistências**: Diferentes cálculos e métricas entre módulos

## Arquitetura Proposta

### 1. Dashboard Financeiro Integrado

Criar um novo componente principal que unifique as três visões:

```typescript
// src/components/Financial/FinancialDashboard.tsx
interface FinancialDashboard {
  // Visão consolidada
  currentBalance: number;
  projectedBalance30d: number;
  
  // Centro de Custos
  costByCategory: CostSummary[];
  costByLot: CostAllocation[];
  budgetVariance: BudgetAnalysis;
  
  // Calendário
  upcomingPayables: FinancialAccount[];
  upcomingReceivables: FinancialAccount[];
  overdueAccounts: FinancialAccount[];
  
  // DRC
  cashFlow: CashFlowPeriod;
  workingCapitalNeed: number;
  liquidityIndex: number;
}
```

### 2. Store Unificado com Sincronização

Implementar ações que mantenham os dados sincronizados:

```typescript
// src/stores/useAppStore.ts - Adicionar seção de integração

// Ação unificada para criar despesa
createExpenseWithIntegration: (expense: ExpenseFormData) => {
  // 1. Criar despesa no Centro de Custos
  const expenseId = addExpense(expense);
  
  // 2. Criar conta a pagar no Calendário
  const accountId = addFinancialAccount({
    type: 'payable',
    relatedEntityType: 'expense',
    relatedEntityId: expenseId,
    ...
  });
  
  // 3. Criar entrada no DRC
  addCashFlowEntry({
    type: 'despesa',
    relatedAccountId: accountId,
    ...
  });
  
  // 4. Atualizar projeções
  updateCashFlowProjections();
}
```

### 3. Componentes de Visualização Integrada

#### 3.1 Visão Temporal Unificada
```typescript
// Timeline que mostra tudo junto
<FinancialTimeline>
  - Vencimentos (Calendário)
  - Lançamentos realizados (DRC)
  - Alocações de custos (Centro de Custos)
</FinancialTimeline>
```

#### 3.2 Análise de Custos Expandida
```typescript
// Drill-down de custos até o nível de transação
Centro de Custo → Categoria → Lançamento → Conta → Extrato Bancário
```

#### 3.3 Projeções Inteligentes
```typescript
// Usar dados históricos para melhorar projeções
- Padrões de pagamento (Calendário)
- Custos médios por categoria (Centro de Custos)
- Sazonalidade (DRC histórico)
```

## Implementação Prática

### Fase 1: Criar Dashboard Unificado
1. Novo componente `FinancialDashboard.tsx`
2. Widgets modulares para cada área
3. Navegação contextual entre módulos

### Fase 2: Sincronização de Dados
1. Middleware no store para propagar mudanças
2. Validações cruzadas entre módulos
3. Logs de auditoria unificados

### Fase 3: Relatórios Integrados
1. DRE com dados do Centro de Custos
2. Fluxo de Caixa com projeções do Calendário
3. Análise de rentabilidade por lote/curral

### Fase 4: Automações
1. Criação automática de contas do Calendário quando despesa é lançada
2. Atualização de projeções do DRC quando pagamento é confirmado
3. Alertas inteligentes baseados em múltiplas métricas

## Benefícios Esperados

1. **Visão Unificada**: Uma única tela com todas informações financeiras críticas
2. **Redução de Erros**: Dados sincronizados automaticamente
3. **Tomada de Decisão**: Informações contextualizadas e correlacionadas
4. **Eficiência**: Menos cliques para acessar informações relacionadas

## Estrutura de Navegação Proposta

```
Financeiro/
├── Dashboard (NOVO - Visão integrada)
├── Operacional/
│   ├── Contas a Pagar/Receber
│   ├── Conciliação Bancária
│   └── Lançamentos
├── Gestão/
│   ├── Centro de Custos
│   ├── Orçamentos
│   └── Alocações
├── Análise/
│   ├── DRC
│   ├── Projeções
│   └── Indicadores
└── Relatórios/
    ├── DRE
    ├── Fluxo de Caixa
    └── Análise de Custos
```

## Métricas de Sucesso

1. **Tempo de Navegação**: Redução de 70% no tempo para acessar informações financeiras
2. **Consistência de Dados**: 100% de sincronização entre módulos
3. **Adoção**: Aumento de 50% no uso de relatórios integrados
4. **Precisão**: Melhoria de 30% na precisão das projeções

## Próximos Passos

1. Validar proposta com stakeholders
2. Criar protótipo do Dashboard Integrado
3. Implementar sincronização básica entre módulos
4. Testar com dados reais
5. Iterar baseado no feedback 