import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Home, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Wrench,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PenOccupancyIndicatorsProps {
  penNumber: string;
  capacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  status: 'available' | 'partial' | 'full' | 'maintenance';
  activeLots: number;
  lastUpdated: Date;
  isConnected?: boolean;
  className?: string;
  variant?: 'card' | 'compact' | 'detailed';
}

export const PenOccupancyIndicators: React.FC<PenOccupancyIndicatorsProps> = ({
  penNumber,
  capacity,
  currentOccupancy,
  occupancyRate,
  status,
  activeLots,
  lastUpdated,
  isConnected = true,
  className,
  variant = 'card'
}) => {
  
  // Configurações de cor e ícone baseadas no status
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          icon: CheckCircle,
          label: 'Disponível',
          badgeVariant: 'outline' as const
        };
      case 'partial':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          icon: Users,
          label: 'Ocupado Parcial',
          badgeVariant: 'outline' as const
        };
      case 'full':
        return {
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          icon: AlertTriangle,
          label: 'Lotado',
          badgeVariant: 'destructive' as const
        };
      case 'maintenance':
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          icon: Wrench,
          label: 'Manutenção',
          badgeVariant: 'outline' as const
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          icon: Home,
          label: 'Desconhecido',
          badgeVariant: 'outline' as const
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // Função para obter cor da barra de progresso
  const getProgressColor = () => {
    if (occupancyRate >= 95) return 'bg-error';
    if (occupancyRate >= 80) return 'bg-warning';
    if (occupancyRate >= 50) return 'bg-info';
    return 'bg-success';
  };

  // Renderização compacta
  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-sm',
            config.bgColor,
            config.borderColor,
            className
          )}>
            <StatusIcon className={cn('h-4 w-4', config.color)} />
            <span className="card-subtitle font-medium">{penNumber}</span>
            <Badge variant={config.badgeVariant} className="text-caption">
              {currentOccupancy}/{capacity}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-body-sm font-medium">Curral {penNumber}</p>
            <p className="text-body-sm">Ocupação: {currentOccupancy}/{capacity} ({occupancyRate.toFixed(1)}%)</p>
            <p className="text-body-sm">Status: {config.label}</p>
            <p className="text-body-sm">Lotes ativos: {activeLots}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Renderização detalhada
  if (variant === 'detailed') {
    return (
      <div className={cn(
        'p-4 rounded-xl border transition-all hover:shadow-lg',
        config.bgColor,
        config.borderColor,
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-5 w-5', config.color)} />
            <h3 className="card-title">Curral {penNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant} className="text-caption">{config.label}</Badge>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="kpi-value">{currentOccupancy}</div>
            <div className="kpi-label">Animais</div>
          </div>
          <div className="text-center">
            <div className="kpi-value">{capacity}</div>
            <div className="kpi-label">Capacidade</div>
          </div>
          <div className="text-center">
            <div className="kpi-value">{activeLots}</div>
            <div className="kpi-label">Lotes</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body-sm">Ocupação</span>
            <span className="text-body-sm font-medium">{occupancyRate.toFixed(1)}%</span>
          </div>
          <Progress 
            value={occupancyRate} 
            className="h-2"
            // className={cn('h-2', getProgressColor())}
          />
        </div>

        {/* Última atualização */}
        <div className="flex items-center gap-1 mt-3 text-caption text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    );
  }

  // Renderização padrão (card)
  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all hover:shadow-md',
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-4 w-4', config.color)} />
          <span className="card-subtitle font-medium">{penNumber}</span>
        </div>
        <Badge variant={config.badgeVariant} className="text-caption">
          {occupancyRate.toFixed(0)}%
        </Badge>
      </div>

      {/* Ocupação */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-body-sm text-muted-foreground">Ocupação</span>
          <span className="text-body-sm font-medium">{currentOccupancy}/{capacity}</span>
        </div>
        <Progress value={occupancyRate} className="h-1.5" />
      </div>

      {/* Informações adicionais */}
      <div className="flex items-center justify-between mt-2 text-caption text-muted-foreground">
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span>{activeLots} lotes</span>
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para estatísticas gerais de ocupação
interface OccupancyStatsProps {
  stats: {
    total: number;
    available: number;
    partial: number;
    full: number;
    maintenance: number;
    totalCapacity: number;
    totalOccupancy: number;
    overallOccupancyRate: number;
  };
  isConnected: boolean;
}

export const OccupancyStats: React.FC<OccupancyStatsProps> = ({ stats, isConnected }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Ocupação geral */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="kpi-label">Ocupação Geral</h3>
          <Home className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="kpi-value">{stats.overallOccupancyRate.toFixed(1)}%</div>
        <p className="kpi-variation text-muted-foreground">
          {stats.totalOccupancy}/{stats.totalCapacity} animais
        </p>
      </div>

      {/* Currais disponíveis */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="kpi-label">Disponíveis</h3>
          <CheckCircle className="h-4 w-4 text-success" />
        </div>
        <div className="kpi-value text-success">{stats.available}</div>
        <p className="kpi-variation text-muted-foreground">
          {((stats.available / stats.total) * 100).toFixed(0)}% do total
        </p>
      </div>

      {/* Currais ocupados */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="kpi-label">Em Uso</h3>
          <Users className="h-4 w-4 text-warning" />
        </div>
        <div className="kpi-value text-warning">{stats.partial + stats.full}</div>
        <p className="kpi-variation text-muted-foreground">
          {(((stats.partial + stats.full) / stats.total) * 100).toFixed(0)}% do total
        </p>
      </div>

      {/* Status da conexão */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="kpi-label">Conexão</h3>
          {isConnected ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-error" />
          )}
        </div>
        <div className={cn(
          "kpi-value",
          isConnected ? "text-success" : "text-error"
        )}>
          {isConnected ? "Online" : "Offline"}
        </div>
        <p className="kpi-variation text-muted-foreground">
          Tempo real {isConnected ? "ativo" : "inativo"}
        </p>
      </div>
    </div>
  );
};
