import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { KanbanTask } from '@/components/ui/kanban';

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
  const { supabase, user } = useSupabase();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const presenceRef = useRef<any>(null);

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
    if (!channelRef.current || !user) return;

    const presence = {
      userId: user.id,
      userName: user.user_metadata?.name || user.email || 'Usuário',
      userAvatar: user.user_metadata?.avatar_url,
      lastSeen: new Date(),
      color: getCollaboratorColor(user.id),
      ...updates,
    };

    await channelRef.current.track(presence);
  }, [user, getCollaboratorColor]);

  // Enviar evento de colaboração
  const sendEvent = useCallback(async (event: Omit<RealtimeEvent, 'userId' | 'userName' | 'timestamp'>) => {
    if (!channelRef.current || !user) return;

    const fullEvent: RealtimeEvent = {
      ...event,
      userId: user.id,
      userName: user.user_metadata?.name || user.email || 'Usuário',
      timestamp: new Date(),
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'collaboration_event',
      payload: fullEvent,
    });

    // Adicionar aos eventos recentes localmente
    setRecentEvents(prev => [...prev.slice(-19), fullEvent]);
  }, [user]);

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
    await updatePresence({ cursor: { x, y } });
  }, [updatePresence]);

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

  // Configurar canal de tempo real
  useEffect(() => {
    if (!supabase || !user || !enabled) return;

    const channel = supabase.channel(`kanban_board_${boardId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    // Configurar presença
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const collaboratorsList: CollaboratorPresence[] = [];

        Object.entries(presenceState).forEach(([userId, presences]) => {
          if (userId !== user.id && presences.length > 0) {
            const presence = presences[0] as CollaboratorPresence;
            collaboratorsList.push(presence);
          }
        });

        setCollaborators(collaboratorsList);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          console.log('👋 Colaborador entrou:', newPresences[0]?.userName);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key !== user.id) {
          console.log('👋 Colaborador saiu:', leftPresences[0]?.userName);
        }
      })
      .on('broadcast', { event: 'collaboration_event' }, ({ payload }) => {
        const event = payload as RealtimeEvent;
        
        // Não processar eventos próprios
        if (event.userId === user.id) return;

        setRecentEvents(prev => [...prev.slice(-19), event]);

        // Log dos eventos para debug
        switch (event.type) {
          case 'task_moved':
            console.log(`📦 ${event.userName} moveu "${event.data.taskTitle}" de ${event.data.fromColumn} para ${event.data.toColumn}`);
            break;
          case 'task_created':
            console.log(`✨ ${event.userName} criou a tarefa "${event.data.task.title}"`);
            break;
          case 'task_updated':
            console.log(`✏️ ${event.userName} atualizou a tarefa "${event.data.task.title}"`);
            break;
          case 'task_deleted':
            console.log(`🗑️ ${event.userName} excluiu a tarefa "${event.data.taskTitle}"`);
            break;
          case 'task_selected':
            console.log(`👆 ${event.userName} selecionou uma tarefa`);
            break;
        }
      });

    // Subscrever ao canal
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('🔗 Conectado ao canal de colaboração');
        
        // Enviar presença inicial
        await updatePresence({});
      }
    });

    // Cleanup
    return () => {
      console.log('🔌 Desconectando do canal de colaboração');
      channel.unsubscribe();
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [supabase, user, boardId, enabled, updatePresence]);

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

    let throttleTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        updateCursor(e.clientX, e.clientY);
        throttleTimeout = null as any;
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
