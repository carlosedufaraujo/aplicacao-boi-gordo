import { ReportRepository } from '@/repositories/report.repository';
import { ValidationError } from '@/utils/AppError';

interface DREFilters {
  startDate: Date;
  endDate: Date;
  entityType?: 'LOT' | 'PEN';
  entityId?: string;
}

interface CashFlowFilters {
  startDate: Date;
  endDate: Date;
  accountId?: string;
}

export class ReportService {
  private reportRepository: ReportRepository;

  constructor() {
    this.reportRepository = new ReportRepository();
  }

  /**
   * Gera relatório DRE (Demonstração de Resultados)
   */
  async generateDRE(filters: DREFilters) {
    // Valida período
    if (filters.startDate > filters.endDate) {
      throw new ValidationError('Data inicial deve ser anterior à data final');
    }

    // Valida entidade se fornecida
    if (filters.entityType && !filters.entityId) {
      throw new ValidationError('ID da entidade é obrigatório quando tipo é especificado');
    }

    return this.reportRepository.generateDRE(
      filters.startDate,
      filters.endDate,
      filters.entityType,
      filters.entityId
    );
  }

  /**
   * Gera relatório de Fluxo de Caixa
   */
  async generateCashFlow(filters: CashFlowFilters) {
    // Valida período
    if (filters.startDate > filters.endDate) {
      throw new ValidationError('Data inicial deve ser anterior à data final');
    }

    // Limita período máximo a 90 dias
    const daysDiff = Math.floor((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      throw new ValidationError('Período máximo para fluxo de caixa é de 90 dias');
    }

    return this.reportRepository.generateCashFlow(
      filters.startDate,
      filters.endDate,
      filters.accountId
    );
  }

  /**
   * Gera relatório de Performance por Lote
   */
  async generateLotPerformance(lotId?: string) {
    const performance = await this.reportRepository.generateLotPerformance(lotId);

    // Ordena por lucratividade (ROI)
    performance.sort((a, b) => b.financials.roi - a.financials.roi);

    // Adiciona rankings
    const withRankings = performance.map((lot, index) => ({
      ...lot,
      ranking: {
        position: index + 1,
        total: performance.length,
        percentile: ((performance.length - index) / performance.length) * 100,
      },
    }));

    // Calcula médias gerais
    const averages = this.calculateLotAverages(performance);

    return {
      lots: withRankings,
      summary: {
        totalLots: performance.length,
        averages,
        bestPerformers: withRankings.slice(0, 5),
        worstPerformers: withRankings.slice(-5).reverse(),
      },
    };
  }

  /**
   * Gera relatório de Ocupação de Currais
   */
  async generatePenOccupancy() {
    const occupancy = await this.reportRepository.generatePenOccupancy();

    // Adiciona alertas
    const alerts = [];

    // Alerta de superlotação
    const overcrowded = occupancy.pens.filter(p => p.occupancyRate > 90);
    if (overcrowded.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${overcrowded.length} currais com ocupação acima de 90%`,
        pens: overcrowded.map(p => p.name),
      });
    }

    // Alerta de subutilização
    const underutilized = occupancy.pens.filter(p => p.status === 'ACTIVE' && p.occupancyRate < 30);
    if (underutilized.length > 0) {
      alerts.push({
        type: 'info',
        message: `${underutilized.length} currais ativos com ocupação abaixo de 30%`,
        pens: underutilized.map(p => p.name),
      });
    }

    // Alerta de manutenção
    const maintenance = occupancy.pens.filter(p => p.status === 'MAINTENANCE');
    if (maintenance.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${maintenance.length} currais em manutenção`,
        pens: maintenance.map(p => p.name),
      });
    }

    return {
      ...occupancy,
      alerts,
    };
  }

  /**
   * Gera relatório comparativo de DRE entre entidades
   */
  async compareDRE(entities: Array<{ type: 'LOT' | 'PEN'; id: string }>, startDate: Date, endDate: Date) {
    const results = await Promise.all(
      entities.map(entity => 
        this.reportRepository.generateDRE(startDate, endDate, entity.type, entity.id)
      )
    );

    // Encontra melhor e pior desempenho
    const sorted = results.sort((a, b) => b.results.roi - a.results.roi);

    return {
      period: { startDate, endDate },
      entities: entities.map((entity, index) => ({
        ...entity,
        ...results[index],
      })),
      comparison: {
        best: {
          entity: entities[results.indexOf(sorted[0])],
          roi: sorted[0].results.roi,
          margin: sorted[0].results.margin,
        },
        worst: {
          entity: entities[results.indexOf(sorted[sorted.length - 1])],
          roi: sorted[sorted.length - 1].results.roi,
          margin: sorted[sorted.length - 1].results.margin,
        },
        average: {
          roi: results.reduce((sum: number, r) => sum + r.results.roi, 0) / results.length,
          margin: results.reduce((sum: number, r) => sum + r.results.margin, 0) / results.length,
        },
      },
    };
  }

  /**
   * Gera relatório executivo consolidado
   */
  async generateExecutiveSummary(startDate: Date, endDate: Date) {
    // Busca dados de múltiplas fontes
    const [dre, cashFlow, lotPerformance, penOccupancy] = await Promise.all([
      this.reportRepository.generateDRE(startDate, endDate),
      this.reportRepository.generateCashFlow(startDate, endDate),
      this.reportRepository.generateLotPerformance(),
      this.reportRepository.generatePenOccupancy(),
    ]);

    // Calcula KPIs principais
    const kpis = {
      revenue: dre.revenue.total,
      expense: dre.expense.total,
      profit: dre.results.grossProfit,
      margin: dre.results.margin,
      cashPosition: cashFlow.summary.netFlow,
      occupancyRate: penOccupancy.summary.occupancyRate,
      activeLots: lotPerformance.filter(l => l.lot.status === 'ACTIVE').length,
      totalAnimals: penOccupancy.summary.totalOccupied,
    };

    // Identifica tendências
    const trends = {
      profitability: dre.results.margin > 15 ? 'positive' : dre.results.margin > 5 ? 'neutral' : 'negative',
      cashFlow: cashFlow.summary.netFlow > 0 ? 'positive' : 'negative',
      occupancy: penOccupancy.summary.occupancyRate > 80 ? 'high' : 
                 penOccupancy.summary.occupancyRate > 50 ? 'moderate' : 'low',
    };

    // Gera recomendações
    const recommendations = this.generateRecommendations(kpis, trends);

    return {
      period: { startDate, endDate },
      kpis,
      trends,
      recommendations,
      highlights: {
        bestLot: lotPerformance[0] || null,
        worstLot: lotPerformance[lotPerformance.length - 1] || null,
        cashAlert: cashFlow.summary.pendingOutflow > cashFlow.summary.netFlow,
        occupancyAlert: penOccupancy.summary.occupancyRate > 90,
      },
    };
  }

  private calculateLotAverages(lots: any[]) {
    if (lots.length === 0) return null;

    const sum = lots.reduce((acc, lot) => ({
      purchaseCost: acc.purchaseCost + lot.financials.purchaseCost,
      totalCost: acc.totalCost + lot.financials.totalCost,
      totalSales: acc.totalSales + lot.financials.totalSales,
      profit: acc.profit + lot.financials.profit,
      margin: acc.margin + lot.financials.margin,
      roi: acc.roi + lot.financials.roi,
      daysInConfinement: acc.daysInConfinement + lot.timeline.daysInConfinement,
    }), {
      purchaseCost: 0,
      totalCost: 0,
      totalSales: 0,
      profit: 0,
      margin: 0,
      roi: 0,
      daysInConfinement: 0,
    });

    return {
      purchaseCost: sum.purchaseCost / lots.length,
      totalCost: sum.totalCost / lots.length,
      totalSales: sum.totalSales / lots.length,
      profit: sum.profit / lots.length,
      margin: sum.margin / lots.length,
      roi: sum.roi / lots.length,
      daysInConfinement: Math.round(sum.daysInConfinement / lots.length),
    };
  }

  private generateRecommendations(kpis: any, trends: any) {
    const recommendations = [];

    // Recomendações de lucratividade
    if (trends.profitability === 'negative') {
      recommendations.push({
        type: 'urgent',
        area: 'profitability',
        message: 'Margem de lucro abaixo do esperado. Revisar custos operacionais e preços de venda.',
      });
    }

    // Recomendações de fluxo de caixa
    if (trends.cashFlow === 'negative') {
      recommendations.push({
        type: 'warning',
        area: 'cashflow',
        message: 'Fluxo de caixa negativo. Considerar antecipar recebimentos ou postergar pagamentos.',
      });
    }

    // Recomendações de ocupação
    if (trends.occupancy === 'low') {
      recommendations.push({
        type: 'info',
        area: 'occupancy',
        message: 'Taxa de ocupação baixa. Oportunidade para aumentar o volume de compras.',
      });
    } else if (trends.occupancy === 'high' && kpis.occupancyRate > 90) {
      recommendations.push({
        type: 'warning',
        area: 'occupancy',
        message: 'Taxa de ocupação muito alta. Considerar expansão da capacidade ou acelerar vendas.',
      });
    }

    // Recomendações de eficiência
    if (kpis.margin < 10 && trends.occupancy !== 'low') {
      recommendations.push({
        type: 'warning',
        area: 'efficiency',
        message: 'Margem baixa com boa ocupação. Focar em redução de custos operacionais.',
      });
    }

    return recommendations;
  }
} 