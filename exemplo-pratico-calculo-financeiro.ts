// 💰 Exemplo Prático: Cálculo Financeiro de Lote
// 
// CENÁRIO REAL: 
// - Lote com 100 animais, 45.000kg
// - Confinamento com outros lotes (200.000kg total na fazenda)
// - Custos operacionais diários rateados proporcionalmente

interface LoteExemplo {
  id: 'LOT-001';
  lotCode: 'BOI-2025-001';
  status: 'CONFINED';
  
  // Dados físicos
  initialQuantity: 100;
  currentQuantity: 99; // 1 morte
  initialWeight: 42000; // 42 ton (420kg/animal)
  currentWeight: 45000; // 45 ton após ganho
  daysInConfinement: 45;
  
  // Custos estruturados por fase
  costs: {
    // FASE 1: AQUISIÇÃO (R$ 378.000)
    aquisition: {
      purchaseValue: 336000,      // R$ 8,00/kg × 42.000kg
      brokerCommission: 16800,    // 5% sobre compra
      freightCost: 21000,         // R$ 0,50/kg × 42.000kg  
      documentation: 4200,        // GTA, exames
      total: 378000
    };
    
    // FASE 2: RECEPÇÃO (R$ 8.400)
    reception: {
      transportMortality: {
        quantity: 1,
        estimatedValue: 3360      // 1 animal × R$ 3.360
      },
      weightBreak: {
        percentage: 2.0,          // 2% de quebra
        lostWeight: 840,          // kg perdidos
        financialImpact: 6720     // R$ 8,00/kg × 840kg
      },
      operationalCosts: 320,      // Mão obra recepção
      total: 8400  // (Perda registrada, não custo adicional)
    };
    
    // FASE 3: CONFINAMENTO (R$ 67.500 até hoje)
    confinement: {
      // Ração (custo direto por peso)
      feed: {
        dailyConsumption: 1350,   // 3% peso vivo = 45.000kg × 3% = 1.350kg/dia
        feedPrice: 0.85,          // R$ 0,85/kg de ração
        dailyCost: 1147.50,       // 1.350kg × R$ 0,85
        accumulatedCost: 51637.50 // 45 dias × R$ 1.147,50
      },
      
      // Custos rateados por peso vivo
      proportionalCosts: {
        farmTotalWeight: 200000,  // 200 ton total na fazenda
        lotPercentage: 22.5,      // 45.000kg ÷ 200.000kg = 22,5%
        
        dailyRates: {
          labor: 2000,            // R$ 2.000 mão obra total/dia
          infrastructure: 1000,    // R$ 1.000 infraestrutura/dia
          veterinary: 500,        // R$ 500 veterinário/dia
          total: 3500             // Total fazenda/dia
        },
        
        lotDailyShare: 787.50,    // R$ 3.500 × 22,5% = R$ 787,50
        accumulated: 35437.50     // 45 dias × R$ 787,50
      },
      
      // Saúde (custos específicos do lote)
      health: {
        vaccines: 2000,           // Vacinas aplicadas
        medications: 800,         // Medicamentos
        treatments: 200,          // Tratamentos individuais
        total: 3000
      },
      
      total: 90075  // Ração + Proporcionais + Saúde
    };
    
    grandTotal: 476475  // R$ 378.000 + R$ 8.400 + R$ 90.075
  };
}

// Serviço de cálculo automático
class FinancialCalculationService {
  
  // Executado diariamente às 23:00
  async calculateDailyCosts(date: Date = new Date()) {
    console.log(`🔄 Calculando custos diários para ${date.toISOString().split('T')[0]}`);
    
    // 1. Buscar lotes ativos
    const activeLots = await this.prisma.cattlePurchase.findMany({
      where: { status: 'CONFINED' },
      include: { penAllocations: { include: { pen: true } } }
    });
    
    // 2. Calcular totais da fazenda
    const farmTotals = await this.calculateFarmTotals(date);
    console.log(`📊 Totais da fazenda: ${farmTotals.totalWeight}kg, R$ ${farmTotals.dailyOperationalCost}`);
    
    // 3. Processar cada lote
    for (const lot of activeLots) {
      const allocation = await this.calculateLotDailyCost(lot, farmTotals, date);
      
      // Salvar rateio do dia
      await this.prisma.dailyCostAllocation.create({
        data: {
          date,
          lotId: lot.id,
          currentWeight: lot.currentWeight,
          currentQuantity: lot.currentQuantity,
          
          // Custos do dia
          feedCost: allocation.feedCost,
          laborCost: allocation.laborCost,
          infraCost: allocation.infraCost,
          healthCost: allocation.healthCost,
          totalDailyCost: allocation.total
        }
      });
      
      // Atualizar custo acumulado do lote
      await this.updateLotAccumulatedCost(lot.id);
      
      console.log(`✅ Lote ${lot.lotCode}: R$ ${allocation.total} (${allocation.percentage.toFixed(1)}% da fazenda)`);
    }
  }
  
  private async calculateLotDailyCost(
    lot: CattlePurchase, 
    farmTotals: FarmTotals, 
    date: Date
  ) {
    // Percentual do lote na fazenda (por peso vivo)
    const percentage = (lot.currentWeight / farmTotals.totalWeight) * 100;
    
    // Ração (custo direto baseado no peso do lote)
    const feedConsumption = lot.currentWeight * 0.03; // 3% do peso vivo
    const feedPrice = await this.getFeedPrice(date);
    const feedCost = feedConsumption * feedPrice;
    
    // Custos proporcionais (rateados por peso)
    const proportionalCosts = {
      laborCost: farmTotals.dailyLaborCost * (percentage / 100),
      infraCost: farmTotals.dailyInfraCost * (percentage / 100),
      vetCost: farmTotals.dailyVeterinaryCost * (percentage / 100)
    };
    
    // Custos específicos de saúde (se houver intervenção no dia)
    const healthCost = await this.getDailyHealthCosts(lot.id, date);
    
    return {
      lotId: lot.id,
      date,
      percentage,
      feedCost,
      ...proportionalCosts,
      healthCost,
      total: feedCost + Object.values(proportionalCosts).reduce((a, b) => a + b, 0) + healthCost
    };
  }
  
  // Calcular resultado quando lote é vendido
  async calculateFinalProfitability(lotId: string, saleData: SaleData): Promise<LotProfitability> {
    // 1. Somar todos os custos
    const totalCosts = await this.getTotalLotCosts(lotId);
    
    // 2. Calcular receita líquida
    const grossRevenue = saleData.soldWeight * saleData.pricePerKg;
    const deductions = saleData.slaughterFees + saleData.transportCost + saleData.salesCommission;
    const netRevenue = grossRevenue - deductions;
    
    // 3. Resultado final
    const profit = netRevenue - totalCosts.total;
    const profitPerKg = profit / saleData.soldWeight;
    const profitPerAnimal = profit / saleData.soldQuantity;
    const roi = (profit / totalCosts.total) * 100;
    const marginPercentage = (profit / netRevenue) * 100;
    
    // 4. Métricas operacionais
    const lot = await this.prisma.cattlePurchase.findUnique({ 
      where: { id: lotId },
      include: { statusHistory: true }
    });
    
    const daysInConfinement = this.calculateDaysInConfinement(lot);
    const totalWeightGain = lot.currentWeight - lot.initialWeight;
    const averageGMD = totalWeightGain / lot.currentQuantity / daysInConfinement;
    
    const result: LotProfitability = {
      lotId,
      lotCode: lot.lotCode,
      
      totalCosts: {
        aquisition: totalCosts.aquisition,
        reception: totalCosts.reception,
        confinement: totalCosts.confinement,
        total: totalCosts.total
      },
      
      totalRevenue: {
        gross: grossRevenue,
        net: netRevenue
      },
      
      result: {
        profit,
        profitPerKg,
        profitPerAnimal,
        roi,
        marginPercentage
      },
      
      metrics: {
        daysInConfinement,
        totalWeightGain,
        averageGMD,
        feedConversion: this.calculateFeedConversion(lotId),
        mortalityRate: ((lot.initialQuantity - lot.currentQuantity) / lot.initialQuantity) * 100
      }
    };
    
    // Salvar análise final
    await this.prisma.cattlePurchase.update({
      where: { id: lotId },
      data: { 
        profitabilityAnalysis: result,
        status: 'SOLD'
      }
    });
    
    return result;
  }
}

// Exemplo de uso no frontend
const LotFinancialCard = ({ lotId }: { lotId: string }) => {
  const { lot, costs, projections } = useLotFinancials(lotId);
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{lot.lotCode}</h3>
          <StatusBadge status={lot.status} />
        </div>
        <p className="text-sm text-gray-600">
          {lot.currentQuantity} animais • {lot.currentWeight.toLocaleString()}kg
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Custos por fase */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Aquisição:</span>
            <span className="font-medium">R$ {costs.aquisition.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Confinamento:</span>
            <span className="font-medium">R$ {costs.confinement.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total Investido:</span>
            <span>R$ {costs.total.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Projeções */}
        <div className="bg-blue-50 p-3 rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span>Custo Projetado:</span>
            <span>R$ {projections.totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Receita Estimada:</span>
            <span>R$ {projections.revenue.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between font-bold ${projections.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span>Lucro Estimado:</span>
            <span>R$ {projections.profit.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold">{lot.daysInConfinement}</div>
            <div>dias</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold">{lot.averageGMD?.toFixed(2)}</div>
            <div>kg/dia GMD</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard executivo
const ExecutiveDashboard = () => {
  const dashboardData = useExecutiveDashboard();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">{dashboardData.overview.activeLots}</div>
          <p className="text-sm text-gray-600">Lotes Ativos</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">
            R$ {(dashboardData.overview.totalInvestment / 1000000).toFixed(1)}M
          </div>
          <p className="text-sm text-gray-600">Investimento Total</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className={`text-2xl font-bold ${dashboardData.overview.projectedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {(dashboardData.overview.projectedProfit / 1000).toFixed(0)}K
          </div>
          <p className="text-sm text-gray-600">Lucro Projetado</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold">
            {dashboardData.performance.profitMargin.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-600">Margem Média</p>
        </CardContent>
      </Card>
    </div>
  );
};

export {
  LoteExemplo,
  FinancialCalculationService,
  LotFinancialCard,
  ExecutiveDashboard
};