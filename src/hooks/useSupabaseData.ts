// Este arquivo foi migrado para usar os hooks da pasta /hooks/api/
// Mantido apenas para compatibilidade durante a migração
// USE os hooks específicos em /hooks/api/ em vez deste arquivo

import { useCattlePurchasesApi } from './api/useCattlePurchasesApi';
import { usePartnersApi } from './api/usePartnersApi';
import { usePensApi } from './api/usePensApi';
import { useExpensesApi } from './api/useExpensesApi';
import { useRevenuesApi } from './api/useRevenuesApi';
import { usePayerAccountsApi } from './api/usePayerAccountsApi';
import { useCattlePurchasesApi } from './api/useCattlePurchasesApi';

// Re-export dos tipos para compatibilidade
export type {
  CattlePurchase,
  CattlePurchase,
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
// HOOKS MIGRADOS - Use os novos hooks diretamente
// ============================================================================

export const useCattlePurchases = () => {
  return useCattlePurchasesApi();
};

export const usePartners = () => {
  return usePartnersApi();
};

export const usePens = () => {
  return usePensApi();
};

export const useExpenses = () => {
  return useExpensesApi();
};

export const useRevenues = () => {
  return useRevenuesApi();
};

export const usePayerAccounts = () => {
  return usePayerAccountsApi();
};

// Hooks ainda não migrados - retornam estrutura vazia
export const useCycles = () => {
  return {
    cycles: [],
    loading: false,
    error: null,
    loadCycles: async () => {},
    createCycle: async () => null,
    updateCycle: async () => null,
    deleteCycle: async () => {}
  };
};

export const useSaleRecords = () => {
  return {
    saleRecords: [],
    loading: false,
    error: null,
    loadSaleRecords: async () => {},
    createSaleRecord: async () => null,
    updateSaleRecord: async () => null,
    deleteSaleRecord: async () => {}
  };
};

export const useCostCenters = () => {
  return {
    costCenters: [],
    loading: false,
    error: null,
    loadCostCenters: async () => {},
    createCostCenter: async () => null,
    updateCostCenter: async () => null,
    deleteCostCenter: async () => {}
  };
};

export const useBankStatements = () => {
  return {
    statements: [],
    loading: false,
    error: null,
    loadStatements: async () => {},
    createStatement: async () => null,
    updateStatement: async () => null,
    deleteStatement: async () => {}
  };
};

export const useDashboard = () => {
  return {
    data: {},
    loading: false,
    error: null,
    refresh: async () => {}
  };
};

export const useFinancialReconciliation = () => {
  return {
    reconciliations: [],
    loading: false,
    error: null,
    loadReconciliations: async () => {},
    createReconciliation: async () => null,
    updateReconciliation: async () => null,
    deleteReconciliation: async () => {}
  };
};
