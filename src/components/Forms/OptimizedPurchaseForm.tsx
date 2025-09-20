import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  CalendarIcon, 
  MapPin, 
  Package, 
  DollarSign,
  Truck,
  AlertCircle,
  Check,
  X,
  User,
  Building,
  CreditCard,
  FileText,
  Calculator,
  Hash,
  Users,
  MapPinned,
  TrendingUp,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Partner } from '@/types';

// Schema de validação simplificado
const purchaseSchema = z.object({
  // Informações Básicas
  vendorId: z.string().min(1, 'Vendedor é obrigatório'),
  payerAccountId: z.string().min(1, 'Conta pagadora é obrigatória'),
  purchaseDate: z.date({
    required_error: 'Data da compra é obrigatória',
  }),
  
  // Localização
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  farm: z.string().optional(),
  
  // Informações dos Animais
  animalType: z.enum(['MALE', 'FEMALE', 'MIXED']),
  animalAge: z.number().min(0).optional(),
  initialQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  purchaseWeight: z.number().min(1, 'Peso deve ser maior que 0'),
  carcassYield: z.number().min(0).max(100),
  
  // Valores e Pagamento
  pricePerArroba: z.number().min(0.01, 'Preço deve ser maior que 0'),
  paymentType: z.enum(['CASH', 'INSTALLMENT']),
  paymentDate: z.date({
    required_error: 'Data de pagamento é obrigatória',
  }),
  
  // Frete (opcional)
  hasFreight: z.boolean().default(false),
  freightCost: z.number().min(0).optional(),
  freightDistance: z.number().min(0).optional(),
  transportCompanyId: z.string().optional(),
  
  // Corretor (opcional)
  hasBroker: z.boolean().default(false),
  brokerId: z.string().optional(),
  commission: z.number().min(0).optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  
  // Observações
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface OptimizedPurchaseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseFormData) => Promise<void>;
  partners: Partner[];
  payerAccounts: any[];
  initialData?: any; // Dados para edição
}

export function OptimizedPurchaseForm({
  open,
  onClose,
  onSubmit,
  partners,
  payerAccounts,
  initialData,
}: OptimizedPurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('origin');
  const [lotCode, setLotCode] = useState('');
  const [hasFreight, setHasFreight] = useState(false);
  const [hasBroker, setHasBroker] = useState(false);
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    mode: 'onChange',
    defaultValues: initialData ? {
      vendorId: initialData.vendorId || '',
      payerAccountId: initialData.payerAccountId || '',
      city: initialData.city || initialData.location || '',
      state: initialData.state || '',
      farm: initialData.farm || '',
      animalType: initialData.animalType || 'MALE',
      animalAge: initialData.animalAge,
      initialQuantity: initialData.initialQuantity || initialData.currentQuantity || 0,
      purchaseWeight: initialData.purchaseWeight || 0,
      carcassYield: initialData.carcassYield || 50,
      pricePerArroba: initialData.pricePerArroba || 0,
      paymentType: initialData.paymentType || 'CASH',
      purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate) : new Date(),
      paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate) : new Date(),
      hasFreight: initialData.freightCost > 0,
      freightCost: initialData.freightCost || 0,
      freightDistance: initialData.freightDistance || 0,
      transportCompanyId: initialData.transportCompanyId || '',
      hasBroker: initialData.brokerId || initialData.commission > 0,
      brokerId: initialData.brokerId || '',
      commission: initialData.commission || 0,
      commissionType: initialData.commissionType || 'PERCENTAGE',
      notes: initialData.notes || '',
    } : {
      vendorId: '',
      payerAccountId: '',
      city: '',
      state: '',
      farm: '',
      animalType: 'MALE',
      animalAge: undefined,
      initialQuantity: 0,
      purchaseWeight: 0,
      carcassYield: 50,
      pricePerArroba: 0,
      paymentType: 'CASH',
      purchaseDate: new Date(),
      paymentDate: new Date(),
      hasFreight: false,
      freightCost: 0,
      freightDistance: 0,
      transportCompanyId: '',
      hasBroker: false,
      brokerId: '',
      commission: 0,
      commissionType: 'PERCENTAGE',
      notes: '',
    },
  });

  // Gerar código do lote automaticamente
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setLotCode(`LOT-${year}${month}${day}-${random}`);
  }, [open]);

  // Sincronizar estados com dados iniciais
  useEffect(() => {
    if (initialData) {
      setHasFreight(initialData.freightCost > 0);
      setHasBroker(initialData.brokerId || initialData.commission > 0);
    } else {
      setHasFreight(false);
      setHasBroker(false);
    }
  }, [initialData, open]);

  // Watchers para cálculos automáticos
  const purchaseWeight = watch('purchaseWeight');
  const pricePerArroba = watch('pricePerArroba');
  const initialQuantity = watch('initialQuantity');
  const freightCost = watch('freightCost');
  const commission = watch('commission');
  const commissionType = watch('commissionType');
  const carcassYield = watch('carcassYield');

  // Cálculos - IMPORTANTE: O preço por arroba é baseado no peso da CARCAÇA, não no peso vivo
  const purchaseValue = useMemo(() => {
    if (purchaseWeight && pricePerArroba && carcassYield) {
      // Calcula o peso da carcaça com base no rendimento
      const carcassWeight = (purchaseWeight * carcassYield) / 100;
      // Converte para arrobas (15kg) e multiplica pelo preço
      return (carcassWeight / 15) * pricePerArroba;
    }
    return 0;
  }, [purchaseWeight, pricePerArroba, carcassYield]);

  const calculatedCommission = useMemo(() => {
    if (!hasBroker || !commission) return 0;
    if (commissionType === 'PERCENTAGE') {
      return (purchaseValue * commission) / 100;
    }
    return commission;
  }, [hasBroker, commission, commissionType, purchaseValue]);
  
  const totalCost = useMemo(() => {
    return purchaseValue + (freightCost || 0) + calculatedCommission;
  }, [purchaseValue, freightCost, calculatedCommission]);
  
  const averageWeight = useMemo(() => {
    if (purchaseWeight && initialQuantity) {
      return purchaseWeight / initialQuantity;
    }
    return 0;
  }, [purchaseWeight, initialQuantity]);

  // Filtros para parceiros
  const vendors = partners?.filter(p => p.type === 'VENDOR') || [];
  const brokers = partners?.filter(p => p.type === 'BROKER') || [];
  const transportCompanies = partners?.filter(p => p.type === 'FREIGHT_CARRIER') || [];

  const handleFormSubmit = async (data: PurchaseFormData) => {
    setIsSubmitting(true);
    try {
      // Adicionar valores calculados
      const submitData = {
        ...data,
        hasFreight,
        hasBroker,
        commission: calculatedCommission,
        totalValue: totalCost,
      };
      
      await onSubmit(submitData);
      toast.success('Compra cadastrada com sucesso!');
      reset();
      onClose();
    } catch (_error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao cadastrar compra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setHasFreight(false);
    setHasBroker(false);
    setActiveTab('origin');
    onClose();
  };

  // Reset form quando o modal abrir com dados de edição
  useEffect(() => {
    if (open && initialData) {
      reset({
        vendorId: initialData.vendorId || '',
        payerAccountId: initialData.payerAccountId || '',
        city: initialData.city || initialData.location || '',
        state: initialData.state || '',
        farm: initialData.farm || '',
        animalType: initialData.animalType || 'MALE',
        animalAge: initialData.animalAge,
        initialQuantity: initialData.initialQuantity || initialData.currentQuantity || 0,
        purchaseWeight: initialData.purchaseWeight || 0,
        carcassYield: initialData.carcassYield || 50,
        pricePerArroba: initialData.pricePerArroba || 0,
        paymentType: initialData.paymentType || 'CASH',
        purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate) : new Date(),
        paymentDate: initialData.paymentDate ? new Date(initialData.paymentDate) : new Date(),
        hasFreight: initialData.freightCost > 0,
        freightCost: initialData.freightCost || 0,
        freightDistance: initialData.freightDistance || 0,
        transportCompanyId: initialData.transportCompanyId || '',
        hasBroker: initialData.brokerId || initialData.commission > 0,
        brokerId: initialData.brokerId || '',
        commission: initialData.commission || 0,
        commissionType: initialData.commissionType || 'PERCENTAGE',
        notes: initialData.notes || '',
      });
      setActiveTab('origin');
    }
  }, [open, initialData, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {initialData ? 'Editar Compra de Gado' : 'Nova Compra de Gado'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-0.5">
                  Preencha os dados para registrar uma nova compra
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-mono">
              <Hash className="h-3 w-3 mr-1" />
              {lotCode}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ScrollArea className="h-[calc(90vh-140px)]">
            <div className="px-6 py-4">
              {/* Avisos sobre pré-requisitos */}
              {(vendors.length === 0 || payerAccounts.length === 0) && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-amber-900">Atenção: Cadastros necessários</p>
                      <p className="text-sm text-amber-700">
                        Para criar uma compra, você precisa ter cadastrado:
                      </p>
                      <ul className="text-sm text-amber-700 list-disc list-inside space-y-1 mt-2">
                        {vendors.length === 0 && (
                          <li>Pelo menos um fornecedor (Cadastros → Parceiros → Tipo: Fornecedor)</li>
                        )}
                        {payerAccounts.length === 0 && (
                          <li>Pelo menos uma conta pagadora (Cadastros → Contas)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="origin" className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    Origem
                  </TabsTrigger>
                  <TabsTrigger value="negotiation" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Negociação
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

                {/* Aba 1: Origem (Fornecedor + Localização) */}
                <TabsContent value="origin" className="space-y-6 mt-0">
                  {/* Fornecedor e Data */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Informações do Fornecedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vendorId">
                            Vendedor <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="vendorId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger className={errors.vendorId ? 'border-red-500' : ''}>
                                  <SelectValue placeholder="Selecione o vendedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {vendors.length === 0 ? (
                                    <div className="p-3 text-sm text-muted-foreground text-center">
                                      <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                                      Nenhum fornecedor cadastrado.
                                      <br />
                                      Cadastre um fornecedor primeiro.
                                    </div>
                                  ) : (
                                    vendors.map((vendor) => (
                                      <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.vendorId && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.vendorId.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchaseDate">
                            Data da Compra <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="purchaseDate"
                            control={control}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                      errors.purchaseDate && 'border-red-500'
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                                    ) : (
                                      'Selecione a data'
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
                                    locale={ptBR}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payerAccountId">
                          Conta Pagadora <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="payerAccountId"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <SelectTrigger className={errors.payerAccountId ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione a conta para pagamento" />
                              </SelectTrigger>
                              <SelectContent>
                                {payerAccounts.length === 0 ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">
                                    <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                                    Nenhuma conta cadastrada.
                                    <br />
                                    Cadastre uma conta pagadora primeiro.
                                  </div>
                                ) : (
                                  payerAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.accountName} - {account.bankName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.payerAccountId && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.payerAccountId.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Localização */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        Localização da Origem
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">
                            Cidade <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="city"
                            placeholder="Nome da cidade"
                            {...register('city')}
                            className={errors.city ? 'border-red-500' : ''}
                          />
                          {errors.city && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.city.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">
                            Estado <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                                  <SelectValue placeholder="UF" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AC">AC</SelectItem>
                                  <SelectItem value="AL">AL</SelectItem>
                                  <SelectItem value="AP">AP</SelectItem>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="BA">BA</SelectItem>
                                  <SelectItem value="CE">CE</SelectItem>
                                  <SelectItem value="DF">DF</SelectItem>
                                  <SelectItem value="ES">ES</SelectItem>
                                  <SelectItem value="GO">GO</SelectItem>
                                  <SelectItem value="MA">MA</SelectItem>
                                  <SelectItem value="MT">MT</SelectItem>
                                  <SelectItem value="MS">MS</SelectItem>
                                  <SelectItem value="MG">MG</SelectItem>
                                  <SelectItem value="PA">PA</SelectItem>
                                  <SelectItem value="PB">PB</SelectItem>
                                  <SelectItem value="PR">PR</SelectItem>
                                  <SelectItem value="PE">PE</SelectItem>
                                  <SelectItem value="PI">PI</SelectItem>
                                  <SelectItem value="RJ">RJ</SelectItem>
                                  <SelectItem value="RN">RN</SelectItem>
                                  <SelectItem value="RS">RS</SelectItem>
                                  <SelectItem value="RO">RO</SelectItem>
                                  <SelectItem value="RR">RR</SelectItem>
                                  <SelectItem value="SC">SC</SelectItem>
                                  <SelectItem value="SP">SP</SelectItem>
                                  <SelectItem value="SE">SE</SelectItem>
                                  <SelectItem value="TO">TO</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.state && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.state.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="farm">Fazenda</Label>
                        <Input
                          id="farm"
                          placeholder="Nome da fazenda (opcional)"
                          {...register('farm')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba 2: Negociação (Animais + Financeiro) */}
                <TabsContent value="negotiation" className="space-y-6 mt-0">
                  {/* Características dos Animais */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        Informações do Lote
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="animalType">
                            Tipo <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="animalType"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MALE">Macho</SelectItem>
                                  <SelectItem value="FEMALE">Fêmea</SelectItem>
                                  <SelectItem value="MIXED">Misto</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="initialQuantity">
                            Quantidade <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="initialQuantity"
                            type="number"
                            placeholder="0"
                            {...register('initialQuantity', { valueAsNumber: true })}
                            className={errors.initialQuantity ? 'border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="animalAge">Idade (meses)</Label>
                          <Input
                            id="animalAge"
                            type="number"
                            placeholder="0"
                            {...register('animalAge', { valueAsNumber: true })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="purchaseWeight">
                            Peso Total (kg) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="purchaseWeight"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register('purchaseWeight', { valueAsNumber: true })}
                            className={errors.purchaseWeight ? 'border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="carcassYield">
                            Rendimento (%) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="carcassYield"
                            type="number"
                            step="0.1"
                            placeholder="50"
                            {...register('carcassYield', { valueAsNumber: true })}
                            className={errors.carcassYield ? 'border-red-500' : ''}
                          />
                        </div>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Valores e Pagamento */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Valores e Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pricePerArroba">
                            Preço por @ (R$) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="pricePerArroba"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register('pricePerArroba', { valueAsNumber: true })}
                            className={errors.pricePerArroba ? 'border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentType">
                            Condição <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="paymentType"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">À Vista</SelectItem>
                                  <SelectItem value="INSTALLMENT">A Prazo</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">
                          Data de Pagamento <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="paymentDate"
                          control={control}
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                    errors.paymentDate && 'border-red-500'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                                  ) : (
                                    'Selecione a data de pagamento'
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  locale={ptBR}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>

                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba 3: Logística (Frete + Corretor) */}
                <TabsContent value="logistics" className="space-y-6 mt-0">
                  {/* Frete */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-500" />
                          Informações de Frete
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="hasFreight" className="text-sm font-normal">
                            Incluir frete
                          </Label>
                          <Switch
                            id="hasFreight"
                            checked={hasFreight}
                            onCheckedChange={(checked) => {
                              setHasFreight(checked);
                              setValue('hasFreight', checked);
                              if (!checked) {
                                setValue('freightCost', undefined);
                                setValue('freightDistance', undefined);
                                setValue('transportCompanyId', undefined);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    {hasFreight && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="transportCompanyId">Transportadora</Label>
                          <Controller
                            name="transportCompanyId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a transportadora (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  {transportCompanies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="freightCostPerKm">Valor R$/km</Label>
                            <Input
                              id="freightCostPerKm"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => {
                                const costPerKm = parseFloat(e.target.value) || 0;
                                const distance = watch('freightDistance') || 0;
                                setValue('freightCost', costPerKm * distance);
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="freightDistance">Distância (km)</Label>
                            <Input
                              id="freightDistance"
                              type="number"
                              placeholder="0"
                              {...register('freightDistance', { valueAsNumber: true })}
                              onChange={(e) => {
                                const distance = parseFloat(e.target.value) || 0;
                                setValue('freightDistance', distance);
                                const costPerKmEl = document.getElementById('freightCostPerKm') as HTMLInputElement;
                                const costPerKm = parseFloat(costPerKmEl?.value) || 0;
                                setValue('freightCost', costPerKm * distance);
                              }}
                            />
                          </div>
                        </div>

                      </CardContent>
                    )}
                  </Card>

                  {/* Corretor */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          Informações do Corretor
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="hasBroker" className="text-sm font-normal">
                            Incluir corretor
                          </Label>
                          <Switch
                            id="hasBroker"
                            checked={hasBroker}
                            onCheckedChange={(checked) => {
                              setHasBroker(checked);
                              setValue('hasBroker', checked);
                              if (!checked) {
                                setValue('brokerId', undefined);
                                setValue('commission', undefined);
                                setValue('commissionType', undefined);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    {hasBroker && (
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="brokerId">Corretor</Label>
                          <Controller
                            name="brokerId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o corretor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {brokers.map((broker) => (
                                    <SelectItem key={broker.id} value={broker.id}>
                                      {broker.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="commissionType">Tipo de Comissão</Label>
                            <Controller
                              name="commissionType"
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || 'FIXED'}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="FIXED">Valor Fixo</SelectItem>
                                    <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="commission">
                              {commissionType === 'PERCENTAGE' ? 'Comissão (%)' : 'Comissão (R$)'}
                            </Label>
                            <Input
                              id="commission"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...register('commission', { valueAsNumber: true })}
                            />
                          </div>
                        </div>

                      </CardContent>
                    )}
                  </Card>

                  {/* Observações */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Informações adicionais sobre a compra..."
                        className="min-h-[100px] resize-none"
                        {...register('notes')}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba 4: Resumo - Todos os cálculos consolidados */}
                <TabsContent value="summary" className="space-y-4 mt-0">
                  {/* Grid de cards de resumo */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Card Quantidade */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Quantidade Total
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{initialQuantity || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          cabeças de gado
                        </p>
                      </CardContent>
                    </Card>

                    {/* Card Peso Total */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Peso Total
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(purchaseWeight || 0).toLocaleString('pt-BR')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          kg ({(purchaseWeight / 30).toFixed(1)} @ vivo)
                        </p>
                      </CardContent>
                    </Card>

                    {/* Card Peso Médio */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Peso Médio/Animal
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{averageWeight.toFixed(1)} kg</div>
                        <p className="text-xs text-muted-foreground">
                          {(averageWeight / 30).toFixed(2)} @ vivo • {carcassYield > 0 ? `${((averageWeight * carcassYield / 100) / 15).toFixed(2)} @ carcaça` : 'Informe rendimento'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Card Rendimento */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Rendimento
                        </CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{carcassYield || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                          de carcaça
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cards de valores financeiros */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Valor da Compra */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Valor da Compra
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          R$ {(pricePerArroba || 0).toFixed(2)} por @ carcaça
                        </p>
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-sm font-medium">
                            R$ {initialQuantity > 0 ? (purchaseValue / initialQuantity).toFixed(2) : '0,00'}
                          </div>
                          <p className="text-xs text-muted-foreground">por animal</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Custos Adicionais */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Custos Adicionais
                        </CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <span className="text-sm">Frete</span>
                            </div>
                            <span className="text-sm font-medium">
                              R$ {(freightCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {freightCost > 0 && watch('freightDistance') > 0 && (
                            <p className="text-xs text-muted-foreground ml-4">
                              {watch('freightDistance')} km × R$ {(freightCost / watch('freightDistance')).toFixed(2)}/km
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-purple-500" />
                              <span className="text-sm">Comissão</span>
                            </div>
                            <span className="text-sm font-medium">
                              R$ {calculatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {calculatedCommission > 0 && (
                            <p className="text-xs text-muted-foreground ml-4">
                              {commissionType === 'PERCENTAGE' ? `${commission}% do valor` : 'Valor fixo'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Geral */}
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Custo Total
                        </CardTitle>
                        <Check className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                          R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Valor final com todos os custos
                        </p>
                        <div className="mt-3 space-y-1 pt-3 border-t border-green-200">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Compra:</span>
                            <span>R$ {purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Frete:</span>
                            <span>R$ {(freightCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Comissão:</span>
                            <span>R$ {calculatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Card de Memória de Cálculo Detalhada */}
                  {purchaseWeight > 0 && initialQuantity > 0 && pricePerArroba > 0 && carcassYield > 0 && (
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-gray-500" />
                          Memória de Cálculo Detalhada
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4">
                          <p className="text-sm text-amber-800">
                            ⚠️ <strong>Importante:</strong> O preço por arroba é aplicado sobre o peso da CARCAÇA (15kg/@), não sobre o peso vivo (30kg/@)
                          </p>
                        </div>
                        
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Passo a passo do cálculo:</h4>
                          
                          <div className="space-y-2 font-mono text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">1.</span>
                              <div>
                                <p className="text-gray-700">Peso total da carcaça:</p>
                                <p className="text-gray-600 ml-4">
                                  {purchaseWeight.toLocaleString('pt-BR')} kg × {carcassYield}% = 
                                  <span className="font-semibold"> {(purchaseWeight * carcassYield / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">2.</span>
                              <div>
                                <p className="text-gray-700">Peso de carcaça por animal:</p>
                                <p className="text-gray-600 ml-4">
                                  {(purchaseWeight * carcassYield / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg ÷ {initialQuantity} animais = 
                                  <span className="font-semibold"> {((purchaseWeight * carcassYield / 100) / initialQuantity).toFixed(2)} kg/animal</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">3.</span>
                              <div>
                                <p className="text-gray-700">Conversão para arrobas de carcaça:</p>
                                <p className="text-gray-600 ml-4">
                                  {((purchaseWeight * carcassYield / 100) / initialQuantity).toFixed(2)} kg ÷ 15 kg/@ = 
                                  <span className="font-semibold"> {(((purchaseWeight * carcassYield / 100) / initialQuantity) / 15).toFixed(2)} @/animal</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">4.</span>
                              <div>
                                <p className="text-gray-700">Valor por animal:</p>
                                <p className="text-gray-600 ml-4">
                                  {(((purchaseWeight * carcassYield / 100) / initialQuantity) / 15).toFixed(2)} @ × R$ {pricePerArroba.toFixed(2)}/@ = 
                                  <span className="font-semibold text-green-600"> R$ {((((purchaseWeight * carcassYield / 100) / initialQuantity) / 15) * pricePerArroba).toFixed(2)}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <span className="text-gray-500">5.</span>
                              <div>
                                <p className="text-gray-700">Valor total da compra:</p>
                                <p className="text-gray-600 ml-4">
                                  R$ {((((purchaseWeight * carcassYield / 100) / initialQuantity) / 15) * pricePerArroba).toFixed(2)} × {initialQuantity} animais = 
                                  <span className="font-semibold text-green-600"> R$ {purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Footer com ações */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Object.keys(errors).length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {Object.keys(errors).length} campo(s) pendente(s)
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid || vendors.length === 0 || payerAccounts.length === 0}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {initialData ? 'Salvar Alterações' : 'Confirmar Compra'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
