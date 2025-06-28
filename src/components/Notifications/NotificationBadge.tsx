import React from 'react';
import { useAppStore } from '../../stores/useAppStore';

interface NotificationBadgeProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'md',
  className = ''
}) => {
  const { getUnreadNotificationsCount } = useAppStore();
  
  const badgeCount = count !== undefined ? count : getUnreadNotificationsCount();
  
  if (badgeCount === 0) return null;
  
  const sizeClasses = {
    sm: 'w-3 h-3 text-[8px]',
    md: 'w-4 h-4 text-[10px]',
    lg: 'w-5 h-5 text-xs'
  };
  
  return (
    <span 
      className={`absolute bg-error-500 text-white rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {badgeCount > 9 ? '9+' : badgeCount}
    </span>
  );
};