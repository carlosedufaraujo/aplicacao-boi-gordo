import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useUserManagement } from '../hooks/useUserManagement';
import { useCattlePurchases, useCattlePurchases, usePartners, usePens, useCycles, useExpenses, useRevenues, usePayerAccounts, useDashboard } from '../hooks/useSupabaseData';

interface SupabaseContextType {
  // Autenticação
  user: any;
  session: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
  error: string | null;
  
  // Ações de autenticação
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Gestão de usuários
  users: any[];
  refreshUsers: () => Promise<void>;
  updateUser: (id: string, updates: any) => Promise<any>;
  activateUser: (id: string) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Dados do sistema
  cattlePurchases: any[];
  cattlePurchases: any[];
  partners: any[];
  pens: any[];
  cycles: any[];
  expenses: any[];
  revenues: any[];
  payerAccounts: any[];
  dashboardData: any;

  // Loading states
  lotsLoading: boolean;
  ordersLoading: boolean;
  partnersLoading: boolean;
  pensLoading: boolean;
  cyclesLoading: boolean;
  expensesLoading: boolean;
  revenuesLoading: boolean;
  accountsLoading: boolean;
  dashboardLoading: boolean;

  // Error states
  lotsError: string | null;
  ordersError: string | null;
  partnersError: string | null;
  pensError: string | null;
  cyclesError: string | null;
  expensesError: string | null;
  revenuesError: string | null;
  accountsError: string | null;
  dashboardError: string | null;

  // Ações de dados
  refreshData: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase deve ser usado dentro de um SupabaseProvider');
  }
  return context;
}

interface SupabaseProviderProps {
  children: React.ReactNode;
}

function SupabaseProvider({ children }: SupabaseProviderProps) {
  const auth = useSupabaseAuth();
  const userManagement = useUserManagement();
  
  // Hooks de dados
  const cattlePurchases = useCattlePurchases();
  const partners = usePartners();
  const pens = usePens();
  const cycles = useCycles();
  const expenses = useExpenses();
  const revenues = useRevenues();
  const payerAccounts = usePayerAccounts();
  const dashboard = useDashboard();

  // Função para atualizar todos os dados
  const refreshData = async () => {
    try {
      await Promise.all([
        cattlePurchases.loadCattlePurchases(),
        cattlePurchases.loadCattlePurchases(),
        partners.loadPartners(),
        pens.loadPens(),
        cycles.loadCycles(),
        expenses.loadExpenses(),
        revenues.loadRevenues(),
        payerAccounts.loadPayerAccounts(),
        dashboard.loadDashboardData()
      ]);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  const contextValue: SupabaseContextType = {
    // Autenticação
    user: auth.user,
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    isMaster: auth.isMaster,
    loading: auth.loading,
    error: auth.error,
    
    // Ações de autenticação
    signIn: auth.signIn,
    signOut: auth.signOut,
    
    // Gestão de usuários
    users: userManagement.users,
    refreshUsers: userManagement.refreshUsers,
    updateUser: userManagement.updateUser,
    activateUser: userManagement.activateUser,
    deactivateUser: userManagement.deactivateUser,
    deleteUser: userManagement.deleteUser,

    // Dados do sistema
    cattlePurchases: cattlePurchases.cattlePurchases,
    cattlePurchases: cattlePurchases.cattlePurchases,
    partners: partners.partners,
    pens: pens.pens,
    cycles: cycles.cycles,
    expenses: expenses.expenses,
    revenues: revenues.revenues,
    payerAccounts: payerAccounts.payerAccounts,
    dashboardData: dashboard.dashboardData,

    // Loading states
    lotsLoading: cattlePurchases.loading,
    ordersLoading: cattlePurchases.loading,
    partnersLoading: partners.loading,
    pensLoading: pens.loading,
    cyclesLoading: cycles.loading,
    expensesLoading: expenses.loading,
    revenuesLoading: revenues.loading,
    accountsLoading: payerAccounts.loading,
    dashboardLoading: dashboard.loading,

    // Error states
    lotsError: cattlePurchases.error,
    ordersError: cattlePurchases.error,
    partnersError: partners.error,
    pensError: pens.error,
    cyclesError: cycles.error,
    expensesError: expenses.error,
    revenuesError: revenues.error,
    accountsError: payerAccounts.error,
    dashboardError: dashboard.error,

    // Ações de dados
    refreshData
  };

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
}

export { useSupabase, SupabaseProvider };
