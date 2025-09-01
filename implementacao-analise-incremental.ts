// 🚀 IMPLEMENTAÇÃO INCREMENTAL - Sistema de Análise Robusto
// 
// FASE 1: Estrutura de dados (2 dias)
// FASE 2: Serviços de análise (3 dias)  
// FASE 3: Relatórios e dashboards (3 dias)

// =====================================
// FASE 1: MODELOS E PERSISTÊNCIA
// =====================================

// 1.1 - Migration para novas tabelas
const migration = `
-- Tabela de análise de quebra de peso
CREATE TABLE weight_break_analysis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_purchase_id TEXT NOT NULL REFERENCES cattle_purchases(id),
  vendor_id TEXT NOT NULL REFERENCES partners(id),
  
  -- Origem
  vendor_city TEXT,
  vendor_state TEXT,
  vendor_region TEXT,
  
  -- Transporte
  transport_distance FLOAT,
  transport_duration FLOAT,
  transport_company TEXT,
  season TEXT,
  
  -- Métricas
  purchase_weight FLOAT NOT NULL,
  received_weight FLOAT NOT NULL,
  weight_lost FLOAT NOT NULL,
  break_percentage FLOAT NOT NULL,
  
  -- Animais
  animal_type TEXT,
  average_age INTEGER,
  average_weight FLOAT,
  
  -- Timestamps
  purchase_date TIMESTAMP NOT NULL,
  reception_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_weight_break_state ON weight_break_analysis(vendor_state, break_percentage);
CREATE INDEX idx_weight_break_season ON weight_break_analysis(season, break_percentage);
CREATE INDEX idx_weight_break_distance ON weight_break_analysis(transport_distance);

-- Tabela de análise de mortalidade
CREATE TABLE mortality_analysis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_purchase_id TEXT NOT NULL REFERENCES cattle_purchases(id),
  
  -- Classificação
  phase TEXT NOT NULL,
  day_in_confinement INTEGER,
  
  -- Dados
  quantity INTEGER NOT NULL,
  average_weight FLOAT,
  
  -- Causa
  primary_cause TEXT NOT NULL,
  specific_cause TEXT,
  had_veterinary BOOLEAN DEFAULT FALSE,
  
  -- Custos (PREJUÍZO)
  animal_cost FLOAT NOT NULL,
  treatment_cost FLOAT DEFAULT 0,
  total_loss FLOAT NOT NULL,
  
  -- Contexto
  pen_id TEXT REFERENCES pens(id),
  weather_condition TEXT,
  
  death_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_mortality_phase ON mortality_analysis(phase, primary_cause);
CREATE INDEX idx_mortality_date ON mortality_analysis(cattle_purchase_id, death_date);
`;

// 1.2 - Serviço para registrar quebra de peso
class WeightBreakRegistrationService {
  async registerWeightBreak(
    purchaseId: string,
    receptionData: {
      receivedWeight: number;
      receivedDate: Date;
    }
  ) {
    // Buscar dados da compra
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: purchaseId },
      include: { vendor: true }
    });
    
    if (!purchase) throw new Error('Compra não encontrada');
    
    // Calcular quebra
    const weightLost = purchase.purchaseWeight - receptionData.receivedWeight;
    const breakPercentage = (weightLost / purchase.purchaseWeight) * 100;
    
    // Determinar região
    const region = this.getRegionFromState(purchase.vendor.state);
    
    // Calcular distância e duração
    const transportData = await this.calculateTransportMetrics(
      purchase.vendor.city,
      purchase.vendor.state
    );
    
    // Registrar análise
    const analysis = await prisma.weightBreakAnalysis.create({
      data: {
        cattlePurchaseId: purchaseId,
        vendorId: purchase.vendorId,
        vendorCity: purchase.vendor.city,
        vendorState: purchase.vendor.state,
        vendorRegion: region,
        
        transportDistance: transportData.distance,
        transportDuration: transportData.duration,
        transportCompany: purchase.transportCompanyId,
        season: this.getCurrentSeason(),
        
        purchaseWeight: purchase.purchaseWeight,
        receivedWeight: receptionData.receivedWeight,
        weightLost,
        breakPercentage,
        
        animalType: purchase.animalType,
        averageAge: purchase.estimatedAge,
        averageWeight: purchase.purchaseWeight / purchase.initialQuantity,
        
        purchaseDate: purchase.purchaseDate,
        receptionDate: receptionData.receivedDate
      }
    });
    
    // Atualizar compra com quebra (informativo)
    await prisma.cattlePurchase.update({
      where: { id: purchaseId },
      data: {
        receivedWeight: receptionData.receivedWeight,
        weightBreakPercentage: breakPercentage
      }
    });
    
    console.log(`✅ Quebra registrada: ${breakPercentage.toFixed(2)}% (${weightLost}kg)`);
    
    return analysis;
  }
  
  private getRegionFromState(state: string): string {
    const regions = {
      'AC,AP,AM,PA,RO,RR,TO': 'Norte',
      'AL,BA,CE,MA,PB,PE,PI,RN,SE': 'Nordeste',
      'DF,GO,MT,MS': 'Centro-Oeste',
      'ES,MG,RJ,SP': 'Sudeste',
      'PR,RS,SC': 'Sul'
    };
    
    for (const [states, region] of Object.entries(regions)) {
      if (states.includes(state)) return region;
    }
    return 'Desconhecido';
  }
  
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'Outono';
    if (month >= 6 && month <= 8) return 'Inverno';
    if (month >= 9 && month <= 11) return 'Primavera';
    return 'Verão';
  }
}

// 1.3 - Serviço para registrar mortalidade
class MortalityRegistrationService {
  async registerMortality(data: {
    purchaseId: string;
    quantity: number;
    phase: 'transport' | 'reception' | 'adaptation' | 'confinement';
    cause: string;
    specificCause?: string;
    penId?: string;
    treatmentCost?: number;
  }) {
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: data.purchaseId }
    });
    
    if (!purchase) throw new Error('Compra não encontrada');
    
    // Calcular custo do animal baseado na fase
    const animalCost = this.calculateAnimalCost(purchase, data.phase);
    const totalLoss = (animalCost * data.quantity) + (data.treatmentCost || 0);
    
    // Registrar análise de mortalidade
    const mortality = await prisma.mortalityAnalysis.create({
      data: {
        cattlePurchaseId: data.purchaseId,
        phase: data.phase,
        dayInConfinement: this.calculateDaysInConfinement(purchase, data.phase),
        quantity: data.quantity,
        averageWeight: purchase.averageWeight,
        primaryCause: data.cause,
        specificCause: data.specificCause,
        animalCost,
        treatmentCost: data.treatmentCost || 0,
        totalLoss,
        penId: data.penId,
        deathDate: new Date()
      }
    });
    
    // Criar lançamento de despesa (PREJUÍZO)
    await prisma.expense.create({
      data: {
        category: 'mortality',
        description: `Mortalidade - ${data.quantity} animal(is) - ${data.phase}`,
        amount: totalLoss,
        dueDate: new Date(),
        paymentDate: new Date(),
        isPaid: true,
        purchaseId: data.purchaseId,
        // Adicionar ao centro de custo de perdas
        costCenterId: await this.getLossCostCenterId()
      }
    });
    
    // Atualizar quantidade do lote
    await prisma.cattlePurchase.update({
      where: { id: data.purchaseId },
      data: {
        currentQuantity: { decrement: data.quantity },
        deathCount: { increment: data.quantity }
      }
    });
    
    console.log(`☠️ Mortalidade registrada: ${data.quantity} animais = R$ ${totalLoss.toLocaleString()} prejuízo`);
    
    return mortality;
  }
  
  private calculateAnimalCost(purchase: any, phase: string): number {
    const baseCost = purchase.purchaseValue / purchase.initialQuantity;
    
    if (phase === 'transport') {
      return baseCost + (purchase.freightCost / purchase.initialQuantity);
    }
    
    if (phase === 'confinement') {
      // Incluir custos acumulados de confinamento
      const totalCost = purchase.totalCost || purchase.purchaseValue;
      return totalCost / purchase.currentQuantity;
    }
    
    return baseCost;
  }
}

// =====================================
// FASE 2: SERVIÇOS DE ANÁLISE
// =====================================

// 2.1 - Análise de quebra por região
class RegionalAnalysisService {
  async analyzeWeightBreakByRegion(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = `
      SELECT 
        vendor_state as state,
        vendor_region as region,
        COUNT(*) as total_purchases,
        AVG(break_percentage) as avg_break,
        MIN(break_percentage) as min_break,
        MAX(break_percentage) as max_break,
        SUM(weight_lost) as total_weight_lost,
        AVG(transport_distance) as avg_distance
      FROM weight_break_analysis
      WHERE 1=1
        ${filters?.startDate ? `AND purchase_date >= '${filters.startDate.toISOString()}'` : ''}
        ${filters?.endDate ? `AND purchase_date <= '${filters.endDate.toISOString()}'` : ''}
      GROUP BY vendor_state, vendor_region
      ORDER BY avg_break ASC
    `;
    
    const results = await prisma.$queryRawUnsafe(query);
    
    return results.map((r: any) => ({
      state: r.state,
      region: r.region,
      metrics: {
        averageBreak: parseFloat(r.avg_break.toFixed(2)),
        minBreak: parseFloat(r.min_break.toFixed(2)),
        maxBreak: parseFloat(r.max_break.toFixed(2)),
        totalWeightLost: r.total_weight_lost,
        averageDistance: r.avg_distance
      },
      volume: {
        totalPurchases: r.total_purchases
      },
      classification: this.classifyRegion(r.avg_break),
      recommendations: this.getRegionRecommendations(r)
    }));
  }
  
  private classifyRegion(avgBreak: number): string {
    if (avgBreak < 1.5) return 'EXCELENTE';
    if (avgBreak < 2.0) return 'BOM';
    if (avgBreak < 2.5) return 'REGULAR';
    if (avgBreak < 3.0) return 'RUIM';
    return 'CRÍTICO';
  }
  
  private getRegionRecommendations(data: any): string[] {
    const recommendations = [];
    
    if (data.avg_break > 2.5) {
      recommendations.push('Considerar reduzir compras nesta região');
      recommendations.push('Negociar compensação pela quebra alta');
    }
    
    if (data.avg_distance > 500) {
      recommendations.push('Buscar fornecedores mais próximos');
      recommendations.push('Avaliar custo-benefício do frete longo');
    }
    
    if (data.avg_break < 1.5) {
      recommendations.push('Região preferencial - aumentar volume');
      recommendations.push('Estabelecer contratos de longo prazo');
    }
    
    return recommendations;
  }
}

// 2.2 - Análise de mortalidade e impacto financeiro
class MortalityAnalysisService {
  async analyzeMortalityImpact(cycleId?: string) {
    const baseQuery = cycleId 
      ? { cattlePurchase: { cycleId } }
      : {};
    
    // Análise por fase
    const byPhase = await prisma.mortalityAnalysis.groupBy({
      by: ['phase'],
      where: baseQuery,
      _sum: {
        quantity: true,
        totalLoss: true
      },
      _avg: {
        dayInConfinement: true
      }
    });
    
    // Análise por causa
    const byCause = await prisma.mortalityAnalysis.groupBy({
      by: ['primaryCause'],
      where: baseQuery,
      _sum: {
        quantity: true,
        totalLoss: true
      },
      _count: {
        id: true
      }
    });
    
    // Cálculo do impacto total
    const totalImpact = await prisma.mortalityAnalysis.aggregate({
      where: baseQuery,
      _sum: {
        quantity: true,
        totalLoss: true,
        treatmentCost: true
      }
    });
    
    // Calcular potencial de receita perdida
    const avgSellingPrice = 10.00; // R$/kg estimado
    const avgWeight = 500; // kg estimado na venda
    const potentialRevenue = totalImpact._sum.quantity * avgWeight * avgSellingPrice;
    
    return {
      byPhase: byPhase.map(p => ({
        phase: p.phase,
        deaths: p._sum.quantity,
        financialLoss: p._sum.totalLoss,
        avgDay: p._avg.dayInConfinement,
        critical: p.phase === 'adaptation' && p._avg.dayInConfinement <= 15
      })),
      
      byCause: byCause.map(c => ({
        cause: c.primaryCause,
        deaths: c._sum.quantity,
        occurrences: c._count.id,
        financialLoss: c._sum.totalLoss,
        preventable: this.isPreventable(c.primaryCause)
      })),
      
      totalImpact: {
        totalDeaths: totalImpact._sum.quantity,
        directLoss: totalImpact._sum.totalLoss,
        treatmentCosts: totalImpact._sum.treatmentCost,
        potentialRevenueLost: potentialRevenue,
        totalFinancialImpact: totalImpact._sum.totalLoss + potentialRevenue
      },
      
      recommendations: this.generateMortalityRecommendations(byPhase, byCause)
    };
  }
  
  private isPreventable(cause: string): boolean {
    const preventableCauses = ['pneumonia', 'timpanismo', 'acidose', 'stress'];
    return preventableCauses.includes(cause.toLowerCase());
  }
  
  private generateMortalityRecommendations(byPhase: any[], byCause: any[]): string[] {
    const recommendations = [];
    
    // Análise de fase crítica
    const adaptationPhase = byPhase.find(p => p.phase === 'adaptation');
    if (adaptationPhase && adaptationPhase.deaths > 5) {
      recommendations.push('Revisar protocolo de adaptação - alta mortalidade nos primeiros 15 dias');
      recommendations.push('Implementar monitoramento intensivo na chegada');
    }
    
    // Análise de causas preveníveis
    const preventableDeaths = byCause
      .filter(c => this.isPreventable(c.primaryCause))
      .reduce((sum, c) => sum + c.deaths, 0);
    
    if (preventableDeaths > 0) {
      recommendations.push(`${preventableDeaths} mortes poderiam ser evitadas com melhor manejo`);
      recommendations.push('Investir em treinamento da equipe de manejo sanitário');
    }
    
    return recommendations;
  }
}

// =====================================
// FASE 3: INTERFACE E RELATÓRIOS
// =====================================

// 3.1 - Hook para dashboard de análise
const useAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      
      try {
        const [weightBreak, mortality, insights] = await Promise.all([
          api.get('/analytics/weight-break/summary'),
          api.get('/analytics/mortality/summary'),
          api.get('/analytics/insights')
        ]);
        
        setData({
          weightBreak: weightBreak.data,
          mortality: mortality.data,
          insights: insights.data
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, []);
  
  return { data, loading };
};

// 3.2 - Dashboard component
const AnalyticsDashboard: React.FC = () => {
  const { data, loading } = useAnalyticsDashboard();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Quebra Média"
          value={`${data.weightBreak.average}%`}
          trend={data.weightBreak.trend}
          icon={<TrendingDown />}
        />
        <KPICard
          title="Mortalidade"
          value={`${data.mortality.rate}%`}
          subtitle={`${data.mortality.totalDeaths} animais`}
          icon={<AlertTriangle />}
        />
        <KPICard
          title="Prejuízo Total"
          value={`R$ ${data.mortality.totalLoss.toLocaleString()}`}
          subtitle="Últimos 30 dias"
          icon={<DollarSign />}
        />
        <KPICard
          title="Economia Potencial"
          value={`R$ ${data.insights.savingPotential.toLocaleString()}`}
          actionable={true}
          icon={<TrendingUp />}
        />
      </div>
      
      {/* Análise Regional */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Quebra por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <RegionalBreakdownChart data={data.weightBreak.byRegion} />
        </CardContent>
      </Card>
      
      {/* Insights Automáticos */}
      <InsightsPanel insights={data.insights.patterns} />
      
      {/* Relatório Customizado */}
      <CustomReportBuilder />
    </div>
  );
};

// 3.3 - Exportação de relatórios
class ReportExportService {
  async exportToExcel(reportType: string, filters: any) {
    const data = await this.getReportData(reportType, filters);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Análise');
    
    // Adicionar cabeçalhos
    worksheet.columns = this.getColumns(reportType);
    
    // Adicionar dados
    worksheet.addRows(data);
    
    // Estilizar
    worksheet.getRow(1).font = { bold: true };
    worksheet.autoFilter = 'A1:Z1';
    
    // Gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  
  async exportToPDF(reportType: string, filters: any) {
    const data = await this.getReportData(reportType, filters);
    
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text(this.getReportTitle(reportType), 20, 20);
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    
    // Tabela
    doc.autoTable({
      head: [this.getHeaders(reportType)],
      body: data,
      startY: 40
    });
    
    return doc.output('blob');
  }
}

export {
  WeightBreakRegistrationService,
  MortalityRegistrationService,
  RegionalAnalysisService,
  MortalityAnalysisService,
  AnalyticsDashboard,
  ReportExportService
};