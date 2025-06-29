import React, { useEffect } from 'react';
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
import { DREStatementComponent } from './components/DRE';
import { useAppStore } from './stores/useAppStore';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { CreateTestOrders } from './components/Pipeline/CreateTestOrders';

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
      case 'calendar':
        return <Calendar />;
      case 'financial-reconciliation':
        return <FinancialReconciliation />;
      case 'financial-center':
        return <FinancialCenterManagement />;
      case 'dre':
        return <DREStatementComponent />;
      case 'registrations':
        return <Registrations />;
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
          {renderCurrentPage()}
        </main>
      </div>
      
      {/* Sistema de Notificações */}
      <NotificationCenter />
      
      {/* Componente para criar ordens de teste */}
      <CreateTestOrders />
    </div>
  );
}

export default App;