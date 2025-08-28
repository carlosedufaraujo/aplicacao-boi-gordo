import { Request, Response } from 'express';
import { RevenueService } from '@/services/revenue.service';

const revenueService = new RevenueService();

export class RevenueController {
  /**
   * GET /revenues
   * Lista todas as receitas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      category,
      costCenterId,
      isReceived,
      saleRecordId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {
      category: category as string,
      costCenterId: costCenterId as string,
      isReceived: isReceived === 'true' ? true : isReceived === 'false' ? false : undefined,
      saleRecordId: saleRecordId as string,
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

    const result = await revenueService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /revenues/:id
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
   * GET /revenues/pending
   * Lista receitas pendentes
   */
  async pending(req: Request, res: Response): Promise<void> {
    const { daysAhead } = req.query;
    
    const revenues = await revenueService.findPending(
      daysAhead ? parseInt(daysAhead as string) : undefined
    );

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * GET /revenues/overdue
   * Lista receitas vencidas
   */
  async overdue(_req: Request, res: Response): Promise<void> {
    const revenues = await revenueService.findOverdue();

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * GET /revenues/recurring
   * Lista receitas recorrentes identificadas
   */
  async recurring(_req: Request, res: Response): Promise<void> {
    const revenues = await revenueService.getMonthlyRecurring();

    res.json({
      status: 'success',
      data: revenues,
    });
  }

  /**
   * POST /revenues
   * Cria uma nova receita
   */
  async create(req: Request, res: Response): Promise<void> {
    const { allocations, ...revenueData } = req.body;
    
    const revenue = await revenueService.create(
      revenueData,
      req.user!.id,
      allocations
    );

    res.status(201).json({
      status: 'success',
      data: revenue,
    });
  }

  /**
   * PUT /revenues/:id
   * Atualiza uma receita
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const revenue = await revenueService.update(id, req.body);

    res.json({
      status: 'success',
      data: revenue,
    });
  }

  /**
   * POST /revenues/:id/receive
   * Marca receita como recebida
   */
  async receive(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const revenue = await revenueService.receive(id, req.body);

    res.json({
      status: 'success',
      data: revenue,
      message: 'Receita recebida com sucesso',
    });
  }

  /**
   * DELETE /revenues/:id
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
   * GET /revenues/stats/category
   * Retorna estatísticas por categoria
   */
  async statsByCategory(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await revenueService.getStatsByCategory(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /revenues/stats/cost-center
   * Retorna estatísticas por centro de custo
   */
  async statsByCostCenter(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await revenueService.getStatsByCostCenter(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /revenues/summary
   * Retorna resumo das receitas
   */
  async summary(req: Request, res: Response): Promise<void> {
    const { 
      category,
      costCenterId,
      saleRecordId,
      startDate,
      endDate
    } = req.query;

    const filters = {
      category: category as string,
      costCenterId: costCenterId as string,
      saleRecordId: saleRecordId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const summary = await revenueService.getSummary(filters);

    res.json({
      status: 'success',
      data: summary,
    });
  }

  /**
   * GET /revenues/projection
   * Retorna projeção de receitas futuras
   */
  async projection(req: Request, res: Response): Promise<void> {
    const { months } = req.query;
    
    const projection = await revenueService.getProjection(
      months ? parseInt(months as string) : undefined
    );

    res.json({
      status: 'success',
      data: projection,
    });
  }
} 