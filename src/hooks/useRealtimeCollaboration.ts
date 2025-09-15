import { useState, useEffect, useCallback, useRef } from 'react';
import { useBackend } from '@/providers/BackendProvider';
import { KanbanTask } from '@/components/ui/kanban';
import { socketService } from '@/services/socket';

interface CollaboratorPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  cursor?: { x: number; y: number };
  selectedTask?: string;
  lastSeen: Date;
  color: string;
}

interface RealtimeEvent {
  type: 'task_moved' | 'task_created' | 'task_updated' | 'task_deleted' | 'cursor_moved' | 'task_selected';
  userId: string;
  userName: string;
  timestamp: Date;
  data: any;
}

interface UseRealtimeCollaborationProps {
  boardId: string;
  enabled?: boolean;
}

export function useRealtimeCollaboration({
  boardId,
  enabled = true
}: UseRealtimeCollaborationProps) {
  const { user } = useBackend();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const collaboratorMapRef = useRef<Map<string, CollaboratorPresence>>(new Map());

  // Cores para colaboradores
  const collaboratorColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Obter cor para colaborador
  const getCollaboratorColor = useCallback((userId: string) => {
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return collaboratorColors[index % collaboratorColors.length];
  }, []);

  // Enviar evento de presença
  const updatePresence = useCallback(async (updates: Partial<CollaboratorPresence>) => {
    if (!socketService.isConnected() || !user) return;

    const presence = {
      userId: user.id,
      userName: user.name || user.email || 'Usuário',
      userAvatar: user.avatar,
      lastSeen: new Date(),
      color: getCollaboratorColor(user.id),
      ...updates,
    };

    // Enviar atualização de presença via socket
    socketService.sendSelection(boardId, presence);
  }, [user, boardId, getCollaboratorColor]);

  // Enviar evento de colaboração
  const sendEvent = useCallback(async (event: Omit<RealtimeEvent, 'userId' | 'userName' | 'timestamp'>) => {
    if (!socketService.isConnected() || !user) return;

    const fullEvent: RealtimeEvent = {
      ...event,
      userId: user.id,
      userName: user.name || user.email || 'Usuário',
      timestamp: new Date(),
    };

    // Enviar evento via socket
    socketService.updateKanban(boardId, fullEvent);

    // Adicionar aos eventos recentes localmente
    setRecentEvents(prev => [...prev.slice(-19), fullEvent]);
  }, [user, boardId]);

  // Notificar movimento de tarefa
  const notifyTaskMoved = useCallback(async (
    taskId: string, 
    fromColumn: string, 
    toColumn: string,
    taskTitle: string
  ) => {
    await sendEvent({
      type: 'task_moved',
      data: { taskId, fromColumn, toColumn, taskTitle },
    });
  }, [sendEvent]);

  // Notificar criação de tarefa
  const notifyTaskCreated = useCallback(async (task: KanbanTask) => {
    await sendEvent({
      type: 'task_created',
      data: { task },
    });
  }, [sendEvent]);

  // Notificar atualização de tarefa
  const notifyTaskUpdated = useCallback(async (task: KanbanTask) => {
    await sendEvent({
      type: 'task_updated',
      data: { task },
    });
  }, [sendEvent]);

  // Notificar exclusão de tarefa
  const notifyTaskDeleted = useCallback(async (taskId: string, taskTitle: string) => {
    await sendEvent({
      type: 'task_deleted',
      data: { taskId, taskTitle },
    });
  }, [sendEvent]);

  // Atualizar posição do cursor
  const updateCursor = useCallback(async (x: number, y: number) => {
    if (!socketService.isConnected()) return;
    
    socketService.sendCursorPosition(boardId, { x, y });
  }, [boardId]);

  // Selecionar tarefa
  const selectTask = useCallback(async (taskId?: string) => {
    await updatePresence({ selectedTask: taskId });
    
    if (taskId) {
      await sendEvent({
        type: 'task_selected',
        data: { taskId },
      });
    }
  }, [updatePresence, sendEvent]);

  // Configurar conexão Socket.io
  useEffect(() => {
    if (!user || !enabled) return;

    // Conectar ao socket se necessário
    const token = localStorage.getItem('authToken');
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    // Handler para atualizações do Kanban
    const handleKanbanUpdate = (data: any) => {
      // Não processar eventos próprios
      if (data.userId === user.id) return;

      // Processar como evento de colaboração
      if (data.type && data.userName) {
        const event: RealtimeEvent = {
          type: data.type,
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date(data.timestamp || Date.now()),
          data: data.data || data,
        };

        setRecentEvents(prev => [...prev.slice(-19), event]);

        // Log dos eventos para debug
        switch (event.type) {
          case 'task_moved':
            break;
          case 'task_created':
            break;
          case 'task_updated':
            break;
          case 'task_deleted':
            break;
        }
      }
    };

    // Handler para atualizações de cursor
    const handleCursorUpdate = (data: any) => {
      if (data.userId === user.id) return;

      const presence: CollaboratorPresence = {
        userId: data.userId,
        userName: data.userName || 'Usuário',
        userAvatar: data.userAvatar,
        cursor: data.position,
        lastSeen: new Date(),
        color: getCollaboratorColor(data.userId),
      };

      // Atualizar mapa de colaboradores
      collaboratorMapRef.current.set(data.userId, presence);
      setCollaborators(Array.from(collaboratorMapRef.current.values()));
    };

    // Handler para atualizações de seleção
    const handleSelectionUpdate = (data: any) => {
      if (data.userId === user.id) return;

      const existing = collaboratorMapRef.current.get(data.userId);
      if (existing) {
        existing.selectedTask = data.selection?.selectedTask;
        collaboratorMapRef.current.set(data.userId, existing);
        setCollaborators(Array.from(collaboratorMapRef.current.values()));
      }
    };

    // Inscrever-se nos eventos
    socketService.subscribeKanban(boardId, handleKanbanUpdate);
    socketService.onCursorUpdate(handleCursorUpdate);
    socketService.onSelectionUpdate(handleSelectionUpdate);

    setIsConnected(true);

    // Enviar presença inicial
    updatePresence({});

    // Cleanup
    return () => {
      socketService.unsubscribeKanban(boardId);
      setIsConnected(false);
      setCollaborators([]);
      collaboratorMapRef.current.clear();
    };
  }, [user, boardId, enabled, updatePresence, getCollaboratorColor]);

  // Atualizar presença periodicamente
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const interval = setInterval(() => {
      updatePresence({});
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [enabled, isConnected, updatePresence]);

  // Rastrear movimento do mouse
  useEffect(() => {
    if (!enabled || !isConnected) return;

    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        updateCursor(e.clientX, e.clientY);
        throttleTimeout = null;
      }, 100); // Throttle para 100ms
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [enabled, isConnected, updateCursor]);

  return {
    collaborators,
    recentEvents,
    isConnected,
    notifyTaskMoved,
    notifyTaskCreated,
    notifyTaskUpdated,
    notifyTaskDeleted,
    selectTask,
    updateCursor,
    updatePresence,
  };
}
