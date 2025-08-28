import React, { useState } from 'react';
import { KanbanBoard, KanbanColumn, KanbanTask } from '@/components/ui/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Filter, 
  Search,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Dados de exemplo para o pipeline de vendas
const initialColumns: KanbanColumn[] = [
  {
    id: 'leads',
    title: 'Leads',
    color: 'blue',
    tasks: [
      {
        id: '1',
        title: 'Fazenda São João - 200 cabeças',
        description: 'Interessado em compra de gado nelore para engorda',
        status: 'leads',
        priority: 'high',
        assignee: {
          name: 'Carlos Silva',
          initials: 'CS',
        },
        dueDate: new Date(2025, 1, 15),
        tags: ['Nelore', 'Engorda', 'Grande Porte'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Pecuária Moderna Ltda',
        description: 'Consulta sobre preços de bezerros',
        status: 'leads',
        priority: 'medium',
        assignee: {
          name: 'Ana Costa',
          initials: 'AC',
        },
        dueDate: new Date(2025, 1, 20),
        tags: ['Bezerros', 'Consulta'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: 'qualification',
    title: 'Qualificação',
    color: 'yellow',
    tasks: [
      {
        id: '3',
        title: 'Agropecuária Delta',
        description: 'Validando capacidade financeira e necessidades',
        status: 'qualification',
        priority: 'high',
        assignee: {
          name: 'Roberto Lima',
          initials: 'RL',
        },
        dueDate: new Date(2025, 1, 18),
        tags: ['Validação', 'Financeiro'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: 'proposal',
    title: 'Proposta',
    color: 'orange',
    tasks: [
      {
        id: '4',
        title: 'Fazenda Boa Vista - Proposta Enviada',
        description: 'Proposta para 150 cabeças de gado de corte',
        status: 'proposal',
        priority: 'urgent',
        assignee: {
          name: 'Maria Santos',
          initials: 'MS',
        },
        dueDate: new Date(2025, 1, 12),
        tags: ['Proposta', 'Gado de Corte'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: 'negotiation',
    title: 'Negociação',
    color: 'purple',
    tasks: [
      {
        id: '5',
        title: 'Pecuária Sul - Ajustes de Preço',
        description: 'Negociando condições de pagamento e entrega',
        status: 'negotiation',
        priority: 'high',
        assignee: {
          name: 'João Oliveira',
          initials: 'JO',
        },
        dueDate: new Date(2025, 1, 14),
        tags: ['Negociação', 'Preço', 'Pagamento'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: 'closed',
    title: 'Fechado',
    color: 'green',
    tasks: [
      {
        id: '6',
        title: 'Fazenda Esperança - Venda Concluída',
        description: 'Venda de 100 cabeças finalizada com sucesso',
        status: 'closed',
        priority: 'low',
        assignee: {
          name: 'Carlos Silva',
          initials: 'CS',
        },
        dueDate: new Date(2025, 1, 10),
        tags: ['Concluído', 'Sucesso'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
];

export function KanbanPipeline() {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Estatísticas do pipeline
  const stats = {
    totalTasks: columns.reduce((acc, col) => acc + col.tasks.length, 0),
    highPriority: columns.reduce((acc, col) => 
      acc + col.tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length, 0
    ),
    dueToday: columns.reduce((acc, col) => 
      acc + col.tasks.filter(task => 
        task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
      ).length, 0
    ),
    conversionRate: columns.find(col => col.id === 'closed')?.tasks.length || 0,
  };

  const handleTaskMove = (taskId: string, fromColumn: string, toColumn: string) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      // Encontrar a tarefa na coluna de origem
      const fromCol = newColumns.find(col => col.id === fromColumn);
      const toCol = newColumns.find(col => col.id === toColumn);
      
      if (fromCol && toCol) {
        const taskIndex = fromCol.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const [task] = fromCol.tasks.splice(taskIndex, 1);
          task.status = toColumn;
          task.updatedAt = new Date();
          toCol.tasks.push(task);
        }
      }
      
      return newColumns;
    });
  };

  const handleTaskCreate = (columnId: string) => {
    // Implementar criação de nova tarefa
    console.log('Criar nova tarefa na coluna:', columnId);
  };

  const handleTaskEdit = (task: KanbanTask) => {
    // Implementar edição de tarefa
    console.log('Editar tarefa:', task);
  };

  const handleTaskDelete = (taskId: string) => {
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => task.id !== taskId)
      }));
    });
  };

  // Filtrar colunas baseado na pesquisa e filtros
  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      
      return matchesSearch && matchesPriority;
    })
  }));

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Oportunidades</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence Hoje</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.dueToday}</div>
            <p className="text-xs text-muted-foreground">
              Ação necessária
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {((stats.conversionRate / stats.totalTasks) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.conversionRate} fechadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Filtro */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pipeline de Vendas</CardTitle>
              <CardDescription>
                Gerencie suas oportunidades de venda de gado
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar oportunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => handleTaskCreate('leads')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <KanbanBoard
            columns={filteredColumns}
            onTaskMove={handleTaskMove}
            onTaskCreate={handleTaskCreate}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            className="min-h-[600px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
