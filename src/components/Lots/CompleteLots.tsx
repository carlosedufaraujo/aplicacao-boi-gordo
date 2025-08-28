import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar,
  MapPin,
  Weight,
  Heart,
  DollarSign,
  TrendingUp,
  Clock,
  Edit,
  Eye,
  Trash2,
  FileText,
  Download,
  ChevronRight,
  Activity,
  Beef,
  Calculator,
  Map,
  List,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Home,
  Layers,
  Grid3X3,
  Table as TableIcon,
  PieChart,
  Target,
  Zap,
  ExternalLink,
  Wifi
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Stores e hooks
import { useCattleLots, usePurchaseOrders, usePartners, usePens } from '@/hooks/useSupabaseData';
import { useRealtimePenOccupancy } from '@/hooks/useRealtimePenOccupancy';

// Novos componentes
import { PenOccupancyIndicators, OccupancyStats } from './PenOccupancyIndicators';
import { PenOccupancyHistory } from './PenOccupancyHistory';

// Funções utilitárias
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'status-active';
    case 'SOLD': return 'status-inactive';
    case 'PENDING': return 'status-pending';
    default: return 'status-inactive';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACTIVE': return <CheckCircle className="h-3 w-3" />;
    case 'SOLD': return <DollarSign className="h-3 w-3" />;
    case 'PENDING': return <Clock className="h-3 w-3" />;
    default: return <XCircle className="h-3 w-3" />;
  }
};

// Função para formatar datas de forma segura
const formatSafeDate = (date: Date | string | null | undefined, formatStr: string = 'dd/MM/yy'): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return 'Data inválida';
  }
};

// Função para calcular diferença de dias de forma segura
const safeDifferenceInDays = (endDate: Date, startDate: Date | string | null | undefined): number => {
  if (!startDate) return 0;
  
  try {
    const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
    if (isNaN(startDateObj.getTime())) return 0;
    return differenceInDays(endDate, startDateObj);
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error, startDate);
    return 0;
  }
};

// Tipos
interface CattleLot {
  id: string;
  lotNumber: string;
  purchaseOrderId: string;
  initialQuantity: number;
  currentQuantity: number;
  deaths: number;
  sales: number;
  averageWeight: number;
  totalCost: number;
  costPerHead: number;
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  entryDate: Date;
  projectedSaleDate?: Date;
  penId?: string;
  notes?: string;
  breed?: string;
  origin?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PenMapData {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  lots: CattleLot[];
  status: 'available' | 'occupied' | 'maintenance';
}

// Componente de Card de Lote


// Componente de Mapa de Currais
const PenMapView: React.FC<{ pens: PenMapData[] }> = ({ pens }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pens.map((pen) => {
          const occupancyRate = (pen.currentOccupancy / pen.capacity) * 100;
          const getBadgeVariant = () => {
            if (pen.status === 'available') return 'outline';
            if (pen.status === 'occupied') return 'secondary';
            return 'destructive';
          };
          
          return (
            <Card key={pen.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="card-title flex items-center gap-2">
                    <MapPin className="h-4 w-4 icon-primary" />
                    {pen.name}
                  </CardTitle>
                  <Badge variant={getBadgeVariant()} className="text-caption">
                    {pen.status === 'available' ? 'Disponível' : 
                     pen.status === 'occupied' ? 'Ocupado' : 'Lotado'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">Ocupação</span>
                    <span className="text-body-sm font-medium">{pen.currentOccupancy}/{pen.capacity}</span>
                  </div>
                  <Progress value={occupancyRate} className="h-2" />
                  <p className="text-caption text-muted-foreground">
                    {occupancyRate.toFixed(0)}% da capacidade
                  </p>
                </div>
                
                {pen.lots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-caption font-medium">Lotes Ativos:</p>
                    <div className="flex flex-wrap gap-1">
                      {pen.lots.slice(0, 3).map((lot) => (
                        <Badge key={lot.id} variant="outline" className="text-caption">
                          {lot.lotNumber}
                        </Badge>
                      ))}
                      {pen.lots.length > 3 && (
                        <Badge variant="outline" className="text-caption">
                          +{pen.lots.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Componente Principal
export const CompleteLots: React.FC = () => {
  const { cattleLots, loading: lotsLoading } = useCattleLots();
  const { purchaseOrders, loading: ordersLoading } = usePurchaseOrders();
  const { partners } = usePartners();
  const { pens } = usePens();
  const { 
    occupancyData, 
    loading: occupancyLoading, 
    isConnected, 
    getOccupancyStats 
  } = useRealtimePenOccupancy();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [penFilter, setPenFilter] = useState<string>('all');
  const [selectedLot, setSelectedLot] = useState<CattleLot | null>(null);
  const [showLotDetail, setShowLotDetail] = useState(false);
  const [showLotEdit, setShowLotEdit] = useState(false);

  // Dados processados
  const processedLots = useMemo(() => {
    return cattleLots.map(lot => {
      const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
      const partner = partners.find(p => p.id === order?.partnerId);
      
      return {
        ...lot,
        partnerName: partner?.name || 'N/A',
        orderDate: order?.orderDate || lot.createdAt,
        breed: order?.breed || 'Não informado',
        origin: partner?.city || 'Não informado'
      };
    });
  }, [cattleLots, purchaseOrders, partners]);

  // Filtros aplicados
  const filteredLots = useMemo(() => {
    return processedLots.filter(lot => {
      const matchesSearch = lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lot.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lot.breed.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
      const matchesPen = penFilter === 'all' || lot.penId === penFilter;
      
      return matchesSearch && matchesStatus && matchesPen;
    });
  }, [processedLots, searchTerm, statusFilter, penFilter]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const activeLots = processedLots.filter(lot => lot.status === 'ACTIVE');
    const totalAnimals = activeLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
    const totalInvestment = activeLots.reduce((sum, lot) => sum + lot.totalCost, 0);
    const averageWeight = activeLots.length > 0 
      ? activeLots.reduce((sum, lot) => sum + lot.averageWeight, 0) / activeLots.length 
      : 0;
    const totalDeaths = activeLots.reduce((sum, lot) => sum + lot.deaths, 0);
    const mortalityRate = totalAnimals > 0 ? (totalDeaths / (totalAnimals + totalDeaths)) * 100 : 0;

    return {
      totalLots: activeLots.length,
      totalAnimals,
      totalInvestment,
      averageWeight,
      mortalityRate,
      pendingLots: processedLots.filter(lot => lot.status === 'PENDING').length,
      soldLots: processedLots.filter(lot => lot.status === 'SOLD').length
    };
  }, [processedLots]);

  // Dados do mapa de currais
  const penMapData: PenMapData[] = useMemo(() => {
    return pens.map(pen => {
      const penLots = processedLots.filter(lot => lot.penId === pen.id && lot.status === 'ACTIVE');
      const currentOccupancy = penLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
      
      return {
        id: pen.id,
        name: pen.penNumber,
        capacity: pen.capacity,
        currentOccupancy,
        lots: penLots,
        status: currentOccupancy === 0 ? 'available' : 
                currentOccupancy >= pen.capacity ? 'occupied' : 'occupied'
      };
    });
  }, [pens, processedLots]);

  const handleLotView = (lot: CattleLot) => {
    setSelectedLot(lot);
    setShowLotDetail(true);
  };

  const handleLotEdit = (lot: CattleLot) => {
    setSelectedLot(lot);
    setShowLotEdit(true);
  };

  const handleLotDelete = (lotId: string) => {
    // Implementar exclusão
    console.log('Excluir lote:', lotId);
  };

  const isLoading = lotsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Carregando lotes...</span>
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
            <h1 className="page-title">Gestão de Lotes e Currais</h1>
            <p className="page-subtitle">
              Controle completo dos lotes em confinamento e ocupação dos currais
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lote
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Lotes Ativos</CardTitle>
              <Package className="h-4 w-4 icon-primary" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.totalLots}</div>
              <p className="kpi-variation text-success">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +2 este mês
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Total Animais</CardTitle>
              <Beef className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.totalAnimals.toLocaleString()}</div>
              <p className="kpi-variation text-muted-foreground">
                Em confinamento
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Investimento</CardTitle>
              <DollarSign className="h-4 w-4 icon-info" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">R$ {(metrics.totalInvestment / 1000000).toFixed(1)}M</div>
              <p className="kpi-variation text-muted-foreground">
                Capital alocado
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Peso Médio</CardTitle>
              <Weight className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.averageWeight.toFixed(0)}kg</div>
              <p className="kpi-variation text-success">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +5kg/mês
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Mortalidade</CardTitle>
              <Heart className="h-4 w-4 icon-error" />
            </CardHeader>
            <CardContent>
              <div className={`kpi-value ${metrics.mortalityRate > 2 ? 'text-error' : 'text-success'}`}>
                {metrics.mortalityRate.toFixed(1)}%
              </div>
              <p className="kpi-variation text-muted-foreground">
                Taxa mensal
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Pendentes</CardTitle>
              <Clock className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.pendingLots}</div>
              <p className="kpi-variation text-muted-foreground">
                Aguardando entrada
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Vendidos</CardTitle>
              <CheckCircle className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{metrics.soldLots}</div>
              <p className="kpi-variation text-success">
                Este período
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
                    placeholder="Buscar por lote, fornecedor ou raça..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="SOLD">Vendido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={penFilter} onValueChange={setPenFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Curral" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Currais</SelectItem>
                  {pens.map((pen) => (
                    <SelectItem key={pen.id} value={pen.id}>
                      {pen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Visualização */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Tabela de Lotes
            </TabsTrigger>
            <TabsTrigger value="pens" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Tabela de Currais
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Mapa de Currais
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ocupação dos Currais */}
              <Card>
                <CardHeader>
                  <CardTitle className="card-title flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Ocupação dos Currais
                  </CardTitle>
                  <CardDescription>
                    Taxa de ocupação atual por curral
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {occupancyData.slice(0, 6).map((occupancy) => (
                      <div key={occupancy.penId} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-body-sm">Curral {occupancy.penNumber}</span>
                          <span className="text-body-sm font-medium">
                            {occupancy.currentOccupancy}/{occupancy.capacity} ({occupancy.occupancyRate.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={occupancy.occupancyRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status dos Currais */}
              <Card>
                <CardHeader>
                  <CardTitle className="card-title flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Status dos Currais
                  </CardTitle>
                  <CardDescription>
                    Distribuição atual dos currais por status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const stats = getOccupancyStats();
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-success rounded-full"></div>
                              <span className="text-body-sm">Disponíveis</span>
                            </div>
                            <span className="text-body-sm font-medium">{stats.available}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-warning rounded-full"></div>
                              <span className="text-body-sm">Ocupados Parcialmente</span>
                            </div>
                            <span className="text-body-sm font-medium">{stats.partial}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-error rounded-full"></div>
                              <span className="text-body-sm">Lotados</span>
                            </div>
                            <span className="text-body-sm font-medium">{stats.full}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-muted rounded-full"></div>
                              <span className="text-body-sm">Em Manutenção</span>
                            </div>
                            <span className="text-body-sm font-medium">{stats.maintenance}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo dos Currais */}
            <Card>
              <CardHeader>
                <CardTitle className="card-title flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Resumo dos Currais
                </CardTitle>
                <CardDescription>
                  Informações detalhadas sobre capacidade e ocupação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {occupancyData.map((occupancy) => {
                    const pen = pens.find(p => p.id === occupancy.penId);
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'available': return 'text-success';
                        case 'partial': return 'text-warning';
                        case 'full': return 'text-error';
                        case 'maintenance': return 'text-muted-foreground';
                        default: return 'text-muted-foreground';
                      }
                    };

                    const getStatusLabel = (status: string) => {
                      switch (status) {
                        case 'available': return 'Disponível';
                        case 'partial': return 'Ocupado Parcialmente';
                        case 'full': return 'Lotado';
                        case 'maintenance': return 'Em Manutenção';
                        default: return 'Desconhecido';
                      }
                    };

                    return (
                      <div key={occupancy.penId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Home className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium">Curral {occupancy.penNumber}</p>
                            <p className="text-caption text-muted-foreground">
                              {pen?.location || 'Localização não informada'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-body-sm font-medium">
                              {occupancy.currentOccupancy}/{occupancy.capacity}
                            </span>
                            <Badge variant="outline" className={`text-caption ${getStatusColor(occupancy.status)}`}>
                              {getStatusLabel(occupancy.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={occupancy.occupancyRate} 
                              className="h-1.5 w-20" 
                            />
                            <span className="text-caption text-muted-foreground">
                              {occupancy.occupancyRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Visualização em Tabela de Lotes */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle className="card-title flex items-center gap-2">
                  <Beef className="h-4 w-4" />
                  Lista Completa de Lotes
                </CardTitle>
                <CardDescription>
                  Todos os lotes adquiridos com informações detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header">Lote</TableHead>
                      <TableHead className="table-header">Status</TableHead>
                      <TableHead className="table-header">Animais</TableHead>
                      <TableHead className="table-header">Peso Médio</TableHead>
                      <TableHead className="table-header">Investimento</TableHead>
                      <TableHead className="table-header">Fornecedor</TableHead>
                      <TableHead className="table-header">Entrada</TableHead>
                      <TableHead className="table-header">Curral</TableHead>
                      <TableHead className="table-header">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLots.map((lot) => {
                      const pen = pens.find(p => p.id === lot.penId);
                      return (
                        <TableRow key={lot.id}>
                          <TableCell className="table-cell-important">
                            Lote {lot.lotNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              lot.status === 'ACTIVE' ? 'default' :
                              lot.status === 'PENDING' ? 'secondary' :
                              lot.status === 'SOLD' ? 'outline' : 'destructive'
                            } className="text-caption">
                              {lot.status === 'ACTIVE' ? 'Ativo' :
                               lot.status === 'PENDING' ? 'Pendente' :
                               lot.status === 'SOLD' ? 'Vendido' : lot.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="table-cell">
                            {lot.currentQuantity}/{lot.entryQuantity}
                          </TableCell>
                          <TableCell className="table-cell">
                            {lot.entryWeight ? `${lot.entryWeight}kg` : 'N/A'}
                          </TableCell>
                          <TableCell className="table-cell">
                            R$ {(lot.totalCost / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell className="table-cell">
                            {lot.partnerName}
                          </TableCell>
                          <TableCell className="table-cell">
                            {formatSafeDate(lot.entryDate)}
                          </TableCell>
                          <TableCell className="table-cell">
                            {pen ? `Curral ${pen.penNumber}` : 'Não alocado'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleLotView(lot)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLotEdit(lot)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleLotDelete(lot.id)} className="text-destructive">
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

          {/* Visualização em Tabela de Currais */}
          <TabsContent value="pens">
            <Card>
              <CardHeader>
                <CardTitle className="card-title flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Tabela de Currais e Ocupação
                </CardTitle>
                <CardDescription>
                  Informações detalhadas sobre todos os currais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header">Curral</TableHead>
                      <TableHead className="table-header">Status</TableHead>
                      <TableHead className="table-header">Ocupação</TableHead>
                      <TableHead className="table-header">Capacidade</TableHead>
                      <TableHead className="table-header">Taxa (%)</TableHead>
                      <TableHead className="table-header">Lotes Ativos</TableHead>
                      <TableHead className="table-header">Localização</TableHead>
                      <TableHead className="table-header">Última Atualização</TableHead>
                      <TableHead className="table-header">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {occupancyData.map((occupancy) => {
                      const pen = pens.find(p => p.id === occupancy.penId);
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'available':
                            return <Badge variant="outline" className="text-caption text-success">Disponível</Badge>;
                          case 'partial':
                            return <Badge variant="secondary" className="text-caption">Ocupado</Badge>;
                          case 'full':
                            return <Badge variant="destructive" className="text-caption">Lotado</Badge>;
                          case 'maintenance':
                            return <Badge variant="outline" className="text-caption text-muted-foreground">Manutenção</Badge>;
                          default:
                            return <Badge variant="outline" className="text-caption">Desconhecido</Badge>;
                        }
                      };

                      return (
                        <TableRow key={occupancy.penId}>
                          <TableCell className="table-cell-important">
                            Curral {occupancy.penNumber}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(occupancy.status)}
                          </TableCell>
                          <TableCell className="table-cell">
                            {occupancy.currentOccupancy}
                          </TableCell>
                          <TableCell className="table-cell">
                            {occupancy.capacity}
                          </TableCell>
                          <TableCell className="table-cell">
                            <div className="flex items-center gap-2">
                              <span>{occupancy.occupancyRate.toFixed(1)}%</span>
                              <Progress 
                                value={occupancy.occupancyRate} 
                                className="h-1.5 w-16" 
                              />
                            </div>
                          </TableCell>
                          <TableCell className="table-cell">
                            {occupancy.activeLots}
                          </TableCell>
                          <TableCell className="table-cell">
                            {pen?.location || 'N/A'}
                          </TableCell>
                          <TableCell className="table-cell">
                            {occupancy.lastUpdated.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  // Navegar para o curral específico no mapa
                                  const element = document.querySelector(`[data-pen-id="${occupancy.penId}"]`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}>
                                  <MapPin className="mr-2 h-4 w-4" />
                                  Ver no Mapa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  // Navegar para cadastros
                                  window.location.hash = '#/cadastros';
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Curral
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <BarChart3 className="mr-2 h-4 w-4" />
                                  Histórico
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

          {/* Mapa de Currais */}
          <TabsContent value="map" className="space-y-4">
            {/* Estatísticas de Ocupação em Tempo Real */}
            <OccupancyStats 
              stats={getOccupancyStats()} 
              isConnected={isConnected} 
            />

            {/* Mapa de Ocupação */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="card-title flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Mapa de Ocupação dos Currais
                      {isConnected && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          <Wifi className="h-3 w-3 mr-1" />
                          Tempo Real
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Visualização da ocupação atual de todos os currais
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.hash = '#/cadastros'}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gerenciar Currais
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grid de Indicadores de Ocupação */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {occupancyData.map((occupancy) => (
                    <PenOccupancyIndicators
                      key={occupancy.penId}
                      penNumber={occupancy.penNumber}
                      capacity={occupancy.capacity}
                      currentOccupancy={occupancy.currentOccupancy}
                      occupancyRate={occupancy.occupancyRate}
                      status={occupancy.status}
                      activeLots={occupancy.activeLots}
                      lastUpdated={occupancy.lastUpdated}
                      isConnected={isConnected}
                      variant="detailed"
                      className="cursor-pointer hover:scale-105 transition-transform"
                      data-pen-id={occupancy.penId}
                    />
                  ))}
                </div>

                {/* Mapa Visual Tradicional (Fallback) */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Visualização Compacta</h3>
                  <PenMapView pens={penMapData} />
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Ocupação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Análise Histórica
                </CardTitle>
                <CardDescription>
                  Histórico e tendências de ocupação dos currais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PenOccupancyHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};
