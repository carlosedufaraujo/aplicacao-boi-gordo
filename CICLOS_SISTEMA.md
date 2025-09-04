# 🔄 SISTEMA DE CICLOS - ARQUITETURA E INTEGRAÇÕES

## 📊 VISÃO GERAL

Os **Ciclos** representam períodos operacionais da fazenda, permitindo agrupar e analisar todas as operações (compras, vendas, despesas, receitas) dentro de um período específico.

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Modelo Principal (Cycle)
```prisma
model Cycle {
  id            String      @id @default(cuid())
  name          String      // Nome do ciclo (ex: "Ciclo 2025/01")
  description   String?     // Descrição opcional
  startDate     DateTime    // Data de início
  endDate       DateTime?   // Data de término (opcional)
  status        CycleStatus @default(PLANNED)
  budget        Float       @default(0)
  targetAnimals Int         @default(0)
  actualAnimals Int         @default(0)
  totalCost     Float       @default(0)
  totalRevenue  Float       @default(0)
  isActive      Boolean     @default(true)
}
```

### Status Possíveis
- `PLANNED`: Planejado (pode ser ativado ou cancelado)
- `ACTIVE`: Ativo (apenas 1 por vez)
- `COMPLETED`: Concluído (não pode ser modificado)
- `CANCELLED`: Cancelado (estado final)

## 🔗 ENTIDADES QUE REFERENCIAM CICLOS

### 1. **CattlePurchase** (Compras de Gado)
- Campo: `cycleId: String?` (opcional)
- Permite associar compras a um ciclo específico
- Facilita análise de custos por período

### 2. **SaleRecord** (Vendas)
- Campo: `cycleId: String?` (opcional)
- Vincula vendas ao ciclo
- Permite calcular receitas por período

### 3. **Expense** (Despesas)
- Campo: `cycleId: String?` (opcional)
- Agrupa despesas operacionais por ciclo
- Facilita análise de custos indiretos

### 4. **Revenue** (Receitas)
- Campo: `cycleId: String?` (opcional)
- Associa receitas diversas ao ciclo
- Completa visão financeira do período

### 5. **CalendarEvent** (Eventos)
- Campo: `cycleId: String?` (opcional)
- Agenda eventos relacionados ao ciclo
- Mantém histórico de atividades

### 6. **CashFlow** (Fluxo de Caixa)
- Campo: `cycleId: String?` (opcional)
- Movimentações financeiras por ciclo
- Análise de liquidez por período

### 7. **FinancialTransaction** (Transações Financeiras)
- Campo: `cycleId: String?` (opcional)
- Integração com análise DRE/DFC
- Relatórios financeiros por ciclo

## ⚙️ REGRAS DE NEGÓCIO IMPLEMENTADAS

### 1. **Unicidade de Ciclo Ativo**
```javascript
// Apenas 1 ciclo pode estar ACTIVE por vez
if (data.status === 'ACTIVE') {
  const activeCycles = await this.findActive();
  if (activeCycles.length > 0) {
    throw new ValidationError('Já existe um ciclo ativo');
  }
}
```

### 2. **Validação de Datas**
```javascript
// Data final não pode ser anterior à inicial
if (data.endDate && data.endDate < data.startDate) {
  throw new ValidationError('Data final não pode ser anterior à data inicial');
}
```

### 3. **Transições de Status**
```javascript
const validTransitions = {
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Estado final
  CANCELLED: []  // Estado final
};
```

## 📈 IMPACTOS E ANÁLISES

### 1. **Análise Financeira por Ciclo**
- **DRE por Ciclo**: Receitas x Despesas do período
- **Fluxo de Caixa**: Entradas x Saídas por ciclo
- **Margem de Lucro**: Por período operacional
- **ROI do Ciclo**: Retorno sobre investimento

### 2. **Indicadores Operacionais**
- **Taxa de Mortalidade**: Por ciclo
- **Ganho de Peso Médio**: Durante o ciclo
- **Conversão Alimentar**: Eficiência por período
- **Custo por Arroba**: Análise de eficiência

### 3. **Comparação entre Ciclos**
- Evolução de custos
- Melhoria de indicadores
- Sazonalidade
- Tendências de mercado

## 🚦 COMO OS CICLOS SÃO IMPOSTOS

### 1. **Na Criação de Registros** (Opcional)
```javascript
// Ao criar uma compra, pode associar ao ciclo ativo
const activeCycle = await cycleService.findActive();
if (activeCycle) {
  purchaseData.cycleId = activeCycle.id;
}
```

### 2. **Nos Filtros de Consulta**
```javascript
// Filtrar despesas por ciclo
const expenses = await expenseService.findAll({
  cycleId: selectedCycleId
});
```

### 3. **Nos Relatórios**
```javascript
// Dashboard com métricas do ciclo
const cycleMetrics = await analyticsService.getCycleMetrics(cycleId);
```

## 🔐 VALIDAÇÕES E CONSISTÊNCIA

### 1. **Integridade Referencial**
- Ciclos podem ser deletados apenas se não houver referências
- Soft delete mantém histórico

### 2. **Auditoria**
- Todas mudanças de status são registradas
- Rastreabilidade completa

### 3. **Permissões**
- Apenas gestores podem criar/editar ciclos
- Visualização liberada para todos

## 📱 USO NO FRONTEND

### 1. **Seletor de Ciclo**
- Dropdown global para filtrar dados
- Persiste seleção na sessão

### 2. **Dashboard por Ciclo**
- KPIs específicos do período
- Comparações com ciclos anteriores

### 3. **Relatórios**
- Exportação de dados por ciclo
- Análises comparativas

## 🎯 BENEFÍCIOS DO SISTEMA

1. **Organização Temporal**: Separa operações por períodos
2. **Análise Comparativa**: Permite comparar desempenho
3. **Controle Financeiro**: Orçamento vs Realizado
4. **Planejamento**: Base para projeções futuras
5. **Rastreabilidade**: Histórico completo de operações

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Ciclos são OPCIONAIS**: Sistema funciona sem ciclos ativos
2. **Retroativo**: Pode associar registros antigos a ciclos
3. **Flexível**: Datas podem ser ajustadas (exceto COMPLETED)
4. **Não-destrutivo**: Deletar ciclo não apaga registros associados

## 🔄 FLUXO TÍPICO DE USO

1. **Criar Ciclo** (PLANNED)
2. **Ativar Ciclo** (ACTIVE) - início das operações
3. **Registrar Operações** - compras, vendas, despesas
4. **Monitorar Indicadores** - acompanhamento em tempo real
5. **Completar Ciclo** (COMPLETED) - fim do período
6. **Analisar Resultados** - relatórios e aprendizados

## 📊 QUERIES ÚTEIS

```sql
-- Ciclo ativo atual
SELECT * FROM cycles WHERE status = 'ACTIVE';

-- Total de custos por ciclo
SELECT 
  c.name,
  SUM(cp.totalCost) as total_compras,
  SUM(e.totalAmount) as total_despesas
FROM cycles c
LEFT JOIN cattle_purchases cp ON cp.cycleId = c.id
LEFT JOIN expenses e ON e.cycleId = c.id
GROUP BY c.id;

-- Rentabilidade por ciclo
SELECT 
  name,
  totalRevenue - totalCost as lucro,
  (totalRevenue - totalCost) / totalCost * 100 as margem
FROM cycles
WHERE status = 'COMPLETED';
```

## 🚀 FUTURAS MELHORIAS

1. **Ciclos Automáticos**: Criar ciclos baseados em regras
2. **Templates de Ciclo**: Reutilizar configurações
3. **Previsões**: IA para prever resultados
4. **Integração Completa**: Vincular automaticamente novos registros
5. **Alertas**: Notificações de marcos importantes