import { useState, useEffect, useCallback } from 'react';
import { useBackend } from '@/providers/BackendProvider';
import { KanbanTask, KanbanColumn } from '@/components/ui/kanban';
import { KanbanSwimlane } from '@/components/ui/advanced-kanban';
import { kanbanApi, KanbanBoard } from '@/services/api/kanbanApi';
import { socketService } from '@/services/socket';
import { toast } from 'sonner';
interface UseKanbanPersistenceProps {
  boardId?: string;
  autoSave?: boolean;
  syncInterval?: number;
}

export function useKanbanPersistence({
  boardId,
  autoSave = true,
  syncInterval = 5000
}: UseKanbanPersistenceProps = {}) {
  const { user } = useBackend();
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Carregar board da API
  const loadBoard = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const boardData = await kanbanApi.getBoard(id);
      
      if (boardData) {
        setBoard(boardData);
        setLastSaved(new Date());
        
        // Conectar ao socket para atualizações em tempo real
        const token = localStorage.getItem('authToken');
        if (token && !socketService.isConnected()) {
          socketService.connect(token);
        }
        
        // Inscrever-se para atualizações do board
        socketService.subscribeKanban(id, handleKanbanUpdate);
      }
    } catch (err) {
      console.error('Erro ao carregar board:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Não foi possível carregar o board', {
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Handler para atualizações em tempo real
  const handleKanbanUpdate = useCallback((data: any) => {
    
    if (data.type === 'board_update' && data.board) {
      setBoard(data.board);
    } else if (data.type === 'task_moved') {
      // Atualizar board localmente com a mudança
      setBoard((prevBoard) => {
        if (!prevBoard) return null;
        
        const newBoard = { ...prevBoard };
        const fromColumn = newBoard.columns.find(col => col.id === data.fromColumnId);
        const toColumn = newBoard.columns.find(col => col.id === data.toColumnId);
        
        if (fromColumn && toColumn) {
          const taskIndex = fromColumn.tasks.findIndex(task => task.id === data.taskId);
          if (taskIndex !== -1) {
            const [task] = fromColumn.tasks.splice(taskIndex, 1);
            toColumn.tasks.push(task);
          }
        }
        
        return newBoard;
      });
    }
  }, []);

  // Salvar board na API
  const saveBoard = useCallback(async (boardToSave: KanbanBoard) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const updatedBoard = await kanbanApi.updateBoard(boardToSave.id, boardToSave);
      
      setLastSaved(new Date());
      
      // Emitir atualização via socket
      if (boardToSave.settings.collaborationEnabled) {
        socketService.updateKanban(boardToSave.id, {
          type: 'board_update',
          board: updatedBoard,
        });
      }
    } catch (err) {
      console.error('❌ Erro ao salvar board:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      toast.error('Não foi possível salvar o board', {
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [user, toast]);

  // Criar novo board
  const createBoard = useCallback(async (title: string, description?: string) => {
    if (!user) return null;

    try {
      const newBoard = await kanbanApi.createBoard({
        title,
        description,
        settings: {
          showSwimlanes: false,
          autoSave: true,
          collaborationEnabled: false,
        },
      });
      
      setBoard(newBoard);
      toast.success('Board criado com sucesso');
      
      return newBoard;
    } catch (err) {
      console.error('Erro ao criar board:', err);
      toast.error('Não foi possível criar o board', {
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Mover tarefa entre colunas
  const moveTask = useCallback(async (
    taskId: string, 
    fromColumnId: string, 
    toColumnId: string,
    swimlaneId?: string
  ) => {
    if (!board) return;

    try {
      // Atualizar localmente primeiro para resposta rápida
      const newBoard = { ...board };
      const fromColumn = newBoard.columns.find(col => col.id === fromColumnId);
      const toColumn = newBoard.columns.find(col => col.id === toColumnId);

      if (fromColumn && toColumn) {
        const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const [task] = fromColumn.tasks.splice(taskIndex, 1);
          task.status = toColumnId;
          task.updatedAt = new Date();
          toColumn.tasks.push(task);

          setBoard(newBoard);

          // Salvar na API
          await kanbanApi.moveTask(board.id, taskId, fromColumnId, toColumnId);
          
          // Emitir via socket para colaboração
          if (board.settings.collaborationEnabled) {
            socketService.updateKanban(board.id, {
              type: 'task_moved',
              taskId,
              fromColumnId,
              toColumnId,
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
      toast.error('Não foi possível mover a tarefa', {
        variant: 'destructive',
      });
    }
  }, [board, toast]);

  // Criar nova tarefa
  const createTask = useCallback(async (
    columnId: string, 
    taskData: Partial<KanbanTask>,
    swimlaneId?: string
  ) => {
    if (!board) return;

    try {
      const newTask = await kanbanApi.createTask(board.id, columnId, taskData);
      
      // Atualizar board localmente
      const newBoard = { ...board };
      const column = newBoard.columns.find(col => col.id === columnId);
      
      if (column) {
        column.tasks.push(newTask);
        setBoard(newBoard);
        
        // Emitir via socket para colaboração
        if (board.settings.collaborationEnabled) {
          socketService.updateKanban(board.id, {
            type: 'task_created',
            task: newTask,
            columnId,
          });
        }
      }
      
      return newTask;
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      toast.error('Não foi possível criar a tarefa', {
        variant: 'destructive',
      });
      return null;
    }
  }, [board, toast]);

  // Auto-save periódico
  useEffect(() => {
    if (!autoSave || !board) return;

    const interval = setInterval(() => {
      if (board) {
        saveBoard(board);
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSave, board, saveBoard, syncInterval]);

  // Carregar board inicial e cleanup
  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
      
      return () => {
        // Cleanup: desinscrever do socket ao desmontar
        socketService.unsubscribeKanban(boardId);
      };
    } else {
      setLoading(false);
    }
  }, [boardId, loadBoard]);

  return {
    board,
    loading,
    saving,
    error,
    lastSaved,
    loadBoard,
    saveBoard,
    createBoard,
    moveTask,
    createTask,
    setBoard,
  };
}
