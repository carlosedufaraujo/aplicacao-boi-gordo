import React, { useState } from 'react';
import { Plus, FileText, CreditCard, Truck, CheckCircle, Search, Filter, MoreVertical, Calendar, MapPin, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCompactCurrency } from '@/utils/formatters';

// Componentes shadcn/ui
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Forms e hooks
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';
import { usePurchaseOrdersApi } from '@/hooks/api/usePurchaseOrdersApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { Portal } from '../Common/Portal';

const stages = [
  { 
    id: 'order', 
    title: 'Ordem de Compra', 
    color: 'bg-gray-100 dark:bg-gray-950', 
    borderColor: 'border-gray-200',
    icon: FileText,
    description: 'Ordens aguardando validação'
  },
  { 
    id: 'payment_validation', 
    title: 'Validação de Pagamento', 
    color: 'bg-yellow-50 dark:bg-yellow-950', 
    borderColor: 'border-yellow-200',
    icon: CreditCard,
    description: 'Aguardando confirmação de pagamento'
  },
  { 
    id: 'reception', 
    title: 'Recepção no Confinamento', 
    color: 'bg-blue-50 dark:bg-blue-950', 
    borderColor: 'border-blue-200',
    icon: Truck,
    description: 'Em trânsito para o confinamento'
  },
  { 
    id: 'confined', 
    title: 'Confinado', 
    color: 'bg-green-50 dark:bg-green-950', 
    borderColor: 'border-green-200',
    icon: CheckCircle,
    description: 'Animais recebidos e confinados'
  },
];

export const ModernPipeline: React.FC = () => {
  const { purchaseOrders, loading: ordersLoading, error: ordersError, updatePurchaseOrder } = usePurchaseOrders();
  const { partners, loading: partnersLoading } = usePartners();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filtrar ordens baseado na busca e status
  const getFilteredOrders = (stageId?: string) => {
    return purchaseOrders
      .filter(order => !stageId || order.status === stageId)
      .filter(order => {
        if (filterStatus !== 'all' && order.status !== filterStatus) {
          return false;
        }
        
        if (searchTerm === '') return true;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar por código da ordem
        if (order.code.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por cidade/estado
        if (order.city.toLowerCase().includes(searchLower)) return true;
        if (order.state.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por nome do vendedor
        const vendor = partners?.find(p => p.id === order.vendor_id);
        if (vendor && vendor.name.toLowerCase().includes(searchLower)) return true;
        
        // Buscar por nome do corretor
        if (order.broker_id) {
          const broker = partners?.find(p => p.id === order.broker_id);
          if (broker && broker.name.toLowerCase().includes(searchLower)) return true;
        }
        
        return false;
      });
  };

  // Calcular estatísticas
  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter(o => o.status === 'order').length,
    inProgress: purchaseOrders.filter(o => ['payment_validation', 'reception'].includes(o.status)).length,
    completed: purchaseOrders.filter(o => o.status === 'confined').length,
    totalValue: purchaseOrders.reduce((sum, o) => sum + o.totalValue, 0),
    totalAnimals: purchaseOrders.reduce((sum, o) => sum + o.animalCount, 0),
  };

  const handleMoveOrder = (orderId: string, newStage: string) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (order) {
      updatePurchaseOrder(orderId, { ...order, status: newStage });
    }
  };

  const OrderCard = ({ order }: { order: any }) => {
    const vendor = partners.find(p => p.id === order.vendorId);
    const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {order.code}
              </CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Visualizar detalhes</DropdownMenuItem>
                <DropdownMenuItem>Editar ordem</DropdownMenuItem>
                <DropdownMenuSeparator />
                {order.status !== 'confined' && (
                  <>
                    {stages.filter(s => s.id !== order.status).map(stage => (
                      <DropdownMenuItem 
                        key={stage.id}
                        onClick={() => handleMoveOrder(order.id, stage.id)}
                      >
                        Mover para {stage.title}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Informações do vendedor */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {vendor?.name.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{vendor?.name || 'Vendedor'}</p>
              {broker && (
                <p className="text-xs text-muted-foreground truncate">
                  Corretor: {broker.name}
                </p>
              )}
            </div>
          </div>

          {/* Localização */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {order.city}, {order.state}
            </span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{order.animalCount}</span>
              <span className="text-xs text-muted-foreground">animais</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {order.totalWeight.toLocaleString('pt-BR')} kg
              </span>
            </div>
          </div>

          {/* Valor */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Valor total</span>
            <Badge variant="secondary" className="font-semibold">
              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="page-title">Pipeline de Compras</h2>
            <p className="text-muted-foreground">
              Gerencie o fluxo de aquisição de novos lotes
            </p>
          </div>
          
          <Button onClick={() => setShowNewOrderForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ordem
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Ordens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confinados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Animais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value">{stats.totalAnimals.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="kpi-value">
                {formatCompactCurrency(stats.totalValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Filtros</span>
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  <TabsTrigger value="table">Tabela</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar ordens, cidades, vendedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
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

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <ScrollArea className="flex-1 w-full">
            <div className="flex gap-4 p-1 min-h-[600px]">
              {stages.map(stage => {
                const orders = getFilteredOrders(stage.id);
                const StageIcon = stage.icon;
                
                return (
                  <div key={stage.id} className="flex-1 min-w-[320px]">
                    <Card className={`h-full ${stage.color} ${stage.borderColor} border-2`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white dark:bg-gray-950 rounded-lg">
                              <StageIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{stage.title}</CardTitle>
                              <CardDescription className="text-xs">
                                {stage.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {orders.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-3">
                            {orders.map(order => (
                              <OrderCard key={order.id} order={order} />
                            ))}
                            {orders.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Nenhuma ordem nesta fase</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Código
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Vendedor
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Local
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Animais
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Valor
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Data
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {getFilteredOrders().map(order => {
                      const vendor = partners.find(p => p.id === order.vendorId);
                      const stage = stages.find(s => s.id === order.status);
                      
                      return (
                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">
                            {order.code}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant={
                              order.status === 'confined' ? 'success' :
                              order.status === 'order' ? 'secondary' :
                              'default'
                            }>
                              {stage?.title}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {vendor?.name.charAt(0) || 'V'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{vendor?.name || 'Vendedor'}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {order.city}, {order.state}
                          </td>
                          <td className="p-4 align-middle">
                            {order.animalCount}
                          </td>
                          <td className="p-4 align-middle font-medium">
                            R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 align-middle">
                            {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="p-4 align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  Cancelar ordem
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de nova ordem */}
        {showNewOrderForm && (
          <Portal>
            <PurchaseOrderForm
              isOpen={showNewOrderForm}
              onClose={() => setShowNewOrderForm(false)}
            />
          </Portal>
        )}
      </div>
    </TooltipProvider>
  );
};