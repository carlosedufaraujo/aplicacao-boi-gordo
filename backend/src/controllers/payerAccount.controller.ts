import { Request, Response } from 'express';
import { PayerAccountService } from '@/services/payerAccount.service';
import { AccountType } from '@prisma/client';

const payerAccountService = new PayerAccountService();

export class PayerAccountController {
  /**
   * GET /payer-accounts
   * Lista todas as contas com filtros
   */
  async index(req: Request, res: Response): Promise<void> {
    const { accountType, isActive, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      accountType: accountType as AccountType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc' || 'desc',
    };

    const result = await payerAccountService.findAll(filters, pagination);

    res.json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /payer-accounts/:id
   * Busca uma conta por ID
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
   * GET /payer-accounts/stats
   * Retorna estatísticas gerais
   */
  async stats(_req: Request, res: Response): Promise<void> {
    const stats = await payerAccountService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /payer-accounts/type/:type
   * Lista contas por tipo
   */
  async byType(req: Request, res: Response): Promise<void> {
    const { type } = req.params;
    
    const accounts = await payerAccountService.findByType(type as AccountType);

    res.json({
      status: 'success',
      data: accounts,
    });
  }

  /**
   * POST /payer-accounts
   * Cria uma nova conta
   */
  async create(req: Request, res: Response): Promise<void> {
    const account = await payerAccountService.create(req.body);

    res.status(201).json({
      status: 'success',
      data: account,
    });
  }

  /**
   * PUT /payer-accounts/:id
   * Atualiza uma conta
   */
  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const account = await payerAccountService.update(id, req.body);

    res.json({
      status: 'success',
      data: account,
    });
  }

  /**
   * POST /payer-accounts/:id/balance
   * Atualiza o saldo de uma conta
   */
  async updateBalance(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { amount, operation } = req.body;
    
    const account = await payerAccountService.updateBalance(id, amount, operation);

    res.json({
      status: 'success',
      data: account,
    });
  }

  /**
   * DELETE /payer-accounts/:id
   * Remove ou inativa uma conta
   */
  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    await payerAccountService.delete(id);

    res.json({
      status: 'success',
      message: 'Conta removida com sucesso',
    });
  }

  /**
   * GET /payer-accounts/:id/stats
   * Retorna estatísticas da conta
   */
  async accountStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const stats = await payerAccountService.getAccountStats(id);

    res.json({
      status: 'success',
      data: stats,
    });
  }

  /**
   * GET /payer-accounts/:id/transactions
   * Retorna transações da conta
   */
  async transactions(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const transactions = await payerAccountService.getTransactions(
      id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      status: 'success',
      data: transactions,
    });
  }
} 