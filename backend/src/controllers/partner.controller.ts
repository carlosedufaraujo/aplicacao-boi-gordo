import { Request, Response } from 'express';
import { PartnerService } from '@/services/partner.service';
import { PartnerType } from '@prisma/client';

const partnerService = new PartnerService();

export class PartnerController {
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
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
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
  async stats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const stats = await partnerService.getStats(id);

    res.json({
      status: 'success',
      data: stats,
    });
  }
} 