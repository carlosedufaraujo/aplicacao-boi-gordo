import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Componentes shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Ícones
import {
  X,
  Save,
  Calculator,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  MapPin,
  FileText,
  Scale,
  Package,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Building2,
  Hash,
  Beef,
  AlertTriangle,
  Target,
  Receipt,
  CreditCard,
  Percent,
  ChevronRight,
  Loader2,
  Check,
  Clock,
  Home,
  BarChart3,
  Banknote
} from 'lucide-react';

// Hooks e APIs
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { usePenOccupancyApi } from '@/hooks/api/usePenOccupancyApi';
import { formatCurrency, formatWeight, formatPercentage } from '@/utils/formatters';
import { showErrorNotification, showSuccessNotification } from '@/utils/errorHandler';
import { cn } from '@/lib/utils';

// Schema de validação atualizado
const saleFormSchema = z.object({
  // Informações básicas
  internalCode: z.string().optional(),
  saleDate: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  
  // Seleção de curral e tipo de venda
  penId: z.string().min(1, "Selecione um curral"),
  saleType: z.enum(['total', 'partial'], {
    required_error: "Selecione o tipo de venda",
  }),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0").optional(),
  
  // Comprador
  buyerId: z.string().min(1, "Selecione um comprador"),
  
  // Pesos e rendimento
  exitWeight: z.number().min(1, "Peso de saída é obrigatório"),
  carcassWeight: z.number().min(1, "Peso de carcaça é obrigatório"),
  carcassYield: z.number().min(40).max(65), // Calculado automaticamente
  pricePerArroba: z.number().min(1, "Preço por arroba é obrigatório"),
  
  // Pagamento
  paymentType: z.enum(['cash', 'installment'], {
    required_error: "Selecione a forma de pagamento",
  }),
  paymentDate: z.date().optional(), // Para pagamento a prazo
  receiverAccountId: z.string().optional(),
  
  // Documentação
  invoiceNumber: z.string().optional(),
  contractNumber: z.string().optional(),
  observations: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface EnhancedSalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit?: any;
}

export const EnhancedSalesForm: React.FC<EnhancedSalesFormProps> = ({
  isOpen,
  onClose,
  saleToEdit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPen, setSelectedPen] = useState<any>(null);

  // Hooks de API
  const { pens, loading: pensLoading } = usePensApi();
  const { occupancyData } = usePenOccupancyApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { createSaleRecord, updateSaleRecord } = useSaleRecordsApi();
  const { cattlePurchases } = useCattlePurchasesApi();
  const { accounts } = usePayerAccountsApi();

  // Combinar dados de currais com ocupação
  const pensWithOccupancy = useMemo(() => {
    return pens.map(pen => {
      const occupancy = occupancyData.find(o => o.penId === pen.id);
      return {
        ...pen,
        currentOccupancy: occupancy?.currentOccupancy || 0,
        availableAnimals: occupancy?.currentOccupancy || 0,
        lots: occupancy?.lots || []
      };
    }).filter(pen => pen.currentOccupancy > 0); // Apenas currais com animais
  }, [pens, occupancyData]);

  // Filtrar compradores ativos
  const buyers = useMemo(() => {
    return partners.filter(p => 
      (p.type === 'BUYER' || p.partnerType === 'buyer') && 
      p.isActive !== false
    );
  }, [partners]);

  // Filtrar contas recebedoras ativas
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => a.isActive !== false);
  }, [accounts]);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      internalCode: '',
      saleDate: new Date(),
      penId: '',
      saleType: 'total',
      buyerId: '',
      exitWeight: 0,
      carcassWeight: 0,
      carcassYield: 50,
      pricePerArroba: 320,
      paymentType: 'cash',
      receiverAccountId: '',
      invoiceNumber: '',
      contractNumber: '',
      observations: '',
    }
  });

  const watchedValues = form.watch();

  // Gerar código interno automaticamente
  useEffect(() => {
    if (!saleToEdit) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const code = `VD${year}${month}${randomNum}`;
      form.setValue('internalCode', code);
    }
  }, [saleToEdit, form]);

  // Atualizar informações quando curral for selecionado
  useEffect(() => {
    if (watchedValues.penId) {
      const pen = pensWithOccupancy.find(p => p.id === watchedValues.penId);
      if (pen) {
        setSelectedPen(pen);
        
        // Se venda total, preencher quantidade automaticamente
        if (watchedValues.saleType === 'total') {
          form.setValue('quantity', pen.currentOccupancy);
        }
      }
    }
  }, [watchedValues.penId, watchedValues.saleType, pensWithOccupancy, form]);

  // Calcular rendimento de carcaça automaticamente
  useEffect(() => {
    const exitWeight = watchedValues.exitWeight || 0;
    const carcassWeight = watchedValues.carcassWeight || 0;
    
    if (exitWeight > 0 && carcassWeight > 0) {
      const yieldPercentage = (carcassWeight / exitWeight) * 100;
      form.setValue('carcassYield', Math.round(yieldPercentage * 100) / 100);
    }
  }, [watchedValues.exitWeight, watchedValues.carcassWeight, form]);

  // Cálculos automáticos
  const calculations = useMemo(() => {
    const quantity = watchedValues.saleType === 'total' 
      ? selectedPen?.currentOccupancy || 0 
      : watchedValues.quantity || 0;
    const exitWeight = watchedValues.exitWeight || 0;
    const carcassWeight = watchedValues.carcassWeight || 0;
    const pricePerArroba = watchedValues.pricePerArroba || 0;
    
    // Cálculos baseados no peso de carcaça
    const arrobas = carcassWeight / 15; // 1 arroba = 15kg
    const grossValue = arrobas * pricePerArroba;
    const averageWeightPerHead = quantity > 0 ? exitWeight / quantity : 0;
    const valuePerHead = quantity > 0 ? grossValue / quantity : 0;
    
    return {
      quantity,
      arrobas: Math.round(arrobas * 100) / 100,
      grossValue,
      netValue: grossValue, // Sem comissão para vendas
      averageWeight: averageWeightPerHead,
      valuePerHead,
      carcassYield: watchedValues.carcassYield || 0
    };
  }, [watchedValues, selectedPen]);

  const handleSubmit = async (data: SaleFormData) => {
    try {
      setIsSubmitting(true);

      // Debug: Verificar dados antes de enviar
      console.log('🔍 DEBUG - Dados do formulário:', data);
      console.log('🔍 DEBUG - Cálculos:', calculations);
      console.log('🔍 DEBUG - Curral selecionado:', selectedPen);

      // Preparar dados para envio
      const saleData = {
        ...data,
        quantity: data.saleType === 'total' ? selectedPen?.currentOccupancy : data.quantity,
        arrobas: calculations.arrobas,
        totalValue: calculations.grossValue,
        netValue: calculations.netValue,
        deductions: 0, // Adicionar campo obrigatório
        status: 'PENDING', // Usar enum correto em maiúsculo
      };

      // Remover campos que podem estar undefined ou strings vazias
      if (!saleData.purchaseId) {
        delete saleData.purchaseId;
      }
      if (!saleData.receiverAccountId || saleData.receiverAccountId === '') {
        delete saleData.receiverAccountId;
      }
      if (!saleData.observations || saleData.observations === '') {
        delete saleData.observations;
      }
      if (!saleData.invoiceNumber || saleData.invoiceNumber === '') {
        delete saleData.invoiceNumber;
      }
      if (!saleData.contractNumber || saleData.contractNumber === '') {
        delete saleData.contractNumber;
      }

      console.log('📤 DEBUG - Dados preparados para envio:', saleData);

      if (saleToEdit) {
        console.log('🔄 DEBUG - Atualizando venda:', saleToEdit.id);
        await updateSaleRecord(saleToEdit.id, saleData);
        showSuccessNotification('Venda atualizada com sucesso!');
      } else {
        console.log('➕ DEBUG - Criando nova venda');
        const result = await createSaleRecord(saleData);
        console.log('✅ DEBUG - Venda criada:', result);
        if (result) {
          showSuccessNotification('Venda registrada com sucesso!');
        }
      }

      onClose();
    } catch (error: any) {
      console.error('❌ DEBUG - Erro ao salvar venda:', error);
      console.error('❌ DEBUG - Detalhes do erro:', error.response?.data);
      showErrorNotification('Erro ao salvar venda', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedPen(null);
    setActiveTab('basic');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Beef className="h-6 w-6 text-primary" />
            {saleToEdit ? 'Editar Venda de Gado' : 'Nova Venda de Gado'}
          </DialogTitle>
          <DialogDescription>
            Registre uma nova venda de animais do confinamento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">
                    <Home className="h-4 w-4 mr-2" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="weight">
                    <Scale className="h-4 w-4 mr-2" />
                    Pesos
                  </TabsTrigger>
                  <TabsTrigger value="buyer">
                    <Users className="h-4 w-4 mr-2" />
                    Comprador
                  </TabsTrigger>
                  <TabsTrigger value="payment">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagamento
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Código Interno */}
                    <FormField
                      control={form.control}
                      name="internalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Interno</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Data da Venda */}
                    <FormField
                      control={form.control}
                      name="saleDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Venda</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione a data</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seleção de Curral */}
                  <FormField
                    control={form.control}
                    name="penId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curral de Origem</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o curral" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pensWithOccupancy.map((pen) => (
                              <SelectItem key={pen.id} value={pen.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{pen.penNumber || pen.name}</span>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="secondary">
                                      {pen.currentOccupancy} animais
                                    </Badge>
                                    <Badge variant="outline">
                                      Capacidade: {pen.capacity}
                                    </Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {selectedPen && (
                          <Alert className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                <div>Curral: <strong>{selectedPen.penNumber || selectedPen.name}</strong></div>
                                <div>Animais disponíveis: <strong>{selectedPen.currentOccupancy}</strong></div>
                                <div>Capacidade total: <strong>{selectedPen.capacity}</strong></div>
                                {selectedPen.lots && selectedPen.lots.length > 0 && (
                                  <div>Lotes no curral: <strong>{selectedPen.lots.length}</strong></div>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Tipo de Venda */}
                  <FormField
                    control={form.control}
                    name="saleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Venda</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="total"
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                              <RadioGroupItem value="total" id="sale-type-total" />
                              <Label htmlFor="sale-type-total" className="flex-1 cursor-pointer">
                                <div>
                                  <div className="font-medium">Venda Total</div>
                                  <div className="text-sm text-muted-foreground">
                                    Vender todos os animais do curral
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                              <RadioGroupItem value="partial" id="sale-type-partial" />
                              <Label htmlFor="sale-type-partial" className="flex-1 cursor-pointer">
                                <div>
                                  <div className="font-medium">Venda Parcial</div>
                                  <div className="text-sm text-muted-foreground">
                                    Vender apenas parte dos animais
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantidade (apenas para venda parcial) */}
                  {watchedValues.saleType === 'partial' && (
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Animais</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              max={selectedPen?.currentOccupancy || 0}
                              placeholder="Digite a quantidade"
                            />
                          </FormControl>
                          <FormDescription>
                            Máximo disponível: {selectedPen?.currentOccupancy || 0} animais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                <TabsContent value="weight" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {/* Peso de Saída da Fazenda */}
                    <FormField
                      control={form.control}
                      name="exitWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Total de Saída da Fazenda (kg)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Scale className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Ex: 15000"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Peso total dos animais na saída da fazenda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Peso de Carcaça */}
                    <FormField
                      control={form.control}
                      name="carcassWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Total de Carcaça (kg)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Beef className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Ex: 7800"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Peso total de carcaça informado pelo frigorífico
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rendimento de Carcaça (Calculado) */}
                    <FormField
                      control={form.control}
                      name="carcassYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rendimento de Carcaça (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                disabled
                                className="pl-10 bg-muted"
                                value={`${field.value?.toFixed(2) || '0.00'}%`}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Calculado automaticamente com base nos pesos informados
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    {/* Card de Resumo */}
                    {calculations.arrobas > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Resumo dos Cálculos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total de Arrobas:</span>
                              <span className="font-medium">{calculations.arrobas.toFixed(2)} @</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peso Médio/Cabeça:</span>
                              <span className="font-medium">
                                {calculations.averageWeight.toFixed(2)} kg
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="buyer" className="space-y-4 mt-4">
                  {/* Seleção do Comprador */}
                  <FormField
                    control={form.control}
                    name="buyerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comprador</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o comprador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buyers.map((buyer) => (
                              <SelectItem key={buyer.id} value={buyer.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{buyer.name}</span>
                                  {buyer.type && (
                                    <Badge variant="outline" className="ml-2">
                                      {buyer.type}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preço por Arroba */}
                  <FormField
                    control={form.control}
                    name="pricePerArroba"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço por Arroba (R$/@)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              className="pl-10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="Ex: 320.00"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Valor acordado por arroba com o comprador
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Card de Valores Calculados */}
                  {calculations.grossValue > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Valores Calculados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Arrobas (@):</span>
                            <span className="font-medium text-lg">
                              {calculations.arrobas.toFixed(2)} @
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Preço por Arroba:</span>
                            <span className="font-medium text-lg">
                              {formatCurrency(watchedValues.pricePerArroba || 0)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Valor Total da Venda:</span>
                            <span className="font-bold text-xl text-primary">
                              {formatCurrency(calculations.grossValue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Valor por Cabeça:</span>
                            <span className="font-medium">
                              {formatCurrency(calculations.valuePerHead)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="payment" className="space-y-4 mt-4">
                  {/* Forma de Pagamento */}
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="cash"
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                              <RadioGroupItem value="cash" id="payment-type-cash" />
                              <Label htmlFor="payment-type-cash" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">À Vista</div>
                                    <div className="text-sm text-muted-foreground">
                                      Pagamento imediato
                                    </div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                              <RadioGroupItem value="installment" id="payment-type-installment" />
                              <Label htmlFor="payment-type-installment" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">A Prazo</div>
                                    <div className="text-sm text-muted-foreground">
                                      Pagamento com data futura
                                    </div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Recebimento (para pagamento a prazo) */}
                  {watchedValues.paymentType === 'installment' && (
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Estimada de Recebimento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione a data de recebimento</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Conta para Recebimento */}
                  <FormField
                    control={form.control}
                    name="receiverAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta para Recebimento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{account.accountName}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {account.bankName}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Conta bancária onde o valor será recebido
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Observações */}
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Adicione observações sobre a venda..."
                            className="resize-none"
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais sobre a venda
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <DialogFooter className="p-6 pt-0">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  {calculations.quantity > 0 && (
                    <span>
                      {calculations.quantity} animais • {calculations.arrobas.toFixed(2)} @ • {formatCurrency(calculations.grossValue)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || pensLoading || partnersLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {saleToEdit ? 'Atualizar' : 'Registrar'} Venda
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};