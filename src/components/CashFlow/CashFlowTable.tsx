import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryById } from '@/data/defaultCategories';

interface CashFlowTableProps {
  data: any[];
  type: 'all' | 'income' | 'expense';
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const CashFlowTable: React.FC<CashFlowTableProps> = ({
  data,
  type,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'all' && 'Nenhuma movimentação encontrada'}
        {type === 'income' && 'Nenhuma receita encontrada'}
        {type === 'expense' && 'Nenhuma despesa encontrada'}
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            {type === 'all' && <TableHead>Tipo</TableHead>}
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((flow) => {
            const category = getCategoryById(flow.categoryId);
            return (
              <TableRow key={flow.id}>
                <TableCell>
                  {format(new Date(flow.date), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium">{flow.description}</TableCell>
                <TableCell>{category?.name || flow.categoryId}</TableCell>
                {type === 'all' && (
                  <TableCell>
                    <Badge variant={flow.type === 'INCOME' ? 'default' : 'destructive'}>
                      {flow.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className={flow.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                  {flow.type === 'INCOME' ? '+' : '-'}{formatCurrency(flow.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      flow.status === 'PAID' || flow.status === 'RECEIVED'
                        ? 'default'
                        : flow.status === 'CANCELLED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {flow.status === 'PAID' ? 'Pago' :
                     flow.status === 'RECEIVED' ? 'Recebido' :
                     flow.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {flow.account?.accountName || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(flow)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onStatusChange && flow.status === 'PENDING' && (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(
                            flow.id,
                            flow.type === 'INCOME' ? 'RECEIVED' : 'PAID'
                          )}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como {flow.type === 'INCOME' ? 'Recebido' : 'Pago'}
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(flow.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CashFlowTable;
