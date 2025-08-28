import { Request, Response } from 'express';
import { SaleSupabaseService } from '@/services/supabase/sale.supabase.service';

export class SaleSupabaseController {
  private saleService: SaleSupabaseService;

  constructor() {
    this.saleService = new SaleSupabaseService();
  }

  async findAll(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as string,
        buyerId: req.query.buyerId as string,
        lotId: req.query.lotId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };

      const sales = await this.saleService.findAll(filters);

      res.json({
        status: 'success',
        data: sales,
        total: sales.length
      });
    } catch (error: any) {
      console.error('Erro no controller de vendas:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sale = await this.saleService.findById(id);

      if (!sale) {
        return res.status(404).json({
          status: 'error',
          message: 'Venda não encontrada'
        });
      }

      res.json({
        status: 'success',
        data: sale
      });
    } catch (error: any) {
      console.error('Erro no controller de venda:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado'
        });
      }

      const saleData = req.body;
      const sale = await this.saleService.create(saleData, userId);

      res.status(201).json({
        status: 'success',
        data: sale,
        message: 'Venda criada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de criação de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao criar venda'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const sale = await this.saleService.update(id, updates);

      res.json({
        status: 'success',
        data: sale,
        message: 'Venda atualizada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de atualização de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao atualizar venda'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.saleService.delete(id);

      res.json({
        status: 'success',
        message: 'Venda excluída com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de exclusão de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao excluir venda'
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.saleService.getStats();

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error: any) {
      console.error('Erro no controller de estatísticas de vendas:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao buscar estatísticas'
      });
    }
  }
}
