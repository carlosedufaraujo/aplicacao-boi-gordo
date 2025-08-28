import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Notification } from '../../types';

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useAppStore();
  const initRef = useRef(false);
  
  // Inicializar o sistema de notificações apenas uma vez
  useEffect(() => {
    if (!initRef.current) {
      // Adicionar uma notificação de boas-vindas
      addNotification({
        title: 'Bem-vindo ao BoviControl',
        message: 'Sistema de gestão pecuária completo.',
        type: 'info',
        actionUrl: '/dashboard'
      });
      
      initRef.current = true;
    }
  }, [addNotification]);
  
  // Função para mostrar uma notificação
  const showNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    addNotification(notification);
  };
  
  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};