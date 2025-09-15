import React, { useState, useRef } from 'react';
import { Bell, Search, User, Moon, Sun, Menu, X, CheckCircle, Info, AlertTriangle, AlertCircle, LogOut } from 'lucide-react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useSystemSettings } from '../../hooks/useSystemSettings';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed
}) => {
  const { 
    user, 
    signOut, 
    isAdmin, 
    isMaster,
    cattlePurchases,
    cattlePurchases,
    partners
  } = useSupabase();

  const { profile } = useSystemSettings();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fechar o dropdown de notificações quando clicar fora
  useClickOutside(notificationRef, () => {
    setShowNotifications(false);
  });

  // Fechar o dropdown de busca quando clicar fora
  useClickOutside(searchRef, () => {
    setShowSearchResults(false);
  });

  // Fechar o dropdown de perfil quando clicar fora
  useClickOutside(profileRef, () => {
    setShowProfileMenu(false);
  });

  // Função para logout
  const handleLogout = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Função para busca global
  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  // Obter resultados da busca global
  const getSearchResults = () => {
    const query = globalSearchQuery.toLowerCase();
    const results: Array<{
      type: string;
      title: string;
      subtitle: string;
      page: string;
      id: string;
    }> = [];

    // Buscar em lotes
    const matchingLots = cattlePurchases.filter(lot => {
      const purchaseOrder = cattlePurchases.find(po => po.id === lot.purchaseId);
      const vendor = purchaseOrder ? partners.find(p => p.id === purchaseOrder.vendorId) : null;
      return lot.lotNumber.toLowerCase().includes(query) ||
        (vendor && vendor.name.toLowerCase().includes(query));
    });
    
    matchingLots.forEach(lot => {
      const purchaseOrder = cattlePurchases.find(po => po.id === lot.purchaseId);
      const vendor = purchaseOrder ? partners.find(p => p.id === purchaseOrder.vendorId) : null;
      results.push({
        type: 'lot',
        title: `Lote ${lot.lotNumber}`,
        subtitle: `${lot.entryQuantity} animais - ${vendor?.name || 'Vendedor não encontrado'}`,
        page: 'lots',
        id: lot.id
      });
    });

    // Buscar em ordens de compra
    const matchingOrders = cattlePurchases.filter(order =>
      order.lotCode.toLowerCase().includes(query) ||
      order.city.toLowerCase().includes(query) ||
      order.state.toLowerCase().includes(query)
    );

    matchingOrders.forEach(order => {
      results.push({
        type: 'order',
        title: `Ordem ${order.lotCode}`,
        subtitle: `${order.city} - ${order.state}`,
        page: 'purchases',
        id: order.id
      });
    });

    return results;
  };

  const searchResults = getSearchResults();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left side - Mobile menu and search */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="relative" ref={searchRef}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            {/* Global search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Busca global..."
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              
              {/* Search results dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-medium">
                              {result.type === 'lot' ? 'L' : 'O'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Notifications, profile, and theme toggle */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Marcar todas como lidas
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      className={`p-4 border-b border-gray-100 last:border-b-0 ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {notification.type === 'info' && (
                            <Info className="w-5 h-5 text-blue-500" />
                          )}
                          {notification.type === 'warning' && (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          )}
                          {notification.type === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.timestamp), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Ver todas as notificações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'email@exemplo.com'}</p>
            </div>
          </button>

          {/* Profile dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'email@exemplo.com'}</p>
                {isAdmin && (
                  <p className="text-xs text-blue-600 mt-1">Administrador</p>
                )}
                {isMaster && (
                  <p className="text-xs text-purple-600 mt-1">Master Admin</p>
                )}
              </div>
              
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Perfil
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Configurações
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Ajuda
                </button>
              </div>
              
              <div className="p-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 
