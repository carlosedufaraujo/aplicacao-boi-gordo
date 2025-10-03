import { useState, useEffect, useCallback } from 'react';
import integratedFinancialAnalysisService, { 
  IntegratedAnalysisResult, 
  DashboardData, 
  GenerateAnalysisRequest,
  CompareAnalysesParams,
  ComparisonResult
} from '@/services/api/integratedFinancialAnalysis';

import { toast } from 'sonner';
interface UseIntegratedAnalysisOptions {
  autoLoad?: boolean;
  defaultYear?: number;
}

export const useIntegratedFinancialAnalysis = (options: UseIntegratedAnalysisOptions = {}) => {
  const { autoLoad = false, defaultYear = new Date().getFullYear() } = options;
  
  // Estados principais
  const [currentAnalysis, setCurrentAnalysis] = useState<IntegratedAnalysisResult | null>(null);
  const [yearAnalyses, setYearAnalyses] = useState<IntegratedAnalysisResult[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null);
  
  /**
   * Gera nova análise integrada
   */
  const generateAnalysis = useCallback(async (request: GenerateAnalysisRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await integratedFinancialAnalysisService.generateAnalysis(request);
      
      setCurrentAnalysis(analysis);
      setSelectedPeriod({ year: request.year, month: request.month });
      
      // Atualizar lista do ano se necessário
      if (request.year === selectedYear) {
        await loadYearAnalyses(request.year);
      }
      
      toast({
        title: 'Análise Gerada',
        description: `Análise integrada de ${request.month}/${request.year} criada com sucesso.`,
      });
      
      return analysis;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao gerar análise';
      setError(errorMessage);
      
      toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      
      console.error('❌ Erro ao gerar análise:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [selectedYear, toast]);

  /**
   * Carrega análise por período específico
   */
  const loadAnalysisByPeriod = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const analysis = await integratedFinancialAnalysisService.getAnalysisByPeriod(year, month);
      
      setCurrentAnalysis(analysis);
      setSelectedPeriod({ year, month });
      
      return analysis;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar análise';
      setError(errorMessage);
      
      if (err.response?.status !== 404) {
        toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      }
      
      console.error('❌ Erro ao carregar análise:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Carrega análises de um ano
   */
  const loadYearAnalyses = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const analyses = await integratedFinancialAnalysisService.getAnalysesByYear(year);
      
      setYearAnalyses(analyses);
      setSelectedYear(year);
      
      return analyses;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar análises do ano';
      setError(errorMessage);
      
      toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      
      console.error('❌ Erro ao carregar análises do ano:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Carrega dashboard consolidado
   */
  const loadDashboard = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const dashboardData = await integratedFinancialAnalysisService.getDashboard(year);
      
      setDashboard(dashboardData);
      
      return dashboardData;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar dashboard';
      setError(errorMessage);
      
      toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      
      console.error('❌ Erro ao carregar dashboard:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Compara análises entre períodos
   */
  const compareAnalyses = useCallback(async (params: CompareAnalysesParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const comparisonResult = await integratedFinancialAnalysisService.compareAnalyses(params);
      
      setComparison(comparisonResult);
      
      return comparisonResult;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao comparar análises';
      setError(errorMessage);
      
      toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      
      console.error('❌ Erro ao comparar análises:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Limpa estados
   */
  const clearData = useCallback(() => {
    setCurrentAnalysis(null);
    setYearAnalyses([]);
    setDashboard(null);
    setComparison(null);
    setError(null);
    setSelectedPeriod(null);
  }, []);

  /**
   * Atualiza dados baseado no período selecionado
   */
  const refreshData = useCallback(async () => {
    if (selectedPeriod) {
      await loadAnalysisByPeriod(selectedPeriod.year, selectedPeriod.month);
    }
    
    await loadYearAnalyses(selectedYear);
    await loadDashboard(selectedYear);
  }, [selectedPeriod, selectedYear, loadAnalysisByPeriod, loadYearAnalyses, loadDashboard]);

  /**
   * Funções de utilidade
   */
  const hasAnalysisForPeriod = useCallback((year: number, month: number): boolean => {
    return yearAnalyses.some(analysis => {
      const analysisDate = new Date(analysis.referenceMonth);
      return analysisDate.getFullYear() === year && analysisDate.getMonth() + 1 === month;
    });
  }, [yearAnalyses]);

  const getAnalysisForPeriod = useCallback((year: number, month: number): IntegratedAnalysisResult | null => {
    return yearAnalyses.find(analysis => {
      const analysisDate = new Date(analysis.referenceMonth);
      return analysisDate.getFullYear() === year && analysisDate.getMonth() + 1 === month;
    }) || null;
  }, [yearAnalyses]);

  /**
   * Carrega todas as transações financeiras sem filtro
   */
  const loadAllTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await integratedFinancialAnalysisService.getAllTransactions();
      
      setAllTransactions(response);
      
      toast({
        title: 'Transações Carregadas',
        description: `${response.length} transações financeiras carregadas.`,
      });
      
      return response;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar transações';
      setError(errorMessage);
      
      toast.error(errorMessage ? `${'Erro'}: ${errorMessage}` : 'Erro');
      
      console.error('❌ Erro ao carregar transações:', err);
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-load inicial
  useEffect(() => {
    if (autoLoad) {
      loadYearAnalyses(selectedYear);
      loadDashboard(selectedYear);
    }
  }, [autoLoad, selectedYear, loadYearAnalyses, loadDashboard]);

  return {
    // Estados
    currentAnalysis,
    yearAnalyses,
    dashboard,
    comparison,
    loading,
    error,
    selectedYear,
    selectedPeriod,
    
    // Ações
    generateAnalysis,
    loadAnalysisByPeriod,
    loadYearAnalyses,
    loadDashboard,
    compareAnalyses,
    clearData,
    refreshData,
    
    // Setters
    setSelectedYear,
    setSelectedPeriod,
    
    // Utilidades
    hasAnalysisForPeriod,
    getAnalysisForPeriod,
    
    // Serviços
    formatCurrency: integratedFinancialAnalysisService.formatCurrency,
    formatPercentage: integratedFinancialAnalysisService.formatPercentage,
    calculateGrowth: integratedFinancialAnalysisService.calculateGrowth,
    getReconciliationStatus: integratedFinancialAnalysisService.getReconciliationStatus,
    getReconciliationColor: integratedFinancialAnalysisService.getReconciliationColor,
    calculateQualityIndicators: integratedFinancialAnalysisService.calculateQualityIndicators,
    allTransactions,
    loadAllTransactions,
  };
};
