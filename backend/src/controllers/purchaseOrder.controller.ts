import { Request, Response } from 'express';
import { PurchaseOrderService } from '@/services/purchaseOrder.service';
import { PurchaseOrderStatus } from '@prisma/client';

const purchaseOrderService = new PurchaseOrderService();

export class PurchaseOrderController {
  /**
   * GET /purchase-orders
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
      status: status as PurchaseOrderStatus,
      currentStage: currentStage as string,
      vendorId: vendorId as string,
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

    const result = await purchaseOrderService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /purchase-orders/:id
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
   * GET /purchase-orders/status/:status
   * Lista ordens por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const orders = await purchaseOrderService.findByStatus(status as PurchaseOrderStatus);

    res.json({
      status: 'success',
      data: orders,
    });
  }

  /**
   * GET /purchase-orders/stage/:stage
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
   * POST /purchase-orders
   * Cria uma nova ordem
   */
  async create(req: Request, res: Response): Promise<void> {
    const order = await purchaseOrderService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: order,
    });
  }

  /**
   * PUT /purchase-orders/:id
   * Atualiza uma ordem
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const order = await purchaseOrderService.update(id, req.body);

    res.json({
      status: 'success',
      data: order,
    });
  }

  /**
   * PATCH /purchase-orders/:id/stage
   * Atualiza a etapa de uma ordem
   */
  async updateStage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { stage } = req.body;
    
    const order = await purchaseOrderService.updateStage(id, stage);

    res.json({
      status: 'success',
      data: order,
    });
  }

  /**
   * POST /purchase-orders/:id/reception
   * Registra a recepção de uma ordem
   */
  async registerReception(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const order = await purchaseOrderService.registerReception(id, req.body);

    res.json({
      status: 'success',
      data: order,
      message: 'Recepção registrada e lote criado com sucesso',
    });
  }

  /**
   * DELETE /purchase-orders/:id
   * Remove ou cancela uma ordem
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await purchaseOrderService.delete(id);

    res.json({
      status: 'success',
      message: 'Ordem removida com sucesso',
    });
  }

  /**
   * GET /purchase-orders/stats
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