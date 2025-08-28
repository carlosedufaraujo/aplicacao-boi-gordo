import { vi } from 'vitest';

export const useSupabaseDataMock = {
  useCattleLots: vi.fn(() => ({
    lots: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  usePurchaseOrders: vi.fn(() => ({
    orders: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  usePartners: vi.fn(() => ({
    partners: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  usePens: vi.fn(() => ({
    pens: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  usePayerAccounts: vi.fn(() => ({
    accounts: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useExpenses: vi.fn(() => ({
    expenses: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useRevenues: vi.fn(() => ({
    revenues: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useSales: vi.fn(() => ({
    sales: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useCycles: vi.fn(() => ({
    cycles: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useHealthRecords: vi.fn(() => ({
    records: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useHealthProtocols: vi.fn(() => ({
    protocols: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useCostCenters: vi.fn(() => ({
    centers: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useContributions: vi.fn(() => ({
    contributions: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useLotMovements: vi.fn(() => ({
    movements: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  usePenMovements: vi.fn(() => ({
    movements: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useBankStatements: vi.fn(() => ({
    statements: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useWeightReadings: vi.fn(() => ({
    readings: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  })),
  useReports: vi.fn(() => ({
    reports: [],
    loading: false,
    error: null,
    refetch: vi.fn()
  }))
};