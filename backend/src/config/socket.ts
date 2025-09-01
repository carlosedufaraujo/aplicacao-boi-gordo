import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './logger';
import jwt from 'jsonwebtoken';
import { env } from './env';

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.userId = decoded.userId;
      socket.data.userEmail = decoded.email;
      socket.data.userRole = decoded.role;
      
      logger.info(`🔌 Socket conectado: ${socket.id} - Usuário: ${decoded.email}`);
      next();
    } catch (error) {
      logger.error('Erro na autenticação do socket:', error);
      next(new Error('Autenticação falhou'));
    }
  });

  // Eventos de conexão
  io.on('connection', (socket) => {
    logger.info(`✅ Cliente conectado: ${socket.id}`);
    
    // Entrar em salas específicas baseado no role
    if (socket.data.userRole === 'ADMIN' || socket.data.userRole === 'MASTER') {
      socket.join('admins');
    }
    socket.join(`user:${socket.data.userId}`);
    
    // Eventos de currais (pen occupancy)
    socket.on('subscribe:pen-occupancy', () => {
      socket.join('pen-occupancy');
      logger.info(`📊 Cliente ${socket.id} inscrito em pen-occupancy`);
    });
    
    socket.on('unsubscribe:pen-occupancy', () => {
      socket.leave('pen-occupancy');
    });
    
    // Eventos de lotes
    socket.on('subscribe:lot-updates', (lotId: string) => {
      socket.join(`lot:${lotId}`);
      logger.info(`📦 Cliente ${socket.id} inscrito em lot:${lotId}`);
    });
    
    socket.on('unsubscribe:lot-updates', (lotId: string) => {
      socket.leave(`lot:${lotId}`);
    });
    
    // Eventos do Kanban
    socket.on('subscribe:kanban', (boardId: string) => {
      socket.join(`kanban:${boardId}`);
      logger.info(`📋 Cliente ${socket.id} inscrito em kanban:${boardId}`);
    });
    
    socket.on('unsubscribe:kanban', (boardId: string) => {
      socket.leave(`kanban:${boardId}`);
    });
    
    socket.on('kanban:update', (data: any) => {
      // Emitir para todos na sala, exceto o emissor
      socket.to(`kanban:${data.boardId}`).emit('kanban:updated', data);
    });
    
    // Colaboração em tempo real
    socket.on('collaboration:cursor', (data: any) => {
      socket.to(`kanban:${data.boardId}`).emit('collaboration:cursor-update', {
        userId: socket.data.userId,
        ...data,
      });
    });
    
    socket.on('collaboration:selection', (data: any) => {
      socket.to(`kanban:${data.boardId}`).emit('collaboration:selection-update', {
        userId: socket.data.userId,
        ...data,
      });
    });
    
    // Desconexão
    socket.on('disconnect', () => {
      logger.info(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

// Funções auxiliares para emitir eventos
export const emitPenOccupancyUpdate = (data: any) => {
  if (io) {
    io.to('pen-occupancy').emit('pen-occupancy:update', data);
    logger.debug('📊 Emitindo atualização de ocupação de currais');
  }
};

export const emitLotUpdate = (lotId: string, data: any) => {
  if (io) {
    io.to(`lot:${lotId}`).emit('lot:update', data);
    logger.debug(`📦 Emitindo atualização do lote ${lotId}`);
  }
};

export const emitKanbanUpdate = (boardId: string, data: any) => {
  if (io) {
    io.to(`kanban:${boardId}`).emit('kanban:updated', data);
    logger.debug(`📋 Emitindo atualização do kanban ${boardId}`);
  }
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
    logger.debug(`🔔 Emitindo notificação para usuário ${userId}`);
  }
};

export const getSocketServer = () => io;