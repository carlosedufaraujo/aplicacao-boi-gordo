import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NotificationToast } from './NotificationToast';
import { useAppStore } from '../../stores/useAppStore';

export const NotificationCenter: React.FC = () => {
  const { notifications } = useAppStore();
  const [activeToasts, setActiveToasts] = useState<string[]>([]);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const processedNotifications = useRef<Set<string>>(new Set());
  
  // Monitorar novas notificações
  useEffect(() => {
    // Verificar se há novas notificações não lidas que não estão na fila ou ativas
    const newNotifications = notifications
      .filter(notification => !notification.isRead)
      .filter(notification => 
        !activeToasts.includes(notification.id) && 
        !toastQueue.includes(notification.id) &&
        !processedNotifications.current.has(notification.id)
      )
      .map(notification => notification.id);
    
    if (newNotifications.length > 0) {
      // Adicionar à fila e marcar como processadas
      setToastQueue(prev => [...prev, ...newNotifications]);
      newNotifications.forEach(id => processedNotifications.current.add(id));
    }
  }, [notifications, activeToasts, toastQueue]);
  
  // Processar a fila de toasts
  useEffect(() => {
    // Limitar o número de toasts ativos
    const maxActiveToasts = 3;
    
    if (toastQueue.length > 0 && activeToasts.length < maxActiveToasts) {
      // Pegar o próximo toast da fila
      const nextToastId = toastQueue[0];
      
      // Remover da fila e adicionar aos ativos
      setToastQueue(prev => prev.slice(1));
      setActiveToasts(prev => [...prev, nextToastId]);
    }
  }, [toastQueue, activeToasts]);
  
  // Remover um toast ativo
  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(toastId => toastId !== id));
  };
  
  // Renderizar os toasts ativos
  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
      {activeToasts.map(toastId => {
        const notification = notifications.find(n => n.id === toastId);
        if (!notification) return null;
        
        return (
          <NotificationToast
            key={toastId}
            notification={notification}
            onClose={() => removeToast(toastId)}
          />
        );
      })}
    </div>,
    document.body
  );
};
