import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function PaginatedTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onLimitChange,
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
}: PaginatedTableProps<T>) {
  const { page, limit, total, totalPages } = pagination;
  
  // Calcular range de items exibidos
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  // Gerar array de páginas para navegação
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      }
    }
    
    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });
    
    return rangeWithDots;
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell 
                        ? column.cell(item)
                        : item[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Controles de Paginação */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Info e Seletor de Limite */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startItem} a {endItem} de {total} resultados
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items por página:</span>
              <Select value={limit.toString()} onValueChange={(value) => onLimitChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Navegação de Páginas */}
          <div className="flex items-center gap-1">
            {/* Primeira página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* Página anterior */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Números de página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNumber, index) => (
                pageNumber === '...' ? (
                  <span key={`dots-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNumber}
                    variant={page === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNumber as number)}
                    className="h-8 min-w-8 px-2"
                  >
                    {pageNumber}
                  </Button>
                )
              ))}
            </div>
            
            {/* Próxima página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Última página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}