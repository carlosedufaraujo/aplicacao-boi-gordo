import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { prisma } from '@/config/database';

interface ConnectedUser {
  userId: string;
  email: string;
  socketId: string;
  connectedAt: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket server initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.data.user = user;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`👤 User connected: ${user.email}`);

      // Registrar usuário conectado
      this.connectedUsers.set(socket.id, {
        userId: user.id,
        email: user.email,
        socketId: socket.id,
        connectedAt: new Date()
      });

      // Notificar outros usuários
      this.broadcastUserStatus('user:connected', {
        userId: user.id,
        email: user.email,
        connectedUsers: this.getConnectedUsersList()
      });

      // Join em salas específicas
      socket.join(`user:${user.id}`);
      socket.join('global'); // Sala global para broadcasts

      // Handlers de eventos
      this.setupSocketHandlers(socket);

      // Desconexão
      socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${user.email}`);
        this.connectedUsers.delete(socket.id);

        this.broadcastUserStatus('user:disconnected', {
          userId: user.id,
          email: user.email,
          connectedUsers: this.getConnectedUsersList()
        });
      });
    });
  }

  private setupSocketHandlers(socket: any) {
    // Ping/Pong para manter conexão viva
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // Subscrever a mudanças em entidades específicas
    socket.on('subscribe', (data: { entity: string, id?: string }) => {
      const room = data.id ? `${data.entity}:${data.id}` : `${data.entity}:all`;
      socket.join(room);
      console.log(`Socket ${socket.id} subscribed to ${room}`);
    });

    // Desinscrever de mudanças
    socket.on('unsubscribe', (data: { entity: string, id?: string }) => {
      const room = data.id ? `${data.entity}:${data.id}` : `${data.entity}:all`;
      socket.leave(room);
      console.log(`Socket ${socket.id} unsubscribed from ${room}`);
    });

    // Notificação de ação do usuário
    socket.on('user:action', (data: any) => {
      // Broadcast para outros usuários
      socket.broadcast.to('global').emit('user:action', {
        userId: socket.data.user.id,
        email: socket.data.user.email,
        action: data.action,
        entity: data.entity,
        timestamp: new Date()
      });
    });
  }

  // Métodos públicos para emitir eventos

  /**
   * Notificar sobre criação de entidade
   */
  public notifyCreate(entity: string, data: any, userId?: string) {
    if (!this.io) return;

    const event = {
      type: 'create',
      entity,
      data,
      userId,
      timestamp: new Date()
    };

    // Notificar sala específica da entidade
    this.io.to(`${entity}:all`).emit('entity:created', event);

    // Notificar sala global
    this.io.to('global').emit('data:changed', event);
  }

  /**
   * Notificar sobre atualização de entidade
   */
  public notifyUpdate(entity: string, id: string, data: any, userId?: string) {
    if (!this.io) return;

    const event = {
      type: 'update',
      entity,
      id,
      data,
      userId,
      timestamp: new Date()
    };

    // Notificar sala específica do item
    this.io.to(`${entity}:${id}`).emit('entity:updated', event);

    // Notificar sala da entidade
    this.io.to(`${entity}:all`).emit('entity:updated', event);

    // Notificar sala global
    this.io.to('global').emit('data:changed', event);
  }

  /**
   * Notificar sobre deleção de entidade
   */
  public notifyDelete(entity: string, id: string, userId?: string) {
    if (!this.io) return;

    const event = {
      type: 'delete',
      entity,
      id,
      userId,
      timestamp: new Date()
    };

    // Notificar todas as salas relevantes
    this.io.to(`${entity}:${id}`).emit('entity:deleted', event);
    this.io.to(`${entity}:all`).emit('entity:deleted', event);
    this.io.to('global').emit('data:changed', event);
  }

  /**
   * Enviar notificação para usuário específico
   */
  public notifyUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast para todos os usuários
   */
  public broadcast(event: string, data: any) {
    if (!this.io) return;

    this.io.to('global').emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Notificar mudança no status de usuários conectados
   */
  private broadcastUserStatus(event: string, data: any) {
    if (!this.io) return;

    this.io.to('global').emit(event, data);
  }

  /**
   * Obter lista de usuários conectados
   */
  public getConnectedUsersList() {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Verificar se usuário está online
   */
  public isUserOnline(userId: string): boolean {
    return Array.from(this.connectedUsers.values())
      .some(u => u.userId === userId);
  }

  /**
   * Enviar alerta crítico
   */
  public sendCriticalAlert(message: string, type: 'warning' | 'error' | 'info' = 'info') {
    this.broadcast('alert', {
      message,
      type,
      critical: true
    });
  }

  /**
   * Notificar progresso de operação longa
   */
  public notifyProgress(operationId: string, progress: number, message?: string) {
    this.broadcast('operation:progress', {
      operationId,
      progress,
      message
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;