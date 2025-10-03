import { prisma } from '@/config/database';
import websocketService from './websocket.service';

export interface NotificationConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
  persistent?: boolean;
  sound?: boolean;
  vibrate?: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  categories: {
    financial: boolean;
    inventory: boolean;
    alerts: boolean;
    reports: boolean;
  };
}

class NotificationService {
  private notificationQueue: Map<string, NotificationConfig[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  /**
   * Enviar notificação para usuário
   */
  async sendToUser(userId: string, notification: NotificationConfig) {
    try {
      // Salvar no banco de dados
      const saved = await prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority as any,
          data: JSON.stringify({
            actions: notification.actions,
            persistent: notification.persistent,
            sound: notification.sound,
            vibrate: notification.vibrate
          }),
          read: false,
          createdAt: new Date()
        }
      });

      // Verificar se usuário está online
      if (websocketService.isUserOnline(userId)) {
        // Enviar via WebSocket (tempo real)
        websocketService.notifyUser(userId, 'notification', {
          id: saved.id,
          ...notification
        });
      } else {
        // Adicionar à fila para quando o usuário se conectar
        this.addToQueue(userId, notification);
      }

      // Se for crítica, também enviar por outros canais
      if (notification.priority === 'critical') {
        await this.sendCriticalNotification(userId, notification);
      }

      return saved;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  /**
   * Enviar notificação para múltiplos usuários
   */
  async sendToMultiple(userIds: string[], notification: NotificationConfig) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    return results;
  }

  /**
   * Broadcast para todos os usuários
   */
  async broadcast(notification: NotificationConfig) {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    return this.sendToMultiple(
      users.map(u => u.id),
      notification
    );
  }

  /**
   * Notificações automáticas baseadas em eventos
   */
  async notifyEvent(event: string, data: any) {
    const notifications: Record<string, () => NotificationConfig> = {
      'purchase:created': () => ({
        title: '🐂 Nova Compra Registrada',
        message: `${data.quantity} animais adquiridos por R$ ${data.totalValue.toLocaleString('pt-BR')}`,
        type: 'success',
        priority: 'medium',
        sound: true
      }),

      'sale:completed': () => ({
        title: '💰 Venda Concluída',
        message: `${data.quantity} animais vendidos por R$ ${data.totalValue.toLocaleString('pt-BR')}`,
        type: 'success',
        priority: 'medium',
        sound: true
      }),

      'mortality:registered': () => ({
        title: '⚠️ Mortalidade Registrada',
        message: `${data.quantity} animal(is) do lote ${data.lotCode}`,
        type: 'warning',
        priority: 'high',
        sound: true,
        vibrate: true
      }),

      'balance:low': () => ({
        title: '🔴 Saldo Baixo',
        message: `Conta ${data.accountName} com saldo de R$ ${data.balance.toLocaleString('pt-BR')}`,
        type: 'error',
        priority: 'high',
        persistent: true
      }),

      'report:ready': () => ({
        title: '📊 Relatório Pronto',
        message: `${data.reportName} está disponível para visualização`,
        type: 'info',
        priority: 'low',
        actions: [{
          label: 'Ver Relatório',
          action: 'navigate',
          data: { url: `/reports/${data.reportId}` }
        }]
      }),

      'backup:completed': () => ({
        title: '✅ Backup Concluído',
        message: `Backup automático realizado com sucesso`,
        type: 'success',
        priority: 'low'
      }),

      'system:maintenance': () => ({
        title: '🔧 Manutenção Programada',
        message: data.message,
        type: 'warning',
        priority: 'critical',
        persistent: true,
        sound: true
      })
    };

    const notificationConfig = notifications[event];
    if (!notificationConfig) return;

    // Determinar destinatários baseado no tipo de evento
    let recipients: string[] = [];

    if (event.includes(':critical') || event === 'system:maintenance') {
      // Notificar todos os admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true }
      });
      recipients = admins.map(a => a.id);
    } else if (data.userId) {
      // Notificar usuário específico
      recipients = [data.userId];
    } else {
      // Notificar todos os usuários ativos
      await this.broadcast(notificationConfig());
      return;
    }

    await this.sendToMultiple(recipients, notificationConfig());
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Obter notificações do usuário
   */
  async getUserNotifications(userId: string, filters?: {
    read?: boolean;
    type?: string;
    priority?: string;
    limit?: number;
  }) {
    const where: any = { userId };

    if (filters?.read !== undefined) where.read = filters.read;
    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50
    });
  }

  /**
   * Limpar notificações antigas
   */
  async cleanOldNotifications(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true
      }
    });
  }

  /**
   * Configurar preferências de notificação
   */
  async updateUserPreferences(userId: string, preferences: NotificationPreferences) {
    this.userPreferences.set(userId, preferences);

    // Salvar no banco (você pode criar uma tabela para isso)
    // await prisma.userPreferences.upsert({
    //   where: { userId },
    //   update: preferences,
    //   create: { userId, ...preferences }
    // });
  }

  /**
   * Adicionar à fila de notificações offline
   */
  private addToQueue(userId: string, notification: NotificationConfig) {
    const queue = this.notificationQueue.get(userId) || [];
    queue.push(notification);
    this.notificationQueue.set(userId, queue);
  }

  /**
   * Processar fila quando usuário se conectar
   */
  async processQueueForUser(userId: string) {
    const queue = this.notificationQueue.get(userId);
    if (!queue || queue.length === 0) return;

    for (const notification of queue) {
      await this.sendToUser(userId, notification);
    }

    this.notificationQueue.delete(userId);
  }

  /**
   * Enviar notificação crítica por múltiplos canais
   */
  private async sendCriticalNotification(userId: string, notification: NotificationConfig) {
    // Aqui você pode implementar:
    // - Envio de email
    // - SMS (Twilio)
    // - Push notification (Firebase)
    // - WhatsApp Business API

    console.log(`[CRITICAL] Notificação crítica para usuário ${userId}:`, notification);

    // Exemplo de integração com email (precisa configurar SMTP)
    // await emailService.send({
    //   to: user.email,
    //   subject: notification.title,
    //   body: notification.message
    // });
  }

  /**
   * Estatísticas de notificações
   */
  async getStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, unread, byType, byPriority] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: true
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        where,
        _count: true
      })
    ]);

    return {
      total,
      unread,
      byType,
      byPriority
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;