import { useState, useEffect } from 'react';
import { dataService } from '../services/supabaseData';
import type {
  CattleLot,
  PurchaseOrder,
  Partner,
  Pen,
  Cycle,
  Expense,
  Revenue,
  PayerAccount,
  SaleRecord,
  CostCenter,
  BankStatement,
  FinancialReconciliation
} from '../services/supabaseData';

// ============================================================================
// HOOK PARA LOTES DE GADO
// ============================================================================

export const useCattleLots = () => {
  const [cattleLots, setCattleLots] = useState<CattleLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCattleLots = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando lotes de gado...');
      const data = await dataService.getCattleLots();
      console.log('✅ Lotes carregados:', data.length);
      setCattleLots(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar lotes:', err);
      setError(err.message || 'Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  };

  const createCattleLot = async (lot: Omit<CattleLot, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando lote de gado...');
      const newLot = await dataService.createCattleLot(lot);
      console.log('✅ Lote criado:', newLot.id);
      setCattleLots(prev => [newLot, ...prev]);
      return newLot;
    } catch (err: any) {
      console.error('❌ Erro ao criar lote:', err);
      setError(err.message || 'Erro ao criar lote');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCattleLot = async (id: string, updates: Partial<CattleLot>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando lote:', id);
      const updatedLot = await dataService.updateCattleLot(id, updates);
      console.log('✅ Lote atualizado:', id);
      setCattleLots(prev => prev.map(lot => lot.id === id ? updatedLot : lot));
      return updatedLot;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar lote:', err);
      setError(err.message || 'Erro ao atualizar lote');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCattleLot = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando lote:', id);
      await dataService.deleteCattleLot(id);
      console.log('✅ Lote deletado:', id);
      setCattleLots(prev => prev.filter(lot => lot.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar lote:', err);
      setError(err.message || 'Erro ao deletar lote');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCattleLots();
  }, []);

  return {
    cattleLots,
    loading,
    error,
    loadCattleLots,
    createCattleLot,
    updateCattleLot,
    deleteCattleLot
  };
};

// ============================================================================
// HOOK PARA ORDENS DE COMPRA
// ============================================================================

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando ordens de compra...');
      const data = await dataService.getPurchaseOrders();
      console.log('✅ Ordens carregadas:', data.length);
      setPurchaseOrders(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar ordens de compra:', err);
      setError(err.message || 'Erro ao carregar ordens de compra');
    } finally {
      setLoading(false);
    }
  };

  const createPurchaseOrder = async (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando ordem de compra...');
      const newOrder = await dataService.createPurchaseOrder(order);
      console.log('✅ Ordem criada:', newOrder.id);
      setPurchaseOrders(prev => [newOrder, ...prev]);
      
      // Executar integrações com outros módulos
      try {
        const { LotIntegrationService } = await import('../services/lotIntegrationService');
        await LotIntegrationService.integrateNewLot(newOrder);
        console.log('✅ Integrações do lote concluídas');
      } catch (integrationError) {
        console.error('⚠️ Erro nas integrações do lote (ordem criada com sucesso):', integrationError);
        // Não falha a criação da ordem se as integrações falharem
      }
      
      return newOrder;
    } catch (err: any) {
      console.error('❌ Erro ao criar ordem de compra:', err);
      setError(err.message || 'Erro ao criar ordem de compra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando ordem de compra:', id);
      const updatedOrder = await dataService.updatePurchaseOrder(id, updates);
      console.log('✅ Ordem atualizada:', id);
      setPurchaseOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      return updatedOrder;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar ordem de compra:', err);
      setError(err.message || 'Erro ao atualizar ordem de compra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando ordem de compra:', id);
      await dataService.deletePurchaseOrder(id);
      console.log('✅ Ordem deletada:', id);
      setPurchaseOrders(prev => prev.filter(order => order.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar ordem de compra:', err);
      setError(err.message || 'Erro ao deletar ordem de compra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  return {
    purchaseOrders,
    loading,
    error,
    loadPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder
  };
};

// ============================================================================
// HOOK PARA PARCEIROS
// ============================================================================

export const usePartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando parceiros...');
      const data = await dataService.getPartners();
      console.log('✅ Parceiros carregados:', data.length);
      setPartners(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar parceiros:', err);
      setError(err.message || 'Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const createPartner = async (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando parceiro...');
      const newPartner = await dataService.createPartner(partner);
      console.log('✅ Parceiro criado:', newPartner.id);
      setPartners(prev => [newPartner, ...prev]);
      return newPartner;
    } catch (err: any) {
      console.error('❌ Erro ao criar parceiro:', err);
      setError(err.message || 'Erro ao criar parceiro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando parceiro:', id);
      const updatedPartner = await dataService.updatePartner(id, updates);
      console.log('✅ Parceiro atualizado:', id);
      setPartners(prev => prev.map(partner => partner.id === id ? updatedPartner : partner));
      return updatedPartner;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar parceiro:', err);
      setError(err.message || 'Erro ao atualizar parceiro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePartner = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando parceiro:', id);
      await dataService.deletePartner(id);
      console.log('✅ Parceiro deletado:', id);
      setPartners(prev => prev.filter(partner => partner.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar parceiro:', err);
      setError(err.message || 'Erro ao deletar parceiro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  return {
    partners,
    loading,
    error,
    loadPartners,
    createPartner,
    updatePartner,
    deletePartner
  };
};

// ============================================================================
// HOOK PARA BAÍAS
// ============================================================================

export const usePens = () => {
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPens = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando baías...');
      const data = await dataService.getPens();
      console.log('✅ Baías carregadas:', data.length);
      setPens(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar baías:', err);
      setError(err.message || 'Erro ao carregar baías');
    } finally {
      setLoading(false);
    }
  };

  const createPen = async (pen: Omit<Pen, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando baía...');
      const newPen = await dataService.createPen(pen);
      console.log('✅ Baía criada:', newPen.id);
      setPens(prev => [newPen, ...prev]);
      return newPen;
    } catch (err: any) {
      console.error('❌ Erro ao criar baía:', err);
      setError(err.message || 'Erro ao criar baía');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePen = async (id: string, updates: Partial<Pen>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando baía:', id);
      const updatedPen = await dataService.updatePen(id, updates);
      console.log('✅ Baía atualizada:', id);
      setPens(prev => prev.map(pen => pen.id === id ? updatedPen : pen));
      return updatedPen;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar baía:', err);
      setError(err.message || 'Erro ao atualizar baía');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePen = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando baía:', id);
      await dataService.deletePen(id);
      console.log('✅ Baía deletada:', id);
      setPens(prev => prev.filter(pen => pen.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar baía:', err);
      setError(err.message || 'Erro ao deletar baía');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPens();
  }, []);

  return {
    pens,
    loading,
    error,
    loadPens,
    createPen,
    updatePen,
    deletePen
  };
};

// ============================================================================
// HOOK PARA CICLOS
// ============================================================================

export const useCycles = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando ciclos...');
      const data = await dataService.getCycles();
      console.log('✅ Ciclos carregados:', data.length);
      setCycles(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar ciclos:', err);
      setError(err.message || 'Erro ao carregar ciclos');
    } finally {
      setLoading(false);
    }
  };

  const createCycle = async (cycle: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando ciclo...');
      const newCycle = await dataService.createCycle(cycle);
      console.log('✅ Ciclo criado:', newCycle.id);
      setCycles(prev => [newCycle, ...prev]);
      return newCycle;
    } catch (err: any) {
      console.error('❌ Erro ao criar ciclo:', err);
      setError(err.message || 'Erro ao criar ciclo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCycle = async (id: string, updates: Partial<Cycle>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando ciclo:', id);
      const updatedCycle = await dataService.updateCycle(id, updates);
      console.log('✅ Ciclo atualizado:', id);
      setCycles(prev => prev.map(cycle => cycle.id === id ? updatedCycle : cycle));
      return updatedCycle;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar ciclo:', err);
      setError(err.message || 'Erro ao atualizar ciclo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCycle = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando ciclo:', id);
      await dataService.deleteCycle(id);
      console.log('✅ Ciclo deletado:', id);
      setCycles(prev => prev.filter(cycle => cycle.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar ciclo:', err);
      setError(err.message || 'Erro ao deletar ciclo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  return {
    cycles,
    loading,
    error,
    loadCycles,
    createCycle,
    updateCycle,
    deleteCycle
  };
};

// ============================================================================
// HOOK PARA DESPESAS
// ============================================================================

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando despesas...');
      const data = await dataService.getExpenses();
      console.log('✅ Despesas carregadas:', data.length);
      setExpenses(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar despesas:', err);
      setError(err.message || 'Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando despesa...');
      const newExpense = await dataService.createExpense(expense);
      console.log('✅ Despesa criada:', newExpense.id);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err: any) {
      console.error('❌ Erro ao criar despesa:', err);
      setError(err.message || 'Erro ao criar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando despesa:', id);
      const updatedExpense = await dataService.updateExpense(id, updates);
      console.log('✅ Despesa atualizada:', id);
      setExpenses(prev => prev.map(expense => expense.id === id ? updatedExpense : expense));
      return updatedExpense;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar despesa:', err);
      setError(err.message || 'Erro ao atualizar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando despesa:', id);
      await dataService.deleteExpense(id);
      console.log('✅ Despesa deletada:', id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar despesa:', err);
      setError(err.message || 'Erro ao deletar despesa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  };
};

// ============================================================================
// HOOK PARA RECEITAS
// ============================================================================

export const useRevenues = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRevenues = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando receitas...');
      const data = await dataService.getRevenues();
      console.log('✅ Receitas carregadas:', data.length);
      setRevenues(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar receitas:', err);
      setError(err.message || 'Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  };

  const createRevenue = async (revenue: Omit<Revenue, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando receita...');
      const newRevenue = await dataService.createRevenue(revenue);
      console.log('✅ Receita criada:', newRevenue.id);
      setRevenues(prev => [newRevenue, ...prev]);
      return newRevenue;
    } catch (err: any) {
      console.error('❌ Erro ao criar receita:', err);
      setError(err.message || 'Erro ao criar receita');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRevenue = async (id: string, updates: Partial<Revenue>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando receita:', id);
      const updatedRevenue = await dataService.updateRevenue(id, updates);
      console.log('✅ Receita atualizada:', id);
      setRevenues(prev => prev.map(revenue => revenue.id === id ? updatedRevenue : revenue));
      return updatedRevenue;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar receita:', err);
      setError(err.message || 'Erro ao atualizar receita');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRevenue = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando receita:', id);
      await dataService.deleteRevenue(id);
      console.log('✅ Receita deletada:', id);
      setRevenues(prev => prev.filter(revenue => revenue.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar receita:', err);
      setError(err.message || 'Erro ao deletar receita');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenues();
  }, []);

  return {
    revenues,
    loading,
    error,
    loadRevenues,
    createRevenue,
    updateRevenue,
    deleteRevenue
  };
};

// ============================================================================
// HOOK PARA CONTAS PAGADORAS
// ============================================================================

export const usePayerAccounts = () => {
  const [payerAccounts, setPayerAccounts] = useState<PayerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayerAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando contas pagadoras...');
      const data = await dataService.getPayerAccounts();
      console.log('✅ Contas pagadoras carregadas:', data.length);
      setPayerAccounts(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar contas pagadoras:', err);
      setError(err.message || 'Erro ao carregar contas pagadoras');
    } finally {
      setLoading(false);
    }
  };

  const createPayerAccount = async (account: Omit<PayerAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando conta pagadora...');
      const newAccount = await dataService.createPayerAccount(account);
      console.log('✅ Conta pagadora criada:', newAccount.id);
      setPayerAccounts(prev => [newAccount, ...prev]);
      return newAccount;
    } catch (err: any) {
      console.error('❌ Erro ao criar conta pagadora:', err);
      setError(err.message || 'Erro ao criar conta pagadora');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePayerAccount = async (id: string, updates: Partial<PayerAccount>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando conta pagadora:', id);
      const updatedAccount = await dataService.updatePayerAccount(id, updates);
      console.log('✅ Conta pagadora atualizada:', id);
      setPayerAccounts(prev => prev.map(account => account.id === id ? updatedAccount : account));
      return updatedAccount;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar conta pagadora:', err);
      setError(err.message || 'Erro ao atualizar conta pagadora');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayerAccount = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando conta pagadora:', id);
      await dataService.deletePayerAccount(id);
      console.log('✅ Conta pagadora deletada:', id);
      setPayerAccounts(prev => prev.filter(account => account.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar conta pagadora:', err);
      setError(err.message || 'Erro ao deletar conta pagadora');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayerAccounts();
  }, []);

  return {
    payerAccounts,
    loading,
    error,
    loadPayerAccounts,
    createPayerAccount,
    updatePayerAccount,
    deletePayerAccount
  };
};

// ============================================================================
// HOOK PARA DASHBOARD
// ============================================================================

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando dados do dashboard...');
      const data = await dataService.getDashboardData();
      console.log('✅ Dashboard carregado');
      setDashboardData(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    dashboardData,
    loading,
    error,
    loadDashboardData
  };
};

// ============================================================================
// HOOK PARA REGISTROS DE VENDAS
// ============================================================================

export const useSaleRecords = () => {
  const [saleRecords, setSaleRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaleRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando registros de vendas...');
      const data = await dataService.getSaleRecords();
      console.log('✅ Registros de vendas carregados:', data.length);
      setSaleRecords(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar registros de vendas:', err);
      setError(err.message || 'Erro ao carregar registros de vendas');
    } finally {
      setLoading(false);
    }
  };

  const createSaleRecord = async (saleRecord: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando registro de venda...');
      const newSaleRecord = await dataService.createSaleRecord(saleRecord);
      console.log('✅ Registro de venda criado:', newSaleRecord.id);
      setSaleRecords(prev => [newSaleRecord, ...prev]);
      return newSaleRecord;
    } catch (err: any) {
      console.error('❌ Erro ao criar registro de venda:', err);
      setError(err.message || 'Erro ao criar registro de venda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSaleRecord = async (id: string, updates: Partial<SaleRecord>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando registro de venda:', id);
      const updatedSaleRecord = await dataService.updateSaleRecord(id, updates);
      console.log('✅ Registro de venda atualizado:', id);
      setSaleRecords(prev => prev.map(record => record.id === id ? updatedSaleRecord : record));
      return updatedSaleRecord;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar registro de venda:', err);
      setError(err.message || 'Erro ao atualizar registro de venda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSaleRecord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Deletando registro de venda:', id);
      await dataService.deleteSaleRecord(id);
      console.log('✅ Registro de venda deletado:', id);
      setSaleRecords(prev => prev.filter(record => record.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao deletar registro de venda:', err);
      setError(err.message || 'Erro ao deletar registro de venda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaleRecords();
  }, []);

  return {
    saleRecords,
    loading,
    error,
    loadSaleRecords,
    createSaleRecord,
    updateSaleRecord,
    deleteSaleRecord
  };
};

// ============================================================================
// HOOK PARA CENTROS DE CUSTO
// ============================================================================

export const useCostCenters = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando centros de custo...');
      const data = await dataService.getCostCenters();
      console.log('✅ Centros de custo carregados:', data.length);
      setCostCenters(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar centros de custo:', err);
      setError(err.message || 'Erro ao carregar centros de custo');
    } finally {
      setLoading(false);
    }
  };

  const createCostCenter = async (costCenter: Omit<CostCenter, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando centro de custo...');
      const newCostCenter = await dataService.createCostCenter(costCenter);
      console.log('✅ Centro de custo criado:', newCostCenter.id);
      setCostCenters(prev => [newCostCenter, ...prev]);
      return newCostCenter;
    } catch (err: any) {
      console.error('❌ Erro ao criar centro de custo:', err);
      setError(err.message || 'Erro ao criar centro de custo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCostCenter = async (id: string, updates: Partial<CostCenter>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Atualizando centro de custo:', id);
      const updatedCostCenter = await dataService.updateCostCenter(id, updates);
      console.log('✅ Centro de custo atualizado:', updatedCostCenter.id);
      setCostCenters(prev => prev.map(cc => cc.id === id ? updatedCostCenter : cc));
      return updatedCostCenter;
    } catch (err: any) {
      console.error('❌ Erro ao atualizar centro de custo:', err);
      setError(err.message || 'Erro ao atualizar centro de custo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCostCenter = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Excluindo centro de custo:', id);
      await dataService.deleteCostCenter(id);
      console.log('✅ Centro de custo excluído:', id);
      setCostCenters(prev => prev.filter(cc => cc.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao excluir centro de custo:', err);
      setError(err.message || 'Erro ao excluir centro de custo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCostCenters();
  }, []);

  return {
    costCenters,
    loading,
    error,
    loadCostCenters,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter
  };
};

// ============================================================================
// HOOK PARA EXTRATOS BANCÁRIOS
// ============================================================================

export const useBankStatements = () => {
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBankStatements = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando extratos bancários...');
      const data = await dataService.getBankStatements();
      console.log('✅ Extratos bancários carregados:', data.length);
      setBankStatements(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar extratos bancários:', err);
      setError(err.message || 'Erro ao carregar extratos bancários');
    } finally {
      setLoading(false);
    }
  };

  const createBankStatement = async (statement: Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando extrato bancário...');
      const newStatement = await dataService.createBankStatement(statement);
      console.log('✅ Extrato bancário criado:', newStatement.id);
      setBankStatements(prev => [newStatement, ...prev]);
      return newStatement;
    } catch (err: any) {
      console.error('❌ Erro ao criar extrato bancário:', err);
      setError(err.message || 'Erro ao criar extrato bancário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankStatements();
  }, []);

  return {
    bankStatements,
    loading,
    error,
    loadBankStatements,
    createBankStatement
  };
};

// ============================================================================
// HOOK PARA CONCILIAÇÕES FINANCEIRAS
// ============================================================================

export const useFinancialReconciliations = () => {
  const [reconciliations, setReconciliations] = useState<FinancialReconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReconciliations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando conciliações financeiras...');
      const data = await dataService.getFinancialReconciliations();
      console.log('✅ Conciliações financeiras carregadas:', data.length);
      setReconciliations(data);
    } catch (err: any) {
      console.error('❌ Erro ao carregar conciliações financeiras:', err);
      setError(err.message || 'Erro ao carregar conciliações financeiras');
    } finally {
      setLoading(false);
    }
  };

  const createReconciliation = async (reconciliation: Omit<FinancialReconciliation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Criando conciliação financeira...');
      const newReconciliation = await dataService.createFinancialReconciliation(reconciliation);
      console.log('✅ Conciliação financeira criada:', newReconciliation.id);
      setReconciliations(prev => [newReconciliation, ...prev]);
      return newReconciliation;
    } catch (err: any) {
      console.error('❌ Erro ao criar conciliação financeira:', err);
      setError(err.message || 'Erro ao criar conciliação financeira');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliations();
  }, []);

  return {
    reconciliations,
    loading,
    error,
    loadReconciliations,
    createReconciliation
  };
};
