"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Eye,
  MousePointer2,
  Clock,
  Activity
} from "lucide-react"

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

// Componente de Cursor de Colaborador
export const CollaboratorCursor = React.forwardRef<HTMLDivElement, {
  collaborator: CollaboratorPresence;
  className?: string;
}>(({ collaborator, className }, ref) => {
  if (!collaborator.cursor) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed pointer-events-none z-50 transition-all duration-100",
        className
      )}
      style={{
        left: collaborator.cursor.x,
        top: collaborator.cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      <MousePointer2 
        className="h-4 w-4 animate-pulse" 
        style={{ color: collaborator.color }}
      />
      <div 
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap animate-fade-in"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.userName}
      </div>
    </div>
  );
});
CollaboratorCursor.displayName = "CollaboratorCursor";

// Componente de Lista de Colaboradores
export const CollaboratorsList = React.forwardRef<HTMLDivElement, {
  collaborators: CollaboratorPresence[];
  isConnected: boolean;
  className?: string;
}>(({ collaborators, isConnected, className }, ref) => {
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <Card ref={ref} className={cn("w-64", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            Colaboradores ({collaborators.length})
          </span>
          <Badge 
            variant={isConnected ? "default" : "destructive"} 
            className="text-xs"
          >
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="space-y-2">
          {collaborators.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum colaborador online</p>
            </div>
          ) : (
            collaborators.map((collaborator) => (
              <TooltipProvider key={collaborator.userId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={collaborator.userAvatar} />
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: collaborator.color + '20', color: collaborator.color }}
                          >
                            {collaborator.userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background"
                          style={{ backgroundColor: collaborator.color }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {collaborator.userName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatLastSeen(collaborator.lastSeen)}</span>
                        </div>
                      </div>

                      {collaborator.selectedTask && (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium">{collaborator.userName}</p>
                      <p>Último visto: {formatLastSeen(collaborator.lastSeen)}</p>
                      {collaborator.selectedTask && (
                        <p>Visualizando uma tarefa</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});
CollaboratorsList.displayName = "CollaboratorsList";

// Componente de Feed de Atividades
export const ActivityFeed = React.forwardRef<HTMLDivElement, {
  events: RealtimeEvent[];
  className?: string;
}>(({ events, className }, ref) => {
  const getEventIcon = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'task_moved': return '📦';
      case 'task_created': return '✨';
      case 'task_updated': return '✏️';
      case 'task_deleted': return '🗑️';
      case 'task_selected': return '👆';
      default: return '📝';
    }
  };

  const getEventDescription = (event: RealtimeEvent) => {
    switch (event.type) {
      case 'task_moved':
      {
        return `moveu "${event.data.taskTitle}" para ${event.data.toColumn}`;
      case 'task_created':
      {
        return `criou a tarefa "${event.data.task.title}"`;
      case 'task_updated':
      {
        return `atualizou "${event.data.task.title}"`;
      case 'task_deleted':
      {
        return `excluiu "${event.data.taskTitle}"`;
      case 'task_selected':
      {
        return 'selecionou uma tarefa';
      default:
        return 'realizou uma ação';
    }
  };

  const formatEventTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card ref={ref} className={cn("w-80", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Atividade Recente</span>
          <Badge variant="secondary" className="text-xs">
            {events.length}
          </Badge>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma atividade recente</p>
            </div>
          ) : (
            events.slice().reverse().map((event, index) => (
              <div 
                key={`${event.userId}-${event.timestamp.getTime()}-${index}`}
                className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors animate-slide-in-down"
              >
                <span className="text-sm mt-0.5">
                  {getEventIcon(event.type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{event.userName}</span>
                    {' '}
                    <span className="text-muted-foreground">
                      {getEventDescription(event)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});
ActivityFeed.displayName = "ActivityFeed";

// Componente de Indicador de Tarefa Selecionada
export const TaskSelectionIndicator = React.forwardRef<HTMLDivElement, {
  taskId: string;
  collaborators: CollaboratorPresence[];
  className?: string;
}>(({ taskId, collaborators, className }, ref) => {
  const viewingCollaborators = collaborators.filter(
    c => c.selectedTask === taskId
  );

  if (viewingCollaborators.length === 0) return null;

  return (
    <div ref={ref} className={cn("flex items-center gap-1", className)}>
      <Eye className="h-3 w-3 text-muted-foreground" />
      <div className="flex -space-x-1">
        {viewingCollaborators.slice(0, 3).map((collaborator) => (
          <TooltipProvider key={collaborator.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-4 h-4 rounded-full border border-background"
                  style={{ backgroundColor: collaborator.color }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{collaborator.userName} está visualizando</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {viewingCollaborators.length > 3 && (
          <div className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center">
            <span className="text-xs font-medium">
              +{viewingCollaborators.length - 3}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
TaskSelectionIndicator.displayName = "TaskSelectionIndicator";
