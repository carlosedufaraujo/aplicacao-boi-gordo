# 💰 Modelo de Gestão Financeira por Lotes - BoviControl

## 🎯 Filosofia do Sistema

### **Fluxo Operacional Real:**
```
LOTE (Compra) → ALOCAÇÃO (Currais) → CONSOLIDAÇÃO (Relatórios)
```

### **Princípios Fundamentais:**
1. **LOTE = Unidade Financeira**: Todos os custos e receitas são atribuídos ao lote
2. **CURRAL = Local Físico**: Apenas para controle operacional e intervenções
3. **RATEIO PROPORCIONAL**: Custos comuns distribuídos por peso/quantidade
4. **RASTREABILIDADE TOTAL**: Todo centavo é rastreável ao lote origem

## 📊 Estrutura do Modelo Financeiro

### **1. Estados Simplificados + Controle Financeiro**
```typescript
enum PurchaseStatus {
  CONFIRMED,  // ✅ Custos: Aquisição, Frete, Comissão
  RECEIVED,   // 📦 + Custos: Recepção, Pesagem, Mortalidade Transporte
  CONFINED    // 🏠 + Custos: Ração, Mão de Obra, Medicamentos, Operacionais
  // SOLD: Receita final - Análise de resultado
}
```

### **2. Estrutura de Custos por Estágio**

#### **A) CUSTOS DE AQUISIÇÃO (CONFIRMED)**
```typescript
interface AquisitionCosts {
  // Custos diretos do lote
  purchaseValue: number;      // Valor pago pelos animais
  brokerCommission: number;   // Comissão do corretor
  freightCost: number;        // Frete até o confinamento
  transportInsurance: number; // Seguro transporte
  
  // Custos indiretos rateados
  buyingTripCosts: number;    // Viagem de compra (rateado)
  documentationFees: number;  // GTA, exames (rateado)
  
  // Total automático
  totalAquisitionCost: number;
}
```

#### **B) CUSTOS DE RECEPÇÃO (RECEIVED)**
```typescript
interface ReceptionCosts {
  // Perdas e ajustes
  transportMortality: {
    quantity: number;
    estimatedLoss: number;    // Valor da perda
  };
  weightBreak: {
    percentage: number;       // % quebra de peso
    financialImpact: number;  // Impacto financeiro
  };
  
  // Custos operacionais (rateados)
  receptionLabor: number;     // Mão de obra recepção
  veterinaryInspection: number;
  scalingCosts: number;       // Custos de pesagem
  
  totalReceptionCost: number;
}
```

#### **C) CUSTOS DE CONFINAMENTO (CONFINED)**
```typescript
interface ConfinementCosts {
  // Custos diretos por período
  feedCosts: {
    daily: number;            // Custo diário de ração
    accumulated: number;      // Acumulado até hoje
    projected: number;        // Projeção até venda
  };
  
  // Custos de saúde
  healthInterventions: {
    vaccines: number;
    medications: number;
    treatments: number;
  };
  
  // Custos operacionais rateados
  laborCosts: {
    daily: number;           // Mão de obra diária
    accumulated: number;
  };
  
  infrastructureCosts: {
    daily: number;           // Depreciação, manutenção
    accumulated: number;
  };
  
  totalConfinementCost: number;
}
```

### **3. Sistema de Rateio Inteligente**

#### **Rateio por Peso Vivo:**
```typescript
interface CostAllocation {
  lotId: string;
  currentWeight: number;      // Peso atual do lote
  totalFarmWeight: number;    // Peso total da fazenda
  allocationPercentage: number; // % para este lote
  
  // Custos rateados
  dailyFeedCost: number;      // Ração proporcional
  dailyLaborCost: number;     // Mão de obra proporcional
  dailyInfraCost: number;     // Infraestrutura proporcional
}

// Exemplo de cálculo automático
function calculateDailyCosts(lot: CattlePurchase, farmTotals: FarmTotals) {
  const weightPercentage = lot.currentWeight / farmTotals.totalWeight;
  
  return {
    feedCost: farmTotals.dailyFeedCost * weightPercentage,
    laborCost: farmTotals.dailyLaborCost * weightPercentage,
    infraCost: farmTotals.dailyInfraCost * weightPercentage
  };
}
```

### **4. Modelo de Receitas e Resultado**

#### **Receita Final:**
```typescript
interface SaleRevenue {
  lotId: string;
  saleDate: Date;
  
  // Dados da venda
  soldQuantity: number;
  soldWeight: number;
  pricePerKg: number;
  grossRevenue: number;
  
  // Deduções
  slaughterFees: number;      // Taxa do frigorífico
  transportToSlaughter: number;
  salesCommission: number;
  taxes: number;
  
  netRevenue: number;         // Receita líquida
}
```

#### **Análise de Resultado por Lote:**
```typescript
interface LotProfitability {
  lotId: string;
  lotCode: string;
  
  // CUSTOS TOTAIS
  totalCosts: {
    aquisition: number;       // Compra + frete + comissão
    reception: number;        // Recepção + perdas
    confinement: number;      // Ração + mão obra + medicamentos
    total: number;           // Soma de todos
  };
  
  // RECEITAS
  totalRevenue: {
    gross: number;            // Receita bruta
    net: number;             // Receita líquida
  };
  
  // RESULTADO
  result: {
    profit: number;           // Lucro/Prejuízo (R$)
    profitPerKg: number;      // Lucro por kg (R$/kg)
    profitPerAnimal: number;  // Lucro por animal (R$/animal)
    roi: number;             // Retorno sobre investimento (%)
    marginPercentage: number; // Margem de lucro (%)
  };
  
  // MÉTRICAS OPERACIONAIS
  metrics: {
    daysInConfinement: number;
    totalWeightGain: number;
    averageGMD: number;       // Ganho médio diário
    feedConversion: number;   // Conversão alimentar
    mortalityRate: number;    // Taxa de mortalidade
  };
}
```

## 🏗️ Implementação Técnica

### **1. Modelo de Dados Estendido**
```typescript
model CattlePurchase {
  id: string;
  lotCode: string;
  status: PurchaseStatus;
  
  // CUSTOS ESTRUTURADOS
  aquisitionCosts: AquisitionCosts;     // JSON estruturado
  receptionCosts: ReceptionCosts;       // JSON estruturado  
  confinementCosts: ConfinementCosts;   // JSON estruturado
  
  // CONTROLE FINANCEIRO
  currentTotalCost: number;             // Calculado automaticamente
  projectedTotalCost: number;           // Projeção até venda
  costPerKg: number;                   // Custo por kg atual
  costPerAnimal: number;               // Custo por animal
  
  // RECEITAS (quando vendido)
  saleRevenue?: SaleRevenue;
  profitability?: LotProfitability;
  
  // Relacionamentos mantidos
  penAllocations: LotPenLink[];
  costAllocations: CostAllocation[];    // Rateios diários
}

// NOVA: Tabela de rateios diários automáticos
model DailyCostAllocation {
  id: string;
  date: Date;
  lotId: string;
  
  // Dados do lote no dia
  currentWeight: number;
  currentQuantity: number;
  
  // Rateios do dia
  feedCost: number;
  laborCost: number;
  infraCost: number;
  healthCost: number;
  
  totalDailyCost: number;
  
  @@index([date, lotId])
}
```

### **2. Serviços de Cálculo Automático**
```typescript
class FinancialCalculationService {
  
  // Executar diariamente (cron job)
  async calculateDailyCosts(date: Date) {
    const activeLots = await this.getActiveLots(date);
    const farmTotals = await this.getFarmTotals(date);
    
    for (const lot of activeLots) {
      const allocation = this.calculateCostAllocation(lot, farmTotals);
      
      await this.saveDailyCostAllocation({
        date,
        lotId: lot.id,
        ...allocation
      });
      
      // Atualizar custo total do lote
      await this.updateLotTotalCost(lot.id);
    }
  }
  
  // Calcular resultado quando vendido
  async calculateProfitability(lotId: string): Promise<LotProfitability> {
    const lot = await this.getLotWithAllCosts(lotId);
    const sale = await this.getSaleData(lotId);
    
    return {
      lotId,
      totalCosts: this.sumAllCosts(lot),
      totalRevenue: sale.netRevenue,
      result: this.calculateResult(totalCosts, totalRevenue),
      metrics: this.calculateMetrics(lot)
    };
  }
}
```

### **3. Interface de Gestão Financeira**
```typescript
// Dashboard financeiro por lote
const LotFinancialDashboard = ({ lotId }: Props) => {
  const { lot, costs, projections } = useLotFinancials(lotId);
  
  return (
    <div className="financial-dashboard">
      {/* Resumo de custos */}
      <CostBreakdown 
        aquisition={costs.aquisition}
        reception={costs.reception}
        confinement={costs.confinement}
      />
      
      {/* Projeções */}
      <ProjectionCards 
        currentCost={costs.total}
        projectedCost={projections.totalCost}
        projectedRevenue={projections.revenue}
        projectedProfit={projections.profit}
      />
      
      {/* Gráficos temporais */}
      <CostEvolutionChart lotId={lotId} />
    </div>
  );
};
```

## 📊 Relatórios de Gestão

### **1. Dashboard Executivo**
```typescript
interface ExecutiveDashboard {
  period: DateRange;
  
  // VISÃO GERAL
  overview: {
    activeLots: number;
    totalAnimals: number;
    totalInvestment: number;
    projectedProfit: number;
  };
  
  // POR STATUS
  byStatus: {
    confirmed: { lots: number; investment: number };
    received: { lots: number; investment: number };
    confined: { lots: number; investment: number };
  };
  
  // PERFORMANCE
  performance: {
    averageGMD: number;
    averageFeedConversion: number;
    mortalityRate: number;
    profitMargin: number;
  };
}
```

### **2. Relatório de Resultado por Lote**
```typescript
const ProfitabilityReport = () => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Lote</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Dias Confinamento</TableCell>
          <TableCell>Custo Total</TableCell>
          <TableCell>Receita</TableCell>
          <TableCell>Lucro (R$)</TableCell>
          <TableCell>Margem (%)</TableCell>
          <TableCell>ROI</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lots.map(lot => (
          <TableRow key={lot.id}>
            <TableCell>{lot.lotCode}</TableCell>
            <TableCell><StatusBadge status={lot.status} /></TableCell>
            <TableCell>{lot.daysInConfinement}</TableCell>
            <TableCell>{formatCurrency(lot.totalCost)}</TableCell>
            <TableCell>{formatCurrency(lot.revenue)}</TableCell>
            <TableCell className={lot.profit > 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(lot.profit)}
            </TableCell>
            <TableCell>{lot.marginPercentage.toFixed(2)}%</TableCell>
            <TableCell>{lot.roi.toFixed(2)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

## 🎯 Vantagens do Modelo

### ✅ **Operacionais:**
- **Rastreabilidade**: Todo custo é rastreável ao lote
- **Automação**: Cálculos diários automáticos
- **Flexibilidade**: Rateios proporcionais inteligentes
- **Precisão**: Custos reais, não estimativas

### ✅ **Gerenciais:**
- **Visibilidade**: ROI por lote em tempo real
- **Comparação**: Performance entre lotes
- **Projeção**: Resultado estimado antes da venda
- **Tomada de decisão**: Dados confiáveis para estratégia

### ✅ **Financeiras:**
- **DRE Preciso**: Receitas e custos corretos
- **Margem Real**: Por lote, não estimativa global
- **Cash Flow**: Projeção de fluxo de caixa
- **Rentabilidade**: ROI por investimento

## 🚀 Implementação Sugerida

### **Fase 1: Base de Dados (4h)**
- [ ] Estender modelo CattlePurchase com custos estruturados
- [ ] Criar tabela DailyCostAllocation
- [ ] Implementar triggers de cálculo automático

### **Fase 2: Serviços Financeiros (6h)**
- [ ] FinancialCalculationService
- [ ] Job de cálculo diário
- [ ] APIs de consulta financeira

### **Fase 3: Interface Financeira (8h)**
- [ ] Dashboard financeiro por lote
- [ ] Relatórios de resultado
- [ ] Gráficos de evolução de custos

### **Fase 4: Relatórios Executivos (4h)**
- [ ] Dashboard executivo
- [ ] Exportação para Excel/PDF
- [ ] Alertas de performance

**Total: ~22 horas** para sistema financeiro completo

---

Este modelo mantém a **simplicidade operacional** dos 3 status principais, mas adiciona **robustez financeira** total. Cada lote vira uma unidade de negócio completa e rastreável.

**Resultado**: Você terá o DRE mais preciso possível, com lucro real por lote, ROI por investimento e projeções confiáveis para tomada de decisão.