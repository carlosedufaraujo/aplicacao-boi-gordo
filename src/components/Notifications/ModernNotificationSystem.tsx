import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  Bell,
  Check,
  X,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Archive,
  MoreHorizontal,
  Settings,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'default';
  category?: 'system' | 'financial' | 'sales' | 'purchase' | 'inventory' | 'general';
  timestamp: Date;
  read: boolean;
  archived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: React.ElementType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
}

interface NotificationPreferences {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: {
    system: boolean;
    financial: boolean;
    sales: boolean;
    purchase: boolean;
    inventory: boolean;
    general: boolean;
  };
}

// Context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Provider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nova venda confirmada',
      description: 'Venda do Lote #234 foi confirmada para JBS',
      type: 'success',
      category: 'sales',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
      archived: false,
      icon: TrendingUp,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Vacinação agendada',
      description: 'Lembrete: Vacinação do Lote #156 amanhã às 14h',
      type: 'info',
      category: 'inventory',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      archived: false,
      icon: Calendar,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Pagamento pendente',
      description: 'Fatura de ração vence em 3 dias',
      type: 'warning',
      category: 'financial',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
      archived: false,
      icon: DollarSign,
      priority: 'high'
    }
  ]);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    sound: true,
    desktop: true,
    email: true,
    categories: {
      system: true,
      financial: true,
      sales: true,
      purchase: true,
      inventory: true,
      general: true
    }
  });

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      archived: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    });

    // Play sound if enabled
    if (preferences.sound) {
      // Play notification sound
    }

    // Show desktop notification if enabled
    if (preferences.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.description,
        icon: '/icon.png'
      });
    }
  }, [preferences]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true, read: true } : n));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        clearAll,
        updatePreferences
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Icon with Badge
export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <NotificationCenter />
      </SheetContent>
    </Sheet>
  );
};

// Notification Center Component
export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read && !n.archived;
    if (filter === 'archived') return n.archived;
    return !n.archived;
  });

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'financial': return DollarSign;
      case 'sales': return TrendingUp;
      case 'purchase': return Package;
      case 'inventory': return Users;
      default: return Bell;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle>Notificações</SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={filteredNotifications.every(n => n.read)}
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <NotificationSettings />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </SheetHeader>

      <Tabs defaultValue="all" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" onClick={() => setFilter('all')}>
            Todas
            {notifications.filter(n => !n.archived).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {notifications.filter(n => !n.archived).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" onClick={() => setFilter('unread')}>
            Não lidas
            {notifications.filter(n => !n.read && !n.archived).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {notifications.filter(n => !n.read && !n.archived).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" onClick={() => setFilter('archived')}>
            Arquivadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mb-3" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const TypeIcon = notification.icon || getTypeIcon(notification.type);
                  const CategoryIcon = getCategoryIcon(notification.category);

                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        !notification.read && "bg-muted/50"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              notification.type === 'success' && "bg-green-100 text-green-600 dark:bg-green-950",
                              notification.type === 'warning' && "bg-yellow-100 text-yellow-600 dark:bg-yellow-950",
                              notification.type === 'error' && "bg-red-100 text-red-600 dark:bg-red-950",
                              notification.type === 'info' && "bg-blue-100 text-blue-600 dark:bg-blue-950",
                              notification.type === 'default' && "bg-muted"
                            )}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium flex items-center gap-2">
                                {notification.title}
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </CardTitle>
                              {notification.description && (
                                <CardDescription className="text-xs mt-1">
                                  {notification.description}
                                </CardDescription>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={cn("text-xs", getPriorityColor(notification.priority))}>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDistanceToNow(notification.timestamp, { 
                                    addSuffix: true,
                                    locale: ptBR 
                                  })}
                                </span>
                                {notification.category && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="outline" className="text-xs">
                                      <CategoryIcon className="h-3 w-3 mr-1" />
                                      {notification.category}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40" align="end">
                              <div className="space-y-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Marcar como lida
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => archiveNotification(notification.id)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Arquivar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-destructive"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </CardHeader>
                      {notification.actionUrl && (
                        <CardContent className="pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to action URL
                            }}
                          >
                            {notification.actionLabel || 'Ver detalhes'}
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {filteredNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar todas
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

// Notification Settings Component
export const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Preferências Gerais</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound" className="text-sm">Som de notificação</Label>
            <Switch
              id="sound"
              checked={preferences.sound}
              onCheckedChange={(checked) => updatePreferences({ sound: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="desktop" className="text-sm">Notificações desktop</Label>
            <Switch
              id="desktop"
              checked={preferences.desktop}
              onCheckedChange={(checked) => updatePreferences({ desktop: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-sm">Notificações por e-mail</Label>
            <Switch
              id="email"
              checked={preferences.email}
              onCheckedChange={(checked) => updatePreferences({ email: checked })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium mb-3">Categorias</h4>
        <div className="space-y-3">
          {Object.entries(preferences.categories).map(([category, enabled]) => (
            <div key={category} className="flex items-center justify-between">
              <Label htmlFor={category} className="text-sm capitalize">
                {category === 'system' ? 'Sistema' :
                 category === 'financial' ? 'Financeiro' :
                 category === 'sales' ? 'Vendas' :
                 category === 'purchase' ? 'Compras' :
                 category === 'inventory' ? 'Inventário' : 'Geral'}
              </Label>
              <Switch
                id={category}
                checked={enabled}
                onCheckedChange={(checked) => 
                  updatePreferences({ 
                    categories: { ...preferences.categories, [category]: checked }
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Hook for easy notification creation
export const useNotification = () => {
  const { addNotification } = useNotifications();

  const notify = {
    success: (title: string, description?: string) => {
      addNotification({ title, description, type: 'success' });
    },
    error: (title: string, description?: string) => {
      addNotification({ title, description, type: 'error' });
    },
    warning: (title: string, description?: string) => {
      addNotification({ title, description, type: 'warning' });
    },
    info: (title: string, description?: string) => {
      addNotification({ title, description, type: 'info' });
    }
  };

  return notify;
};