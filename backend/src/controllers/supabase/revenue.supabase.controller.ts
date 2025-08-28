import { Request, Response } from 'express';
import { RevenueSupabaseService } from '@/services/supabase/revenue.supabase.service';

const revenueService = new RevenueSupabaseService();

export class RevenueSupabaseController {
  /**
   * GET /api/v1/revenues
   * Lista todas as receitas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      categoryId, 
      payerAccountId, 
      saleRecordId, 
      startDate, 
      endDate, 
      isReceived,
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as string,
      categoryId: categoryId as string,
      payerAccountId: payerAccountId as string,
      saleRecordId: saleRecordId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      isReceived: isReceived === 'true' ? true : isReceived === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await revenueService.findAll(filters, pagination);

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
   * GET /api/v1/revenues/:id
   * Busca uma receita por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const revenue = await revenueService.findById(id);

    res.json({
      status: 'success',
      data: revenue,
    });
  }

  /**
   * GET /api/v1/revenues/status/:status
   * Lista receitas por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const revenues = await revenueService.findByStatus(status);

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * GET /api/v1/revenues/category/:categoryId
   * Lista receitas por categoria
   */
  async byCategory(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params;
    
    const revenues = await revenueService.findByCategory(categoryId);

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * GET /api/v1/revenues/sale-record/:saleRecordId
   * Lista receitas por registro de venda
   */
  async bySaleRecord(req: Request, res: Response): Promise<void> {
    const { saleRecordId } = req.params;
    
    const revenues = await revenueService.findBySaleRecord(saleRecordId);

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * POST /api/v1/revenues
   * Cria uma nova receita
   */
  async create(req: Request, res: Response): Promise<void> {
    const revenue = await revenueService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: revenue,
      message: 'Receita criada com sucesso'
    });
  }

  /**
   * PUT /api/v1/revenues/:id
   * Atualiza uma receita
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const revenue = await revenueService.update(id, req.body);

    res.json({
      status: 'success',
      data: revenue,
      message: 'Receita atualizada com sucesso'
    });
  }

  /**
   * PATCH /api/v1/revenues/:id/receive
   * Marca uma receita como recebida
   */
  async markAsReceived(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { receivedValue, receivedDate } = req.body;
    
    const revenue = await revenueService.markAsReceived(id, receivedValue, receivedDate);

    res.json({
      status: 'success',
      data: revenue,
      message: 'Receita marcada como recebida'
    });
  }

  /**
   * DELETE /api/v1/revenues/:id
   * Remove uma receita
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await revenueService.delete(id);

    res.json({
      status: 'success',
      message: 'Receita removida com sucesso',
    });
  }

  /**
   * GET /api/v1/revenues/stats
   * Retorna estatísticas das receitas
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await revenueService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
