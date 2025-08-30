import { Request, Response } from 'express';
import { ExpenseService } from '@/services/expense.service';

const expenseService = new ExpenseService();

export class ExpenseController {
  /**
   * GET /expenses
   * Lista todas as despesas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      category,
      costCenterId,
      isPaid,
      impactsCashFlow,
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
      category: category as string,
      costCenterId: costCenterId as string,
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
      impactsCashFlow: impactsCashFlow === 'true' ? true : impactsCashFlow === 'false' ? false : undefined,
      lotId: lotId as string,
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

    const result = await expenseService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /expenses/:id
   * Busca uma despesa por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const expense = await expenseService.findById(id);

    res.json({
      status: 'success',
      data: expense,
    });
  }

  /**
   * GET /expenses/stats
   * Retorna estatísticas gerais de despesas
   */
  async stats(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await expenseService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /expenses/pending
   * Lista despesas pendentes
   */
  async pending(req: Request, res: Response): Promise<void> {
    const { daysAhead } = req.query;
    
    const expenses = await expenseService.findPending(
      daysAhead ? parseInt(daysAhead as string) : undefined
    );

    res.json({
      status: 'success',
      data: expenses,
    });
  }

  /**
   * GET /expenses/overdue
   * Lista despesas vencidas
   */
  async overdue(_req: Request, res: Response): Promise<void> {
    const expenses = await expenseService.findOverdue();

    res.json({
      status: 'success',
      data: expenses,
    });
  }

  /**
   * POST /expenses
   * Cria uma nova despesa
   */
  async create(req: Request, res: Response): Promise<void> {
    const { allocations, ...expenseData } = req.body;
    
    const expense = await expenseService.create(
      expenseData,
      req.user!.id,
      allocations
    );

    res.status(201).json({
      status: 'success',
      data: expense,
    });
  }

  /**
   * PUT /expenses/:id
   * Atualiza uma despesa
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const expense = await expenseService.update(id, req.body);

    res.json({
      status: 'success',
      data: expense,
    });
  }

  /**
   * POST /expenses/:id/pay
   * Marca despesa como paga
   */
  async pay(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const expense = await expenseService.pay(id, req.body);

    res.json({
      status: 'success',
      data: expense,
      message: 'Despesa paga com sucesso',
    });
  }

  /**
   * DELETE /expenses/:id
   * Remove uma despesa
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await expenseService.delete(id);

    res.json({
      status: 'success',
      message: 'Despesa removida com sucesso',
    });
  }

  /**
   * GET /expenses/stats/category
   * Retorna estatísticas por categoria
   */
  async statsByCategory(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await expenseService.getStatsByCategory(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /expenses/stats/cost-center
   * Retorna estatísticas por centro de custo
   */
  async statsByCostCenter(req: Request, res: Response): Promise<void> {
    const { startDate, endDate } = req.query;
    
    const stats = await expenseService.getStatsByCostCenter(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /expenses/summary
   * Retorna resumo das despesas
   */
  async summary(req: Request, res: Response): Promise<void> {
    const { 
      category,
      costCenterId,
      lotId,
      startDate,
      endDate
    } = req.query;

    const filters = {
      category: category as string,
      costCenterId: costCenterId as string,
      lotId: lotId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const summary = await expenseService.getSummary(filters);

    res.json({
      status: 'success',
      data: summary,
    });
  }
} 