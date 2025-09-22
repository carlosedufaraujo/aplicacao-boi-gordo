import { useState, useEffect, useCallback } from 'react';
import { saleRecordsApi, SaleRecord, CreateSaleRecordData, UpdateSaleRecordData, SaleRecordFilters, SaleRecordStats } from '@/services/api/saleRecordsApi';
import { toast } from 'sonner';
import { activityLogger } from '@/services/activityLogger';

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

      const data = await saleRecordsApi.findAll(filters);

      // Garantir que sempre temos um array
      const salesArray = Array.isArray(data) ? data : [];
      setSaleRecords(salesArray);
    } catch (err: any) {
      // Não mostrar erro se for problema de autenticação
      if (!err.message?.includes('autenticado')) {
        console.error('❌ Erro ao carregar registros de venda:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar registros de venda';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      setSaleRecords([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const statsData = await saleRecordsApi.getStats();
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
      
      const record = await saleRecordsApi.findById(id);
      
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
      
      const newRecord = await saleRecordsApi.create(recordData);
      
      // Atualizar lista local
      setSaleRecords(prev => [newRecord, ...prev]);

      // Registrar atividade
      activityLogger.logCreate(
        'sale',
        `Venda #${newRecord.id} - ${newRecord.quantity} animais`,
        newRecord.id,
        {
          quantity: newRecord.quantity,
          totalValue: newRecord.totalValue,
          buyerId: newRecord.buyerId
        }
      );

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
      
      const oldRecord = saleRecords.find(r => r.id === id);
      const updatedRecord = await saleRecordsApi.update(id, updates);

      // Atualizar lista local
      setSaleRecords(prev => prev.map(record =>
        record.id === id ? updatedRecord : record
      ));

      // Registrar atividade
      activityLogger.logUpdate(
        'sale',
        `Venda #${id} - ${updatedRecord.quantity} animais`,
        id,
        oldRecord,
        updatedRecord
      );

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
      
      const deletedRecord = saleRecords.find(r => r.id === id);
      await saleRecordsApi.delete(id);

      // Remover da lista local
      setSaleRecords(prev => prev.filter(record => record.id !== id));

      // Registrar atividade
      if (deletedRecord) {
        activityLogger.logDelete(
          'sale',
          `Venda #${id} - ${deletedRecord.quantity} animais`,
          id,
          deletedRecord
        );
      }

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
