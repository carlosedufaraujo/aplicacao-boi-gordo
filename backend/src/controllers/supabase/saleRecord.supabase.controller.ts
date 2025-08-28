import { Request, Response } from 'express';
import { SaleRecordSupabaseService } from '@/services/supabase/saleRecord.supabase.service';

export class SaleRecordSupabaseController {
  private saleRecordService: SaleRecordSupabaseService;

  constructor() {
    this.saleRecordService = new SaleRecordSupabaseService();
  }

  async findAll(req: Request, res: Response) {
    try {
      const filters = {
        lotId: req.query.lotId as string,
        slaughterhouseId: req.query.slaughterhouseId as string,
        animalType: req.query.animalType as string,
        paymentType: req.query.paymentType as string,
        reconciled: req.query.reconciled === 'true' ? true : req.query.reconciled === 'false' ? false : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };

      const records = await this.saleRecordService.findAll(filters);

      res.json({
        status: 'success',
        data: records,
        total: records.length
      });
    } catch (error: any) {
      console.error('Erro no controller de registros de venda:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const record = await this.saleRecordService.findById(id);

      if (!record) {
        return res.status(404).json({
          status: 'error',
          message: 'Registro de venda não encontrado'
        });
      }

      res.json({
        status: 'success',
        data: record
      });
    } catch (error: any) {
      console.error('Erro no controller de registro de venda:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const recordData = req.body;
      const record = await this.saleRecordService.create(recordData);

      res.status(201).json({
        status: 'success',
        data: record,
        message: 'Registro de venda criado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de criação de registro de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao criar registro de venda'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const record = await this.saleRecordService.update(id, updates);

      res.json({
        status: 'success',
        data: record,
        message: 'Registro de venda atualizado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de atualização de registro de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao atualizar registro de venda'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.saleRecordService.delete(id);

      res.json({
        status: 'success',
        message: 'Registro de venda excluído com sucesso'
      });
    } catch (error: any) {
      console.error('Erro no controller de exclusão de registro de venda:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Erro ao excluir registro de venda'
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.saleRecordService.getStats();

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error: any) {
      console.error('Erro no controller de estatísticas de registros de venda:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao buscar estatísticas'
      });
    }
  }
}
