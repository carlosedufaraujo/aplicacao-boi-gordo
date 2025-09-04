# 🧪 Guia de Testes - Módulo Financeiro Integrado

## 📊 1. ANÁLISE FINANCEIRA INTEGRADA (DRE/DFC)

### Endpoints Backend (porta 3001):

#### A) Geração de Análise
```bash
# Gerar análise para setembro/2025
curl -X POST http://localhost:3001/api/v1/integrated-analysis/generate \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "month": 9,
    "includeNonCashItems": true
  }'
```

#### B) Consulta por Período
```bash
# Buscar análise de um mês específico
curl http://localhost:3001/api/v1/integrated-analysis/period/2025/9

# Listar todas análises de 2025
curl http://localhost:3001/api/v1/integrated-analysis/year/2025
```

#### C) Dashboard Anual
```bash
# Dashboard com KPIs consolidados de 2025
curl http://localhost:3001/api/v1/integrated-analysis/dashboard/2025
```

#### D) Análise Comparativa
```bash
# Comparar períodos
curl "http://localhost:3001/api/v1/integrated-analysis/compare?startYear=2025&startMonth=1&endYear=2025&endMonth=12"
```

## 💰 2. FLUXO DE CAIXA (CASH FLOW)

### Endpoints Backend:

#### A) CRUD de Movimentações
```bash
# Criar nova movimentação
curl -X POST http://localhost:3001/api/v1/cash-flows \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "categoryId": "operacional",
    "accountId": "conta-principal",
    "description": "Compra de ração",
    "amount": 5000,
    "date": "2025-09-03",
    "status": "PENDING"
  }'

# Listar todas movimentações
curl http://localhost:3001/api/v1/cash-flows

# Buscar resumo financeiro
curl http://localhost:3001/api/v1/cash-flows/summary
```

#### B) Demonstrativo de Fluxo de Caixa (DFC)
```bash
# Gerar demonstrativo
curl -X POST http://localhost:3001/api/v1/cash-flows/generate \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-09"}'

# Consultar demonstrativo
curl "http://localhost:3001/api/v1/cash-flows/statement?period=2025-09&type=monthly"

# Exportar DFC
curl http://localhost:3001/api/v1/cash-flows/export?period=2025-09&type=monthly
```

#### C) Atualização de Status
```bash
# Marcar como pago
curl -X PATCH http://localhost:3001/api/v1/cash-flows/{id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paymentDate": "2025-09-03"
  }'
```

## 🖥️ 3. INTERFACE FRONTEND (porta 5173)

### Navegação Principal:

#### A) Dashboard de Análise Integrada
- **URL**: http://localhost:5173
- **Menu**: Análise Integrada (ícone calculadora)
- **Funcionalidades**:
  - Visualização DRE/DFC unificada
  - Gráficos de tendências
  - Indicadores de qualidade
  - Reconciliação automática

#### B) Fluxo de Caixa
- **URL**: http://localhost:5173
- **Menu**: Financeiro
- **Componentes**:
  - `CashFlowDashboard`: Visão geral
  - `CashFlowForm`: Cadastro de movimentações
  - `CashFlowList`: Listagem e filtros
  - `CashFlowFilters`: Filtros avançados
  - `RegimeSelector`: Seleção caixa/competência

## 🔄 4. INTEGRAÇÕES ATIVAS

### A) Com Sistema de Compras
- Compras de gado geram `FinancialTransaction`
- Classificação automática como `CATTLE_ACQUISITION`
- Impacto no fluxo de caixa operacional

### B) Com Sistema de Vendas
- Vendas geram receitas (`CATTLE_SALES`)
- Reconciliação automática com recebimentos

### C) Com Despesas e Receitas
- Integração via `Expense` e `Revenue`
- Conversão automática para `FinancialTransaction`

### D) Com Contas Bancárias
- Via `PayerAccount` para saldos
- Atualização automática ao confirmar pagamentos

## 📈 5. MÉTRICAS E INDICADORES

### Disponíveis no Sistema:
1. **DRE (Competência)**:
   - Receita Total
   - Despesas Operacionais
   - Lucro Líquido
   - Margem de Lucro

2. **DFC (Caixa)**:
   - Fluxo Operacional
   - Fluxo de Investimento
   - Fluxo de Financiamento
   - Saldo de Caixa

3. **Reconciliação**:
   - Diferença DRE x DFC
   - Ajustes não-caixa
   - Depreciação
   - Mortalidade

4. **Biológicos**:
   - Variação valor justo
   - Ajustes de avaliação
   - Impacto no resultado

## 🧪 6. CENÁRIOS DE TESTE

### Teste 1: Ciclo Completo
1. Criar movimentação de despesa (compra ração)
2. Gerar análise do mês
3. Verificar impacto no DRE e DFC
4. Confirmar reconciliação

### Teste 2: Comparação Temporal
1. Gerar análises de múltiplos meses
2. Usar endpoint de comparação
3. Verificar gráficos de tendência

### Teste 3: Fluxo de Pagamento
1. Criar despesa pendente
2. Atualizar status para pago
3. Verificar atualização no saldo
4. Confirmar no dashboard

## 🔑 7. DADOS DE EXEMPLO

### Categorias Financeiras (enum):
- `CATTLE_SALES`: Vendas de gado
- `CATTLE_ACQUISITION`: Compra de gado
- `FEED_COSTS`: Ração
- `VETERINARY_COSTS`: Veterinária
- `OPERATIONAL_COSTS`: Operacional
- `ADMINISTRATIVE`: Administrativo
- `DEPRECIATION`: Depreciação
- `MORTALITY`: Mortalidade

### Status de Pagamento:
- `PENDING`: Pendente
- `PAID`: Pago
- `RECEIVED`: Recebido
- `CANCELLED`: Cancelado
- `OVERDUE`: Vencido

### Classificação DFC:
- `OPERATING`: Atividades operacionais
- `INVESTING`: Atividades de investimento
- `FINANCING`: Atividades de financiamento

## 📝 NOTAS IMPORTANTES

1. **Autenticação**: Alguns endpoints requerem token JWT
2. **Período**: Formato YYYY-MM para períodos mensais
3. **Moeda**: Valores em R$ (reais)
4. **Timezone**: Horário de Brasília (GMT-3)
5. **Cache**: Dashboard tem cache de 15 minutos