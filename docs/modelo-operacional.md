# Modelo Operacional - Sistema de Gestão de Gado

## Visão Geral

O sistema implementa uma hierarquia de gestão baseada em dois conceitos principais:

1. **Lote**: Representa a operação de compra (imutável)
2. **Curral**: Representa a unidade de manejo operacional (dinâmica)

A ligação entre eles é feita através da tabela de junção `LoteCurralLink`, permitindo um modelo flexível onde:
- Um lote pode estar distribuído em múltiplos currais
- Um curral pode conter animais de múltiplos lotes
- Os custos são alocados proporcionalmente

## Estrutura de Dados

### 1. Lote (CattleLot)
```typescript
interface CattleLot {
  id: string;
  lotNumber: string; // Ex: ACXENG001
  purchaseOrderId: string;
  
  // Dados imutáveis de entrada
  entryWeight: number;
  entryQuantity: number;
  entryDate: Date;
  
  // Custos acumulados (atualizados automaticamente)
  custoAcumulado: {
    aquisicao: number;
    sanidade: number;
    alimentacao: number;
    operacional: number;
    frete: number;
    outros: number;
    total: number;
  };
  
  // Alocações atuais
  alocacoesAtuais?: {
    curralId: string;
    quantidade: number;
    percentual: number;
  }[];
}
```

### 2. Curral (PenRegistration + PenStatus)
```typescript
interface PenRegistration {
  id: string;
  penNumber: string; // Ex: "1", "2", "3"
  capacity: number;
  location?: string; // Ex: "Setor 1"
  tipo?: 'recepção' | 'engorda' | 'quarentena' | 'hospital';
}

interface PenStatus {
  penNumber: string;
  capacity: number;
  currentAnimals: number;
  status: 'available' | 'occupied' | 'maintenance' | 'quarantine';
  loteSummary?: {
    loteId: string;
    loteNumber: string;
    quantidade: number;
    percentualOcupacao: number;
  }[];
}
```

### 3. Tabela de Junção (LoteCurralLink)
```typescript
interface LoteCurralLink {
  id: string;
  loteId: string;
  curralId: string;
  quantidade: number;
  percentualDoLote: number; // % do lote neste curral
  percentualDoCurral: number; // % do curral ocupado por este lote
  dataAlocacao: Date;
  status: 'active' | 'removed';
}
```

### 4. Alocação Proporcional de Custos
```typescript
interface CostProportionalAllocation {
  id: string;
  custoOrigemId: string; // ID do protocolo/alimentação
  custoOrigemTipo: 'health' | 'feed' | 'operational' | 'other';
  curralId: string;
  loteId: string;
  valorOriginal: number; // Valor total no curral
  valorAlocado: number; // Valor proporcional ao lote
  percentualAlocado: number;
}
```

## Fluxos Operacionais

### 1. Pipeline de Compras

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌─────────────┐
│ Ordem de Compra │ --> │ Validando Pagam. │ --> │  Em Recepção   │ --> │  Confinado  │
└─────────────────┘     └──────────────────┘     └────────────────┘     └─────────────┘
                                                          │                      │
                                                          v                      v
                                                   Criar Lote              ALOCAÇÃO EM
                                                   (Registro)               CURRAIS
```

#### Etapa: Confinado (Alocação)
Quando uma ordem chega à etapa "Confinado", o sistema exige a alocação dos animais em currais:

1. **Alocação Única**: Todos os animais em um único curral
2. **Alocação Múltipla**: Distribuir entre vários currais

Exemplo de alocação múltipla:
```
Lote ACXENG001 - 100 animais
├── Curral 1: 50 animais (50%)
├── Curral 2: 30 animais (30%)
└── Curral 3: 20 animais (20%)
```

### 2. Gestão de Custos no Curral

Quando um custo é aplicado a um curral (protocolo sanitário, alimentação, etc.), o sistema:

1. **Identifica todos os lotes no curral**
2. **Calcula a proporção de cada lote**
3. **Aloca o custo proporcionalmente**

#### Exemplo Prático:
```
Curral 2 - Total: 80 animais
├── Lote ACXENG001: 30 animais (37.5%)
└── Lote ACXENG003: 50 animais (62.5%)

Protocolo Sanitário: R$ 800
├── Alocado ao ACXENG001: R$ 300 (37.5%)
└── Alocado ao ACXENG003: R$ 500 (62.5%)
```

### 3. Pipeline de Vendas

```
┌────────────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐     ┌─────────────┐
│ Próximo Abate  │ --> │ Escalado  │ --> │ Embarcado  │ --> │ Abatido  │ --> │ Conciliado  │
└────────────────┘     └───────────┘     └────────────┘     └──────────┘     └─────────────┘
       │                                                            │                  │
       v                                                            v                  v
  Por CURRAL                                                   Romaneio         Rastreabilidade
                                                                                  de LOTES
```

#### Designação para Abate
- A designação é feita por **curral** (unidade operacional)
- O sistema mantém a rastreabilidade dos lotes originais
- Na conciliação, apura-se o resultado por lote proporcionalmente

## Consultas e Relatórios

### 1. Consultas Disponíveis

```typescript
// Quais lotes estão em um curral?
getLotesInCurral(curralId: string): { lote: CattleLot; link: LoteCurralLink }[]

// Em quais currais está um lote?
getCurraisOfLote(loteId: string): { curral: PenRegistration; link: LoteCurralLink }[]

// Custos acumulados por lote
calculateLotCostsByCategory(loteId: string): CustoAcumulado
```

### 2. Rastreabilidade Completa

O sistema mantém rastreabilidade completa:
- **Origem**: Onde e quando o lote foi comprado
- **Manejo**: Todos os currais por onde passou
- **Custos**: Todos os custos aplicados proporcionalmente
- **Destino**: Para qual frigorífico foi vendido

## Benefícios do Modelo

1. **Flexibilidade Operacional**: Permite dividir lotes grandes em múltiplos currais
2. **Precisão Financeira**: Custos sempre alocados proporcionalmente
3. **Rastreabilidade**: Histórico completo de cada animal/lote
4. **Gestão por Curral**: Facilita o manejo diário (aplicar protocolos por curral)
5. **Apuração Precisa**: Resultado financeiro exato por lote

## Cenários de Uso

### Cenário 1: Lote Grande
```
Compra: 500 animais (Lote MEGA001)
Alocação:
├── Curral 1: 130 animais
├── Curral 2: 130 animais
├── Curral 3: 120 animais
└── Curral 4: 120 animais
```

### Cenário 2: Mistura de Lotes
```
Curral 5:
├── Lote ACXENG001: 40 animais (30.8%)
├── Lote ACXENG002: 50 animais (38.4%)
└── Lote ACXENG003: 40 animais (30.8%)

Custo de Ração: R$ 1,000
├── ACXENG001: R$ 308
├── ACXENG002: R$ 384
└── ACXENG003: R$ 308
```

### Cenário 3: Movimentação
```
Lote ACXENG001 - Movimento de 20 animais:
De: Curral 1 (tinha 50)
Para: Curral 10 (vazio)

Resultado:
├── Curral 1: 30 animais do ACXENG001
└── Curral 10: 20 animais do ACXENG001
```

## Implementação Técnica

### Store (Zustand)
- `loteCurralLinks`: Armazena as ligações lote-curral
- `costProportionalAllocations`: Armazena alocações de custos
- `allocateLotToPens()`: Função para alocar lote em currais
- `allocateCostProportionally()`: Função para distribuir custos

### Formulários
- `LotAllocationForm`: Interface para alocação de lotes
- `HealthRecordForm`: Atualizado para aplicar custos por curral
- Outros formulários seguem o mesmo padrão

### Componentes
- `PenMap`: Visualização dos currais e suas ocupações
- `Pipeline`: Fluxo de compras com alocação obrigatória
- `SalesPipeline`: Fluxo de vendas com rastreabilidade 