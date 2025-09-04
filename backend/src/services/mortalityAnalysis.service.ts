import { PrismaClient } from '@prisma/client';
import { ExpenseService } from './expense.service';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();
const expenseService = new ExpenseService();

interface MortalityRegistration {
  cattlePurchaseId: string;
  penId?: string;
  phase: 'transport' | 'reception' | 'confinement';
  quantity: number;
  mortalityDate: Date;
  averageWeight?: number;
  cause?: string;
  symptoms?: string;
  veterinaryDiagnosis?: string;
  treatmentAttempted?: boolean;
  treatmentCost?: number;
  environmentalConditions?: {
    temperature?: number;
    humidity?: number;
    weatherConditions?: string;
  };
  notes?: string;
}

interface MortalityPattern {
  phase: string;
  totalDeaths: number;
  totalLoss: number;
  averageRate: number;
  causes: Array<{
    cause: string;
    count: number;
    percentage: number;
  }>;
}

export class MortalityAnalysisService {
  // Registrar mortalidade
  async registerMortality(data: MortalityRegistration) {
    // Buscar dados da compra
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: data.cattlePurchaseId }
    });

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    // Calcular custo médio do animal no momento da morte
    let unitCost: number;
    let accumulatedCost: number;

    if (data.phase === 'transport') {
      // Apenas custo de aquisição + frete
      unitCost = (purchase.purchaseValue + purchase.freightCost) / purchase.initialQuantity;
      accumulatedCost = unitCost;
    } else {
      // Incluir custos acumulados de confinamento
      const totalCostSoFar = purchase.totalCost || purchase.purchaseValue;
      const currentQuantity = purchase.currentQuantity || purchase.initialQuantity;
      unitCost = totalCostSoFar / currentQuantity;
      accumulatedCost = totalCostSoFar;
    }

    const totalLoss = unitCost * data.quantity;

    // Calcular dias em confinamento (se aplicável)
    let daysInConfinement = 0;
    if (data.phase === 'confinement' && purchase.receptionDate) {
      daysInConfinement = Math.floor(
        (data.mortalityDate.getTime() - purchase.receptionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Criar registro de análise
    const analysis = await prisma.$executeRawUnsafe(`
      INSERT INTO mortality_analyses (
        cattle_purchase_id,
        pen_id,
        phase,
        mortality_date,
        quantity,
        average_weight,
        unit_cost,
        total_loss,
        accumulated_cost,
        days_in_confinement,
        cause,
        symptoms,
        veterinary_diagnosis,
        treatment_attempted,
        treatment_cost,
        weather_conditions,
        temperature,
        humidity,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `,
      data.cattlePurchaseId,
      data.penId || null,
      data.phase,
      data.mortalityDate,
      data.quantity,
      data.averageWeight || null,
      unitCost,
      totalLoss,
      accumulatedCost,
      daysInConfinement,
      data.cause || null,
      data.symptoms || null,
      data.veterinaryDiagnosis || null,
      data.treatmentAttempted || false,
      data.treatmentCost || 0,
      data.environmentalConditions?.weatherConditions || null,
      data.environmentalConditions?.temperature || null,
      data.environmentalConditions?.humidity || null,
      data.notes || null
    );

    // Criar despesa no sistema financeiro
    await expenseService.create({
      category: 'mortality',
      description: `Mortalidade - ${data.quantity} animal(is) - ${data.phase} - ${data.cause || 'Causa não especificada'}`,
      totalAmount: totalLoss,
      dueDate: data.mortalityDate,
      paymentDate: data.mortalityDate,
      isPaid: true,
      impactsCashFlow: false, // Não é saída de caixa, é perda
      purchaseId: data.cattlePurchaseId,
      penId: data.penId,
      userId: 'system', // Ou pegar do contexto
      notes: `Perda por mortalidade. ${data.veterinaryDiagnosis || ''}`
    });

    // INTEGRAR COM DRE - Adicionar dedução
    const referenceMonth = new Date(data.mortalityDate);
    referenceMonth.setDate(1); // Primeiro dia do mês
    referenceMonth.setHours(0, 0, 0, 0);

    // Buscar ou criar DRE do mês
    let dreStatement = await prisma.dREStatement.findFirst({
      where: {
        referenceMonth: referenceMonth,
        cycleId: purchase.cycleId || null
      }
    });

    if (!dreStatement) {
      // Criar novo DRE se não existir
      dreStatement = await prisma.dREStatement.create({
        data: {
          referenceMonth: referenceMonth,
          cycleId: purchase.cycleId || null,
          deductions: totalLoss,
          grossRevenue: 0,
          netRevenue: -totalLoss,
          animalCost: 0,
          feedCost: 0,
          healthCost: 0,
          laborCost: 0,
          otherCosts: 0,
          totalCosts: 0,
          grossProfit: -totalLoss,
          grossMargin: 0,
          adminExpenses: 0,
          salesExpenses: 0,
          financialExpenses: 0,
          otherExpenses: 0,
          totalExpenses: 0,
          operationalProfit: -totalLoss,
          operationalMargin: 0,
          netProfit: -totalLoss,
          netMargin: 0,
          status: 'DRAFT'
        }
      });
      logger.info(`DRE criado para ${referenceMonth.toISOString()} com dedução de mortalidade: R$ ${totalLoss.toFixed(2)}`);
    } else {
      // Atualizar DRE existente
      await prisma.dREStatement.update({
        where: { id: dreStatement.id },
        data: {
          deductions: {
            increment: totalLoss
          },
          netRevenue: {
            decrement: totalLoss
          },
          grossProfit: {
            decrement: totalLoss
          },
          operationalProfit: {
            decrement: totalLoss
          },
          netProfit: {
            decrement: totalLoss
          }
        }
      });
      logger.info(`DRE atualizado para ${referenceMonth.toISOString()} com dedução de mortalidade: R$ ${totalLoss.toFixed(2)}`);
    }

    // Atualizar quantidade do lote
    await prisma.cattlePurchase.update({
      where: { id: data.cattlePurchaseId },
      data: {
        currentQuantity: { decrement: data.quantity },
        transportMortality: data.phase === 'transport' 
          ? { increment: data.quantity }
          : undefined
      }
    });

    // Criar alerta se taxa de mortalidade > 2%
    const mortalityRate = (data.quantity / purchase.initialQuantity) * 100;
    if (mortalityRate > 2) {
      await this.createHighMortalityAlert(purchase, mortalityRate, data);
    }

    return analysis;
  }

  // Analisar padrões de mortalidade por fase
  async analyzeMortalityPatterns(period?: { startDate: Date; endDate: Date }) {
    const whereClause = period 
      ? `WHERE mortality_date BETWEEN $1 AND $2`
      : '';
    
    const params = period ? [period.startDate, period.endDate] : [];

    // Padrões por fase
    const phasePatterns = await prisma.$queryRawUnsafe<MortalityPattern[]>(`
      SELECT 
        phase,
        COUNT(*) as total_events,
        SUM(quantity) as total_deaths,
        SUM(total_loss) as total_loss,
        AVG(quantity::float / cp.initial_quantity * 100) as average_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      ${whereClause}
      GROUP BY phase
      ORDER BY SUM(quantity) DESC
    `, ...params);

    // Causas mais comuns
    const topCauses = await prisma.$queryRawUnsafe(`
      SELECT 
        cause,
        COUNT(*) as occurrences,
        SUM(quantity) as total_deaths,
        SUM(total_loss) as total_loss,
        AVG(quantity) as avg_deaths_per_event
      FROM mortality_analyses
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} cause IS NOT NULL
      GROUP BY cause
      ORDER BY SUM(quantity) DESC
      LIMIT 10
    `, ...params);

    return {
      phasePatterns,
      topCauses
    };
  }

  // Analisar correlação com condições ambientais
  async analyzeEnvironmentalCorrelations() {
    // Correlação temperatura x mortalidade
    const temperatureAnalysis = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN temperature < 10 THEN 'Cold (<10°C)'
          WHEN temperature BETWEEN 10 AND 20 THEN 'Cool (10-20°C)'
          WHEN temperature BETWEEN 20 AND 30 THEN 'Moderate (20-30°C)'
          WHEN temperature BETWEEN 30 AND 35 THEN 'Hot (30-35°C)'
          ELSE 'Very Hot (>35°C)'
        END as temperature_range,
        COUNT(*) as events,
        SUM(quantity) as total_deaths,
        AVG(quantity::float / cp.initial_quantity * 100) as avg_mortality_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      WHERE temperature IS NOT NULL
      GROUP BY temperature_range
      ORDER BY avg_mortality_rate DESC
    `;

    // Análise por estação
    const seasonalAnalysis = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXTRACT(MONTH FROM mortality_date) IN (12, 1, 2) THEN 'Summer'
          WHEN EXTRACT(MONTH FROM mortality_date) IN (3, 4, 5) THEN 'Autumn'
          WHEN EXTRACT(MONTH FROM mortality_date) IN (6, 7, 8) THEN 'Winter'
          ELSE 'Spring'
        END as season,
        COUNT(*) as events,
        SUM(quantity) as total_deaths,
        AVG(quantity::float / cp.initial_quantity * 100) as avg_mortality_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      GROUP BY season
      ORDER BY avg_mortality_rate DESC
    `;

    return {
      temperatureAnalysis,
      seasonalAnalysis
    };
  }

  // Análise de eficácia de tratamentos
  async analyzeTreatmentEffectiveness() {
    const treatmentAnalysis = await prisma.$queryRaw`
      SELECT 
        cause,
        COUNT(CASE WHEN treatment_attempted = true THEN 1 END) as treated_cases,
        COUNT(CASE WHEN treatment_attempted = false THEN 1 END) as untreated_cases,
        AVG(CASE WHEN treatment_attempted = true THEN quantity END) as avg_deaths_with_treatment,
        AVG(CASE WHEN treatment_attempted = false THEN quantity END) as avg_deaths_without_treatment,
        AVG(CASE WHEN treatment_attempted = true THEN treatment_cost END) as avg_treatment_cost,
        SUM(CASE WHEN treatment_attempted = true THEN treatment_cost END) as total_treatment_cost
      FROM mortality_analyses
      WHERE cause IS NOT NULL
      GROUP BY cause
      HAVING COUNT(*) >= 5  -- Apenas causas com amostra significativa
      ORDER BY COUNT(*) DESC
    `;

    return treatmentAnalysis;
  }

  // Prever risco de mortalidade
  async predictMortalityRisk(cattlePurchaseId: string) {
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: cattlePurchaseId },
      include: { vendor: true }
    });

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    // Buscar histórico do vendedor
    const vendorHistory = await prisma.$queryRaw<any[]>(
      `SELECT 
        AVG(ma.quantity::float / cp.initial_quantity * 100) as avg_mortality_rate,
        COUNT(DISTINCT ma.cattle_purchase_id) as total_purchases
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      WHERE cp.vendor_id = $1`,
      purchase.vendorId
    );

    // Buscar histórico da época do ano
    const currentMonth = new Date().getMonth() + 1;
    const seasonalHistory = await prisma.$queryRaw<any[]>(
      `SELECT 
        AVG(ma.quantity::float / cp.initial_quantity * 100) as avg_mortality_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      WHERE EXTRACT(MONTH FROM ma.mortality_date) = $1`,
      currentMonth
    );

    // Calcular risco baseado em múltiplos fatores
    const vendorRisk = vendorHistory[0]?.avg_mortality_rate || 1.5;
    const seasonalRisk = seasonalHistory[0]?.avg_mortality_rate || 1.5;
    
    // Fatores de risco adicionais
    let riskScore = (vendorRisk + seasonalRisk) / 2;
    
    // Ajustar baseado na distância de transporte
    if (purchase.freightDistance && purchase.freightDistance > 500) {
      riskScore *= 1.2; // 20% maior risco para longas distâncias
    }

    // Classificar risco
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore < 1) riskLevel = 'low';
    else if (riskScore < 2) riskLevel = 'medium';
    else riskLevel = 'high';

    return {
      riskScore,
      riskLevel,
      expectedMortalityRate: riskScore,
      factors: {
        vendorHistoricalRate: vendorRisk,
        seasonalAverageRate: seasonalRisk,
        transportDistance: purchase.freightDistance
      },
      recommendations: this.getMortalityPreventionRecommendations(riskLevel)
    };
  }

  // Gerar relatório de mortalidade por lote
  async generateLotMortalityReport(cattlePurchaseId: string) {
    const mortalityEvents = await prisma.$queryRaw(
      `SELECT 
        *,
        quantity::float / cp.initial_quantity * 100 as mortality_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      WHERE ma.cattle_purchase_id = $1
      ORDER BY ma.mortality_date`,
      cattlePurchaseId
    );

    const summary = await prisma.$queryRaw(
      `SELECT 
        COUNT(*) as total_events,
        SUM(quantity) as total_deaths,
        SUM(total_loss) as total_financial_loss,
        SUM(treatment_cost) as total_treatment_cost,
        AVG(quantity::float / cp.initial_quantity * 100) as overall_mortality_rate
      FROM mortality_analyses ma
      JOIN cattle_purchases cp ON ma.cattle_purchase_id = cp.id
      WHERE ma.cattle_purchase_id = $1`,
      cattlePurchaseId
    );

    const causeBreakdown = await prisma.$queryRaw(
      `SELECT 
        cause,
        phase,
        COUNT(*) as events,
        SUM(quantity) as deaths,
        SUM(total_loss) as financial_loss
      FROM mortality_analyses
      WHERE cattle_purchase_id = $1
      GROUP BY cause, phase
      ORDER BY SUM(quantity) DESC`,
      cattlePurchaseId
    );

    return {
      events: mortalityEvents,
      summary: summary[0],
      causeBreakdown
    };
  }

  // Funções auxiliares
  private getMortalityPreventionRecommendations(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const baseRecommendations = [
      'Realizar quarentena na chegada',
      'Monitorar temperatura e comportamento diariamente',
      'Garantir água limpa e abundante'
    ];

    if (riskLevel === 'medium') {
      return [
        ...baseRecommendations,
        'Implementar protocolo sanitário preventivo',
        'Aumentar frequência de visitas veterinárias',
        'Separar animais em grupos menores'
      ];
    }

    if (riskLevel === 'high') {
      return [
        ...baseRecommendations,
        'Protocolo sanitário intensivo na chegada',
        'Acompanhamento veterinário diário na primeira semana',
        'Separação imediata de animais debilitados',
        'Suplementação nutricional preventiva',
        'Monitoramento 24h nos primeiros dias'
      ];
    }

    return baseRecommendations;
  }

  private async createHighMortalityAlert(purchase: any, mortalityRate: number, data: MortalityRegistration) {
    console.log(`🚨 ALERTA CRÍTICO: Taxa de mortalidade de ${mortalityRate.toFixed(2)}% no lote ${purchase.lotCode}`);
    console.log(`   Fase: ${data.phase}`);
    console.log(`   Quantidade: ${data.quantity} animais`);
    console.log(`   Causa: ${data.cause || 'Não especificada'}`);
    
    // Implementar sistema de notificações urgentes
    // Email, SMS, notificação push, etc.
  }
}