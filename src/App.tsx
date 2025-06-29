import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Pipeline } from './components/Pipeline/Pipeline';
import { SalesPipeline } from './components/SalesPipeline/SalesPipeline';
import { Lots } from './components/Lots/Lots';
import { Calendar } from './components/Calendar/Calendar';
import { Registrations } from './components/Registrations/Registrations';
import { FinancialReconciliation } from './components/Financial/FinancialReconciliation';
import { FinancialCenterManagement } from './components/Financial/FinancialCenterManagement';
import { DREViewer } from './components/DRE';
import { useAppStore } from './stores/useAppStore';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { TestDataManager } from './components/TestData/TestDataManager';
import { NotificationSettings } from './components/Notifications/NotificationSettings';
import { ProfileSettings } from './components/Profile/ProfileSettings';
import { OrganizationSettings } from './components/Profile/OrganizationSettings';
import { UserManagement } from './components/Profile/UserManagement';
import { GeneralSettings } from './components/Profile/GeneralSettings';
import { ChangePassword } from './components/Profile/ChangePassword';
import { SystemUpdates } from './components/System/SystemUpdates';
import { NotificationProvider } from './components/Notifications/NotificationProvider';
import { registerExistingUpdates } from './utils/systemUpdates';

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
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pipeline':
        return <Pipeline />;
      case 'sales-pipeline':
        return <SalesPipeline />;
      case 'lots':
        return <Lots />;
      case 'financial':
        return <FinancialCenterManagement />;
      case 'calendar':
        return <Calendar />;
      case 'registrations':
        return <Registrations />;
      case 'dre':
        return <DREViewer />;
      case 'notifications':
        return <NotificationSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <GeneralSettings />;
      case 'change-password':
        return <ChangePassword />;
      case 'system-updates':
        return <SystemUpdates />;
      default:
        return <Dashboard />;
    }
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
      <NotificationCenter />
      
      {/* Gerenciador de Dados de Teste */}
      <TestDataManager />
    </div>
  );
}

export default App;