import { Request, Response } from 'express';
import { CattleLotSupabaseService } from '@/services/supabase/cattleLot.supabase.service';

const cattleLotService = new CattleLotSupabaseService();

export class CattleLotSupabaseController {
  /**
   * GET /api/v1/cattle-lots
   * Lista todos os lotes com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      healthStatus, 
      purchaseOrderId, 
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
      healthStatus: healthStatus as string,
      purchaseOrderId: purchaseOrderId as string,
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

    const result = await cattleLotService.findAll(filters, pagination);

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
   * GET /api/v1/cattle-lots/:id
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
   * GET /api/v1/cattle-lots/status/:status
   * Lista lotes por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const lots = await cattleLotService.findByStatus(status);

    res.json({
      status: 'success',
      data: lots,
    });
  }

  /**
   * GET /api/v1/cattle-lots/purchase-order/:purchaseOrderId
   * Lista lotes por ordem de compra
   */
  async byPurchaseOrder(req: Request, res: Response): Promise<void> {
    const { purchaseOrderId } = req.params;
    
    const lots = await cattleLotService.findByPurchaseOrder(purchaseOrderId);

    res.json({
      status: 'success',
      data: lots,
    });
  }

  /**
   * POST /api/v1/cattle-lots
   * Cria um novo lote
   */
  async create(req: Request, res: Response): Promise<void> {
    const lot = await cattleLotService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: lot,
      message: 'Lote de gado criado com sucesso'
    });
  }

  /**
   * PUT /api/v1/cattle-lots/:id
   * Atualiza um lote
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const lot = await cattleLotService.update(id, req.body);

    res.json({
      status: 'success',
      data: lot,
      message: 'Lote de gado atualizado com sucesso'
    });
  }

  /**
   * POST /api/v1/cattle-lots/:id/allocate
   * Aloca animais em currais
   */
  async allocateToPens(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { allocations } = req.body;
    
    const result = await cattleLotService.allocateToPens(id, allocations);

    res.json({
      status: 'success',
      data: result,
      message: 'Animais alocados com sucesso'
    });
  }

  /**
   * DELETE /api/v1/cattle-lots/:id
   * Remove um lote
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await cattleLotService.delete(id);

    res.json({
      status: 'success',
      message: 'Lote de gado removido com sucesso',
    });
  }

  /**
   * GET /api/v1/cattle-lots/stats
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
