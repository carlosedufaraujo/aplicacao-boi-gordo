import React, { useState, useCallback } from 'react';
import { apiClient } from '@/services/api/apiClient';
import { toast } from 'sonner';
import { activityLogger } from '@/services/activityLogger';

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
  status: 'CONFIRMED' | 'RECEIVED' | 'CONFINED' | 'SOLD' | 'CANCELLED';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Listar todas as compras
  const loadPurchases = useCallback(async (filters?: {
    status?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendorId) params.append('vendorId', filters.vendorId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      params.append('page', String(filters?.page || currentPage));
      params.append('limit', String(filters?.limit || pageSize));

      const queryString = params.toString();
      const url = `/cattle-purchases${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get(url);

      // Verificar se a resposta é de erro de autenticação
      if (response && response.status === 'error' && response.message === 'Usuário não autenticado') {
        // Não mostrar erro, apenas retornar array vazio
        setPurchases([]);
        setTotalItems(0);
        setTotalPages(1);
        setCurrentPage(1);
        return [];
      }

      if (response && response.items !== undefined) {
        // Backend retorna 'items' para listagens
        const purchases = response.items || [];
        setPurchases(purchases);

        // Atualizar informações de paginação
        setTotalItems(response.results || response.total || purchases.length);
        setTotalPages(response.totalPages || Math.ceil((response.results || purchases.length) / pageSize));
        setCurrentPage(response.page || 1);

        return purchases;
      } else if (!response) {
        // Sem resposta (provavelmente não autenticado)
        setPurchases([]);
        return [];
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      // Não mostrar erro se for problema de autenticação
      if (!err.message?.includes('autenticado')) {
        console.error('❌ Erro ao carregar compras:', err);
        const errorMessage = err.message || err.response?.data?.message || 'Erro ao carregar compras';
        setError(errorMessage);
        toast.error(errorMessage);
      }
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

        // Registrar atividade
        activityLogger.logCreate(
          'cattle_purchase',
          `Lote ${newPurchase.lotCode} - ${newPurchase.initialQuantity} animais`,
          newPurchase.id,
          {
            quantity: newPurchase.initialQuantity,
            value: newPurchase.purchaseValue,
            vendor: newPurchase.vendorId,
            location: newPurchase.location || newPurchase.city || newPurchase.state
          }
        );

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
        const oldPurchase = purchases.find(p => p.id === id);
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));

        // Registrar atividade
        activityLogger.logUpdate(
          'cattle_purchase',
          `Lote ${updatedPurchase.lotCode} - ${updatedPurchase.initialQuantity} animais`,
          id,
          oldPurchase,
          updatedPurchase
        );

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
    receivedQuantity?: number;
    actualQuantity: number;
    unloadingDate?: string;
    transportMortality?: number;
    mortalityReason?: string;
    observations?: string;
    penAllocations?: Array<{ penId: string; quantity: number }>;
    currentWeightBreakPercentage?: number;
    penIds?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar payload conforme esperado pela API
      // A validação espera: receivedDate, receivedWeight, actualQuantity
      const payload = {
        receivedDate: data.receivedDate instanceof Date
          ? data.receivedDate.toISOString()
          : data.receivedDate,
        receivedWeight: Number(data.receivedWeight) || 0,
        actualQuantity: Number(data.actualQuantity) || 0,
        receivedQuantity: Number(data.receivedQuantity || data.actualQuantity) || 0,
        unloadingDate: data.unloadingDate || (data.receivedDate instanceof Date
          ? data.receivedDate.toISOString()
          : data.receivedDate),
        mortalityReason: data.mortalityReason,
        observations: data.observations,
        penAllocations: data.penAllocations || [],
      };
      const response = await apiClient.post(`/cattle-purchases/${id}/reception`, payload);
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));

        // Registrar atividade
        activityLogger.logStatusChange(
          'cattle_purchase',
          `Lote ${updatedPurchase.lotCode}`,
          'CONFIRMADO',
          'RECEBIDO',
          id
        );

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
        const oldPurchase = purchases.find(p => p.id === id);
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));

        // Registrar atividade
        if (oldPurchase) {
          activityLogger.logStatusChange(
            'cattle_purchase',
            `Lote ${updatedPurchase.lotCode}`,
            oldPurchase.status,
            status,
            id
          );
        }

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

        // Registrar atividade
        activityLogger.log({
          type: 'update',
          action: 'edited',
          category: 'cattle_purchase',
          title: 'Morte Registrada',
          description: `${count} morte(s) registrada(s) no Lote ${updatedPurchase.lotCode}`,
          entityId: id,
          entityName: `Lote ${updatedPurchase.lotCode}`,
          newValue: { deathCount: updatedPurchase.deathCount },
          importance: 'high',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });

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

  // Marcar como confinado (para compras já recepcionadas)
  const markAsConfined = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        penAllocations: data.penAllocations || [],
        notes: data.notes || data.observations,
      };
      const response = await apiClient.post(`/cattle-purchases/${id}/confined`, payload);
      
      if (response.data) {
        const updatedPurchase = response.data;
        setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
        toast.success('Lote alocado em currais com sucesso!');
        return updatedPurchase;
      } else {
        throw new Error('Erro ao alocar em currais');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao alocar em currais';
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
      
      // Se chegou aqui sem erro, a exclusão foi bem sucedida
      // (o apiClient já tratou erros HTTP)
      
      // Obter dados da compra antes de excluir
      const deletedPurchase = purchases.find(p => p.id === id);

      // Remover da lista local imediatamente
      setPurchases(prev => prev.filter(p => p.id !== id));

      // Registrar atividade
      if (deletedPurchase) {
        activityLogger.logDelete(
          'cattle_purchase',
          `Lote ${deletedPurchase.lotCode} - ${deletedPurchase.initialQuantity} animais`,
          id,
          deletedPurchase
        );
      }

      // Mostrar mensagem de sucesso
      const successMessage = response.data?.message || response.message || 'Compra excluída com sucesso!';
      toast.success(successMessage);
      
      // Recarregar lista após exclusão para garantir sincronização
      try {
        await loadPurchases();
      } catch (loadError) {
      }
      
      // Retornar true para indicar sucesso
      return true;
    } catch (err: any) {
      // Se for 404, a compra já foi excluída
      if (err.response?.status === 404) {
        setPurchases(prev => prev.filter(p => p.id !== id));
        setError(null);
        toast.info('Esta compra já foi removida');
        // Recarregar lista
        await loadPurchases();
        return true; // Retornar true pois o objetivo foi alcançado
      } 
      
      // Para outros erros
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir compra';
      setError(errorMessage);
      
      // Verificar se é erro de compra ativa
      if (errorMessage.includes('ativa') || errorMessage.includes('ACTIVE')) {
        toast.error('Não é possível excluir uma compra ativa. Altere o status primeiro.');
      } else {
        toast.error(errorMessage);
      }
      
      // Lançar erro para o componente tratar se necessário
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchases]);

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

  // Fun\u00e7\u00f5es de pagina\u00e7\u00e3o
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
    loadPurchases({ page, limit: pageSize });
  }, [loadPurchases, pageSize]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    loadPurchases({ page: 1, limit: size });
  }, [loadPurchases]);

  // Carregar dados ao montar o hook com timeout de segurança
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadData = async () => {
      try {
        await loadPurchases({ page: 1, limit: pageSize });
      } catch (error) {
        console.error('Erro no carregamento inicial de compras:', error);
        // Garantir que loading seja finalizado mesmo em caso de erro
        setLoading(false);
      }
    };

    // Timeout de segurança: se após 30 segundos ainda estiver carregando, finalizar
    timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Timeout no carregamento de compras - finalizando loading');
        setLoading(false);
      }
    }, 30000);

    loadData();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Executar apenas na montagem

  return {
    // Estado
    cattlePurchases: purchases, // Alias para manter compatibilidade
    purchases,
    loading,
    error,
    
    // Métodos
    refresh: loadPurchases, // Alias para manter compatibilidade
    loadPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    registerReception,
    markAsConfined,
    updateStatus,
    registerDeath,
    updateGMD,
    deleteCattlePurchase: deletePurchase, // Alias para manter compatibilidade
    deletePurchase,
    getStatistics,
    
    // Pagina\u00e7\u00e3o
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    changePage,
    changePageSize,
  };
}
