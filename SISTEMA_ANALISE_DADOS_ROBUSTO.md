# 📊 Sistema Robusto de Análise de Dados - BoviControl

## 🎯 VISÃO GERAL: Inteligência de Negócios para Confinamento

### **Objetivos do Sistema:**
1. **Persistir** todos os dados de quebra de peso para análise
2. **Registrar** mortalidade como custo (prejuízo real)
3. **Analisar** padrões por região, fornecedor, peso, época
4. **Gerar** relatórios customizados e insights acionáveis

## 📐 ESTRUTURA DE DADOS ANALÍTICA

### **1. Modelo de Quebra de Peso (Análise Detalhada)**

```prisma
// Nova tabela para análise detalhada de quebra de peso
model WeightBreakAnalysis {
  id                String   @id @default(cuid())
  cattlePurchaseId  String
  
  // Dados da origem
  vendorId          String
  vendorCity        String
  vendorState       String
  vendorRegion      String   // Norte, Sul, Centro-Oeste, etc
  
  // Dados do transporte
  transportDistance Float    // km
  transportDuration Float    // horas
  transportCompany  String?
  season           String    // verão, inverno, etc
  
  // Métricas de quebra
  purchaseWeight    Float    // Peso na compra
  receivedWeight    Float    // Peso na recepção
  weightLost        Float    // kg perdidos
  breakPercentage   Float    // % de quebra
  
  // Dados dos animais
  animalType        String   // Nelore, Angus, etc
  averageAge        Int      // meses
  averageWeight     Float    // peso médio inicial
  
  // Condições
  weatherCondition  String?  // seco, chuvoso, etc
  roadCondition     String?  // asfalto, terra, misto
  
  // Timestamps
  purchaseDate      DateTime
  receptionDate     DateTime
  createdAt         DateTime @default(now())
  
  // Relacionamentos
  cattlePurchase    CattlePurchase @relation(fields: [cattlePurchaseId], references: [id])
  vendor            Partner @relation(fields: [vendorId], references: [id])
  
  @@index([vendorState, breakPercentage])
  @@index([season, breakPercentage])
  @@index([transportDistance, breakPercentage])
  @@map("weight_break_analysis")
}
```

### **2. Modelo de Mortalidade (Custo Detalhado)**

```prisma
model MortalityAnalysis {
  id                String   @id @default(cuid())
  cattlePurchaseId  String
  
  // Classificação da morte
  phase            String    // 'transport', 'reception', 'adaptation', 'confinement'
  dayInConfinement Int?      // Dia que ocorreu (se no confinamento)
  
  // Dados do animal
  quantity          Int
  averageWeight     Float?
  estimatedAge      Int?
  
  // Causa e análise
  primaryCause      String   // 'disease', 'accident', 'stress', 'unknown'
  specificCause     String?  // 'pneumonia', 'timpanismo', etc
  hadVeterinary     Boolean  @default(false)
  necropsyPerformed Boolean  @default(false)
  
  // Custos (PREJUÍZO)
  animalCost        Float    // Custo do animal até o momento
  treatmentCost     Float    @default(0) // Tentativa de tratamento
  totalLoss         Float    // Prejuízo total
  
  // Contexto
  weatherCondition  String?
  penId            String?
  feedType         String?
  
  // Timestamps
  deathDate        DateTime
  createdAt        DateTime @default(now())
  
  // Relacionamentos
  cattlePurchase   CattlePurchase @relation(fields: [cattlePurchaseId], references: [id])
  pen              Pen? @relation(fields: [penId], references: [id])
  
  @@index([phase, primaryCause])
  @@index([cattlePurchaseId, deathDate])
  @@map("mortality_analysis")
}
```

## 📊 SERVIÇOS DE ANÁLISE AVANÇADA

### **1. Serviço de Análise de Quebra de Peso**

```typescript
class WeightBreakAnalyticsService {
  
  // Análise por região
  async analyzeByRegion(filters?: {
    startDate?: Date,
    endDate?: Date,
    animalType?: string
  }) {
    const analysis = await prisma.weightBreakAnalysis.groupBy({
      by: ['vendorState', 'vendorRegion'],
      where: filters,
      _avg: {
        breakPercentage: true,
        weightLost: true,
        transportDistance: true
      },
      _count: {
        id: true
      },
      _sum: {
        weightLost: true
      }
    });
    
    return analysis.map(region => ({
      state: region.vendorState,
      region: region.vendorRegion,
      averageBreak: region._avg.breakPercentage,
      totalLots: region._count.id,
      totalWeightLost: region._sum.weightLost,
      averageDistance: region._avg.transportDistance,
      
      // Classificação
      risk: this.classifyRisk(region._avg.breakPercentage),
      recommendation: this.getRecommendation(region)
    }));
  }
  
  // Análise por peso de compra
  async analyzeByPurchaseWeight() {
    const ranges = [
      { min: 0, max: 350, label: 'Leve (< 350kg)' },
      { min: 350, max: 450, label: 'Médio (350-450kg)' },
      { min: 450, max: 550, label: 'Pesado (450-550kg)' },
      { min: 550, max: 9999, label: 'Muito Pesado (> 550kg)' }
    ];
    
    const analysis = [];
    
    for (const range of ranges) {
      const data = await prisma.weightBreakAnalysis.aggregate({
        where: {
          averageWeight: {
            gte: range.min,
            lt: range.max
          }
        },
        _avg: {
          breakPercentage: true,
          transportDistance: true
        },
        _count: {
          id: true
        }
      });
      
      analysis.push({
        weightRange: range.label,
        averageBreak: data._avg.breakPercentage || 0,
        sampleSize: data._count.id,
        insight: this.getWeightInsight(range, data._avg.breakPercentage)
      });
    }
    
    return analysis;
  }
  
  // Análise temporal (sazonal)
  async analyzeBySeasonality() {
    return await prisma.$queryRaw`
      SELECT 
        season,
        COUNT(*) as total_lots,
        AVG(break_percentage) as avg_break,
        MIN(break_percentage) as min_break,
        MAX(break_percentage) as max_break,
        STDDEV(break_percentage) as std_deviation,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY break_percentage) as median_break
      FROM weight_break_analysis
      GROUP BY season
      ORDER BY avg_break DESC
    `;
  }
  
  // Análise por fornecedor
  async analyzeByVendor(top: number = 10) {
    const vendors = await prisma.weightBreakAnalysis.groupBy({
      by: ['vendorId'],
      _avg: {
        breakPercentage: true
      },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gte: 3 // Mínimo 3 compras para relevância estatística
          }
        }
      },
      orderBy: {
        _avg: {
          breakPercentage: 'asc'
        }
      },
      take: top
    });
    
    // Enriquecer com dados do fornecedor
    return Promise.all(vendors.map(async v => {
      const vendor = await prisma.partner.findUnique({
        where: { id: v.vendorId }
      });
      
      return {
        vendor: vendor?.name,
        city: vendor?.city,
        state: vendor?.state,
        averageBreak: v._avg.breakPercentage,
        totalPurchases: v._count.id,
        rating: this.rateVendor(v._avg.breakPercentage)
      };
    }));
  }
  
  // Correlação múltipla
  async findCorrelations() {
    // Análise estatística avançada
    const correlations = await prisma.$queryRaw`
      WITH stats AS (
        SELECT
          transport_distance,
          break_percentage,
          average_weight,
          EXTRACT(hour FROM (reception_date - purchase_date)) as transport_hours
        FROM weight_break_analysis
      )
      SELECT
        CORR(transport_distance, break_percentage) as distance_correlation,
        CORR(average_weight, break_percentage) as weight_correlation,
        CORR(transport_hours, break_percentage) as time_correlation
      FROM stats
    `;
    
    return {
      insights: this.interpretCorrelations(correlations[0])
    };
  }
  
  private classifyRisk(breakPercentage: number): string {
    if (breakPercentage < 1.5) return 'BAIXO';
    if (breakPercentage < 2.5) return 'NORMAL';
    if (breakPercentage < 3.5) return 'ALTO';
    return 'CRÍTICO';
  }
}
```

### **2. Serviço de Análise de Mortalidade**

```typescript
class MortalityAnalyticsService {
  
  // Análise por fase do processo
  async analyzeByPhase(cycleId?: string) {
    const analysis = await prisma.mortalityAnalysis.groupBy({
      by: ['phase'],
      where: cycleId ? { cattlePurchase: { cycleId } } : undefined,
      _sum: {
        quantity: true,
        totalLoss: true
      },
      _avg: {
        dayInConfinement: true
      },
      _count: {
        id: true
      }
    });
    
    return analysis.map(phase => ({
      phase: phase.phase,
      totalDeaths: phase._sum.quantity,
      totalLoss: phase._sum.totalLoss,
      averageDayOfDeath: phase._avg.dayInConfinement,
      occurrences: phase._count.id,
      
      // Análise
      criticalPeriod: phase.phase === 'adaptation' && phase._avg.dayInConfinement <= 15,
      preventionStrategy: this.getSuggestions(phase)
    }));
  }
  
  // Análise por causa
  async analyzeByCause() {
    const causes = await prisma.$queryRaw`
      SELECT 
        primary_cause,
        specific_cause,
        COUNT(*) as occurrences,
        SUM(quantity) as total_deaths,
        SUM(total_loss) as financial_loss,
        AVG(CASE WHEN had_veterinary THEN 1 ELSE 0 END) * 100 as veterinary_rate,
        AVG(day_in_confinement) as avg_day
      FROM mortality_analysis
      GROUP BY primary_cause, specific_cause
      ORDER BY total_deaths DESC
    `;
    
    return causes.map(cause => ({
      ...cause,
      preventable: this.isPreventable(cause.primary_cause),
      recommendations: this.getPreventionMeasures(cause.primary_cause, cause.specific_cause)
    }));
  }
  
  // Taxa de mortalidade comparativa
  async compareMortalityRates() {
    const rates = await prisma.$queryRaw`
      WITH lot_mortality AS (
        SELECT 
          cp.id,
          cp.vendor_id,
          cp.initial_quantity,
          COALESCE(SUM(ma.quantity), 0) as total_deaths,
          (COALESCE(SUM(ma.quantity), 0)::float / cp.initial_quantity) * 100 as mortality_rate
        FROM cattle_purchases cp
        LEFT JOIN mortality_analysis ma ON ma.cattle_purchase_id = cp.id
        GROUP BY cp.id, cp.vendor_id, cp.initial_quantity
      )
      SELECT
        p.state,
        AVG(mortality_rate) as avg_mortality_rate,
        MIN(mortality_rate) as best_rate,
        MAX(mortality_rate) as worst_rate,
        COUNT(*) as total_lots
      FROM lot_mortality lm
      JOIN partners p ON p.id = lm.vendor_id
      GROUP BY p.state
      ORDER BY avg_mortality_rate ASC
    `;
    
    return {
      byState: rates,
      benchmark: await this.getIndustryBenchmark(),
      recommendations: this.getMortalityRecommendations(rates)
    };
  }
  
  // Impacto financeiro detalhado
  async calculateFinancialImpact(period: { start: Date, end: Date }) {
    const losses = await prisma.mortalityAnalysis.aggregate({
      where: {
        deathDate: {
          gte: period.start,
          lte: period.end
        }
      },
      _sum: {
        totalLoss: true,
        treatmentCost: true,
        quantity: true
      },
      _avg: {
        totalLoss: true
      }
    });
    
    // Calcular o que poderia ter sido a receita
    const potentialRevenue = losses._sum.quantity * await this.getAverageSellingPrice();
    
    return {
      directLoss: losses._sum.totalLoss,
      treatmentCosts: losses._sum.treatmentCost,
      totalLoss: losses._sum.totalLoss + losses._sum.treatmentCost,
      potentialRevenueLost: potentialRevenue,
      totalImpact: losses._sum.totalLoss + losses._sum.treatmentCost + potentialRevenue,
      
      // Métricas
      averageLossPerDeath: losses._avg.totalLoss,
      deathCount: losses._sum.quantity,
      
      // Comparações
      percentOfRevenue: (losses._sum.totalLoss / await this.getTotalRevenue(period)) * 100
    };
  }
}
```

## 📈 RELATÓRIOS CUSTOMIZADOS

### **1. Dashboard Executivo de Análise**

```typescript
interface ExecutiveAnalyticsDashboard {
  // KPIs Principais
  kpis: {
    averageWeightBreak: number;      // % média de quebra
    totalWeightLost: number;          // kg total perdido
    mortalityRate: number;            // % de mortalidade
    totalFinancialLoss: number;       // R$ prejuízo por mortes
  };
  
  // Rankings
  rankings: {
    bestRegions: RegionPerformance[];      // Top 5 regiões com menor quebra
    worstRegions: RegionPerformance[];     // Top 5 regiões com maior quebra
    bestVendors: VendorPerformance[];      // Top 10 fornecedores
    criticalPeriods: PeriodAnalysis[];     // Períodos críticos de mortalidade
  };
  
  // Insights Automáticos
  insights: {
    weightBreakPatterns: string[];         // Padrões identificados
    mortalityTrends: string[];             // Tendências de mortalidade
    costSavingOpportunities: Opportunity[]; // Oportunidades de economia
    riskAlerts: RiskAlert[];               // Alertas de risco
  };
  
  // Recomendações
  recommendations: {
    immediate: Action[];                   // Ações imediatas
    shortTerm: Action[];                   // 30 dias
    longTerm: Action[];                    // 90+ dias
  };
}
```

### **2. Relatório Detalhado por Região**

```typescript
class RegionalAnalysisReport {
  async generate(state: string, period: DateRange) {
    return {
      // Resumo da região
      summary: {
        state,
        totalPurchases: await this.countPurchases(state, period),
        totalVolume: await this.calculateVolume(state, period),
        averageDistance: await this.getAverageDistance(state)
      },
      
      // Análise de quebra de peso
      weightBreak: {
        average: await this.getAverageBreak(state),
        trend: await this.calculateTrend(state, period),
        seasonality: await this.getSeasonalPattern(state),
        
        // Comparação com outras regiões
        comparison: await this.compareWithOtherStates(state),
        ranking: await this.getStateRanking(state)
      },
      
      // Análise de mortalidade
      mortality: {
        rate: await this.getMortalityRate(state),
        causes: await this.getTopCauses(state),
        criticalPeriods: await this.getCriticalPeriods(state),
        financialImpact: await this.calculateLosses(state, period)
      },
      
      // Fornecedores da região
      vendors: {
        top10: await this.getTopVendors(state),
        performance: await this.vendorPerformanceMatrix(state),
        recommendations: await this.getVendorRecommendations(state)
      },
      
      // Insights específicos
      insights: await this.generateRegionalInsights(state),
      
      // Plano de ação
      actionPlan: await this.createRegionalActionPlan(state)
    };
  }
}
```

### **3. Relatório de Performance por Fornecedor**

```typescript
interface VendorPerformanceReport {
  vendor: {
    id: string;
    name: string;
    location: string;
    totalPurchases: number;
  };
  
  // Métricas de quebra
  weightMetrics: {
    averageBreak: number;
    consistency: number;        // Desvio padrão
    trend: 'improving' | 'stable' | 'worsening';
    vsAverage: number;          // Comparação com média geral
  };
  
  // Métricas de qualidade
  qualityMetrics: {
    mortalityRate: number;
    healthIssues: number;
    averageGMD: number;
    feedConversion: number;
  };
  
  // Análise financeira
  financial: {
    totalInvested: number;
    averageCostPerKg: number;
    profitability: number;
    roi: number;
  };
  
  // Score e classificação
  scoring: {
    overallScore: number;       // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    ranking: number;            // Posição entre todos fornecedores
    badges: string[];           // 'Consistente', 'Baixa Quebra', etc
  };
  
  // Recomendações
  recommendations: {
    continuePurchasing: boolean;
    suggestedVolume: string;
    negotiationPoints: string[];
    improvements: string[];
  };
}
```

## 🔍 CONSULTAS CUSTOMIZADAS

### **Interface de Consulta Avançada**

```typescript
class CustomQueryBuilder {
  private query: any = {};
  
  // Filtros encadeados
  byRegion(states: string[]) {
    this.query.vendorState = { in: states };
    return this;
  }
  
  byPeriod(start: Date, end: Date) {
    this.query.purchaseDate = { gte: start, lte: end };
    return this;
  }
  
  byWeightRange(min: number, max: number) {
    this.query.averageWeight = { gte: min, lte: max };
    return this;
  }
  
  byBreakThreshold(maxBreak: number) {
    this.query.breakPercentage = { lte: maxBreak };
    return this;
  }
  
  byTransportDistance(maxDistance: number) {
    this.query.transportDistance = { lte: maxDistance };
    return this;
  }
  
  // Agrupamentos
  groupBy(fields: string[]) {
    this.grouping = fields;
    return this;
  }
  
  // Execução
  async execute() {
    const results = await prisma.weightBreakAnalysis.findMany({
      where: this.query,
      include: {
        vendor: true,
        cattlePurchase: true
      }
    });
    
    if (this.grouping) {
      return this.applyGrouping(results);
    }
    
    return results;
  }
  
  // Exportação
  async exportToExcel() {
    const data = await this.execute();
    return ExcelService.generate(data);
  }
  
  async exportToPDF() {
    const data = await this.execute();
    return PDFService.generateReport(data);
  }
}

// Uso
const query = new CustomQueryBuilder()
  .byRegion(['MT', 'MS', 'GO'])
  .byPeriod(new Date('2024-01-01'), new Date('2024-12-31'))
  .byWeightRange(350, 450)
  .byBreakThreshold(2.5)
  .groupBy(['vendorState', 'season']);

const results = await query.execute();
```

## 🎯 INSIGHTS AUTOMÁTICOS

### **Sistema de Detecção de Padrões**

```typescript
class PatternDetectionService {
  
  async detectWeightBreakPatterns() {
    const patterns = [];
    
    // Padrão 1: Distância vs Quebra
    const distanceCorrelation = await this.analyzeDistanceImpact();
    if (distanceCorrelation.correlation > 0.7) {
      patterns.push({
        type: 'HIGH_CORRELATION',
        description: `Quebra aumenta ${distanceCorrelation.rate}% a cada 100km`,
        recommendation: 'Priorizar compras em raio de até 300km'
      });
    }
    
    // Padrão 2: Sazonalidade
    const seasonalPattern = await this.analyzeSeasonality();
    if (seasonalPattern.variation > 20) {
      patterns.push({
        type: 'SEASONAL',
        description: `Quebra ${seasonalPattern.highSeason}% maior no ${seasonalPattern.season}`,
        recommendation: `Aumentar compras em ${seasonalPattern.bestSeason}`
      });
    }
    
    // Padrão 3: Peso ideal
    const weightPattern = await this.analyzeOptimalWeight();
    patterns.push({
      type: 'OPTIMAL_WEIGHT',
      description: `Animais de ${weightPattern.optimalRange} apresentam menor quebra`,
      recommendation: `Focar em animais de ${weightPattern.optimalRange}`
    });
    
    return patterns;
  }
  
  async detectMortalityPatterns() {
    // Análise similar para mortalidade
    const patterns = [];
    
    // Período crítico
    const criticalPeriod = await this.findCriticalPeriod();
    if (criticalPeriod.found) {
      patterns.push({
        type: 'CRITICAL_PERIOD',
        description: `${criticalPeriod.percentage}% das mortes ocorrem nos primeiros ${criticalPeriod.days} dias`,
        recommendation: 'Intensificar monitoramento na fase de adaptação'
      });
    }
    
    return patterns;
  }
  
  async generateActionableInsights() {
    const insights = [];
    
    // Análise de economia potencial
    const savingOpportunity = await this.calculateSavingPotential();
    if (savingOpportunity.amount > 100000) {
      insights.push({
        priority: 'HIGH',
        insight: `Potencial de economia de R$ ${savingOpportunity.amount.toLocaleString()}`,
        action: savingOpportunity.actions,
        expectedROI: savingOpportunity.roi
      });
    }
    
    return insights;
  }
}
```

## 📱 INTERFACE DE VISUALIZAÇÃO

```typescript
// Dashboard de Análise
const AnalyticsDashboard = () => {
  const { data: weightBreak } = useWeightBreakAnalysis();
  const { data: mortality } = useMortalityAnalysis();
  const { insights } = usePatternDetection();
  
  return (
    <div className="analytics-dashboard">
      {/* KPIs Principais */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Quebra Média"
          value={`${weightBreak.average}%`}
          trend={weightBreak.trend}
          color={getColorByValue(weightBreak.average)}
        />
        <KPICard
          title="Taxa Mortalidade"
          value={`${mortality.rate}%`}
          trend={mortality.trend}
          color={getColorByValue(mortality.rate)}
        />
        <KPICard
          title="Prejuízo Total"
          value={`R$ ${mortality.totalLoss.toLocaleString()}`}
          subtitle="Últimos 30 dias"
        />
        <KPICard
          title="Economia Potencial"
          value={`R$ ${insights.savingPotential.toLocaleString()}`}
          actionable={true}
        />
      </div>
      
      {/* Gráficos Interativos */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <WeightBreakByRegionChart data={weightBreak.byRegion} />
        <MortalityTimelineChart data={mortality.timeline} />
        <VendorPerformanceMatrix data={weightBreak.vendors} />
        <CostImpactAnalysis data={mortality.financial} />
      </div>
      
      {/* Insights Automáticos */}
      <InsightsPanel insights={insights} />
      
      {/* Relatórios Customizados */}
      <CustomReportBuilder />
    </div>
  );
};
```

## ✅ VANTAGENS DO SISTEMA

1. **Rastreabilidade Total**: Cada kg perdido e cada morte registrada
2. **Análise Profunda**: Correlações, padrões, tendências
3. **Insights Acionáveis**: Recomendações práticas baseadas em dados
4. **Flexibilidade**: Relatórios totalmente customizáveis
5. **ROI Mensurável**: Identifica oportunidades de economia
6. **Benchmarking**: Compara com médias do mercado
7. **Predição**: Antecipa problemas baseado em padrões

Este sistema transforma dados em **inteligência de negócio real**!