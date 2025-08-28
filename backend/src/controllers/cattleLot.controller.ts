import { Request, Response } from 'express';
import { CattleLotService } from '@/services/cattleLot.service';
import { LotStatus } from '@prisma/client';

const cattleLotService = new CattleLotService();

export class CattleLotController {
  /**
   * GET /lots
   * Lista todos os lotes com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      vendorId, 
      penId, 
      startDate, 
      endDate, 
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as LotStatus,
      vendorId: vendorId as string,
      penId: penId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await cattleLotService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /lots/:id
   * Busca um lote por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const lot = await cattleLotService.findById(id);

    res.json({
      status: 'success',
      data: lot,
    });
  }

  /**
   * GET /lots/status/:status
   * Lista lotes por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const lots = await cattleLotService.findByStatus(status as LotStatus);

    res.json({
      status: 'success',
      data: lots,
    });
  }

  /**
   * GET /lots/:id/metrics
   * Retorna métricas do lote
   */
  async metrics(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const metrics = await cattleLotService.getMetrics(id);

    res.json({
      status: 'success',
      data: metrics,
    });
  }

  /**
   * POST /lots/:id/allocate
   * Aloca lote em currais
   */
  async allocate(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { allocations } = req.body;
    
    const result = await cattleLotService.allocateToPens(
      id, 
      allocations, 
      req.user!.id
    );

    res.json({
      status: 'success',
      data: result,
      message: 'Lote alocado com sucesso',
    });
  }

  /**
   * POST /lots/:id/mortality
   * Registra mortalidade
   */
  async recordMortality(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const lot = await cattleLotService.recordMortality(
      id, 
      req.body, 
      req.user!.id
    );

    res.json({
      status: 'success',
      data: lot,
      message: 'Mortalidade registrada com sucesso',
    });
  }

  /**
   * POST /lots/:id/weight-loss
   * Registra quebra de peso
   */
  async recordWeightLoss(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const lot = await cattleLotService.recordWeightLoss(
      id, 
      req.body, 
      req.user!.id
    );

    res.json({
      status: 'success',
      data: lot,
      message: 'Quebra de peso registrada com sucesso',
    });
  }

  /**
   * PATCH /lots/:id/costs
   * Atualiza custos do lote
   */
  async updateCosts(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { costType, amount } = req.body;
    
    const lot = await cattleLotService.updateCosts(id, costType, amount);

    res.json({
      status: 'success',
      data: lot,
      message: 'Custos atualizados com sucesso',
    });
  }

  /**
   * GET /lots/stats
   * Retorna estatísticas dos lotes
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await cattleLotService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
} 