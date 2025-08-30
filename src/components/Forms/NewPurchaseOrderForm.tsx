import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon,
  DollarSign,
  Package,
  Scale,
  Truck,
  Calculator,
  User,
  CreditCard,
  MapPin,
  FileText,
  AlertCircle,
  Building2,
  Hash
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { cn } from '@/lib/utils';
import { brazilianStates, getCitiesByState, formatLocation } from '@/utils/brazilianCities';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Schema de validação
const purchaseOrderSchema = z.object({
  // Informações básicas
  orderNumber: z.string().min(1, 'Número da ordem é obrigatório'),
  vendorId: z.string().min(1, 'Fornecedor é obrigatório'),
  brokerId: z.string().optional().nullable(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  purchaseDate: z.date({
    required_error: 'Data da compra é obrigatória',
  }),
  
  // Informações do gado
  animalCount: z.number().min(1, 'Quantidade deve ser maior que 0'),
  animalType: z.enum(['MALE', 'FEMALE', 'MIXED']),
  totalWeight: z.number().min(1, 'Peso total deve ser maior que 0'),
  averageWeight: z.number().optional(),
  carcassYield: z.number().min(0).max(100),
  pricePerArroba: z.number().min(0, 'Preço por arroba não pode ser negativo'),
  
  // Comissão do corretor
  hasBrokerCommission: z.boolean().optional(),
  commission: z.number().min(0).optional(),
  commissionPaymentType: z.enum(['CASH', 'INSTALLMENT']).optional(),
  commissionDueDate: z.date().optional(),
  
  // Informações de frete
  transportCompanyId: z.string().optional().nullable(),
  freightDistance: z.number().min(0).optional(),
  freightCostPerKm: z.number().min(0).optional(),
  freightCost: z.number().optional(),
  freightPaymentType: z.enum(['CASH', 'INSTALLMENT']).optional(),
  freightDueDate: z.date().optional(),
  
  // Informações de pagamento
  payerAccountId: z.string().min(1, 'Conta de pagamento é obrigatória'),
  paymentType: z.enum(['CASH', 'INSTALLMENT', 'MIXED']),
  paymentTerms: z.string().optional(),
  principalDueDate: z.date({
    required_error: 'Data de vencimento é obrigatória',
  }),
  
  // Observações
  notes: z.string().optional(),
  
  // Campos calculados (salvos para histórico)
  totalValue: z.number().optional(),
  otherCosts: z.number().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface NewPurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
  onSuccess?: () => void;
  initialData?: any;
  orderData?: any; // Para compatibilidade com o CompleteLots
  isEditing?: boolean;
}

export const NewPurchaseOrderForm: React.FC<NewPurchaseOrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  initialData,
  orderData,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedState, setSelectedState] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Hooks de API
  const { partners, loadPartners } = usePartnersApi();
  const { accounts, loadAccounts } = usePayerAccountsApi();

  // Filtrar parceiros por tipo
  const vendors = partners.filter(p => p.type === 'VENDOR');
  const brokers = partners.filter(p => p.type === 'BROKER');
  const freightCarriers = partners.filter(p => p.type === 'FREIGHT_CARRIER');

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      orderNumber: '',
      vendorId: '',
      brokerId: null,
      city: '',
      state: '',
      purchaseDate: new Date(),
      animalCount: 0,
      animalType: 'MALE',
      totalWeight: 0,
      carcassYield: 50,
      pricePerArroba: 0,
      hasBrokerCommission: false,
      commission: 0,
      commissionPaymentType: 'CASH',
      commissionDueDate: new Date(),
      transportCompanyId: null,
      freightDistance: 0,
      freightCostPerKm: 0,
      freightPaymentType: 'CASH',
      freightDueDate: new Date(),
      payerAccountId: '',
      paymentType: 'CASH',
      principalDueDate: new Date(),
      notes: '',
      ...(initialData || orderData),
    },
  });

  // Estados para cálculos
  const [calculations, setCalculations] = useState({
    averageWeight: 0,
    pricePerArroba: 0,
    totalPurchasePrice: 0,
    totalFreightCost: 0,
    brokerCommissionValue: 0,
    costPerHead: 0,
    costPerKg: 0,
    totalCostWithFreight: 0,
    carcassWeight: 0,
    carcassArrobas: 0,
    liveWeightArrobas: 0,
    costPerCarcassKg: 0,
  });

  // Carregar dados
  useEffect(() => {
    loadPartners();
    loadAccounts();
  }, []);

  // Gerar número da ordem automaticamente
  useEffect(() => {
    if (!isEditing && !form.getValues('orderNumber')) {
      const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
      form.setValue('orderNumber', orderNumber);
    }
  }, [isEditing, form]);

  // Atualizar cidades quando estado mudar
  useEffect(() => {
    if (selectedState) {
      const cities = getCitiesByState(selectedState);
      setAvailableCities(cities);
      // Limpar cidade selecionada quando mudar o estado
      form.setValue('city', '');
    }
  }, [selectedState, form]);

  // Inicializar estado e cidade se existir dados iniciais
  useEffect(() => {
    const data = initialData || orderData;
    
    // Debug: verificar dados recebidos
    if (isEditing && data) {
      console.log('🔍 Modo edição - Dados recebidos:', data);
      
      // Preencher TODOS os campos com os dados existentes
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== null && value !== undefined) {
          // Converter datas para objetos Date
          if (key.includes('Date') && value) {
            form.setValue(key as any, new Date(value));
          } 
          // Converter tipos de pagamento
          else if (key === 'freightPaymentType' && value) {
            form.setValue('freightPaymentType', value === 'installment' ? 'INSTALLMENT' : 'CASH');
          }
          else if (key === 'commissionPaymentType' && value) {
            form.setValue('commissionPaymentType', value === 'installment' ? 'INSTALLMENT' : 'CASH');
          }
          // Se tem comissão, marcar checkbox
          else if (key === 'commission' && value > 0) {
            form.setValue('hasBrokerCommission', true);
            form.setValue('commission', value);
          }
          // Outros campos
          else if (form.getValues(key as any) !== undefined) {
            form.setValue(key as any, value);
          }
        }
      });
    }
    
    if (data && data.location) {
      // Tentar extrair cidade e estado do campo location existente
      const parts = data.location.split(' - ');
      if (parts.length === 2) {
        const state = parts[1].trim();
        const city = parts[0].trim();
        setSelectedState(state);
        form.setValue('state', state);
        form.setValue('city', city);
      } else {
        // Se não conseguir extrair, deixar o valor original no campo location
        form.setValue('city', data.location);
      }
    }
  }, [initialData, orderData, isEditing]);

  // Observar mudanças e recalcular
  const watchedValues = form.watch();
  
  useEffect(() => {
    const animalCount = Number(watchedValues.animalCount) || 0;
    const totalWeight = Number(watchedValues.totalWeight) || 0;
    const carcassYield = Number(watchedValues.carcassYield) || 50;
    const pricePerArroba = Number(watchedValues.pricePerArroba) || 0;
    const freightDistance = Number(watchedValues.freightDistance) || 0;
    const freightCostPerKm = Number(watchedValues.freightCostPerKm) || 0;
    const hasBrokerCommission = watchedValues.hasBrokerCommission || false;
    const commission = Number(watchedValues.commission) || 0;

    // Cálculos básicos
    const averageWeight = animalCount > 0 ? totalWeight / animalCount : 0;
    
    // Cálculo do peso da carcaça (peso vivo * rendimento)
    const carcassWeight = totalWeight * (carcassYield / 100);
    const carcassArrobas = carcassWeight / 15;
    
    // Arrobas do peso vivo (para referência)
    const liveWeightArrobas = totalWeight / 30;
    
    // Valor total baseado no peso da carcaça
    const totalValue = pricePerArroba * carcassArrobas;
    
    // Cálculo de frete
    const freightCost = freightDistance * freightCostPerKm;
    
    // Custos totais
    const totalCostWithFreight = totalValue + freightCost + (hasBrokerCommission ? commission : 0);
    const costPerHead = animalCount > 0 ? totalCostWithFreight / animalCount : 0;
    const costPerKg = totalWeight > 0 ? totalCostWithFreight / totalWeight : 0;
    const costPerCarcassKg = carcassWeight > 0 ? totalCostWithFreight / carcassWeight : 0;

    setCalculations({
      averageWeight,
      pricePerArroba,
      totalPurchasePrice: totalValue,
      totalFreightCost: freightCost,
      brokerCommissionValue: hasBrokerCommission ? commission : 0,
      costPerHead,
      costPerKg,
      totalCostWithFreight,
      carcassWeight,
      carcassArrobas,
      liveWeightArrobas,
      costPerCarcassKg,
    });
    
    // Atualizar campos no form sem causar re-render
    form.setValue('averageWeight', averageWeight, { shouldValidate: false, shouldDirty: false });
    form.setValue('totalValue', totalValue, { shouldValidate: false, shouldDirty: false });
    form.setValue('freightCost', freightCost, { shouldValidate: false, shouldDirty: false });
  }, [watchedValues]);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    setLoading(true);
    try {
      // Combinar cidade e estado para compatibilidade com backend
      const location = formatLocation(data.city, data.state);
      
      // Limpar valores nulos e ajustar dados
      const cleanData = {
        ...data,
        location, // Adicionar campo location combinado
        brokerId: data.brokerId === 'none' ? null : data.brokerId,
        transportCompanyId: data.transportCompanyId === 'none' ? null : data.transportCompanyId,
        notes: data.notes || '',
        averageWeight: calculations.averageWeight,
        totalValue: calculations.totalPurchasePrice,
        freightCost: calculations.totalFreightCost,
        otherCosts: 0,
        commission: data.hasBrokerCommission ? data.commission : 0,
      };

      // Incluir todos os campos calculados
      const completeData = {
        ...cleanData,
        ...calculations,
        // Garantir que todos os valores sejam salvos
        purchaseDate: data.purchaseDate,
        principalDueDate: data.principalDueDate,
        status: 'PENDING',
        currentStage: 'created',
        
        // Campos calculados essenciais
        averageWeight: calculations.averageWeight,
        totalValue: calculations.totalPurchasePrice,
        freightCost: calculations.totalFreightCost,
        commission: data.hasBrokerCommission ? data.commission || 0 : 0,
        commissionDueDate: data.commissionDueDate || data.principalDueDate,
        otherCosts: 0,
        otherCostsDueDate: data.principalDueDate,
        
        // Informações completas do gado
        animalCount: data.animalCount,
        animalType: data.animalType,
        totalWeight: data.totalWeight,
        carcassYield: data.carcassYield,
        pricePerArroba: data.pricePerArroba,
        
        // Informações de frete
        freightDistance: data.freightDistance || 0,
        freightCostPerKm: data.freightCostPerKm || 0,
        transportCompany: data.transportCompanyId && data.transportCompanyId !== 'none' 
          ? partners.find(p => p.id === data.transportCompanyId)?.name || null
          : null,
        freightPaymentType: data.freightPaymentType === 'INSTALLMENT' ? 'installment' : 'cash',
        freightDueDate: data.freightDueDate || data.principalDueDate,
        
        // Informações de pagamento
        payerAccountId: data.payerAccountId,
        paymentType: data.paymentType,
        paymentTerms: data.paymentTerms || '',
        
        // Observações
        notes: data.notes || '',
        
        // Criar lote automaticamente com os dados
        cattleLot: {
          lotNumber: `LOT-${data.orderNumber}`,
          entryDate: data.purchaseDate,
          entryWeight: data.totalWeight,
          entryQuantity: data.animalCount, // Corrigido: usar animalCount
          currentQuantity: data.animalCount,
          acquisitionCost: calculations.totalPurchasePrice,
          freightCost: calculations.totalFreightCost,
          totalCost: calculations.totalCostWithFreight,
          status: 'PENDING', // Iniciar como PENDING até recepção
        }
      };

      // Log para debug - verificar dados sendo enviados
      console.log('🚀 Dados sendo enviados para o backend:', {
        formData: data,
        calculations: calculations,
        completeData: completeData
      });
      
      if (onSubmit) {
        await onSubmit(completeData);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      form.reset();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar ordem de compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? 'Editar Ordem de Compra' : 'Nova Ordem de Compra'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Preencha os dados da compra de gado
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-sm px-2 py-1">
              <Hash className="h-3 w-3 mr-1" />
              {form.watch('orderNumber')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="basic">
                    <Building2 className="h-4 w-4 mr-2" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="cattle">
                    <Package className="h-4 w-4 mr-2" />
                    Gado
                  </TabsTrigger>
                  <TabsTrigger value="freight">
                    <Truck className="h-4 w-4 mr-2" />
                    Frete
                  </TabsTrigger>
                  <TabsTrigger value="payment">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagamento
                  </TabsTrigger>
                </TabsList>

                {/* Aba Informações Básicas */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Compra</FormLabel>
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
                                    format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
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

                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedState(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brazilianStates.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name} ({state.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Estado onde o gado será adquirido
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedState || availableCities.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedState 
                                  ? "Primeiro selecione o estado" 
                                  : "Selecione a cidade"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cidade onde o gado será adquirido
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="brokerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Corretor</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o corretor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sem corretor</SelectItem>
                              {brokers.map((broker) => (
                                <SelectItem key={broker.id} value={broker.id}>
                                  {broker.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('brokerId') && form.watch('brokerId') !== 'none' && (
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <FormField
                          control={form.control}
                          name="hasBrokerCommission"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Incluir comissão do corretor
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {form.watch('hasBrokerCommission') && (
                          <FormField
                            control={form.control}
                            name="commission"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Label>Valor:</Label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-10 w-32"
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        placeholder="0,00"
                                      />
                                    </div>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          {/* Condição de pagamento da comissão */}
                          <div className="flex items-center gap-4 mt-2">
                            <FormField
                              control={form.control}
                              name="commissionPaymentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Label>Pagamento:</Label>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="CASH">À Vista</SelectItem>
                                          <SelectItem value="INSTALLMENT">A Prazo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            {form.watch('commissionPaymentType') === 'INSTALLMENT' && (
                              <FormField
                                control={form.control}
                                name="commissionDueDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Label>Vencimento:</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                "w-36 justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                              )}
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
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
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre a compra..."
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Aba Informações do Gado */}
                <TabsContent value="cattle" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="animalCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Cabeças *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input 
                                type="number"
                                className="pl-10"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Total (kg) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input 
                                type="number"
                                className="pl-10"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="animalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Animal *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MALE">Macho</SelectItem>
                              <SelectItem value="FEMALE">Fêmea</SelectItem>
                              <SelectItem value="MIXED">Misto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="carcassYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rendimento de Carcaça (%) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number"
                                min="0"
                                max="100"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="50"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Percentual de aproveitamento da carcaça
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pricePerArroba"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Arroba (R$/@) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                              type="number"
                              step="0.01"
                              className="pl-10"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0,00"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Valor negociado por arroba (@)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cards de Informações Calculadas */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Peso Médio por Animal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-bold">
                            {calculations.averageWeight.toFixed(1)} kg
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(calculations.averageWeight / 30).toFixed(1)} @/cabeça
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Arrobas Peso Vivo
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-bold">
                            {calculations.liveWeightArrobas.toFixed(0)} @
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Peso total / 30kg
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Arrobas de Carcaça
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-bold text-primary">
                            {calculations.carcassArrobas.toFixed(0)} @
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Com {watchedValues.carcassYield || 50}% de rendimento
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Resumo de Pesos e Valores</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Peso Total Vivo:</p>
                            <p className="font-semibold">{(watchedValues.totalWeight || 0).toLocaleString()} kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Peso Total Carcaça:</p>
                            <p className="font-semibold">{calculations.carcassWeight.toFixed(0)} kg</p>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor Total (R$/@):</span>
                          <span className="font-medium">
                            {formatCurrency(watchedValues.pricePerArroba || 0)} × {calculations.carcassArrobas.toFixed(0)} @
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Valor da Compra:</span>
                          <span className="font-bold text-base text-primary">
                            {formatCurrency(calculations.totalPurchasePrice)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Aba Frete */}
                <TabsContent value="freight" className="space-y-6 mt-6">
                  <FormField
                    control={form.control}
                    name="transportCompanyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transportadora</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a transportadora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem frete</SelectItem>
                            {freightCarriers.map((carrier) => (
                              <SelectItem key={carrier.id} value={carrier.id}>
                                {carrier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Deixe vazio se não houver frete terceirizado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('transportCompanyId') && form.watch('transportCompanyId') !== 'none' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="freightDistance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Distância (km)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input 
                                    type="number"
                                    className="pl-10"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    placeholder="0"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="freightCostPerKm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor por km (R$/km)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    className="pl-10"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    placeholder="0,00"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Card className="bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">Cálculo do Frete</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {watchedValues.freightDistance || 0} km × {formatCurrency(watchedValues.freightCostPerKm || 0)}
                            </span>
                            <span className="text-lg font-bold">
                              {formatCurrency(calculations.totalFreightCost)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Condição de pagamento do frete */}
                      {calculations.totalFreightCost > 0 && (
                        <div className="space-y-4 mt-4">
                          <div className="flex items-center gap-4">
                            <FormField
                              control={form.control}
                              name="freightPaymentType"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Condição de Pagamento do Frete</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CASH">À Vista</SelectItem>
                                        <SelectItem value="INSTALLMENT">A Prazo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {form.watch('freightPaymentType') === 'INSTALLMENT' && (
                              <FormField
                                control={form.control}
                                name="freightDueDate"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel>Data de Vencimento do Frete</FormLabel>
                                    <FormControl>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione a data"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
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
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Aba Pagamento */}
                <TabsContent value="payment" className="space-y-6 mt-6">
                  <FormField
                    control={form.control}
                    name="payerAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta de Pagamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{account.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {account.type}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CASH">À Vista</SelectItem>
                              <SelectItem value="INSTALLMENT">Parcelado</SelectItem>
                              <SelectItem value="MIXED">Misto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="principalDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento *</FormLabel>
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
                                    format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
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
                  </div>

                  {(watchedValues.paymentType === 'INSTALLMENT' || watchedValues.paymentType === 'MIXED') && (
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condições de Pagamento</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Ex: 3x de R$ 10.000,00"
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Descreva as condições de parcelamento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </Tabs>

              {/* Resumo Final - Sempre visível */}
              <Card className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumo da Compra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                      <p className="font-semibold">{watchedValues.animalCount || 0} cabeças</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Peso Total</p>
                      <p className="font-semibold">{(watchedValues.totalWeight || 0).toLocaleString()} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Peso Médio</p>
                      <p className="font-semibold">{calculations.averageWeight.toFixed(1)} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Valor/@</p>
                      <p className="font-semibold">{formatCurrency(watchedValues.pricePerArroba || 0)}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Valor da Compra:</span>
                      <span className="font-medium">{formatCurrency(calculations.totalPurchasePrice)}</span>
                    </div>
                    
                    {calculations.totalFreightCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Valor do Frete:</span>
                        <span className="font-medium">{formatCurrency(calculations.totalFreightCost)}</span>
                      </div>
                    )}
                    
                    {calculations.brokerCommissionValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Comissão do Corretor:</span>
                        <span className="font-medium">{formatCurrency(calculations.brokerCommissionValue)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-base font-bold">
                      <span>Custo Total:</span>
                      <span className="text-primary">{formatCurrency(calculations.totalCostWithFreight)}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Custo/Cabeça</p>
                        <p className="font-semibold">{formatCurrency(calculations.costPerHead)}</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Custo/kg Vivo</p>
                        <p className="font-semibold">{formatCurrency(calculations.costPerKg)}</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-xs text-muted-foreground">Custo/kg Carcaça</p>
                        <p className="font-semibold">{formatCurrency(calculations.costPerCarcassKg)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button size="sm" type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            size="sm"
            onClick={form.handleSubmit(handleSubmit)} 
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Ordem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};