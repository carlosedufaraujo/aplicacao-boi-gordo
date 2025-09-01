import { useState, useEffect, useCallback } from 'react';
import { partnerApi, Partner, CreatePartnerData, UpdatePartnerData, PartnerFilters, PartnerStats } from '@/services/api/partnerApi';
import { toast } from 'sonner';
import { showErrorNotification, showSuccessNotification } from '@/utils/errorHandler';

/**
 * Hook para gerenciar Partners via API Backend
 * Substitui o hook direto do Supabase por integração via API
 */
export const usePartnersApi = (initialFilters: PartnerFilters = {}) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);

  /**
   * Carrega os parceiros
   */
  const loadPartners = useCallback(async (filters: PartnerFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await partnerApi.getAll({ ...initialFilters, ...filters });
      
      if (response.status === 'success' && response.data) {
        // Se response.data for um objeto paginado, extrair o array
        console.log('[usePartnersApi] Response data:', response.data);
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || [];
        console.log('[usePartnersApi] Items extraídos:', items);
        setPartners(items);
      } else {
        throw new Error(response.message || 'Erro ao carregar parceiros');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao carregar parceiros:', err);
      showErrorNotification(err, 'Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await partnerApi.getStats();
      
      if (response.status === 'success' && response.data) {
        // Stats não deve sobrescrever os partners, apenas atualizar as estatísticas
        console.log('Stats carregadas:', response.data);
        // Não chamar setPartners aqui pois isso apaga a lista de parceiros
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria um novo parceiro
   */
  const createPartner = useCallback(async (data: CreatePartnerData): Promise<Partner | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await partnerApi.create(data);
      
      if (response.status === 'success' && response.data) {
        showSuccessNotification('Parceiro criado com sucesso');
        
        // Recarregar a lista completa para garantir sincronização
        await loadPartners();
        await loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao criar parceiro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar parceiro:', err);
      
      // Notificação detalhada do erro usando o novo sistema
      showErrorNotification(err, 'Erro ao criar parceiro');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPartners, loadStats]);

  /**
   * Atualiza um parceiro
   */
  const updatePartner = useCallback(async (id: string, data: UpdatePartnerData): Promise<Partner | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await partnerApi.update(id, data);
      
      if (response.status === 'success' && response.data) {
        showSuccessNotification('Parceiro atualizado com sucesso');
        
        // Recarregar a lista completa para garantir sincronização
        await loadPartners();
        await loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao atualizar parceiro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar parceiro:', err);
      showErrorNotification(err, 'Erro ao atualizar parceiro');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPartners, loadStats]);

  /**
   * Ativa/desativa um parceiro
   */
  const togglePartnerStatus = useCallback(async (id: string, isActive: boolean): Promise<Partner | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await partnerApi.toggleStatus(id, isActive);
      
      if (response.status === 'success' && response.data) {
        setPartners(prev => prev.map(partner => 
          partner.id === id ? response.data! : partner
        ));
        showSuccessNotification(`Parceiro ${isActive ? 'ativado' : 'desativado'} com sucesso`);
        
        // Recarregar estatísticas
        loadStats();
        
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao alterar status do parceiro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao alterar status do parceiro:', err);
      showErrorNotification(err, 'Erro ao alterar status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPartners, loadStats]);

  /**
   * Remove um parceiro
   */
  const deletePartner = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await partnerApi.remove(id);
      
      if (response.status === 'success') {
        setPartners(prev => prev.filter(partner => partner.id !== id));
        showSuccessNotification('Parceiro removido com sucesso');
        
        // Recarregar estatísticas
        loadStats();
        
        return true;
      } else {
        throw new Error(response.message || 'Erro ao remover parceiro');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao remover parceiro:', err);
      showErrorNotification(err, 'Erro ao remover parceiro');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPartners, loadStats]);

  /**
   * Busca um parceiro por ID
   */
  const getPartnerById = useCallback(async (id: string): Promise<Partner | null> => {
    try {
      const response = await partnerApi.getById(id);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar parceiro');
      }
    } catch (err) {
      console.error('Erro ao buscar parceiro:', err);
      return null;
    }
  }, []);

  /**
   * Busca parceiros por tipo
   */
  const getPartnersByType = useCallback(async (partnerType: string): Promise<Partner[]> => {
    try {
      const response = await partnerApi.getByType(partnerType);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar parceiros por tipo');
      }
    } catch (err) {
      console.error('Erro ao buscar parceiros por tipo:', err);
      return [];
    }
  }, []);

  /**
   * Busca parceiros por status
   */
  const getPartnersByStatus = useCallback(async (status: string): Promise<Partner[]> => {
    try {
      const response = await partnerApi.getByStatus(status);
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar parceiros por status');
      }
    } catch (err) {
      console.error('Erro ao buscar parceiros por status:', err);
      return [];
    }
  }, []);

  /**
   * Busca apenas parceiros ativos
   */
  const getActivePartners = useCallback(async (): Promise<Partner[]> => {
    try {
      const response = await partnerApi.getActive();
      
      if (response.status === 'success' && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar parceiros ativos');
      }
    } catch (err) {
      console.error('Erro ao buscar parceiros ativos:', err);
      return [];
    }
  }, []);

  /**
   * Recarrega os dados
   */
  const refresh = useCallback(() => {
    loadPartners();
    loadStats();
  }, [loadPartners, loadStats]);

  // Carregamento inicial
  useEffect(() => {
    console.log('[usePartnersApi] Montando componente, iniciando carregamento...');
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Carregar partners e stats em paralelo
        const [partnersResponse, statsResponse] = await Promise.all([
          partnerApi.getAll(initialFilters),
          partnerApi.getStats()
        ]);
        
        if (partnersResponse.status === 'success' && partnersResponse.data) {
          console.log('[usePartnersApi] Initial load - Response data:', partnersResponse.data);
          const items = Array.isArray(partnersResponse.data) 
            ? partnersResponse.data 
            : partnersResponse.data.items || [];
          console.log('[usePartnersApi] Initial load - Items extraídos:', items);
          setPartners(items);
        }
        
        if (statsResponse.status === 'success' && statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        console.error('[usePartnersApi] Erro no carregamento inicial:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); // Executar apenas na montagem

  return {
    partners,
    loading,
    error,
    stats,
    loadPartners,
    loadStats,
    createPartner,
    updatePartner,
    togglePartnerStatus,
    deletePartner,
    getPartnerById,
    getPartnersByType,
    getPartnersByStatus,
    getActivePartners,
    refresh,
    reload: refresh, // Alias para compatibilidade com DebugRegistrations
  };
};
