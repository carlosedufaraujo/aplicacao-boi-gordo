import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusChangeButtonProps {
  currentStatus: string;
  transactionType: 'INCOME' | 'EXPENSE';
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

const StatusChangeButton: React.FC<StatusChangeButtonProps> = ({
  currentStatus,
  transactionType,
  onStatusChange,
  disabled = false,
  size = 'sm'
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pendente',
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-amber-600'
        };
      case 'PAID':
        return {
          label: transactionType === 'EXPENSE' ? 'Pago' : 'Recebido',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-emerald-600'
        };
      case 'RECEIVED':
        return {
          label: 'Recebido',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-emerald-600'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelado',
          icon: XCircle,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
    }
  };

  const currentConfig = getStatusConfig(currentStatus);
  const CurrentIcon = currentConfig.icon;

  const availableStatuses = transactionType === 'INCOME' 
    ? ['PENDING', 'RECEIVED', 'CANCELLED']
    : ['PENDING', 'PAID', 'CANCELLED'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          disabled={disabled || isLoading}
          className="h-auto p-1 hover:bg-muted"
        >
          <Badge variant={currentConfig.variant} className="text-xs flex items-center gap-1">
            <CurrentIcon className="h-3 w-3" />
            {currentConfig.label}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[140px]">
        {availableStatuses.map((status) => {
          const config = getStatusConfig(status);
          const StatusIcon = config.icon;
          const isCurrentStatus = status === currentStatus;
          
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isCurrentStatus}
              className={cn(
                "flex items-center gap-2 text-xs",
                isCurrentStatus && "bg-muted"
              )}
            >
              <StatusIcon className={cn("h-3 w-3", config.color)} />
              {config.label}
              {isCurrentStatus && <span className="text-xs text-muted-foreground ml-auto">Atual</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusChangeButton;