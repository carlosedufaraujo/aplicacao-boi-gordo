import { useState, useCallback } from 'react';
import { api } from '@/services/api';

// Tipos para Weight Break
export interface WeightBreakRegistration {
  cattlePurchaseId: string;
  receivedWeight: number;
  transportConditions?: {
    distance?: number;
    duration?: number;
    temperature?: number;
    weatherConditions?: string;
    roadConditions?: string;
  };
  notes?: string;
}

export interface WeightBreakPattern {
  region: string;
  averageBreak: number;
  sampleSize: number;
  standardDeviation: number;
  minBreak: number;
  maxBreak: number;
}

export interface WeightBreakPrediction {
  expectedBreak: number;
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  rangeMin: number;
  rangeMax: number;
}

// Tipos para Mortality
export interface MortalityRegistration {
  cattlePurchaseId: string;
  penId?: string;
  phase: 'transport' | 'reception' | 'confinement';
  quantity: number;
  mortalityDate: Date;
  averageWeight?: number;
  cause?: string;
  symptoms?: string;
  veterinaryDiagnosis?: string;
  treatmentAttempted?: boolean;
  treatmentCost?: number;
  environmentalConditions?: {
    temperature?: number;
    humidity?: number;
    weatherConditions?: string;
  };
  notes?: string;
}

export interface MortalityPattern {
  phase: string;
  totalEvents: number;
  totalDeaths: number;
  totalLoss: number;
  averageRate: number;
}

export interface MortalityRiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  expectedMortalityRate: number;
  factors: {
    vendorHistoricalRate: number;
    seasonalAverageRate: number;
    transportDistance: number;
  };
  recommendations: string[];
}

// Dashboard types
export interface AnalyticsDashboard {
  weightBreak: {
    patterns: WeightBreakPattern[];
    correlations: any;
  };
  mortality: {
    patterns: MortalityPattern[];
    environmental: any;
  };
  period: string;
}

export const useAnalyticsApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== WEIGHT BREAK FUNCTIONS =====
  
  const registerWeightBreak = useCallback(async (data: WeightBreakRegistration) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/analytics/weight-break/register', data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar quebra de peso');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeightBreakPatternsByRegion = useCallback(async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const params = startDate && endDate ? { startDate, endDate } : {};
      const response = await api.get('/analytics/weight-break/patterns/region', { params });
      return response.data.data as WeightBreakPattern[];
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar padrões por região');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeightBreakPatternsByVendor = useCallback(async (vendorId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = vendorId 
        ? `/analytics/weight-break/patterns/vendor/${vendorId}`
        : '/analytics/weight-break/patterns/vendor';
      const response = await api.get(url);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar padrões por vendedor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeightBreakCorrelations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/analytics/weight-break/correlations');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar correlações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictWeightBreak = useCallback(async (
    vendorId: string,
    transportDistance: number,
    season: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/analytics/weight-break/predict', {
        vendorId,
        transportDistance,
        season
      });
      return response.data.data as WeightBreakPrediction;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao prever quebra');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateWeightBreakReport = useCallback(async (filters: {
    startDate?: Date;
    endDate?: Date;
    vendorIds?: string[];
    regions?: string[];
    minBreak?: number;
    maxBreak?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/analytics/weight-break/report', filters);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar relatório');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== MORTALITY FUNCTIONS =====

  const registerMortality = useCallback(async (data: MortalityRegistration) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/analytics/mortality/register', data);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar mortalidade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMortalityPatterns = useCallback(async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const params = startDate && endDate ? { startDate, endDate } : {};
      const response = await api.get('/analytics/mortality/patterns', { params });
      
      const result = response.data as {
        phasePatterns: MortalityPattern[];
        topCauses: any[];
      };
      
      return result;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar padrões de mortalidade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEnvironmentalCorrelations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/analytics/mortality/environmental');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar correlações ambientais');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTreatmentEffectiveness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/analytics/mortality/treatments');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar eficácia de tratamentos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictMortalityRisk = useCallback(async (cattlePurchaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/analytics/mortality/risk/${cattlePurchaseId}`);
      return response.data.data as MortalityRiskPrediction;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao prever risco de mortalidade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLotMortalityReport = useCallback(async (cattlePurchaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/analytics/mortality/report/${cattlePurchaseId}`);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar relatório de mortalidade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== DASHBOARD =====

  const getAnalyticsDashboard = useCallback(async (period?: 'month' | 'year' | 'all-time') => {
    setLoading(true);
    setError(null);
    try {
      const params = period ? { period } : {};
      const response = await api.get('/analytics/dashboard', { params });
      return response.data.data as AnalyticsDashboard;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao buscar dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    
    // Weight Break functions
    registerWeightBreak,
    getWeightBreakPatternsByRegion,
    getWeightBreakPatternsByVendor,
    getWeightBreakCorrelations,
    predictWeightBreak,
    generateWeightBreakReport,
    
    // Mortality functions
    registerMortality,
    getMortalityPatterns,
    getEnvironmentalCorrelations,
    getTreatmentEffectiveness,
    predictMortalityRisk,
    getLotMortalityReport,
    
    // Dashboard
    getAnalyticsDashboard
  };
};