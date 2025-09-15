import { apiClient } from './apiClient';
import { KanbanTask, KanbanColumn } from '@/components/ui/kanban';
import { KanbanSwimlane } from '@/components/ui/advanced-kanban';

export interface KanbanBoard {
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

export const kanbanApi = {
  // Boards
  getBoards: async (): Promise<KanbanBoard[]> => {
    const response = await apiClient.get('/kanban/boards');
    return response.data.data.map((board: any) => ({
      ...board,
      createdAt: new Date(board.createdAt),
      updatedAt: new Date(board.updatedAt),
    }));
  },

  getBoard: async (boardId: string): Promise<KanbanBoard> => {
    const response = await apiClient.get(`/kanban/boards/${boardId}`);
    const board = response.data.data;
    return {
      ...board,
      createdAt: new Date(board.createdAt),
      updatedAt: new Date(board.updatedAt),
      columns: board.columns.map((col: any) => ({
        ...col,
        tasks: col.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        })),
      })),
    };
  },

  createBoard: async (data: {
    title: string;
    description?: string;
    settings?: Partial<KanbanBoard['settings']>;
  }): Promise<KanbanBoard> => {
    const response = await apiClient.post('/kanban/boards', data);
    const board = response.data.data;
    return {
      ...board,
      createdAt: new Date(board.createdAt),
      updatedAt: new Date(board.updatedAt),
    };
  },

  updateBoard: async (boardId: string, data: Partial<KanbanBoard>): Promise<KanbanBoard> => {
    const response = await apiClient.put(`/kanban/boards/${boardId}`, data);
    const board = response.data.data;
    return {
      ...board,
      createdAt: new Date(board.createdAt),
      updatedAt: new Date(board.updatedAt),
    };
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await apiClient.delete(`/kanban/boards/${boardId}`);
  },

  // Columns
  createColumn: async (boardId: string, data: {
    title: string;
    color?: string;
    maxTasks?: number;
  }): Promise<KanbanColumn> => {
    const response = await apiClient.post(`/kanban/boards/${boardId}/columns`, data);
    return response.data.data;
  },

  updateColumn: async (boardId: string, columnId: string, data: Partial<KanbanColumn>): Promise<KanbanColumn> => {
    const response = await apiClient.put(`/kanban/boards/${boardId}/columns/${columnId}`, data);
    return response.data.data;
  },

  deleteColumn: async (boardId: string, columnId: string): Promise<void> => {
    await apiClient.delete(`/kanban/boards/${boardId}/columns/${columnId}`);
  },

  // Tasks
  createTask: async (boardId: string, columnId: string, data: Partial<KanbanTask>): Promise<KanbanTask> => {
    const response = await apiClient.post(`/kanban/boards/${boardId}/columns/${columnId}/tasks`, data);
    const task = response.data.data;
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    };
  },

  updateTask: async (boardId: string, taskId: string, data: Partial<KanbanTask>): Promise<KanbanTask> => {
    const response = await apiClient.put(`/kanban/boards/${boardId}/tasks/${taskId}`, data);
    const task = response.data.data;
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    };
  },

  moveTask: async (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, position?: number): Promise<void> => {
    await apiClient.post(`/kanban/boards/${boardId}/tasks/${taskId}/move`, {
      fromColumnId,
      toColumnId,
      position,
    });
  },

  deleteTask: async (boardId: string, taskId: string): Promise<void> => {
    await apiClient.delete(`/kanban/boards/${boardId}/tasks/${taskId}`);
  },

  // Swimlanes
  createSwimlane: async (boardId: string, data: Partial<KanbanSwimlane>): Promise<KanbanSwimlane> => {
    const response = await apiClient.post(`/kanban/boards/${boardId}/swimlanes`, data);
    return response.data.data;
  },

  updateSwimlane: async (boardId: string, swimlaneId: string, data: Partial<KanbanSwimlane>): Promise<KanbanSwimlane> => {
    const response = await apiClient.put(`/kanban/boards/${boardId}/swimlanes/${swimlaneId}`, data);
    return response.data.data;
  },

  deleteSwimlane: async (boardId: string, swimlaneId: string): Promise<void> => {
    await apiClient.delete(`/kanban/boards/${boardId}/swimlanes/${swimlaneId}`);
  },
};
