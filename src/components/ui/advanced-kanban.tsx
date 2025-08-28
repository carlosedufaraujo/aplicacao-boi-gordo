"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MoreHorizontal, 
  Plus, 
  Calendar,
  User,
  Flag,
  Clock,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { KanbanTask, KanbanColumn } from "./kanban"

// Tipos estendidos para Kanban avançado
export interface KanbanSwimlane {
  id: string
  title: string
  description?: string
  color?: string
  collapsed?: boolean
  priority?: number
}

export interface AdvancedKanbanColumn extends KanbanColumn {
  swimlanes?: { [swimlaneId: string]: KanbanTask[] }
}

export interface KanbanFilters {
  search?: string
  assignee?: string
  priority?: string[]
  tags?: string[]
  dueDate?: 'overdue' | 'today' | 'week' | 'month'
  swimlane?: string
}

interface AdvancedKanbanBoardProps {
  columns: AdvancedKanbanColumn[]
  swimlanes?: KanbanSwimlane[]
  filters?: KanbanFilters
  showSwimlanes?: boolean
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string, swimlane?: string) => void
  onTaskCreate?: (columnId: string, swimlaneId?: string) => void
  onTaskEdit?: (task: KanbanTask) => void
  onTaskDelete?: (taskId: string) => void
  onFiltersChange?: (filters: KanbanFilters) => void
  onSwimlaneToggle?: (swimlaneId: string) => void
  className?: string
}

// Componente de Filtros Avançados
const KanbanFilters = React.forwardRef<HTMLDivElement, {
  filters: KanbanFilters
  onFiltersChange: (filters: KanbanFilters) => void
  availableAssignees: string[]
  availableTags: string[]
}>(({ filters, onFiltersChange, availableAssignees, availableTags }, ref) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const updateFilter = (key: keyof KanbanFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <Card ref={ref} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-sm">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-6 text-xs"
              >
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Busca */}
            <div className="space-y-2">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Responsável */}
              <div className="space-y-2">
                <Label className="text-xs">Responsável</Label>
                <Select 
                  value={filters.assignee || ''} 
                  onValueChange={(value) => updateFilter('assignee', value || undefined)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {availableAssignees.map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label className="text-xs">Prioridade</Label>
                <Select 
                  value={filters.priority?.[0] || ''} 
                  onValueChange={(value) => updateFilter('priority', value ? [value] : undefined)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <Label className="text-xs">Vencimento</Label>
                <Select 
                  value={filters.dueDate || ''} 
                  onValueChange={(value) => updateFilter('dueDate', value || undefined)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="overdue">Atrasadas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs">Tags</Label>
                <Select 
                  value={filters.tags?.[0] || ''} 
                  onValueChange={(value) => updateFilter('tags', value ? [value] : undefined)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
})
KanbanFilters.displayName = "KanbanFilters"

// Componente de Swimlane
const KanbanSwimlane = React.forwardRef<HTMLDivElement, {
  swimlane: KanbanSwimlane
  columns: AdvancedKanbanColumn[]
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string, swimlane?: string) => void
  onTaskCreate?: (columnId: string, swimlaneId?: string) => void
  onTaskEdit?: (task: KanbanTask) => void
  onTaskDelete?: (taskId: string) => void
  onToggle?: (swimlaneId: string) => void
}>(({ swimlane, columns, onTaskMove, onTaskCreate, onTaskEdit, onTaskDelete, onToggle }, ref) => {
  const [isCollapsed, setIsCollapsed] = React.useState(swimlane.collapsed || false)

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
    onToggle?.(swimlane.id)
  }

  const swimlaneTasks = columns.reduce((total, column) => {
    return total + (column.swimlanes?.[swimlane.id]?.length || 0)
  }, 0)

  return (
    <div ref={ref} className="border-b border-border last:border-b-0">
      {/* Header da Swimlane */}
      <div 
        className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div>
            <h4 className="font-medium text-sm">{swimlane.title}</h4>
            {swimlane.description && (
              <p className="text-xs text-muted-foreground">{swimlane.description}</p>
            )}
          </div>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {swimlaneTasks} tarefas
        </Badge>
      </div>

      {/* Conteúdo da Swimlane */}
      <Collapsible open={!isCollapsed}>
        <CollapsibleContent>
          <div className="flex gap-4 p-4 overflow-x-auto min-h-[200px]">
            {columns.map((column) => {
              const tasks = column.swimlanes?.[swimlane.id] || []
              
              return (
                <div
                  key={`${column.id}-${swimlane.id}`}
                  className="flex-shrink-0 w-80 space-y-2"
                >
                  {/* Header da coluna na swimlane */}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {column.title}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskCreate?.(column.id, swimlane.id)}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Tasks da coluna na swimlane */}
                  <div className="space-y-2 min-h-[120px] p-2 rounded border-2 border-dashed border-transparent hover:border-primary/20 transition-colors">
                    {tasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className="cursor-grab active:cursor-grabbing hover-lift animate-scale-in"
                        draggable
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-xs font-medium leading-tight">
                              {task.title}
                            </h5>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onTaskDelete?.(task.id)}
                                  className="text-destructive"
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge 
                              className={cn(
                                "px-1.5 py-0.5",
                                task.priority === 'urgent' && "bg-destructive text-destructive-foreground",
                                task.priority === 'high' && "bg-orange-500 text-white",
                                task.priority === 'medium' && "bg-yellow-500 text-white",
                                task.priority === 'low' && "bg-blue-500 text-white"
                              )}
                            >
                              {task.priority}
                            </Badge>
                            
                            {task.assignee && (
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {task.assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {tasks.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
})
KanbanSwimlane.displayName = "KanbanSwimlane"

// Componente Principal do Board Avançado
const AdvancedKanbanBoard = React.forwardRef<HTMLDivElement, AdvancedKanbanBoardProps>(
  ({ 
    columns, 
    swimlanes = [], 
    filters = {}, 
    showSwimlanes = false,
    onTaskMove, 
    onTaskCreate, 
    onTaskEdit, 
    onTaskDelete,
    onFiltersChange,
    onSwimlaneToggle,
    className 
  }, ref) => {
    // Extrair dados para filtros
    const availableAssignees = React.useMemo(() => {
      const assignees = new Set<string>()
      columns.forEach(column => {
        column.tasks.forEach(task => {
          if (task.assignee?.name) {
            assignees.add(task.assignee.name)
          }
        })
        if (column.swimlanes) {
          Object.values(column.swimlanes).forEach(tasks => {
            tasks.forEach(task => {
              if (task.assignee?.name) {
                assignees.add(task.assignee.name)
              }
            })
          })
        }
      })
      return Array.from(assignees)
    }, [columns])

    const availableTags = React.useMemo(() => {
      const tags = new Set<string>()
      columns.forEach(column => {
        column.tasks.forEach(task => {
          task.tags?.forEach(tag => tags.add(tag))
        })
        if (column.swimlanes) {
          Object.values(column.swimlanes).forEach(tasks => {
            tasks.forEach(task => {
              task.tags?.forEach(tag => tags.add(tag))
            })
          })
        }
      })
      return Array.from(tags)
    }, [columns])

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {/* Filtros */}
        {onFiltersChange && (
          <KanbanFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableAssignees={availableAssignees}
            availableTags={availableTags}
          />
        )}

        {/* Board */}
        <Card>
          <CardContent className="p-0">
            {showSwimlanes && swimlanes.length > 0 ? (
              // Modo Swimlanes
              <div className="divide-y divide-border">
                {swimlanes.map((swimlane) => (
                  <KanbanSwimlane
                    key={swimlane.id}
                    swimlane={swimlane}
                    columns={columns}
                    onTaskMove={onTaskMove}
                    onTaskCreate={onTaskCreate}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onToggle={onSwimlaneToggle}
                  />
                ))}
              </div>
            ) : (
              // Modo Tradicional
              <div className="flex gap-4 overflow-x-auto p-4">
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-3 animate-slide-in-right"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{column.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {column.tasks.length}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskCreate?.(column.id)}
                        className="h-6 w-6 p-0 hover-scale"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2 min-h-[400px]">
                      {column.tasks.map((task) => (
                        <Card 
                          key={task.id} 
                          className="cursor-grab active:cursor-grabbing hover-lift animate-scale-in"
                        >
                          <CardContent className="p-3">
                            <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  task.priority === 'urgent' && "status-error",
                                  task.priority === 'high' && "bg-orange-100 text-orange-800",
                                  task.priority === 'medium' && "bg-yellow-100 text-yellow-800",
                                  task.priority === 'low' && "bg-blue-100 text-blue-800"
                                )}
                              >
                                {task.priority}
                              </Badge>
                              {task.assignee && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.initials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
)
AdvancedKanbanBoard.displayName = "AdvancedKanbanBoard"

export { AdvancedKanbanBoard, KanbanFilters, KanbanSwimlane }
