import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { formatCurrency } from '@/utils/formatters';

// Componentes UI
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedPurchaseTableProps {
  searchTerm?: string;
  filterStatus?: string;
  onView?: (purchase: any) => void;
  onEdit?: (purchase: any) => void;
  onDelete?: (purchase: any) => void;
  onStatusChange?: (purchase: any) => void;
}

export function EnhancedPurchaseTable({
  searchTerm = '',
  filterStatus = 'all',
  onView,
  onEdit,
  onDelete,
  onStatusChange
}: EnhancedPurchaseTableProps) {
  const { 
    purchases, 
    loading,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    changePage,
    changePageSize
  } = useCattlePurchasesApi();

  // Estado local para controle de paginação
  const [localPageSize, setLocalPageSize] = useState(50);

  // Filtrar compras
  const filteredPurchases = useMemo(() => {
    return purchases.filter(purchase => {
      const matchesSearch = 
        purchase.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || purchase.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, filterStatus]);

  // Calcular totalizadores apenas para os itens filtrados da página atual
  const totals = useMemo(() => {
    const totalQuantity = filteredPurchases.reduce((sum, p) => sum + (p.initialQuantity || p.quantity || 0), 0);
    const totalCurrentQuantity = filteredPurchases.reduce((sum, p) => sum + (p.currentQuantity || 0), 0);
    const totalWeightSum = filteredPurchases.reduce((sum, p) => sum + (p.purchaseWeight || p.totalWeight || 0), 0);
    
    // Calcular investimento total incluindo todos os custos
    const totalInvestment = filteredPurchases.reduce((sum, p) => {
      const purchaseValue = p.purchaseValue || p.totalValue || 0;
      const freight = p.freightCost || 0;
      const commission = p.commission || 0;
      const otherCosts = p.otherCosts || p.operationalCost || 0;
      return sum + purchaseValue + freight + commission + otherCosts;
    }, 0);
    
    return {
      quantity: totalQuantity,
      currentQuantity: totalCurrentQuantity,
      totalWeight: totalWeightSum,
      investment: totalInvestment,
      averageWeight: totalQuantity > 0 ? totalWeightSum / totalQuantity : 0
    };
  }, [filteredPurchases]);

  // Função para mudar tamanho da página
  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setLocalPageSize(newSize);
    changePageSize(newSize);
  };

  // Função para ir para uma página específica
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      changePage(page);
    }
  };

  // Renderizar status
  const getStatusBadge = (status: string, stage?: string) => {
    let label = 'Confirmado';
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    if (status === 'CONFINED') {
      label = 'Confinado';
      variant = 'secondary';
    } else if (stage === 'received') {
      label = 'Recepcionado';
      variant = 'outline';
    } else if (stage === 'in_transit') {
      label = 'Em Trânsito';
      variant = 'default';
    }
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tabela de Compras</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Package className="w-4 h-4" />
            <span>{totalItems} compras totais</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Lote</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor/Local</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Peso Total/Médio</TableHead>
                  <TableHead className="text-right">R$/@</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhuma compra encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.lotCode}</TableCell>
                      <TableCell>
                        {format(new Date(purchase.purchaseDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{purchase.vendor?.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{purchase.location || purchase.state || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">
                            {purchase.initialQuantity || purchase.quantity || 0}
                          </div>
                          {purchase.currentQuantity && purchase.currentQuantity < (purchase.initialQuantity || purchase.quantity) && (
                            <div className="text-xs text-muted-foreground">
                              (atual: {purchase.currentQuantity})
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">
                            {(purchase.purchaseWeight || purchase.totalWeight || 0).toLocaleString('pt-BR')} kg
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(purchase.initialQuantity || purchase.quantity) > 0 ? ((purchase.purchaseWeight || purchase.totalWeight || 0) / (purchase.initialQuantity || purchase.quantity || 1)).toFixed(1) : '0'} kg/cab
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(purchase.pricePerArroba || purchase.pricePerKg || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency((() => {
                          // Calcular o investimento total (valor + frete + comissão + outros custos)
                          const purchaseValue = purchase.purchaseValue || purchase.totalValue || 0;
                          const freight = purchase.freightCost || 0;
                          const commission = purchase.commission || 0;
                          const otherCosts = purchase.otherCosts || purchase.operationalCost || 0;
                          return purchaseValue + freight + commission + otherCosts;
                        })())}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => onStatusChange?.(purchase)}
                          className="cursor-pointer"
                        >
                          {getStatusBadge(purchase.status, purchase.stage)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onView?.(purchase)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visualizar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onEdit?.(purchase)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onDelete?.(purchase)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Linha de Totalizadores */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total de Animais</span>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-lg font-semibold">{totals.quantity}</span>
                {totals.currentQuantity < totals.quantity && (
                  <span className="text-sm text-muted-foreground">
                    (atual: {totals.currentQuantity})
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Peso Total</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-lg font-semibold">
                  {totals.totalWeight.toLocaleString('pt-BR')} kg
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Peso Médio</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-lg font-semibold">
                  {totals.averageWeight.toFixed(1)} kg
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Investimento Total</span>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(totals.investment)}
                </span>
              </div>
            </div>
          </div>

          {/* Controles de Paginação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <Select value={localPageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} | Total: {totalItems} registros
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Páginas numeradas */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    
                    // Lógica para mostrar páginas ao redor da página atual
                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}