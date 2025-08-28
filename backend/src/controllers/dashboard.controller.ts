import { Request, Response } from 'express';
import { DashboardService } from '@/services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  /**
   * GET /dashboard/metrics
   * Retorna métricas principais do dashboard
   */
  async metrics(_req: Request, res: Response): Promise<void> {
    const metrics = await dashboardService.getMetrics();

    res.json({
      status: 'success',
      data: metrics,
    });
  }

  /**
   * GET /dashboard/charts
   * Retorna dados para gráficos do dashboard
   */
  async charts(req: Request, res: Response): Promise<void> {
    const { period = 'month' } = req.query;

    const charts = await dashboardService.getCharts(period as any);

    res.json({
      status: 'success',
      data: charts,
    });
  }

  /**
   * GET /dashboard/alerts
   * Retorna alertas e notificações
   */
  async alerts(_req: Request, res: Response): Promise<void> {
    const alerts = await dashboardService.getAlerts();

    res.json({
      status: 'success',
      data: alerts,
    });
  }

  /**
   * GET /dashboard
   * Retorna todos os dados do dashboard
   */
  async index(req: Request, res: Response): Promise<void> {
    const { period = 'month' } = req.query;

    const [metrics, charts, alerts] = await Promise.all([
      dashboardService.getMetrics(),
      dashboardService.getCharts(period as any),
      dashboardService.getAlerts(),
    ]);

    res.json({
      status: 'success',
      data: {
        metrics,
        charts,
        alerts,
        lastUpdate: new Date(),
      },
    });
  }
} 