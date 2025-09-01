# 📊 Modelo Contábil Correto - Quebra de Peso vs Mortalidade

## ✅ PARÂMETROS DEFINIDOS

### 1️⃣ **QUEBRA DE PESO (Ajuste de Quantidade)**
- **Natureza**: Ajuste físico, NÃO é custo
- **Tratamento**: Reduz o peso total do lote
- **Impacto**: Altera o custo médio por kg (custo total ÷ novo peso)
- **Registro**: Campo informativo, não entra no DRE

### 2️⃣ **MORTALIDADE (Custo Real)**
- **Natureza**: PERDA FINANCEIRA = CUSTO
- **Tratamento**: Lançamento como despesa
- **Categoria**: "MORTES" (separado de outros custos)
- **Registro**: Entra no DRE como custo operacional

## 📐 ESTRUTURA CONTÁBIL CORRETA

```typescript
interface LoteCustos {
  // ===== CUSTOS DE AQUISIÇÃO =====
  aquisicao: {
    valorCompra: number,      // Valor pago pelos animais
    frete: number,            // Custo do transporte
    comissaoCorretor: number, // Comissão paga
    outrosCustos: number,     // Documentação, etc
    subtotal: number
  },
  
  // ===== AJUSTES FÍSICOS (NÃO MONETÁRIOS) =====
  ajustesFisicos: {
    quebraPeso: {
      percentual: number,     // Ex: 2% de quebra
      pesoInicial: number,    // Ex: 42.000 kg
      pesoPerdido: number,    // Ex: 840 kg
      pesoFinal: number       // Ex: 41.160 kg
      // NÃO TEM VALOR MONETÁRIO - apenas informativo
    }
  },
  
  // ===== CUSTOS POR MORTALIDADE =====
  mortalidade: {
    // Mortes no transporte (antes da recepção)
    transporte: {
      quantidade: number,         // Ex: 1 animal
      pesoMedio: number,          // Ex: 420 kg
      custoMedioAnimal: number,   // Valor investido por animal
      perdaFinanceira: number     // = quantidade × custoMedioAnimal
    },
    
    // Mortes no confinamento (após recepção)
    confinamento: {
      quantidade: number,
      pesoMedio: number,
      custoAcumuladoAnimal: number, // Inclui custos de confinamento
      perdaFinanceira: number
    },
    
    subtotalMortes: number  // ESTE VALOR ENTRA COMO CUSTO NO DRE
  },
  
  // ===== CUSTOS DE CONFINAMENTO =====
  confinamento: {
    racao: number,
    maodeobra: number,
    medicamentos: number,
    infraestrutura: number,
    outros: number,
    subtotal: number
  },
  
  // ===== TOTAL GERAL =====
  custoTotal: number  // aquisicao + mortalidade + confinamento
}
```

## 🔄 FLUXO DE CÁLCULO CORRETO

### **CENÁRIO EXEMPLO:**
```typescript
// Compra: 100 animais, 42.000 kg total (420 kg/animal)
// Valor: R$ 8,00/kg = R$ 336.000

const lote = {
  // MOMENTO 1: COMPRA
  compra: {
    quantidade: 100,
    pesoTotal: 42000,
    valorTotal: 336000,
    custoMedioPorAnimal: 3360  // R$ 336.000 ÷ 100
  },
  
  // MOMENTO 2: RECEPÇÃO
  recepcao: {
    // Quebra de peso (NÃO É CUSTO)
    quebraPeso: {
      percentual: 2.0,          // 2% de quebra
      pesoPerdido: 840,         // 42.000 × 2% = 840 kg
      pesoFinal: 41160          // 42.000 - 840
      // Não gera lançamento financeiro!
    },
    
    // Morte no transporte (É CUSTO)
    mortalidade: {
      quantidade: 1,
      custoAnimal: 3360,        // Custo médio do animal
      perdaFinanceira: 3360     // LANÇA COMO DESPESA
    },
    
    // Resultado
    quantidadeFinal: 99,        // 100 - 1 morte
    pesoFinal: 41160            // Após quebra
  },
  
  // MOMENTO 3: CONFINAMENTO (60 dias depois)
  confinamento: {
    // Morte durante confinamento
    mortalidade: {
      quantidade: 2,
      custoAcumulado: 4500,     // Animal + custos de 60 dias
      perdaFinanceira: 9000     // 2 × 4500 = DESPESA
    },
    
    quantidadeFinal: 97,        // 99 - 2 mortes
    custosTotais: {
      racao: 60000,
      maodeobra: 15000,
      medicamentos: 3000,
      mortes: 9000,             // ← MORTALIDADE COMO CUSTO SEPARADO
      total: 87000
    }
  }
};
```

## 📊 LANÇAMENTOS CONTÁBEIS

### **DRE - Demonstrativo de Resultados**
```typescript
const DRE = {
  // RECEITAS
  receitas: {
    vendaAnimais: 580000,       // 97 animais vendidos
    subtotal: 580000
  },
  
  // CUSTOS E DESPESAS
  custos: {
    // Custos de Aquisição
    compraAnimais: 336000,
    frete: 21000,
    comissaoCorretor: 16800,
    
    // Custos de Mortalidade (SEPARADO)
    mortesTransporte: 3360,     // 1 animal
    mortesConfinamento: 9000,   // 2 animais
    
    // Custos de Confinamento
    racao: 60000,
    maodeobra: 15000, 
    medicamentos: 3000,
    
    subtotal: 464160
  },
  
  // RESULTADO
  lucroOperacional: 115840,     // 580000 - 464160
  margemOperacional: 19.97       // (115840 ÷ 580000) × 100
};
```

## 🎯 IMPLEMENTAÇÃO NO SISTEMA

### **1. Schema Atualizado**
```prisma
model CattlePurchase {
  // ... campos existentes ...
  
  // Ajustes físicos (informativo)
  weightBreakPercentage Float?  // % de quebra
  actualReceivedWeight  Float?  // Peso após quebra
  
  // Mortalidade (valores monetários)
  mortalityCosts       Json?    // Detalhamento das mortes
  
  // Estrutura do JSON mortalityCosts:
  // {
  //   transport: { qty: 1, unitCost: 3360, total: 3360 },
  //   confinement: { qty: 2, unitCost: 4500, total: 9000 },
  //   total: 12360
  // }
}

// Nova tabela para registro detalhado
model MortalityRecord {
  id                String   @id @default(cuid())
  cattlePurchaseId  String
  phase             String   // 'transport' | 'reception' | 'confinement'
  quantity          Int
  deathDate         DateTime
  averageWeight     Float?
  unitCost          Float    // Custo médio por animal no momento
  totalLoss         Float    // quantity × unitCost
  cause             String?
  notes             String?
  
  cattlePurchase    CattlePurchase @relation(fields: [cattlePurchaseId], references: [id])
  
  @@map("mortality_records")
}
```

### **2. Serviço de Cálculo**
```typescript
class MortalityService {
  // Registrar morte com cálculo automático do custo
  async registerMortality(data: {
    cattlePurchaseId: string,
    phase: 'transport' | 'confinement',
    quantity: number,
    deathDate: Date,
    cause?: string
  }) {
    const lot = await this.getLotWithCosts(data.cattlePurchaseId);
    
    // Calcular custo médio do animal no momento da morte
    const unitCost = this.calculateUnitCost(lot, data.phase);
    const totalLoss = data.quantity * unitCost;
    
    // 1. Criar registro de mortalidade
    const mortality = await prisma.mortalityRecord.create({
      data: {
        ...data,
        unitCost,
        totalLoss
      }
    });
    
    // 2. Criar despesa no sistema financeiro
    await prisma.expense.create({
      data: {
        category: 'mortality',  // Nova categoria
        description: `Mortalidade - ${data.quantity} animal(is) - ${data.phase}`,
        amount: totalLoss,
        dueDate: data.deathDate,
        paymentDate: data.deathDate, // Perda imediata
        isPaid: true,
        cattlePurchaseId: data.cattlePurchaseId
      }
    });
    
    // 3. Atualizar quantidade do lote
    await prisma.cattlePurchase.update({
      where: { id: data.cattlePurchaseId },
      data: {
        currentQuantity: { decrement: data.quantity },
        deathCount: { increment: data.quantity }
      }
    });
    
    return mortality;
  }
  
  private calculateUnitCost(lot: CattlePurchase, phase: string): number {
    if (phase === 'transport') {
      // Custo = apenas valor de compra + frete rateado
      return (lot.purchaseValue + lot.freightCost) / lot.initialQuantity;
    } else {
      // Custo = valor acumulado até o momento
      const totalInvested = lot.totalCost || lot.purchaseValue;
      return totalInvested / lot.currentQuantity;
    }
  }
}
```

### **3. Interface Clara**
```typescript
const MortalityCard = ({ lot }: { lot: CattlePurchase }) => {
  const mortalityData = lot.mortalityCosts || {};
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Skull className="h-4 w-4" />
          Controle de Mortalidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mortalidade no Transporte */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Transporte:</span>
          <span>
            {mortalityData.transport?.qty || 0} animais
            {mortalityData.transport?.total && (
              <span className="text-red-600 ml-2">
                (-R$ {mortalityData.transport.total.toLocaleString()})
              </span>
            )}
          </span>
        </div>
        
        {/* Mortalidade no Confinamento */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Confinamento:</span>
          <span>
            {mortalityData.confinement?.qty || 0} animais
            {mortalityData.confinement?.total && (
              <span className="text-red-600 ml-2">
                (-R$ {mortalityData.confinement.total.toLocaleString()})
              </span>
            )}
          </span>
        </div>
        
        <Separator />
        
        {/* Total de Perdas */}
        <div className="flex justify-between font-bold">
          <span>Perda Total:</span>
          <span className="text-red-600">
            R$ {(mortalityData.total || 0).toLocaleString()}
          </span>
        </div>
        
        {/* Taxa de Mortalidade */}
        <div className="text-xs text-gray-500">
          Taxa: {((lot.deathCount / lot.initialQuantity) * 100).toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  );
};
```

## ✅ RESUMO DOS PARÂMETROS

| Aspecto | Quebra de Peso | Mortalidade |
|---------|---------------|-------------|
| **Natureza** | Ajuste físico | Perda financeira |
| **Tipo** | Informativo | Custo/Despesa |
| **Lançamento** | Não entra no DRE | Entra no DRE |
| **Categoria** | - | "MORTES" |
| **Impacto** | Altera peso médio | Reduz quantidade e gera custo |
| **Registro** | weightBreakPercentage | MortalityRecord + Expense |

## 🎯 VANTAGENS DESTE MODELO

1. **Clareza Contábil**: Separa ajustes físicos de custos reais
2. **Rastreabilidade**: Cada morte é registrada com seu custo
3. **Precisão no DRE**: Mortes aparecem como linha separada
4. **Gestão**: Permite análise de taxa de mortalidade por fase
5. **Conformidade**: Segue princípios contábeis corretos

Este modelo está **contabilmente correto** e permite gestão precisa das perdas!