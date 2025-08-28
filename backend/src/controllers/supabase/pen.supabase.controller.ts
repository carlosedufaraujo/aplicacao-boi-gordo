import { Request, Response } from 'express';
import { PenSupabaseService } from '@/services/supabase/pen.supabase.service';

const penService = new PenSupabaseService();

export class PenSupabaseController {
  /**
   * GET /api/v1/pens
   * Lista todos os currais com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      type, 
      location, 
      isActive,
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as string,
      type: type as string,
      location: location as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await penService.findAll(filters, pagination);

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
   * GET /api/v1/pens/:id
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
   * GET /api/v1/pens/type/:type
   * Lista currais por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    
    const pens = await penService.findByType(type);

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /api/v1/pens/status/:status
   * Lista currais por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const pens = await penService.findByStatus(status);

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /api/v1/pens/active
   * Lista apenas currais ativos
   */
  async active(_req: Request, res: Response): Promise<void> {
    const pens = await penService.findActive();

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /api/v1/pens/available
   * Lista currais disponíveis (com capacidade)
   */
  async available(_req: Request, res: Response): Promise<void> {
    const pens = await penService.findAvailable();

    res.json({
      status: 'success',
      data: pens,
    });
  }

  /**
   * GET /api/v1/pens/occupancy
   * Retorna ocupação atual dos currais
   */
  async occupancy(_req: Request, res: Response): Promise<void> {
    const occupancy = await penService.getOccupancy();

    res.json({
      status: 'success',
      data: occupancy,
    });
  }

  /**
   * POST /api/v1/pens
   * Cria um novo curral
   */
  async create(req: Request, res: Response): Promise<void> {
    const pen = await penService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: pen,
      message: 'Curral criado com sucesso'
    });
  }

  /**
   * PUT /api/v1/pens/:id
   * Atualiza um curral
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const pen = await penService.update(id, req.body);

    res.json({
      status: 'success',
      data: pen,
      message: 'Curral atualizado com sucesso'
    });
  }

  /**
   * PATCH /api/v1/pens/:id/toggle
   * Ativa/desativa um curral
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const pen = await penService.toggleStatus(id, isActive);

    res.json({
      status: 'success',
      data: pen,
      message: `Curral ${isActive ? 'ativado' : 'desativado'} com sucesso`
    });
  }

  /**
   * DELETE /api/v1/pens/:id
   * Remove um curral
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
   * GET /api/v1/pens/stats
   * Retorna estatísticas dos currais
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await penService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
