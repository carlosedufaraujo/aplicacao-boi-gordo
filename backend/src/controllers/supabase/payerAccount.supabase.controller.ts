import { Request, Response } from 'express';
import { PayerAccountSupabaseService } from '@/services/supabase/payerAccount.supabase.service';

const payerAccountService = new PayerAccountSupabaseService();

export class PayerAccountSupabaseController {
  /**
   * GET /api/v1/payer-accounts
   * Lista todas as contas pagadoras com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { 
      status, 
      accountType, 
      bankName, 
      isActive,
      search, 
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    const filters = {
      status: status as string,
      accountType: accountType as string,
      bankName: bankName as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await payerAccountService.findAll(filters, pagination);

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
   * GET /api/v1/payer-accounts/:id
   * Busca uma conta pagadora por ID
   */
  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const account = await payerAccountService.findById(id);

    res.json({
      status: 'success',
      data: account,
    });
  }

  /**
   * GET /api/v1/payer-accounts/status/:status
   * Lista contas por status
   */
  async byStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    
    const accounts = await payerAccountService.findByStatus(status);

    res.json({
      status: 'success',
      data: accounts,
    });
  }

  /**
   * GET /api/v1/payer-accounts/type/:accountType
   * Lista contas por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { accountType } = req.params;
    
    const accounts = await payerAccountService.findByType(accountType);

    res.json({
      status: 'success',
      data: accounts,
    });
  }

  /**
   * GET /api/v1/payer-accounts/active
   * Lista apenas contas ativas
   */
  async active(_req: Request, res: Response): Promise<void> {
    const accounts = await payerAccountService.findActive();

    res.json({
      status: 'success',
      data: accounts,
    });
  }

  /**
   * POST /api/v1/payer-accounts
   * Cria uma nova conta pagadora
   */
  async create(req: Request, res: Response): Promise<void> {
    const account = await payerAccountService.create(req.body, req.user!.id);

    res.status(201).json({
      status: 'success',
      data: account,
      message: 'Conta pagadora criada com sucesso'
    });
  }

  /**
   * PUT /api/v1/payer-accounts/:id
   * Atualiza uma conta pagadora
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const account = await payerAccountService.update(id, req.body);

    res.json({
      status: 'success',
      data: account,
      message: 'Conta pagadora atualizada com sucesso'
    });
  }

  /**
   * PATCH /api/v1/payer-accounts/:id/balance
   * Atualiza o saldo de uma conta
   */
  async updateBalance(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { balance, operation } = req.body;
    
    const account = await payerAccountService.updateBalance(id, balance, operation);

    res.json({
      status: 'success',
      data: account,
      message: 'Saldo atualizado com sucesso'
    });
  }

  /**
   * PATCH /api/v1/payer-accounts/:id/toggle
   * Ativa/desativa uma conta
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const account = await payerAccountService.toggleStatus(id, isActive);

    res.json({
      status: 'success',
      data: account,
      message: `Conta ${isActive ? 'ativada' : 'desativada'} com sucesso`
    });
  }

  /**
   * DELETE /api/v1/payer-accounts/:id
   * Remove uma conta pagadora
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await payerAccountService.delete(id);

    res.json({
      status: 'success',
      message: 'Conta pagadora removida com sucesso',
    });
  }

  /**
   * GET /api/v1/payer-accounts/stats
   * Retorna estatísticas das contas
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await payerAccountService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }
}
