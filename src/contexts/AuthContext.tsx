import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { backendAuth, User, Session } from '@/services/backendAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);

      // Verificar se há sessão salva
      const currentSession = await backendAuth.getCurrentSession();
      const currentUser = await backendAuth.getCurrentUser();

      if (currentSession && currentUser) {
        // Validar token com o backend
        const isValid = await backendAuth.validateToken();

        if (isValid) {
          setSession(currentSession);
          setUser(currentUser);
          return true;
        } else {
          // Token inválido, limpar
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
          setSession(null);
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user, session } = await backendAuth.signIn(email, password);

      setUser(user);
      setSession(session);

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await backendAuth.signOut();

      setUser(null);
      setSession(null);

      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user && !!session;

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};