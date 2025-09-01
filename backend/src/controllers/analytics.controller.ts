import { Request, Response } from 'express';
import { WeightBreakAnalysisService } from '../services/weightBreakAnalysis.service';
import { MortalityAnalysisService } from '../services/mortalityAnalysis.service';

const weightBreakService = new WeightBreakAnalysisService();
const mortalityService = new MortalityAnalysisService();

export class AnalyticsController {
  // ===== WEIGHT BREAK ENDPOINTS =====
  
  // Registrar quebra de peso
  async registerWeightBreak(req: Request, res: Response) {
    try {
      const result = await weightBreakService.registerWeightBreak(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Quebra de peso registrada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analisar padrões por região
  async getWeightBreakPatternsByRegion(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const period = startDate && endDate ? {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      } : undefined;

      const patterns = await weightBreakService.analyzeBreakPatternsByRegion(period);
      res.json({
        success: true,
        data: patterns
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analisar padrões por vendedor
  async getWeightBreakPatternsByVendor(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const patterns = await weightBreakService.analyzeBreakPatternsByVendor(vendorId);
      res.json({
        success: true,
        data: patterns
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Obter correlações
  async getWeightBreakCorrelations(req: Request, res: Response) {
    try {
      const correlations = await weightBreakService.analyzeCorrelations();
      res.json({
        success: true,
        data: correlations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Prever quebra esperada
  async predictWeightBreak(req: Request, res: Response) {
    try {
      const { vendorId, transportDistance, season } = req.body;
      const prediction = await weightBreakService.predictExpectedBreak(
        vendorId,
        transportDistance,
        season
      );
      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Gerar relatório customizado de quebra
  async generateWeightBreakReport(req: Request, res: Response) {
    try {
      const report = await weightBreakService.generateCustomReport(req.body);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ===== MORTALITY ENDPOINTS =====

  // Registrar mortalidade
  async registerMortality(req: Request, res: Response) {
    try {
      const result = await mortalityService.registerMortality(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Mortalidade registrada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analisar padrões de mortalidade
  async getMortalityPatterns(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const period = startDate && endDate ? {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      } : undefined;

      const patterns = await mortalityService.analyzeMortalityPatterns(period);
      res.json({
        success: true,
        data: patterns
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analisar correlações ambientais
  async getEnvironmentalCorrelations(req: Request, res: Response) {
    try {
      const correlations = await mortalityService.analyzeEnvironmentalCorrelations();
      res.json({
        success: true,
        data: correlations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analisar eficácia de tratamentos
  async getTreatmentEffectiveness(req: Request, res: Response) {
    try {
      const analysis = await mortalityService.analyzeTreatmentEffectiveness();
      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Prever risco de mortalidade
  async predictMortalityRisk(req: Request, res: Response) {
    try {
      const { cattlePurchaseId } = req.params;
      const prediction = await mortalityService.predictMortalityRisk(cattlePurchaseId);
      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Relatório de mortalidade por lote
  async getLotMortalityReport(req: Request, res: Response) {
    try {
      const { cattlePurchaseId } = req.params;
      const report = await mortalityService.generateLotMortalityReport(cattlePurchaseId);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // ===== COMBINED ANALYTICS =====

  // Dashboard de análise completa
  async getAnalyticsDashboard(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const dateRange = period === 'month' ? {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: new Date()
      } : period === 'year' ? {
        startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: new Date()
      } : undefined;

      // Buscar dados em paralelo
      const [
        weightBreakPatterns,
        mortalityPatterns,
        weightCorrelations,
        environmentalCorrelations
      ] = await Promise.all([
        weightBreakService.analyzeBreakPatternsByRegion(dateRange),
        mortalityService.analyzeMortalityPatterns(dateRange),
        weightBreakService.analyzeCorrelations(),
        mortalityService.analyzeEnvironmentalCorrelations()
      ]);

      res.json({
        success: true,
        data: {
          weightBreak: {
            patterns: weightBreakPatterns,
            correlations: weightCorrelations
          },
          mortality: {
            patterns: mortalityPatterns,
            environmental: environmentalCorrelations
          },
          period: period || 'all-time'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}