# Sistema de Controle de Impacto no Fluxo de Caixa

## 📊 Conceito

O campo `impactsCashFlow` determina se uma despesa representa uma **saída efetiva de dinheiro** (impacta caixa) ou apenas um **lançamento contábil** (não impacta caixa).

## 🎯 Como Funciona

### 1. **Despesas que IMPACTAM o Fluxo de Caixa** (`impactsCashFlow: true`)
São despesas que representam saídas reais de dinheiro:

- ✅ **Compra de Animais** (`animal_purchase`) - Pagamento aos fornecedores
- ✅ **Frete** (`freight`) - Pagamento de transporte
- ✅ **Comissão** (`commission`) - Pagamento a intermediários
- ✅ **Alimentação** (`feed`) - Compra de ração
- ✅ **Sanidade** (`health_costs`) - Medicamentos e veterinário
- ✅ **Custos Operacionais** (`operational_costs`) - Manutenção, energia, etc.
- ✅ **Despesas Administrativas** - Salários, marketing, etc.
- ✅ **Despesas Financeiras** - Juros, taxas bancárias

### 2. **Despesas que NÃO IMPACTAM o Fluxo de Caixa** (`impactsCashFlow: false`)
São lançamentos contábeis que não representam saída de dinheiro:

- ❌ **Mortalidade** (`deaths`) - Perda de patrimônio, não saída de caixa
- ❌ **Quebra de Peso** (`weight_loss`) - Perda de valor, não saída de caixa
- ❌ **Depreciação** - Perda de valor de ativos ao longo do tempo
- ❌ **Provisões** - Reservas contábeis

## 💡 Exemplos Práticos

### Exemplo 1: Compra de Ração
```javascript
{
  category: 'feed',
  description: 'Compra de ração - 100 toneladas',
  totalAmount: 50000.00,
  impactsCashFlow: true  // ✅ Saída real de dinheiro
}
```
→ **Impacto**: Reduz o saldo bancário em R$ 50.000

### Exemplo 2: Morte de Animal
```javascript
{
  category: 'deaths',
  description: 'Perda por mortalidade - 2 cabeças',
  totalAmount: 8000.00,  // Valor contábil da perda
  impactsCashFlow: false // ❌ Não é saída de dinheiro
}
```
→ **Impacto**: 
- Reduz o resultado contábil em R$ 8.000 (aparece no DRE)
- NÃO reduz o saldo bancário (não aparece no fluxo de caixa)

## 🔧 Implementação no Sistema

### Backend - Definição Automática
```typescript
// src/services/expense.service.ts
const impactsCashFlow = data.impactsCashFlow ?? 
  !['deaths', 'weight_loss'].includes(data.category);
```

### Banco de Dados
```prisma
model Expense {
  impactsCashFlow Boolean @default(true)
  // Por padrão, despesas impactam o caixa
}
```

## 📈 Uso nos Relatórios

### 1. **Fluxo de Caixa**
- Mostra apenas despesas com `impactsCashFlow: true`
- Reflete movimentações reais de dinheiro
- Usado para gestão de tesouraria

### 2. **DRE (Demonstrativo de Resultado)**
- Mostra TODAS as despesas (independente de `impactsCashFlow`)
- Inclui perdas contábeis como mortalidade
- Usado para análise de lucratividade

### 3. **Análise Integrada**
- Diferencia visualmente despesas de caixa vs contábeis
- Permite análise completa do negócio

## 🎨 Visualização no Sistema

### Centro Financeiro
- Despesas com `impactsCashFlow: true` → Badge "💰 Impacta Caixa"
- Despesas com `impactsCashFlow: false` → Badge "📊 Contábil"

### Filtros Disponíveis
```javascript
// Filtrar apenas despesas que impactam caixa
const cashExpenses = expenses.filter(e => e.impactsCashFlow);

// Filtrar apenas lançamentos contábeis
const accountingExpenses = expenses.filter(e => !e.impactsCashFlow);
```

## 📝 Regras de Negócio

1. **Mortalidade sempre é contábil**: Quando um animal morre, o valor perdido não sai do banco
2. **Compras sempre impactam caixa**: Toda aquisição representa pagamento
3. **Provisões são contábeis**: Reservas para despesas futuras não saem do caixa
4. **Depreciação é contábil**: Perda de valor de equipamentos não é saída de dinheiro

## 🔄 Casos Especiais

### Despesa Paga x Não Paga
- `isPaid: false` + `impactsCashFlow: true` = Vai impactar o caixa quando for paga
- `isPaid: true` + `impactsCashFlow: false` = Nunca impactará o caixa (ex: mortalidade)

### Relatórios Gerenciais
- **Caixa Projetado**: Considera apenas `impactsCashFlow: true` e `isPaid: false`
- **Resultado Econômico**: Considera todas as despesas
- **Caixa Realizado**: Considera apenas `impactsCashFlow: true` e `isPaid: true`

## 🚀 Benefícios

1. **Gestão de Caixa Precisa**: Saber exatamente quanto dinheiro está saindo
2. **Análise Contábil Completa**: Incluir perdas não monetárias no resultado
3. **Decisões Informadas**: Diferenciar entre problemas de caixa vs lucratividade
4. **Compliance**: Atender requisitos contábeis e fiscais

## 📊 Impacto nos KPIs

- **Fluxo de Caixa Livre**: Usa apenas `impactsCashFlow: true`
- **EBITDA**: Inclui todas as despesas operacionais
- **Lucro Líquido**: Inclui todas as despesas (caixa + contábeis)
- **Capital de Giro**: Considera apenas movimentações de caixa