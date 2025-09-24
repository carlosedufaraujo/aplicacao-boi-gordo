import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Force rebuild to update API calls - v2.1
import { AppLayout } from '@/components/Layout/AppLayout';
import { NotificationProvider } from '@/components/Notifications/NotificationProvider';
import { BackendProvider, useBackend } from '@/providers/BackendProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { FinancialDataProvider } from '@/providers/FinancialDataProvider';
import { PenNavigationProvider } from '@/contexts/PenNavigationContext';
import { registerExistingUpdates } from '@/utils/systemUpdates';
import { useStoreInitializer } from '@/hooks/useStoreInitializer';
import { Toaster } from 'sonner';

// ============================================================================
// COMPONENTES MODERNOS (shadcn/ui) - TODOS MIGRADOS
// ============================================================================
const ShadcnDashboard = lazy(() => import('@/components/Dashboard/ShadcnDashboard'));
const CompleteLots = lazy(() => import('@/components/Lots/CompleteLots'));
const CompleteRegistrations = lazy(() => import('@/components/Registrations/CompleteRegistrations'));
const CashFlowDashboard = lazy(() => import('@/components/CashFlow/CashFlowDashboard'));
const IntegratedDashboard = lazy(() => import('@/components/FinancialAnalysis/IntegratedDashboard'));
const SalesManagement = lazy(() => import('@/components/Sales/SalesManagement'));
const PurchaseManagement = lazy(() => import('@/components/Purchases/SimplifiedPurchaseManagement'));
const CompleteCalendar = lazy(() => import('@/components/Calendar/CompleteCalendar'));
const Settings = lazy(() => import('@/components/System/GeneralSettings'));
const CategoryManagement = lazy(() => import('@/components/Categories/CategoryManagement'));

// Componentes de configurações
const Reports = lazy(() => import('@/pages/Reports'));
const FinancialSettings = lazy(() => import('@/pages/FinancialSettings'));

// Página de Login
const Login02 = lazy(() => import('@/pages/Login02'));

// ============================================================================
// COMPONENTE DE LOADING
// ============================================================================
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Carregando página...</p>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO
// ============================================================================
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const { isAuthenticated, loading } = useBackend();
  
  // Inicializar o store de forma segura
  useStoreInitializer();

  useEffect(() => {
    registerExistingUpdates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <p className="text-lg text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <ShadcnDashboard />;
      case 'lots':
        return <CompleteLots />;
      case 'integrated-analysis':
        return <IntegratedDashboard />;
      case 'financial':
        return <CashFlowDashboard />;
      case 'sales':
        return <SalesManagement />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'calendar':
        return <CompleteCalendar />;
      case 'reports':
        return <Reports />;
      case 'registrations':
        return <CompleteRegistrations />;
      case 'settings':
        return <Settings />;
      case 'categories':
        return <CategoryManagement />;
      case 'financial-settings':
        return <FinancialSettings />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Página não encontrada</p>
          </div>
        );
    }
  };

  return (
    <AppLayout 
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      <Suspense fallback={<PageLoader />}>
        {renderCurrentPage()}
      </Suspense>
    </AppLayout>
  );
};

// ============================================================================
// COMPONENTE RAIZ DA APLICAÇÃO
// ============================================================================
function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bovicontrol-ui-theme">
      <AuthProvider>
        <BackendProvider>
          <SettingsProvider>
            <FinancialDataProvider>
              <NotificationProvider>
                <PenNavigationProvider>
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Routes>
                      <Route path="/login" element={
                        <Suspense fallback={<PageLoader />}>
                          <Login02 />
                        </Suspense>
                      } />
                      <Route path="/*" element={
                        <ProtectedRoute>
                          <AppContent />
                        </ProtectedRoute>
                      } />
                    </Routes>
                    <Toaster
                      position="top-right"
                      richColors
                      closeButton
                      duration={4000}
                      theme="light"
                    />
                  </div>
                </PenNavigationProvider>
              </NotificationProvider>
            </FinancialDataProvider>
          </SettingsProvider>
        </BackendProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
