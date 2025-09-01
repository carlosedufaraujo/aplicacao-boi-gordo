import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api/apiClient';
import { toast } from 'sonner';

export interface CattlePurchase {
  id: string;
  // Código único
  lotCode: string;
  
  // Relacionamentos
  vendorId: string;
  vendor?: {
    id: string;
    name: string;
    document: string;
  };
  brokerId?: string;
  broker?: {
    id: string;
    name: string;
  };
  transportCompanyId?: string;
  transportCompany?: {
    id: string;
    name: string;
  };
  payerAccountId: string;
  payerAccount?: {
    id: string;
    name: string;
  };
  
  // Localização e data
  location?: string;
  city?: string;
  state?: string;
  farm?: string;
  purchaseDate: Date | string;
  receivedDate?: Date | string;
  
  // Informações dos animais
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  animalAge?: number;
  initialQuantity: number;
  currentQuantity: number;
  deathCount: number;
  
  // Pesos
  purchaseWeight: number;
  receivedWeight?: number;
  currentWeight?: number;
  averageWeight?: number;
  currentWeightBreakPercentage?: number;
  
  // Valores e rendimento
  carcassYield: number;
  pricePerArroba: number;
  purchaseValue: number;
  
  // Custos
  freightCost: number;
  freightDistance?: number;
  freightCostPerKm?: number;
  commission: number;
  healthCost: number;
  feedCost: number;
  operationalCost: number;
  totalCost: number;
  
  // Pagamentos
  paymentType: 'CASH' | 'INSTALLMENT' | 'BARTER';
  paymentTerms?: string;
  principalDueDate?: Date | string;
  commissionPaymentType?: string;
  commissionDueDate?: Date | string;
  freightPaymentType?: string;
  freightDueDate?: Date | string;
  
  // GMD
  expectedGMD?: number;
  targetWeight?: number;
  estimatedSlaughterDate?: Date | string;
  
  // Status
  status: 'NEGOTIATING' | 'CONFIRMED' | 'IN_TRANSIT' | 'RECEIVED' | 'ACTIVE' | 'SOLD' | 'CANCELLED';
  stage?: string;
  notes?: string;
  transportMortality?: number;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Relacionamentos adicionais
  penAllocations?: any[];
  healthRecords?: any[];
  currentWeightReadings?: any[];
  expenses?: any[];
  saleRecords?: any[];
}

export interface CreateCattlePurchaseDto {
  // Relacionamentos
  vendorId: string;
  brokerId?: string;
  transportCompanyId?: string;
  payerAccountId: string;
  
  // Localização e data
  location?: string;
  city?: string;
  state?: string;
  farm?: string;
  purchaseDate: Date | string;
  
  // Informações dos animais
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  animalAge?: number;
  initialQuantity: number;
  
  // Pesos
  purchaseWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  
  // Custos
  freightCost?: number;
  freightDistance?: number;
  freightCostPerKm?: number;
  commission?: number;
  
  // Pagamentos
  paymentType: 'CASH' | 'INSTALLMENT' | 'BARTER';
  paymentTerms?: string;
  principalDueDate?: Date | string;
  commissionPaymentType?: string;
  commissionDueDate?: Date | string;
  freightPaymentType?: string;
  freightDueDate?: Date | string;
  
  // GMD
  expectedGMD?: number;
  targetWeight?: number;
  
  // Outros
  notes?: string;
}

export interface UpdateCattlePurchaseDto extends Partial<CreateCattlePurchaseDto> {
  // Campos adicionais que podem ser atualizados
  receivedDate?: Date | string;
  receivedWeight?: number;
  currentWeight?: number;
  currentQuantity?: number;
  deathCount?: number;
  currentWeightBreakPercentage?: number;
  transportMortality?: number;
  healthCost?: number;
  feedCost?: number;
  operationalCost?: number;
  status?: CattlePurchase['status'];
  stage?: string;
  estimatedSlaughterDate?: Date | string;
}

export function useCattlePurchasesApi() {
  const [purchases, setPurchases] = useState<CattlePurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listar todas as compras
  const loadPurchases = useCallback(async (filters?: {
    status?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendorId) params.append('vendorId', filters.vendorId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = `/cattle-purchases${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      
      if (response && response.items !== undefined) {
        // Backend retorna 'items' para listagens
        const purchases = response.items || [];
        setPurchases(purchases);
        return purchases;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar compras:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Erro ao carregar compras';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar compra por ID
  const getPurchaseById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/cattle-purchases/${id}`);
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Erro ao buscar compra');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar compra';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova compra
  const createPurchase = useCallback(async (data: CreateCattlePurchaseDto) => {
    try {
      setLoading(true);
      setError(null);
      
      // Converter datas para ISO string se necessário
      const payload = {
        ...data,
        purchaseDate: data.purchaseDate instanceof Date 
          ? data.purchaseDate.toISOString() 
          : data.purchaseDate,
        principalDueDate: data.principalDueDate instanceof Date
          ? data.principalDueDate.toISOString()
          : data.principalDueDate,
        commissionDueDate: data.commissionDueDate instanceof Date
          ? data.commissionDueDate.toISOString()
          : data.commissionDueDate,
        freightDueDate: data.freightDueDate instanceof Date
          ? data.freightDueDate.toISOString()
          : data.freightDueDate,
      };
      
      const response = await apiClient.post('/cattle-purchases', payload);
      
      if (response.data) {
        const newPurchase = response.data;
        setPurchases(prev => [newPurchase, ...prev]);
        toast.success('Compra criada com sucesso!');
        return newPurchase;
      } else {
        throw new Error('Erro ao criar compra');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar compra';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar compra
  const updatePurchase = useCallback(async (id: string, data: UpdateCattlePurchaseDto) => {
    try {
      setLoading(true);
      setError(null);
      
      // Converter datas para ISO string se necessário
      const payload = { ...data };
      Object.keys(payload).forEach(key => {
        if (key.includes('Date') && payload[key] instanceof Date) {
          payload[key] = payload[key].toISOString();
        }
      });
      
      const response = await apiClient.put(`/cattle-purchases/${id}`, payload);
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success('Compra atualizada com sucesso!');
        return updatedPurchase;
      } else {
        throw new Error('Erro ao atualizar compra');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar compra';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar recepção
  const registerReception = useCallback(async (id: string, data: {
    receivedDate: Date | string;
    receivedWeight: number;
    actualQuantity: number;
    transportMortality?: number;
    currentWeightBreakPercentage?: number;
    penIds?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...data,
        receivedDate: data.receivedDate instanceof Date
          ? data.receivedDate.toISOString()
          : data.receivedDate,
      };
      
      const response = await apiClient.post(`/cattle-purchases/${id}/reception`, payload);
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success('Recepção registrada com sucesso!');
        return updatedPurchase;
      } else {
        throw new Error('Erro ao registrar recepção');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao registrar recepção';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar status
  const updateStatus = useCallback(async (id: string, status: CattlePurchase['status']) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.patch(`/cattle-purchases/${id}/status`, { status });
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success('Status atualizado com sucesso!');
        return updatedPurchase;
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar status';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar morte
  const registerDeath = useCallback(async (id: string, count: number, date?: Date | string) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        count,
        date: date instanceof Date ? date.toISOString() : date,
      };
      
      const response = await apiClient.post(`/cattle-purchases/${id}/death`, payload);
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success(`${count} morte(s) registrada(s)`);
        return updatedPurchase;
      } else {
        throw new Error('Erro ao registrar morte');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao registrar morte';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar GMD
  const updateGMD = useCallback(async (id: string, expectedGMD: number, targetWeight: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.patch(`/cattle-purchases/${id}/gmd`, {
        expectedGMD,
        targetWeight,
      });
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success('GMD atualizado com sucesso!');
        return updatedPurchase;
      } else {
        throw new Error('Erro ao atualizar GMD');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar GMD';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deletar compra
  const deletePurchase = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.delete(`/cattle-purchases/${id}`);
      
      if (response.status === 204 || response.data?.status === 'success') {
        setPurchases(prev => prev.filter(p => p.id !== id));
        toast.success('Compra excluída com sucesso!');
        return true;
      } else {
        throw new Error('Erro ao excluir compra');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir compra';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas
  const getStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/cattle-purchases/statistics');
      
      if (response.data) {
        return response.data;
      } else {
        throw new Error('Erro ao buscar estatísticas');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao buscar estatísticas';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    purchases,
    loading,
    error,
    
    // Métodos
    loadPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    registerReception,
    updateStatus,
    registerDeath,
    updateGMD,
    deletePurchase,
    getStatistics,
  };
}