import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Weight,
  Users,
  MapPin,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  CreditCard,
  Building2,
  Receipt,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Target,
  Activity,
  Zap,
  AlertTriangle,
  Info,
  Beef,
  Calculator,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Star,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Hooks
import { useCattleLotsApi } from '@/hooks/api/useCattleLotsApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';

// Tipos
interface Sale {
  id: string;
  lotId: string;
  lotNumber: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  totalValue: number;
  stage: 'negotiation' | 'confirmed' | 'payment_pending' | 'preparing_shipment' | 'shipped' | 'delivered' | 'completed';
  saleDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentDue?: Date;
  transport?: {
    company: string;
    driver: string;
    vehicle: string;
    tracking?: string;
  };
  slaughter?: {
    date?: Date;
    location?: string;
    yield?: number;
  };
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SalesStage {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<any>;
  description: string;
}

// Estágios do pipeline de vendas
const salesStages: SalesStage[] = [
  { 
    id: 'negotiation', 
    name: 'Em Negociação', 
    color: 'bg-yellow-500', 
    icon: ShoppingCart,
    description: 'Negociando preços e condições'
  },
  { 
    id: 'confirmed', 
    name: 'Confirmada', 
    color: 'bg-blue-500', 
    icon: CheckCircle,
    description: 'Venda confirmada, aguardando próximos passos'
  },
  { 
    id: 'payment_pending', 
    name: 'Aguardando Pagamento', 
    color: 'bg-orange-500', 
    icon: CreditCard,
    description: 'Aguardando confirmação do pagamento'
  },
  { 
    id: 'preparing_shipment', 
    name: 'Preparando Embarque', 
    color: 'bg-purple-500', 
    icon: Package,
    description: 'Preparando animais para embarque'
  },
  { 
    id: 'shipped', 
    name: 'Embarcado', 
    color: 'bg-indigo-500', 
    icon: Truck,
    description: 'Animais em transporte'
  },
  { 
    id: 'delivered', 
    name: 'Entregue', 
    color: 'bg-green-500', 
    icon: MapPin,
    description: 'Entregue no destino'
  },
  { 
    id: 'completed', 
    name: 'Concluída', 
    color: 'bg-gray-500', 
    icon: Star,
    description: 'Venda totalmente concluída'
  }
];

// Dados reais do Supabase via hook useSaleRecords

// Componente de Card de Venda
const SaleCard: React.FC<{ 
  sale: Sale; 
  onEdit: (sale: Sale) => void; 
  onView: (sale: Sale) => void; 
  onDelete: (id: string) => void;
  onMoveStage: (saleId: string, newStage: string) => void;
}> = ({ sale, onEdit, onView, onDelete, onMoveStage }) => {
  const stage = salesStages.find(s => s.id === sale.stage);
  const StageIcon = stage?.icon || ShoppingCart;
  
  const daysUntilDelivery = sale.expectedDelivery 
    ? differenceInDays(sale.expectedDelivery, new Date())
    : null;
  
  const isOverdue = sale.paymentDue && new Date() > sale.paymentDue && sale.paymentStatus !== 'paid';
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'status-active';
      case 'partial': return 'status-pending';
      case 'pending': return 'status-error';
      default: return 'status-inactive';
    }
  };

  return (
    <Card className="hover-lift animate-scale-in group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="card-title flex items-center gap-2">
              <Beef className="h-4 w-4 icon-primary" />
              Lote {sale.lotNumber}
            </CardTitle>
            <CardDescription className="card-subtitle">
              {sale.buyerName} • {sale.quantity} animais
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${stage?.color} text-white`}>
              <StageIcon className="h-3 w-3 mr-1" />
              {stage?.name}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(sale)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(sale)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Mover para:</DropdownMenuLabel>
                {salesStages
                  .filter(s => s.id !== sale.stage)
                  .slice(0, 3)
                  .map((nextStage) => (
                    <DropdownMenuItem 
                      key={nextStage.id}
                      onClick={() => onMoveStage(sale.id, nextStage.id)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {nextStage.name}
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(sale.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Valor da venda */}
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="kpi-label">Valor Total</p>
          <p className="text-xl font-bold text-success">
            R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            R$ {sale.pricePerArroba.toFixed(2)} por arroba
          </p>
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Peso Total</p>
            <p className="font-medium">{(sale.totalWeight / 1000).toFixed(1)}t</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Pagamento</p>
            <Badge className={getPaymentStatusColor(sale.paymentStatus)} size="sm">
              {sale.paymentStatus}
            </Badge>
          </div>
        </div>

        {/* Alertas e informações importantes */}
        {isOverdue && (
          <Alert className="bg-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Pagamento em atraso desde {format(sale.paymentDue!, 'dd/MM/yyyy')}
            </AlertDescription>
          </Alert>
        )}

        {daysUntilDelivery !== null && daysUntilDelivery <= 3 && daysUntilDelivery >= 0 && (
          <Alert className="bg-warning">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Entrega prevista em {daysUntilDelivery} dia(s)
            </AlertDescription>
          </Alert>
        )}

        {/* Informações de transporte */}
        {sale.transport && (
          <div className="space-y-2 p-2 bg-muted/20 rounded">
            <div className="flex items-center gap-2 text-xs">
              <Truck className="h-3 w-3" />
              <span className="font-medium">{sale.transport.company}</span>
            </div>
            {sale.transport.tracking && (
              <div className="flex items-center gap-2 text-xs text-info">
                <Target className="h-3 w-3" />
                <span>Rastreio: {sale.transport.tracking}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Venda: {format(sale.saleDate, 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
          
          {sale.expectedDelivery && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Entrega: {format(sale.expectedDelivery, 'dd/MM/yy', { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Componente de Coluna Kanban
const KanbanColumn: React.FC<{
  stage: SalesStage;
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onView: (sale: Sale) => void;
  onDelete: (id: string) => void;
  onMoveStage: (saleId: string, newStage: string) => void;
}> = ({ stage, sales, onEdit, onView, onDelete, onMoveStage }) => {
  const StageIcon = stage.icon;
  const totalValue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  
  return (
    <div className="flex flex-col min-h-[600px] w-80 bg-muted/30 rounded-lg p-3">
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${stage.color} rounded-lg text-white`}>
            <StageIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{stage.name}</h3>
            <p className="text-xs text-muted-foreground">{stage.description}</p>
          </div>
        </div>
        
        <Badge variant="secondary" className="text-xs">
          {sales.length}
        </Badge>
      </div>

      {/* Métricas da coluna */}
      {sales.length > 0 && (
        <div className="mb-4 p-2 bg-background/50 rounded border">
          <p className="text-xs text-muted-foreground">Valor Total</p>
          <p className="font-medium text-sm">
            R$ {(totalValue / 1000).toFixed(0)}k
          </p>
        </div>
      )}

      {/* Lista de vendas */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {sales.map((sale) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onMoveStage={onMoveStage}
            />
          ))}
          
          {sales.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center text-muted-foreground">
                <StageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma venda</p>
                <p className="text-xs">neste estágio</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Componente Principal
export const CompleteSales: React.FC = () => {
  const { cattleLots, loading: lotsLoading } = useCattleLotsApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { saleRecords, loading: salesLoading, error: salesError, createSaleRecord, updateSaleRecord, deleteSaleRecord } = useSaleRecordsApi();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [showNewSale, setShowNewSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);
  
  // Converter SaleRecord para Sale
  const sales: Sale[] = useMemo(() => {
    return saleRecords.map(record => ({
      id: record.id,
      lotId: record.lotId,
      lotNumber: `Lote ${record.lotId.slice(-3)}`, // Simplificado
      buyerId: record.slaughterhouseId,
      buyerName: 'Frigorífico', // Simplificado - deveria buscar do cadastro
      quantity: record.quantity,
      totalWeight: record.totalWeight,
      pricePerArroba: record.pricePerArroba,
      totalValue: record.grossRevenue,
      stage: 'completed' as const, // SaleRecord já são vendas concluídas
      saleDate: record.saleDate,
      paymentStatus: record.paymentDate ? 'paid' as const : 'pending' as const,
      paymentDue: record.paymentDate,
      notes: record.observations,
      createdAt: record.createdAt,
      updatedAt: record.createdAt // SaleRecord não tem updatedAt
    }));
  }, [saleRecords]);

  // Dados filtrados
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBuyer = selectedBuyer === 'all' || sale.buyerId === selectedBuyer;
      const matchesStage = selectedStage === 'all' || sale.stage === selectedStage;
      const matchesPayment = selectedPaymentStatus === 'all' || sale.paymentStatus === selectedPaymentStatus;
      
      return matchesSearch && matchesBuyer && matchesStage && matchesPayment;
    });
  }, [sales, searchTerm, selectedBuyer, selectedStage, selectedPaymentStatus]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalAnimals = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const averagePrice = sales.length > 0 
      ? sales.reduce((sum, sale) => sum + sale.pricePerArroba, 0) / sales.length 
      : 0;
    
    const activeSales = sales.filter(sale => !['completed', 'cancelled'].includes(sale.stage)).length;
    const completedSales = sales.filter(sale => sale.stage === 'completed').length;
    const pendingPayments = sales.filter(sale => sale.paymentStatus === 'pending').length;
    const conversionRate = totalSales > 0 ? (completedSales / totalSales) * 100 : 0;

    return {
      totalSales,
      totalValue,
      totalAnimals,
      averagePrice,
      activeSales,
      completedSales,
      pendingPayments,
      conversionRate
    };
  }, [sales]);

  // Agrupar vendas por estágio
  const salesByStage = useMemo(() => {
    const grouped: { [key: string]: Sale[] } = {};
    salesStages.forEach(stage => {
      grouped[stage.id] = filteredSales.filter(sale => sale.stage === stage.id);
    });
    return grouped;
  }, [filteredSales]);

  const handleSaleView = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetail(true);
  };

  const handleSaleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setShowNewSale(true);
  };

  const handleSaleDelete = (saleId: string) => {
    setSales(prev => prev.filter(sale => sale.id !== saleId));
  };

  const handleMoveStage = (saleId: string, newStage: string) => {
    setSales(prev => prev.map(sale => 
      sale.id === saleId 
        ? { ...sale, stage: newStage as any, updatedAt: new Date() }
        : sale
    ));
  };

  const isLoading = lotsLoading || partnersLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Carregando vendas...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Pipeline de Vendas</h1>
            <p className="page-subtitle">
              Gerencie todo o processo de vendas do gado, desde a negociação até a entrega
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setShowNewSale(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Total Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 icon-primary" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.totalSales}</div>
              <p className="kpi-variation text-success">
                {metrics.activeSales} ativas
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-success">
                R$ {(metrics.totalValue / 1000000).toFixed(1)}M
              </div>
              <p className="kpi-variation text-success">
                Faturamento total
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Animais</CardTitle>
              <Beef className="h-4 w-4 icon-info" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.totalAnimals}</div>
              <p className="kpi-variation text-muted-foreground">
                Total vendido
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Preço Médio</CardTitle>
              <Calculator className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">
                R$ {metrics.averagePrice.toFixed(0)}
              </div>
              <p className="kpi-variation text-muted-foreground">
                Por arroba
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-success">{metrics.completedSales}</div>
              <p className="kpi-variation text-success">
                Finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Pendentes</CardTitle>
              <Clock className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-warning">{metrics.pendingPayments}</div>
              <p className="kpi-variation text-muted-foreground">
                Pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Conversão</CardTitle>
              <Target className="h-4 w-4 icon-info" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.conversionRate.toFixed(1)}%</div>
              <p className="kpi-variation text-success">
                Taxa de sucesso
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Status</CardTitle>
              <Zap className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-success">Ativo</div>
              <p className="kpi-variation text-success">
                Pipeline saudável
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="card-title">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por lote ou comprador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Comprador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Compradores</SelectItem>
                  <SelectItem value="buyer-001">Frigorífico JBS</SelectItem>
                  <SelectItem value="buyer-002">Marfrig Global</SelectItem>
                  <SelectItem value="buyer-003">Minerva Foods</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Estágios</SelectItem>
                  {salesStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Visualização */}
        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pipeline Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lista de Vendas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cronograma
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Kanban */}
          <TabsContent value="kanban" className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {salesStages.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  sales={salesByStage[stage.id] || []}
                  onEdit={handleSaleEdit}
                  onView={handleSaleView}
                  onDelete={handleSaleDelete}
                  onMoveStage={handleMoveStage}
                />
              ))}
            </div>
          </TabsContent>

          {/* Lista de Vendas */}
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="card-title">Lista Completa de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header">Lote</TableHead>
                      <TableHead className="table-header">Comprador</TableHead>
                      <TableHead className="table-header">Quantidade</TableHead>
                      <TableHead className="table-header">Valor</TableHead>
                      <TableHead className="table-header">Estágio</TableHead>
                      <TableHead className="table-header">Pagamento</TableHead>
                      <TableHead className="table-header">Entrega</TableHead>
                      <TableHead className="table-header">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const stage = salesStages.find(s => s.id === sale.stage);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="table-cell-important">
                            Lote {sale.lotNumber}
                          </TableCell>
                          <TableCell className="table-cell">
                            {sale.buyerName}
                          </TableCell>
                          <TableCell className="table-cell">
                            {sale.quantity} animais
                          </TableCell>
                          <TableCell className="table-cell">
                            R$ {(sale.totalValue / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stage?.color} text-white`}>
                              {stage?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${sale.paymentStatus === 'paid' ? 'status-active' : sale.paymentStatus === 'partial' ? 'status-pending' : 'status-error'}`}>
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="table-cell">
                            {sale.expectedDelivery 
                              ? format(sale.expectedDelivery, 'dd/MM/yy')
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSaleView(sale)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSaleEdit(sale)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSaleDelete(sale.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Análise de Vendas
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cronograma */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Cronograma de Entregas
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};
