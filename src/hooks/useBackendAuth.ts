import { useState, useEffect, useCallback, useRef } from 'react';
import { backendAuth, User, Session } from '@/services/backendAuth';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Hook de autenticação 100% Backend
 * Substitui completamente o useSupabaseAuth
 */
export const useBackendAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    initialized: false
  });

  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  // Login via Backend
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 [BACKEND AUTH] Iniciando login...');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user, session } = await backendAuth.signIn(email, password);
      
      if (user && mountedRef.current) {
        setAuthState({
          user,
          session,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('🔐 [BACKEND AUTH] Erro no login:', error);
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Erro no login'
        }));
      }
      throw error;
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      console.log('🔐 [BACKEND AUTH] Fazendo logout...');
      await backendAuth.signOut();
      
      if (mountedRef.current) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('🔐 [BACKEND AUTH] Erro no logout:', error);
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          error: error.message || 'Erro no logout'
        }));
      }
    }
  }, []);

  // Verificar sessão
  const checkSession = useCallback(async () => {
    if (initializingRef.current) {
      console.log('🔐 [BACKEND AUTH] Já inicializando, pulando...');
      return;
    }

    initializingRef.current = true;

    try {
      console.log('🔐 [BACKEND AUTH] Verificando sessão...');
      
      const session = await backendAuth.getCurrentSession();
      
      if (session && mountedRef.current) {
        console.log('🔐 [BACKEND AUTH] Sessão ativa encontrada');
        
        // Validar token
        const isValid = await backendAuth.validateToken();
        
        if (isValid) {
          setAuthState({
            user: session.user,
            session,
            loading: false,
            error: null,
            initialized: true
          });
        } else {
          console.log('🔐 [BACKEND AUTH] Token inválido, removendo sessão');
          await backendAuth.signOut();
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
            initialized: true
          });
        }
      } else if (mountedRef.current) {
        console.log('🔐 [BACKEND AUTH] Nenhuma sessão ativa');
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('🔐 [BACKEND AUTH] Erro ao verificar sessão:', error);
      if (mountedRef.current) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: error.message || 'Erro ao verificar sessão',
          initialized: true
        });
      }
    } finally {
      initializingRef.current = false;
    }
  }, []);

  // Inicialização
  useEffect(() => {
    mountedRef.current = true;
    checkSession();

    return () => {
      mountedRef.current = false;
    };
  }, [checkSession]);

  return {
    ...authState,
    signIn,
    signOut,
    checkSession,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.role === 'ADMIN' || authState.user?.role === 'MASTER',
    isMaster: authState.user?.isMaster === true,
    // Compatibilidade com código existente
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    initialized: authState.initialized
  };
};
