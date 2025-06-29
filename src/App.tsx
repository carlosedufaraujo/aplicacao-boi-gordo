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
import { CashFlow } from './components/CashFlow';
import { DREStatementComponent } from './components/DRE';
import { IndirectCostAllocationComponent } from './components/CostAllocation';
import { useAppStore } from './stores/useAppStore';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { CreateTestOrders } from './components/Pipeline/CreateTestOrders';

function App() {
  const { currentPage, sidebarCollapsed } = useAppStore();

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
      case 'cash-flow':
        return <CashFlow />;
      case 'dre':
        return <DREStatementComponent />;
      case 'cost-allocation':
        return <IndirectCostAllocationComponent />;
      case 'registrations':
        return <Registrations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 flex">
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