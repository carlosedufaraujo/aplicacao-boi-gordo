// Store integrado com API - versão completa e robusta
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import api from '../services/api';
import { 
  FatteningCycle, Partner, PurchaseOrder, CattleLot, WeightReading, 
  HealthRecord, FeedCost, LotMovement, SaleSimulation, FinancialAccount,
  KPI, PenStatus, Debt, ZootechnicalPerformance, BankStatement, 
  FinancialReconciliation, CostCenter, CostAllocation, Expense, 
  BudgetPlan, FinancialReport, PenRegistration, PenAllocation, 
  PayerAccount, SaleRecord, Notification, LoteCurralLink, 
  CostProportionalAllocation, SaleDesignation,
  Transporter, FinancialInstitution,
  SystemUpdate, UpdateFeedback,
  CashFlowEntry, CashFlowPeriod, CashFlowProjection, WorkingCapital,
  FinancialContribution, NonCashExpense,
  DREStatement, DREGenerationParams, DREComparison,
  IndirectCostAllocation, AllocationTemplate, IndirectCostCenter
} from '../types';

interface AppState {
  // Estado
  currentPage: string;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  
  // Dados - mantidos localmente para cache
  cycles: FatteningCycle[];
  partners: Partner[];
  purchaseOrders: PurchaseOrder[];
  cattleLots: CattleLot[];
  weightReadings: WeightReading[];
  healthRecords: HealthRecord[];
  feedCosts: FeedCost[];
  lotMovements: LotMovement[];
  financialAccounts: FinancialAccount[];
  kpis: KPI[];
  penRegistrations: PenRegistration[];
  penAllocations: PenAllocation[];
  penStatuses: PenStatus[];
  debts: Debt[];
  bankStatements: BankStatement[];
  financialReconciliations: FinancialReconciliation[];
  costCenters: CostCenter[];
  costAllocations: CostAllocation[];
  expenses: Expense[];
  budgetPlans: BudgetPlan[];
  financialReports: FinancialReport[];
  payerAccounts: PayerAccount[];
  saleRecords: SaleRecord[];
  notifications: Notification[];
  loteCurralLinks: LoteCurralLink[];
  costProportionalAllocations: CostProportionalAllocation[];
  saleDesignations: SaleDesignation[];
  transporters: Transporter[];
  financialInstitutions: FinancialInstitution[];
  systemUpdates: SystemUpdate[];
  updateFeedbacks: UpdateFeedback[];
  lastViewedUpdateDate?: Date;
  cashFlowEntries: CashFlowEntry[];
  financialContributions: FinancialContribution[];
  cashFlowPeriods: CashFlowPeriod[];
  cashFlowProjections: CashFlowProjection[];
  workingCapitalHistory: WorkingCapital[];
  nonCashExpenses: NonCashExpense[];
  dreStatements: DREStatement[];
  dreComparisons: DREComparison[];
  indirectCostAllocations: IndirectCostAllocation[];
  allocationTemplates: AllocationTemplate[];
  indirectCostCenters: IndirectCostCenter[];
  
  // Ações - Navegação
  setCurrentPage: (page: string) => void;
  setDarkMode: (darkMode: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Ações - Sincronização
  syncWithBackend: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // ===== AÇÕES INTEGRADAS COM API =====
  
  // Ciclos
  addCycle: (cycle: Omit<FatteningCycle, 'id' | 'createdAt'>) => Promise<void>;
  updateCycle: (id: string, data: Partial<FatteningCycle>) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
  loadCycles: () => Promise<void>;
  
  // Parceiros
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => Promise<void>;
  updatePartner: (id: string, data: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  loadPartners: (type?: string) => Promise<void>;
  
  // Ordens de Compra
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  movePurchaseOrderToNextStage: (id: string) => Promise<void>;
  movePurchaseOrderToPreviousStage: (id: string) => Promise<void>;
  loadPurchaseOrders: () => Promise<void>;
  
  // Lotes
  addCattleLot: (lot: Omit<CattleLot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCattleLot: (id: string, data: Partial<CattleLot>) => Promise<void>;
  deleteCattleLot: (id: string) => Promise<void>;
  loadCattleLots: () => Promise<void>;
  
  // Currais
  addPenRegistration: (pen: Omit<PenRegistration, 'id' | 'createdAt'>) => Promise<void>;
  updatePenRegistration: (id: string, data: Partial<PenRegistration>) => Promise<void>;
  deletePenRegistration: (id: string) => Promise<void>;
  loadPenRegistrations: () => Promise<void>;
  
  // Contas Pagadoras
  addPayerAccount: (account: Omit<PayerAccount, 'id' | 'createdAt'>) => Promise<void>;
  updatePayerAccount: (id: string, data: Partial<PayerAccount>) => Promise<void>;
  deletePayerAccount: (id: string) => Promise<void>;
  loadPayerAccounts: () => Promise<void>;
  
  // Despesas
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loadExpenses: (filters?: any) => Promise<void>;
  
  // Dashboard
  loadDashboardData: (period?: string) => Promise<void>;
  updateKPIs: () => Promise<void>;
  
  // Métodos auxiliares
  generatePurchaseOrderCode: () => Promise<string>;
  generateLotNumber: () => Promise<string>;
}

export const useAppStoreWithAPI = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        currentPage: 'dashboard',
        darkMode: false,
        sidebarCollapsed: false,
        isLoading: false,
        error: null,
        lastSync: null,
        
        // Dados iniciais vazios
        cycles: [],
        partners: [],
        purchaseOrders: [],
        cattleLots: [],
        weightReadings: [],
        healthRecords: [],
        feedCosts: [],
        lotMovements: [],
        financialAccounts: [],
        kpis: [],
        penRegistrations: [],
        penAllocations: [],
        penStatuses: [],
        debts: [],
        bankStatements: [],
        financialReconciliations: [],
        costCenters: [],
        costAllocations: [],
        expenses: [],
        budgetPlans: [],
        financialReports: [],
        payerAccounts: [],
        saleRecords: [],
        notifications: [],
        loteCurralLinks: [],
        costProportionalAllocations: [],
        saleDesignations: [],
        transporters: [],
        financialInstitutions: [],
        systemUpdates: [],
        updateFeedbacks: [],
        cashFlowEntries: [],
        financialContributions: [],
        cashFlowPeriods: [],
        cashFlowProjections: [],
        workingCapitalHistory: [],
        nonCashExpenses: [],
        dreStatements: [],
        dreComparisons: [],
        indirectCostAllocations: [],
        allocationTemplates: [],
        indirectCostCenters: [],
        
        // Ações de navegação
        setCurrentPage: (page) => set({ currentPage: page }),
        setDarkMode: (darkMode) => set({ darkMode }),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        // Ações de estado
        setError: (error) => set({ error }),
        setLoading: (loading) => set({ isLoading: loading }),
        
        // ===== SINCRONIZAÇÃO PRINCIPAL =====
        syncWithBackend: async () => {
          const { setLoading, setError } = get();
          setLoading(true);
          setError(null);
          
          try {
            // Carregar todos os dados essenciais em paralelo
            await Promise.all([
              get().loadCycles(),
              get().loadPartners(),
              get().loadPenRegistrations(),
              get().loadPayerAccounts(),
              get().loadPurchaseOrders(),
              get().loadCattleLots(),
              get().loadExpenses(),
              get().loadDashboardData(),
            ]);
            
            set({ lastSync: new Date() });
          } catch (error) {
            console.error('Erro na sincronização:', error);
            setError('Erro ao sincronizar com o servidor');
          } finally {
            setLoading(false);
          }
        },
        
        // ===== CICLOS =====
        loadCycles: async () => {
          try {
            const data = await api.getFrontendData();
            set({ cycles: data.cycles || [] });
          } catch (error) {
            console.error('Erro ao carregar ciclos:', error);
            throw error;
          }
        },
        
        addCycle: async (cycle) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newCycle = await api.cadastros.cycles.create(cycle);
            set(state => ({ cycles: [...state.cycles, newCycle] }));
          } catch (error) {
            setError('Erro ao criar ciclo');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateCycle: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedCycle = await api.cadastros.cycles.update(id, data);
            set(state => ({
              cycles: state.cycles.map(c => c.id === id ? updatedCycle : c)
            }));
          } catch (error) {
            setError('Erro ao atualizar ciclo');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteCycle: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.cadastros.cycles.delete(id);
            set(state => ({
              cycles: state.cycles.filter(c => c.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar ciclo');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== PARCEIROS =====
        loadPartners: async (type?: string) => {
          try {
            const data = await api.getFrontendData();
            set({ partners: data.partners || [] });
          } catch (error) {
            console.error('Erro ao carregar parceiros:', error);
            throw error;
          }
        },
        
        addPartner: async (partner) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newPartner = await api.cadastros.partners.create(partner);
            set(state => ({ partners: [...state.partners, newPartner] }));
          } catch (error) {
            setError('Erro ao criar parceiro');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updatePartner: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedPartner = await api.cadastros.partners.update(id, data);
            set(state => ({
              partners: state.partners.map(p => p.id === id ? updatedPartner : p)
            }));
          } catch (error) {
            setError('Erro ao atualizar parceiro');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deletePartner: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.cadastros.partners.delete(id);
            set(state => ({
              partners: state.partners.filter(p => p.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar parceiro');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== CURRAIS =====
        loadPenRegistrations: async () => {
          try {
            const data = await api.getFrontendData();
            set({ penRegistrations: data.pens || [] });
          } catch (error) {
            console.error('Erro ao carregar currais:', error);
            throw error;
          }
        },
        
        addPenRegistration: async (pen) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newPen = await api.cadastros.pens.create(pen);
            set(state => ({ penRegistrations: [...state.penRegistrations, newPen] }));
          } catch (error) {
            setError('Erro ao criar curral');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updatePenRegistration: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedPen = await api.cadastros.pens.update(id, data);
            set(state => ({
              penRegistrations: state.penRegistrations.map(p => p.id === id ? updatedPen : p)
            }));
          } catch (error) {
            setError('Erro ao atualizar curral');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deletePenRegistration: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.cadastros.pens.delete(id);
            set(state => ({
              penRegistrations: state.penRegistrations.filter(p => p.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar curral');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== CONTAS PAGADORAS =====
        loadPayerAccounts: async () => {
          try {
            const data = await api.getFrontendData();
            set({ payerAccounts: data.payerAccounts || [] });
          } catch (error) {
            console.error('Erro ao carregar contas pagadoras:', error);
            throw error;
          }
        },
        
        addPayerAccount: async (account) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newAccount = await api.cadastros.payerAccounts.create(account);
            set(state => ({ payerAccounts: [...state.payerAccounts, newAccount] }));
          } catch (error) {
            setError('Erro ao criar conta pagadora');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updatePayerAccount: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedAccount = await api.cadastros.payerAccounts.update(id, data);
            set(state => ({
              payerAccounts: state.payerAccounts.map(a => a.id === id ? updatedAccount : a)
            }));
          } catch (error) {
            setError('Erro ao atualizar conta pagadora');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deletePayerAccount: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.cadastros.payerAccounts.delete(id);
            set(state => ({
              payerAccounts: state.payerAccounts.filter(a => a.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar conta pagadora');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== ORDENS DE COMPRA =====
        loadPurchaseOrders: async () => {
          try {
            const data = await api.getFrontendData();
            set({ purchaseOrders: data.purchaseOrders || [] });
          } catch (error) {
            console.error('Erro ao carregar ordens de compra:', error);
            throw error;
          }
        },
        
        addPurchaseOrder: async (order) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newOrder = await api.pipeline.purchaseOrders.create(order);
            set(state => ({ purchaseOrders: [...state.purchaseOrders, newOrder] }));
          } catch (error) {
            setError('Erro ao criar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updatePurchaseOrder: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await api.pipeline.purchaseOrders.update(id, data);
            set(state => ({
              purchaseOrders: state.purchaseOrders.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (error) {
            setError('Erro ao atualizar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deletePurchaseOrder: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.pipeline.purchaseOrders.delete(id);
            set(state => ({
              purchaseOrders: state.purchaseOrders.filter(o => o.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        movePurchaseOrderToNextStage: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await api.pipeline.purchaseOrders.moveToNextStage(id);
            set(state => ({
              purchaseOrders: state.purchaseOrders.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (error) {
            setError('Erro ao mover ordem para próximo estágio');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        movePurchaseOrderToPreviousStage: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await api.pipeline.purchaseOrders.moveToPreviousStage(id);
            set(state => ({
              purchaseOrders: state.purchaseOrders.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (error) {
            setError('Erro ao mover ordem para estágio anterior');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== LOTES =====
        loadCattleLots: async () => {
          try {
            const data = await api.getFrontendData();
            set({ cattleLots: data.cattleLots || [] });
          } catch (error) {
            console.error('Erro ao carregar lotes:', error);
            throw error;
          }
        },
        
        addCattleLot: async (lot) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newLot = await api.lots.lots.create(lot);
            set(state => ({ cattleLots: [...state.cattleLots, newLot] }));
          } catch (error) {
            setError('Erro ao criar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateCattleLot: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedLot = await api.lots.lots.update(id, data);
            set(state => ({
              cattleLots: state.cattleLots.map(l => l.id === id ? updatedLot : l)
            }));
          } catch (error) {
            setError('Erro ao atualizar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteCattleLot: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.lots.lots.delete(id);
            set(state => ({
              cattleLots: state.cattleLots.filter(l => l.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== DESPESAS =====
        loadExpenses: async (filters?: any) => {
          try {
            const data = await api.getFrontendData();
            set({ expenses: data.expenses || [] });
          } catch (error) {
            console.error('Erro ao carregar despesas:', error);
            throw error;
          }
        },
        
        addExpense: async (expense) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newExpense = await api.financial.expenses.create(expense);
            set(state => ({ expenses: [...state.expenses, newExpense] }));
          } catch (error) {
            setError('Erro ao criar despesa');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateExpense: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedExpense = await api.financial.expenses.update(id, data);
            set(state => ({
              expenses: state.expenses.map(e => e.id === id ? updatedExpense : e)
            }));
          } catch (error) {
            setError('Erro ao atualizar despesa');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteExpense: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await api.financial.expenses.delete(id);
            set(state => ({
              expenses: state.expenses.filter(e => e.id !== id)
            }));
          } catch (error) {
            setError('Erro ao deletar despesa');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== DASHBOARD =====
        loadDashboardData: async (period?: string) => {
          try {
            const data = await api.getStats();
            // Atualizar KPIs e outras métricas
            const kpis: KPI[] = [
              { label: 'Animais Confinados', value: data.totalCattle?.toString() || '0', icon: 'Beef' },
              { label: 'Lotes Ativos', value: data.activeLots?.toString() || '0', icon: 'Package' },
              { label: 'Currais Ocupados', value: data.occupiedPens?.toString() || '0', icon: 'Home' },
              { label: 'Receita Total', value: `R$ ${(data.totalRevenue || 0).toLocaleString('pt-BR')}`, icon: 'TrendingUp' },
              { label: 'Despesas', value: `R$ ${(data.totalExpenses || 0).toLocaleString('pt-BR')}`, icon: 'TrendingDown' },
              { label: 'Lucro Líquido', value: `R$ ${(data.netProfit || 0).toLocaleString('pt-BR')}`, icon: 'DollarSign' },
            ];
            set({ kpis });
          } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            throw error;
          }
        },
        
        updateKPIs: async () => {
          const { loadDashboardData } = get();
          await loadDashboardData();
        },
        
        // ===== MÉTODOS AUXILIARES =====
        generatePurchaseOrderCode: async () => {
          try {
            const { code } = await api.pipeline.purchaseOrders.generateCode();
            return code;
          } catch (error) {
            console.error('Erro ao gerar código de ordem:', error);
            return `OC-${Date.now()}`;
          }
        },
        
        generateLotNumber: async () => {
          try {
            const { number } = await api.lots.lots.generateNumber();
            return number;
          } catch (error) {
            console.error('Erro ao gerar número de lote:', error);
            return `LOT-${Date.now()}`;
          }
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          darkMode: state.darkMode,
          sidebarCollapsed: state.sidebarCollapsed,
          lastSync: state.lastSync,
        }),
      }
    )
  )
);

// Auto-sync ao inicializar
if (typeof window !== 'undefined') {
  // Sincronizar ao carregar a aplicação
  setTimeout(() => {
    useAppStoreWithAPI.getState().syncWithBackend();
  }, 1000);
  
  // Re-sincronizar a cada 5 minutos
  setInterval(() => {
    useAppStoreWithAPI.getState().syncWithBackend();
  }, 5 * 60 * 1000);
}

export default useAppStoreWithAPI;