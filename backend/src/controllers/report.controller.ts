import { Request, Response } from 'express';
import { ReportService } from '@/services/report.service';

const reportService = new ReportService();

export class ReportController {
  /**
   * GET /reports/dre
   * Gera relatório DRE
   */
  async dre(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, entityType, entityId } = req.query;

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      entityType: entityType as 'LOT' | 'PEN' | undefined,
      entityId: entityId as string | undefined,
    };

    const report = await reportService.generateDRE(filters);

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * GET /reports/cash-flow
   * Gera relatório de fluxo de caixa
   */
  async cashFlow(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, accountId } = req.query;

    const filters = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      accountId: accountId as string | undefined,
    };

    const report = await reportService.generateCashFlow(filters);

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * GET /reports/lot-performance
   * Gera relatório de performance por lote
   */
  async lotPerformance(req: Request, res: Response): Promise<void> {
    const { lotId } = req.query;

    const report = await reportService.generateLotPerformance(lotId as string | undefined);

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * GET /reports/pen-occupancy
   * Gera relatório de ocupação de currais
   */
  async penOccupancy(_req: Request, res: Response): Promise<void> {
    const report = await reportService.generatePenOccupancy();

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * POST /reports/dre-comparison
   * Compara DRE entre múltiplas entidades
   */
  async dreComparison(req: Request, res: Response): Promise<void> {
    const { entities, startDate, endDate } = req.body;

    const report = await reportService.compareDRE(
      entities,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * GET /reports/executive-summary
   * Gera relatório executivo consolidado
   */
  async executiveSummary(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;

    const report = await reportService.generateExecutiveSummary(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: report,
    });
  }

  /**
   * GET /reports/export/:type
   * Exporta relatório em formato específico
   */
  async export(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    const { format = 'csv' } = req.query;
    // Suppress unused variable warning for now
    void type;

    // Por enquanto, retorna mensagem de não implementado
    res.status(501).json({
      status: 'error',
      message: `Exportação para ${format} não implementada ainda`,
    });
  }
} 