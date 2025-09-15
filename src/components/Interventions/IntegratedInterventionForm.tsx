import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Skull, 
  Syringe, 
  Calculator,
  DollarSign,
  AlertTriangle,
  CalendarIcon,
  Info,
  TrendingDown,
  Heart,
  Building2,
  Users,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

import { toast } from 'sonner';
interface IntegratedInterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  pens: any[];
  lots: any[];
  accounts: any[];
  onSubmit: (data: any) => Promise<void>;
}

export const IntegratedInterventionForm: React.FC<IntegratedInterventionFormProps> = ({
  isOpen,
  onClose,
  pens,
  lots,
  accounts,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [interventionType, setInterventionType] = useState<'MORTALITY' | 'HEALTH_PROTOCOL'>('MORTALITY');
  const [integrateFinancial, setIntegrateFinancial] = useState(true);
  
  // Estado para Mortalidade
  const [mortalityData, setMortalityData] = useState({
    penId: '',
    quantity: 1,
    date: new Date(),
    cause: '',
    notes: ''
  });
  
  // Estado para Protocolo Sanitário
  const [protocolData, setProtocolData] = useState({
    type: 'VACINA',
    name: '',
    description: '',
    applicationDate: new Date(),
    penId: '',
    lotId: '',
    animalCount: 0,
    costPerAnimal: 0,
    supplierName: '',
    dueDate: new Date(),
    payerAccountId: '',
    veterinarianName: '',
    notes: ''
  });

  // Estado para cálculos
  const [mortalityCalculation, setMortalityCalculation] = useState<any>(null);
  const [protocolTotalCost, setProtocolTotalCost] = useState(0);

  // Calcular perda estimada quando mudar curral ou quantidade (mortalidade)
  useEffect(() => {
    if (interventionType === 'MORTALITY' && mortalityData.penId && mortalityData.quantity > 0) {
      calculateMortalityLoss();
    }
  }, [mortalityData.penId, mortalityData.quantity]);

  // Calcular custo total do protocolo
  useEffect(() => {
    if (interventionType === 'HEALTH_PROTOCOL') {
      const total = protocolData.costPerAnimal * protocolData.animalCount;
      setProtocolTotalCost(total);
    }
  }, [protocolData.costPerAnimal, protocolData.animalCount]);

  const calculateMortalityLoss = async () => {
    try {
      // Simulação do cálculo - em produção, chamar API
      const pen = pens.find(p => p.id === mortalityData.penId);
      if (!pen) return;

      // Buscar lotes no curral
      const lotsInPen = lots.filter(l => 
        l.lotPenLinks?.some((link: any) => link.penId === mortalityData.penId)
      );

      if (lotsInPen.length === 0) {
        setMortalityCalculation(null);
        return;
      }

      // Calcular preço médio (simplificado)
      let totalValue = 0;
      let totalAnimals = 0;

      lotsInPen.forEach((lot: any) => {
        const link = lot.lotPenLinks.find((l: any) => l.penId === mortalityData.penId);
        const animalsInPen = link?.quantity || 0;
        const lotCost = (lot.purchaseValue || 0) + (lot.freightCost || 0) + (lot.commission || 0);
        const proportionalValue = (lotCost * animalsInPen) / (lot.currentQuantity || 1);
        
        totalValue += proportionalValue;
        totalAnimals += animalsInPen;
      });

      const avgCostPerHead = totalAnimals > 0 ? totalValue / totalAnimals : 0;
      const totalLoss = avgCostPerHead * mortalityData.quantity;

      setMortalityCalculation({
        avgCostPerHead,
        totalLoss,
        lotsAffected: lotsInPen.map((l: any) => l.lotCode).join(', '),
        totalAnimalsInPen: totalAnimals
      });

    } catch (error) {
      console.error('Erro ao calcular perda:', error);
      setMortalityCalculation(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dataToSubmit = {
        type: interventionType,
        integrateFinancial,
        ...(interventionType === 'MORTALITY' ? {
          ...mortalityData,
          estimatedLoss: mortalityCalculation?.totalLoss || 0
        } : {
          ...protocolData,
          totalCost: protocolTotalCost
        })
      };

      await onSubmit(dataToSubmit);

      // Notificação de sucesso
      if (interventionType === 'MORTALITY') {
        toast({
          title: 'Mortalidade registrada',
          description: integrateFinancial 
            ? `Perda de ${formatCurrency(mortalityCalculation?.totalLoss || 0)} deduzida no DRE`
            : 'Registro criado sem integração financeira',
        });
      } else {
        toast({
          title: 'Protocolo sanitário registrado',
          description: integrateFinancial
            ? `Lançamento de ${formatCurrency(protocolTotalCost)} criado no fluxo de caixa`
            : 'Registro criado sem integração financeira',
        });
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar intervenção', {
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Intervenção Integrada</DialogTitle>
          <DialogDescription>
            Registre intervenções com integração automática ao sistema financeiro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de Tipo */}
          <Tabs value={interventionType} onValueChange={(v) => setInterventionType(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="MORTALITY" className="flex items-center gap-2">
                <Skull className="h-4 w-4" />
                Registro de Mortalidade
              </TabsTrigger>
              <TabsTrigger value="HEALTH_PROTOCOL" className="flex items-center gap-2">
                <Syringe className="h-4 w-4" />
                Protocolo Sanitário
              </TabsTrigger>
            </TabsList>

            {/* Toggle de Integração Financeira */}
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <Label htmlFor="integrate">Integrar ao Sistema Financeiro</Label>
                  </div>
                  <Switch
                    id="integrate"
                    checked={integrateFinancial}
                    onCheckedChange={setIntegrateFinancial}
                  />
                </div>
                {integrateFinancial && (
                  <div className="mt-2 text-sm text-blue-700">
                    {interventionType === 'MORTALITY' ? (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 mt-0.5" />
                        <span>Será registrada como DEDUÇÃO no DRE (não afeta caixa)</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <Calculator className="h-4 w-4 mt-0.5" />
                        <span>Criará lançamento em COMPETÊNCIA e CAIXA</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário de Mortalidade */}
            <TabsContent value="MORTALITY" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pen">Curral</Label>
                  <Select
                    value={mortalityData.penId}
                    onValueChange={(value) => setMortalityData({...mortalityData, penId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curral" />
                    </SelectTrigger>
                    <SelectContent>
                      {pens.map((pen) => (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.penNumber} - {pen.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade de Mortes</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={mortalityData.quantity}
                    onChange={(e) => setMortalityData({
                      ...mortalityData, 
                      quantity: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data do Óbito</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !mortalityData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {mortalityData.date ? (
                          format(mortalityData.date, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={mortalityData.date}
                        onSelect={(date) => date && setMortalityData({...mortalityData, date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cause">Causa da Morte</Label>
                  <Select
                    value={mortalityData.cause}
                    onValueChange={(value) => setMortalityData({...mortalityData, cause: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a causa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOENCA">Doença</SelectItem>
                      <SelectItem value="ACIDENTE">Acidente</SelectItem>
                      <SelectItem value="PREDACAO">Predação</SelectItem>
                      <SelectItem value="INTOXICACAO">Intoxicação</SelectItem>
                      <SelectItem value="DESNUTRICAO">Desnutrição</SelectItem>
                      <SelectItem value="DESCONHECIDA">Desconhecida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={mortalityData.notes}
                  onChange={(e) => setMortalityData({...mortalityData, notes: e.target.value})}
                  placeholder="Detalhes adicionais sobre a ocorrência..."
                />
              </div>

              {/* Cálculo de Perda */}
              {mortalityCalculation && integrateFinancial && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-red-800">Impacto Financeiro:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Custo médio/cabeça:</span>
                        <span className="font-medium">{formatCurrency(mortalityCalculation.avgCostPerHead)}</span>
                        
                        <span className="text-gray-600">Perda total estimada:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(mortalityCalculation.totalLoss)}
                        </span>
                        
                        <span className="text-gray-600">Lotes afetados:</span>
                        <span className="text-xs">{mortalityCalculation.lotsAffected}</span>
                      </div>
                      <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                        Esta perda será deduzida da receita bruta no DRE
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Formulário de Protocolo Sanitário */}
            <TabsContent value="HEALTH_PROTOCOL" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Protocolo</Label>
                  <Select
                    value={protocolData.type}
                    onValueChange={(value) => setProtocolData({...protocolData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACINA">Vacina</SelectItem>
                      <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
                      <SelectItem value="VERMIFUGO">Vermífugo</SelectItem>
                      <SelectItem value="SUPLEMENTO">Suplemento</SelectItem>
                      <SelectItem value="TRATAMENTO">Tratamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Produto/Protocolo</Label>
                  <Input
                    value={protocolData.name}
                    onChange={(e) => setProtocolData({...protocolData, name: e.target.value})}
                    placeholder="Ex: Vacina Aftosa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Aplicação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !protocolData.applicationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(protocolData.applicationDate, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={protocolData.applicationDate}
                        onSelect={(date) => date && setProtocolData({...protocolData, applicationDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento (Pagamento)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !protocolData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(protocolData.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={protocolData.dueDate}
                        onSelect={(date) => date && setProtocolData({...protocolData, dueDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Curral (Opcional)</Label>
                  <Select
                    value={protocolData.penId}
                    onValueChange={(value) => setProtocolData({...protocolData, penId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os currais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {pens.map((pen) => (
                        <SelectItem key={pen.id} value={pen.id}>
                          {pen.penNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lote (Opcional)</Label>
                  <Select
                    value={protocolData.lotId}
                    onValueChange={(value) => setProtocolData({...protocolData, lotId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os lotes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lotCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade de Animais</Label>
                  <Input
                    type="number"
                    min="1"
                    value={protocolData.animalCount}
                    onChange={(e) => setProtocolData({
                      ...protocolData, 
                      animalCount: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custo por Animal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={protocolData.costPerAnimal}
                    onChange={(e) => setProtocolData({
                      ...protocolData, 
                      costPerAnimal: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Input
                    value={protocolData.supplierName}
                    onChange={(e) => setProtocolData({...protocolData, supplierName: e.target.value})}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conta para Pagamento</Label>
                  <Select
                    value={protocolData.payerAccountId}
                    onValueChange={(value) => setProtocolData({...protocolData, payerAccountId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} - {account.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Veterinário Responsável</Label>
                  <Input
                    value={protocolData.veterinarianName}
                    onChange={(e) => setProtocolData({...protocolData, veterinarianName: e.target.value})}
                    placeholder="Nome do veterinário"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={protocolData.notes}
                  onChange={(e) => setProtocolData({...protocolData, notes: e.target.value})}
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Resumo Financeiro */}
              {protocolTotalCost > 0 && integrateFinancial && (
                <Alert className="bg-green-50 border-green-200">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-green-800">Resumo Financeiro:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Custo unitário:</span>
                        <span>{formatCurrency(protocolData.costPerAnimal)}</span>
                        
                        <span className="text-gray-600">Quantidade:</span>
                        <span>{protocolData.animalCount} animais</span>
                        
                        <span className="text-gray-600 font-semibold">Custo Total:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(protocolTotalCost)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-green-100 rounded text-xs">
                        <div>
                          <Badge variant="outline" className="mb-1">Competência</Badge>
                          <div>{format(protocolData.applicationDate, "dd/MM/yyyy")}</div>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-1">Vencimento</Badge>
                          <div>{format(protocolData.dueDate, "dd/MM/yyyy")}</div>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processando...' : 'Registrar Intervenção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IntegratedInterventionForm;
