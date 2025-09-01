import { Request, Response } from 'express';
import { costCenterService } from '@/services/costCenter.service';
import { catchAsync } from '@/utils/catchAsync';

export class CostCenterController {
  index = catchAsync(async (_req: Request, res: Response) => {
    const costCenters = await costCenterService.findAll();
    
    res.json({
      status: 'success',
      data: costCenters,
    });
  });

  show = catchAsync(async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const costCenter = await costCenterService.findById(id);
    
    if (!costCenter) {
      return res.status(404).json({
        status: 'error',
        message: 'Centro de custo não encontrado',
      });
    }
    
    res.json({
      status: 'success',
      data: costCenter,
    });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const costCenter = await costCenterService.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: costCenter,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const costCenter = await costCenterService.update(id, req.body);
    
    res.json({
      status: 'success',
      data: costCenter,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await costCenterService.delete(id);
    
    res.json({
      status: 'success',
      message: 'Centro de custo desativado com sucesso',
    });
  });

  stats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await costCenterService.getStats();
    
    res.json({
      status: 'success',
      data: stats,
    });
  });
}