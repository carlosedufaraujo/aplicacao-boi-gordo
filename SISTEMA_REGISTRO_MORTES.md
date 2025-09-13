# 📊 SISTEMA DE REGISTRO DE MORTES - ANÁLISE COMPLETA

## 🎯 VISÃO GERAL DO SISTEMA

O sistema de registro de mortes é um módulo crítico que impacta múltiplas áreas da aplicação:
- **Estoque**: Atualiza quantidades em currais e lotes
- **Financeiro**: Registra perdas e impacta análises de rentabilidade
- **Relatórios**: Afeta indicadores de desempenho e mortalidade
- **Rastreabilidade**: Mantém histórico detalhado por curral/lote

## 📋 FLUXO DE REGISTRO DE MORTES

### 1. ENTRADA DE DADOS (Frontend)
**Componente**: `DeathManagementModal.tsx`
- Seleciona Lote (purchaseId)
- Seleciona Curral (penId)
- Informa quantidade de mortes
- Data do óbito
- Tipo de morte (categorização)
- Causa específica
- Observações veterinárias
- Perda estimada (calculada automaticamente)

### 2. TIPOS DE MORTE (Categorização)
```typescript
enum DeathType {
  NATURAL = 'NATURAL',           // Morte natural
  DISEASE = 'DISEASE',           // Doença
  ACCIDENT = 'ACCIDENT',         // Acidente
  TRANSPORT = 'TRANSPORT',       // Durante transporte
  STRESS = 'STRESS',             // Estresse
  NUTRITION = 'NUTRITION',       // Problemas nutricionais
  RESPIRATORY = 'RESPIRATORY',   // Problemas respiratórios
  DIGESTIVE = 'DIGESTIVE',       // Problemas digestivos
  UNKNOWN = 'UNKNOWN'            // Causa desconhecida
}
```

## 🔄 INTEGRAÇÕES E IMPACTOS

### 1. ATUALIZAÇÃO DE QUANTIDADES

#### A. Tabela `lot_pen_links` (Alocações)
```sql
-- Diminui quantidade no curral específico
UPDATE lot_pen_links 
SET quantity = quantity - {quantidade_mortes}
WHERE purchaseId = {lote_id} 
  AND penId = {curral_id}
  AND status = 'ACTIVE';
```

#### B. Tabela `cattle_purchases` (Lotes)
```sql
-- Atualiza contadores do lote
UPDATE cattle_purchases 
SET 
  currentQuantity = currentQuantity - {quantidade_mortes},
  deathCount = deathCount + {quantidade_mortes}
WHERE id = {lote_id};
```

### 2. IMPACTO FINANCEIRO

#### A. Cálculo de Perda Estimada
```typescript
// Fórmula automática se não informada
const averageWeight = purchase.averageWeight || 
                     (purchase.purchaseWeight / purchase.initialQuantity);
const pricePerKg = purchase.totalCost / 
                   (purchase.initialQuantity * purchase.purchaseWeight);
const estimatedLoss = quantidade * averageWeight * pricePerKg;
```

#### B. Registro na Tabela `death_records`
```typescript
{
  purchaseId: string,          // Lote
  penId: string,               // Curral
  quantity: number,            // Quantidade
  deathDate: Date,             // Data
  deathType: DeathType,        // Tipo categorizado
  cause?: string,              // Causa específica
  veterinaryNotes?: string,    // Observações
  estimatedLoss: number,       // Perda calculada
  userId: string              // Quem registrou
}
```

### 3. IMPACTO NO CENTRO FINANCEIRO

#### A. Despesas Não-Monetárias
- Mortes são registradas como "Non-Cash Expenses"
- Afetam análise de rentabilidade
- Não geram movimentação bancária
- Impactam DRE (Demonstração de Resultados)

#### B. Categorias Afetadas
- **Perdas Operacionais**: Mortes naturais e doenças
- **Perdas Extraordinárias**: Acidentes e eventos não previstos
- **Custos de Produção**: Impacto no custo médio por cabeça

### 4. IMPACTO NOS RELATÓRIOS

#### A. Indicadores de Mortalidade
```typescript
// Taxa de mortalidade por lote
mortalityRate = (deathCount / initialQuantity) * 100;

// Taxa de mortalidade por período
periodMortalityRate = (deathsInPeriod / averageHeadCount) * 100;

// Mortalidade por causa
mortalityByCause = groupBy(deathRecords, 'deathType');
```

#### B. Relatórios Afetados
1. **Dashboard Principal**
   - KPI de Taxa de Mortalidade
   - Gráfico de evolução de mortalidade
   - Alertas de mortalidade acima da média

2. **Relatório de Lotes**
   - Mortalidade por lote
   - Comparativo entre lotes
   - Impacto financeiro por lote

3. **Relatório de Currais**
   - Mortalidade por curral
   - Histórico de ocorrências
   - Análise de padrões

4. **DRE (Demonstração de Resultados)**
   - Perdas com mortalidade
   - Impacto na margem
   - Custo efetivo por cabeça vendida

5. **Análise de Rentabilidade**
   - Ajuste do ROI considerando perdas
   - Custo real vs projetado
   - Break-even ajustado

## 📊 ESTATÍSTICAS E ANÁLISES

### 1. Estatísticas Disponíveis
```typescript
interface DeathStatistics {
  totalDeaths: number;                    // Total geral
  deathsByType: Record<string, number>;   // Por tipo
  deathsByPen: Record<string, number>;    // Por curral
  deathsByPurchase: Record<string, number>; // Por lote
  mortalityRate: number;                  // Taxa geral
  totalEstimatedLoss: number;             // Perda total estimada
}
```

### 2. Análises Recomendadas
- **Padrão Temporal**: Identificar períodos críticos
- **Padrão Espacial**: Identificar currais problemáticos
- **Análise de Causa**: Identificar principais causas
- **Correlação**: Relacionar com fatores (clima, alimentação, etc)

## 🚨 PONTOS DE ATENÇÃO

### 1. Validações Necessárias
- ✅ Verificar se há animais suficientes no curral
- ✅ Não permitir quantidade negativa
- ✅ Data não pode ser futura
- ✅ Lote e curral devem estar ativos

### 2. Auditoria e Rastreabilidade
- Registrar quem cadastrou (userId)
- Timestamp de criação/atualização
- Histórico de alterações
- Observações veterinárias obrigatórias para certas causas

### 3. Alertas Automáticos
- Mortalidade acima de 2% em 24h
- Mortalidade acima de 5% no mês
- Padrão repetitivo em curral específico
- Causa recorrente necessitando intervenção

## 🔧 APIs DISPONÍVEIS

### Backend Endpoints
```typescript
// Criar registro de morte
POST /api/v1/death-records
Body: {
  purchaseId, penId, quantity, deathDate,
  deathType, cause, veterinaryNotes, estimatedLoss
}

// Listar registros
GET /api/v1/death-records?purchaseId={id}&penId={id}

// Estatísticas
GET /api/v1/death-records/statistics

// Atualizar registro
PUT /api/v1/death-records/:id

// Deletar registro
DELETE /api/v1/death-records/:id
```

### Frontend Hooks
```typescript
// Hook principal
const {
  deathRecords,
  statistics,
  loading,
  createDeathRecord,
  updateDeathRecord,
  deleteDeathRecord,
  loadStatistics
} = useDeathRecordsApi();
```

## 📈 MÉTRICAS RECOMENDADAS

### KPIs Principais
1. **Taxa de Mortalidade Geral**: Meta < 2%
2. **Taxa de Mortalidade no Transporte**: Meta < 0.5%
3. **Taxa de Mortalidade Primeira Semana**: Meta < 1%
4. **Perda Financeira por Mortalidade**: Meta < 1% do faturamento

### Benchmarks do Setor
- Confinamento bem gerenciado: 1-2% mortalidade total
- Média nacional: 2-3%
- Alerta vermelho: > 5%

## 🎯 RECOMENDAÇÕES DE USO

### 1. Registro Imediato
- Cadastrar morte no mesmo dia da ocorrência
- Sempre preencher causa e observações
- Fotografar/documentar casos atípicos

### 2. Análise Periódica
- Revisar estatísticas semanalmente
- Comparar com períodos anteriores
- Identificar padrões e tendências

### 3. Ações Preventivas
- Protocolo veterinário para causas recorrentes
- Revisão de manejo em currais problemáticos
- Ajuste nutricional conforme necessário

## 💡 MELHORIAS SUGERIDAS

1. **Integração com IoT**: Sensores para detecção automática
2. **Machine Learning**: Previsão de risco de mortalidade
3. **Necropsia Digital**: Formulário específico para laudo
4. **Seguro**: Integração com seguradoras para sinistros
5. **Alertas SMS/WhatsApp**: Notificações em tempo real

---

**Última atualização**: 12/09/2025
**Versão**: 1.0.0