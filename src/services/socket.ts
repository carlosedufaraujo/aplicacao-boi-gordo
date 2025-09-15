import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(token: string) {
    if (this.connected) return;

    this.socket = io('http://localhost:3001', {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão Socket.io:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Ocupação de Currais
  subscribePenOccupancy(callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:pen-occupancy');
    this.socket.on('pen-occupancy:update', callback);
  }

  unsubscribePenOccupancy() {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:pen-occupancy');
    this.socket.off('pen-occupancy:update');
  }

  // Atualizações de Lotes
  subscribeLotUpdates(lotId: string, callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:lot-updates', lotId);
    this.socket.on('lot:update', callback);
  }

  unsubscribeLotUpdates(lotId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:lot-updates', lotId);
    this.socket.off('lot:update');
  }

  // Kanban
  subscribeKanban(boardId: string, callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.emit('subscribe:kanban', boardId);
    this.socket.on('kanban:updated', callback);
  }

  unsubscribeKanban(boardId: string) {
    if (!this.socket) return;
    
    this.socket.emit('unsubscribe:kanban', boardId);
    this.socket.off('kanban:updated');
  }

  updateKanban(boardId: string, data: any) {
    if (!this.socket) return;
    
    this.socket.emit('kanban:update', { boardId, ...data });
  }

  // Colaboração
  sendCursorPosition(boardId: string, position: { x: number; y: number }) {
    if (!this.socket) return;
    
    this.socket.emit('collaboration:cursor', { boardId, position });
  }

  onCursorUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.on('collaboration:cursor-update', callback);
  }

  sendSelection(boardId: string, selection: any) {
    if (!this.socket) return;
    
    this.socket.emit('collaboration:selection', { boardId, selection });
  }

  onSelectionUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    
    this.socket.on('collaboration:selection-update', callback);
  }

  // Notificações
  onNotification(callback: (notification: any) => void) {
    if (!this.socket) return;
    
    this.socket.on('notification', callback);
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected;
  }
}

export const socketService = new SocketService();
