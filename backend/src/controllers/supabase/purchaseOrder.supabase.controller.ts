import { Request, Response } from 'express';
import { PurchaseOrderSupabaseService } from '@/services/supabase/purchaseOrder.supabase.service';

const purchaseOrderService = new PurchaseOrderSupabaseService();

export class PurchaseOrderSupabaseController {
  /**
   * GET /api/v1/purchase-orders
   * Lista todas as ordens com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      currentStage, 
      vendorId, 
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
      currentStage: currentStage as string,
      vendorId: vendorId as string,
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

    const result = await purchaseOrderService.findAll(filters, pagination);

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
   * GET /api/v1/purchase-orders/:id
   * Busca uma ordem por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const order = await purchaseOrderService.findById(id);

    res.json({
      status: 'success',
      data: order,
    });
  }

  /**
   * GET /api/v1/purchase-orders/status/:status
   * Lista ordens por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const orders = await purchaseOrderService.findByStatus(status);

    res.json({
      status: 'success',
      data: orders,
    });
  }

  /**
   * GET /api/v1/purchase-orders/stage/:stage
   * Lista ordens por etapa
   */
  async byStage(req: Request, res: Response): Promise<void> {
    const { stage } = req.params;
    
    const orders = await purchaseOrderService.findByStage(stage);

    res.json({
      status: 'success',
      data: orders,
    });
  }

  /**
   * POST /api/v1/purchase-orders
   * Cria uma nova ordem
   */
  async create(req: Request, res: Response): Promise<void> {
    const order = await purchaseOrderService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: order,
      message: 'Ordem de compra criada com sucesso'
    });
  }

  /**
   * PUT /api/v1/purchase-orders/:id
   * Atualiza uma ordem
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const order = await purchaseOrderService.update(id, req.body);

    res.json({
      status: 'success',
      data: order,
      message: 'Ordem de compra atualizada com sucesso'
    });
  }

  /**
   * PATCH /api/v1/purchase-orders/:id/stage
   * Atualiza a etapa de uma ordem
   */
  async updateStage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { stage } = req.body;
    
    const order = await purchaseOrderService.updateStage(id, stage);

    res.json({
      status: 'success',
      data: order,
      message: 'Etapa atualizada com sucesso'
    });
  }

  /**
   * DELETE /api/v1/purchase-orders/:id
   * Remove uma ordem
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await purchaseOrderService.delete(id);

    res.json({
      status: 'success',
      message: 'Ordem de compra removida com sucesso',
    });
  }

  /**
   * GET /api/v1/purchase-orders/stats
   * Retorna estatísticas das ordens
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await purchaseOrderService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
