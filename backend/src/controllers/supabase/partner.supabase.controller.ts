import { Request, Response } from 'express';
import { PartnerSupabaseService } from '@/services/supabase/partner.supabase.service';

const partnerService = new PartnerSupabaseService();

export class PartnerSupabaseController {
  /**
   * GET /api/v1/partners
   * Lista todos os parceiros com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      partnerType, 
      documentType, 
      city, 
      state, 
      isActive,
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as string,
      partnerType: partnerType as string,
      documentType: documentType as string,
      city: city as string,
      state: state as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await partnerService.findAll(filters, pagination);

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
   * GET /api/v1/partners/:id
   * Busca um parceiro por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const partner = await partnerService.findById(id);

    res.json({
      status: 'success',
      data: partner,
    });
  }

  /**
   * GET /api/v1/partners/type/:partnerType
   * Lista parceiros por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { partnerType } = req.params;
    
    const partners = await partnerService.findByType(partnerType);

    res.json({
      status: 'success',
      data: partners,
    });
  }

  /**
   * GET /api/v1/partners/status/:status
   * Lista parceiros por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const partners = await partnerService.findByStatus(status);

    res.json({
      status: 'success',
      data: partners,
    });
  }

  /**
   * GET /api/v1/partners/active
   * Lista apenas parceiros ativos
   */
  async active(_req: Request, res: Response): Promise<void> {
    const partners = await partnerService.findActive();

    res.json({
      status: 'success',
      data: partners,
    });
  }

  /**
   * POST /api/v1/partners
   * Cria um novo parceiro
   */
  async create(req: Request, res: Response): Promise<void> {
    const partner = await partnerService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: partner,
      message: 'Parceiro criado com sucesso'
    });
  }

  /**
   * PUT /api/v1/partners/:id
   * Atualiza um parceiro
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const partner = await partnerService.update(id, req.body);

    res.json({
      status: 'success',
      data: partner,
      message: 'Parceiro atualizado com sucesso'
    });
  }

  /**
   * PATCH /api/v1/partners/:id/toggle
   * Ativa/desativa um parceiro
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const partner = await partnerService.toggleStatus(id, isActive);

    res.json({
      status: 'success',
      data: partner,
      message: `Parceiro ${isActive ? 'ativado' : 'desativado'} com sucesso`
    });
  }

  /**
   * DELETE /api/v1/partners/:id
   * Remove um parceiro
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await partnerService.delete(id);

    res.json({
      status: 'success',
      message: 'Parceiro removido com sucesso',
    });
  }

  /**
   * GET /api/v1/partners/stats
   * Retorna estatísticas dos parceiros
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await partnerService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
