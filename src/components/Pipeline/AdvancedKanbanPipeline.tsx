import React, { useState, useEffect } from 'react';
import { AdvancedKanbanBoard } from '@/components/ui/advanced-kanban';
import { CollaboratorsList, ActivityFeed, CollaboratorCursor } from '@/components/ui/collaboration-indicators';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useKanbanPersistence } from '@/hooks/useKanbanPersistence';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { KanbanTask, KanbanColumn } from '@/components/ui/kanban';
import { KanbanSwimlane, KanbanFilters } from '@/components/ui/advanced-kanban';
import { 
  Plus, 
  Save, 
  Users, 
  Activity,
  Settings,
  Layers,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Dados iniciais mais robustos
const initialColumns: KanbanColumn[] = [
  {
    id: 'leads',
    title: 'Leads Qualificados',
    color: '#3B82F6',
    tasks: [
      {
        id: '1',
        title: 'Fazenda São João - 200 Nelore',
        description: 'Cliente interessado em compra de gado nelore para engorda. Orçamento inicial de R$ 800.000',
        status: 'leads',
        priority: 'high',
        assignee: { name: 'Carlos Silva', initials: 'CS' },
        dueDate: new Date(2025, 1, 15),
        tags: ['Nelore', 'Engorda', 'Grande Porte', 'R$ 800k'],
        createdAt: new Date(2025, 0, 10),
        updatedAt: new Date(2025, 0, 12),
      },
      {
        id: '2',
        title: 'Pecuária Moderna Ltda - Bezerros',
        description: 'Consulta sobre preços de bezerros desmamados. Interesse em 50 cabeças',
        status: 'leads',
        priority: 'medium',
        assignee: { name: 'Ana Costa', initials: 'AC' },
        dueDate: new Date(2025, 1, 20),
        tags: ['Bezerros', 'Desmame', 'Médio Porte'],
        createdAt: new Date(2025, 0, 8),
        updatedAt: new Date(2025, 0, 10),
      },
    ],
  },
  {
    id: 'qualification',
    title: 'Em Qualificação',
    color: '#F59E0B',
    tasks: [
      {
        id: '3',
        title: 'Agropecuária Delta - Validação',
        description: 'Validando capacidade financeira e necessidades específicas do cliente',
        status: 'qualification',
        priority: 'high',
        assignee: { name: 'Roberto Lima', initials: 'RL' },
        dueDate: new Date(2025, 1, 18),
        tags: ['Validação', 'Financeiro', 'Due Diligence'],
        createdAt: new Date(2025, 0, 5),
        updatedAt: new Date(2025, 0, 14),
      },
    ],
  },
  {
    id: 'proposal',
    title: 'Proposta Enviada',
    color: '#EF4444',
    tasks: [
      {
        id: '4',
        title: 'Fazenda Boa Vista - Proposta 150 Cabeças',
        description: 'Proposta formal enviada para 150 cabeças de gado de corte premium',
        status: 'proposal',
        priority: 'urgent',
        assignee: { name: 'Maria Santos', initials: 'MS' },
        dueDate: new Date(2025, 1, 12),
        tags: ['Proposta', 'Gado de Corte', 'Premium', 'R$ 600k'],
        createdAt: new Date(2025, 0, 1),
        updatedAt: new Date(2025, 0, 15),
      },
    ],
  },
  {
    id: 'negotiation',
    title: 'Em Negociação',
    color: '#8B5CF6',
    tasks: [
      {
        id: '5',
        title: 'Pecuária Sul - Ajustes Contratuais',
        description: 'Negociando condições de pagamento, entrega e garantias contratuais',
        status: 'negotiation',
        priority: 'high',
        assignee: { name: 'João Oliveira', initials: 'JO' },
        dueDate: new Date(2025, 1, 14),
        tags: ['Negociação', 'Contrato', 'Pagamento', 'Entrega'],
        createdAt: new Date(2024, 11, 28),
        updatedAt: new Date(2025, 0, 13),
      },
    ],
  },
  {
    id: 'closed',
    title: 'Fechado com Sucesso',
    color: '#10B981',
    tasks: [
      {
        id: '6',
        title: 'Fazenda Esperança - Venda Finalizada',
        description: 'Venda de 100 cabeças finalizada com sucesso. Cliente satisfeito',
        status: 'closed',
        priority: 'low',
        assignee: { name: 'Carlos Silva', initials: 'CS' },
        dueDate: new Date(2025, 1, 10),
        tags: ['Concluído', 'Sucesso', 'R$ 400k', 'Cliente Satisfeito'],
        createdAt: new Date(2024, 11, 15),
        updatedAt: new Date(2025, 0, 8),
      },
    ],
  },
];

const initialSwimlanes: KanbanSwimlane[] = [
  {
    id: 'premium',
    title: 'Clientes Premium',
    description: 'Clientes com alto valor de transação (>R$ 500k)',
    color: '#FFD700',
    collapsed: false,
    priority: 1,
  },
  {
    id: 'standard',
    title: 'Clientes Padrão',
    description: 'Clientes com transações médias (R$ 100k - R$ 500k)',
    color: '#87CEEB',
    collapsed: false,
    priority: 2,
  },
  {
    id: 'small',
    title: 'Pequenos Produtores',
    description: 'Clientes com transações menores (<R$ 100k)',
    color: '#98FB98',
    collapsed: true,
    priority: 3,
  },
];

export function AdvancedKanbanPipeline() {
  const [boardId] = useState('pipeline-vendas-gado');
  const [showSwimlanes, setShowSwimlanes] = useState(false);
  const [filters, setFilters] = useState<KanbanFilters>({});
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Hooks de persistência e colaboração
  const {
    board,
    loading,
    saving,
    error,
    lastSaved,
    saveBoard,
    createBoard,
    moveTask,
    createTask,
    setBoard,
  } = useKanbanPersistence({
    boardId,
    autoSave: true,
    syncInterval: 10000, // 10 segundos
  });

  const {
    collaborators,
    recentEvents,
    isConnected,
    notifyTaskMoved,
    notifyTaskCreated,
    notifyTaskUpdated,
    notifyTaskDeleted,
    selectTask,
  } = useRealtimeCollaboration({
    boardId,
    enabled: true,
  });

  // Inicializar board se não existir
  useEffect(() => {
    if (!loading && !board) {
      const initialBoard = {
        id: boardId,
        title: 'Pipeline de Vendas - Gado',
        description: 'Gestão completa do pipeline de vendas de gado',
        columns: initialColumns,
        swimlanes: initialSwimlanes,
        settings: {
          showSwimlanes: false,
          autoSave: true,
          collaborationEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'current-user',
      };
      setBoard(initialBoard);
    }
  }, [loading, board, boardId, setBoard]);

  // Estatísticas calculadas
  const stats = React.useMemo(() => {
    if (!board) return { total: 0, highPriority: 0, dueToday: 0, conversionRate: 0 };

    const totalTasks = board.columns.reduce((acc, col) => acc + col.tasks.length, 0);
    const highPriority = board.columns.reduce((acc, col) => 
      acc + col.tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length, 0
    );
    const dueToday = board.columns.reduce((acc, col) => 
      acc + col.tasks.filter(task => {
        if (!task.dueDate) return false;
        const today = new Date();
        return task.dueDate.toDateString() === today.toDateString();
      }).length, 0
    );
    const closedTasks = board.columns.find(col => col.id === 'closed')?.tasks.length || 0;
    const conversionRate = totalTasks > 0 ? (closedTasks / totalTasks) * 100 : 0;

    return { total: totalTasks, highPriority, dueToday, conversionRate };
  }, [board]);

  // Handlers
  const handleTaskMove = async (taskId: string, fromColumn: string, toColumn: string, swimlane?: string) => {
    if (!board) return;

    // Encontrar a tarefa para obter o título
    const fromCol = board.columns.find(col => col.id === fromColumn);
    const task = fromCol?.tasks.find(t => t.id === taskId);
    
    if (task) {
      await moveTask(taskId, fromColumn, toColumn, swimlane);
      await notifyTaskMoved(taskId, fromColumn, toColumn, task.title);
    }
  };

  const handleTaskCreate = async (columnId: string, swimlaneId?: string) => {
    const newTask = await createTask(columnId, {
      title: 'Nova Oportunidade',
      description: 'Descreva os detalhes desta oportunidade...',
      priority: 'medium',
    }, swimlaneId);

    if (newTask) {
      await notifyTaskCreated(newTask);
    }
  };

  const handleTaskEdit = async (task: KanbanTask) => {
    await selectTask(task.id);
    // Aqui você abriria um modal de edição
    console.log('Editando tarefa:', task);
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!board) return;

    // Encontrar a tarefa para obter o título
    let taskTitle = 'Tarefa';
    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        break;
      }
    }

    // Remover a tarefa
    const newBoard = {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => task.id !== taskId)
      }))
    };

    setBoard(newBoard);
    await notifyTaskDeleted(taskId, taskTitle);
  };

  const handleManualSave = async () => {
    if (board) {
      await saveBoard(board);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando pipeline...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">Erro ao carregar: {error}</p>
          <Button variant="outline" size="sm" className="mt-2">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Cursores de Colaboradores */}
      {collaborators.map((collaborator) => (
        <CollaboratorCursor
          key={collaborator.userId}
          collaborator={collaborator}
        />
      ))}

      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Oportunidades</CardTitle>
            <TrendingUp className="h-4 w-4 icon-info icon-transition" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in">{stats.total}</div>
            <p className="text-xs text-success">
              +{collaborators.length} colaboradores online
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertCircle className="h-4 w-4 icon-warning icon-transition" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning animate-scale-in">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence Hoje</CardTitle>
            <Clock className="h-4 w-4 icon-error icon-transition" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error animate-scale-in">{stats.dueToday}</div>
            <p className="text-xs text-muted-foreground">
              Ação necessária hoje
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle className="h-4 w-4 icon-success icon-transition" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success animate-scale-in">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline saudável
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles Principais */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Pipeline Avançado de Vendas
                {isConnected && (
                  <Badge variant="outline" className="status-active">
                    <Zap className="h-3 w-3 mr-1" />
                    Tempo Real
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Sistema colaborativo de gestão de oportunidades de venda
                {lastSaved && (
                  <span className="block text-xs mt-1">
                    Último salvamento: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSwimlanes(!showSwimlanes)}
                className="hover-scale"
              >
                <Layers className="h-4 w-4 mr-2" />
                {showSwimlanes ? 'Ocultar' : 'Mostrar'} Swimlanes
              </Button>

              <Sheet open={showCollaborators} onOpenChange={setShowCollaborators}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="hover-scale">
                    <Users className="h-4 w-4 mr-2" />
                    Colaboradores ({collaborators.length})
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Colaboradores Online</SheetTitle>
                    <SheetDescription>
                      Veja quem está trabalhando no pipeline em tempo real
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4">
                    <CollaboratorsList
                      collaborators={collaborators}
                      isConnected={isConnected}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={showActivity} onOpenChange={setShowActivity}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="hover-scale">
                    <Activity className="h-4 w-4 mr-2" />
                    Atividades ({recentEvents.length})
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Feed de Atividades</SheetTitle>
                    <SheetDescription>
                      Acompanhe as ações da equipe em tempo real
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4">
                    <ActivityFeed events={recentEvents} />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={saving}
                className="hover-scale"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              
              <Button 
                onClick={() => handleTaskCreate('leads')}
                size="sm"
                className="hover-scale"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {board && (
            <AdvancedKanbanBoard
              columns={board.columns}
              swimlanes={board.swimlanes}
              filters={filters}
              showSwimlanes={showSwimlanes}
              onTaskMove={handleTaskMove}
              onTaskCreate={handleTaskCreate}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onFiltersChange={setFilters}
              className="min-h-[700px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
