import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true
}) => {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        if (requireAuth) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Verificar roles se necessário
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.includes(parsedUser.role);
          setIsAuthorized(hasRequiredRole);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [requiredRoles, requireAuth, location]);

  // Carregando...
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Não autorizado - redirecionar para login
  if (!isAuthorized && requireAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Não tem permissão para acessar
  if (isAuthorized && requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Permissão necessária:</strong> {requiredRoles.join(', ')}
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Sua permissão:</strong> {user?.role || 'Não identificado'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook para verificar permissões
export const usePermissions = () => {
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    return {
      user: null,
      role: null,
      canView: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
      isAdmin: false,
      isManager: false,
      isUser: false,
      isViewer: false
    };
  }

  try {
    const user = JSON.parse(userData);
    const role = user.role;

    return {
      user,
      role,
      canView: true, // Todos podem visualizar
      canEdit: ['ADMIN', 'MANAGER', 'USER'].includes(role),
      canDelete: ['ADMIN', 'MANAGER'].includes(role),
      canManage: ['ADMIN', 'MANAGER'].includes(role),
      isAdmin: role === 'ADMIN',
      isManager: role === 'MANAGER',
      isUser: role === 'USER',
      isViewer: role === 'VIEWER'
    };
  } catch {
    return {
      user: null,
      role: null,
      canView: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
      isAdmin: false,
      isManager: false,
      isUser: false,
      isViewer: false
    };
  }
};

export default ProtectedRoute;