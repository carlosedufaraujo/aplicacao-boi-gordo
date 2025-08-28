import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { KanbanTask, KanbanColumn } from '@/components/ui/kanban';
import { KanbanSwimlane } from '@/components/ui/advanced-kanban';

interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  columns: KanbanColumn[];
  swimlanes?: KanbanSwimlane[];
  settings: {
    showSwimlanes: boolean;
    autoSave: boolean;
    collaborationEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

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
  const { supabase, user } = useSupabase();
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Carregar board do Supabase
  const loadBoard = useCallback(async (id: string) => {
    if (!supabase || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: boardData, error: boardError } = await supabase
        .from('kanban_boards')
        .select(`
          *,
          kanban_columns (
            *,
            kanban_tasks (*)
          ),
          kanban_swimlanes (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (boardError) {
        throw new Error(boardError.message);
      }

      if (boardData) {
        // Transformar dados do Supabase para o formato do componente
        const transformedBoard: KanbanBoard = {
          id: boardData.id,
          title: boardData.title,
          description: boardData.description,
          columns: boardData.kanban_columns.map((col: any) => ({
            id: col.id,
            title: col.title,
            color: col.color,
            tasks: col.kanban_tasks.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assignee: task.assignee ? JSON.parse(task.assignee) : undefined,
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              tags: task.tags ? JSON.parse(task.tags) : [],
              createdAt: new Date(task.created_at),
              updatedAt: new Date(task.updated_at),
            })),
            maxTasks: col.max_tasks,
          })),
          swimlanes: boardData.kanban_swimlanes?.map((swimlane: any) => ({
            id: swimlane.id,
            title: swimlane.title,
            description: swimlane.description,
            color: swimlane.color,
            collapsed: swimlane.collapsed,
            priority: swimlane.priority,
          })) || [],
          settings: JSON.parse(boardData.settings || '{}'),
          createdAt: new Date(boardData.created_at),
          updatedAt: new Date(boardData.updated_at),
          userId: boardData.user_id,
        };

        setBoard(transformedBoard);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Erro ao carregar board:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  // Salvar board no Supabase
  const saveBoard = useCallback(async (boardToSave: KanbanBoard) => {
    if (!supabase || !user) return;

    try {
      setSaving(true);
      setError(null);

      // Atualizar board principal
      const { error: boardError } = await supabase
        .from('kanban_boards')
        .upsert({
          id: boardToSave.id,
          title: boardToSave.title,
          description: boardToSave.description,
          settings: JSON.stringify(boardToSave.settings),
          user_id: user.id,
          updated_at: new Date().toISOString(),
        });

      if (boardError) throw boardError;

      // Salvar colunas
      for (const column of boardToSave.columns) {
        const { error: columnError } = await supabase
          .from('kanban_columns')
          .upsert({
            id: column.id,
            board_id: boardToSave.id,
            title: column.title,
            color: column.color,
            max_tasks: column.maxTasks,
            position: boardToSave.columns.indexOf(column),
          });

        if (columnError) throw columnError;

        // Salvar tarefas da coluna
        for (const task of column.tasks) {
          const { error: taskError } = await supabase
            .from('kanban_tasks')
            .upsert({
              id: task.id,
              column_id: column.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assignee: task.assignee ? JSON.stringify(task.assignee) : null,
              due_date: task.dueDate?.toISOString(),
              tags: JSON.stringify(task.tags || []),
              position: column.tasks.indexOf(task),
              updated_at: new Date().toISOString(),
            });

          if (taskError) throw taskError;
        }
      }

      // Salvar swimlanes
      if (boardToSave.swimlanes) {
        for (const swimlane of boardToSave.swimlanes) {
          const { error: swimlaneError } = await supabase
            .from('kanban_swimlanes')
            .upsert({
              id: swimlane.id,
              board_id: boardToSave.id,
              title: swimlane.title,
              description: swimlane.description,
              color: swimlane.color,
              collapsed: swimlane.collapsed,
              priority: swimlane.priority,
            });

          if (swimlaneError) throw swimlaneError;
        }
      }

      setLastSaved(new Date());
      console.log('✅ Board salvo com sucesso');
    } catch (err) {
      console.error('❌ Erro ao salvar board:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }, [supabase, user]);

  // Criar novo board
  const createBoard = useCallback(async (title: string, description?: string) => {
    if (!supabase || !user) return null;

    const newBoard: KanbanBoard = {
      id: crypto.randomUUID(),
      title,
      description,
      columns: [
        {
          id: crypto.randomUUID(),
          title: 'A Fazer',
          tasks: [],
        },
        {
          id: crypto.randomUUID(),
          title: 'Em Andamento',
          tasks: [],
        },
        {
          id: crypto.randomUUID(),
          title: 'Concluído',
          tasks: [],
        },
      ],
      swimlanes: [],
      settings: {
        showSwimlanes: false,
        autoSave: true,
        collaborationEnabled: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
    };

    await saveBoard(newBoard);
    setBoard(newBoard);
    return newBoard;
  }, [supabase, user, saveBoard]);

  // Mover tarefa entre colunas
  const moveTask = useCallback(async (
    taskId: string, 
    fromColumnId: string, 
    toColumnId: string,
    swimlaneId?: string
  ) => {
    if (!board) return;

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

        if (autoSave) {
          await saveBoard(newBoard);
        }
      }
    }
  }, [board, autoSave, saveBoard]);

  // Criar nova tarefa
  const createTask = useCallback(async (
    columnId: string, 
    taskData: Partial<KanbanTask>,
    swimlaneId?: string
  ) => {
    if (!board) return;

    const newTask: KanbanTask = {
      id: crypto.randomUUID(),
      title: taskData.title || 'Nova Tarefa',
      description: taskData.description,
      status: columnId,
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee,
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newBoard = { ...board };
    const column = newBoard.columns.find(col => col.id === columnId);
    
    if (column) {
      column.tasks.push(newTask);
      setBoard(newBoard);

      if (autoSave) {
        await saveBoard(newBoard);
      }
    }

    return newTask;
  }, [board, autoSave, saveBoard]);

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

  // Carregar board inicial
  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
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
