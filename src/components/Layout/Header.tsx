import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Moon, Sun, Menu, X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';

export const Header: React.FC = () => {
  const { 
    darkMode, 
    setDarkMode, 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadNotificationsCount,
    setCurrentPage,
    cattleLots,
    purchaseOrders,
    partners
  } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = getUnreadNotificationsCount();

  // Fechar o dropdown de notificações quando clicar fora
  useClickOutside(notificationRef, () => {
    setShowNotifications(false);
  });

  // Fechar o dropdown de busca quando clicar fora
  useClickOutside(searchRef, () => {
    setShowSearchResults(false);
  });

  // Função para busca global
  const handleGlobalSearch = (query: string) => {
    setGlobalSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  // Obter resultados da busca global
  const getSearchResults = () => {
    const query = globalSearchQuery.toLowerCase();
    const results = [];

    // Buscar em lotes
    const matchingLots = cattleLots.filter(lot => 
      lot.lotNumber.toLowerCase().includes(query) ||
      lot.vendor.toLowerCase().includes(query)
    );
    
    matchingLots.forEach(lot => {
      results.push({
        type: 'lot',
        title: `Lote ${lot.lotNumber}`,
        subtitle: `${lot.entryQuantity} animais - ${lot.vendor}`,
        page: 'lots',
        id: lot.id
      });
    });

    // Buscar em ordens de compra
    const matchingOrders = purchaseOrders.filter(order => 
      order.code.toLowerCase().includes(query) ||
      order.city.toLowerCase().includes(query) ||
      order.state.toLowerCase().includes(query)
    );
    
    matchingOrders.forEach(order => {
      const vendor = partners.find(p => p.id === order.vendorId);
      results.push({
        type: 'order',
        title: `Ordem ${order.code}`,
        subtitle: `${order.quantity} animais - ${vendor?.name || 'Vendedor não encontrado'}`,
        page: 'pipeline',
        id: order.id
      });
    });

    // Buscar em parceiros
    const matchingPartners = partners.filter(partner => 
      partner.name.toLowerCase().includes(query) ||
      partner.city.toLowerCase().includes(query)
    );
    
    matchingPartners.forEach(partner => {
      results.push({
        type: 'partner',
        title: partner.name,
        subtitle: `${partner.type === 'vendor' ? 'Vendedor' : partner.type === 'broker' ? 'Corretor' : 'Frigorífico'} - ${partner.city}/${partner.state}`,
        page: 'registrations',
        id: partner.id
      });
    });

    return results.slice(0, 5); // Limitar a 5 resultados
  };

  const searchResults = getSearchResults();

  // Função para navegar para o resultado da busca
  const handleSearchResultClick = (result: any) => {
    setCurrentPage(result.page);
    setGlobalSearchQuery('');
    setShowSearchResults(false);
  };

  // Função para navegar para a página relacionada à notificação
  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    
    if (notification.actionUrl) {
      const page = notification.actionUrl.replace('/', '');
      setCurrentPage(page);
    }
    
    setShowNotifications(false);
  };

  // Função para obter o ícone baseado no tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-info-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error-500" />;
      default:
        return <Info className="w-4 h-4 text-info-500" />;
    }
  };

  // Função para obter a cor de fundo baseada no tipo de notificação
  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 hover:bg-success-100';
      case 'info':
        return 'bg-info-50 hover:bg-info-100';
      case 'warning':
        return 'bg-warning-50 hover:bg-warning-100';
      case 'error':
        return 'bg-error-50 hover:bg-error-100';
      default:
        return 'bg-neutral-50 hover:bg-neutral-100';
    }
  };

  // Filtrar notificações com base na pesquisa
  const filteredNotifications = searchQuery
    ? notifications.filter(
        notification =>
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notifications;

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-neutral-200/50 px-4 py-3 transition-all duration-200 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-neutral-600 hover:text-b3x-navy-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* B3X Logo - Mais compacto */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-b3x-navy-900 font-bold text-xs">B3X</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <h2 className="text-lg font-semibold text-b3x-navy-900 truncate">
                Gestão do Ciclo de Produção/Engorda
              </h2>
              <p className="text-xs text-neutral-600 truncate">Sistema CEAC</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Search - Com funcionalidade */}
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar lotes, ordens..."
              value={globalSearchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-48 bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
            />
            
            {/* Dropdown de Resultados da Busca */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 z-[100]">
                <div className="p-2">
                  <p className="text-xs text-neutral-500 mb-2">Resultados da busca</p>
                  <div className="space-y-1">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <p className="text-sm font-medium text-b3x-navy-900">{result.title}</p>
                        <p className="text-xs text-neutral-600">{result.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle - Funcional */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-neutral-400 hover:text-b3x-navy-700 transition-colors duration-200 rounded-lg hover:bg-neutral-100"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              className="relative p-2 text-neutral-400 hover:text-b3x-navy-700 transition-colors duration-200 rounded-lg hover:bg-neutral-100"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Dropdown de Notificações com z-index corrigido */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-[100] max-h-[80vh] flex flex-col">
                {/* Header do Dropdown */}
                <div className="p-3 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-lg">
                  <h3 className="font-semibold text-b3x-navy-900">Notificações</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-info-600 hover:text-info-800"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Barra de Pesquisa */}
                <div className="p-2 border-b border-neutral-200 sticky top-12 bg-white z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Buscar notificações..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Lista de Notificações */}
                <div className="overflow-y-auto flex-1">
                  {filteredNotifications.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {filteredNotifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 cursor-pointer transition-colors ${getNotificationBgColor(notification.type)} ${!notification.isRead ? 'border-l-2 border-l-b3x-lime-500' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-b3x-navy-900">{notification.title}</p>
                              <p className="text-xs text-neutral-600 mt-1">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-neutral-500">
                                  {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: ptBR })}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-xs text-neutral-500 hover:text-error-600 p-1 hover:bg-neutral-100 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-neutral-400" />
                      </div>
                      <p className="text-neutral-600 text-sm">
                        {searchQuery ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação disponível'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Footer do Dropdown */}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-neutral-200 sticky bottom-0 bg-white rounded-b-lg">
                    <button 
                      onClick={clearAllNotifications}
                      className="w-full py-1.5 text-xs text-neutral-600 hover:text-error-600 hover:bg-neutral-50 rounded transition-colors"
                    >
                      Limpar todas as notificações
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile - Mais compacto */}
          <div className="flex items-center space-x-2 pl-3 border-l border-neutral-200">
            <div className="w-7 h-7 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-full flex items-center justify-center shadow-soft flex-shrink-0">
              <User className="w-3 h-3 text-b3x-navy-900" />
            </div>
            <div className="text-sm hidden xl:block min-w-0">
              <p className="font-medium text-b3x-navy-900 truncate">João Silva</p>
              <p className="text-neutral-500 text-xs truncate">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};