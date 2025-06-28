import React, { useState } from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Search, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationListProps {
  onClose?: () => void;
  maxHeight?: string;
  showSearch?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onClose,
  maxHeight = '400px',
  showSearch = true,
  showActions = true,
  compact = false
}) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications,
    setCurrentPage
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  
  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    // Filtro de texto
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro de status
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);
    
    return matchesSearch && matchesFilter;
  });
  
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
  
  // Navegar para a página relacionada à notificação
  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id);
    
    if (notification.actionUrl) {
      const page = notification.actionUrl.replace('/', '');
      setCurrentPage(page);
    }
    
    if (onClose) onClose();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-semibold text-b3x-navy-900">Notificações</h3>
        <div className="flex items-center space-x-2">
          {showActions && (
            <>
              <button 
                onClick={markAllNotificationsAsRead}
                className="text-xs text-info-600 hover:text-info-800 flex items-center"
                title="Marcar todas como lidas"
              >
                <Check className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Marcar todas como lidas</span>
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Filtros e Pesquisa */}
      {showSearch && (
        <div className="p-2 border-b border-neutral-200 sticky top-12 bg-white z-10">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1 text-xs rounded ${
                  filter === 'all' 
                    ? 'bg-white text-b3x-navy-900 shadow-sm' 
                    : 'text-neutral-600'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2 py-1 text-xs rounded ${
                  filter === 'unread' 
                    ? 'bg-white text-b3x-navy-900 shadow-sm' 
                    : 'text-neutral-600'
                }`}
              >
                Não lidas
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-2 py-1 text-xs rounded ${
                  filter === 'read' 
                    ? 'bg-white text-b3x-navy-900 shadow-sm' 
                    : 'text-neutral-600'
                }`}
              >
                Lidas
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de Notificações */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
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
                    <p className={`font-medium text-sm text-b3x-navy-900 ${compact ? 'line-clamp-1' : ''}`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs text-neutral-600 mt-1 ${compact ? 'line-clamp-2' : ''}`}>
                      {notification.message}
                    </p>
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
      
      {/* Footer */}
      {showActions && notifications.length > 0 && (
        <div className="p-2 border-t border-neutral-200 sticky bottom-0 bg-white">
          <button 
            onClick={clearAllNotifications}
            className="w-full py-1.5 text-xs text-neutral-600 hover:text-error-600 hover:bg-neutral-50 rounded transition-colors"
          >
            Limpar todas as notificações
          </button>
        </div>
      )}
    </div>
  );
};