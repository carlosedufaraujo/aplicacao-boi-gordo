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
      
      return;
    }

    initializingRef.current = true;

    try {
      const session = await backendAuth.getCurrentSession();
      
      if (session && mountedRef.current) {
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

  // Atualizar dados do usuário (para quando o usuário atualiza seu perfil)
  const updateUser = useCallback((updatedUserData: any) => {
    setAuthState(prev => {
      const newUser = {
        ...prev.user,
        ...updatedUserData
      };

      return {
        ...prev,
        user: newUser,
        session: prev.session ? {
          ...prev.session,
          user: newUser
        } : null
      };
    });
  }, []);

  // Inicialização
  useEffect(() => {
    mountedRef.current = true;
    
    // Verificar sessão apenas uma vez na inicialização
    if (!authState.initialized) {
      checkSession();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [checkSession, authState.initialized]);

  return {
    ...authState,
    signIn,
    signOut,
    checkSession,
    updateUser,
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
