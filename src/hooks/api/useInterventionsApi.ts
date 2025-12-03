import { useState, useCallback } from 'react';
import { api as apiClient } from '@/services/api';
import { toast } from 'sonner';

// Tipos para as intervenções
export interface HealthInterventionData {
  cattlePurchaseId: string;
  penId: string;
  interventionType: 'vaccine' | 'medication' | 'treatment';
  productName: string;
  dose: number;
  unit?: string;
  applicationDate: Date | string;
  veterinarian?: string;
  batchNumber?: string;
  manufacturer?: string;
  expirationDate?: Date | string;
  cost?: number;
  notes?: string;
}

export interface MortalityRecordData {
  cattlePurchaseId: string;
  penId: string;
  quantity: number;
  deathDate: Date | string;
  cause: 'disease' | 'accident' | 'predator' | 'poisoning' | 'unknown' | 'other';
  specificCause?: string;
  veterinarianReport?: string;
  necropsy?: boolean;
  necropsyReport?: string;
  estimatedLoss?: number;
  notes?: string;
}

export interface PenMovementData {
  cattlePurchaseId: string;
  fromPenId: string;
  toPenId: string;
  quantity: number;
  movementDate: Date | string;
  reason: string;
  responsibleUser?: string;
  notes?: string;
}

export interface WeightReadingData {
  cattlePurchaseId: string;
  penId: string;
  averageWeight: number;
  totalWeight?: number;
  sampleSize: number;
  weighingDate: Date | string;
  weighingMethod?: 'individual' | 'sample' | 'estimated';
  equipment?: string;
  operator?: string;
  weatherConditions?: string;
  notes?: string;
}

export interface InterventionHistoryFilters {
  cattlePurchaseId?: string;
  penId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  type?: 'health' | 'mortality' | 'movement' | 'weight';
}

export function useInterventionsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criar intervenção de saúde
  const createHealthIntervention = useCallback(async (data: HealthInterventionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/interventions/health', {
        ...data,
        applicationDate: data.applicationDate instanceof Date 
          ? data.applicationDate.toISOString()
          : data.applicationDate,
        expirationDate: data.expirationDate 
          ? (data.expirationDate instanceof Date 
              ? data.expirationDate.toISOString()
              : data.expirationDate)
          : undefined
      });
      
      // Aceitar resposta direta ou resposta com data
      if (response?.data) {
        toast.success('Intervenção de saúde registrada com sucesso!');
        return response.data;
      } else if (response && !response.status) {
        // Resposta direta (sem wrapper)
        toast.success('Intervenção de saúde registrada com sucesso!');
        return response;
      }
      
      // Se não houver dados, retornar null ao invés de lançar erro
      console.warn('⚠️ Resposta inesperada ao criar intervenção de saúde:', response);
      return null;
    } catch (err: any) {
      console.error('❌ Erro ao criar intervenção de saúde:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao registrar intervenção';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar registro de mortalidade
  const createMortalityRecord = useCallback(async (data: MortalityRecordData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/interventions/mortality', {
        ...data,
        deathDate: data.deathDate instanceof Date 
          ? data.deathDate.toISOString()
          : data.deathDate
      });
      
      if (response?.data) {
        toast.success(`${data.quantity} morte(s) registrada(s) com sucesso!`);
        return response.data;
      }
      
      throw new Error('Resposta inválida do servidor');
    } catch (err: any) {
      console.error('❌ Erro ao criar registro de mortalidade:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao registrar mortalidade';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar movimentação entre currais
  const createPenMovement = useCallback(async (data: PenMovementData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/interventions/movement', {
        ...data,
        movementDate: data.movementDate instanceof Date 
          ? data.movementDate.toISOString()
          : data.movementDate
      });
      
      if (response?.data) {
        toast.success(`${data.quantity} animais movidos com sucesso!`);
        return response.data;
      }
      
      throw new Error('Resposta inválida do servidor');
    } catch (err: any) {
      console.error('❌ Erro ao criar movimentação:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao registrar movimentação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar leitura de peso
  const createWeightReading = useCallback(async (data: WeightReadingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/interventions/weight', {
        ...data,
        weighingDate: data.weighingDate instanceof Date 
          ? data.weighingDate.toISOString()
          : data.weighingDate
      });
      
      // Aceitar resposta direta ou resposta com data
      if (response?.data) {
        toast.success('Pesagem registrada com sucesso!');
        return response.data;
      } else if (response && !response.status) {
        // Resposta direta (sem wrapper)
        toast.success('Pesagem registrada com sucesso!');
        return response;
      }
      
      // Se não houver dados, retornar null ao invés de lançar erro
      console.warn('⚠️ Resposta inesperada ao criar pesagem:', response);
      return null;
    } catch (err: any) {
      console.error('❌ Erro ao criar leitura de peso:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao registrar pesagem';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar histórico de intervenções
  const getInterventionHistory = useCallback(async (filters: InterventionHistoryFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (filters.cattlePurchaseId) params.append('cattlePurchaseId', filters.cattlePurchaseId);
      if (filters.penId) params.append('penId', filters.penId);
      if (filters.type) params.append('type', filters.type);
      
      if (filters.startDate) {
        const startDate = filters.startDate instanceof Date 
          ? filters.startDate.toISOString()
          : filters.startDate;
        params.append('startDate', startDate);
      }
      
      if (filters.endDate) {
        const endDate = filters.endDate instanceof Date 
          ? filters.endDate.toISOString()
          : filters.endDate;
        params.append('endDate', endDate);
      }
      
      const queryString = params.toString();
      const url = `/interventions/history${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get(url);
      
      // Aceitar múltiplas estruturas de resposta
      if (response?.data?.data) {
        return response.data.data; // Retornar apenas o array de intervenções
      }
      
      // Fallback para estruturas diferentes
      if (Array.isArray(response?.data)) {
        return response.data;
      }
      
      // Aceitar array direto
      if (Array.isArray(response)) {
        return response;
      }
      
      // Se não houver dados, retornar array vazio ao invés de lançar erro
      console.warn('⚠️ Resposta inesperada ao buscar histórico de intervenções:', response);
      return [];
    } catch (err: any) {
      console.error('❌ [useInterventionsApi] Erro ao buscar histórico de intervenções:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar histórico';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas de intervenções
  const getInterventionStatistics = useCallback(async (cycleId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = cycleId ? `?cycleId=${cycleId}` : '';
      const response = await apiClient.get(`/interventions/statistics${params}`);
      
      // Aceitar resposta direta ou resposta com data
      if (response?.data) {
        return response.data;
      } else if (Array.isArray(response)) {
        // Resposta é um array direto
        return response;
      } else if (response && !response.status) {
        // Resposta direta (sem wrapper)
        return response;
      }
      
      // Se não houver dados, retornar array vazio ao invés de lançar erro
      console.warn('⚠️ Resposta inesperada ao buscar histórico de intervenções:', response);
      return [];
    } catch (err: any) {
      console.error('❌ Erro ao buscar estatísticas de intervenções:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar estatísticas';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    loading,
    error,
    
    // Métodos
    createHealthIntervention,
    createMortalityRecord,
    createPenMovement,
    createWeightReading,
    getInterventionHistory,
    getInterventionStatistics
  };
}
