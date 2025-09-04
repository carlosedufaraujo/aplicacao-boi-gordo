import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { NotificationProvider } from '@/components/Notifications/NotificationProvider';
import { DataSyncProvider } from '@/components/Common/DataSyncProvider';
import { BackendProvider, useBackend } from '@/providers/BackendProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { PenNavigationProvider } from '@/contexts/PenNavigationContext';
import { registerExistingUpdates } from '@/utils/systemUpdates';

// ============================================================================
// COMPONENTES MODERNOS (shadcn/ui) - TODOS MIGRADOS
// ============================================================================
const ShadcnDashboard = lazy(() => import('@/components/Dashboard/ShadcnDashboard').then(module => ({ default: module.ShadcnDashboard })));
const CompleteLots = lazy(() => import('@/components/Lots/CompleteLots').then(module => ({ default: module.CompleteLots })));
const CompleteRegistrations = lazy(() => import('@/components/Registrations/CompleteRegistrations').then(module => ({ default: module.CompleteRegistrations })));
const CashFlowDashboard = lazy(() => import('@/components/CashFlow/CashFlowDashboard').then(module => ({ default: module.CashFlowDashboard })));
const IntegratedDashboard = lazy(() => import('@/components/FinancialAnalysis/IntegratedDashboard').then(module => ({ default: module.IntegratedDashboard })));
const SalesManagement = lazy(() => import('@/components/Sales/SalesManagement').then(module => ({ default: module.SalesManagement })));
const PurchaseManagement = lazy(() => import('@/components/Purchases/SimplifiedPurchaseManagement').then(module => ({ default: module.SimplifiedPurchaseManagement })));
const CompleteCalendar = lazy(() => import('@/components/Calendar/CompleteCalendar').then(module => ({ default: module.CompleteCalendar })));
const CleanUserManagement = lazy(() => import('@/components/System/CleanUserManagement'));

// Componentes de configurações - TODOS MODERNOS
const NotificationSettings = lazy(() => import('@/components/System/NotificationSettings').then(module => ({ default: module.NotificationSettings })));
const ProfileSettings = lazy(() => import('@/components/Profile/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const OrganizationSettings = lazy(() => import('@/components/System/OrganizationSettings').then(module => ({ default: module.OrganizationSettings })));
const GeneralSettings = lazy(() => import('@/components/System/GeneralSettings').then(module => ({ default: module.GeneralSettings })));
const ChangePassword = lazy(() => import('@/components/Profile/ChangePassword').then(module => ({ default: module.ChangePassword })));
const SystemUpdates = lazy(() => import('@/components/System/SystemUpdates').then(module => ({ default: module.SystemUpdates })));

// Página de Login
const Login02 = lazy(() => import('@/pages/Login02').then(module => ({ default: module.Login02 })));


// Componente de teste da integração API
const ApiIntegrationTest = lazy(() => import('@/components/Test/ApiIntegrationTest').then(module => ({ default: module.ApiIntegrationTest })));
const TestCycles = lazy(() => import('@/pages/TestCycles').then(module => ({ default: module.TestCycles })));
const TestPens = lazy(() => import('@/pages/TestPens').then(module => ({ default: module.TestPens })));

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
      case 'registrations':
        return <CompleteRegistrations />;
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
      case 'users':
        return <CleanUserManagement />;
      case 'settings':
        return <GeneralSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'change-password':
        return <ChangePassword />;
      case 'system-updates':
        return <SystemUpdates />;
      case 'api-test':
        return <ApiIntegrationTest />;
      case 'test-cycles':
        return <TestCycles />;
      case 'test-pens':
        return <TestPens />;
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
      <BackendProvider>
        <SettingsProvider>
          <NotificationProvider>
            <DataSyncProvider>
              <PenNavigationProvider>
                <div className="min-h-screen bg-background font-sans antialiased">
                  <Routes>
                    <Route path="/login" element={
                      <Suspense fallback={<PageLoader />}>
                        <Login02 />
                      </Suspense>
                    } />
                    <Route path="/*" element={<AppContent />} />
                  </Routes>
                </div>
              </PenNavigationProvider>
            </DataSyncProvider>
          </NotificationProvider>
        </SettingsProvider>
      </BackendProvider>
    </ThemeProvider>
  );
}

export default App;