import React, { createContext, useContext } from 'react';
import { useBackendAuth } from '../hooks/useBackendAuth';

interface BackendContextType {
  // Autenticação
  user: any;
  session: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Ações de autenticação
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

interface BackendProviderProps {
  children: React.ReactNode;
}

/**
 * Provider para sistema 100% Backend
 * Substitui o SupabaseProvider
 */
export function BackendProvider({ children }: BackendProviderProps) {
  const auth = useBackendAuth();
  
  const contextValue: BackendContextType = {
    // Auth state
    user: auth.user,
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    isMaster: auth.isMaster,
    loading: auth.loading,
    error: auth.error,
    initialized: auth.initialized,
    
    // Auth actions
    signIn: auth.signIn,
    signOut: auth.signOut,
    checkSession: auth.checkSession,
  };

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
}

/**
 * Hook para usar o contexto Backend
 */
export function useBackend() {
  const context = useContext(BackendContext);
  
  if (context === undefined) {
    throw new Error('useBackend deve ser usado dentro de um BackendProvider');
  }
  
  return context;
}
