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
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PurchaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  onEdit,
  onDelete
}) => {
  const { updateGMD } = useCattlePurchasesApi();
  const [showGMDModal, setShowGMDModal] = useState(false);
  const [gmdData, setGmdData] = useState({
    expectedGMD: data?.expectedGMD || 1.2,
    targetWeight: data?.targetWeight || 550
  });

  if (!data) return null;

  // Calcular métricas corretamente
  const metrics = {
    averageWeight: data.entryQuantity > 0 ? data.entryWeight / data.entryQuantity : 0,
    // Arrobas de peso vivo
    liveWeightArrobas: data.entryWeight / 30,
    // Arrobas de carcaça (considerando rendimento)
    carcassArrobas: (data.entryWeight * (data.carcassYield || 50) / 100) / 15,
    // Preço médio por arroba de carcaça
    pricePerCarcassArroba: data.pricePerArroba || 0,
    // Valor total calculado corretamente: arrobas de carcaça × preço por arroba
    calculatedPurchaseValue: 0, // Será calculado abaixo
    // Custos unitários
    costPerHead: data.entryQuantity > 0 ? data.totalCost / data.entryQuantity : 0,
    costPerKg: data.entryWeight > 0 ? data.totalCost / data.entryWeight : 0,
    costPerLiveArroba: data.entryWeight > 0 ? data.totalCost / (data.entryWeight / 30) : 0,
    costPerCarcassArroba: 0, // Será calculado abaixo
    // Dias em confinamento
    daysInConfinement: data.entryDate ? 
      Math.floor((new Date().getTime() - new Date(data.entryDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    // GMD e estimativas
    currentWeight: data.entryQuantity > 0 ? data.entryWeight / data.entryQuantity : 0,
    expectedGMD: data.expectedGMD || gmdData.expectedGMD,
    targetWeight: data.targetWeight || gmdData.targetWeight,
    estimatedWeight: 0,
    daysToTarget: 0,
    estimatedSlaughterDate: null as Date | null
  };
  
  // Calcular valor total da compra corretamente: arrobas de carcaça × preço por arroba
  metrics.calculatedPurchaseValue = metrics.carcassArrobas * (data.pricePerArroba || 0);
  
  // Calcular custo por arroba de carcaça
  metrics.costPerCarcassArroba = metrics.carcassArrobas > 0 ? data.totalCost / metrics.carcassArrobas : 0;

  // Calcular peso estimado e dias para abate
  metrics.estimatedWeight = metrics.currentWeight + (metrics.daysInConfinement * metrics.expectedGMD);
  const currentWeightToGain = metrics.targetWeight - metrics.currentWeight;
  metrics.daysToTarget = metrics.expectedGMD > 0 ? Math.ceil(currentWeightToGain / metrics.expectedGMD) : 0;
  
  if (metrics.daysToTarget > 0) {
    metrics.estimatedSlaughterDate = new Date();
    metrics.estimatedSlaughterDate.setDate(metrics.estimatedSlaughterDate.getDate() + metrics.daysToTarget);
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {data.lotNumber} - {data.lotCode}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Detalhes completos da compra e lote
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              
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
                    <p className="font-semibold">{data.vendorName}</p>
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
                    <p className="font-semibold">{data.carcassYield || 50}%</p>
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
                  <div className="text-2xl font-bold">{data.entryQuantity}</div>
                  <p className="text-xs text-muted-foreground">cabeças</p>
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
                    {data.entryWeight.toLocaleString('pt-BR')} kg
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
                    {metrics.expectedGMD.toFixed(1)} kg/dia
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alvo: {metrics.targetWeight.toFixed(0)} kg
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações da Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fornecedor</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{data.vendorName}</span>
                        </div>
                      </div>
                      
                      {data.brokerName && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Corretor</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{data.brokerName}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Data da Compra</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(data.purchaseDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {data.entryDate && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Data de Entrada</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(data.entryDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Dias em Confinamento</p>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{metrics.daysInConfinement} dias</span>
                        </div>
                      </div>
                    </div>

                    {data.notes && (
                      <div className="space-y-1 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">Observações</p>
                        <p className="text-sm bg-muted/50 p-3 rounded">{data.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações de Transporte */}
                {data.freightCost > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações de Transporte</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Transportadora</p>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {data.transportCompany || 'Não informada'}
                            </span>
                          </div>
                        </div>

                        {data.freightDistance > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Distância Total</p>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{data.freightDistance.toLocaleString('pt-BR')} km</span>
                            </div>
                          </div>
                        )}

                        {data.freightCostPerKm > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Valor por Km</p>
                            <div className="flex items-center gap-2">
                              <Calculator className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatCurrency(data.freightCostPerKm)}/km</span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Valor Total do Frete</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-green-600">{formatCurrency(data.freightCost)}</span>
                          </div>
                        </div>

                        {data.freightPaymentType && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Condição de Pagamento</p>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {data.freightPaymentType === 'cash' ? 'À Vista' : 'A Prazo'}
                              </span>
                            </div>
                          </div>
                        )}

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

                      {/* Cálculo detalhado */}
                      {data.freightDistance > 0 && data.freightCostPerKm > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cálculo do Frete:</span>
                            <span className="font-mono text-xs">
                              {data.freightDistance.toLocaleString('pt-BR')} km × {formatCurrency(data.freightCostPerKm)} = {formatCurrency(data.freightCost)}
                            </span>
                          </div>
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
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Valores da Negociação</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Quantidade de Animais:</span>
                          <span className="font-medium">{data.entryQuantity} cabeças</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Peso Total Entrada:</span>
                          <span className="font-medium">{data.entryWeight.toLocaleString('pt-BR')} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Preço Negociado por @:</span>
                          <span className="font-medium">{formatCurrency(data.pricePerArroba || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rendimento de Carcaça:</span>
                          <span className="font-medium">{data.carcassYield || 50}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total em @ Carcaça:</span>
                          <span className="font-medium">{metrics.carcassArrobas.toFixed(2)} @</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                          <span>Valor Total da Compra:</span>
                          <span className="text-green-600">{formatCurrency(metrics.calculatedPurchaseValue)}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Seção: Custos Adicionais */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Custos Adicionais</p>
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
                          <span className="text-orange-600">{formatCurrency(data.totalCost || 0)}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Seção: Indicadores */}
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Indicadores Unitários</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Conta de Pagamento</p>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{data.payerAccountName || 'Não informado'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                        <span className="font-medium">
                          {data.paymentType === 'cash' ? 'À Vista' : 
                           data.paymentType === 'installment' ? 'Parcelado' : 'Boleto'}
                        </span>
                      </div>

                      {data.dueDate && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Vencimento</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(data.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}

                      {data.paymentTerms && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Condições</p>
                          <span className="font-medium">{data.paymentTerms}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Custos */}
              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detalhamento de Custos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Custo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">% do Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Aquisição</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.acquisitionCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((data.acquisitionCost / data.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Frete</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.freightCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((data.freightCost / data.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sanidade</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.healthCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((data.healthCost / data.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Alimentação</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.feedCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((data.feedCost / data.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Comissão</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.operationalCost || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {data.totalCost > 0 ? ((data.operationalCost / data.totalCost) * 100).toFixed(1) : '0'}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Outros</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.otherCosts || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((data.otherCosts / data.totalCost) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(data.totalCost)}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Indicadores de Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Indicadores de Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Mortalidade</p>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {data.deathCount || 0} cabeças 
                            ({((data.deathCount || 0) / data.entryQuantity * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {data.currentQuantity || data.entryQuantity} cabeças
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">GMD Esperado</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">1.2 kg/dia</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peso Estimado Atual</p>
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {(metrics.averageWeight + (metrics.daysInConfinement * 1.2)).toFixed(1)} kg
                          </span>
                        </div>
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
                    <CardDescription>
                      Histórico de movimentações e eventos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <div className="w-0.5 h-16 bg-muted"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Compra Realizada</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(data.purchaseDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                          <p className="text-sm mt-1">
                            Ordem {data.lotCode} criada
                          </p>
                        </div>
                      </div>

                      {data.entryDate && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="w-0.5 h-16 bg-muted"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Recepção</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(data.entryDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                            <p className="text-sm mt-1">
                              {data.entryQuantity} animais recebidos
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
          <Button variant="default" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Edição de GMD */}
    <Dialog open={showGMDModal} onOpenChange={setShowGMDModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar GMD e Peso Alvo</DialogTitle>
          <DialogDescription>
            Defina o ganho médio diário esperado e o peso alvo para abate
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gmd">GMD Esperado (kg/dia)</Label>
            <Input
              id="gmd"
              type="number"
              step="0.1"
              value={gmdData.expectedGMD}
              onChange={(e) => setGmdData({...gmdData, expectedGMD: parseFloat(e.target.value) || 0})}
              placeholder="Ex: 1.2"
            />
            <p className="text-xs text-muted-foreground">
              Ganho médio diário esperado por animal
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetWeight">Peso Alvo de Abate (kg)</Label>
            <Input
              id="targetWeight"
              type="number"
              step="10"
              value={gmdData.targetWeight}
              onChange={(e) => setGmdData({...gmdData, targetWeight: parseFloat(e.target.value) || 0})}
              placeholder="Ex: 550"
            />
            <p className="text-xs text-muted-foreground">
              Peso médio desejado para abate
            </p>
          </div>
          
          {/* Cálculos em tempo real */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peso atual médio:</span>
                  <span className="font-medium">{metrics.currentWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peso a ganhar:</span>
                  <span className="font-medium">
                    {(gmdData.targetWeight - metrics.currentWeight).toFixed(1)} kg
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias estimados:</span>
                  <span className="font-medium">
                    {gmdData.expectedGMD > 0 
                      ? Math.ceil((gmdData.targetWeight - metrics.currentWeight) / gmdData.expectedGMD)
                      : 0} dias
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data estimada:</span>
                  <span className="font-medium">
                    {gmdData.expectedGMD > 0 
                      ? format(
                          new Date(Date.now() + Math.ceil((gmdData.targetWeight - metrics.currentWeight) / gmdData.expectedGMD) * 24 * 60 * 60 * 1000),
                          'dd/MM/yyyy',
                          { locale: ptBR }
                        )
                      : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowGMDModal(false)}>
            Cancelar
          </Button>
          <Button onClick={async () => {
            try {
              // Usar o lotId do lote de gado associado
              if (data.lotId) {
                const success = await updateGMD(data.lotId, gmdData);
                if (success) {
                  setShowGMDModal(false);
                  // Recarregar dados se necessário
                  if (onEdit) {
                    onEdit(); // Isso pode acionar um reload da lista
                  }
                }
              } else {
                toast.error('Lote não encontrado para atualizar GMD');
              }
            } catch (_error) {
              toast.error('Erro ao atualizar GMD');
            }
          }}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
