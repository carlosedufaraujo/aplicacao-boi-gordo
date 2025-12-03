import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Package,
  Scale,
  TrendingUp,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { EnhancedPurchaseForm } from '../Forms/EnhancedPurchaseForm';
import { PurchaseDetailsModal } from './PurchaseDetailsModal';
import { eventBus, EVENTS } from '@/utils/eventBus';
import {
  exportToExcel,
  formatDateForExport,
  formatCurrencyForExport,
  formatWeightForExport
} from '@/utils/exportUtils';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PurchaseData {
  id: string;
  lotNumber: string;
  lotCode: string;
  vendorName: string;
  vendorId: string;
  purchaseDate: Date;
  entryDate?: Date;
  currentQuantity: number;
  entryQuantity?: number;
  totalWeight: number;
  entryWeight?: number;
  averageWeight: number;
  purchasePrice: number;
  pricePerKg: number;
  pricePerArroba: number;
  totalCost: number;
  additionalCosts: {
    freight: number;
    health: number;
    feed: number;
    operational: number;
    others: number;
  };
  status: 'PENDING' | 'RECEIVED' | 'ACTIVE' | 'SOLD' | 'CANCELLED';
  notes?: string;
  carcassYield: number;
}

export const PurchaseManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<any>(null);

  // Hooks de API
  const {
    cattlePurchases,
    loading: ordersLoading,
    loadCattlePurchases,
    createCattlePurchase,
    updateCattlePurchase,
    deleteCattlePurchase
  } = useCattlePurchasesApi();

  const { partners, loadPartners } = usePartnersApi();

  // Hook para geração de PDF
  const { generateReportPDF } = usePDFGenerator();

  // Carregar dados
  useEffect(() => {
    loadData();
    
    // Event listeners
    const handleRefresh = () => loadData();
    eventBus.on(EVENTS.ORDER_UPDATED, handleRefresh);
    eventBus.on(EVENTS.LOT_UPDATED, handleRefresh);
    eventBus.on(EVENTS.ORDER_DELETED, handleRefresh);
    eventBus.on(EVENTS.LOT_DELETED, handleRefresh);
    
    return () => {
      eventBus.off(EVENTS.ORDER_UPDATED, handleRefresh);
      eventBus.off(EVENTS.LOT_UPDATED, handleRefresh);
      eventBus.off(EVENTS.ORDER_DELETED, handleRefresh);
      eventBus.off(EVENTS.LOT_DELETED, handleRefresh);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados em paralelo
      await Promise.all([
        loadCattlePurchases(),
        loadPartners()
      ]);

      // Debug removido para limpeza de código
      
    } catch (_error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combinar dados quando os estados mudarem
  useEffect(() => {
    if (cattlePurchases.length > 0 && !ordersLoading) {
      const combinedData = cattlePurchases.map(order => {
        const lot = cattlePurchases.find(l => l.purchaseId === order.id);
        const vendor = partners.find(p => p.id === order.vendorId);
        const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
        
        // Calcular valores usando dados corretos do backend
        const totalWeight = lot?.entryWeight || order.totalWeight || 0;
        const currentQuantity = lot?.entryQuantity || order.animalCount || 1;
        const averageWeight = order.averageWeight || (currentQuantity > 0 ? totalWeight / currentQuantity : 0);
        const pricePerArroba = order.pricePerArroba || 0;
        const totalArrobasPesoVivo = totalWeight / 30;
        const totalArrobasCarcaca = totalArrobasPesoVivo * (order.carcassYield / 100);
        const purchasePrice = pricePerArroba * totalArrobasCarcaca;
        
        // Custos adicionais
        const additionalCosts = {
          freight: lot?.freightCost || 0,
          health: lot?.healthCost || 0,
          feed: lot?.feedCost || 0,
          operational: lot?.operationalCost || 0,
          others: lot?.otherCosts || 0
        };
        
        const totalAdditionalCosts = Object.values(additionalCosts).reduce((a, b) => a + b, 0);
        const totalCost = purchasePrice + totalAdditionalCosts;
        
        return {
          // IDs
          id: order.id,
          lotId: lot?.id,
          
          // Números de identificação
          lotNumber: lot?.lotNumber || `LOT-${order.lotCode}`,
          lotCode: order.lotCode,
          
          // Fornecedor e corretor
          vendorName: vendor?.name || order.vendor?.name || 'Desconhecido',
          vendorId: order.vendorId,
          brokerName: broker?.name,
          brokerId: order.brokerId,
          
          // Localização
          location: order.location,
          
          // Datas
          purchaseDate: new Date(order.purchaseDate),
          entryDate: lot?.entryDate ? new Date(lot.entryDate) : undefined,
          principalDueDate: order.principalDueDate,
          
          // Tipo e quantidade de animais
          animalType: order.animalType,
          animalCount: order.animalCount,
          currentQuantity: order.animalCount,
          entryQuantity: lot?.entryQuantity || lot?.currentQuantity || order.animalCount,
          currentQuantity: lot?.currentQuantity || order.animalCount,
          deathCount: lot?.deathCount || 0,
          
          // Pesos
          totalWeight: totalWeight,
          entryWeight: lot?.entryWeight || totalWeight,
          averageWeight: averageWeight,
          
          // Valores
          pricePerArroba: pricePerArroba,
          purchasePrice: purchasePrice,
          pricePerKg: pricePerArroba / 15, // preço por kg de carcaça
          totalCost: totalCost,
          acquisitionCost: purchasePrice,
          
          // Comissão
          commission: order.commission || 0,
          commissionPaymentType: order.commissionPaymentType,
          commissionDueDate: order.commissionDueDate,
          
          // Custos adicionais
          additionalCosts: additionalCosts,
          freightCost: additionalCosts.freight,
          healthCost: additionalCosts.health,
          feedCost: additionalCosts.feed,
          operationalCost: additionalCosts.operational,
          otherCosts: additionalCosts.others,
          
          // Informações de frete
          transportCompany: order.transportCompany,
          transportCompanyId: order.transportCompanyId,
          freightDistance: order.freightDistance || order.freightKm,
          freightCostPerKm: order.freightCostPerKm,
          freightPaymentType: order.freightPaymentType,
          freightDueDate: order.freightDueDate,
          
          // Informações de pagamento
          payerAccountId: order.payerAccountId,
          payerAccountName: order.payerAccount?.name,
          paymentType: order.paymentType,
          paymentTerms: order.paymentTerms,
          dueDate: order.dueDate,
          
          // Status e observações
          status: mapStatus(order.status, lot?.status),
          notes: order.notes || lot?.notes,
          
          // Rendimento de carcaça
          carcassYield: order.carcassYield || 50,
          
          // GMD (se existir)
          expectedGMD: lot?.expectedGMD,
          targetWeight: lot?.targetWeight
        } as any;
      });
      
      setPurchases(combinedData);
    } else {
      console.log('[PurchaseManagement] Dados de estado:', {
        cattlePurchases: cattlePurchases.length,
        partners: partners.length,
        ordersLoading,
        lotsLoading
      });
    }
  }, [cattlePurchases, cattlePurchases, partners, ordersLoading, lotsLoading]);

  const mapStatus = (orderStatus: string, lotStatus?: string): PurchaseData['status'] => {
    if (orderStatus === 'CANCELLED') return 'CANCELLED';
    if (lotStatus === 'SOLD') return 'SOLD';
    if (lotStatus === 'ACTIVE') return 'ACTIVE';
    if (orderStatus === 'RECEPTION' || orderStatus === 'CONFINED') return 'RECEIVED';
    return 'PENDING';
  };

  const getStatusBadge = (status: PurchaseData['status']) => {
    const variants = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      RECEIVED: { label: 'Recebido', className: 'bg-blue-100 text-blue-800' },
      ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      SOLD: { label: 'Vendido', className: 'bg-purple-100 text-purple-800' },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };
    
    const variant = variants[status];
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    
    try {
      const purchase = purchases.find(p => p.id === purchaseToDelete);
      if (!purchase) return;
      
      // Deletar lote se existir
      const lot = cattlePurchases.find(l => l.purchaseId === purchase.id);
      if (lot) {
        await deleteCattlePurchase(lot.id);
      }
      
      // Deletar ordem
      await deleteCattlePurchase(purchase.id);
      
      toast.success('Compra excluída com sucesso');
      loadData();
    } catch (_error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir compra');
    } finally {
      setShowDeleteDialog(false);
      setPurchaseToDelete(null);
    }
  };

  const handleExport = () => {
    if (filteredPurchases.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const exportData = filteredPurchases.map(purchase => ({
      'Código do Lote': purchase.lotCode,
      'Número do Lote': purchase.lotNumber,
      'Fornecedor': purchase.vendorName,
      'Data de Compra': formatDateForExport(purchase.purchaseDate),
      'Data de Entrada': purchase.entryDate ? formatDateForExport(purchase.entryDate) : 'Não recebido',
      'Quantidade Atual': purchase.currentQuantity,
      'Quantidade de Entrada': purchase.entryQuantity || purchase.currentQuantity,
      'Peso Total (kg)': purchase.totalWeight,
      'Peso Médio/Animal (kg)': purchase.averageWeight.toFixed(2),
      'Peso em Toneladas': (purchase.totalWeight / 1000).toFixed(2),
      'Arrobas Peso Vivo': (purchase.totalWeight / 30).toFixed(2),
      'Rendimento Carcaça (%)': purchase.carcassYield,
      'Preço por Arroba': formatCurrencyForExport(purchase.pricePerArroba),
      'Preço por Kg': formatCurrencyForExport(purchase.pricePerKg),
      'Valor de Compra': formatCurrencyForExport(purchase.purchasePrice),
      'Custo de Frete': formatCurrencyForExport(purchase.additionalCosts.freight),
      'Custo de Sanidade': formatCurrencyForExport(purchase.additionalCosts.health),
      'Custo de Alimentação': formatCurrencyForExport(purchase.additionalCosts.feed),
      'Custo Operacional': formatCurrencyForExport(purchase.additionalCosts.operational),
      'Outros Custos': formatCurrencyForExport(purchase.additionalCosts.others),
      'Custo Total': formatCurrencyForExport(purchase.totalCost),
      'Status': getStatusLabel(purchase.status),
      'Observações': purchase.notes || ''
    }));

    const result = exportToExcel(exportData, 'compras-gado', 'Compras');

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleExportPDF = async () => {
    if (filteredPurchases.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const reportData = {
      title: 'Relatório de Compras de Gado',
      subtitle: `Total de ${filteredPurchases.length} compra(s) | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      data: filteredPurchases.map(purchase => ({
        lote: purchase.lotCode,
        fornecedor: purchase.vendorName,
        data: formatDateForExport(purchase.purchaseDate),
        qtd: purchase.currentQuantity.toString(),
        peso: `${purchase.totalWeight.toLocaleString('pt-BR')} kg`,
        arroba: formatCurrencyForExport(purchase.pricePerArroba),
        total: formatCurrencyForExport(purchase.totalCost),
        status: getStatusLabel(purchase.status)
      })),
      columns: [
        { key: 'lote', label: 'Lote', width: 30 },
        { key: 'fornecedor', label: 'Fornecedor', width: 50 },
        { key: 'data', label: 'Data', width: 30 },
        { key: 'qtd', label: 'Qtd', width: 20 },
        { key: 'peso', label: 'Peso', width: 30 },
        { key: 'arroba', label: 'R$/@', width: 30 },
        { key: 'total', label: 'Total', width: 35 },
        { key: 'status', label: 'Status', width: 25 }
      ],
      summary: {
        'Total de Lotes': filteredPurchases.length,
        'Total de Animais': metrics.totalAnimals.toLocaleString('pt-BR'),
        'Peso Total': `${metrics.totalWeight.toLocaleString('pt-BR')} kg`,
        'Investimento Total': formatCurrencyForExport(metrics.totalInvestment),
        'Preço Médio/@': formatCurrencyForExport(metrics.averagePricePerArroba)
      }
    };

    const result = await generateReportPDF(reportData, {
      filename: `compras-gado-${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`,
      format: 'a4',
      orientation: 'landscape'
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const getStatusLabel = (status: PurchaseData['status']): string => {
    const labels = {
      PENDING: 'Pendente',
      RECEIVED: 'Recebido',
      ACTIVE: 'Ativo',
      SOLD: 'Vendido',
      CANCELLED: 'Cancelado'
    };
    return labels[status] || status;
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filtros
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    
    // TODO: Implementar filtro de data
    const matchesDate = true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Métricas
  const metrics = {
    total: purchases.length,
    totalAnimals: purchases.reduce((sum, p) => sum + (p.entryQuantity || p.currentQuantity), 0),
    totalWeight: purchases.reduce((sum, p) => sum + (p.entryWeight || p.totalWeight), 0),
    totalInvestment: purchases.reduce((sum, p) => sum + p.totalCost, 0),
    active: purchases.filter(p => p.status === 'ACTIVE').length,
    pending: purchases.filter(p => p.status === 'PENDING').length,
    // Contagem por gênero (simulado - dados ainda não vêm do backend)
    maleCount: Math.ceil(purchases.length * 0.6), // Aproximadamente 60% machos
    femaleCount: Math.floor(purchases.length * 0.4), // Aproximadamente 40% fêmeas
    // Preço médio por arroba
    averagePricePerArroba: purchases.length > 0 
      ? purchases.reduce((sum, p) => sum + (p.pricePerArroba || 0), 0) / purchases.length
      : 0,
    // Média ponderada do rendimento de carcaça
    averageCarcassYield: purchases.length > 0 
      ? purchases.reduce((sum, p) => sum + (p.carcassYield * (p.entryQuantity || p.currentQuantity)), 0) / 
        purchases.reduce((sum, p) => sum + (p.entryQuantity || p.currentQuantity), 0)
      : 50
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Total de Lotes</CardTitle>
            <Package className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.maleCount} Macho | {metrics.femaleCount} Fêmea
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Total de Animais</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{metrics.totalAnimals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalWeight.toLocaleString()} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Peso Médio/Animal</CardTitle>
            <Scale className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">
              {metrics.totalAnimals > 0 
                ? (metrics.totalWeight / metrics.totalAnimals).toFixed(0)
                : '0'} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalAnimals > 0 
                ? ((metrics.totalWeight / metrics.totalAnimals) / 30).toFixed(1)
                : '0'} @ por animal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Custo/@</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">
              {formatCurrency(metrics.averagePricePerArroba)}
            </div>
            <p className="text-xs text-muted-foreground">
              Preço médio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Arrobas Carcaça</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">
              {metrics.totalAnimals > 0 
                ? Math.round((metrics.totalWeight / 30) * (metrics.averageCarcassYield / 100)).toLocaleString()
                : '0'} @
            </div>
            <p className="text-xs text-muted-foreground">
              Rend. {metrics.averageCarcassYield.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

      </div>
      
      {/* Card de Investimento Separado */}
      <div className="grid grid-cols-1 max-w-sm">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium">Investimento Total</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold">{formatCurrency(metrics.totalInvestment)}</div>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(metrics.totalInvestment / (metrics.total || 1))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Gestão de Compras</CardTitle>
              <CardDescription className="text-sm">
                Gerencie todas as compras e lotes de gado
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-3 w-3" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="mr-2 h-3 w-3" />
                    Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Download className="mr-2 h-3 w-3" />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={() => {
                // Verificar se os dados necessários estão carregados
                if (partners.length === 0) {
                  toast.error('Aguarde o carregamento dos parceiros para criar uma nova compra');
                  return;
                }

                setShowForm(true);
              }}>
                <Plus className="mr-2 h-3 w-3" />
                Nova Compra
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por lote, ordem ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="RECEIVED">Recebido</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="SOLD">Vendido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Atualizar
            </Button>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-x-auto">
            <div className="min-w-[800px] md:min-w-0">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Lote / Ordem</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Compra</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Peso Total</TableHead>
                  <TableHead className="text-right">Peso Médio/Animal</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead className="text-right">Custo/@</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma compra encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map(purchase => (
                    <React.Fragment key={purchase.id}>
                      <TableRow 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => {
                          // Não abrir o modal se clicar no botão de expandir ou ações
                          if (!(e.target as HTMLElement).closest('button')) {
                            setSelectedPurchaseDetails(purchase);
                            setShowDetailsModal(true);
                          }
                        }}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(purchase.id);
                            }}
                          >
                            {expandedRows.has(purchase.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{purchase.lotNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {purchase.lotCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{purchase.vendorName}</TableCell>
                        <TableCell>
                          {format(purchase.purchaseDate, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <div className="font-medium">{purchase.currentQuantity}</div>
                            {purchase.entryQuantity !== purchase.currentQuantity && (
                              <div className="text-sm text-muted-foreground">
                                Entrada: {purchase.entryQuantity}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {(purchase.totalWeight / 1000).toFixed(2)} ton
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {purchase.totalWeight.toLocaleString()} kg
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {purchase.averageWeight.toFixed(1)} kg vivo
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(purchase.averageWeight / 30).toFixed(1)} @ peso vivo
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(purchase.totalCost)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(purchase.purchasePrice)} compra
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(purchase.pricePerArroba)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(purchase.pricePerKg)}/kg
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  setShowForm(true);
                                }}
                              >
                                <Eye className="mr-2 h-3 w-3" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPurchase(purchase);
                                  setShowForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-3 w-3" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setPurchaseToDelete(purchase.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      {/* Linha Expandida com Detalhes */}
                      {expandedRows.has(purchase.id) && (
                        <TableRow>
                          <TableCell colSpan={11} className="bg-muted/30">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Data de Entrada
                                  </div>
                                  <div className="text-sm">
                                    {purchase.entryDate 
                                      ? format(purchase.entryDate, 'dd/MM/yyyy', { locale: ptBR })
                                      : 'Não recebido'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Frete
                                  </div>
                                  <div className="text-sm">
                                    {formatCurrency(purchase.additionalCosts.freight)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Sanidade
                                  </div>
                                  <div className="text-sm">
                                    {formatCurrency(purchase.additionalCosts.health)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Alimentação
                                  </div>
                                  <div className="text-sm">
                                    {formatCurrency(purchase.additionalCosts.feed)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Comissão
                                  </div>
                                  <div className="text-sm">
                                    {formatCurrency(purchase.additionalCosts.operational)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Outros Custos
                                  </div>
                                  <div className="text-sm">
                                    {formatCurrency(purchase.additionalCosts.others)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Custos Adicionais Total
                                  </div>
                                  <div className="text-sm font-medium">
                                    {formatCurrency(
                                      Object.values(purchase.additionalCosts).reduce((a, b) => a + b, 0)
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {purchase.notes && (
                                <div>
                                  <div className="text-sm font-medium text-muted-foreground mb-1">
                                    Observações
                                  </div>
                                  <div className="text-sm bg-background p-3 rounded">
                                    {purchase.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {showForm && (
        <EnhancedPurchaseForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedPurchase(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedPurchase(null);
            loadData();
          }}

        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPurchaseToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedPurchaseDetails && (
        <PurchaseDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPurchaseDetails(null);
          }}
          data={selectedPurchaseDetails}
          onEdit={() => {
            setShowDetailsModal(false);
            setSelectedPurchase(selectedPurchaseDetails);
            setShowForm(true);
          }}
          onDelete={() => {
            setShowDetailsModal(false);
            setPurchaseToDelete(selectedPurchaseDetails.id);
            setShowDeleteDialog(true);
          }}
        />
      )}
    </div>
  );
};
