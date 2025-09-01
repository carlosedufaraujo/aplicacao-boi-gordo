import { Request, Response } from 'express';
import { SaleService } from '@/services/sale.service';

const saleService = new SaleService();

export class SaleController {
  /**
   * GET /sales
   * Lista todas as vendas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status,
      buyerId,
      lotId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {
      status: status as any,
      buyerId: buyerId as string,
      lotId: lotId as string,
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

    const result = await saleService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /sales/:id
   * Busca uma venda por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const sale = await saleService.findById(id);

    res.json({
      status: 'success',
      data: sale,
    });
  }

  /**
   * GET /sales/by-status/:status
   * Lista vendas por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const sales = await saleService.findByStatus(status as any);

    res.json({
      status: 'success',
      data: sales,
    });
  }

  /**
   * GET /sales/by-lot/:lotId
   * Lista vendas de um lote
   */
  async byLot(req: Request, res: Response): Promise<void> {
    const { lotId } = req.params;
    
    const sales = await saleService.findByLot(lotId);

    res.json({
      status: 'success',
      data: sales,
    });
  }

  /**
   * POST /sales
   * Cria uma nova venda
   */
  async create(req: Request, res: Response): Promise<void> {
    const sale = await saleService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: sale,
    });
  }

  /**
   * PUT /sales/:id
   * Atualiza uma venda
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const sale = await saleService.update(id, req.body);

    res.json({
      status: 'success',
      data: sale,
    });
  }

  /**
   * PATCH /sales/:id/status
   * Atualiza o status de uma venda
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;
    
    const sale = await saleService.updateStatus(id, status);

    res.json({
      status: 'success',
      data: sale,
      message: `Status atualizado para ${status}`,
    });
  }

  /**
   * DELETE /sales/:id
   * Remove uma venda
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await saleService.delete(id);

    res.json({
      status: 'success',
      message: 'Venda removida com sucesso',
    });
  }

  /**
   * GET /sales/statistics
   * Retorna estatísticas de vendas
   */
  async statistics(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await saleService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /sales/profitability/:lotId
   * Retorna análise de lucratividade de um lote
   */
  async profitability(req: Request, res: Response): Promise<void> {
    const { lotId } = req.params;
    
    const profitability = await saleService.getProfitability(lotId);

    res.json({
      status: 'success',
      data: profitability,
    });
  }

  /**
   * GET /sales/period
   * Lista vendas por período
   */
  async byPeriod(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        status: 'error',
        message: 'Datas de início e fim são obrigatórias',
      });
      return;
    }

    const sales = await saleService.getSalesByPeriod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: sales,
    });
  }
} 