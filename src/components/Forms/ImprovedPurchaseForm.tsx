import React, { useState, useEffect } from 'react';
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
  DialogFooter,
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
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Partner } from '@/types';

// Schema de validação
const purchaseSchema = z.object({
  // Informações Básicas
  vendorId: z.string().min(1, 'Vendedor é obrigatório'),
  brokerId: z.string().optional(),
  payerAccountId: z.string().min(1, 'Conta pagadora é obrigatória'),
  purchaseDate: z.date({
    required_error: 'Data da compra é obrigatória',
  }),
  
  // Localização
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  farm: z.string().optional(),
  
  // Informações dos Animais
  animalType: z.enum(['MALE', 'FEMALE', 'MIXED']),
  animalAge: z.number().min(0).optional(),
  initialQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  purchaseWeight: z.number().min(1, 'Peso deve ser maior que 0'),
  carcassYield: z.number().min(0).max(100),
  
  // Valores e Pagamento
  pricePerArroba: z.number().min(0.01, 'Preço deve ser maior que 0'),
  paymentType: z.enum(['CASH', 'INSTALLMENT', 'BARTER']),
  paymentTerms: z.string().optional(),
  principalDueDate: z.date().optional(),
  
  // Custos Adicionais
  freightCost: z.number().min(0).optional(),
  freightDistance: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
  
  // Observações
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface ImprovedPurchaseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseFormData) => Promise<void>;
  partners: Partner[];
  payerAccounts: any[];
}

export function ImprovedPurchaseForm({
  open,
  onClose,
  onSubmit,
  partners,
  payerAccounts,
}: ImprovedPurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, dirtyFields },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    mode: 'onChange',
    defaultValues: {
      animalType: 'MALE',
      paymentType: 'CASH',
      carcassYield: 50,
      purchaseDate: new Date(),
    },
  });

  // Watchers para cálculos automáticos
  const purchaseWeight = watch('purchaseWeight');
  const pricePerArroba = watch('pricePerArroba');
  const initialQuantity = watch('initialQuantity');
  const freightCost = watch('freightCost');
  const commission = watch('commission');

  // Cálculos
  const purchaseValue = purchaseWeight && pricePerArroba 
    ? (purchaseWeight / 30) * pricePerArroba 
    : 0;
  
  const totalCost = purchaseValue + (freightCost || 0) + (commission || 0);
  
  const averageWeight = purchaseWeight && initialQuantity 
    ? purchaseWeight / initialQuantity 
    : 0;

  // Filtros para parceiros
  const vendors = partners?.filter(p => p.type === 'VENDOR') || [];
  const brokers = partners?.filter(p => p.type === 'BROKER') || [];

  const handleFormSubmit = async (data: PurchaseFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Compra cadastrada com sucesso!');
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao cadastrar compra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (Object.keys(dirtyFields).length > 0) {
      if (confirm('Existem alterações não salvas. Deseja realmente sair?')) {
        reset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nova Compra de Gado
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="px-6 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Básico
                  </TabsTrigger>
                  <TabsTrigger value="animals" className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Animais
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informações do Fornecedor</CardTitle>
                      <CardDescription>Dados do vendedor e corretor</CardDescription>
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
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className={errors.vendorId ? 'border-red-500' : ''}>
                                  <SelectValue placeholder="Selecione o vendedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {vendors.map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>
                                      {vendor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.vendorId && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.vendorId.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brokerId">Corretor</Label>
                          <Controller
                            name="brokerId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o corretor (opcional)" />
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payerAccountId">
                            Conta Pagadora <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="payerAccountId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className={errors.payerAccountId ? 'border-red-500' : ''}>
                                  <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                  {payerAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.accountName} - {account.bankName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.payerAccountId && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.payerAccountId.message}
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
                          {errors.purchaseDate && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.purchaseDate.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="animals" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Características dos Animais</CardTitle>
                      <CardDescription>Informações sobre o lote</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="animalType">
                            Tipo de Animal <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="animalType"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
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
                          <Label htmlFor="animalAge">Idade (meses)</Label>
                          <Input
                            id="animalAge"
                            type="number"
                            placeholder="Ex: 18"
                            {...register('animalAge', { valueAsNumber: true })}
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
                            placeholder="Ex: 50"
                            {...register('carcassYield', { valueAsNumber: true })}
                            className={errors.carcassYield ? 'border-red-500' : ''}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="initialQuantity">
                            Quantidade de Animais <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="initialQuantity"
                            type="number"
                            placeholder="Ex: 100"
                            {...register('initialQuantity', { valueAsNumber: true })}
                            className={errors.initialQuantity ? 'border-red-500' : ''}
                          />
                          {errors.initialQuantity && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.initialQuantity.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchaseWeight">
                            Peso Total (kg) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="purchaseWeight"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 45000"
                            {...register('purchaseWeight', { valueAsNumber: true })}
                            className={errors.purchaseWeight ? 'border-red-500' : ''}
                          />
                          {errors.purchaseWeight && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.purchaseWeight.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {averageWeight > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-700">
                            <Calculator className="h-4 w-4" />
                            <span className="font-medium">Peso Médio:</span>
                            <span>{averageWeight.toFixed(2)} kg/animal</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Valores e Pagamento</CardTitle>
                      <CardDescription>Informações financeiras da compra</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pricePerArroba">
                            Preço por Arroba (R$) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="pricePerArroba"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 280.00"
                            {...register('pricePerArroba', { valueAsNumber: true })}
                            className={errors.pricePerArroba ? 'border-red-500' : ''}
                          />
                          {errors.pricePerArroba && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.pricePerArroba.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentType">
                            Tipo de Pagamento <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="paymentType"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">À Vista</SelectItem>
                                  <SelectItem value="INSTALLMENT">Parcelado</SelectItem>
                                  <SelectItem value="BARTER">Permuta</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                          <Input
                            id="paymentTerms"
                            placeholder="Ex: 30/60/90 dias"
                            {...register('paymentTerms')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="principalDueDate">Data de Vencimento</Label>
                          <Controller
                            name="principalDueDate"
                            control={control}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground'
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
                                    disabled={(date) => date < new Date()}
                                    locale={ptBR}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Custos Adicionais</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="freightCost">Frete (R$)</Label>
                            <Input
                              id="freightCost"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...register('freightCost', { valueAsNumber: true })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="freightDistance">Distância (km)</Label>
                            <Input
                              id="freightDistance"
                              type="number"
                              placeholder="0"
                              {...register('freightDistance', { valueAsNumber: true })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="commission">Comissão (R$)</Label>
                            <Input
                              id="commission"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...register('commission', { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                      </div>

                      {purchaseValue > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Valor da Compra:</span>
                              <span className="font-medium">
                                R$ {purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {(freightCost || commission) && (
                              <>
                                <Separator />
                                {freightCost && (
                                  <div className="flex justify-between text-sm">
                                    <span>Frete:</span>
                                    <span>R$ {freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                                {commission && (
                                  <div className="flex justify-between text-sm">
                                    <span>Comissão:</span>
                                    <span>R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span className="text-green-700">
                                R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Localização</CardTitle>
                      <CardDescription>Origem dos animais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="farm">Fazenda</Label>
                          <Input
                            id="farm"
                            placeholder="Nome da fazenda"
                            {...register('farm')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Localização</Label>
                          <Input
                            id="location"
                            placeholder="Endereço ou referência"
                            {...register('location')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            placeholder="Nome da cidade"
                            {...register('city')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">Estado</Label>
                          <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AC">Acre</SelectItem>
                                  <SelectItem value="AL">Alagoas</SelectItem>
                                  <SelectItem value="AP">Amapá</SelectItem>
                                  <SelectItem value="AM">Amazonas</SelectItem>
                                  <SelectItem value="BA">Bahia</SelectItem>
                                  <SelectItem value="CE">Ceará</SelectItem>
                                  <SelectItem value="DF">Distrito Federal</SelectItem>
                                  <SelectItem value="ES">Espírito Santo</SelectItem>
                                  <SelectItem value="GO">Goiás</SelectItem>
                                  <SelectItem value="MA">Maranhão</SelectItem>
                                  <SelectItem value="MT">Mato Grosso</SelectItem>
                                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                                  <SelectItem value="MG">Minas Gerais</SelectItem>
                                  <SelectItem value="PA">Pará</SelectItem>
                                  <SelectItem value="PB">Paraíba</SelectItem>
                                  <SelectItem value="PR">Paraná</SelectItem>
                                  <SelectItem value="PE">Pernambuco</SelectItem>
                                  <SelectItem value="PI">Piauí</SelectItem>
                                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                  <SelectItem value="RO">Rondônia</SelectItem>
                                  <SelectItem value="RR">Roraima</SelectItem>
                                  <SelectItem value="SC">Santa Catarina</SelectItem>
                                  <SelectItem value="SP">São Paulo</SelectItem>
                                  <SelectItem value="SE">Sergipe</SelectItem>
                                  <SelectItem value="TO">Tocantins</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Informações adicionais sobre a compra..."
                          className="min-h-[100px]"
                          {...register('notes')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {Object.keys(errors).length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {Object.keys(errors).length} erro(s)
                  </Badge>
                )}
                {isValid && Object.keys(dirtyFields).length > 0 && (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                    <Check className="h-3 w-3" />
                    Pronto para salvar
                  </Badge>
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
                  disabled={isSubmitting || !isValid}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar Compra
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}