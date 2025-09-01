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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Ícones
import {
  X,
  Save,
  Calculator,
  Calendar as CalendarIcon,
  DollarSign,
  Truck,
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
  Phone,
  Mail,
  Beef,
  AlertTriangle,
  Target,
  Receipt,
  CreditCard,
  Percent,
  PiggyBank,
  ChevronRight,
  Loader2,
  Check,
  Clock,
  FileSearch,
  Plus,
  Minus,
  Home,
  BarChart3
} from 'lucide-react';

// Hooks e APIs
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { useSaleRecordsApi } from '@/hooks/api/useSaleRecordsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { formatCurrency, formatWeight, formatPercentage } from '@/utils/formatters';
import { showErrorNotification, showSuccessNotification } from '@/utils/errorHandler';
import { cn } from '@/lib/utils';

// Schema de validação
const saleFormSchema = z.object({
  // Informações básicas
  internalCode: z.string().optional(),
  saleDate: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  
  // Seleção de animais
  penId: z.string().min(1, "Selecione um curral"),
  saleType: z.enum(['total', 'partial'], {
    required_error: "Selecione o tipo de venda",
  }),
  quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
  selectedAnimals: z.object({
    common: z.number().min(0),
    china: z.number().min(0),
    angus: z.number().min(0),
  }),
  
  // Comprador
  buyerId: z.string().min(1, "Selecione um comprador"),
  buyerType: z.enum(['slaughterhouse', 'dealer', 'final'], {
    required_error: "Selecione o tipo de comprador",
  }),
  
  // Valores e pesos
  exitWeight: z.number().min(1, "Peso de saída é obrigatório"),
  carcassYield: z.number().min(40).max(65),
  pricePerArroba: z.number().min(1, "Preço por arroba é obrigatório"),
  
  // Logística
  transportType: z.enum(['buyer', 'seller', 'third_party']),
  transporterId: z.string().optional(),
  freightValue: z.number().min(0),
  deliveryDate: z.date().optional(),
  deliveryLocation: z.string().optional(),
  
  // Pagamento
  paymentType: z.enum(['cash', 'installment', 'barter']),
  paymentTerms: z.number().min(0).max(180),
  payerAccountId: z.string().optional(),
  installments: z.number().min(1).max(12).optional(),
  
  // Comissões e descontos
  commissionType: z.enum(['percentage', 'fixed', 'none']),
  commissionValue: z.number().min(0),
  discountType: z.enum(['percentage', 'fixed', 'none']),
  discountValue: z.number().min(0),
  
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
  const [availableAnimals, setAvailableAnimals] = useState({
    total: 0,
    common: 0,
    china: 0,
    angus: 0
  });

  // Hooks de API
  const { pens, loading: pensLoading } = usePensApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { createSaleRecord, updateSaleRecord } = useSaleRecordsApi();
  const { cattlePurchases } = useCattlePurchasesApi();
  const { accounts } = usePayerAccountsApi();

  // Filtrar apenas currais com animais
  const availablePens = useMemo(() => {
    return pens.filter(pen => pen.currentOccupancy > 0);
  }, [pens]);

  // Filtrar compradores ativos
  const buyers = useMemo(() => {
    return partners.filter(p => 
      (p.type === 'slaughterhouse' || p.type === 'dealer' || p.type === 'buyer') && 
      p.isActive
    );
  }, [partners]);

  // Filtrar transportadoras
  const transporters = useMemo(() => {
    return partners.filter(p => p.type === 'transporter' && p.isActive);
  }, [partners]);

  // Filtrar contas pagadoras ativas
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => a.isActive);
  }, [accounts]);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleDate: new Date(),
      saleType: 'total',
      quantity: 0,
      selectedAnimals: {
        common: 0,
        china: 0,
        angus: 0
      },
      carcassYield: 54,
      pricePerArroba: 320,
      transportType: 'buyer',
      freightValue: 0,
      paymentType: 'cash',
      paymentTerms: 30,
      commissionType: 'none',
      commissionValue: 0,
      discountType: 'none',
      discountValue: 0,
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
      const code = `V${year}${month}${randomNum}`;
      form.setValue('internalCode', code);
    }
  }, [saleToEdit, form]);

  // Atualizar animais disponíveis quando curral for selecionado
  useEffect(() => {
    if (watchedValues.penId) {
      const pen = pens.find(p => p.id === watchedValues.penId);
      if (pen) {
        setSelectedPen(pen);
        
        // Buscar informações dos lotes no curral
        const lotsInPen = cattlePurchases.filter(purchase => 
          purchase.penId === pen.id && purchase.status === 'active'
        );
        
        // Calcular totais por tipo de animal
        let totalCommon = 0;
        let totalChina = 0;
        let totalAngus = 0;
        
        lotsInPen.forEach(lot => {
          // Aqui você precisaria ter os campos de tipo de animal no lote
          // Por enquanto vamos simular uma distribuição
          const total = lot.quantity || 0;
          totalCommon += Math.floor(total * 0.6);
          totalChina += Math.floor(total * 0.25);
          totalAngus += Math.floor(total * 0.15);
        });
        
        setAvailableAnimals({
          total: pen.currentOccupancy,
          common: totalCommon || pen.currentOccupancy,
          china: totalChina || 0,
          angus: totalAngus || 0
        });
        
        // Se venda total, preencher automaticamente
        if (watchedValues.saleType === 'total') {
          form.setValue('quantity', pen.currentOccupancy);
          form.setValue('selectedAnimals', {
            common: totalCommon || pen.currentOccupancy,
            china: totalChina || 0,
            angus: totalAngus || 0
          });
        }
      }
    }
  }, [watchedValues.penId, watchedValues.saleType, pens, cattlePurchases, form]);

  // Cálculos automáticos
  const calculations = useMemo(() => {
    const quantity = watchedValues.quantity || 0;
    const exitWeight = watchedValues.exitWeight || 0;
    const carcassYield = watchedValues.carcassYield || 54;
    const pricePerArroba = watchedValues.pricePerArroba || 0;
    const freightValue = watchedValues.freightValue || 0;
    
    // Peso médio por animal
    const averageWeight = quantity > 0 ? exitWeight / quantity : 0;
    
    // Peso de carcaça
    const carcassWeight = (exitWeight * carcassYield) / 100;
    
    // Arrobas totais
    const totalArrobas = carcassWeight / 15;
    
    // Valor bruto
    const grossValue = totalArrobas * pricePerArroba;
    
    // Calcular comissão
    let commission = 0;
    if (watchedValues.commissionType === 'percentage') {
      commission = (grossValue * watchedValues.commissionValue) / 100;
    } else if (watchedValues.commissionType === 'fixed') {
      commission = watchedValues.commissionValue * quantity;
    }
    
    // Calcular desconto
    let discount = 0;
    if (watchedValues.discountType === 'percentage') {
      discount = (grossValue * watchedValues.discountValue) / 100;
    } else if (watchedValues.discountType === 'fixed') {
      discount = watchedValues.discountValue;
    }
    
    // Valor líquido
    const netValue = grossValue - freightValue - commission - discount;
    
    // Valor por animal
    const valuePerAnimal = quantity > 0 ? netValue / quantity : 0;
    
    return {
      averageWeight,
      carcassWeight,
      totalArrobas,
      grossValue,
      commission,
      discount,
      netValue,
      valuePerAnimal,
      totalCosts: freightValue + commission + discount
    };
  }, [watchedValues]);

  const handleSubmit = async (data: SaleFormData) => {
    try {
      setIsSubmitting(true);
      
      // Preparar dados para API
      const saleData = {
        ...data,
        penId: data.penId,
        lotId: selectedPen?.lotId || '', // Precisamos do ID do lote
        slaughterhouseId: data.buyerId,
        saleDate: data.saleDate.toISOString(),
        animalType: 'mixed' as any, // Ajustar conforme necessário
        currentQuantity: data.quantity,
        totalWeight: data.exitWeight,
        pricePerArroba: data.pricePerArroba,
        paymentType: data.paymentType as any,
        paymentDate: data.paymentTerms ? 
          new Date(Date.now() + data.paymentTerms * 24 * 60 * 60 * 1000).toISOString() : 
          undefined,
        commonAnimals: data.selectedAnimals.common,
        chinaAnimals: data.selectedAnimals.china,
        angusAnimals: data.selectedAnimals.angus,
        observations: data.observations,
        // Valores calculados
        grossRevenue: calculations.grossValue,
        netProfit: calculations.netValue,
        profitMargin: (calculations.netValue / calculations.grossValue) * 100
      };
      
      let result;
      if (saleToEdit) {
        result = await updateSaleRecord(saleToEdit.id, saleData);
      } else {
        result = await createSaleRecord(saleData);
      }
      
      if (result) {
        showSuccessNotification(
          saleToEdit ? 'Venda atualizada com sucesso!' : 'Venda registrada com sucesso!'
        );
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      showErrorNotification(error, 'Erro ao salvar venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = pensLoading || partnersLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beef className="h-5 w-5" />
            {saleToEdit ? 'Editar Venda' : 'Nova Venda de Gado'}
          </DialogTitle>
          <DialogDescription>
            Registre a venda de animais dos currais para compradores
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Seleção
                </TabsTrigger>
                <TabsTrigger value="buyer" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comprador
                </TabsTrigger>
                <TabsTrigger value="logistics" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Logística
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumo
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                {/* Tab: Seleção de Animais */}
                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações da Venda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="internalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Interno</FormLabel>
                              <FormControl>
                                <Input {...field} disabled placeholder="Gerado automaticamente" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione a data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

                      <Separator />

                      <FormField
                        control={form.control}
                        name="penId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curral de Origem</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o curral" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availablePens.map((pen) => (
                                  <SelectItem key={pen.id} value={pen.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{pen.name}</span>
                                      <Badge variant="secondary" className="ml-2">
                                        {pen.currentOccupancy} animais
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedPen && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p>Curral: <strong>{selectedPen.name}</strong></p>
                              <p>Capacidade: {selectedPen.currentOccupancy}/{selectedPen.capacity}</p>
                              <p>Animais disponíveis: {availableAnimals.total}</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={form.control}
                        name="saleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Venda</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="total" id="total" />
                                  <Label htmlFor="total">Venda Total (todos os animais do curral)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="partial" id="partial" />
                                  <Label htmlFor="partial">Venda Parcial (selecionar quantidade)</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedValues.saleType === 'partial' && (
                        <div className="space-y-4 p-4 border rounded-lg">
                          <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantidade Total</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    max={availableAnimals.total}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Máximo disponível: {availableAnimals.total} animais
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <Label>Tipos de Animais</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="selectedAnimals.common"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Comum</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        max={availableAnimals.common}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Máx: {availableAnimals.common}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="selectedAnimals.china"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">China</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        max={availableAnimals.china}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Máx: {availableAnimals.china}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="selectedAnimals.angus"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Angus</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        max={availableAnimals.angus}
                                      />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                      Máx: {availableAnimals.angus}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pesos e Rendimento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="exitWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Total de Saída (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Ex: 15000"
                              />
                            </FormControl>
                            <FormDescription>
                              Peso médio por animal: {formatWeight(calculations.averageWeight)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="carcassYield"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rendimento de Carcaça (%)</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  min={40}
                                  max={65}
                                  step={0.5}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>40%</span>
                                  <span className="font-medium text-foreground">{field.value}%</span>
                                  <span>65%</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Peso de carcaça: {formatWeight(calculations.carcassWeight)} ({calculations.totalArrobas.toFixed(2)}@)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Comprador e Valores */}
                <TabsContent value="buyer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações do Comprador</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="buyerType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Comprador</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="slaughterhouse">Frigorífico</SelectItem>
                                <SelectItem value="dealer">Intermediário</SelectItem>
                                <SelectItem value="final">Consumidor Final</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buyerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comprador</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o comprador" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {buyers
                                  .filter(b => {
                                    if (watchedValues.buyerType === 'slaughterhouse') {
                                      return b.type === 'slaughterhouse';
                                    }
                                    return b.type === 'dealer' || b.type === 'buyer';
                                  })
                                  .map((buyer) => (
                                    <SelectItem key={buyer.id} value={buyer.id}>
                                      <div className="flex flex-col">
                                        <span>{buyer.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {buyer.city} - {buyer.state}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Valores e Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="pricePerArroba"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço por Arroba (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Ex: 320.00"
                              />
                            </FormControl>
                            <FormDescription>
                              Valor bruto total: {formatCurrency(calculations.grossValue)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="commissionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Comissão</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sem Comissão</SelectItem>
                                  <SelectItem value="percentage">Percentual</SelectItem>
                                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.commissionType !== 'none' && (
                          <FormField
                            control={form.control}
                            name="commissionValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {watchedValues.commissionType === 'percentage' ? 'Comissão (%)' : 'Comissão (R$/cabeça)'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Total: {formatCurrency(calculations.commission)}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="discountType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Desconto</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sem Desconto</SelectItem>
                                  <SelectItem value="percentage">Percentual</SelectItem>
                                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.discountType !== 'none' && (
                          <FormField
                            control={form.control}
                            name="discountValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {watchedValues.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Total: {formatCurrency(calculations.discount)}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <Separator />

                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">À Vista</SelectItem>
                                <SelectItem value="installment">Parcelado</SelectItem>
                                <SelectItem value="barter">Permuta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedValues.paymentType === 'installment' && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="installments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número de Parcelas</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    min="1"
                                    max="12"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="paymentTerms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prazo (dias)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="payerAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta Recebedora</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center justify-between">
                                      <span>{account.name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {account.type}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Conta onde o valor será recebido
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Logística */}
                <TabsContent value="logistics" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Transporte e Entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="transportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável pelo Transporte</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="buyer">Comprador</SelectItem>
                                <SelectItem value="seller">Vendedor</SelectItem>
                                <SelectItem value="third_party">Terceirizado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedValues.transportType === 'third_party' && (
                        <FormField
                          control={form.control}
                          name="transporterId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transportadora</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a transportadora" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {transporters.map((transporter) => (
                                    <SelectItem key={transporter.id} value={transporter.id}>
                                      {transporter.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="freightValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do Frete (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormDescription>
                              Custo por animal: {formatCurrency(watchedValues.quantity > 0 ? field.value / watchedValues.quantity : 0)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Entrega Prevista</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
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

                      <FormField
                        control={form.control}
                        name="deliveryLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local de Entrega</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Endereço completo de entrega"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Documentação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da Nota Fiscal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: NF-2024-001234" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contractNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Contrato</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: CTR-2024-0456" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Informações adicionais sobre a venda"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab: Resumo Final */}
                <TabsContent value="summary" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumo da Venda
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Informações Gerais */}
                        <div>
                          <h4 className="font-medium text-sm mb-3">Informações Gerais</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Código:</span>
                              <span className="font-medium">{watchedValues.internalCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Data:</span>
                              <span className="font-medium">
                                {watchedValues.saleDate && format(watchedValues.saleDate, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Curral:</span>
                              <span className="font-medium">{selectedPen?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="font-medium">
                                {watchedValues.saleType === 'total' ? 'Venda Total' : 'Venda Parcial'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Animais */}
                        <div>
                          <h4 className="font-medium text-sm mb-3">Animais</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantidade Total:</span>
                              <span className="font-medium">{watchedValues.quantity} cabeças</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peso Total:</span>
                              <span className="font-medium">{formatWeight(watchedValues.exitWeight)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peso Médio:</span>
                              <span className="font-medium">{formatWeight(calculations.averageWeight)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rendimento:</span>
                              <span className="font-medium">{watchedValues.carcassYield}%</span>
                            </div>
                          </div>
                          
                          {watchedValues.saleType === 'partial' && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <div className="flex justify-between">
                                <span>Comum: {watchedValues.selectedAnimals.common}</span>
                                <span>China: {watchedValues.selectedAnimals.china}</span>
                                <span>Angus: {watchedValues.selectedAnimals.angus}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Valores */}
                        <div>
                          <h4 className="font-medium text-sm mb-3">Valores</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peso de Carcaça:</span>
                              <span className="font-medium">{formatWeight(calculations.carcassWeight)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total em Arrobas:</span>
                              <span className="font-medium">{calculations.totalArrobas.toFixed(2)}@</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Preço por Arroba:</span>
                              <span className="font-medium">{formatCurrency(watchedValues.pricePerArroba)}</span>
                            </div>
                            
                            <div className="pt-2 space-y-1">
                              <div className="flex justify-between font-medium">
                                <span>Valor Bruto:</span>
                                <span className="text-green-600">{formatCurrency(calculations.grossValue)}</span>
                              </div>
                              
                              {watchedValues.freightValue > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">(-) Frete:</span>
                                  <span className="text-red-600">-{formatCurrency(watchedValues.freightValue)}</span>
                                </div>
                              )}
                              
                              {calculations.commission > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">(-) Comissão:</span>
                                  <span className="text-red-600">-{formatCurrency(calculations.commission)}</span>
                                </div>
                              )}
                              
                              {calculations.discount > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">(-) Desconto:</span>
                                  <span className="text-red-600">-{formatCurrency(calculations.discount)}</span>
                                </div>
                              )}
                              
                              <Separator className="my-2" />
                              
                              <div className="flex justify-between font-bold text-base">
                                <span>Valor Líquido:</span>
                                <span className="text-green-600">{formatCurrency(calculations.netValue)}</span>
                              </div>
                              
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Valor por Animal:</span>
                                <span>{formatCurrency(calculations.valuePerAnimal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Comprador e Pagamento */}
                        <div>
                          <h4 className="font-medium text-sm mb-3">Comprador e Pagamento</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Comprador:</span>
                              <span className="font-medium">
                                {buyers.find(b => b.id === watchedValues.buyerId)?.name || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="font-medium">
                                {watchedValues.buyerType === 'slaughterhouse' ? 'Frigorífico' :
                                 watchedValues.buyerType === 'dealer' ? 'Intermediário' : 'Consumidor Final'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pagamento:</span>
                              <span className="font-medium">
                                {watchedValues.paymentType === 'cash' ? 'À Vista' :
                                 watchedValues.paymentType === 'installment' ? `Parcelado (${watchedValues.installments}x)` : 'Permuta'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prazo:</span>
                              <span className="font-medium">{watchedValues.paymentTerms} dias</span>
                            </div>
                          </div>
                        </div>

                        {/* Alerta de confirmação */}
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Verifique todos os dados antes de confirmar a venda. 
                            Esta operação irá atualizar o estoque de animais no curral selecionado.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {saleToEdit ? 'Atualizar' : 'Registrar'} Venda
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};