import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar,
  DollarSign,
  Package,
  Scale,
  Truck,
  User,
  MapPin,
  FileText,
  Edit,
  Trash2,
  X,
  Building,
  CreditCard,
  TrendingUp,
  Activity,
  AlertCircle,
  Target,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { CattlePurchase, useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';

// Componentes shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SimplifiedPurchaseDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  data: CattlePurchase;
  onEdit: () => void;
  onDelete: () => void;
}

export function SimplifiedPurchaseDetails({
  isOpen,
  onClose,
  data,
  onEdit,
  onDelete
}: SimplifiedPurchaseDetailsProps) {
  const { updateGMD } = useCattlePurchasesApi();
  const [showGMDModal, setShowGMDModal] = useState(false);
  const [gmdData, setGmdData] = useState({
    expectedGMD: data?.expectedGMD || 1.2,
    targetWeight: data?.targetWeight || 550
  });

  if (!data) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      NEGOTIATING: { label: 'Negociando', className: 'bg-gray-100 text-gray-800' },
      CONFIRMED: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      IN_TRANSIT: { label: 'Em Trânsito', className: 'bg-yellow-100 text-yellow-800' },
      RECEIVED: { label: 'Recebido', className: 'bg-cyan-100 text-cyan-800' },
      ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      SOLD: { label: 'Vendido', className: 'bg-purple-100 text-purple-800' },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };
    
    const variant = variants[status] || variants.NEGOTIATING;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  // Calcular métricas
  const metrics = {
    averageWeight: data.initialQuantity > 0 ? data.purchaseWeight / data.initialQuantity : 0,
    liveWeightArrobas: data.purchaseWeight / 30,
    carcassArrobas: (data.purchaseWeight * data.carcassYield / 100) / 15,
    costPerHead: data.initialQuantity > 0 ? data.totalCost / data.initialQuantity : 0,
    costPerKg: data.purchaseWeight > 0 ? data.totalCost / data.purchaseWeight : 0,
    costPerLiveArroba: data.purchaseWeight > 0 ? data.totalCost / (data.purchaseWeight / 30) : 0,
    costPerCarcassArroba: 0,
    daysInConfinement: data.receivedDate ? 
      Math.floor((new Date().getTime() - new Date(data.receivedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    currentWeight: data.currentWeight || data.purchaseWeight,
    estimatedWeight: 0,
    daysToTarget: 0,
    estimatedSlaughterDate: null as Date | null
  };
  
  // Calcular custo por arroba de carcaça
  metrics.costPerCarcassArroba = metrics.carcassArrobas > 0 ? data.totalCost / metrics.carcassArrobas : 0;

  // Calcular peso estimado e dias para abate se tiver GMD
  if (data.expectedGMD && data.targetWeight) {
    metrics.estimatedWeight = metrics.averageWeight + (metrics.daysInConfinement * data.expectedGMD);
    const currentWeightToGain = data.targetWeight - metrics.averageWeight;
    metrics.daysToTarget = data.expectedGMD > 0 ? Math.ceil(currentWeightToGain / data.expectedGMD) : 0;
    
    if (metrics.daysToTarget > 0) {
      metrics.estimatedSlaughterDate = new Date();
      metrics.estimatedSlaughterDate.setDate(metrics.estimatedSlaughterDate.getDate() + metrics.daysToTarget);
    }
  }

  const handleGMDUpdate = async () => {
    try {
      await updateGMD(data.id, gmdData.expectedGMD, gmdData.targetWeight);
      setShowGMDModal(false);
      toast.success('GMD atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar GMD:', error);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {data.purchaseCode} - {data.lotCode}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Detalhes completos da compra unificada
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(data.status)}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 p-1">
            {/* Resumo Rápido da Compra */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fornecedor</p>
                    <p className="font-semibold">{data.vendor?.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Local</p>
                    <p className="font-semibold">{data.location || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data da Compra</p>
                    <p className="font-semibold">
                      {format(new Date(data.purchaseDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rendimento Carcaça</p>
                    <p className="font-semibold">{data.carcassYield}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quantidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.currentQuantity}</div>
                  <p className="text-xs text-muted-foreground">
                    de {data.initialQuantity} inicial
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Peso Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.purchaseWeight.toLocaleString('pt-BR')} kg
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.liveWeightArrobas.toFixed(0)} @ vivo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Peso Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.averageWeight.toFixed(1)} kg
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(metrics.averageWeight / 30).toFixed(1)} @ vivo/cab
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Investimento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(data.totalCost)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(metrics.costPerHead)}/cab
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      GMD / Estimativas
                    </CardTitle>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowGMDModal(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {(data.expectedGMD || 0).toFixed(1)} kg/dia
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alvo: {(data.targetWeight || 0).toFixed(0)} kg
                  </p>
                  {metrics.estimatedSlaughterDate && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {metrics.daysToTarget} dias p/ abate
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="costs">Custos</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Aba Informações Gerais */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informações do Fornecedor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Fornecedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{data.vendor?.name || 'Não informado'}</p>
                      </div>
                      {data.vendor?.document && (
                        <div>
                          <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                          <p className="font-medium">{data.vendor.document}</p>
                        </div>
                      )}
                      {data.location && (
                        <div>
                          <p className="text-sm text-muted-foreground">Localização</p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium">{data.location}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Informações dos Animais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Informações dos Animais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo</p>
                          <p className="font-medium">
                            {data.animalType === 'MALE' ? 'Macho' : 
                             data.animalType === 'FEMALE' ? 'Fêmea' : 'Misto'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Idade Média</p>
                          <p className="font-medium">{data.animalAge || 'N/A'} meses</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mortalidade</p>
                        <div className="flex items-center gap-2">
                          {data.deathCount > 0 ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-orange-600">
                                {data.deathCount} cabeças
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-green-600">Sem mortes</span>
                          )}
                        </div>
                      </div>
                      {data.receivedDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dias em Confinamento</p>
                          <p className="font-medium text-primary">
                            {metrics.daysInConfinement} dias
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Informações de Transporte */}
                {(data.transportCompany || data.freightCost > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Informações de Transporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {data.transportCompany && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Transportadora</p>
                            <p className="font-medium">{data.transportCompany.name}</p>
                          </div>
                        )}
                        
                        {data.freightDistance && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Distância</p>
                            <p className="font-medium">{data.freightDistance} km</p>
                          </div>
                        )}
                        
                        {data.freightCostPerKm && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Custo por Km</p>
                            <p className="font-medium">{formatCurrency(data.freightCostPerKm)}</p>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Valor Total do Frete</p>
                          <p className="font-medium text-lg">{formatCurrency(data.freightCost)}</p>
                        </div>
                      </div>
                      
                      {data.freightPaymentType && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Condição de Pagamento</p>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {data.freightPaymentType === 'cash' ? 'À Vista' : 'A Prazo'}
                              </span>
                            </div>
                          </div>
                          
                          {data.freightDueDate && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Vencimento do Frete</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(data.freightDueDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Aba Financeiro */}
              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Seção: Valores Principais */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Valores da Negociação
                        </p>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Quantidade de Animais:</span>
                          <span className="font-medium">{data.initialQuantity} cabeças</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Peso Total Entrada:</span>
                          <span className="font-medium">{data.purchaseWeight.toLocaleString('pt-BR')} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Preço Negociado por @:</span>
                          <span className="font-medium">{formatCurrency(data.pricePerArroba)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rendimento de Carcaça:</span>
                          <span className="font-medium">{data.carcassYield}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total em @ Carcaça:</span>
                          <span className="font-medium">{metrics.carcassArrobas.toFixed(2)} @</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                          <span>Valor Total da Compra:</span>
                          <span className="text-green-600">{formatCurrency(data.purchaseValue)}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Seção: Custos Adicionais */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Custos Adicionais
                        </p>
                        {data.freightCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Frete:</span>
                            <span className="font-medium">{formatCurrency(data.freightCost)}</span>
                          </div>
                        )}
                        {data.commission > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Comissão Corretor:</span>
                            <span className="font-medium">{formatCurrency(data.commission)}</span>
                          </div>
                        )}
                        {data.healthCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Sanidade:</span>
                            <span className="font-medium">{formatCurrency(data.healthCost)}</span>
                          </div>
                        )}
                        {data.feedCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Alimentação:</span>
                            <span className="font-medium">{formatCurrency(data.feedCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                          <span>Custo Total Acumulado:</span>
                          <span className="text-orange-600">{formatCurrency(data.totalCost)}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Seção: Indicadores */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Indicadores Unitários
                        </p>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Peso Médio por Animal:</span>
                          <span className="font-medium">{metrics.averageWeight.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Custo por Cabeça:</span>
                          <span className="font-medium">{formatCurrency(metrics.costPerHead)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Custo por Kg (Total):</span>
                          <span className="font-medium">{formatCurrency(metrics.costPerKg)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Custo por @ Peso Vivo:</span>
                          <span className="font-medium">{formatCurrency(metrics.costPerLiveArroba)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Custo por @ Carcaça:</span>
                          <span className="font-medium">{formatCurrency(metrics.costPerCarcassArroba)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informações de Pagamento */}
                {(data.paymentType || data.payerAccount) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações de Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Conta Pagadora</p>
                          <p className="font-medium">{data.payerAccount?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Pagamento</p>
                          <p className="font-medium">
                            {data.paymentType === 'CASH' ? 'À Vista' :
                             data.paymentType === 'INSTALLMENT' ? 'A Prazo' : 'Permuta'}
                          </p>
                        </div>
                      </div>
                      {data.paymentTerms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Condições</p>
                          <p className="font-medium">{data.paymentTerms}</p>
                        </div>
                      )}
                      {data.principalDueDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Vencimento Principal</p>
                          <p className="font-medium">
                            {format(new Date(data.principalDueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Aba Custos */}
              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Composição de Custos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Gráfico de barras simplificado */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm w-24">Compra</span>
                          <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                            <div 
                              className="bg-green-500 h-full rounded-full"
                              style={{ width: `${(data.purchaseValue / data.totalCost * 100).toFixed(1)}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {formatCurrency(data.purchaseValue)}
                            </span>
                          </div>
                          <span className="text-sm w-16 text-right">
                            {((data.purchaseValue / data.totalCost) * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        {data.freightCost > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-24">Frete</span>
                            <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${(data.freightCost / data.totalCost * 100).toFixed(1)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {formatCurrency(data.freightCost)}
                              </span>
                            </div>
                            <span className="text-sm w-16 text-right">
                              {((data.freightCost / data.totalCost) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {data.commission > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-24">Comissão</span>
                            <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                              <div 
                                className="bg-yellow-500 h-full rounded-full"
                                style={{ width: `${(data.commission / data.totalCost * 100).toFixed(1)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {formatCurrency(data.commission)}
                              </span>
                            </div>
                            <span className="text-sm w-16 text-right">
                              {((data.commission / data.totalCost) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {data.healthCost > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-24">Sanidade</span>
                            <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                              <div 
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${(data.healthCost / data.totalCost * 100).toFixed(1)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {formatCurrency(data.healthCost)}
                              </span>
                            </div>
                            <span className="text-sm w-16 text-right">
                              {((data.healthCost / data.totalCost) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {data.feedCost > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-24">Alimentação</span>
                            <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                              <div 
                                className="bg-orange-500 h-full rounded-full"
                                style={{ width: `${(data.feedCost / data.totalCost * 100).toFixed(1)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {formatCurrency(data.feedCost)}
                              </span>
                            </div>
                            <span className="text-sm w-16 text-right">
                              {((data.feedCost / data.totalCost) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total de Custos:</span>
                        <span className="text-primary">{formatCurrency(data.totalCost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Histórico */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Linha do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          <div className="w-0.5 h-16 bg-muted" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Compra Realizada</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(data.purchaseDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      {data.receivedDate && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <div className="w-0.5 h-16 bg-muted" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Recepção no Confinamento</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(data.receivedDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                            {data.receivedWeight && (
                              <p className="text-sm">
                                Peso recebido: {data.receivedWeight.toLocaleString('pt-BR')} kg
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {data.estimatedSlaughterDate && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Abate Estimado</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(data.estimatedSlaughterDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-sm">
                              Em {metrics.daysToTarget} dias
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {data.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Edição de GMD */}
    <Dialog open={showGMDModal} onOpenChange={setShowGMDModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar GMD e Projeções</DialogTitle>
          <DialogDescription>
            Ajuste o ganho médio diário e peso alvo para calcular a data estimada de abate
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="gmd">GMD Esperado (kg/dia)</Label>
            <Input
              id="gmd"
              type="number"
              step="0.1"
              value={gmdData.expectedGMD}
              onChange={(e) => setGmdData(prev => ({
                ...prev,
                expectedGMD: parseFloat(e.target.value) || 0
              }))}
            />
          </div>
          <div>
            <Label htmlFor="target">Peso Alvo (kg)</Label>
            <Input
              id="target"
              type="number"
              value={gmdData.targetWeight}
              onChange={(e) => setGmdData(prev => ({
                ...prev,
                targetWeight: parseFloat(e.target.value) || 0
              }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowGMDModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGMDUpdate}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}