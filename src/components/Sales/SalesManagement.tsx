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
import {
  exportToExcel,
  formatDateForExport,
  formatCurrencyForExport,
  formatWeightForExport
} from '@/utils/exportUtils';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

// Componentes
import { EnhancedSalesForm } from './EnhancedSalesForm';

interface SalesManagementProps {
  className?: string;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({ className }) => {
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Hook para geração de PDF
  const { generateReportPDF } = usePDFGenerator();
  
  // Teste direto da API ao montar o componente (removido - usar hook useSaleRecordsApi)
  
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
        const buyerName = sale.buyer?.name || '';
        const penNumber = sale.pen?.penNumber || '';
        const purchaseCode = sale.purchase?.lotCode || '';
        
        if (!buyerName.toLowerCase().includes(search) && 
            !penNumber.toLowerCase().includes(search) &&
            !purchaseCode.toLowerCase().includes(search) &&
            !sale.id.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Filtro de comprador
      if (filterBuyer !== 'all' && sale.buyerId !== filterBuyer) {
        return false;
      }

      // Filtro de período
      if (filterDateRange !== 'all') {
        const saleDate = new Date(sale.saleDate);
        const now = new Date();
        
        switch (filterDateRange) {
          case 'today':
      {
            if (saleDate.toDateString() !== now.toDateString()) return false;
            }
      break;
          case 'week':
      {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (saleDate < weekAgo) return false;
            }
      break;
          case 'month':
      {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (saleDate < monthAgo) return false;
            }
      break;
        }
      }

      return true;
    });
  }, [saleRecords, searchTerm, filterBuyer, filterDateRange]);

  // Debug removido para limpeza de código

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalValue || 0), 0);
    const totalNetValue = filteredSales.reduce((sum, sale) => sum + (sale.netValue || 0), 0);
    const totalAnimals = filteredSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalWeight = filteredSales.reduce((sum, sale) => sum + (sale.exitWeight || 0), 0);
    const totalCarcassWeight = filteredSales.reduce((sum, sale) => sum + (sale.carcassWeight || 0), 0);
    const averagePrice = filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + (sale.pricePerArroba || 0), 0) / filteredSales.length 
      : 0;
    const averageYield = totalCarcassWeight > 0 && totalWeight > 0
      ? (totalCarcassWeight / totalWeight) * 100
      : 0;
    
    return {
      totalSales,
      totalRevenue,
      totalNetValue,
      totalAnimals,
      totalWeight,
      totalCarcassWeight,
      averagePrice,
      averageYield
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
  };

  const handleExport = () => {
    if (filteredSales.length === 0) {
      showErrorNotification('Não há vendas para exportar');
      return;
    }

    const exportData = filteredSales.map(sale => ({
      'Data da Venda': formatDateForExport(sale.saleDate),
      'Código do Lote': sale.purchase?.lotCode || '-',
      'Número do Curral': sale.pen?.penNumber || '-',
      'Comprador': sale.buyer?.name || 'Desconhecido',
      'CPF/CNPJ': sale.buyer?.cpfCnpj || '',
      'Quantidade': sale.quantity,
      'Peso de Saída (kg)': sale.exitWeight,
      'Peso de Carcaça (kg)': sale.carcassWeight,
      'Rendimento de Carcaça (%)': sale.carcassYield?.toFixed(2) || '0',
      'Preço por Arroba': formatCurrencyForExport(sale.pricePerArroba),
      'Arrobas': (sale.carcassWeight / 15).toFixed(2),
      'Valor Total': formatCurrencyForExport(sale.totalValue),
      'Valor Líquido': formatCurrencyForExport(sale.netValue),
      'Tipo de Pagamento': sale.paymentType === 'cash' ? 'À Vista' : sale.paymentType === 'installment' ? 'Parcelado' : sale.paymentType,
      'Lucro': formatCurrencyForExport(sale.netValue - (sale.purchase?.totalCost || 0)),
      'Margem (%)': sale.totalValue > 0
        ? ((sale.netValue / sale.totalValue) * 100).toFixed(2) + '%'
        : '0%',
      'Observações': sale.notes || ''
    }));

    const result = exportToExcel(exportData, 'vendas-gado', 'Vendas');

    if (result.success) {
      showSuccessNotification(result.message);
    } else {
      showErrorNotification(result.message);
    }
  };

  const handleExportPDF = async () => {
    if (filteredSales.length === 0) {
      showErrorNotification('Não há vendas para exportar');
      return;
    }

    const reportData = {
      title: 'Relatório de Vendas de Gado',
      subtitle: `Total de ${filteredSales.length} venda(s) | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      data: filteredSales.map(sale => ({
        data: formatDateForExport(sale.saleDate),
        comprador: sale.buyer?.name || 'Desconhecido',
        qtd: sale.quantity.toString(),
        peso: `${sale.exitWeight.toLocaleString('pt-BR')} kg`,
        arroba: formatCurrencyForExport(sale.pricePerArroba),
        total: formatCurrencyForExport(sale.totalValue),
        liquido: formatCurrencyForExport(sale.netValue),
        rend: `${sale.carcassYield?.toFixed(1) || '0'}%`
      })),
      columns: [
        { key: 'data', label: 'Data', width: 30 },
        { key: 'comprador', label: 'Comprador', width: 50 },
        { key: 'qtd', label: 'Qtd', width: 20 },
        { key: 'peso', label: 'Peso', width: 30 },
        { key: 'arroba', label: 'R$/@', width: 30 },
        { key: 'total', label: 'Total', width: 35 },
        { key: 'liquido', label: 'Líquido', width: 35 },
        { key: 'rend', label: 'Rend.', width: 20 }
      ],
      summary: {
        'Total de Vendas': filteredSales.length,
        'Total de Animais': metrics.totalAnimals.toLocaleString('pt-BR'),
        'Receita Total': formatCurrencyForExport(metrics.totalRevenue),
        'Valor Líquido Total': formatCurrencyForExport(metrics.totalNetValue),
        'Preço Médio/@': formatCurrencyForExport(metrics.averagePrice),
        'Rendimento Médio': `${metrics.averageYield.toFixed(1)}%`
      }
    };

    const result = await generateReportPDF(reportData, {
      filename: `vendas-gado-${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`,
      format: 'a4',
      orientation: 'landscape'
    });

    if (result.success) {
      showSuccessNotification(result.message);
    } else {
      showErrorNotification(result.message);
    }
  };

  const handleImport = () => {
    showWarningNotification("Importação em desenvolvimento");
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setShowSalesForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas - Padrão Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  VENDAS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">{metrics.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                vendas realizadas
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  RECEITA
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">
                {formatCompactCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">receita total</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  LÍQUIDO
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">
                {formatCompactCurrency(metrics.totalNetValue)}
              </div>
              <p className="text-xs text-muted-foreground">valor líquido</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  ANIMAIS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">
                {metrics.totalAnimals.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">cabeças vendidas</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <Scale className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  ARROBAS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">
                {Math.round(metrics.totalCarcassWeight / 15).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">@ carcaça total</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                  R$/@
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.averagePrice).replace('R$', '')}
              </div>
              <p className="text-xs text-muted-foreground">preço médio</p>
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
                  {partners?.filter(p => p.type === "BUYER")
                    .map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
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
                      
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          Nenhuma venda encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {format(new Date(sale.saleDate), "dd/MM/yy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {sale.pen?.penNumber || sale.purchase?.lotCode || "-"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sale.quantity} animais
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{sale.buyer?.name || "Desconhecido"}</span>
                              <span className="text-xs text-muted-foreground">
                                {sale.buyer?.cpfCnpj || ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                            <TableCell>{formatWeight(sale.exitWeight)}</TableCell>
                            <TableCell>{formatCurrency(sale.pricePerArroba)}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(sale.totalValue)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(sale.netValue)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Rend: {sale.carcassYield?.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getPaymentTypeBadge(sale.paymentType)}</TableCell>
                            
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
                        ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSales.map((sale) => {
              return (
                <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {sale.pen?.penNumber || sale.purchase?.lotCode || `Venda ${sale.id.slice(-6)}`}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(sale.saleDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{sale.buyer?.name || 'Desconhecido'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{sale.quantity} cabeças</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Peso Saída:</span>
                        <p className="font-medium">{formatWeight(sale.exitWeight)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(sale.totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Líquido:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(sale.netValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rendimento:</span>
                        <span className="font-medium">
                          {sale.carcassYield?.toFixed(1)}%
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

export default SalesManagement;
