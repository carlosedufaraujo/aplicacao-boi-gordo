import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  AlertCircle, 
  Calculator, 
  Truck, 
  FileText, 
  Package,
  User,
  X,
  Check
} from 'lucide-react';
import { CycleSelector } from '@/components/Common/CycleSelector';
import { DatePickerField } from '@/components/Common/DatePickerField';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';

// Estados e cidades brasileiras
const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const citiesByState: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Barretos', 'Araçatuba'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Uberaba', 'Montes Claros'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Nova Iguaçu', 'Duque de Caxias'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria'],
  'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
  'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'Chapecó'],
  'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
  'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop'],
  'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
};

const formSchema = z.object({
  vendorId: z.string().min(1, 'Fornecedor é obrigatório'),
  cycleId: z.string().optional(),
  purchaseDate: z.date({
    required_error: 'Data da compra é obrigatória',
  }),
  state: z.string().min(1, 'Estado é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  farm: z.string().optional(),
  payerAccountId: z.string().min(1, 'Conta pagadora é obrigatória'),
  paymentType: z.enum(['CASH', 'INSTALLMENT'], {
    required_error: 'Forma de pagamento é obrigatória',
  }),
  paymentDueDate: z.date().optional(),
  
  // Dados do gado
  animalType: z.enum(['MALE', 'FEMALE'], {
    required_error: 'Tipo de animal é obrigatório',
  }),
  animalAge: z.string().optional(),
  initialQuantity: z.string().min(1, 'Quantidade é obrigatória'),
  purchaseWeight: z.string().min(1, 'Peso total é obrigatório'),
  carcassYield: z.string().min(1, 'Rendimento de carcaça é obrigatório'),
  pricePerArroba: z.string().min(1, 'Preço por arroba é obrigatório'),
  
  // Corretor
  brokerId: z.string().optional(),
  commission: z.string().optional(),
  commissionDueDate: z.date().optional(),
  
  // Logística
  transportCompanyId: z.string().optional(),
  freightDistance: z.string().optional(),
  freightCostPerKm: z.string().optional(),
  freightCost: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedPurchaseFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPurchase?: any;
}

export function EnhancedPurchaseForm({ 
  open, 
  onClose, 
  onSuccess,
  editingPurchase 
}: EnhancedPurchaseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // API Hooks
  const { partners, loadPartners } = usePartnersApi();
  const { payerAccounts, loadAccounts } = usePayerAccountsApi();
  const { createPurchase, updatePurchase } = useCattlePurchasesApi();

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Informações básicas
      vendorId: '',
      purchaseDate: new Date(),
      state: '',
      city: '',
      farm: '',
      payerAccountId: '',
      paymentType: 'CASH',
      paymentDueDate: undefined,
      
      // Dados do gado
      animalType: 'MALE',
      animalAge: '',
      initialQuantity: '',
      purchaseWeight: '',
      carcassYield: '52',
      pricePerArroba: '',
      
      // Corretor
      brokerId: '',
      commission: '',
      commissionDueDate: undefined,
      
      // Logística
      transportCompanyId: '',
      freightDistance: '',
      freightCostPerKm: '',
      freightCost: '',
      
      // Observações
      observations: '',
    },
  });

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadPartners();
      loadAccounts();
    }
  }, [open]);

  // Filter partners by type
  const vendors = partners.filter(p => p.type === 'VENDOR' || p.type === 'BOTH');
  const brokers = partners.filter(p => p.type === 'BROKER' || p.type === 'BOTH');
  const transportCompanies = partners.filter(p => 
    p.type === 'FREIGHT_CARRIER' || p.type === 'TRANSPORT_COMPANY' || p.type === 'BOTH'
  );

  // Watch form values for calculations
  const watchedValues = form.watch();
  const selectedState = form.watch('state');
  const availableCities = selectedState ? citiesByState[selectedState] || [] : [];

  // Função para formatação numérica
  const formatNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return new Intl.NumberFormat('pt-BR').format(Number(numericValue));
  };

  const handleWeightChange = (value: string, onChange: (value: string) => void) => {
    const numericValue = value.replace(/\D/g, '');
    onChange(numericValue);
  };

  // Calculations
  const calculations = useMemo(() => {
    const quantity = Number(watchedValues.initialQuantity) || 0;
    const weight = Number(watchedValues.purchaseWeight) || 0;
    const yield_ = Number(watchedValues.carcassYield) || 0; // Usa valor da tabela, 0 se não informado
    const pricePerArroba = Number(watchedValues.pricePerArroba) || 0;
    const commission = Number(watchedValues.commission) || 0;
    
    // Cálculo do frete
    const freightDistance = Number(watchedValues.freightDistance) || 0;
    const freightCostPerKm = Number(watchedValues.freightCostPerKm) || 0;
    const manualFreightCost = Number(watchedValues.freightCost) || 0;
    
    const calculatedFreightCost = freightDistance * freightCostPerKm;
    const freightCost = manualFreightCost || calculatedFreightCost;

    const averageWeight = quantity > 0 ? weight / quantity : 0;
    const carcassWeight = (weight * yield_) / 100;
    const totalArrobas = carcassWeight / 15; // 1 arroba = 15kg
    const purchaseValue = totalArrobas * pricePerArroba;
    
    let commissionValue = 0;
    if (watchedValues.brokerId && commission > 0) {
      commissionValue = commission;
    }

    const totalCost = purchaseValue + commissionValue + freightCost;

    return {
      averageWeight,
      carcassWeight,
      totalArrobas,
      purchaseValue,
      commissionValue,
      freightValue: freightCost,
      calculatedFreightCost,
      totalCost,
    };
  }, [
    watchedValues.initialQuantity,
    watchedValues.purchaseWeight,
    watchedValues.carcassYield,
    watchedValues.pricePerArroba,
    watchedValues.commission,
    watchedValues.brokerId,
    watchedValues.freightDistance,
    watchedValues.freightCostPerKm,
    watchedValues.freightCost,
  ]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('🔍 Dados do formulário:', data);
      console.log('🧮 Cálculos:', calculations);
      
      // Validar campos obrigatórios
      if (!data.vendorId) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione um fornecedor.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!data.payerAccountId) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione uma conta pagadora.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!data.initialQuantity || Number(data.initialQuantity) <= 0) {
        toast({
          title: 'Erro de validação',
          description: 'Informe a quantidade de animais.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!data.purchaseWeight || Number(data.purchaseWeight) <= 0) {
        toast({
          title: 'Erro de validação',
          description: 'Informe o peso total da compra.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!data.pricePerArroba || Number(data.pricePerArroba) <= 0) {
        toast({
          title: 'Erro de validação',
          description: 'Informe o preço por arroba.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validação específica para pagamento a prazo
      if (data.paymentType === 'INSTALLMENT' && !data.paymentDueDate) {
        toast({
          title: 'Erro de validação',
          description: 'Para pagamento a prazo, informe a data de vencimento.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validação para comissão
      if (data.brokerId && data.brokerId !== 'none' && data.brokerId !== '' && data.commission && Number(data.commission) <= 0) {
        toast({
          title: 'Erro de validação',
          description: 'Para corretor com comissão, informe um valor válido.',
          variant: 'destructive',
        });
        return;
      }
      
      const purchaseData = {
        ...data,
        initialQuantity: Number(data.initialQuantity),
        purchaseWeight: Number(data.purchaseWeight),
        carcassYield: Number(data.carcassYield),
        pricePerArroba: Number(data.pricePerArroba),
        animalAge: data.animalAge ? Number(data.animalAge) : null,
        // Corrigir campos de chave estrangeira - usar null ao invés de string vazia
        brokerId: data.brokerId && data.brokerId !== '' ? data.brokerId : null,
        transportCompanyId: data.transportCompanyId && data.transportCompanyId !== '' ? data.transportCompanyId : null,
        cycleId: data.cycleId && data.cycleId !== '' ? data.cycleId : null,
        commission: data.commission ? Number(data.commission) : undefined,
        freightDistance: data.freightDistance ? Number(data.freightDistance) : undefined,
        freightCostPerKm: data.freightCostPerKm ? Number(data.freightCostPerKm) : undefined,
        freightCost: data.freightCost ? Number(data.freightCost) : undefined,
        purchaseValue: calculations.purchaseValue,
        totalCost: calculations.totalCost,
      };

      console.log('📤 Enviando dados:', purchaseData);
      console.log('📋 Dados detalhados:');
      console.log('- vendorId:', purchaseData.vendorId, typeof purchaseData.vendorId);
      console.log('- purchaseDate:', purchaseData.purchaseDate, typeof purchaseData.purchaseDate);
      console.log('- animalAge:', purchaseData.animalAge, typeof purchaseData.animalAge);
      console.log('- paymentType:', purchaseData.paymentType, typeof purchaseData.paymentType);
      console.log('- animalType:', purchaseData.animalType, typeof purchaseData.animalType);
      console.log('- initialQuantity:', purchaseData.initialQuantity, typeof purchaseData.initialQuantity);
      console.log('- purchaseWeight:', purchaseData.purchaseWeight, typeof purchaseData.purchaseWeight);
      console.log('- carcassYield:', purchaseData.carcassYield, typeof purchaseData.carcassYield);
      console.log('- pricePerArroba:', purchaseData.pricePerArroba, typeof purchaseData.pricePerArroba);

      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, purchaseData);
        toast({
          title: 'Compra atualizada',
          description: 'A compra foi atualizada com sucesso.',
        });
      } else {
        await createPurchase(purchaseData);
        toast({
          title: 'Compra criada',
          description: 'A compra foi criada com sucesso.',
        });
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error('❌ Erro ao salvar compra:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar a compra.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-background">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {editingPurchase ? 'Editar Compra de Gado' : 'Nova Compra de Gado'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Preencha as informações da compra seguindo o fluxo das abas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-4 border-b bg-background">
                <TabsList className="grid w-full grid-cols-4 h-10">
                  <TabsTrigger value="basic" className="text-xs">
                    <FileText className="w-4 h-4 mr-1" />
                    Informações Básicas
                  </TabsTrigger>
                  <TabsTrigger value="cattle" className="text-xs">
                    <Package className="w-4 h-4 mr-1" />
                    Gado & Corretor
                  </TabsTrigger>
                  <TabsTrigger value="logistics" className="text-xs">
                    <Truck className="w-4 h-4 mr-1" />
                    Logística & Pagamento
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs">
                    <Calculator className="w-4 h-4 mr-1" />
                    Resumo & Confirmação
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-6">
                {/* ABA 1: INFORMAÇÕES BÁSICAS */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Fornecedor *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione o fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors.length === 0 ? (
                                <SelectItem value="no-vendors" disabled>
                                  Nenhum fornecedor cadastrado
                                </SelectItem>
                              ) : (
                                vendors.map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cycleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Ciclo</FormLabel>
                          <FormControl>
                            <CycleSelector
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione o ciclo"
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            O ciclo ao qual esta compra será associada
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DatePickerField
                      control={form.control}
                      name="purchaseDate"
                      label="Data da Compra"
                      placeholder="Selecione a data da compra"
                      required
                      disableFuture
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Estado *</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('city', '');
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brazilianStates.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Cidade *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!selectedState || availableCities.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione primeiro o estado"} />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="farm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Fazenda/Propriedade</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da fazenda" className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payerAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Conta Pagadora *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione a conta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {payerAccounts.length === 0 ? (
                                <SelectItem value="no-accounts" disabled>
                                  Nenhuma conta cadastrada
                                </SelectItem>
                              ) : (
                                payerAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.accountName} - {account.bankName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Forma de Pagamento *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                                                <SelectItem value="CASH">À Vista</SelectItem>
                                  <SelectItem value="INSTALLMENT">A Prazo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DatePickerField
                      control={form.control}
                      name="paymentDueDate"
                      label={form.watch('paymentType') === 'INSTALLMENT' ? 'Data de Vencimento' : 'Data de Vencimento'}
                      placeholder="Selecione a data de vencimento"
                      required={form.watch('paymentType') === 'INSTALLMENT'}
                      disablePast
                    />
                  </div>
                </TabsContent>

                {/* ABA 2: GADO & CORRETOR */}
                <TabsContent value="cattle" className="space-y-6 mt-6">
                  {/* Seção Gado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Package className="w-4 h-4 text-primary" />
                      <h3 className="text-base font-semibold">Informações do Gado</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="animalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Tipo de Animal *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MALE">Macho</SelectItem>
                                <SelectItem value="FEMALE">Fêmea</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="initialQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Quantidade *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" placeholder="Ex: 100" className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="animalAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Idade (meses)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" placeholder="Ex: 24" className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="purchaseWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Peso Total (kg) *</FormLabel>
                            <FormControl>
                              <Input 
                                value={field.value ? formatNumber(field.value) : ''}
                                onChange={(e) => handleWeightChange(e.target.value, field.onChange)}
                                placeholder="Ex: 45.000" 
                                className="h-9" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="carcassYield"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Rendimento (%) *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="40" max="70" step="0.1" className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pricePerArroba"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Preço/@ (R$) *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="Ex: 280.00" className="h-9" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Preview dos cálculos */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Peso Médio:</span>
                          <p className="font-medium">{calculations.averageWeight.toFixed(1)} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Arrobas:</span>
                          <p className="font-medium">{calculations.totalArrobas.toFixed(2)} @</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor por Cabeça:</span>
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(Number(watchedValues.initialQuantity) > 0 ? calculations.purchaseValue / Number(watchedValues.initialQuantity) : 0)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <p className="font-semibold text-primary">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(calculations.purchaseValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Seção Corretor */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <User className="w-4 h-4 text-primary" />
                      <h3 className="text-base font-semibold">Informações do Corretor</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="brokerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Corretor</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value === 'none' ? '' : value);
                                if (value === 'none') {
                                  form.setValue('commission', '');
                                }
                              }} 
                              value={field.value || 'none'}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
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


                    </div>

                    {form.watch('brokerId') && form.watch('brokerId') !== 'none' && form.watch('brokerId') !== '' && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="commission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Comissão (R$) *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  step="0.01"
                                  placeholder="Ex: 1500.00"
                                  className="h-9"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Valor total da comissão em reais
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="commissionDueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Vencimento da Comissão</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-9 pl-3 text-left font-normal justify-start",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        <span className="text-foreground font-medium">
                                          {format(field.value, "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
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
                                    className="rounded-md border"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Preview da comissão usando Card Shadcn UI */}
                    {form.watch('brokerId') && form.watch('commission') && (
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Preview da Comissão
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Corretor:</span>
                              <span className="font-medium text-xs">
                                {partners.find(p => p.id === form.watch('brokerId'))?.name || 'Selecionado'}
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-primary">Total da Comissão:</span>
                              <span className="font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.commissionValue)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* ABA 3: LOGÍSTICA & PAGAMENTO */}
                <TabsContent value="logistics" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Truck className="w-4 h-4 text-primary" />
                      <h3 className="text-base font-semibold">Informações de Logística</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="transportCompanyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Empresa de Transporte</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione a transportadora" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sem transportadora</SelectItem>
                                {transportCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="freightDistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Distância (km)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                placeholder="Ex: 150" 
                                className="h-9"
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-calcular frete se houver custo por km
                                  const distance = Number(e.target.value);
                                  const costPerKm = Number(form.watch('freightCostPerKm'));
                                  if (distance && costPerKm) {
                                    form.setValue('freightCost', (distance * costPerKm).toString());
                                  }
                                }}
                              />
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
                            <FormLabel className="text-sm font-medium">Custo por KM (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="Ex: 2.50" 
                                className="h-9"
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-calcular frete se houver distância
                                  const costPerKm = Number(e.target.value);
                                  const distance = Number(form.watch('freightDistance'));
                                  if (distance && costPerKm) {
                                    form.setValue('freightCost', (distance * costPerKm).toString());
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                                            <FormField
                        control={form.control}
                        name="freightCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Custo Total do Frete (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="Calculado automaticamente" 
                                className="h-9 bg-muted" 
                                readOnly
                                value={calculations.freightValue ? calculations.freightValue.toFixed(2) : field.value}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-muted-foreground">
                              Valor calculado automaticamente com base na distância e custo por KM
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Preview do frete usando Card Shadcn UI */}
                    {(form.watch('freightDistance') && form.watch('freightCostPerKm')) || form.watch('freightCost') ? (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Resumo do Frete
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-xs">
                            {form.watch('freightDistance') && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Distância:</span>
                                <Badge variant="outline" className="text-xs">
                                  {form.watch('freightDistance')} km
                                </Badge>
                              </div>
                            )}
                            {form.watch('freightCostPerKm') && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Custo por KM:</span>
                                <span className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('freightCostPerKm')))}
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-primary">Total do Frete:</span>
                              <span className="font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.freightValue)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </TabsContent>

                {/* ABA 4: RESUMO & CONFIRMAÇÃO */}
                <TabsContent value="summary" className="space-y-6 mt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Revise todas as informações antes de confirmar a compra. Verifique se todos os dados estão corretos.
                    </AlertDescription>
                  </Alert>

                  {/* Tabela de Resumo Financeiro */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Resumo Financeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium text-sm">Item</th>
                              <th className="text-right py-2 px-3 font-medium text-sm">Quantidade</th>
                              <th className="text-right py-2 px-3 font-medium text-sm">Valor Unitário</th>
                              <th className="text-right py-2 px-3 font-medium text-sm">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 px-3 font-medium">Compra do Gado</td>
                              <td className="py-2 px-3 text-right text-sm">{form.watch('initialQuantity') || 0} cabeças</td>
                              <td className="py-2 px-3 text-right text-sm">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  Number(form.watch('initialQuantity')) > 0 ? calculations.purchaseValue / Number(form.watch('initialQuantity')) : 0
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.purchaseValue)}
                              </td>
                            </tr>
                            
                            {form.watch('brokerId') && form.watch('commission') && (
                              <tr className="border-b">
                                <td className="py-2 px-3">Comissão do Corretor</td>
                                <td className="py-2 px-3 text-right text-sm">
                                  Valor fixo
                                </td>
                                <td className="py-2 px-3 text-right text-sm">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('commission') || 0))}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.commissionValue)}
                                </td>
                              </tr>
                            )}

                            {form.watch('freightCost') && Number(form.watch('freightCost')) > 0 && (
                              <tr className="border-b">
                                <td className="py-2 px-3">Frete</td>
                                <td className="py-2 px-3 text-right text-sm">
                                  {form.watch('freightDistance') ? `${form.watch('freightDistance')} km` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-sm">
                                  {form.watch('freightCostPerKm') 
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('freightCostPerKm')))
                                    : '-'
                                  }
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('freightCost')))}
                                </td>
                              </tr>
                            )}

                            <tr className="border-t-2 bg-primary/5">
                              <td className="py-3 px-3 font-bold text-base">TOTAL GERAL</td>
                              <td className="py-3 px-3"></td>
                              <td className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right font-bold text-base text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.totalCost)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cards Informativos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Dados do Gado
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">
                            {form.watch('animalType') === 'MALE' ? 'Macho' : 
                             form.watch('animalType') === 'FEMALE' ? 'Fêmea' : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quantidade:</span>
                          <span className="font-medium">{form.watch('initialQuantity') || 0} cabeças</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Peso Total:</span>
                          <span className="font-medium">{form.watch('purchaseWeight') || 0} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Peso Médio:</span>
                          <span className="font-medium">{calculations.averageWeight.toFixed(1)} kg/cabeça</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rendimento:</span>
                          <span className="font-medium">{form.watch('carcassYield') || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Preço/@:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('pricePerArroba')) || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Informações Gerais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fornecedor:</span>
                          <span className="font-medium">
                            {vendors.find(v => v.id === form.watch('vendorId'))?.name || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Data:</span>
                          <span className="font-medium">
                            {form.watch('purchaseDate') 
                              ? format(form.watch('purchaseDate'), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Local:</span>
                          <span className="font-medium">
                            {form.watch('city') && form.watch('state') 
                              ? `${form.watch('city')}, ${form.watch('state')}` 
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fazenda:</span>
                          <span className="font-medium">{form.watch('farm') || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pagamento:</span>
                          <span className="font-medium">
                            {form.watch('paymentType') === 'CASH' ? 'À Vista' :
                             form.watch('paymentType') === 'INSTALLMENT' ? 'A Prazo' : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Conta:</span>
                          <span className="font-medium">
                            {payerAccounts.find(a => a.id === form.watch('payerAccountId'))?.accountName || '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="px-6 py-4 border-t bg-background">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Salvar Compra
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}