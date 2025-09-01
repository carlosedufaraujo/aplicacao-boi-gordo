import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Ícones
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Beef,
  Calculator,
  Receipt,
  CreditCard,
  Building2,
  Activity,
  BarChart3,
  Target,
  Info,
  FileText,
  Scale,
  Truck,
  MapPin,
  Hash,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

// Hooks e APIs
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { formatCurrency, formatWeight, formatCompactCurrency } from '@/utils/formatters';
import { showErrorNotification, showSuccessNotification, showWarningNotification } from '@/utils/errorHandler';

// Componentes
import { EnhancedSalesForm } from './EnhancedSalesForm';

interface SalesManagementProps {
  className?: string;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({ className }) => {
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuyer, setFilterBuyer] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [activeView, setActiveView] = useState<'table' | 'cards'>('table');

  // Hooks de API
  const { 
    saleRecords, 
    loading: salesLoading, 
    error: salesError, 
    stats,
    deleteSaleRecord,
    refresh: refreshSales 
  } = useSaleRecordsApi();
  
  const { cattlePurchases, loading: purchasesLoading } = useCattlePurchasesApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { pens, loading: pensLoading } = usePensApi();

  const isLoading = salesLoading || purchasesLoading || partnersLoading || pensLoading;

  // Filtrar vendas baseado nos critérios
  const filteredSales = useMemo(() => {
    return saleRecords.filter(sale => {
      // Filtro de busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const buyerName = partners.find(p => p.id === sale.slaughterhouseId)?.name || '';
        const lotInfo = cattlePurchases.find(p => p.id === sale.lotId);
        
        if (!buyerName.toLowerCase().includes(search) && 
            !lotInfo?.internalCode?.toLowerCase().includes(search) &&
            !sale.id.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro de comprador
      if (filterBuyer !== 'all' && sale.slaughterhouseId !== filterBuyer) {
        return false;
      }

      // Filtro de período
      if (filterDateRange !== 'all') {
        const saleDate = new Date(sale.saleDate);
        const now = new Date();
        
        switch (filterDateRange) {
          case 'today':
            if (saleDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (saleDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (saleDate < monthAgo) return false;
            break;
        }
      }

      // Filtro de status de pagamento
      if (filterStatus !== 'all') {
        const isPaid = !!sale.paymentDate;
        if (filterStatus === 'paid' && !isPaid) return false;
        if (filterStatus === 'pending' && isPaid) return false;
        if (filterStatus === 'reconciled' && !sale.reconciled) return false;
      }

      return true;
    });
  }, [saleRecords, searchTerm, filterBuyer, filterDateRange, filterStatus, partners, cattlePurchases]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grossRevenue, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.netProfit, 0);
    const totalAnimals = filteredSales.reduce((sum, sale) => sum + sale.currentQuantity, 0);
    const totalWeight = filteredSales.reduce((sum, sale) => sum + sale.totalWeight, 0);
    const averagePrice = filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.pricePerArroba, 0) / filteredSales.length 
      : 0;
    const averageMargin = filteredSales.length > 0
      ? filteredSales.reduce((sum, sale) => sum + sale.profitMargin, 0) / filteredSales.length
      : 0;
    
    // Vendas por status
    const paidSales = filteredSales.filter(sale => sale.paymentDate).length;
    const pendingSales = filteredSales.filter(sale => !sale.paymentDate).length;
    const reconciledSales = filteredSales.filter(sale => sale.reconciled).length;

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      totalAnimals,
      totalWeight,
      averagePrice,
      averageMargin,
      paidSales,
      pendingSales,
      reconciledSales
    };
  }, [filteredSales]);

  const handleEditSale = (sale: any) => {
    setSelectedSale(sale);
    setShowSalesForm(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      const success = await deleteSaleRecord(saleId);
      if (success) {
        showSuccessNotification('Venda excluída com sucesso');
        refreshSales();
      }
    }
  };

  const handleViewDetails = (sale: any) => {
    // Implementar visualização detalhada
    console.log('Visualizar detalhes:', sale);
  };

  const handleExport = () => {
    showWarningNotification('Exportação em desenvolvimento');
  };

  const handleImport = () => {
    showWarningNotification('Importação em desenvolvimento');
  };

  const getStatusBadge = (sale: any) => {
    if (sale.reconciled) {
      return <Badge className="bg-gray-500 text-white">Conciliado</Badge>;
    }
    if (sale.paymentDate) {
      return <Badge className="bg-green-500 text-white">Pago</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white">Pendente</Badge>;
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'cash':
        return <Badge variant="outline" className="text-green-600">À Vista</Badge>;
      case 'installment':
        return <Badge variant="outline" className="text-blue-600">Parcelado</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (salesError) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar vendas: {salesError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col gap-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as vendas de gado e acompanhe o faturamento
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm" onClick={refreshSales}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setShowSalesForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.reconciledSales} conciliadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCompactCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor bruto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCompactCurrency(metrics.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {metrics.averageMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Animais</CardTitle>
              <Beef className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAnimals}</div>
              <p className="text-xs text-muted-foreground">
                Total vendido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
              <Scale className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.totalWeight / 1000).toFixed(1)}t
              </div>
              <p className="text-xs text-muted-foreground">
                {(metrics.totalWeight / 15).toFixed(0)}@
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <Calculator className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {metrics.averagePrice.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por arroba
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.pendingSales}
              </div>
              <p className="text-xs text-muted-foreground">
                Pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ativo</div>
              <Progress value={75} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código, comprador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={filterBuyer} onValueChange={setFilterBuyer}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Comprador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Compradores</SelectItem>
                  {partners
                    .filter(p => p.type === 'slaughterhouse' || p.type === 'buyer')
                    .map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="reconciled">Conciliado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('table')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('cards')}
                >
                  <Package className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vendas */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4 animate-spin" />
                <span>Carregando vendas...</span>
              </div>
            </CardContent>
          </Card>
        ) : activeView === 'table' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendas Registradas</CardTitle>
              <CardDescription>
                {filteredSales.length} vendas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Lote/Curral</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Preço/@</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Lucro</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          Nenhuma venda encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => {
                        const buyer = partners.find(p => p.id === sale.slaughterhouseId);
                        const lot = cattlePurchases.find(p => p.id === sale.lotId);
                        
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>
                              {format(new Date(sale.saleDate), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{lot?.internalCode || '-'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {lot?.quantity || sale.currentQuantity} animais
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{buyer?.name || 'Desconhecido'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {buyer?.city} - {buyer?.state}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{sale.currentQuantity}</TableCell>
                            <TableCell>{formatWeight(sale.totalWeight)}</TableCell>
                            <TableCell>{formatCurrency(sale.pricePerArroba)}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(sale.grossRevenue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(sale.netProfit)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {sale.profitMargin.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getPaymentTypeBadge(sale.paymentType)}</TableCell>
                            <TableCell>{getStatusBadge(sale)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(sale)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSales.map((sale) => {
              const buyer = partners.find(p => p.id === sale.slaughterhouseId);
              const lot = cattlePurchases.find(p => p.id === sale.lotId);
              
              return (
                <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {lot?.internalCode || `Venda ${sale.id.slice(-6)}`}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(sale.saleDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(sale)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{buyer?.name || 'Desconhecido'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{sale.currentQuantity} cabeças</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Peso Total:</span>
                        <p className="font-medium">{formatWeight(sale.totalWeight)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Bruto:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(sale.grossRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Lucro:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(sale.netProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Margem:</span>
                        <span className="font-medium">
                          {sale.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      {getPaymentTypeBadge(sale.paymentType)}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(sale)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Formulário de Venda */}
        <EnhancedSalesForm
          isOpen={showSalesForm}
          onClose={() => {
            setShowSalesForm(false);
            setSelectedSale(null);
            refreshSales();
          }}
          saleToEdit={selectedSale}
        />
      </div>
    </TooltipProvider>
  );
};