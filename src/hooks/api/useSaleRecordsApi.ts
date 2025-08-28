import { useState, useEffect, useCallback } from 'react';
import { saleRecordsApi, SaleRecord, CreateSaleRecordData, UpdateSaleRecordData, SaleRecordFilters, SaleRecordStats } from '@/services/api/saleRecordsApi';
import { toast } from 'sonner';

export const useSaleRecordsApi = () => {
  const [saleRecords, setSaleRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SaleRecordStats | null>(null);

  // Carregar registros de venda
  const loadSaleRecords = useCallback(async (filters?: SaleRecordFilters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando registros de venda via API...');
      
      const data = await saleRecordsApi.findAll(filters);
      console.log('✅ Registros de venda carregados via API:', data.length);
      
      setSaleRecords(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar registros de venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar registros de venda';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      console.log('🔄 Carregando estatísticas de registros de venda...');
      const statsData = await saleRecordsApi.getStats();
      console.log('✅ Estatísticas de registros de venda carregadas:', statsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas de registros de venda:', err);
    }
  }, []);

  // Buscar registro de venda por ID
  const getSaleRecordById = useCallback(async (id: string): Promise<SaleRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Buscando registro de venda por ID:', id);
      
      const record = await saleRecordsApi.findById(id);
      console.log('✅ Registro de venda encontrado:', record);
      
      return record;
    } catch (err: any) {
      console.error('❌ Erro ao buscar registro de venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar registro de venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar novo registro de venda
  const createSaleRecord = useCallback(async (recordData: CreateSaleRecordData): Promise<SaleRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando novo registro de venda:', recordData);
      
      const newRecord = await saleRecordsApi.create(recordData);
      console.log('✅ Registro de venda criado:', newRecord);
      
      // Atualizar lista local
      setSaleRecords(prev => [newRecord, ...prev]);
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Registro de venda criado com sucesso!');
      return newRecord;
    } catch (err: any) {
      console.error('❌ Erro ao criar registro de venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar registro de venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Atualizar registro de venda
  const updateSaleRecord = useCallback(async (id: string, updates: UpdateSaleRecordData): Promise<SaleRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando registro de venda:', id, updates);
      
      const updatedRecord = await saleRecordsApi.update(id, updates);
      console.log('✅ Registro de venda atualizado:', updatedRecord);
      
      // Atualizar lista local
      setSaleRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Registro de venda atualizado com sucesso!');
      return updatedRecord;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar registro de venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar registro de venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Excluir registro de venda
  const deleteSaleRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Excluindo registro de venda:', id);
      
      await saleRecordsApi.delete(id);
      console.log('✅ Registro de venda excluído');
      
      // Remover da lista local
      setSaleRecords(prev => prev.filter(record => record.id !== id));
      
      // Atualizar estatísticas
      await loadStats();
      
      toast.success('Registro de venda excluído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('❌ Erro ao excluir registro de venda:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir registro de venda';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  // Refresh (recarregar dados)
  const refresh = useCallback(async (filters?: SaleRecordFilters) => {
    await Promise.all([
      loadSaleRecords(filters),
      loadStats()
    ]);
  }, [loadSaleRecords, loadStats]);

  // Carregar dados iniciais
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // Estado
    saleRecords,
    loading,
    error,
    stats,
    
    // Funções
    getSaleRecordById,
    createSaleRecord,
    updateSaleRecord,
    deleteSaleRecord,
    refresh,
    loadSaleRecords
  };
};
