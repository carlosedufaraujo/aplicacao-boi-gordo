import { Request, Response } from 'express';
import { ExpenseSupabaseService } from '@/services/supabase/expense.supabase.service';

const expenseService = new ExpenseSupabaseService();

export class ExpenseSupabaseController {
  /**
   * GET /api/v1/expenses
   * Lista todas as despesas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      categoryId, 
      payerAccountId, 
      purchaseOrderId, 
      startDate, 
      endDate, 
      isPaid,
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
      purchaseOrderId: purchaseOrderId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      isPaid: isPaid === 'true' ? true : isPaid === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await expenseService.findAll(filters, pagination);

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
   * GET /api/v1/expenses/:id
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
   * GET /api/v1/expenses/status/:status
   * Lista despesas por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const expenses = await expenseService.findByStatus(status);

    res.json({
      status: 'success',
      data: expenses,
    });
  }

  /**
   * GET /api/v1/expenses/category/:categoryId
   * Lista despesas por categoria
   */
  async byCategory(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params;
    
    const expenses = await expenseService.findByCategory(categoryId);

    res.json({
      status: 'success',
      data: expenses,
    });
  }

  /**
   * GET /api/v1/expenses/purchase-order/:purchaseOrderId
   * Lista despesas por ordem de compra
   */
  async byPurchaseOrder(req: Request, res: Response): Promise<void> {
    const { purchaseOrderId } = req.params;
    
    const expenses = await expenseService.findByPurchaseOrder(purchaseOrderId);

    res.json({
      status: 'success',
      data: expenses,
    });
  }

  /**
   * POST /api/v1/expenses
   * Cria uma nova despesa
   */
  async create(req: Request, res: Response): Promise<void> {
    const expense = await expenseService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: expense,
      message: 'Despesa criada com sucesso'
    });
  }

  /**
   * PUT /api/v1/expenses/:id
   * Atualiza uma despesa
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const expense = await expenseService.update(id, req.body);

    res.json({
      status: 'success',
      data: expense,
      message: 'Despesa atualizada com sucesso'
    });
  }

  /**
   * PATCH /api/v1/expenses/:id/pay
   * Marca uma despesa como paga
   */
  async markAsPaid(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { paidValue, paidDate } = req.body;
    
    const expense = await expenseService.markAsPaid(id, paidValue, paidDate);

    res.json({
      status: 'success',
      data: expense,
      message: 'Despesa marcada como paga'
    });
  }

  /**
   * DELETE /api/v1/expenses/:id
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
   * GET /api/v1/expenses/stats
   * Retorna estatísticas das despesas
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await expenseService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
