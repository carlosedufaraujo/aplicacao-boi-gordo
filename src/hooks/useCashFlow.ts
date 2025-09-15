import { useState, useEffect, useCallback } from 'react';
import cashFlowService, {
  CashFlow,
  CashFlowSummary,
  FinancialCategory,
  FinancialAccount
} from '@/services/api/cashFlow';
import categoryAPI from '@/services/api/categoryApi';
import calendarEventService from '@/services/api/calendarEvent';
import api from '@/lib/api';

import { toast } from 'sonner';
export const useCashFlow = () => {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Buscar dados do Cash Flow
  const fetchCashFlows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/cash-flows');
      
      if (Array.isArray(response.data)) {
        setCashFlows(response.data);
      } else {
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
      const response = await api.get('/cash-flows/summary');
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
      const apiCategories = await categoryAPI.getAll();
      const formattedCategories = apiCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'INCOME' | 'EXPENSE',
        color: cat.color,
        icon: cat.icon,
        isActive: cat.isActive !== false
      }));
      setCategories(formattedCategories);
    } catch (error: any) {
      console.error('❌ Erro ao buscar categorias:', error);
      toast.error('Não foi possível carregar as categorias. Tente novamente.');
      setCategories([]);
    }
  }, [toast]);

  // Buscar contas
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/payer-accounts');
      
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
      const response = await api.post('/cash-flows', data);
      
      await fetchCashFlows();

      toast({
        title: data.type === 'INCOME' ? '💵 Nova Receita' : '💸 Nova Despesa',
        description: `${data.description} - R$ ${data.amount.toFixed(2)}`,
        duration: 3000,
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
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar movimentação:', error);
      toast.error(error.message || 'Não foi possível criar a movimentação', {
        variant: 'destructive',
        duration: 5000,
      });
      throw error;
    }
  }, [fetchCashFlows, toast]);

  // Atualizar movimentação
  const updateCashFlow = useCallback(async (id: string, data: any) => {
    try {
      const response = await api.put(`/cash-flows/${id}`, data);
      
      await fetchCashFlows();

      toast({
        title: '✏️ Movimentação Atualizada',
        description: `${data.description} - R$ ${data.amount.toFixed(2)}`,
        duration: 3000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar movimentação:', error);
      toast.error(error.message || 'Não foi possível atualizar a movimentação', {
        variant: 'destructive',
        duration: 5000,
      });

      toast.error('Não foi possível atualizar a movimentação. Tente novamente.');
      
      throw error;
    }
  }, [fetchCashFlows, toast]);

  // Deletar movimentação
  const deleteCashFlow = useCallback(async (id: string) => {
    try {
      
      // Buscar dados da movimentação antes de deletar para a notificação
      const cashFlow = cashFlows.find(cf => cf.id === id);
      
      await api.delete(`/cash-flows/${id}`);
      
      await fetchCashFlows();

      toast({
        title: '🗑️ Movimentação Excluída',
        description: cashFlow ? `${cashFlow.description}` : 'Movimentação excluída com sucesso',
        duration: 3000,
      });

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao deletar movimentação:', error);
      toast.error(error.message || 'Não foi possível excluir a movimentação', {
        variant: 'destructive',
        duration: 5000,
      });

      toast.error('Não foi possível excluir a movimentação. Tente novamente.');
      
      throw error;
    }
  }, [fetchCashFlows, toast, cashFlows]);

  // Atualizar status
  const updateStatus = useCallback(async (id: string, status: string, paymentDate?: string) => {
    try {
      
      // Buscar dados da movimentação para a notificação
      const cashFlow = cashFlows.find(cf => cf.id === id);
      
      const response = await api.patch(`/cash-flows/${id}/status`, {
        status,
        paymentDate
      });
      
      await fetchCashFlows();
      
      toast({
        title: 'Status atualizado',
        description: `Status alterado para ${status}`,
        duration: 3000,
      });

      // Notificação personalizada baseada no status
      let notificationTitle = '';

      switch(status) {
        case 'PAID':
          notificationTitle = '💰 Despesa Paga';
          break;
        case 'RECEIVED':
          notificationTitle = '💵 Receita Recebida';
          break;
        case 'PENDING':
          notificationTitle = '⏳ Status Pendente';
          break;
        case 'CANCELLED':
          notificationTitle = '❌ Movimentação Cancelada';
          break;
        default:
          notificationTitle = '📝 Status Atualizado';
      }

      toast({
        title: notificationTitle,
        description: cashFlow ?
          `${cashFlow.description} - Valor: R$ ${cashFlow.amount.toFixed(2)}` :
          'Status da movimentação atualizado'
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error(error.message || 'Não foi possível atualizar o status', {
        variant: 'destructive',
        duration: 5000,
      });

      toast.error('Não foi possível atualizar o status. Tente novamente.');
      
      throw error;
    }
  }, [fetchCashFlows, toast, cashFlows]);

  // Carregamento inicial
  useEffect(() => {
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
