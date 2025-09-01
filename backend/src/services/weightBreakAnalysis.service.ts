import { PrismaClient } from '@prisma/client';
import { ExpenseService } from './expense.service';

const prisma = new PrismaClient();
const expenseService = new ExpenseService();

interface WeightBreakRegistration {
  cattlePurchaseId: string;
  receivedWeight: number;
  transportConditions?: {
    distance?: number;
    duration?: number;
    temperature?: number;
    weatherConditions?: string;
    roadConditions?: string;
  };
  notes?: string;
}

interface WeightBreakPattern {
  region: string;
  averageBreak: number;
  sampleSize: number;
  standardDeviation: number;
  minBreak: number;
  maxBreak: number;
}

export class WeightBreakAnalysisService {
  // Registrar quebra de peso na recepção
  async registerWeightBreak(data: WeightBreakRegistration) {
    // Buscar dados da compra
    const purchase = await prisma.cattlePurchase.findUnique({
      where: { id: data.cattlePurchaseId },
      include: { vendor: true }
    });

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    // Calcular quebra
    const weightLost = purchase.purchaseWeight - data.receivedWeight;
    const breakPercentage = (weightLost / purchase.purchaseWeight) * 100;

    // Determinar região e temporada
    const season = this.getSeason(new Date());
    const region = await this.getVendorRegion(purchase.vendor.address || '');

    // Calcular impacto financeiro
    const pricePerKg = purchase.purchaseValue / purchase.purchaseWeight;
    const adjustedUnitCost = purchase.purchaseValue / data.receivedWeight;
    const financialImpact = weightLost * pricePerKg;

    // Criar registro de análise
    const analysis = await prisma.$executeRawUnsafe(`
      INSERT INTO weight_break_analyses (
        cattle_purchase_id,
        vendor_id,
        vendor_state,
        vendor_region,
        transport_distance,
        transport_duration,
        season,
        purchase_date,
        reception_date,
        purchase_weight,
        received_weight,
        weight_lost,
        break_percentage,
        initial_quantity,
        average_initial_weight,
        average_final_weight,
        temperature_at_arrival,
        weather_conditions,
        road_conditions,
        adjusted_unit_cost,
        financial_impact,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `,
      data.cattlePurchaseId,
      purchase.vendorId,
      purchase.vendor.address?.split(',')[1]?.trim() || 'Unknown',
      region,
      data.transportConditions?.distance || null,
      data.transportConditions?.duration || null,
      season,
      purchase.purchaseDate,
      new Date(),
      purchase.purchaseWeight,
      data.receivedWeight,
      weightLost,
      breakPercentage,
      purchase.initialQuantity,
      purchase.purchaseWeight / purchase.initialQuantity,
      data.receivedWeight / purchase.initialQuantity,
      data.transportConditions?.temperature || null,
      data.transportConditions?.weatherConditions || null,
      data.transportConditions?.roadConditions || null,
      adjustedUnitCost,
      financialImpact,
      data.notes || null
    );

    // Atualizar compra com peso recebido e quebra
    await prisma.cattlePurchase.update({
      where: { id: data.cattlePurchaseId },
      data: {
        receivedWeight: data.receivedWeight,
        currentWeight: data.receivedWeight,
        weightBreakPercentage: breakPercentage,
        status: 'RECEIVED'
      }
    });

    // Se quebra > 3%, criar alerta
    if (breakPercentage > 3) {
      await this.createHighBreakAlert(purchase, breakPercentage, region);
    }

    return analysis;
  }

  // Analisar padrões de quebra por região
  async analyzeBreakPatternsByRegion(period?: { startDate: Date; endDate: Date }) {
    const whereClause = period 
      ? `WHERE purchase_date BETWEEN $1 AND $2`
      : '';
    
    const params = period ? [period.startDate, period.endDate] : [];

    const patterns = await prisma.$queryRawUnsafe<WeightBreakPattern[]>(`
      SELECT 
        vendor_region as region,
        AVG(break_percentage) as "averageBreak",
        COUNT(*) as "sampleSize",
        STDDEV(break_percentage) as "standardDeviation",
        MIN(break_percentage) as "minBreak",
        MAX(break_percentage) as "maxBreak"
      FROM weight_break_analyses
      ${whereClause}
      GROUP BY vendor_region
      ORDER BY AVG(break_percentage) DESC
    `, ...params);

    return patterns;
  }

  // Analisar padrões por vendedor
  async analyzeBreakPatternsByVendor(vendorId?: string) {
    const whereClause = vendorId 
      ? `WHERE vendor_id = $1`
      : '';
    
    const params = vendorId ? [vendorId] : [];

    const vendorPatterns = await prisma.$queryRawUnsafe(`
      SELECT 
        v.name as vendor_name,
        v.id as vendor_id,
        AVG(wba.break_percentage) as average_break,
        COUNT(*) as total_purchases,
        SUM(wba.financial_impact) as total_impact,
        MIN(wba.break_percentage) as min_break,
        MAX(wba.break_percentage) as max_break,
        STDDEV(wba.break_percentage) as std_deviation
      FROM weight_break_analyses wba
      JOIN partners v ON wba.vendor_id = v.id
      ${whereClause}
      GROUP BY v.id, v.name
      ORDER BY AVG(wba.break_percentage) DESC
    `, ...params);

    return vendorPatterns;
  }

  // Analisar correlações
  async analyzeCorrelations() {
    // Correlação entre distância e quebra
    const distanceCorrelation = await prisma.$queryRaw`
      SELECT 
        CORR(transport_distance, break_percentage) as distance_correlation,
        COUNT(*) as sample_size
      FROM weight_break_analyses
      WHERE transport_distance IS NOT NULL
    `;

    // Correlação entre temperatura e quebra
    const temperatureCorrelation = await prisma.$queryRaw`
      SELECT 
        CORR(temperature_at_arrival, break_percentage) as temperature_correlation,
        COUNT(*) as sample_size
      FROM weight_break_analyses
      WHERE temperature_at_arrival IS NOT NULL
    `;

    // Padrões sazonais
    const seasonalPatterns = await prisma.$queryRaw`
      SELECT 
        season,
        AVG(break_percentage) as average_break,
        COUNT(*) as sample_size
      FROM weight_break_analyses
      GROUP BY season
      ORDER BY AVG(break_percentage) DESC
    `;

    return {
      distanceCorrelation,
      temperatureCorrelation,
      seasonalPatterns
    };
  }

  // Prever quebra esperada
  async predictExpectedBreak(vendorId: string, transportDistance: number, season: string) {
    // Buscar histórico similar
    const historicalData = await prisma.$queryRaw<any[]>(
      `SELECT 
        AVG(break_percentage) as avg_break,
        STDDEV(break_percentage) as std_dev,
        COUNT(*) as sample_size
      FROM weight_break_analyses
      WHERE vendor_id = $1
        AND season = $2
        AND transport_distance BETWEEN $3 - 50 AND $3 + 50`,
      vendorId, 
      season, 
      transportDistance
    );

    if (historicalData[0].sample_size < 3) {
      // Se não há dados suficientes, usar média geral
      const generalData = await prisma.$queryRaw<any[]>(
        `SELECT 
          AVG(break_percentage) as avg_break,
          STDDEV(break_percentage) as std_dev
        FROM weight_break_analyses
        WHERE season = $1`,
        season
      );

      return {
        expectedBreak: generalData[0].avg_break || 2.5,
        confidence: 'low',
        sampleSize: 0,
        rangeMin: 1.5,
        rangeMax: 4.0
      };
    }

    const avgBreak = historicalData[0].avg_break;
    const stdDev = historicalData[0].std_dev || 0.5;

    return {
      expectedBreak: avgBreak,
      confidence: historicalData[0].sample_size >= 10 ? 'high' : 'medium',
      sampleSize: historicalData[0].sample_size,
      rangeMin: Math.max(0, avgBreak - stdDev),
      rangeMax: avgBreak + stdDev
    };
  }

  // Gerar relatório customizado
  async generateCustomReport(filters: {
    startDate?: Date;
    endDate?: Date;
    vendorIds?: string[];
    regions?: string[];
    minBreak?: number;
    maxBreak?: number;
  }) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (filters.startDate && filters.endDate) {
      whereConditions.push(`purchase_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(filters.startDate, filters.endDate);
      paramIndex += 2;
    }

    if (filters.vendorIds && filters.vendorIds.length > 0) {
      whereConditions.push(`vendor_id = ANY($${paramIndex})`);
      params.push(filters.vendorIds);
      paramIndex++;
    }

    if (filters.regions && filters.regions.length > 0) {
      whereConditions.push(`vendor_region = ANY($${paramIndex})`);
      params.push(filters.regions);
      paramIndex++;
    }

    if (filters.minBreak !== undefined) {
      whereConditions.push(`break_percentage >= $${paramIndex}`);
      params.push(filters.minBreak);
      paramIndex++;
    }

    if (filters.maxBreak !== undefined) {
      whereConditions.push(`break_percentage <= $${paramIndex}`);
      params.push(filters.maxBreak);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const report = await prisma.$queryRawUnsafe(`
      SELECT 
        wba.*,
        cp.lot_code,
        v.name as vendor_name
      FROM weight_break_analyses wba
      JOIN cattle_purchases cp ON wba.cattle_purchase_id = cp.id
      JOIN partners v ON wba.vendor_id = v.id
      ${whereClause}
      ORDER BY wba.purchase_date DESC
    `, ...params);

    // Calcular estatísticas
    const stats = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_records,
        AVG(break_percentage) as average_break,
        SUM(financial_impact) as total_impact,
        MIN(break_percentage) as min_break,
        MAX(break_percentage) as max_break,
        STDDEV(break_percentage) as std_deviation
      FROM weight_break_analyses wba
      ${whereClause}
    `, ...params);

    return {
      data: report,
      statistics: stats[0],
      filters
    };
  }

  // Funções auxiliares
  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'autumn';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }

  private async getVendorRegion(address: string): Promise<string> {
    // Simplificado - em produção, usar API de geocoding
    const state = address.split(',')[1]?.trim() || '';
    
    const regionMap: Record<string, string> = {
      'SP': 'Southeast',
      'RJ': 'Southeast',
      'MG': 'Southeast',
      'ES': 'Southeast',
      'PR': 'South',
      'SC': 'South',
      'RS': 'South',
      'MS': 'Center-West',
      'MT': 'Center-West',
      'GO': 'Center-West',
      'DF': 'Center-West',
      'BA': 'Northeast',
      'TO': 'North',
      'PA': 'North',
      'RO': 'North'
    };

    return regionMap[state] || 'Unknown';
  }

  private async createHighBreakAlert(purchase: any, breakPercentage: number, region: string) {
    // Criar notificação (implementar conforme sistema de notificações)
    console.log(`⚠️ ALERTA: Quebra alta de ${breakPercentage.toFixed(2)}% no lote ${purchase.lotCode} da região ${region}`);
    
    // Aqui você pode implementar envio de email, notificação push, etc.
  }
}