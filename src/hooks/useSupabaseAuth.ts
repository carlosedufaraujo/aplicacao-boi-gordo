import { useState, useEffect, useCallback, useRef } from 'react';
import { authService, User } from '../services/supabase';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    initialized: false
  });

  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  // Login
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Iniciando login...');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user, session } = await authService.signIn(email, password);
      console.log('🔐 [AUTH] Login bem-sucedido:', user?.email);
      
      if (user && mountedRef.current) {
        const userData = await authService.getCurrentUser();
        setAuthState({
          user: userData as any,
          session,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('🔐 [AUTH] Erro no login:', error);
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
      console.log('🔐 [AUTH] Fazendo logout...');
      await authService.signOut();
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
      console.error('🔐 [AUTH] Erro no logout:', error);
      if (mountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          error: error.message || 'Erro no logout'
        }));
      }
    }
  }, []);

  // Verificar sessão atual (otimizada)
  const checkSession = useCallback(async () => {
    // Evitar múltiplas inicializações
    if (initializingRef.current) {
      console.log('🔐 [AUTH] Já inicializando, pulando...');
      return;
    }

    initializingRef.current = true;

    try {
      console.log('🔐 [AUTH] Verificando sessão...');
      
      const session = await authService.getCurrentSession();
      
      if (session?.user && mountedRef.current) {
        console.log('🔐 [AUTH] Sessão ativa encontrada');
        const userData = await authService.getCurrentUser();
        
        if (mountedRef.current) {
          setAuthState({
            user: userData as any,
            session,
            loading: false,
            error: null,
            initialized: true
          });
        }
      } else if (mountedRef.current) {
        console.log('🔐 [AUTH] Nenhuma sessão ativa');
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
          initialized: true
        });
      }
    } catch (error: any) {
      console.error('🔐 [AUTH] Erro ao verificar sessão:', error);
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

  // Inicialização e listener de mudanças
  useEffect(() => {
    mountedRef.current = true;

    // Verificar sessão inicial
    checkSession();

    // Listener de mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [AUTH] Evento:', event);
        
        // Ignorar eventos durante inicialização
        if (initializingRef.current) return;
        
        if (!mountedRef.current) return;

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              try {
                const userData = await authService.getCurrentUser();
                if (mountedRef.current) {
                  setAuthState({
                    user: userData as any,
                    session,
                    loading: false,
                    error: null,
                    initialized: true
                  });
                }
              } catch (error) {
                console.error('🔐 [AUTH] Erro ao obter dados do usuário:', error);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            if (mountedRef.current) {
              setAuthState({
                user: null,
                session: null,
                loading: false,
                error: null,
                initialized: true
              });
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔐 [AUTH] Token renovado');
            break;
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // Executar apenas uma vez

  return {
    ...authState,
    signIn,
    signOut,
    checkSession,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.role === 'ADMIN',
    isMaster: authState.user?.isMaster === true
  };
};