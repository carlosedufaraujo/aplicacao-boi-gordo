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
  AlertTriangle,
  Clock,
  Beef
} from 'lucide-react';
import { formatCurrency, formatWeight } from '@/utils/formatters';
import { eventBus, EVENTS } from '@/utils/eventBus';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';

// Hooks e serviços
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePurchaseOrdersApi } from '@/hooks/api/usePurchaseOrdersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useCattleLotsApi } from '@/hooks/api/useCattleLotsApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes de formulário
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';
import { ReceptionForm } from './ReceptionForm';
import { PenAllocationModal } from './PenAllocationModal';

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
    id: 'order', 
    title: 'Ordem de Compra', 
    color: 'status-pending', 
    icon: FileText,
    description: 'Ordens criadas aguardando validação'
  },
  { 
    id: 'payment-validation', 
    title: 'Validação de Pagamento', 
    color: 'status-warning', 
    icon: CreditCard,
    description: 'Validando condições de pagamento'
  },
  { 
    id: 'reception', 
    title: 'Recepção', 
    color: 'status-info', 
    icon: Truck,
    description: 'Animais em processo de recepção'
  },
  { 
    id: 'confined', 
    title: 'Confinado', 
    color: 'status-active', 
    icon: CheckCircle,
    description: 'Animais confinados com sucesso'
  },
];

export const CompletePipeline: React.FC = () => {
  // Hooks integrados com API Backend
  const { purchaseOrders, loading: ordersLoading, createPurchaseOrder, updatePurchaseOrder, updateStage, deletePurchaseOrder, refresh: refreshOrders } = usePurchaseOrdersApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { payerAccounts, loading: payerAccountsLoading } = usePayerAccountsApi();
  const { cattleLots, loading: cattleLotsLoading, deleteCattleLot, updateCattleLot, refresh: refreshLots } = useCattleLotsApi();

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceptionForm, setShowReceptionForm] = useState(false);
  const [showPenAllocation, setShowPenAllocation] = useState(false);
  const [showPaymentValidation, setShowPaymentValidation] = useState(false);
  const [showEditLotModal, setShowEditLotModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [paymentValidated, setPaymentValidated] = useState(false);

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
      if (vendor && (vendor.name || '').toLowerCase().includes(searchLower)) return true;
      
      // Buscar por nome do corretor
      if (order.brokerId) {
        const broker = partners.find(p => p.id === order.brokerId);
        if (broker && (broker.name || '').toLowerCase().includes(searchLower)) return true;
      }
      
      return false;
    });
  }, [purchaseOrders, partners, searchTerm, filterStatus]);

  // Agrupar ordens por estágio
  const ordersByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    stages.forEach(stage => {
      grouped[stage.id] = filteredOrders.filter(order => order.currentStage === stage.id);
    });
    
    return grouped;
  }, [filteredOrders]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalOrders = purchaseOrders?.length || 0;
    const totalAnimals = purchaseOrders?.reduce((sum, order) => sum + (order.animalCount || 0), 0) || 0;
    const totalValue = purchaseOrders?.reduce((sum, order) => sum + (order.totalValue || 0), 0) || 0;
    const avgWeight = purchaseOrders?.length > 0 
      ? purchaseOrders.reduce((sum, order) => sum + ((order.totalWeight || 0) / (order.animalCount || 1)), 0) / purchaseOrders.length 
      : 0;

    return { totalOrders, totalAnimals, totalValue, avgWeight };
  }, [purchaseOrders]);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderForm(true);
  };

  const handleEditLot = (order: any) => {
    const lot = cattleLots.find(l => l.purchaseOrderId === order.id);
    if (lot) {
      setSelectedLot(lot);
      setSelectedOrder(order);
      setShowEditLotModal(true);
    }
  };

  const handleDeleteLot = (order: any) => {
    const lot = cattleLots.find(l => l.purchaseOrderId === order.id);
    if (lot) {
      setSelectedLot(lot);
      setSelectedOrder(order);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteLot = async () => {
    if (selectedOrder) {
      try {
        // Buscar o lote associado se não estiver selecionado
        const lot = selectedLot || cattleLots.find(l => l.purchaseOrderId === selectedOrder.id);
        
        // Deletar o lote primeiro (se existir)
        if (lot) {
          await deleteCattleLot(lot.id);
        }
        
        // Deletar a ordem de compra
        await deletePurchaseOrder(selectedOrder.id);
        
        // Forçar reload de todos os dados relacionados
        // Aguardar um pequeno delay para garantir que o backend processou a exclusão
        setTimeout(() => {
          // Recarregar lotes e ordens
          refreshLots();
          refreshOrders();
          
          // Emitir evento global para notificar outros componentes
          eventBus.emit(EVENTS.LOT_DELETED, { lotId: lot?.id, orderId: selectedOrder.id });
          eventBus.emit(EVENTS.REFRESH_FINANCIAL);
        }, 500);
        
        // Fechar modal
        setShowDeleteConfirm(false);
        setSelectedLot(null);
        setSelectedOrder(null);
        
        console.log('✅ Ordem e lote excluídos com sucesso');
      } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        alert('Erro ao excluir ordem. Verifique se não há dependências.');
      }
    }
  };

  const handleStageChange = async (orderId: string, newStage: string) => {
    try {
      const order = purchaseOrders.find(o => o.id === orderId);
      if (!order) return;

      console.log(`🔄 Transição solicitada: ${order.currentStage} → ${newStage} para ordem ${order.orderNumber}`);

      // Detectar se é transição para frente ou para trás
      const stageOrder = ['order', 'payment-validation', 'reception', 'confined'];
      const currentIndex = stageOrder.indexOf(order.currentStage);
      const newIndex = stageOrder.indexOf(newStage);
      const isMovingForward = newIndex > currentIndex;
      const isMovingBackward = newIndex < currentIndex;

      // LÓGICA PARA TRANSIÇÕES PARA FRENTE
      if (isMovingForward) {
        console.log('➡️ Movendo para frente, verificando se precisa de modal...');
        
        if (newStage === 'payment-validation') {
          // Sempre mostrar modal de validação de pagamento
          setSelectedOrder(order);
          setPaymentValidated(false); // Resetar checkbox
          setShowPaymentValidation(true);
          return;
        }

        if (newStage === 'reception') {
          // Sempre mostrar form de recepção
          setSelectedOrder(order);
          setShowReceptionForm(true);
          return;
        }

        if (newStage === 'confined') {
          // Verificar se já tem lote criado para esta ordem
          const orderLot = cattleLots.find(lot => lot.purchaseOrderId === order.id);
          if (orderLot) {
            // Se já tem lote, mostrar alocação de curral apenas se necessário
            console.log('✅ Lote encontrado - prosseguindo para confinamento');
            setSelectedOrder(order);
            setShowPenAllocation(true);
            return;
          } else {
            // Se não tem lote e está tentando ir para confined, erro na lógica
            console.error('❌ Erro: Tentativa de confinar sem ter passado pela recepção');
            alert('Erro: Esta ordem precisa passar pela recepção antes de ser confinada');
            return;
          }
        }
      }

      // LÓGICA PARA TRANSIÇÕES PARA TRÁS 
      if (isMovingBackward) {
        console.log('🔙 Movendo para trás, verificando o que precisa ser restaurado...');
        
        // Quando volta para reception, atualizar status diretamente (não reabrir form)
        if (newStage === 'reception') {
          console.log('📝 Voltando para recepção - atualizando status');
          await updateStage(orderId, newStage);
          
          // Emitir eventos de atualização
          setTimeout(() => {
            eventBus.emit(EVENTS.ORDER_UPDATED, { orderId, newStage });
            const lot = cattleLots.find(l => l.purchaseOrderId === orderId);
            if (lot) eventBus.emit(EVENTS.LOT_UPDATED, { lotId: lot.id });
            eventBus.emit(EVENTS.REFRESH_FINANCIAL);
            refreshLots();
            refreshOrders();
          }, 500);
          return;
        }

        // Quando volta para payment-validation, mostrar modal novamente
        if (newStage === 'payment-validation') {
          console.log('💰 Voltando para validação de pagamento');
          setSelectedOrder(order);
          setPaymentValidated(false); // Resetar checkbox
          setShowPaymentValidation(true);
          return;
        }

        // Para voltar para 'order', atualizar diretamente (limpa dados no backend)
        if (newStage === 'order') {
          console.log('📋 Voltando para ordem inicial - limpando dados posteriores');
          await updateStage(orderId, newStage);
          
          // Emitir eventos de atualização
          setTimeout(() => {
            eventBus.emit(EVENTS.ORDER_UPDATED, { orderId, newStage });
            const lot = cattleLots.find(l => l.purchaseOrderId === orderId);
            if (lot) eventBus.emit(EVENTS.LOT_UPDATED, { lotId: lot.id });
            eventBus.emit(EVENTS.REFRESH_FINANCIAL);
            refreshLots();
            refreshOrders();
          }, 500);
          return;
        }
      }

      // Para transições que não precisam de modal, atualizar diretamente
      console.log('✅ Transição direta sem modal');
      await updateStage(orderId, newStage);
      
      // Emitir eventos de atualização
      setTimeout(() => {
        eventBus.emit(EVENTS.ORDER_UPDATED, { orderId, newStage });
        const lot = cattleLots.find(l => l.purchaseOrderId === orderId);
        if (lot) eventBus.emit(EVENTS.LOT_UPDATED, { lotId: lot.id });
        eventBus.emit(EVENTS.REFRESH_FINANCIAL);
        refreshLots();
        refreshOrders();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estágio:', error);
      // Mostrar erro para o usuário
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao alterar estágio: ${errorMessage}`);
    }
  };

  if (ordersLoading || partnersLoading || payerAccountsLoading || cattleLotsLoading) {
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
            <div className="kpi-value">{formatCurrency(stats.totalValue)}</div>
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
            <div className="kpi-value">{formatWeight(stats.avgWeight)}</div>
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
                                <DropdownMenuItem onClick={() => handleEditLot(order)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLot(order)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Excluir
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
                              <span>{formatCurrency(order.totalValue)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline" className="text-xs">
                              {order.animalType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  const date = order.purchaseDate || order.orderDate;
                                  if (!date) return 'Data não informada';
                                  const parsedDate = new Date(date);
                                  if (isNaN(parsedDate.getTime())) return 'Data inválida';
                                  return format(parsedDate, 'dd/MM', { locale: ptBR });
                                } catch (err) {
                                  console.warn('Erro ao formatar data:', { date: order.purchaseDate || order.orderDate, error: err });
                                  return 'Data inválida';
                                }
                              })()}
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

      {/* Modal de Recepção */}
      {showReceptionForm && selectedOrder && (
        <ReceptionForm
          isOpen={showReceptionForm}
          onClose={() => {
            setShowReceptionForm(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSubmit={async (data) => {
            console.log('Dados de recepção:', data);
            // Após registrar recepção, atualizar para stage reception
            await updateStage(selectedOrder.id, 'reception');
            
            // Emitir eventos de atualização para sincronizar
            setTimeout(() => {
              eventBus.emit(EVENTS.ORDER_UPDATED, { orderId: selectedOrder.id, newStage: 'reception' });
              const lot = cattleLots.find(l => l.purchaseOrderId === selectedOrder.id);
              if (lot) {
                eventBus.emit(EVENTS.LOT_UPDATED, { lotId: lot.id });
              }
              eventBus.emit(EVENTS.REFRESH_FINANCIAL);
              refreshLots();
              refreshOrders();
            }, 1000); // Aguardar mais tempo para garantir que o backend processou
            
            setShowReceptionForm(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Modal de Alocação de Curral */}
      {showPenAllocation && selectedOrder && (
        <PenAllocationModal
          isOpen={showPenAllocation}
          onClose={async () => {
            // Após alocar no curral, atualizar para stage confined
            await updateStage(selectedOrder.id, 'confined');
            
            // Emitir eventos de atualização
            setTimeout(() => {
              eventBus.emit(EVENTS.ORDER_UPDATED, { orderId: selectedOrder.id, newStage: 'confined' });
              const lot = cattleLots.find(l => l.purchaseOrderId === selectedOrder.id);
              if (lot) eventBus.emit(EVENTS.LOT_UPDATED, { lotId: lot.id });
              eventBus.emit(EVENTS.REFRESH_FINANCIAL);
              refreshLots();
              refreshOrders();
            }, 500);
            
            setShowPenAllocation(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          lot={selectedOrder.lot || cattleLots.find(lot => lot.purchaseOrderId === selectedOrder.id)}
        />
      )}

      {/* Modal de Edição de Ordem/Lote */}
      <Dialog open={showEditLotModal} onOpenChange={setShowEditLotModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ordem {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Atualize as informações da ordem de compra
            </DialogDescription>
          </DialogHeader>
          
          {selectedLot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryQuantity">Quantidade de Animais</Label>
                  <Input
                    id="entryQuantity"
                    type="number"
                    defaultValue={selectedLot.entryQuantity}
                    onChange={(e) => {
                      selectedLot.entryQuantity = parseInt(e.target.value);
                      selectedLot.currentQuantity = parseInt(e.target.value) - (selectedLot.deathCount || 0);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="entryWeight">Peso Total (kg)</Label>
                  <Input
                    id="entryWeight"
                    type="number"
                    defaultValue={selectedLot.entryWeight}
                    onChange={(e) => {
                      selectedLot.entryWeight = parseFloat(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="deathCount">Mortalidade</Label>
                  <Input
                    id="deathCount"
                    type="number"
                    defaultValue={selectedLot.deathCount || 0}
                    onChange={(e) => {
                      selectedLot.deathCount = parseInt(e.target.value);
                      selectedLot.currentQuantity = selectedLot.entryQuantity - parseInt(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="healthCost">Custo Sanidade (R$)</Label>
                  <Input
                    id="healthCost"
                    type="number"
                    defaultValue={selectedLot.healthCost || 0}
                    onChange={(e) => {
                      selectedLot.healthCost = parseFloat(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="feedCost">Custo Alimentação (R$)</Label>
                  <Input
                    id="feedCost"
                    type="number"
                    defaultValue={selectedLot.feedCost || 0}
                    onChange={(e) => {
                      selectedLot.feedCost = parseFloat(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="operationalCost">Custo Operacional (R$)</Label>
                  <Input
                    id="operationalCost"
                    type="number"
                    defaultValue={selectedLot.operationalCost || 0}
                    onChange={(e) => {
                      selectedLot.operationalCost = parseFloat(e.target.value);
                    }}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status do Lote</Label>
                <Select 
                  defaultValue={selectedLot.status}
                  onValueChange={(value) => {
                    selectedLot.status = value;
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="SOLD">Vendido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditLotModal(false)}>
              Cancelar
            </Button>
            <Button onClick={async () => {
              if (selectedLot) {
                // Calcular custo total
                const totalCost = (selectedLot.acquisitionCost || 0) +
                                 (selectedLot.healthCost || 0) +
                                 (selectedLot.feedCost || 0) +
                                 (selectedLot.operationalCost || 0) +
                                 (selectedLot.freightCost || 0) +
                                 (selectedLot.otherCosts || 0);
                
                await updateCattleLot(selectedLot.id, {
                  ...selectedLot,
                  totalCost
                });
                
                // Emitir eventos para sincronizar outros componentes
                setTimeout(() => {
                  eventBus.emit(EVENTS.LOT_UPDATED, { lotId: selectedLot.id });
                  eventBus.emit(EVENTS.REFRESH_FINANCIAL);
                  
                  // Recarregar dados locais
                  refreshLots();
                  refreshOrders();
                }, 500);
                
                setShowEditLotModal(false);
                setSelectedLot(null);
              }
            }}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a ordem <strong>{selectedOrder?.orderNumber}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta ação é irreversível e irá:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Excluir permanentemente a ordem de compra</li>
                <li>Excluir o lote de gado associado</li>
                <li>Remover todas as alocações em currais</li>
                <li>Excluir registros financeiros associados</li>
                <li>Remover todos os dados relacionados</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteLot}
            >
              Excluir Ordem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Validação de Pagamento */}
      <Dialog open={showPaymentValidation} onOpenChange={setShowPaymentValidation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validação de Pagamento</DialogTitle>
            <DialogDescription>
              Configure os dados de pagamento para a ordem #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label>Valor Total</Label>
                <p className="text-sm text-muted-foreground">
                  R$ {selectedOrder.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div>
                <Label htmlFor="payerAccount">Conta Pagadora *</Label>
                <Select 
                  value={selectedOrder.payerAccountId || ''}
                  onValueChange={(value) => {
                    // Atualizar a ordem localmente (isso deveria chamar a API)
                    updatePurchaseOrder(selectedOrder.id, { payerAccountId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta pagadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {payerAccounts && payerAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName} - {account.bankName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="paymentValidated"
                    checked={paymentValidated}
                    onChange={(e) => {
                      setPaymentValidated(e.target.checked);
                      console.log('Pagamento validado:', e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="paymentValidated" className="cursor-pointer">
                    Confirmo que o pagamento foi validado
                  </Label>
                </div>
                {paymentValidated && (
                  <p className="text-sm text-success mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Pagamento confirmado
                  </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPaymentValidation(false);
              setPaymentValidated(false);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (selectedOrder && paymentValidated && selectedOrder.payerAccountId) {
                  await updateStage(selectedOrder.id, 'payment-validation');
                  
                  // Emitir eventos de atualização
                  setTimeout(() => {
                    eventBus.emit(EVENTS.ORDER_UPDATED, { orderId: selectedOrder.id, newStage: 'payment-validation' });
                    eventBus.emit(EVENTS.REFRESH_FINANCIAL);
                    refreshOrders();
                  }, 500);
                  
                  setShowPaymentValidation(false);
                  setSelectedOrder(null);
                  setPaymentValidated(false);
                } else {
                  if (!selectedOrder.payerAccountId) {
                    alert('Por favor, selecione uma conta pagadora.');
                  } else if (!paymentValidated) {
                    alert('Por favor, confirme que o pagamento foi validado.');
                  }
                }
              }}
              disabled={!paymentValidated || !selectedOrder?.payerAccountId}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulário de Ordem de Compra */}
      {showOrderForm && (
        <PurchaseOrderForm
          isOpen={showOrderForm}
          onClose={() => {
            setShowOrderForm(false);
            setSelectedOrder(null);
          }}
          initialData={selectedOrder}
          isEditing={!!selectedOrder}
          onSubmit={async (data) => {
            try {
              if (selectedOrder) {
                await updatePurchaseOrder(selectedOrder.id, data);
              } else {
                await createPurchaseOrder(data);
              }
              setShowOrderForm(false);
              setSelectedOrder(null);
              refreshOrders();
            } catch (error) {
              console.error('Erro ao salvar ordem:', error);
            }
          }}
        />
      )}

      {/* Modal de Recepção */}
      {showReceptionForm && selectedOrder && (
        <ReceptionForm
          isOpen={showReceptionForm}
          onClose={() => {
            setShowReceptionForm(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSubmit={() => {
            refreshOrders();
            refreshLots();
            setShowReceptionForm(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Modal de Alocação em Currais */}
      {showPenAllocation && selectedOrder && (
        <PenAllocationModal
          isOpen={showPenAllocation}
          onClose={() => {
            setShowPenAllocation(false);
            setSelectedOrder(null);
            refreshOrders();
            refreshLots();
          }}
          order={selectedOrder}
          lot={cattleLots.find(l => l.purchaseOrderId === selectedOrder.id) || null}
        />
      )}
    </div>
  );
};
