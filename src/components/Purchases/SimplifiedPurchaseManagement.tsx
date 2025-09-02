import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCattlePurchasesApi, CattlePurchase } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedPurchaseForm } from '../Forms/OptimizedPurchaseForm';
import { SimplifiedPurchaseDetails } from './SimplifiedPurchaseDetails';
import { StatusChangeModal } from '../Modals/StatusChangeModal';

export function SimplifiedPurchaseManagement() {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CattlePurchase | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalData, setStatusModalData] = useState<any>(null);

  // Hooks de API
  const { 
    purchases, 
    loading, 
    loadPurchases, 
    createPurchase,
    updatePurchase,
    deletePurchase,
    updateStatus,
    registerDeath,
    registerReception,
    markAsConfined
  } = useCattlePurchasesApi();
  
  const { partners, loadPartners } = usePartnersApi();
  const { accounts, loadAccounts } = usePayerAccountsApi();

  // Carregar dados ao montar
  useEffect(() => {
    loadPurchases();
    loadPartners();
    loadAccounts();
  }, []);

  // Filtrar compras
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || purchase.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas
  const statistics = {
    total: purchases.length,
    active: purchases.filter(p => p.status === 'CONFINED').length,
    totalAnimals: purchases.reduce((sum, p) => sum + p.currentQuantity, 0),
    totalInvestment: purchases.reduce((sum, p) => sum + p.totalCost, 0),
  };

  // Funções auxiliares
  const getStatusBadge = (status: string, purchase: CattlePurchase) => {
    // Priorizar o stage para mostrar o status real
    let label = 'Confirmado';
    let variant = 'default';
    let next = 'RECEIVED';
    
    if (purchase.status === 'CONFINED') {
      label = 'Confinado';
      variant = 'success';
      next = null;
    } else if (purchase.stage === 'received') {
      label = 'Recepcionado';
      variant = 'info';
      next = 'CONFINED';
    } else if (purchase.stage === 'in_transit') {
      label = 'Em Trânsito';
      variant = 'warning';
      next = 'RECEIVED';
    } else if (purchase.stage === 'confirmed') {
      label = 'Confirmado';
      variant = 'default';
      next = 'RECEIVED';
    }
    
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 py-0.5"
        onClick={() => handleStatusClick(purchase, next)}
        disabled={!next || purchase.status === 'CONFINED'}
      >
        <Badge variant={variant as any} className="cursor-pointer">
          {label}
        </Badge>
      </Button>
    );
  };

  const handleStatusClick = (purchase: CattlePurchase, nextStatus: string | null) => {
    if (!nextStatus) return;
    
    setSelectedPurchase(purchase);
    setStatusModalData({
      currentStatus: purchase.status,
      nextStatus,
      purchase
    });
    setShowStatusModal(true);
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

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    
    try {
      const success = await deletePurchase(purchaseToDelete);
      
      if (success) {
        // Exclusão bem-sucedida
        setShowDeleteDialog(false);
        setPurchaseToDelete(null);
        setSelectedPurchase(null);
        setShowDetails(false);
      }
    } catch (error: any) {
      // Apenas logar erros reais (não 404 que já foi tratado no hook)
      if (error.response?.status !== 404) {
        console.error('Erro ao excluir:', error);
      }
      
      // Fechar modais em caso de erro também
      setShowDeleteDialog(false);
      setPurchaseToDelete(null);
    }
  };

  const handleQuickStatusUpdate = async (purchaseId: string, newStatus: CattlePurchase['status']) => {
    // Para status RECEIVED, sempre abrir o modal
    if (newStatus === 'RECEIVED') {
      const purchase = purchases.find(p => p.id === purchaseId);
      if (purchase) {
        setStatusModalData({
          currentStatus: purchase.status,
          nextStatus: 'RECEIVED',
          purchase: purchase
        });
        setShowStatusModal(true);
      }
    } else {
      // Para outros status, atualizar diretamente
      try {
        await updateStatus(purchaseId, newStatus);
        await loadPurchases();
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Animais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalAnimals.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">em compras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preço Médio/@
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                purchases.reduce((sum, p) => sum + p.pricePerArroba, 0) / purchases.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">por arroba</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Compras</CardTitle>
              <CardDescription>
                Sistema unificado de compras e lotes
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, lote, fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="NEGOTIATING">Negociando</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="RECEIVED">Recepcionado</SelectItem>
                <SelectItem value="CONFINED">Confinado</SelectItem>
                <SelectItem value="RECEIVED">Recebido</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="SOLD">Vendido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabela de Compras */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Código/Lote</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Qtd/Peso</TableHead>
                  <TableHead>Preço/@</TableHead>
                  <TableHead>Investimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Carregando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma compra encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map(purchase => (
                    <React.Fragment key={purchase.id}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(purchase.id)}
                          >
                            {expandedRows.has(purchase.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{purchase.lotCode}</div>
                        </TableCell>
                        <TableCell>{purchase.vendor?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {format(new Date(purchase.purchaseDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{purchase.currentQuantity} cab</div>
                            <div className="text-sm text-muted-foreground">
                              {purchase.purchaseWeight.toLocaleString('pt-BR')} kg
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(purchase.pricePerArroba)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(purchase.totalCost)}
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status, purchase)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowForm(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPurchaseToDelete(purchase.id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Linha Expandida com Detalhes */}
                      {expandedRows.has(purchase.id) && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/30">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Localização</p>
                                  <p className="text-sm">{purchase.location || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Tipo de Animal</p>
                                  <p className="text-sm">
                                    {purchase.animalType === 'MALE' ? 'Macho' : 
                                     purchase.animalType === 'FEMALE' ? 'Fêmea' : 'Misto'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Rendimento</p>
                                  <p className="text-sm">{purchase.carcassYield}%</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Mortalidade</p>
                                  <p className="text-sm">{purchase.deathCount} cabeças</p>
                                </div>
                              </div>
                              
                              {/* Custos Detalhados */}
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Composição de Custos</p>
                                <div className="flex gap-4 text-sm">
                                  <span>Compra: {formatCurrency(purchase.purchaseValue)}</span>
                                  <span>Frete: {formatCurrency(purchase.freightCost)}</span>
                                  <span>Comissão: {formatCurrency(purchase.commission)}</span>
                                  {purchase.healthCost > 0 && (
                                    <span>Sanidade: {formatCurrency(purchase.healthCost)}</span>
                                  )}
                                  {purchase.feedCost > 0 && (
                                    <span>Alimentação: {formatCurrency(purchase.feedCost)}</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* GMD se existir */}
                              {purchase.expectedGMD && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Projeções</p>
                                  <div className="flex gap-4 text-sm">
                                    <span>GMD: {purchase.expectedGMD} kg/dia</span>
                                    <span>Peso Alvo: {purchase.targetWeight} kg</span>
                                    {purchase.estimatedSlaughterDate && (
                                      <span>
                                        Abate: {format(new Date(purchase.estimatedSlaughterDate), 'dd/MM/yyyy', { locale: ptBR })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Ações Rápidas */}
                              <div className="flex gap-2">
                                {purchase.status === 'CONFIRMED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickStatusUpdate(purchase.id, 'RECEIVED')}
                                  >
                                    <Truck className="h-3 w-3 mr-2" />
                                    Marcar em Trânsito
                                  </Button>
                                )}
                                {purchase.status === 'RECEIVED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickStatusUpdate(purchase.id, 'RECEIVED')}
                                  >
                                    <Package className="h-3 w-3 mr-2" />
                                    Receber e Alocar
                                  </Button>
                                )}
                                {purchase.status === 'CONFINED' && (
                                  <div className="text-sm text-muted-foreground">
                                    Já recepcionado e confinado
                                  </div>
                                )}
                                {purchase.status === 'RECEIVED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickStatusUpdate(purchase.id, 'ACTIVE')}
                                  >
                                    <TrendingUp className="h-3 w-3 mr-2" />
                                    Ativar Lote
                                  </Button>
                                )}
                              </div>
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
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {showDetails && selectedPurchase && (
        <SimplifiedPurchaseDetails
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedPurchase(null);
          }}
          data={selectedPurchase}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
          onDelete={() => {
            setShowDetails(false);
            setPurchaseToDelete(selectedPurchase.id);
            setShowDeleteDialog(true);
          }}
          onRefresh={async () => {
            await loadPurchases();
            // Atualizar o selectedPurchase com os dados atualizados
            const updatedPurchase = purchases.find(p => p.id === selectedPurchase.id);
            if (updatedPurchase) {
              setSelectedPurchase(updatedPurchase);
            }
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>Tem certeza que deseja excluir esta compra?</div>
                {purchaseToDelete && (() => {
                  const purchase = purchases.find(p => p.id === purchaseToDelete);
                  const isActive = purchase?.status === 'CONFINED' || purchase?.status === 'RECEIVED';
                  
                  if (isActive) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                        <div className="text-amber-800 font-medium">⚠️ Atenção: Este lote está ativo!</div>
                        <div className="text-amber-700 text-sm mt-1">
                          Ao excluir, serão removidos TODOS os dados relacionados:
                        </div>
                        <ul className="text-amber-700 text-sm mt-1 ml-4 list-disc">
                          <li>Alocações em currais</li>
                          <li>Registros de saúde e mortalidade</li>
                          <li>Despesas e receitas relacionadas</li>
                          <li>Análises de quebra de peso</li>
                          <li>Histórico completo do lote</li>
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="text-destructive font-semibold">Esta ação não pode ser desfeita!</div>
              </div>
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
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Mudança de Status */}
      {showStatusModal && statusModalData && (
        <StatusChangeModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setStatusModalData(null);
          }}
          data={statusModalData}
          onConfirm={async (statusData) => {
            try {
              const purchase = statusModalData.purchase;
              
              if (statusData.status === 'RECEIVED') {
                // Se a compra já está recepcionada (stage === 'received'), usar endpoint de confinamento
                if (purchase.stage === 'received') {
                  // Alocar em currais (markAsConfined)
                  await markAsConfined(statusData.purchaseId, {
                    penAllocations: statusData.penAllocations,
                    observations: statusData.notes,
                  });
                } else {
                  // Registrar recepção
                  await registerReception(statusData.purchaseId, {
                    receivedDate: new Date(statusData.receivedDate),
                    receivedWeight: statusData.receivedWeight,
                    actualQuantity: statusData.actualQuantity,
                    transportMortality: statusModalData.purchase.initialQuantity - statusData.actualQuantity,
                    mortalityReason: statusData.mortalityReason,
                    notes: statusData.notes,
                    penAllocations: statusData.penAllocations,
                  });
                }
              } else {
                // Chamar API de mudança de status simples
                await updateStatus(statusData.purchaseId, statusData.status);
              }
              
              // Recarregar dados
              await loadPurchases();
              setShowStatusModal(false);
              setStatusModalData(null);
            } catch (error) {
              console.error('Erro ao mudar status:', error);
            }
          }}
        />
      )}

      {/* Formulário de Nova/Editar Compra */}
      <OptimizedPurchaseForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedPurchase(null);
        }}
        onSubmit={async (data) => {
          if (selectedPurchase) {
            await updatePurchase(selectedPurchase.id, data);
          } else {
            await createPurchase(data);
          }
          await loadPurchases();
          setShowForm(false);
          setSelectedPurchase(null);
        }}
        partners={partners}
        payerAccounts={accounts}
        initialData={selectedPurchase}
      />
    </div>
  );
}