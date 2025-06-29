import React from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  MapPin, 
  Calendar, 
  Users, 
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Building2,
  Truck,
  TrendingUp,
  Layers,
  Wallet,
  FileText
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'pipeline', name: 'Pipeline de Compras', icon: ShoppingCart },
  { id: 'sales-pipeline', name: 'Pipeline de Abate', icon: Truck },
  { id: 'lots', name: 'Lotes e Mapa', icon: MapPin },
  { id: 'financial-center', name: 'Centro Financeiro', icon: Layers },
  { id: 'cash-flow', name: 'Fluxo de Caixa', icon: Wallet },
  { id: 'dre', name: 'DRE', icon: FileText },
  { id: 'calendar', name: 'Calendário Financeiro', icon: Calendar },
  { id: 'financial-reconciliation', name: 'Conciliação Financeira', icon: DollarSign },
  { id: 'registrations', name: 'Cadastros', icon: Users },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <>
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      <div className={clsx(
        'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
        'bg-gradient-to-b from-b3x-navy-900 to-b3x-navy-950 border-r border-b3x-navy-700/50',
        'backdrop-blur-sm shadow-soft-lg',
        sidebarCollapsed ? 'w-16' : 'w-64',
        'lg:translate-x-0',
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
      )}>
        {/* Logo/Header - Mais compacto */}
        <div className="p-4 border-b border-b3x-navy-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-lg flex items-center justify-center shadow-soft flex-shrink-0">
              <Home className="w-5 h-5 text-b3x-navy-900 font-bold" />
            </div>
            {!sidebarCollapsed && (
              <div className="transition-opacity duration-200 min-w-0">
                <h1 className="text-lg font-bold text-white truncate">B3X CEAC</h1>
                <p className="text-xs text-b3x-navy-300 truncate">Gestão de Engorda</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Mais compacto */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={clsx(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                  'hover:bg-b3x-navy-800/50 hover:backdrop-blur-sm',
                  isActive
                    ? 'bg-gradient-to-r from-b3x-lime-500/20 to-b3x-lime-400/10 text-b3x-lime-400 border border-b3x-lime-500/30 shadow-soft'
                    : 'text-b3x-navy-300 hover:text-white',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={clsx(
                  'w-4 h-4 transition-colors duration-200 flex-shrink-0',
                  isActive ? 'text-b3x-lime-400' : 'text-b3x-navy-400'
                )} />
                {!sidebarCollapsed && (
                  <span className="font-medium transition-opacity duration-200 text-sm truncate min-w-0">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle - Mais compacto */}
        <div className="p-3 border-t border-b3x-navy-700/50 flex-shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-b3x-navy-300 hover:text-white hover:bg-b3x-navy-800/50 transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Footer - Mais compacto */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-b3x-navy-700/50 flex-shrink-0">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-b3x-navy-300 hover:bg-b3x-navy-800/50 hover:text-white transition-all duration-200">
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-sm truncate min-w-0">Configurações</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};