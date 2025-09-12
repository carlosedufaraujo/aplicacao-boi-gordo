import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import cashFlowService, { 
  CashFlow, 
  CashFlowSummary,
  FinancialCategory,
  FinancialAccount 
} from '@/services/api/cashFlow';
import { categoryService } from '@/services/categoryService';
import { useNotification } from '@/components/Notifications/NotificationProvider';
import calendarEventService from '@/services/api/calendarEvent';
import api from '@/lib/api';

export const useCashFlow = () => {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { showNotification } = useNotification();

  // Buscar dados do Cash Flow
  const fetchCashFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Buscando dados do Cash Flow...');
      const response = await api.get('/cash-flows');
      console.log('✅ Dados do Cash Flow carregados:', response.data);
      
      if (Array.isArray(response.data)) {
        setCashFlows(response.data);
      } else {
        console.warn('Dados não são array:', response.data);
        setCashFlows([]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar Cash Flow:', error);
      setError(error.message || 'Erro ao carregar dados');
      setCashFlows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar resumo
  const fetchSummary = useCallback(async () => {
    try {
      console.log('🔄 Buscando resumo do Cash Flow...');
      const response = await api.get('/cash-flows/summary');
      console.log('✅ Resumo carregado:', response.data);
      setSummary(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao buscar resumo:', error);
      // Calcular resumo localmente se não existir endpoint
      calculateLocalSummary();
    }
  }, [cashFlows]);

  // Calcular resumo localmente
  const calculateLocalSummary = useCallback(() => {
    if (!cashFlows.length) return;

    const summary = cashFlows.reduce((acc, flow) => {
      if (flow.type === 'INCOME') {
        acc.totalIncome += flow.amount;
        if (flow.status === 'RECEIVED') acc.paidIncome += flow.amount;
        else acc.pendingIncome += flow.amount;
      } else {
        acc.totalExpense += flow.amount;
        if (flow.status === 'PAID') acc.paidExpense += flow.amount;
        else acc.pendingExpense += flow.amount;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      paidIncome: 0,
      paidExpense: 0,
      pendingIncome: 0,
      pendingExpense: 0,
      balance: 0
    });

    summary.balance = summary.paidIncome - summary.paidExpense;
    setSummary(summary);
  }, [cashFlows]);

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      console.log('🔄 Buscando categorias...');
      // Tenta buscar da API primeiro
      const response = await api.get('/categories');
      const formattedCategories = response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'INCOME' | 'EXPENSE',
        color: cat.color,
        icon: cat.icon,
        isActive: cat.isActive !== false
      }));
      console.log('✅ Categorias carregadas da API:', formattedCategories);
      setCategories(formattedCategories);
    } catch (error: any) {
      console.warn('❌ Erro ao buscar categorias da API, usando cache local:', error);
      // Fallback para categorias locais
      const localCategories = categoryService.getAll();
      const formattedCategories = localCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'INCOME' | 'EXPENSE',
        color: cat.color,
        icon: cat.icon,
        isActive: true
      }));
      console.log('✅ Categorias carregadas do cache:', formattedCategories);
      setCategories(formattedCategories);
    }
  }, []);

  // Buscar contas
  const fetchAccounts = useCallback(async () => {
    try {
      console.log('🔄 Buscando contas...');
      const response = await api.get('/payer-accounts');
      console.log('✅ Contas carregadas:', response.data);
      
      if (response.data.data?.items) {
        const formattedAccounts = response.data.data.items.map((acc: any) => ({
          id: acc.id,
          accountName: acc.accountName,
          accountType: acc.accountType,
          bankName: acc.bankName,
          balance: acc.balance || 0,
          initialBalance: acc.initialBalance || 0,
          isActive: acc.isActive
        }));
        setAccounts(formattedAccounts);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar contas:', error);
    }
  }, []);

  // Criar movimentação
  const createCashFlow = useCallback(async (data: any) => {
    try {
      console.log('🔄 Criando movimentação:', data);
      const response = await api.post('/cash-flows', data);
      console.log('✅ Movimentação criada:', response.data);
      
      await fetchCashFlows();
      
      toast({
        title: 'Movimentação criada',
        description: 'A movimentação foi salva com sucesso.',
        duration: 3000,
      });

      showNotification({
        title: data.type === 'INCOME' ? '💵 Nova Receita' : '💸 Nova Despesa',
        message: `${data.description} - Valor: R$ ${data.amount.toFixed(2)} - Vencimento: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString('pt-BR') : 'Hoje'}`,
        type: 'success'
      });

      // Criar evento no calendário se tiver data de vencimento
      if (data.dueDate) {
        try {
          await calendarEventService.create({
            title: `${data.type === 'INCOME' ? '💰' : '💸'} ${data.description}`,
            date: new Date(data.dueDate),
            type: 'FINANCE',
            description: `Valor: R$ ${data.amount.toFixed(2)}`,
            relatedEntityId: response.data.id,
            relatedEntityType: 'CashFlow'
          });
        } catch (calendarError) {
          console.warn('Erro ao criar evento no calendário:', calendarError);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar movimentação:', error);
      toast({
        title: 'Erro ao criar',
        description: error.message || 'Não foi possível criar a movimentação',
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  }, [fetchCashFlows, toast, showNotification]);

  // Atualizar movimentação
  const updateCashFlow = useCallback(async (id: string, data: any) => {
    try {
      console.log('🔄 Atualizando movimentação:', id, data);
      const response = await api.put(`/cash-flows/${id}`, data);
      console.log('✅ Movimentação atualizada:', response.data);
      
      await fetchCashFlows();
      
      toast({
        title: 'Movimentação atualizada',
        description: 'A movimentação foi atualizada com sucesso.',
        duration: 3000,
      });

      showNotification({
        title: '✏️ Movimentação Atualizada',
        message: `${data.type === 'INCOME' ? 'Receita' : 'Despesa'}: ${data.description} - Valor: R$ ${data.amount.toFixed(2)}`,
        type: 'info'
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar movimentação:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a movimentação',
        variant: 'destructive',
        duration: 5000,
      });
      
      showNotification({
        title: '❌ Erro ao Atualizar',
        message: 'Não foi possível atualizar a movimentação. Tente novamente.',
        type: 'error'
      });
      
      throw error;
    }
  }, [fetchCashFlows, toast, showNotification]);

  // Deletar movimentação
  const deleteCashFlow = useCallback(async (id: string) => {
    try {
      console.log('🔄 Deletando movimentação:', id);
      
      // Buscar dados da movimentação antes de deletar para a notificação
      const cashFlow = cashFlows.find(cf => cf.id === id);
      
      await api.delete(`/cash-flows/${id}`);
      console.log('✅ Movimentação deletada');
      
      await fetchCashFlows();
      
      toast({
        title: 'Movimentação excluída',
        description: 'A movimentação foi excluída com sucesso.',
        duration: 3000,
      });

      showNotification({
        title: '🗑️ Movimentação Excluída',
        message: cashFlow ? 
          `${cashFlow.type === 'INCOME' ? 'Receita' : 'Despesa'}: ${cashFlow.description} - Valor: R$ ${cashFlow.amount.toFixed(2)}` :
          'Movimentação excluída com sucesso',
        type: 'warning'
      });

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao deletar movimentação:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a movimentação',
        variant: 'destructive',
        duration: 5000,
      });
      
      showNotification({
        title: '❌ Erro ao Excluir',
        message: 'Não foi possível excluir a movimentação. Tente novamente.',
        type: 'error'
      });
      
      throw error;
    }
  }, [fetchCashFlows, toast, showNotification, cashFlows]);

  // Atualizar status
  const updateStatus = useCallback(async (id: string, status: string, paymentDate?: string) => {
    try {
      console.log('🔄 Atualizando status:', id, status);
      
      // Buscar dados da movimentação para a notificação
      const cashFlow = cashFlows.find(cf => cf.id === id);
      
      const response = await api.patch(`/cash-flows/${id}/status`, {
        status,
        paymentDate
      });
      console.log('✅ Status atualizado:', response.data);
      
      await fetchCashFlows();
      
      toast({
        title: 'Status atualizado',
        description: `Status alterado para ${status}`,
        duration: 3000,
      });

      // Notificação personalizada baseada no status
      let notificationTitle = '';
      let notificationType: 'success' | 'info' | 'warning' | 'error' = 'info';
      
      switch(status) {
        case 'PAID':
          notificationTitle = '💰 Despesa Paga';
          notificationType = 'success';
          break;
        case 'RECEIVED':
          notificationTitle = '💵 Receita Recebida';
          notificationType = 'success';
          break;
        case 'PENDING':
          notificationTitle = '⏳ Status Pendente';
          notificationType = 'warning';
          break;
        case 'CANCELLED':
          notificationTitle = '❌ Movimentação Cancelada';
          notificationType = 'warning';
          break;
        default:
          notificationTitle = '📝 Status Atualizado';
      }
      
      showNotification({
        title: notificationTitle,
        message: cashFlow ? 
          `${cashFlow.description} - Valor: R$ ${cashFlow.amount.toFixed(2)}` :
          'Status da movimentação atualizado',
        type: notificationType
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Não foi possível atualizar o status',
        variant: 'destructive',
        duration: 5000,
      });
      
      showNotification({
        title: '❌ Erro ao Atualizar Status',
        message: 'Não foi possível atualizar o status. Tente novamente.',
        type: 'error'
      });
      
      throw error;
    }
  }, [fetchCashFlows, toast, showNotification, cashFlows]);

  // Carregamento inicial
  useEffect(() => {
    console.log('🚀 Inicializando useCashFlow...');
    fetchCashFlows();
    fetchCategories();
    fetchAccounts();
  }, [fetchCashFlows, fetchCategories, fetchAccounts]);

  // Atualizar resumo quando cashFlows mudarem
  useEffect(() => {
    if (cashFlows.length > 0) {
      fetchSummary();
    }
  }, [cashFlows, fetchSummary]);

  return {
    cashFlows,
    summary,
    categories,
    accounts,
    loading,
    error,
    fetchCashFlows,
    createCashFlow,
    updateCashFlow,
    deleteCashFlow,
    updateStatus
  };
};