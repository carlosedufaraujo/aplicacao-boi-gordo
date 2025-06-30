# Status da Implementação do Modelo Híbrido Financeiro

## Resumo das Alterações Realizadas

### 1. Modelo Híbrido Previsto/Realizado

Implementamos um modelo simplificado para gerenciar transações financeiras:

```typescript
interface Expense {
  // ...
  dueDate: Date;          // Data de vencimento (sempre preenchida)
  paymentDate?: Date;     // Data de pagamento (quando realizado)
  isPaid: boolean;        // Flag simples: false = previsto, true = realizado
  // ...
}
```

**Vantagens:**
- Simplicidade binária (pago ou não pago)
- Permite análise de pontualidade (comparar dueDate com paymentDate)
- Fácil filtragem e relatórios

### 2. Estrutura de Centros de Custos e Categorias

Criamos uma estrutura completa com 7 centros de custos:

1. **AQUISIÇÃO**: Compra de animais, comissão, frete, outros custos
2. **ENGORDA**: Alimentação, sanidade, operacional, mortalidade, quebra de peso
3. **ADMINISTRATIVO**: Pessoal, escritório, marketing, depreciação, etc.
4. **FINANCEIRO**: Juros, taxas, impostos, inadimplência, etc.
5. **VENDAS**: Comissões de venda, frete de venda, classificação
6. **RECEITAS**: Venda de gado, serviços, subprodutos
7. **APORTES E FINANCIAMENTOS**: Aportes de sócio, empréstimos, financiamentos

### 3. Flag `impactsCashFlow`

Cada categoria tem uma flag indicando se impacta o caixa:

- **COM impacto** (✅): Vão para Centro Financeiro + DRE
- **SEM impacto** (❌): Vão direto para DRE

Exemplos sem impacto no caixa:
- Mortalidade
- Quebra de peso
- Depreciação
- Custo de capital
- Inadimplência
- Deduções fiscais

### 4. Integração com DRE

- Removida regra automática de 5% para despesas operacionais
- DRE agora busca despesas reais do Centro Financeiro
- Mapeamento automático de categorias para seções do DRE

### 5. Status da Implementação

#### ✅ Concluído:
- Definição das interfaces e tipos
- Estrutura de categorias com configuração
- Atualização parcial do store para usar modelo híbrido
- Integração DRE com despesas reais

#### ⚠️ Em Andamento:
- Correção de erros de linter nas despesas
- Atualização completa de todas as funções que criam despesas

#### 🔄 Próximos Passos:
1. Corrigir erros restantes no store
2. Atualizar componentes do Centro Financeiro
3. Implementar filtros por status (previsto/realizado)
4. Criar relatórios de previsto vs realizado
5. Integrar com Calendário Financeiro

## Erros Pendentes

Ainda existem alguns erros de TypeScript relacionados a:
1. Propriedade `animalIds` em `SaleDesignation`
2. Algumas despesas ainda usando `paymentStatus` antigo
3. Dados de teste usando estrutura antiga

## Fluxo de Integração

### Ordem de Compra → Sistema Financeiro:

1. **Criação**: Gera despesas com `isPaid: false` (previsto)
2. **Validação de Pagamento**: Atualiza para `isPaid: true`
3. **Centro Financeiro**: Mostra apenas despesas com `impactsCashFlow: true`
4. **DRE**: Mostra todas as despesas realizadas (`isPaid: true`)
5. **Calendário**: Mostra vencimentos (`dueDate`) de contas não pagas

## Conclusão

O modelo híbrido está parcialmente implementado e oferece uma base sólida para o sistema financeiro integrado. A simplicidade do modelo (apenas `isPaid` + duas datas) facilita a manutenção e compreensão, enquanto mantém toda a flexibilidade necessária para análises gerenciais. 