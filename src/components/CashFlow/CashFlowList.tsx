import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryDisplayName } from '@/utils/categoryNormalizer';

interface CashFlowListProps {
  cashFlows: any[];
  onEdit: (cashFlow: any) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  loading?: boolean;
}

const CashFlowList: React.FC<CashFlowListProps> = ({
  cashFlows,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      PAID: { label: 'Pago', variant: 'success' as const, icon: CheckCircle },
      RECEIVED: { label: 'Recebido', variant: 'success' as const, icon: CheckCircle },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
      OVERDUE: { label: 'Vencido', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'INCOME' ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Receita
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        Despesa
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (cashFlows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma movimentação encontrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Conta</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cashFlows.map((cashFlow) => (
          <TableRow key={cashFlow.id}>
            <TableCell>
              {format(new Date(cashFlow.date), 'dd/MM/yyyy', { locale: ptBR })}
            </TableCell>
            <TableCell>{getTypeBadge(cashFlow.type)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {cashFlow.category?.color && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cashFlow.category.color }}
                  />
                )}
                {getCategoryDisplayName(cashFlow.categoryName || cashFlow.category?.name || cashFlow.category)}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{cashFlow.description}</p>
                {cashFlow.supplier && (
                  <p className="text-xs text-muted-foreground">{cashFlow.supplier}</p>
                )}
              </div>
            </TableCell>
            <TableCell>{cashFlow.account?.name || '-'}</TableCell>
            <TableCell>
              <span className={cn(
                "font-semibold",
                cashFlow.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
              )}>
                {cashFlow.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(cashFlow.amount)}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(cashFlow.status)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(cashFlow)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  
                  {cashFlow.status === 'PENDING' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(
                          cashFlow.id, 
                          cashFlow.type === 'INCOME' ? 'RECEIVED' : 'PAID'
                        )}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marcar como {cashFlow.type === 'INCOME' ? 'Recebido' : 'Pago'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(cashFlow.id, 'CANCELLED')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(cashFlow.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CashFlowList;
