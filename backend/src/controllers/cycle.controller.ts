import { Request, Response } from 'express';
import { CycleService } from '@/services/cycle.service';

const cycleService = new CycleService();

export class CycleController {
  /**
   * GET /cycles
   * Lista todos os ciclos com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { status, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      status: status as string,
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

    const result = await cycleService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /cycles/:id
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
   * GET /cycles/stats
   * Retorna estatísticas gerais
   */
  async stats(req: Request, res: Response): Promise<void> {
    const stats = await cycleService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /cycles/active
   * Lista ciclos ativos
   */
  async active(req: Request, res: Response): Promise<void> {
    const cycles = await cycleService.findActive();

    res.json({
      status: 'success',
      data: cycles,
    });
  }

  /**
   * GET /cycles/period
   * Lista ciclos por período
   */
  async byPeriod(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        status: 'error',
        message: 'Período é obrigatório',
      });
      return;
    }

    const cycles = await cycleService.findByPeriod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: cycles,
    });
  }

  /**
   * GET /cycles/:id/stats
   * Retorna estatísticas de um ciclo específico
   */
  async cycleStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const stats = await cycleService.getCycleStats(id);

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /cycles/summary
   * Retorna resumo dos ciclos
   */
  async summary(req: Request, res: Response): Promise<void> {
    const { status, startDate, endDate } = req.query;

    const filters = {
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const summary = await cycleService.getSummary(filters);

    res.json({
      status: 'success',
      data: summary,
    });
  }

  /**
   * POST /cycles
   * Cria um novo ciclo
   */
  async create(req: Request, res: Response): Promise<void> {
    console.log('[CycleController] Dados recebidos:', req.body);
    console.log('[CycleController] Usuário:', req.user);
    
    const cycleData = {
      ...req.body,
      userId: req.user?.id || 'cmewmjotu0001p0l539z1uwfc', // Usa ID do admin como fallback
    };
    
    console.log('[CycleController] Dados processados:', cycleData);
    
    const cycle = await cycleService.create(cycleData);

    res.status(201).json({
      status: 'success',
      data: cycle,
    });
  }

  /**
   * PUT /cycles/:id
   * Atualiza um ciclo
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const cycle = await cycleService.update(id, req.body);

    res.json({
      status: 'success',
      data: cycle,
    });
  }

  /**
   * PATCH /cycles/:id/status
   * Atualiza o status de um ciclo
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    
    const cycle = await cycleService.updateStatus(id, status);

    res.json({
      status: 'success',
      data: cycle,
    });
  }

  /**
   * DELETE /cycles/:id
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
}