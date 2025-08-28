import { Request, Response } from 'express';
import { CycleSupabaseService } from '@/services/supabase/cycle.supabase.service';

const cycleService = new CycleSupabaseService();

export class CycleSupabaseController {
  /**
   * GET /api/v1/cycles
   * Lista todos os ciclos com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      isActive,
      startDate,
      endDate,
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await cycleService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  }

  /**
   * GET /api/v1/cycles/:id
   * Busca um ciclo por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const cycle = await cycleService.findById(id);

    res.json({
      status: 'success',
      data: cycle,
    });
  }

  /**
   * GET /api/v1/cycles/status/:status
   * Lista ciclos por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const cycles = await cycleService.findByStatus(status);

    res.json({
      status: 'success',
      data: cycles,
    });
  }

  /**
   * GET /api/v1/cycles/active
   * Lista apenas ciclos ativos
   */
  async active(_req: Request, res: Response): Promise<void> {
    const cycles = await cycleService.findActive();

    res.json({
      status: 'success',
      data: cycles,
    });
  }

  /**
   * GET /api/v1/cycles/current
   * Busca o ciclo atual (ativo mais recente)
   */
  async current(_req: Request, res: Response): Promise<void> {
    const cycle = await cycleService.findCurrent();

    res.json({
      status: 'success',
      data: cycle,
    });
  }

  /**
   * POST /api/v1/cycles
   * Cria um novo ciclo
   */
  async create(req: Request, res: Response): Promise<void> {
    const cycle = await cycleService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: cycle,
      message: 'Ciclo criado com sucesso'
    });
  }

  /**
   * PUT /api/v1/cycles/:id
   * Atualiza um ciclo
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const cycle = await cycleService.update(id, req.body);

    res.json({
      status: 'success',
      data: cycle,
      message: 'Ciclo atualizado com sucesso'
    });
  }

  /**
   * PATCH /api/v1/cycles/:id/complete
   * Completa um ciclo
   */
  async complete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { actualEndDate } = req.body;
    
    const cycle = await cycleService.complete(id, actualEndDate);

    res.json({
      status: 'success',
      data: cycle,
      message: 'Ciclo completado com sucesso'
    });
  }

  /**
   * PATCH /api/v1/cycles/:id/cancel
   * Cancela um ciclo
   */
  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    
    const cycle = await cycleService.cancel(id, reason);

    res.json({
      status: 'success',
      data: cycle,
      message: 'Ciclo cancelado com sucesso'
    });
  }

  /**
   * DELETE /api/v1/cycles/:id
   * Remove um ciclo
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await cycleService.delete(id);

    res.json({
      status: 'success',
      message: 'Ciclo removido com sucesso',
    });
  }

  /**
   * GET /api/v1/cycles/stats
   * Retorna estatísticas dos ciclos
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await cycleService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
