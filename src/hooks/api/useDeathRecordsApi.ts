import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export type DeathType = 
  | 'DISEASE'
  | 'ACCIDENT'
  | 'PREDATION'
  | 'POISONING'
  | 'STRESS'
  | 'UNKNOWN'
  | 'OTHER';

export interface DeathRecord {
  id: string;
  purchaseId: string;
  penId: string;
  quantity: number;
  deathDate: Date | string;
  deathType: DeathType;
  cause?: string;
  veterinaryNotes?: string;
  estimatedLoss?: number;
  userId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  purchase?: {
    id: string;
    lotCode: string;
    vendor?: {
      id: string;
      name: string;
    };
  };
  pen?: {
    id: string;
    penNumber: string;
    type: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface CreateDeathRecordData {
  purchaseId: string;
  penId: string;
  quantity: number;
  deathDate?: Date | string;
  deathType: DeathType;
  cause?: string;
  veterinaryNotes?: string;
  estimatedLoss?: number;
}

export interface UpdateDeathRecordData extends Partial<CreateDeathRecordData> {}

export interface DeathStatistics {
  totalDeaths: number;
  deathsByType: Record<string, number>;
  deathsByPen: Record<string, number>;
  deathsByPurchase: Record<string, number>;
  mortalityRate: number;
  totalEstimatedLoss: number;
}

export interface DeathAnalysisByPeriod {
  date: string;
  totalDeaths: number;
  estimatedLoss: number;
  records: DeathRecord[];
}

export interface DeathRecordFilters {
  purchaseId?: string;
  penId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  deathType?: DeathType;
}

export function useDeathRecordsApi() {
  const [deathRecords, setDeathRecords] = useState<DeathRecord[]>([]);
  const [statistics, setStatistics] = useState<DeathStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listar registros de morte
  const loadDeathRecords = useCallback(async (filters?: DeathRecordFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.purchaseId) params.append('purchaseId', filters.purchaseId);
      if (filters?.penId) params.append('penId', filters.penId);
      if (filters?.startDate) params.append('startDate', filters.startDate.toString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toString());
      if (filters?.deathType) params.append('deathType', filters.deathType);
      
      const response = await api.get(`/death-records?${params.toString()}`);
      setDeathRecords(response.data.data || []);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar registros de morte';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar registro por ID
  const getDeathRecord = useCallback(async (id: string) => {
    try {
      const response = await api.get(`/death-records/${id}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao buscar registro de morte';
      toast.error(message);
      throw err;
    }
  }, []);

  // Criar novo registro de morte
  const createDeathRecord = useCallback(async (data: CreateDeathRecordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/death-records', data);
      const newRecord = response.data.data;
      
      setDeathRecords(prev => [newRecord, ...prev]);
      toast.success(response.data.message || 'Morte registrada com sucesso');
      
      return newRecord;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao registrar morte';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar registro de morte
  const updateDeathRecord = useCallback(async (id: string, data: UpdateDeathRecordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/death-records/${id}`, data);
      const updatedRecord = response.data.data;
      
      setDeathRecords(prev => 
        prev.map(record => record.id === id ? updatedRecord : record)
      );
      
      toast.success('Registro de morte atualizado');
      return updatedRecord;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao atualizar registro';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar registro de morte
  const deleteDeathRecord = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/death-records/${id}`);
      
      setDeathRecords(prev => prev.filter(record => record.id !== id));
      toast.success(response.data.message || 'Registro de morte removido');
      
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao remover registro';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter estatísticas
  const loadStatistics = useCallback(async (filters?: DeathRecordFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.purchaseId) params.append('purchaseId', filters.purchaseId);
      if (filters?.penId) params.append('penId', filters.penId);
      if (filters?.startDate) params.append('startDate', filters.startDate.toString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toString());
      
      const response = await api.get(`/death-records/statistics?${params.toString()}`);
      setStatistics(response.data.data);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar estatísticas';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Análise por período
  const getAnalysisByPeriod = useCallback(async (startDate: Date | string, endDate: Date | string) => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toString(),
        endDate: endDate.toString()
      });
      
      const response = await api.get(`/death-records/analysis/period?${params.toString()}`);
      return response.data.data as DeathAnalysisByPeriod[];
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar análise';
      toast.error(message);
      throw err;
    }
  }, []);

  // Helpers para tipos de morte
  const getDeathTypeLabel = (type: DeathType): string => {
    const labels: Record<DeathType, string> = {
      DISEASE: 'Doença',
      ACCIDENT: 'Acidente',
      PREDATION: 'Predação',
      POISONING: 'Envenenamento',
      STRESS: 'Estresse',
      UNKNOWN: 'Desconhecida',
      OTHER: 'Outra'
    };
    return labels[type] || type;
  };

  const getDeathTypeColor = (type: DeathType): string => {
    const colors: Record<DeathType, string> = {
      DISEASE: 'bg-red-100 text-red-800',
      ACCIDENT: 'bg-orange-100 text-orange-800',
      PREDATION: 'bg-purple-100 text-purple-800',
      POISONING: 'bg-yellow-100 text-yellow-800',
      STRESS: 'bg-blue-100 text-blue-800',
      UNKNOWN: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-slate-100 text-slate-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return {
    // Estado
    deathRecords,
    statistics,
    loading,
    error,
    
    // Ações
    loadDeathRecords,
    getDeathRecord,
    createDeathRecord,
    updateDeathRecord,
    deleteDeathRecord,
    loadStatistics,
    getAnalysisByPeriod,
    
    // Helpers
    getDeathTypeLabel,
    getDeathTypeColor
  };
}
