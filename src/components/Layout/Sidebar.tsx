import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Map,
  Wallet,
  FileText,
  Calendar,
  Calculator,
  Users,
  User,
  Settings,
  Shield,
  ChevronRight,
  MoreVertical,
  TrendingUp,
  Package,
  Heart,
  DollarSign,
  Building2,
  UserCog,
  HelpCircle,
  LogOut,
  BarChart3,
  FileUp
} from 'lucide-react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { clsx } from 'clsx';

type NavigationItem = {
  id: string;
  name: string;
  icon: React.ElementType;
  badge?: string | number;
  description?: string;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const navigation: NavigationSection[] = [
  {
    label: 'Principal',
    items: [
      { 
        id: 'dashboard', 
        name: 'Dashboard', 
        icon: LayoutDashboard,
        description: 'Visão geral do sistema'
      },
    ]
  },
  {
    label: 'Operações',
    items: [
      { 
        id: 'purchases', 
        name: 'Compras', 
        icon: ShoppingBag,
        description: 'Gestão de compras'
      },
      { 
        id: 'sales', 
        name: 'Vendas', 
        icon: TrendingUp,
        description: 'Gestão de vendas'
      },
      { 
        id: 'lots', 
        name: 'Lotes', 
        icon: Package,
        description: 'Mapa de currais e lotes'
      },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { 
        id: 'financial', 
        name: 'Centro Financeiro', 
        icon: Wallet,
        description: 'Gestão financeira completa'
      },
      { 
        id: 'integrated-analysis', 
        name: 'Análise Integrada', 
        icon: Calculator,
        description: 'Análise financeira integrada'
      },
      { 
        id: 'calendar', 
        name: 'Calendário', 
        icon: Calendar,
        description: 'Calendário financeiro'
      },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { 
        id: 'registrations', 
        name: 'Cadastros', 
        icon: Users,
        description: 'Parceiros e fornecedores'
      },
      { 
        id: 'reports', 
        name: 'Relatórios', 
        icon: BarChart3,
        description: 'Análises e relatórios completos'
      },
      { 
        id: 'data-import', 
        name: 'Importar Dados', 
        icon: FileUp,
        description: 'Importação de dados em lote'
      },
    ]
  }
];

const bottomNavigation: NavigationItem[] = [
  { 
    id: 'users', 
    name: 'Usuários', 
    icon: Shield,
    description: 'Gestão de usuários'
  },
  { 
    id: 'settings', 
    name: 'Configurações', 
    icon: Settings,
    description: 'Configurações do sistema'
  },
];

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  sidebarCollapsed,
  setSidebarCollapsed
}) => {
  const { isAdmin, isMaster, user, signOut } = useSupabase();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleNavigation = (itemId: string) => {
    setCurrentPage(itemId);
  };

  const toggleSection = (label: string) => {
    setExpandedSection(expandedSection === label ? null : label);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out',
        'bg-white border-r border-gray-200',
        sidebarCollapsed ? 'w-20' : 'w-64',
        'shadow-sm'
      )}>
        
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarCollapsed ? (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 font-semibold text-sm">CEAC</span>
                <span className="text-gray-500 text-xs">Gestão Pecuária</span>
              </div>
            </div>
          )}
        </div>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((section, sectionIndex) => (
              <React.Fragment key={section.label}>
                {sectionIndex > 0 && <div className="h-px bg-gray-200 my-2" />}
                {/* Section Label */}
                {!sidebarCollapsed && (
                  <div className="px-3 py-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    // Skip admin items for non-admin users
                    if (item.id === 'users' && !isAdmin && !isMaster) return null;
                    
                    const isActive = currentPage === item.id;
                    const isHovered = hoveredItem === item.id;
                    
                    return (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => handleNavigation(item.id)}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={clsx(
                            'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200',
                            'group relative',
                            isActive ? [
                              'bg-emerald-50 text-emerald-600',
                              'shadow-sm'
                            ] : [
                              'text-gray-700 hover:bg-gray-50',
                              'hover:text-gray-900'
                            ]
                          )}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 rounded-r-full" />
                          )}
                          
                          {/* Icon */}
                          <item.icon className={clsx(
                            'flex-shrink-0 transition-colors',
                            sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
                            isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                          )} />
                          
                          {/* Label & Badge */}
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 text-left text-sm font-medium">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="ml-auto bg-emerald-100 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                        
                        {/* Tooltip for collapsed state */}
                        {sidebarCollapsed && isHovered && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200">
          <div className="p-3 space-y-1">
            {bottomNavigation.map((item) => {
              // Skip admin items for non-admin users
              if (item.id === 'users' && !isAdmin && !isMaster) return null;
              
              const isActive = currentPage === item.id;
              const isHovered = hoveredItem === item.id;
              
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleNavigation(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={clsx(
                      'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200',
                      isActive ? [
                        'bg-emerald-50 text-emerald-600'
                      ] : [
                        'text-gray-700 hover:bg-gray-50'
                      ]
                    )}
                  >
                    <item.icon className={clsx(
                      'flex-shrink-0',
                      sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
                      isActive ? 'text-emerald-600' : 'text-gray-400'
                    )} />
                    
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && isHovered && (
                    <div className="absolute left-full bottom-0 ml-2 z-50">
                      <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        {item.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={signOut}
              className="w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
              title="Sair"
            >
              <LogOut className={clsx(
                'flex-shrink-0',
                sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'
              )} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">Sair</span>
              )}
            </button>
            
            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-200"
            >
              <ChevronRight className={clsx(
                'w-5 h-5 transition-transform duration-200',
                !sidebarCollapsed && 'rotate-180'
              )} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
