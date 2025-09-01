import { Request, Response } from 'express';
import { SaleRecordService } from '@/services/saleRecord.service';

const saleRecordService = new SaleRecordService();

export class SaleRecordController {
  /**
   * GET /sale-records
   * Lista todos os registros de venda com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { purchaseId, buyerId, cycleId, status, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      purchaseId: purchaseId as string,
      buyerId: buyerId as string,
      cycleId: cycleId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const result = await saleRecordService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /sale-records/:id
   * Busca um registro de venda por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const saleRecord = await saleRecordService.findById(id);

    res.json({
      status: 'success',
      data: saleRecord,
    });
  }

  /**
   * GET /sale-records/stats
   * Retorna estatísticas gerais
   */
  async stats(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await saleRecordService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /sale-records/period
   * Lista vendas por período
   */
  async byPeriod(req: Request, res: Response): Promise<void> {
    const { startDate, endDate, buyerId, status } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        status: 'error',
        message: 'Período é obrigatório',
      });
      return;
    }

    const filters = {
      buyerId: buyerId as string,
      purchaseId: undefined,
      status: status as string,
    };

    const records = await saleRecordService.findByPeriod(
      new Date(startDate as string),
      new Date(endDate as string),
      filters
    );

    res.json({
      status: 'success',
      data: records,
    });
  }

  /**
   * GET /sale-records/cattle-lot/:purchaseId
   * Lista vendas por lote
   */
  async byCattleLot(req: Request, res: Response): Promise<void> {
    const { purchaseId } = req.params;
    
    const records = await saleRecordService.findByPurchase(purchaseId);

    res.json({
      status: 'success',
      data: records,
    });
  }

  /**
   * GET /sale-records/buyer/:buyerId
   * Lista vendas por comprador
   */
  async byBuyer(req: Request, res: Response): Promise<void> {
    const { buyerId } = req.params;
    
    const records = await saleRecordService.findByBuyer(buyerId);

    res.json({
      status: 'success',
      data: records,
    });
  }

  /**
   * GET /sale-records/summary
   * Retorna resumo das vendas
   */
  async summary(req: Request, res: Response): Promise<void> {
    const { purchaseId, buyerId, status, startDate, endDate } = req.query;

    const filters = {
      purchaseId: purchaseId as string,
      buyerId: buyerId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const summary = await saleRecordService.getSummary(filters);

    res.json({
      status: 'success',
      data: summary,
    });
  }

  /**
   * POST /sale-records
   * Cria um novo registro de venda
   */
  async create(req: Request, res: Response): Promise<void> {
    const saleRecord = await saleRecordService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: saleRecord,
    });
  }

  /**
   * PUT /sale-records/:id
   * Atualiza um registro de venda
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const saleRecord = await saleRecordService.update(id, req.body);

    res.json({
      status: 'success',
      data: saleRecord,
    });
  }

  /**
   * PATCH /sale-records/:id/status
   * Atualiza o status de um registro
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    
    const saleRecord = await saleRecordService.updateStatus(id, status);

    res.json({
      status: 'success',
      data: saleRecord,
    });
  }

  /**
   * DELETE /sale-records/:id
   * Remove um registro de venda
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await saleRecordService.delete(id);

    res.json({
      status: 'success',
      message: 'Registro de venda removido com sucesso',
    });
  }
}