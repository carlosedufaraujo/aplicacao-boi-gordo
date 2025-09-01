# 📊 Sistema de Status dos Lotes - Como Funciona Atualmente

## 🎯 Visão Geral
O sistema usa **dois campos** para controlar o estado dos lotes:
- **`status`** (enum PurchaseStatus) - Status principal oficial
- **`stage`** (string opcional) - Estágio detalhado do processo

## 📋 Status Disponíveis (enum PurchaseStatus)

### 1️⃣ **CONFIRMED** 
- **Significado**: Compra confirmada mas animais ainda na origem
- **Quando usar**: Logo após criar a compra
- **Próximo passo**: Mudar para IN_TRANSIT quando sair para transporte

### 2️⃣ **IN_TRANSIT**
- **Significado**: Animais em transporte
- **Quando usar**: Quando os animais saírem da fazenda de origem
- **Próximo passo**: Registrar recepção (que muda o stage)

### 3️⃣ **ACTIVE**
- **Significado**: Lote ativo no confinamento
- **Quando usar**: Após recepção e alocação em currais
- **Estado final**: Até a venda

### 4️⃣ **SOLD**
- **Significado**: Lote vendido
- **Quando usar**: Após efetuar a venda
- **Estado**: Final

### 5️⃣ **CANCELLED**
- **Significado**: Compra cancelada
- **Quando usar**: Se a compra for cancelada por qualquer motivo
- **Estado**: Final

## 🔄 Fluxo de Transição de Status

```
CONFIRMED → IN_TRANSIT → ACTIVE → SOLD
              ↓
          CANCELLED
```

## 🏷️ Stages (Estágios Detalhados)

O campo `stage` fornece mais detalhes sobre o processo:

- **`confirmed`** - Inicial, equivale ao status CONFIRMED
- **`received`** - Recepcionado mas ainda não alocado
- **`confined`** - Alocado em currais e confinado
- **`active`** - Em operação ativa
- **`sold`** - Vendido

## 🔧 Principais Operações

### 1. **Criar Compra**
```typescript
// Status inicial
status: 'CONFIRMED'
stage: 'confirmed'
```

### 2. **Mudar para Em Trânsito**
```typescript
updateStatus(id, 'IN_TRANSIT')
// stage permanece 'confirmed' ou muda conforme necessário
```

### 3. **Registrar Recepção** (`registerReception`)
```typescript
// Quando executado:
stage: 'confined'  // Muda para confinado
// status pode permanecer IN_TRANSIT ou mudar para ACTIVE
// Cria alocações em currais (LotPenLink)
```

### 4. **Marcar como Confinado** (`markAsConfined`)
```typescript
// Pré-requisito: stage deve ser 'received'
// Quando executado:
stage: 'confined'
status: 'ACTIVE'
```

## 🚨 Validações Importantes

### ✅ Pode Recepocionar:
- Stage NÃO pode ser: `active`, `confined`, ou `sold`
- Stage pode ser: `confirmed` ou `received`

### ✅ Pode Marcar como Confinado:
- Stage DEVE ser: `received`

### ✅ Pode Excluir (NOVO):
- **QUALQUER STATUS** - Removida a validação
- Exclusão em cascata remove todos os dados relacionados

## 📊 Combinações Comuns

| Status | Stage | Significado |
|--------|-------|-------------|
| CONFIRMED | confirmed | Compra confirmada, aguardando transporte |
| IN_TRANSIT | confirmed | Em transporte, ainda não recepcionado |
| IN_TRANSIT | confined | Em transporte mas já recepcionado e alocado |
| ACTIVE | confined | Ativo e confinado (estado operacional) |
| ACTIVE | active | Ativo em operação |
| SOLD | sold | Vendido |

## ⚙️ Onde o Status é Usado

1. **Lista de Compras**: Mostra badge colorido com status
2. **Filtros**: Permite filtrar por status
3. **Validações**: Determina quais ações são permitidas
4. **Relatórios**: Agrupa e calcula métricas por status
5. **Dashboard**: Mostra estatísticas por status

## 🎨 Cores no Frontend

- **CONFIRMED**: 🟡 Amarelo
- **IN_TRANSIT**: 🔵 Azul
- **ACTIVE**: 🟢 Verde
- **SOLD**: 🟣 Roxo
- **CANCELLED**: 🔴 Vermelho

## 💡 Dicas de Uso

1. **Status** = Estado oficial do lote (mais importante)
2. **Stage** = Detalhamento do processo (complementar)
3. Alguns processos mudam apenas o stage, não o status
4. A exclusão agora funciona para qualquer status
5. O sistema é flexível mas mantém rastreabilidade

## 🔍 Como Verificar o Status Atual

```javascript
// No frontend
const isActive = purchase.status === 'ACTIVE' || 
                purchase.stage === 'active' || 
                purchase.stage === 'confined';

// Status pode ser excluído?
const canDelete = true; // Agora sempre pode!

// Está recepcionado?
const isReceived = purchase.stage === 'confined' || 
                  purchase.stage === 'received';
```