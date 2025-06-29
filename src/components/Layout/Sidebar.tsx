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
  Truck,
  Layers,
  FileText,
  Building2,
  RefreshCw,
  LucideIcon
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

type NavigationItem = {
  id: string;
  name: string;
  icon: LucideIcon;
  separator?: never;
} | {
  separator: true;
  id?: never;
  name?: never;
  icon?: never;
};

const navigation: NavigationItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { separator: true },
  { id: 'pipeline', name: 'Pipeline de Compras', icon: ShoppingCart },
  { id: 'sales-pipeline', name: 'Pipeline de Abate', icon: Truck },
  { id: 'lots', name: 'Lotes e Mapa', icon: MapPin },
  { separator: true },
  { id: 'financial', name: 'Centro Financeiro', icon: Layers },
  { id: 'dre', name: 'DRE Integrado', icon: FileText },
  { id: 'calendar', name: 'Calendário Financeiro', icon: Calendar },
  { id: 'financial-reconciliation', name: 'Conciliação', icon: DollarSign },
  { separator: true },
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
        {/* Logo/Header */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className={clsx(
              "transition-all duration-300",
              sidebarCollapsed ? "scale-90" : "scale-100"
            )}>
              <div className={clsx(
                "flex items-center justify-center",
                sidebarCollapsed ? "flex-col" : "flex-row space-x-3"
              )}>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-xl flex items-center justify-center shadow-soft">
                    <span className="text-b3x-navy-900 font-black text-sm">CEAC</span>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <h1 className="text-[17px] font-bold text-white leading-tight">CEAC Agropecuária</h1>
                    <p className="text-[11px] text-b3x-lime-400 leading-tight">Gestão de Ciclo Pecuário</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Linha gradiente abaixo do header */}
        <div className="mx-3 mb-4 h-1 bg-gradient-to-r from-transparent via-b3x-lime-400/70 to-transparent rounded-full"></div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item, index) => {
            if (item.separator) {
              return (
                <div key={`separator-${index}`} className="my-3">
                  <div className="mx-3 h-0.5 bg-gradient-to-r from-transparent via-b3x-lime-400/50 to-transparent rounded-full"></div>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={clsx(
                  'w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  'hover:bg-b3x-navy-800/50 hover:backdrop-blur-sm',
                  isActive
                    ? 'bg-gradient-to-r from-b3x-lime-500/20 to-b3x-lime-400/10 text-b3x-lime-400 border border-b3x-lime-500/30 shadow-soft'
                    : 'text-b3x-navy-200 hover:text-white',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={clsx(
                  'w-4 h-4 transition-colors duration-200 flex-shrink-0',
                  isActive ? 'text-b3x-lime-400' : 'text-b3x-navy-300'
                )} />
                {!sidebarCollapsed && (
                  <span className="ml-3 font-medium transition-opacity duration-200 text-sm truncate">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0">
          {/* Linha gradiente acima das atualizações */}
          <div className="mx-3 mb-3 h-1 bg-gradient-to-r from-transparent via-b3x-lime-400/70 to-transparent rounded-full"></div>
          
          {/* System Updates */}
          <div className="p-3">
            <button 
              onClick={() => setCurrentPage('system-updates')}
              className={clsx(
                'w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-b3x-navy-800/50 hover:backdrop-blur-sm',
                currentPage === 'system-updates'
                  ? 'bg-gradient-to-r from-b3x-lime-500/20 to-b3x-lime-400/10 text-b3x-lime-400 border border-b3x-lime-500/30 shadow-soft'
                  : 'text-b3x-navy-200 hover:text-white',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? 'Atualizações do Sistema' : undefined}
            >
              <RefreshCw className={clsx(
                'w-4 h-4 flex-shrink-0',
                currentPage === 'system-updates' ? 'text-b3x-lime-400' : 'text-b3x-navy-300'
              )} />
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium text-sm truncate">Atualizações do Sistema</span>
              )}
            </button>
          </div>
          
          {/* Collapse Toggle */}
          <div className="p-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-b3x-navy-200 hover:text-white hover:bg-b3x-navy-800/50 transition-all duration-200"
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};