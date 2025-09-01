import { Request, Response } from 'express';
import { PartnerService } from '@/services/partner.service';
import { PartnerType } from '@prisma/client';

const partnerService = new PartnerService();

export class PartnerController {
  /**
   * GET /partners/:id/debug
   * Debug detalhado de um parceiro específico
   */
  async debug(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const debugInfo = await partnerService.getDebugInfo(id);
    
    res.json({
      status: 'success',
      data: debugInfo,
    });
  }
  /**
   * GET /partners
   * Lista todos os parceiros com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { type, isActive, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      type: type as PartnerType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const result = await partnerService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /partners/:id
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
   * GET /partners/stats
   * Retorna estatísticas gerais
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await partnerService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /partners/type/:type
   * Lista parceiros por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    
    const partners = await partnerService.findByType(type as PartnerType);

    res.json({
      status: 'success',
      data: partners,
    });
  }

  /**
   * POST /partners
   * Cria um novo parceiro
   */
  async create(req: Request, res: Response): Promise<void> {
    const partner = await partnerService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: partner,
    });
  }

  /**
   * PUT /partners/:id
   * Atualiza um parceiro
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const partner = await partnerService.update(id, req.body);

    res.json({
      status: 'success',
      data: partner,
    });
  }

  /**
   * DELETE /partners/:id
   * Remove ou inativa um parceiro
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
   * GET /partners/:id/stats
   * Retorna estatísticas do parceiro
   */
  async partnerStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const stats = await partnerService.getPartnerStats(id);

    res.json({
      status: 'success',
      data: stats,
    });
  }
} 