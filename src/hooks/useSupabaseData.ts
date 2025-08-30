// Este arquivo foi migrado para usar os hooks da pasta /hooks/api/
// Mantido apenas para compatibilidade durante a migração
// USE os hooks específicos em /hooks/api/ em vez deste arquivo

import { useCattleLotsApi } from './api/useCattleLotsApi';
import { usePartnersApi } from './api/usePartnersApi';
import { usePensApi } from './api/usePensApi';
import { useExpensesApi } from './api/useExpensesApi';
import { useRevenuesApi } from './api/useRevenuesApi';
import { usePayerAccountsApi } from './api/usePayerAccountsApi';
import { usePurchaseOrdersApi } from './api/usePurchaseOrdersApi';

// Re-export dos tipos para compatibilidade
export type {
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
// HOOKS MIGRADOS - Use os novos hooks diretamente
// ============================================================================

export const useCattleLots = () => {
  console.warn('⚠️ useCattleLots está deprecado. Use useCattleLotsApi()');
  return useCattleLotsApi();
};

export const usePurchaseOrders = () => {
  console.warn('⚠️ usePurchaseOrders está deprecado. Use usePurchaseOrdersApi()');
  return usePurchaseOrdersApi();
};

export const usePartners = () => {
  console.warn('⚠️ usePartners está deprecado. Use usePartnersApi()');
  return usePartnersApi();
};

export const usePens = () => {
  console.warn('⚠️ usePens está deprecado. Use usePensApi()');
  return usePensApi();
};

export const useExpenses = () => {
  console.warn('⚠️ useExpenses está deprecado. Use useExpensesApi()');
  return useExpensesApi();
};

export const useRevenues = () => {
  console.warn('⚠️ useRevenues está deprecado. Use useRevenuesApi()');
  return useRevenuesApi();
};

export const usePayerAccounts = () => {
  console.warn('⚠️ usePayerAccounts está deprecado. Use usePayerAccountsApi()');
  return usePayerAccountsApi();
};

// Hooks ainda não migrados - retornam estrutura vazia
export const useCycles = () => {
  console.warn('⚠️ useCycles precisa ser migrado para API backend');
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
  console.warn('⚠️ useSaleRecords precisa ser migrado para API backend');
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
  console.warn('⚠️ useCostCenters precisa ser migrado para API backend');
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
  console.warn('⚠️ useBankStatements precisa ser migrado para API backend');
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
  console.warn('⚠️ useDashboard precisa ser migrado para API backend');
  return {
    data: {},
    loading: false,
    error: null,
    refresh: async () => {}
  };
};

export const useFinancialReconciliation = () => {
  console.warn('⚠️ useFinancialReconciliation precisa ser migrado para API backend');
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