import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  Filter,
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  Weight,
  Users,
  MapPin,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Target,
  ShoppingCart,
  Building2,
  CreditCard,
  Receipt,
  X,
  Check,
  AlertTriangle,
  Info,
  Beef
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Sale {
  id: string;
  lotId: string;
  lotName: string;
  buyer: string;
  status: 'negotiation' | 'confirmed' | 'payment_pending' | 'preparing_shipment' | 'shipped' | 'delivered' | 'completed';
  currentQuantity: number;
  currentWeight: number;
  pricePerKg: number;
  totalValue: number;
  createdAt: Date;
  expectedDelivery: Date;
  notes?: string;
  paymentMethod?: 'cash' | 'transfer' | 'installments';
  installments?: number;
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
}

const salesStages = [
  { id: 'negotiation', name: 'Em Negociação', color: 'bg-yellow-500', icon: ShoppingCart },
  { id: 'confirmed', name: 'Confirmada', color: 'bg-blue-500', icon: CheckCircle },
  { id: 'payment_pending', name: 'Aguardando Pagamento', color: 'bg-orange-500', icon: CreditCard },
  { id: 'preparing_shipment', name: 'Preparando Embarque', color: 'bg-purple-500', icon: Package },
  { id: 'shipped', name: 'Embarcado', color: 'bg-indigo-500', icon: Truck },
  { id: 'delivered', name: 'Entregue', color: 'bg-green-500', icon: MapPin },
  { id: 'completed', name: 'Concluída', color: 'bg-gray-500', icon: CheckCircle }
];

// Importar hooks da nova arquitetura API
import { useSalesApi } from '@/hooks/api/useSalesApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';

export const ModernSalesPipeline: React.FC = () => {
  // Hooks da nova arquitetura API
  const { sales: apiSales, loading: salesLoading, createSale, updateSale, deleteSale } = useSalesApi();
  const { saleRecords } = useSaleRecordsApi();
  const { cattlePurchases } = useCattlePurchasesApi();
  const { partners } = usePartnersApi();

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'analytics'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNewSale, setShowNewSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Converter dados da API para o formato esperado pelo componente
  const sales: Sale[] = useMemo(() => {
    return apiSales.map(sale => ({
      id: sale.id,
      lotId: sale.lotId,
      lotName: `Lote ${sale.lotId.slice(-6)}`,
      buyer: partners.find(p => p.id === sale.buyerId)?.name || 'Comprador não encontrado',
      status: mapSaleStatus(sale.status),
      currentQuantity: 0, // TODO: Buscar do lote relacionado
      currentWeight: 0, // TODO: Buscar do lote relacionado  
      pricePerKg: (sale.pricePerArroba || 0) / 15, // Converter arroba para kg
      totalValue: sale.totalValue || 0,
      createdAt: new Date(sale.createdAt),
      expectedDelivery: new Date(sale.expectedDate),
      notes: sale.notes,
      paymentMethod: 'transfer' as const, // TODO: Mapear corretamente
      transport: sale.transportCompany ? {
        company: sale.transportCompany,
        driver: 'N/A',
        vehicle: 'N/A'
      } : undefined,
      slaughter: sale.slaughterDate ? {
        date: new Date(sale.slaughterDate),
        location: sale.slaughterPlant,
        yield: sale.carcassYield
      } : undefined
    }));
  }, [apiSales, partners]);

  // Função auxiliar para mapear status da API para o formato do componente
  const mapSaleStatus = (apiStatus: string): Sale['status'] => {
    const statusMap: Record<string, Sale['status']> = {
      'NEXT_SLAUGHTER': 'negotiation',
      'SCHEDULED': 'confirmed', 
      'SHIPPED': 'shipped',
      'SLAUGHTERED': 'delivered',
      'RECONCILED': 'completed',
      'CANCELLED': 'negotiation'
    };
    return statusMap[apiStatus] || 'negotiation';
  };

  // Dados agora vêm da API - dados mock removidos
  /*
  const [sales, setSales] = useState<Sale[]>([
    {
      id: '1',
      lotId: 'LOT001',
      lotName: 'Lote Nelore Premium',
      buyer: 'Frigorífico ABC',
      status: 'shipped',
      currentQuantity: 50,
      currentWeight: 25000,
      pricePerKg: 18.50,
      totalValue: 462500,
      createdAt: new Date(2024, 0, 10),
      expectedDelivery: new Date(2024, 0, 25),
      paymentMethod: 'transfer',
      transport: {
        company: 'Transportadora XYZ',
        driver: 'João Silva',
        vehicle: 'Caminhão Mercedes',
        tracking: 'TR123456'
      }
    },
    {
      id: '2',
      lotId: 'LOT002',
      lotName: 'Lote Angus Select',
      buyer: 'JBS',
      status: 'payment_pending',
      currentQuantity: 30,
      currentWeight: 15000,
      pricePerKg: 22.00,
      totalValue: 330000,
      createdAt: new Date(2024, 0, 15),
      expectedDelivery: new Date(2024, 0, 30),
      paymentMethod: 'installments',
      installments: 3
    },
    {
      id: '3',
      lotId: 'LOT003',
      lotName: 'Lote Misto A',
      buyer: 'Minerva Foods',
      status: 'negotiation',
      currentQuantity: 40,
      currentWeight: 20000,
      pricePerKg: 17.00,
      totalValue: 340000,
      createdAt: new Date(2024, 0, 20),
      expectedDelivery: new Date(2024, 1, 5),
      notes: 'Cliente solicitou desconto para pagamento à vista'
    },
    {
      id: '4',
      lotId: 'LOT004',
      lotName: 'Lote Premium B',
      buyer: 'Marfrig',
      status: 'confirmed',
      currentQuantity: 60,
      currentWeight: 30000,
      pricePerKg: 19.50,
      totalValue: 585000,
      createdAt: new Date(2024, 0, 18),
      expectedDelivery: new Date(2024, 1, 2),
      paymentMethod: 'cash'
    },
    {
      id: '5',
      lotId: 'LOT005',
      lotName: 'Lote Especial',
      buyer: 'Frigorífico Regional',
      status: 'preparing_shipment',
      currentQuantity: 25,
      currentWeight: 12500,
      pricePerKg: 20.00,
      totalValue: 250000,
      createdAt: new Date(2024, 0, 22),
      expectedDelivery: new Date(2024, 0, 28),
      paymentMethod: 'transfer'
    }
  ]);
  */

  // Dados para gráficos
  const salesByMonth = [
    { month: 'Jan', vendas: 8, valor: 1500000 },
    { month: 'Fev', vendas: 12, valor: 2200000 },
    { month: 'Mar', vendas: 10, valor: 1800000 },
    { month: 'Abr', vendas: 15, valor: 2800000 },
    { month: 'Mai', vendas: 18, valor: 3200000 },
    { month: 'Jun', vendas: 14, valor: 2600000 }
  ];

  const salesByBuyer = [
    { name: 'JBS', value: 35, color: '#10b981' },
    { name: 'Marfrig', value: 28, color: '#3b82f6' },
    { name: 'Minerva', value: 20, color: '#f59e0b' },
    { name: 'Frigoríficos', value: 17, color: '#8b5cf6' }
  ];

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar vendas
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.lotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.buyer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBuyer = selectedBuyer === 'all' || sale.buyer === selectedBuyer;
      const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
      
      return matchesSearch && matchesBuyer && matchesStatus;
    });
  }, [sales, searchTerm, selectedBuyer, selectedStatus]);

  // Agrupar vendas por status para kanban
  const salesByStatus = useMemo(() => {
    const grouped: Record<string, Sale[]> = {};
    salesStages.forEach(stage => {
      grouped[stage.id] = filteredSales.filter(sale => sale.status === stage.id);
    });
    return grouped;
  }, [filteredSales]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const avgPrice = filteredSales.reduce((sum, sale) => sum + sale.pricePerKg, 0) / filteredSales.length || 0;
    const totalWeight = filteredSales.reduce((sum, sale) => sum + sale.currentWeight, 0);
    const totalAnimals = filteredSales.reduce((sum, sale) => sum + sale.currentQuantity, 0);
    
    return {
      totalValue: total,
      avgPrice: avgPrice,
      totalWeight: totalWeight,
      totalAnimals: totalAnimals,
      salesCount: filteredSales.length
    };
  }, [filteredSales]);

    const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const activeSale = sales.find(s => s.id === active.id);
      if (activeSale && over.id) {
        // Mapear status do componente para status da API
        const apiStatus = mapComponentStatusToApi(over.id);
        await updateSale(active.id, { status: apiStatus });
      }
    }
  };

  // Função auxiliar para mapear status do componente para API
  const mapComponentStatusToApi = (componentStatus: string): string => {
    const statusMap: Record<string, string> = {
      'negotiation': 'NEXT_SLAUGHTER',
      'confirmed': 'SCHEDULED',
      'payment_pending': 'SCHEDULED',
      'preparing_shipment': 'SCHEDULED', 
      'shipped': 'SHIPPED',
      'delivered': 'SLAUGHTERED',
      'completed': 'RECONCILED'
    };
    return statusMap[componentStatus] || 'NEXT_SLAUGHTER';
  };

  const renderSaleCard = (sale: Sale) => (
    <Card 
      key={sale.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedSale(sale);
        setShowSaleDetails(true);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{sale.lotName}</CardTitle>
            <p className="text-xs text-muted-foreground">{sale.buyer}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {sale.currentQuantity} cabeças • {(sale.currentWeight / 1000).toFixed(1)}t
          </div>
          <Badge variant="outline" className="text-xs">
            R$ {sale.pricePerKg.toFixed(2)}/kg
          </Badge>
        </div>
        
        <div className="text-lg font-bold">
          R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {format(sale.expectedDelivery, 'dd/MM')}
          </div>
          {sale.paymentMethod && (
            <Badge variant="secondary" className="text-xs">
              {sale.paymentMethod === 'cash' ? 'À Vista' :
               sale.paymentMethod === 'transfer' ? 'Transferência' : 
               `${sale.installments}x`}
            </Badge>
          )}
        </div>
        
        {sale.transport?.tracking && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Truck className="h-3 w-3" />
            Rastreio: {sale.transport.tracking}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pipeline de Vendas</h1>
          <p className="page-subtitle">Gerencie e acompanhe suas vendas de gado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Venda</DialogTitle>
                <DialogDescription>Registre uma nova venda de lote</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o lote" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lot1">Lote Nelore Premium</SelectItem>
                        <SelectItem value="lot2">Lote Angus Select</SelectItem>
                        <SelectItem value="lot3">Lote Misto A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Comprador</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o comprador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jbs">JBS</SelectItem>
                        <SelectItem value="marfrig">Marfrig</SelectItem>
                        <SelectItem value="minerva">Minerva Foods</SelectItem>
                        <SelectItem value="frigorifico">Frigorífico Regional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade (cabeças)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Total (kg)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço por kg (R$)</Label>
                    <Input type="number" placeholder="0,00" step="0.01" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">À Vista</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="installments">Parcelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Entrega</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Informações de Transporte</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transportadora</Label>
                      <Input placeholder="Nome da transportadora" />
                    </div>
                    <div className="space-y-2">
                      <Label>Motorista</Label>
                      <Input placeholder="Nome do motorista" />
                    </div>
                    <div className="space-y-2">
                      <Label>Veículo</Label>
                      <Input placeholder="Placa ou descrição" />
                    </div>
                    <div className="space-y-2">
                      <Label>Código de Rastreio</Label>
                      <Input placeholder="Opcional" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea placeholder="Observações sobre a venda" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSale(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowNewSale(false)}>
                  Criar Venda
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Total em Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.salesCount} vendas ativas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Preço Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              R$ {stats.avgPrice.toFixed(2)}/kg
            </div>
            <p className="text-xs text-muted-foreground">
              +8% vs mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Total de Animais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.totalAnimals}</div>
            <p className="text-xs text-muted-foreground">
              cabeças vendidas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Peso Total</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              {(stats.totalWeight / 1000).toFixed(1)}t
            </div>
            <p className="text-xs text-muted-foreground">
              peso total vendido
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              negociações fechadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os compradores</SelectItem>
                <SelectItem value="JBS">JBS</SelectItem>
                <SelectItem value="Marfrig">Marfrig</SelectItem>
                <SelectItem value="Minerva Foods">Minerva Foods</SelectItem>
                <SelectItem value="Frigorífico Regional">Frigorífico Regional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {salesStages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Tabela
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('analytics')}
              >
                Análises
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizações */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {salesStages.map(stage => {
              const Icon = stage.icon;
              const stageSales = salesByStatus[stage.id] || [];
              
              return (
                <div key={stage.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">{stage.name}</h3>
                    </div>
                    <Badge variant="secondary">{stageSales.length}</Badge>
                  </div>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3 pr-3">
                      {stageSales.map(sale => renderSaleCard(sale))}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Preço/kg</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const stage = salesStages.find(s => s.id === sale.status);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.lotName}</TableCell>
                      <TableCell>{sale.buyer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <div className={cn("w-2 h-2 rounded-full", stage?.color)} />
                          {stage?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.currentQuantity} cab</TableCell>
                      <TableCell>{(sale.currentWeight / 1000).toFixed(1)}t</TableCell>
                      <TableCell>R$ {sale.pricePerKg.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(sale.expectedDelivery, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {sale.paymentMethod === 'cash' ? 'À Vista' :
                         sale.paymentMethod === 'transfer' ? 'Transferência' : 
                         `${sale.installments}x`}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowSaleDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {viewMode === 'analytics' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Mês</CardTitle>
              <CardDescription>Volume de vendas e valores dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="vendas" stroke="#10b981" name="Quantidade" />
                  <Line yAxisId="right" type="monotone" dataKey="valor" stroke="#3b82f6" name="Valor (R$)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendas por Comprador</CardTitle>
              <CardDescription>Distribuição percentual de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByBuyer}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByBuyer.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance de Vendas</CardTitle>
              <CardDescription>Indicadores chave do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo médio de ciclo</span>
                  <span className="font-medium">12 dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de conversão</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ticket médio</span>
                  <span className="font-medium">R$ 385.000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prazo médio pagamento</span>
                  <span className="font-medium">15 dias</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inadimplência</span>
                  <span className="font-medium text-green-600">2.1%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previsão de Recebimentos</CardTitle>
              <CardDescription>Valores a receber nos próximos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Próximos 7 dias</span>
                    <span className="text-sm text-muted-foreground">R$ 462.500</span>
                  </div>
                  <Progress value={35} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">8-15 dias</span>
                    <span className="text-sm text-muted-foreground">R$ 330.000</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">16-30 dias</span>
                    <span className="text-sm text-muted-foreground">R$ 585.000</span>
                  </div>
                  <Progress value={45} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes da Venda */}
      <Dialog open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-3">Informações da Venda</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lote:</span>
                      <span className="font-medium">{selectedSale.lotName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comprador:</span>
                      <span className="font-medium">{selectedSale.buyer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">
                        {salesStages.find(s => s.id === selectedSale.status)?.name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data da Venda:</span>
                      <span>{format(selectedSale.createdAt, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Valores</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantidade:</span>
                      <span className="font-medium">{selectedSale.currentQuantity} cabeças</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso Total:</span>
                      <span className="font-medium">{(selectedSale.currentWeight / 1000).toFixed(1)} toneladas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço/kg:</span>
                      <span className="font-medium">R$ {selectedSale.pricePerKg.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>Valor Total:</span>
                      <span className="text-green-600">
                        R$ {selectedSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSale.transport && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">Informações de Transporte</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transportadora:</span>
                        <span>{selectedSale.transport.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Motorista:</span>
                        <span>{selectedSale.transport.driver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Veículo:</span>
                        <span>{selectedSale.transport.vehicle}</span>
                      </div>
                      {selectedSale.transport.tracking && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rastreamento:</span>
                          <span className="text-blue-600">{selectedSale.transport.tracking}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedSale.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">Observações</h3>
                    <p className="text-sm text-muted-foreground">{selectedSale.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaleDetails(false)}>
              Fechar
            </Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};