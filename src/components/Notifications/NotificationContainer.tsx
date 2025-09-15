import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { NotificationToast } from './NotificationToast';
import { Notification } from '../../types';

export const NotificationContainer: React.FC = () => {
  const { notifications } = useAppStore();
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há uma nova notificação
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      // Mostrar apenas notificações novas e não lidas
      if (latestNotification.id !== lastNotificationId && !latestNotification.isRead) {
        setActiveNotifications(prev => [...prev, latestNotification]);
        setLastNotificationId(latestNotification.id);
      }
    }
  }, [notifications, lastNotificationId]);

  const handleCloseNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {activeNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => handleCloseNotification(notification.id)}
          autoClose={true}
          autoCloseTime={5000}
        />
      ))}
    </div>
  );
};
