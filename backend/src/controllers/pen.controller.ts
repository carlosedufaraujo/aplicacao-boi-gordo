import { Request, Response } from 'express';
import { PenService } from '@/services/pen.service';
import { PenStatus, PenType } from '@prisma/client';

const penService = new PenService();

export class PenController {
  /**
   * GET /pens
   * Lista todos os currais com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      type, 
      isActive, 
      minCapacity, 
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as PenStatus,
      type: type as PenType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      minCapacity: minCapacity ? parseInt(minCapacity as string) : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await penService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /pens/available
   * Lista currais disponíveis
   */
  async available(req: Request, res: Response): Promise<void> {
    const { minCapacity } = req.query;
    
    const pens = await penService.findAvailable(
      minCapacity ? parseInt(minCapacity as string) : undefined
    );

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /pens/:id
   * Busca um curral por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const pen = await penService.findById(id);

    res.json({
      status: 'success',
      data: pen,
    });
  }

  /**
   * GET /pens/status/:status
   * Lista currais por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const pens = await penService.findByStatus(status as PenStatus);

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /pens/type/:type
   * Lista currais por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    
    const pens = await penService.findByType(type as PenType);

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * POST /pens
   * Cria um novo curral
   */
  async create(req: Request, res: Response): Promise<void> {
    const pen = await penService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: pen,
    });
  }

  /**
   * PUT /pens/:id
   * Atualiza um curral
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const pen = await penService.update(id, req.body);

    res.json({
      status: 'success',
      data: pen,
    });
  }

  /**
   * PATCH /pens/:id/status
   * Atualiza o status de um curral
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    
    const pen = await penService.updateStatus(id, status);

    res.json({
      status: 'success',
      data: pen,
    });
  }

  /**
   * DELETE /pens/:id
   * Remove ou inativa um curral
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await penService.delete(id);

    res.json({
      status: 'success',
      message: 'Curral removido com sucesso',
    });
  }

  /**
   * GET /pens/:id/occupation
   * Retorna ocupação do curral
   */
  async occupation(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const occupation = await penService.getOccupation(id);

    res.json({
      status: 'success',
      data: occupation,
    });
  }

  /**
   * GET /pens/stats
   * Retorna estatísticas dos currais
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await penService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * POST /pens/:id/health-protocol
   * Aplica protocolo sanitário no curral
   */
  async applyHealthProtocol(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const result = await penService.applyHealthProtocol(
      id, 
      req.body, 
      req.user!.id
    );

    res.json({
      status: 'success',
      data: result,
      message: 'Protocolo sanitário aplicado com sucesso',
    });
  }

  /**
   * GET /pens/:id/health-history
   * Retorna histórico de saúde do curral
   */
  async healthHistory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const history = await penService.getHealthHistory(
      id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: history,
    });
  }
} 