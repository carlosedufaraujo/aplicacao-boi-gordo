import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from '../../types';
import { useAppStore } from '../../stores/useAppStore';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  autoCloseTime = 5000
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const { markNotificationAsRead, setCurrentPage } = useAppStore();
  
  // Auto-close timer
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Aguardar a animação de saída
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);
  
  // Marcar como lida quando o toast for fechado
  const handleClose = () => {
    setIsExiting(true);
    markNotificationAsRead(notification.id);
    setTimeout(onClose, 300); // Aguardar a animação de saída
  };
  
  // Navegar para a página relacionada
  const handleClick = () => {
    if (notification.actionUrl) {
      const page = notification.actionUrl.replace('/', '');
      setCurrentPage(page);
    }
    handleClose();
  };
  
  // Obter ícone e cor baseado no tipo
  const getIconAndColor = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-white" />,
          bgColor: 'bg-success-500',
          textColor: 'text-success-700',
          bgLight: 'bg-success-50',
          borderColor: 'border-success-200'
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bgColor: 'bg-info-500',
          textColor: 'text-info-700',
          bgLight: 'bg-info-50',
          borderColor: 'border-info-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
          bgColor: 'bg-warning-500',
          textColor: 'text-warning-700',
          bgLight: 'bg-warning-50',
          borderColor: 'border-warning-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-white" />,
          bgColor: 'bg-error-500',
          textColor: 'text-error-700',
          bgLight: 'bg-error-50',
          borderColor: 'border-error-200'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          bgColor: 'bg-info-500',
          textColor: 'text-info-700',
          bgLight: 'bg-info-50',
          borderColor: 'border-info-200'
        };
    }
  };
  
  const { icon, bgColor, textColor, bgLight, borderColor } = getIconAndColor();
  
  return (
    <div 
      className={`max-w-sm w-full ${bgLight} border ${borderColor} rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Ícone */}
        <div className={`p-3 ${bgColor}`}>
          {icon}
        </div>
        
        {/* Conteúdo */}
        <div className="p-3 flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className={`font-semibold text-sm ${textColor}`}>{notification.title}</h3>
            <button 
              onClick={handleClose}
              className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-neutral-600 mt-1">{notification.message}</p>
          
          {notification.actionUrl && (
            <button 
              onClick={handleClick}
              className={`mt-2 text-xs font-medium ${textColor} hover:underline`}
            >
              Ver detalhes
            </button>
          )}
        </div>
      </div>
      
      {/* Barra de progresso */}
      {autoClose && (
        <div className="h-1 bg-neutral-100">
          <div 
            className={`h-full ${bgColor}`}
            style={{ 
              animation: `shrink ${autoCloseTime}ms linear forwards` 
            }}
          />
        </div>
      )}
    </div>
  );
};