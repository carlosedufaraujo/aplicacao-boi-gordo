# Arquitetura Financeira - BoiGordo
## Regime de Caixa vs Regime de Competência

### 1. CONCEITOS FUNDAMENTAIS

#### Regime de Caixa
- **Definição**: Reconhece receitas e despesas apenas quando há movimentação financeira efetiva
- **Quando usar**: Controle de liquidez, fluxo de caixa diário, gestão de tesouraria
- **Vantagem**: Visão real do dinheiro disponível

#### Regime de Competência
- **Definição**: Reconhece receitas e despesas no período em que ocorrem, independente do pagamento
- **Quando usar**: DRE, análise de rentabilidade, relatórios contábeis
- **Vantagem**: Visão real da performance econômica

---

## 2. MAPEAMENTO DAS ENTIDADES DO SISTEMA

### 📊 Tabela CashFlow (Fluxo de Caixa)
**Regime**: CAIXA + COMPETÊNCIA
```typescript
{
  // CAMPOS DE COMPETÊNCIA
  date: Date,        // Data do fato gerador (competência)
  dueDate: Date,     // Data de vencimento (competência)
  
  // CAMPOS DE CAIXA  
  paymentDate: Date, // Data do pagamento efetivo (caixa)
  status: 'PENDING' | 'PAID' | 'RECEIVED' | 'CANCELLED' | 'OVERDUE',
  
  // CLASSIFICAÇÃO
  type: 'INCOME' | 'EXPENSE',
  categoryId: string,
  amount: number,
  
  // METADADOS
  description: string,
  reference: string,
  attachments: string[]
}
```

**Interpretação**:
- **Competência**: Usa `date` (data do fato gerador)
- **Caixa**: Usa `paymentDate` quando `status` = PAID/RECEIVED

### 🐂 Tabela CattlePurchase (Compra de Gado)
**Regime**: COMPETÊNCIA (origem dos lançamentos)
```typescript
{
  purchaseDate: Date,      // Data da compra (competência)
  receivedDate: Date,      // Data de recebimento (operacional)
  
  // VALORES COMPETÊNCIA
  purchaseValue: number,   // Valor do gado
  freightCost: number,     // Frete
  commission: number,      // Comissão
  totalCost: number,       // Custo total
  
  // PRAZOS DE PAGAMENTO
  principalDueDate: Date,  // Vencimento principal
  freightDueDate: Date,    // Vencimento frete
  commissionDueDate: Date, // Vencimento comissão
  
  status: PurchaseStatus
}
```

**Gera lançamentos em CashFlow**:
1. Principal → CashFlow (EXPENSE, dueDate: principalDueDate)
2. Frete → CashFlow (EXPENSE, dueDate: freightDueDate)
3. Comissão → CashFlow (EXPENSE, dueDate: commissionDueDate)

### 💰 Tabela Revenue (Receitas)
**Regime**: COMPETÊNCIA
```typescript
{
  dueDate: Date,       // Vencimento (competência)
  receiptDate: Date,   // Recebimento efetivo (caixa)
  totalAmount: number,
  isReceived: boolean,
  category: string
}
```

### 💸 Tabela Expense (Despesas)
**Regime**: COMPETÊNCIA
```typescript
{
  dueDate: Date,       // Vencimento (competência)
  paymentDate: Date,   // Pagamento efetivo (caixa)
  totalAmount: number,
  isPaid: boolean,
  category: string
}
```

---

## 3. ESTRUTURA PROPOSTA DE VISUALIZAÇÃO

### 🎯 Dashboard Principal
```
┌─────────────────────────────────────┐
│  VISÃO: [Caixa] [Competência] 🔄   │
└─────────────────────────────────────┘

REGIME DE CAIXA (Realizado)          REGIME DE COMPETÊNCIA (Previsto)
├── Entradas Hoje: R$ 50.000         ├── Receitas do Mês: R$ 850.000
├── Saídas Hoje: R$ 12.000          ├── Despesas do Mês: R$ 620.000
├── Saldo Atual: R$ 238.000         ├── Resultado: R$ 230.000
└── Fluxo 7 dias: R$ 45.000         └── Margem: 27%
```

### 📈 Relatórios por Regime

#### DRE (Demonstração de Resultados)
- **Regime**: SEMPRE COMPETÊNCIA
- **Período**: Mensal/Trimestral/Anual
- **Campos**: Data do fato gerador (`date`)

#### DFC (Demonstração de Fluxo de Caixa)
- **Regime**: SEMPRE CAIXA
- **Período**: Diário/Semanal/Mensal
- **Campos**: Data do pagamento (`paymentDate`)

#### Fluxo de Caixa Projetado
- **Regime**: MISTO
- **Realizado**: Caixa (paymentDate)
- **Projetado**: Competência (dueDate)

---

## 4. IMPLEMENTAÇÃO TÉCNICA

### Filtros de Regime no Backend

```typescript
// service/cashFlow.service.ts
class CashFlowService {
  
  // Busca por COMPETÊNCIA
  async getByCompetence(startDate: Date, endDate: Date) {
    return prisma.cashFlow.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }
  
  // Busca por CAIXA
  async getByCash(startDate: Date, endDate: Date) {
    return prisma.cashFlow.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: ['PAID', 'RECEIVED']
        }
      }
    });
  }
  
  // Busca MISTA para projeção
  async getProjection(startDate: Date, endDate: Date) {
    return prisma.cashFlow.findMany({
      where: {
        OR: [
          // Realizados (Caixa)
          {
            paymentDate: {
              gte: startDate,
              lte: endDate
            },
            status: { in: ['PAID', 'RECEIVED'] }
          },
          // Projetados (Competência)
          {
            dueDate: {
              gte: startDate,
              lte: endDate
            },
            status: 'PENDING'
          }
        ]
      }
    });
  }
}
```

### Componentes React com Seletor de Regime

```typescript
// components/FinancialDashboard.tsx
const FinancialDashboard = () => {
  const [regime, setRegime] = useState<'CAIXA' | 'COMPETENCIA'>('CAIXA');
  
  const { data } = useFinancialData({
    regime,
    startDate,
    endDate
  });
  
  return (
    <div>
      <RegimeSelector 
        value={regime} 
        onChange={setRegime}
      />
      
      {regime === 'CAIXA' ? (
        <CashFlowView data={data} />
      ) : (
        <AccrualView data={data} />
      )}
    </div>
  );
};
```

---

## 5. INDICADORES VISUAIS

### 🎨 Cores e Ícones por Status

| Status | Cor | Ícone | Regime |
|--------|-----|-------|---------|
| PENDING | 🟡 Amarelo | ⏰ Clock | Competência |
| PAID | 🟢 Verde | ✅ Check | Caixa |
| RECEIVED | 🟢 Verde | 💰 Money | Caixa |
| OVERDUE | 🔴 Vermelho | ⚠️ Alert | Ambos |
| CANCELLED | ⚫ Cinza | ❌ X | Nenhum |

### 📊 Cards de Resumo

```typescript
// Componente de Card com indicador de regime
<Card>
  <CardHeader>
    <Badge variant={regime === 'CAIXA' ? 'success' : 'warning'}>
      {regime === 'CAIXA' ? '💵 Realizado' : '📅 Previsto'}
    </Badge>
    <CardTitle>{title}</CardTitle>
  </CardHeader>
  <CardContent>
    <span className="text-2xl font-bold">
      {formatCurrency(value)}
    </span>
  </CardContent>
</Card>
```

---

## 6. CASOS DE USO PRÁTICOS

### Cenário 1: Compra de Gado
1. **Registro** (01/09): Compra 100 bois por R$ 500.000
2. **Competência**: Despesa reconhecida em 01/09
3. **Vencimento** (30/09): Data prevista de pagamento
4. **Pagamento** (05/10): Pagamento efetivo atrasado
5. **Caixa**: Saída reconhecida em 05/10

### Cenário 2: Venda de Gado
1. **Venda** (15/09): Venda 50 bois por R$ 300.000
2. **Competência**: Receita reconhecida em 15/09
3. **Vencimento** (15/10): Prazo de 30 dias
4. **Recebimento** (15/10): Recebimento no prazo
5. **Caixa**: Entrada reconhecida em 15/10

### Cenário 3: Análise Gerencial
- **DRE Setembro**: Mostra lucro de R$ 50.000 (competência)
- **Fluxo Caixa Setembro**: Mostra déficit de R$ 100.000 (ainda não recebeu vendas)
- **Decisão**: Precisa de capital de giro para cobrir o gap temporal

---

## 7. BENEFÍCIOS DA SEPARAÇÃO

### Para o Gestor
✅ Visão clara da rentabilidade real (Competência)
✅ Controle efetivo do caixa disponível (Caixa)
✅ Projeção de necessidades de capital de giro
✅ Identificação de gaps de liquidez

### Para a Contabilidade
✅ DRE correto para fins fiscais
✅ Conciliação bancária facilitada
✅ Compliance com normas contábeis
✅ Auditoria simplificada

### Para Decisões
✅ Precificação baseada em custos reais
✅ Análise de prazos médios
✅ Gestão de inadimplência
✅ Planejamento de investimentos

---

## 8. PRÓXIMOS PASSOS

1. **Fase 1**: Implementar toggle Caixa/Competência no Dashboard
2. **Fase 2**: Criar relatórios separados por regime
3. **Fase 3**: Adicionar projeções de fluxo de caixa
4. **Fase 4**: Implementar conciliação automática
5. **Fase 5**: Adicionar análise de gaps de liquidez

---

## 9. REGRAS DE NEGÓCIO

### Quando um lançamento afeta CAIXA:
- Status = PAID ou RECEIVED
- paymentDate preenchido
- Conta bancária movimentada

### Quando um lançamento afeta COMPETÊNCIA:
- Data do fato gerador (date) dentro do período
- Independente do status
- Exceto CANCELLED

### Lançamentos PENDENTES:
- Aparecem em projeções de caixa
- Aparecem em relatórios de competência
- Não aparecem em saldo bancário

---

## 10. CONCLUSÃO

A separação clara entre Caixa e Competência permite:
1. **Gestão Financeira**: Controle de liquidez
2. **Gestão Econômica**: Análise de rentabilidade
3. **Compliance**: Atendimento às normas
4. **Decisões**: Baseadas em dados corretos

O sistema BoiGordo está estruturado para suportar ambos os regimes, 
permitindo ao usuário escolher a visão mais adequada para cada decisão.