import React, { useState, useRef } from 'react';
import { Bell, Search, User, Moon, Sun, Menu, X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Notification } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useSystemSettings } from '../../hooks/useSystemSettings';

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

  const { profile } = useSystemSettings();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = getUnreadNotificationsCount();

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
    const matchingLots = cattleLots.filter(lot => {
      const purchaseOrder = purchaseOrders.find(po => po.id === lot.purchaseOrderId);
      const vendor = purchaseOrder ? partners.find(p => p.id === purchaseOrder.vendorId) : null;
      return lot.lotNumber.toLowerCase().includes(query) ||
        (vendor && vendor.name.toLowerCase().includes(query));
    });
    
    matchingLots.forEach(lot => {
      const purchaseOrder = purchaseOrders.find(po => po.id === lot.purchaseOrderId);
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
    <div className="bg-white dark:bg-neutral-800 shadow-soft-lg">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo CEAC */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                <span className="text-b3x-navy-900 font-black text-xs">CEAC</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                  Gestão do Ciclo de Produção/Engorda
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">Sistema CEAC</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar lotes, ordens..."
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-64 bg-white dark:bg-neutral-700 transition-all duration-200 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
              />
              
              {/* Dropdown de Resultados da Busca */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-[100]">
                  <div className="p-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Resultados da busca</p>
                    <div className="space-y-1">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        >
                          <p className="text-sm font-medium text-b3x-navy-900 dark:text-white">{result.title}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">{result.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Dropdown de Notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-[100] max-h-[80vh] flex flex-col">
                  {/* Header do Dropdown */}
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-800 z-10 rounded-t-lg">
                    <h3 className="font-semibold text-b3x-navy-900 dark:text-white">Notificações</h3>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-info-600 hover:text-info-800 dark:text-info-400 dark:hover:text-info-300"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Barra de Pesquisa */}
                  <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 sticky top-12 bg-white dark:bg-neutral-800 z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Buscar notificações..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Lista de Notificações */}
                  <div className="overflow-y-auto flex-1">
                    {filteredNotifications.length > 0 ? (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
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
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Bell className="w-6 h-6 text-neutral-400" />
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          {searchQuery ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação disponível'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer do Dropdown */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 bg-white dark:bg-neutral-800 rounded-b-lg">
                      <button 
                        onClick={clearAllNotifications}
                        className="w-full py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded transition-colors"
                      >
                        Limpar todas as notificações
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile com menu dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 pl-3 border-l border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors p-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-full flex items-center justify-center shadow-soft flex-shrink-0">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-b3x-navy-900" />
                  )}
                </div>
                <div className="text-sm hidden xl:block min-w-0 text-left">
                  <p className="font-medium text-neutral-900 dark:text-white truncate">{profile.name}</p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs truncate">{profile.role}</p>
                </div>
              </button>

              {/* Dropdown do Perfil */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-[1000]">
                  <div className="p-2">
                    {/* Informações do Usuário */}
                    <div className="p-3 border-b border-neutral-100 dark:border-neutral-700">
                      <p className="font-semibold text-b3x-navy-900 dark:text-white">{profile.name}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{profile.email}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{profile.role}</p>
                    </div>

                    {/* Opções do Menu */}
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setCurrentPage('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Meu Perfil</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setCurrentPage('organization');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Dados da Organização</span>
                      </button>

                      <button 
                        onClick={() => {
                          setCurrentPage('users');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Gerenciar Usuários</span>
                      </button>

                      <button 
                        onClick={() => {
                          setCurrentPage('settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Configurações</span>
                      </button>

                      <button 
                        onClick={() => {
                          setCurrentPage('notifications');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <Bell className="w-4 h-4" />
                        <span>Central de Notificações</span>
                      </button>

                      <button 
                        onClick={() => {
                          setCurrentPage('change-password');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Alterar Senha</span>
                      </button>
                    </div>

                    {/* Botão de Logout */}
                    <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-700">
                      <button className="w-full text-left px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 