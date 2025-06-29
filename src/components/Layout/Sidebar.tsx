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
  Building2
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { clsx } from 'clsx';

const navigation = [
  { 
    section: 'Visão Geral',
    items: [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    ]
  },
  {
    section: 'Operacional',
    items: [
      { id: 'pipeline', name: 'Pipeline de Compras', icon: ShoppingCart },
      { id: 'sales-pipeline', name: 'Pipeline de Abate', icon: Truck },
      { id: 'lots', name: 'Lotes e Mapa', icon: MapPin },
    ]
  },
  {
    section: 'Financeiro',
    items: [
      { id: 'financial-center', name: 'Centro Financeiro', icon: Layers },
      { id: 'dre', name: 'DRE Integrado', icon: FileText },
      { id: 'calendar', name: 'Calendário Financeiro', icon: Calendar },
      { id: 'financial-reconciliation', name: 'Conciliação', icon: DollarSign },
    ]
  },
  {
    section: 'Sistema',
    items: [
      { id: 'registrations', name: 'Cadastros', icon: Users },
    ]
  }
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
        <div className="p-4 border-b border-b3x-navy-700/50 flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className={clsx(
              "transition-all duration-300",
              sidebarCollapsed ? "scale-100" : "scale-110"
            )}>
              <div className="w-10 h-10 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-b3x-navy-900 font-bold text-lg">B3X</span>
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 transition-opacity duration-200">
                <h1 className="text-lg font-bold text-white">CEAC</h1>
                <p className="text-xs text-b3x-navy-300">Sistema de Gestão</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-b3x-navy-400 uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
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
                        <span className="ml-3 font-medium transition-opacity duration-200 text-sm truncate">{item.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-b3x-navy-700/50 flex-shrink-0">
          {/* Settings */}
          {!sidebarCollapsed && (
            <div className="p-3">
              <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-b3x-navy-300 hover:bg-b3x-navy-800/50 hover:text-white transition-all duration-200">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="ml-3 font-medium text-sm truncate">Configurações</span>
              </button>
            </div>
          )}
          
          {/* Collapse Toggle */}
          <div className="p-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-b3x-navy-300 hover:text-white hover:bg-b3x-navy-800/50 transition-all duration-200"
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