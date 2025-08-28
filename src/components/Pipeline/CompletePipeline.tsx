import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText, 
  CreditCard, 
  Truck, 
  CheckCircle,
  Calendar,
  MapPin,
  User,
  Building2,
  DollarSign,
  Package,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Beef
} from 'lucide-react';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Hooks e serviços
import { usePartners } from '@/hooks/useSupabaseData';
import { usePurchaseOrdersApi } from '@/hooks/api/usePurchaseOrdersApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes de formulário
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';

// Tipos
interface PurchaseOrderStage {
  id: string;
  title: string;
  color: string;
  icon: React.ElementType;
  description: string;
}

const stages: PurchaseOrderStage[] = [
  { 
    id: 'PENDING', 
    title: 'Ordem de Compra', 
    color: 'status-pending', 
    icon: FileText,
    description: 'Ordens criadas aguardando validação'
  },
  { 
    id: 'PAYMENT_VALIDATING', 
    title: 'Validação de Pagamento', 
    color: 'status-warning', 
    icon: CreditCard,
    description: 'Validando condições de pagamento'
  },
  { 
    id: 'RECEPTION', 
    title: 'Recepção', 
    color: 'status-info', 
    icon: Truck,
    description: 'Animais em processo de recepção'
  },
  { 
    id: 'CONFINED', 
    title: 'Confinado', 
    color: 'status-active', 
    icon: CheckCircle,
    description: 'Animais confinados com sucesso'
  },
];

export const CompletePipeline: React.FC = () => {
  // Hooks integrados com API Backend
  const { purchaseOrders, loading: ordersLoading, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrdersApi();
  const { partners, loading: partnersLoading } = usePartners();

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Filtrar ordens baseado na busca e status
  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    
    return purchaseOrders.filter(order => {
      // Filtro por status
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false;
      }
      
      // Filtro por termo de busca
      if (searchTerm === '') return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Buscar por número da ordem
      if (order.orderNumber?.toLowerCase().includes(searchLower)) return true;
      
      // Buscar por localização
      if (order.location?.toLowerCase().includes(searchLower)) return true;
      
      // Buscar por nome do vendedor
      const vendor = partners.find(p => p.id === order.vendorId);
      if (vendor && vendor.name.toLowerCase().includes(searchLower)) return true;
      
      // Buscar por nome do corretor
      if (order.brokerId) {
        const broker = partners.find(p => p.id === order.brokerId);
        if (broker && broker.name.toLowerCase().includes(searchLower)) return true;
      }
      
      return false;
    });
  }, [purchaseOrders, partners, searchTerm, filterStatus]);

  // Agrupar ordens por estágio
  const ordersByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    stages.forEach(stage => {
      grouped[stage.id] = filteredOrders.filter(order => order.status === stage.id);
    });
    
    return grouped;
  }, [filteredOrders]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalOrders = purchaseOrders?.length || 0;
    const totalAnimals = purchaseOrders?.reduce((sum, order) => sum + (order.animalCount || 0), 0) || 0;
    const totalValue = purchaseOrders?.reduce((sum, order) => sum + (order.totalValue || 0), 0) || 0;
    const avgWeight = purchaseOrders?.length > 0 
      ? purchaseOrders.reduce((sum, order) => sum + (order.averageWeight || 0), 0) / purchaseOrders.length 
      : 0;

    return { totalOrders, totalAnimals, totalValue, avgWeight };
  }, [purchaseOrders]);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStageChange = async (orderId: string, newStage: string) => {
    try {
      await updatePurchaseOrder(orderId, { status: newStage });
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
    }
  };

  if (ordersLoading || partnersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando pipeline de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Pipeline de Compras</h1>
          <p className="page-subtitle">
            Gerencie o fluxo completo de aquisição de animais
          </p>
        </div>
        
        <Button 
          onClick={() => setShowOrderForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Ordem de Compra
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Total de Ordens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.totalOrders}</div>
            <p className="kpi-change">
              <TrendingUp className="h-3 w-3" />
              ordens ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Total de Animais</CardTitle>
            <Beef className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.totalAnimals.toLocaleString()}</div>
            <p className="kpi-change">
              <TrendingUp className="h-3 w-3" />
              animais no pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">R$ {(stats.totalValue / 1000).toFixed(0)}k</div>
            <p className="kpi-change">
              <TrendingUp className="h-3 w-3" />
              valor investido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Peso Médio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.avgWeight.toFixed(0)}kg</div>
            <p className="kpi-change">
              <TrendingUp className="h-3 w-3" />
              peso por animal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ordem, localização, vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {stages.map(stage => (
          <Card key={stage.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${stage.color}`}>
                    <stage.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{stage.title}</CardTitle>
                    <CardDescription className="text-xs">{stage.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {ordersByStage[stage.id]?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {ordersByStage[stage.id]?.map(order => (
                    <Card 
                      key={order.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOrderClick(order)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              #{order.orderNumber}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOrderClick(order)}>
                                  <Eye className="h-3 w-3 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {stages.map(nextStage => (
                                  nextStage.id !== stage.id && (
                                    <DropdownMenuItem 
                                      key={nextStage.id}
                                      onClick={() => handleStageChange(order.id, nextStage.id)}
                                    >
                                      <ArrowRight className="h-3 w-3 mr-2" />
                                      Mover para {nextStage.title}
                                    </DropdownMenuItem>
                                  )
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{order.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {partners.find(p => p.id === order.vendorId)?.name || 'Vendedor não encontrado'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>{order.animalCount} animais</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>R$ {(order.totalValue / 1000).toFixed(0)}k</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline" className="text-xs">
                              {order.animalType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(order.purchaseDate), 'dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {ordersByStage[stage.id]?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma ordem neste estágio</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Detalhes da Ordem */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Informações completas da ordem de compra
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Vendedor</Label>
                  <p className="text-sm text-muted-foreground">
                    {partners.find(p => p.id === selectedOrder.vendorId)?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Localização</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantidade</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.animalCount} animais</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Peso Total</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.totalWeight?.toLocaleString()} kg</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Total</Label>
                  <p className="text-sm text-muted-foreground">
                    R$ {selectedOrder.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Preço por Arroba</Label>
                  <p className="text-sm text-muted-foreground">
                    R$ {selectedOrder.pricePerArroba?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulário de Nova Ordem */}
      {showOrderForm && (
        <PurchaseOrderForm
          isOpen={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          onSubmit={(data) => {
            console.log('Nova ordem criada:', data);
            setShowOrderForm(false);
          }}
        />
      )}
    </div>
  );
};
