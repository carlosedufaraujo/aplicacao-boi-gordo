import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { useAppStore } from './stores/useAppStore';
import { NotificationProvider } from './components/Notifications/NotificationProvider';
import { registerExistingUpdates } from './utils/systemUpdates';

// Lazy load dos componentes principais
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const Pipeline = lazy(() => import('./components/Pipeline/Pipeline').then(module => ({ default: module.Pipeline })));
const SalesPipeline = lazy(() => import('./components/SalesPipeline/SalesPipeline').then(module => ({ default: module.SalesPipeline })));
const Lots = lazy(() => import('./components/Lots/Lots').then(module => ({ default: module.Lots })));
const Calendar = lazy(() => import('./components/Calendar/Calendar').then(module => ({ default: module.Calendar })));
const Registrations = lazy(() => import('./components/Registrations/Registrations').then(module => ({ default: module.Registrations })));
const FinancialReconciliation = lazy(() => import('./components/Financial/FinancialReconciliation').then(module => ({ default: module.FinancialReconciliation })));
const FinancialCenterManagement = lazy(() => import('./components/Financial/FinancialCenterManagement').then(module => ({ default: module.FinancialCenterManagement })));
const DREPage = lazy(() => import('./components/DRE').then(module => ({ default: module.DREPage })));

// Lazy load dos componentes de configurações
const NotificationSettings = lazy(() => import('./components/Notifications/NotificationSettings').then(module => ({ default: module.NotificationSettings })));
const ProfileSettings = lazy(() => import('./components/Profile/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const OrganizationSettings = lazy(() => import('./components/Profile/OrganizationSettings').then(module => ({ default: module.OrganizationSettings })));
const UserManagement = lazy(() => import('./components/Profile/UserManagement').then(module => ({ default: module.UserManagement })));
const GeneralSettings = lazy(() => import('./components/Profile/GeneralSettings').then(module => ({ default: module.GeneralSettings })));
const ChangePassword = lazy(() => import('./components/Profile/ChangePassword').then(module => ({ default: module.ChangePassword })));
const SystemUpdates = lazy(() => import('./components/System/SystemUpdates').then(module => ({ default: module.SystemUpdates })));

// Lazy load dos componentes auxiliares
const NotificationCenter = lazy(() => import('./components/Notifications/NotificationCenter').then(module => ({ default: module.NotificationCenter })));
const TestDataManager = lazy(() => import('./components/TestData/TestDataManager').then(module => ({ default: module.TestDataManager })));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b3x-lime-500"></div>
      <p className="text-sm text-neutral-600">Carregando...</p>
    </div>
  </div>
);

function App() {
  const { currentPage, sidebarCollapsed, darkMode } = useAppStore();

  // Aplicar classe dark no elemento root quando darkMode estiver ativo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Inicializar atualizações do sistema
  useEffect(() => {
    registerExistingUpdates();
  }, []);

  const renderCurrentPage = () => {
    const Component = (() => {
      switch (currentPage) {
        case 'dashboard':
          return Dashboard;
        case 'pipeline':
          return Pipeline;
        case 'sales-pipeline':
          return SalesPipeline;
        case 'lots':
          return Lots;
        case 'financial':
          return FinancialCenterManagement;
        case 'financial-reconciliation':
          return FinancialReconciliation;
        case 'calendar':
          return Calendar;
        case 'registrations':
          return Registrations;
        case 'dre':
          return DREPage;
        case 'notifications':
          return NotificationSettings;
        case 'profile':
          return ProfileSettings;
        case 'organization':
          return OrganizationSettings;
        case 'users':
          return UserManagement;
        case 'settings':
          return GeneralSettings;
        case 'change-password':
          return ChangePassword;
        case 'system-updates':
          return SystemUpdates;
        default:
          return Dashboard;
      }
    })();

    return (
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${darkMode ? 'dark bg-neutral-900' : 'bg-gradient-to-br from-neutral-50 to-neutral-100'} flex`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
      
      {/* Sistema de Notificações */}
      <Suspense fallback={null}>
        <NotificationCenter />
      </Suspense>
      
      {/* Gerenciador de Dados de Teste */}
      <Suspense fallback={null}>
        <TestDataManager />
      </Suspense>
    </div>
  );
}

export default App;