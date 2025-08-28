"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MoreHorizontal, 
  Plus, 
  Calendar,
  User,
  Flag,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Tipos para o Kanban
export interface KanbanTask {
  id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: {
    name: string
    avatar?: string
    initials: string
  }
  dueDate?: Date
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface KanbanColumn {
  id: string
  title: string
  color?: string
  tasks: KanbanTask[]
  maxTasks?: number
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void
  onTaskCreate?: (columnId: string) => void
  onTaskEdit?: (task: KanbanTask) => void
  onTaskDelete?: (taskId: string) => void
  className?: string
}

interface KanbanColumnProps {
  column: KanbanColumn
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void
  onTaskCreate?: (columnId: string) => void
  onTaskEdit?: (task: KanbanTask) => void
  onTaskDelete?: (taskId: string) => void
}

interface KanbanCardProps {
  task: KanbanTask
  onEdit?: (task: KanbanTask) => void
  onDelete?: (taskId: string) => void
  onDragStart?: (e: React.DragEvent, task: KanbanTask) => void
}

// Componente do Card de Tarefa
const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ task, onEdit, onDelete, onDragStart, ...props }, ref) => {
    const getPriorityColor = (priority: KanbanTask['priority']) => {
      switch (priority) {
        case 'urgent': return 'bg-destructive text-destructive-foreground'
        case 'high': return 'bg-orange-500 text-white dark:bg-orange-600'
        case 'medium': return 'bg-yellow-500 text-white dark:bg-yellow-600'
        case 'low': return 'bg-blue-500 text-white dark:bg-blue-600'
        default: return 'bg-muted text-muted-foreground'
      }
    }

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }).format(date)
    }

    return (
      <Card
        ref={ref}
        className={cn(
          "cursor-grab active:cursor-grabbing transition-all duration-200",
          "hover:shadow-md border-l-4 border-l-primary/20",
          "group"
        )}
        draggable
        onDragStart={(e) => onDragStart?.(e, task)}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium leading-tight">
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(task.id)}
                  className="text-destructive"
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer com informações */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {/* Prioridade */}
              <Badge className={cn("px-1.5 py-0.5", getPriorityColor(task.priority))}>
                <Flag className="h-2.5 w-2.5 mr-1" />
                {task.priority}
              </Badge>

              {/* Data de vencimento */}
              {task.dueDate && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>

            {/* Responsável */}
            {task.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
KanbanCard.displayName = "KanbanCard"

// Componente da Coluna
const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ column, onTaskMove, onTaskCreate, onTaskEdit, onTaskDelete }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false)

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      
      const taskData = e.dataTransfer.getData('application/json')
      if (taskData) {
        const { taskId, fromColumn } = JSON.parse(taskData)
        if (fromColumn !== column.id) {
          onTaskMove?.(taskId, fromColumn, column.id)
        }
      }
    }

    const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        taskId: task.id,
        fromColumn: column.id
      }))
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col min-h-[500px] w-80 bg-muted/30 rounded-lg p-3",
          "border-2 border-dashed border-transparent transition-all duration-200",
          isDragOver && "border-primary bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header da Coluna */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {column.tasks.length}
              {column.maxTasks && `/${column.maxTasks}`}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTaskCreate?.(column.id)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Lista de Tarefas */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {column.tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onDragStart={handleDragStart}
            />
          ))}
          
          {/* Área de Drop quando vazia */}
          {column.tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center min-h-[200px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Arraste tarefas aqui</p>
                <p className="text-xs">ou clique em + para criar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)
KanbanColumn.displayName = "KanbanColumn"

// Componente Principal do Board
const KanbanBoard = React.forwardRef<HTMLDivElement, KanbanBoardProps>(
  ({ columns, onTaskMove, onTaskCreate, onTaskEdit, onTaskDelete, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20",
          className
        )}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTaskMove={onTaskMove}
            onTaskCreate={onTaskCreate}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>
    )
  }
)
KanbanBoard.displayName = "KanbanBoard"

export { KanbanBoard, KanbanColumn, KanbanCard }
