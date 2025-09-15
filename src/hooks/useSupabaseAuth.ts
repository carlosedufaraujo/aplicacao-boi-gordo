// Este hook foi migrado para useBackendAuth
// Mantido apenas para compatibilidade durante a migração
// USE useBackend() do BackendProvider em vez deste hook

import { useBackend } from '../providers/BackendProvider';

export const useSupabaseAuth = () => {
  
  const backend = useBackend();
  
  // Mapear para estrutura antiga para compatibilidade
  return {
    user: backend.user,
    session: backend.token ? { access_token: backend.token } : null,
    loading: backend.loading,
    error: backend.error,
    initialized: !backend.loading,
    signIn: backend.signIn,
    signOut: backend.signOut,
    signUp: backend.signUp,
    updateUser: async (updates: any) => {
      return { data: null, error: new Error('Não implementado') };
    },
    refreshSession: async () => {
      return { data: null, error: null };
    }
  };
};
