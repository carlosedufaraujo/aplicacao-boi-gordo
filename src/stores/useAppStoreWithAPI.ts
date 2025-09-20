// Store integrado com API - versão completa e robusta
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import api from '../services/api';
import { 
  FatteningCycle, Partner, CattlePurchase, CattlePurchase, WeightReading, 
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
  cattlePurchases: CattlePurchase[];
  cattlePurchases: CattlePurchase[];
  currentWeightReadings: WeightReading[];
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
  addCattlePurchase: (order: Omit<CattlePurchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCattlePurchase: (id: string, data: Partial<CattlePurchase>) => Promise<void>;
  deleteCattlePurchase: (id: string) => Promise<void>;
  moveCattlePurchaseToNextStage: (id: string) => Promise<void>;
  moveCattlePurchaseToPreviousStage: (id: string) => Promise<void>;
  loadCattlePurchases: () => Promise<void>;
  
  // Lotes
  addCattlePurchase: (lot: Omit<CattlePurchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCattlePurchase: (id: string, data: Partial<CattlePurchase>) => Promise<void>;
  deleteCattlePurchase: (id: string) => Promise<void>;
  loadCattlePurchases: () => Promise<void>;
  
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
  
  // Notificações
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotificationsCount: () => number;
  
  // Métodos auxiliares
  generateCattlePurchaseCode: () => Promise<string>;
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
        cattlePurchases: [],
        cattlePurchases: [],
        currentWeightReadings: [],
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
              get().loadCattlePurchases(),
              get().loadCattlePurchases(),
              get().loadExpenses(),
              get().loadDashboardData(),
            ]);
            
            set({ lastSync: new Date() });
          } catch (_error) {
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
          } catch (_error) {
            console.error('Erro ao carregar ciclos:', error);
            throw error;
          }
        },
        
        addCycle: async (cycle) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newCycle = await (api as any).cadastros.cycles.create(cycle);
            set(state => ({ cycles: [...state.cycles, newCycle] }));
          } catch (_error) {
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
            const updatedCycle = await (api as any).cadastros.cycles.update(id, data);
            set(state => ({
              cycles: state.cycles.map(c => c.id === id ? updatedCycle : c)
            }));
          } catch (_error) {
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
            await (api as any).cadastros.cycles.delete(id);
            set(state => ({
              cycles: state.cycles.filter(c => c.id !== id)
            }));
          } catch (_error) {
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
          } catch (_error) {
            console.error('Erro ao carregar parceiros:', error);
            throw error;
          }
        },
        
        addPartner: async (partner) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newPartner = await (api as any).cadastros.partners.create(partner);
            set(state => ({ partners: [...state.partners, newPartner] }));
          } catch (_error) {
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
            const updatedPartner = await (api as any).cadastros.partners.update(id, data);
            set(state => ({
              partners: state.partners.map(p => p.id === id ? updatedPartner : p)
            }));
          } catch (_error) {
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
            await (api as any).cadastros.partners.delete(id);
            set(state => ({
              partners: state.partners.filter(p => p.id !== id)
            }));
          } catch (_error) {
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
          } catch (_error) {
            console.error('Erro ao carregar currais:', error);
            throw error;
          }
        },
        
        addPenRegistration: async (pen) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newPen = await (api as any).cadastros.pens.create(pen);
            set(state => ({ penRegistrations: [...state.penRegistrations, newPen] }));
          } catch (_error) {
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
            const updatedPen = await (api as any).cadastros.pens.update(id, data);
            set(state => ({
              penRegistrations: state.penRegistrations.map(p => p.id === id ? updatedPen : p)
            }));
          } catch (_error) {
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
            await (api as any).cadastros.pens.delete(id);
            set(state => ({
              penRegistrations: state.penRegistrations.filter(p => p.id !== id)
            }));
          } catch (_error) {
            setError('Erro ao deletar curral');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== CONTAS PAGADORAS =====
        loadPayerAccounts: async () => {
          try {
            const data: any = await api.getFrontendData();
            set({ payerAccounts: data.payerAccounts || [] });
          } catch (_error) {
            console.error('Erro ao carregar contas pagadoras:', error);
            throw error;
          }
        },
        
        addPayerAccount: async (account) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newAccount = await (api as any).cadastros.payerAccounts.create(account);
            set(state => ({ payerAccounts: [...state.payerAccounts, newAccount] }));
          } catch (_error) {
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
            const updatedAccount = await (api as any).cadastros.payerAccounts.update(id, data);
            set(state => ({
              payerAccounts: state.payerAccounts.map(a => a.id === id ? updatedAccount : a)
            }));
          } catch (_error) {
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
            await (api as any).cadastros.payerAccounts.delete(id);
            set(state => ({
              payerAccounts: state.payerAccounts.filter(a => a.id !== id)
            }));
          } catch (_error) {
            setError('Erro ao deletar conta pagadora');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== ORDENS DE COMPRA =====
        loadCattlePurchases: async () => {
          try {
            const data: any = await api.getFrontendData();
            set({ cattlePurchases: data.cattlePurchases || [] });
          } catch (_error) {
            console.error('Erro ao carregar ordens de compra:', error);
            throw error;
          }
        },
        
        addCattlePurchase: async (order) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newOrder = await (api as any).pipeline.cattlePurchases.create(order);
            set(state => ({ cattlePurchases: [...state.cattlePurchases, newOrder] }));
          } catch (_error) {
            setError('Erro ao criar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateCattlePurchase: async (id, data) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await (api as any).pipeline.cattlePurchases.update(id, data);
            set(state => ({
              cattlePurchases: state.cattlePurchases.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (_error) {
            setError('Erro ao atualizar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteCattlePurchase: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await (api as any).pipeline.cattlePurchases.delete(id);
            set(state => ({
              cattlePurchases: state.cattlePurchases.filter(o => o.id !== id)
            }));
          } catch (_error) {
            setError('Erro ao deletar ordem de compra');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        moveCattlePurchaseToNextStage: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await (api as any).pipeline.cattlePurchases.moveToNextStage(id);
            set(state => ({
              cattlePurchases: state.cattlePurchases.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (_error) {
            setError('Erro ao mover ordem para próximo estágio');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        moveCattlePurchaseToPreviousStage: async (id) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedOrder = await (api as any).pipeline.cattlePurchases.moveToPreviousStage(id);
            set(state => ({
              cattlePurchases: state.cattlePurchases.map(o => o.id === id ? updatedOrder : o)
            }));
          } catch (_error) {
            setError('Erro ao mover ordem para estágio anterior');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== LOTES ===== (duplicado - comentado)
        /* loadCattlePurchases: async () => {
          try {
            const data: any = await api.getFrontendData();
            set({ cattlePurchases: data.cattlePurchases || [] });
          } catch (_error) {
            console.error('Erro ao carregar lotes:', error);
            throw error;
          }
        }, */
        
        addCattlePurchase2: async (lot: any) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newLot = await (api as any).lots.lots.create(lot);
            set(state => ({ cattlePurchases: [...state.cattlePurchases, newLot] }));
          } catch (_error) {
            setError('Erro ao criar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateCattlePurchase2: async (id: any, data: any) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const updatedLot = await (api as any).lots.lots.update(id, data);
            set(state => ({
              cattlePurchases: state.cattlePurchases.map(l => l.id === id ? updatedLot : l)
            }));
          } catch (_error) {
            setError('Erro ao atualizar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteCattlePurchase2: async (id: any) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            await (api as any).lots.lots.delete(id);
            set(state => ({
              cattlePurchases: state.cattlePurchases.filter(l => l.id !== id)
            }));
          } catch (_error) {
            setError('Erro ao deletar lote');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== DESPESAS =====
        loadExpenses: async (_filters?: any) => {
          try {
            const data: any = await api.getFrontendData();
            set({ expenses: data.expenses || [] });
          } catch (_error) {
            console.error('Erro ao carregar despesas:', error);
            throw error;
          }
        },
        
        addExpense: async (expense) => {
          const { setLoading, setError } = get();
          setLoading(true);
          try {
            const newExpense = await (api as any).financial.expenses.create(expense);
            set(state => ({ expenses: [...state.expenses, newExpense] }));
          } catch (_error) {
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
            const updatedExpense = await (api as any).financial.expenses.update(id, data);
            set(state => ({
              expenses: state.expenses.map(e => e.id === id ? updatedExpense : e)
            }));
          } catch (_error) {
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
            await (api as any).financial.expenses.delete(id);
            set(state => ({
              expenses: state.expenses.filter(e => e.id !== id)
            }));
          } catch (_error) {
            setError('Erro ao deletar despesa');
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ===== DASHBOARD =====
        loadDashboardData: async (_period?: string) => {
          try {
            const data: any = await api.getStats();
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
          } catch (_error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            throw error;
          }
        },
        
        updateKPIs: async () => {
          const { loadDashboardData } = get();
          await loadDashboardData();
        },
        
        // ===== NOTIFICAÇÕES =====
        markNotificationAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(notification => 
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        })),

        markAllNotificationsAsRead: () => set((state) => ({
          notifications: state.notifications.map(notification => ({ ...notification, isRead: true }))
        })),

        deleteNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        })),

        clearAllNotifications: () => set(() => ({
          notifications: []
        })),

        getUnreadNotificationsCount: () => {
          const { notifications } = get();
          return notifications.filter(notification => !notification.isRead).length;
        },
        
        // ===== MÉTODOS AUXILIARES =====
        generateCattlePurchaseCode: async () => {
          try {
            const { code } = await (api as any).pipeline?.cattlePurchases?.generateCode() || { code: `OC-${Date.now()}` };
            return code;
          } catch (_error) {
            console.error('Erro ao gerar código de ordem:', error);
            return `OC-${Date.now()}`;
          }
        },
        
        generateLotNumber: async () => {
          try {
            const { number } = await (api as any).lots?.lots?.generateNumber() || { number: `L-${Date.now()}` };
            return number;
          } catch (_error) {
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
  // Sincronizar ao carregar a aplicação com delay maior
  setTimeout(() => {
    useAppStoreWithAPI.getState().syncWithBackend();
  }, 3000);
  
  // Re-sincronizar a cada 10 minutos (aumentado de 5 minutos)
  setInterval(() => {
    useAppStoreWithAPI.getState().syncWithBackend();
  }, 10 * 60 * 1000);
}

export default useAppStoreWithAPI;
