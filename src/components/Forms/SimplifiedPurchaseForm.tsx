import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar,
  DollarSign,
  Package,
  Truck,
  User,
  MapPin,
  Calculator
} from 'lucide-react';
import { useCattlePurchasesApi, CattlePurchase, CreateCattlePurchaseDto } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

// Componentes UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Schema de validação
const purchaseFormSchema = z.object({
  // Relacionamentos
  vendorId: z.string().min(1, 'Fornecedor é obrigatório'),
  brokerId: z.string().optional().nullable(),
  transportCompanyId: z.string().optional().nullable(),
  payerAccountId: z.string().min(1, 'Conta pagadora é obrigatória'),
  
  // Localização e data
  location: z.string().optional(),
  purchaseDate: z.date(),
  
  // Informações dos animais
  animalType: z.enum(['MALE', 'FEMALE', 'MIXED']),
  animalAge: z.number().optional(),
  initialQuantity: z.number().min(1, 'Quantidade deve ser maior que zero'),
  
  // Pesos
  purchaseWeight: z.number().min(1, 'Peso deve ser maior que zero'),
  carcassYield: z.number().min(1).max(100, 'Rendimento deve estar entre 1 e 100'),
  pricePerArroba: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  
  // Custos
  hasBrokerCommission: z.boolean(),
  commission: z.number().optional(),
  freightDistance: z.number().optional(),
  freightCostPerKm: z.number().optional(),
  
  // Pagamentos
  paymentType: z.enum(['CASH', 'INSTALLMENT', 'BARTER']),
  paymentTerms: z.string().optional(),
  principalDueDate: z.date().optional(),
  commissionPaymentType: z.enum(['cash', 'installment']).optional(),
  commissionDueDate: z.date().optional(),
  freightPaymentType: z.enum(['cash', 'installment']).optional(),
  freightDueDate: z.date().optional(),
  
  // GMD
  hasGMD: z.boolean(),
  expectedGMD: z.number().optional(),
  targetWeight: z.number().optional(),
  
  // Outros
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface SimplifiedPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CattlePurchase | null;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export function SimplifiedPurchaseForm({
  isOpen,
  onClose,
  initialData,
  isEditing = false,
  onSuccess
}: SimplifiedPurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Hooks de API
  const { createPurchase, updatePurchase } = useCattlePurchasesApi();
  const { partners, loadPartners } = usePartnersApi();
  const { accounts, loadAccounts } = usePayerAccountsApi();
  
  // Filtrar parceiros por tipo
  const vendors = partners.filter(p => p.type === 'VENDOR');
  const brokers = partners.filter(p => p.type === 'BROKER');
  const freightCarriers = partners.filter(p => p.type === 'FREIGHT_CARRIER');
  
  // Form
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      vendorId: initialData?.vendorId || '',
      brokerId: initialData?.brokerId || null,
      transportCompanyId: initialData?.transportCompanyId || null,
      payerAccountId: initialData?.payerAccountId || '',
      location: initialData?.location || '',
      purchaseDate: initialData ? new Date(initialData.purchaseDate) : new Date(),
      animalType: initialData?.animalType || 'MALE',
      animalAge: initialData?.animalAge,
      initialQuantity: initialData?.initialQuantity || 0,
      purchaseWeight: initialData?.purchaseWeight || 0,
      carcassYield: initialData?.carcassYield || 50,
      pricePerArroba: initialData?.pricePerArroba || 0,
      hasBrokerCommission: (initialData?.commission || 0) > 0,
      commission: initialData?.commission || 0,
      freightDistance: initialData?.freightDistance,
      freightCostPerKm: initialData?.freightCostPerKm,
      paymentType: initialData?.paymentType || 'CASH',
      paymentTerms: initialData?.paymentTerms || '',
      principalDueDate: initialData?.principalDueDate ? new Date(initialData.principalDueDate) : undefined,
      commissionPaymentType: initialData?.commissionPaymentType as any || 'cash',
      commissionDueDate: initialData?.commissionDueDate ? new Date(initialData.commissionDueDate) : undefined,
      freightPaymentType: initialData?.freightPaymentType as any || 'cash',
      freightDueDate: initialData?.freightDueDate ? new Date(initialData.freightDueDate) : undefined,
      hasGMD: (initialData?.expectedGMD || 0) > 0,
      expectedGMD: initialData?.expectedGMD,
      targetWeight: initialData?.targetWeight,
      notes: initialData?.notes || '',
    },
  });
  
  // Carregar dados
  useEffect(() => {
    loadPartners();
    loadAccounts();
  }, []);
  
  // Watch para cálculos
  const watchedValues = form.watch();
  
  // Cálculos automáticos
  const calculations = React.useMemo(() => {
    const quantity = watchedValues.initialQuantity || 0;
    const weight = watchedValues.purchaseWeight || 0;
    const carcassYield = watchedValues.carcassYield || 50;
    const pricePerArroba = watchedValues.pricePerArroba || 0;
    const commission = watchedValues.hasBrokerCommission ? (watchedValues.commission || 0) : 0;
    const freightDistance = watchedValues.freightDistance || 0;
    const freightCostPerKm = watchedValues.freightCostPerKm || 0;
    
    const averageWeight = quantity > 0 ? weight / quantity : 0;
    const carcassWeight = weight * (carcassYield / 100);
    const carcassArrobas = carcassWeight / 15;
    const liveWeightArrobas = weight / 30;
    const purchaseValue = pricePerArroba * carcassArrobas;
    const freightCost = freightDistance * freightCostPerKm;
    const totalCost = purchaseValue + freightCost + commission;
    
    return {
      averageWeight,
      carcassWeight,
      carcassArrobas,
      liveWeightArrobas,
      purchaseValue,
      freightCost,
      totalCost,
      costPerHead: quantity > 0 ? totalCost / quantity : 0,
      costPerKg: weight > 0 ? totalCost / weight : 0,
    };
  }, [watchedValues]);
  
  // Submit
  const handleSubmit = async (data: PurchaseFormData) => {
    setLoading(true);
    try {
      const payload: CreateCattlePurchaseDto = {
        vendorId: data.vendorId,
        brokerId: data.brokerId || undefined,
        transportCompanyId: data.transportCompanyId || undefined,
        payerAccountId: data.payerAccountId,
        location: data.location,
        purchaseDate: data.purchaseDate,
        animalType: data.animalType,
        animalAge: data.animalAge,
        initialQuantity: data.initialQuantity,
        purchaseWeight: data.purchaseWeight,
        carcassYield: data.carcassYield,
        pricePerArroba: data.pricePerArroba,
        commission: data.hasBrokerCommission ? data.commission : 0,
        freightCost: calculations.freightCost,
        freightDistance: data.freightDistance,
        freightCostPerKm: data.freightCostPerKm,
        paymentType: data.paymentType,
        paymentTerms: data.paymentTerms,
        principalDueDate: data.principalDueDate,
        commissionPaymentType: data.commissionPaymentType,
        commissionDueDate: data.commissionDueDate,
        freightPaymentType: data.freightPaymentType,
        freightDueDate: data.freightDueDate,
        expectedGMD: data.hasGMD ? data.expectedGMD : undefined,
        targetWeight: data.hasGMD ? data.targetWeight : undefined,
        notes: data.notes,
      };
      
      if (isEditing && initialData) {
        await updatePurchase(initialData.id, payload);
      } else {
        await createPurchase(payload);
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Compra' : 'Nova Compra de Gado'}
          </DialogTitle>
          <DialogDescription>
            Sistema unificado de compras e lotes
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="logistics">Logística</TabsTrigger>
              <TabsTrigger value="projections">Projeções</TabsTrigger>
            </TabsList>
            
            {/* Aba Básico */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorId">Fornecedor *</Label>
                  <Select
                    value={form.watch('vendorId')}
                    onValueChange={(value) => form.setValue('vendorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.vendorId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.vendorId.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    {...form.register('location')}
                    placeholder="Cidade - Estado"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">Data da Compra *</Label>
                  <Input
                    type="date"
                    {...form.register('purchaseDate', { valueAsDate: true })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="animalType">Tipo de Animal *</Label>
                  <Select
                    value={form.watch('animalType')}
                    onValueChange={(value) => form.setValue('animalType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Macho</SelectItem>
                      <SelectItem value="FEMALE">Fêmea</SelectItem>
                      <SelectItem value="MIXED">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="animalAge">Idade Média (meses)</Label>
                  <Input
                    type="number"
                    {...form.register('animalAge', { valueAsNumber: true })}
                    placeholder="Ex: 24"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="initialQuantity">Quantidade *</Label>
                  <Input
                    type="number"
                    {...form.register('initialQuantity', { valueAsNumber: true })}
                    placeholder="Cabeças"
                  />
                </div>
                
                <div>
                  <Label htmlFor="purchaseWeight">Peso Total (kg) *</Label>
                  <Input
                    type="number"
                    {...form.register('purchaseWeight', { valueAsNumber: true })}
                    placeholder="Peso em kg"
                  />
                </div>
                
                <div>
                  <Label>Peso Médio</Label>
                  <Input
                    value={calculations.averageWeight.toFixed(1) + ' kg'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              {/* Cards de Cálculo */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Arrobas Peso Vivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {calculations.liveWeightArrobas.toFixed(1)} @
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Arrobas Carcaça</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {calculations.carcassArrobas.toFixed(1)} @
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Peso Carcaça</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {calculations.carcassWeight.toFixed(0)} kg
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Aba Financeiro */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carcassYield">Rendimento de Carcaça (%) *</Label>
                  <Input
                    type="number"
                    {...form.register('carcassYield', { valueAsNumber: true })}
                    placeholder="Ex: 50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pricePerArroba">Preço por Arroba (R$) *</Label>
                  <Input
                    type="number"
                    {...form.register('pricePerArroba', { valueAsNumber: true })}
                    placeholder="R$ por arroba"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payerAccountId">Conta Pagadora *</Label>
                  <Select
                    value={form.watch('payerAccountId')}
                    onValueChange={(value) => form.setValue('payerAccountId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="paymentType">Tipo de Pagamento *</Label>
                  <Select
                    value={form.watch('paymentType')}
                    onValueChange={(value) => form.setValue('paymentType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">À Vista</SelectItem>
                      <SelectItem value="INSTALLMENT">A Prazo</SelectItem>
                      <SelectItem value="BARTER">Permuta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {form.watch('paymentType') === 'INSTALLMENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
                    <Input
                      {...form.register('paymentTerms')}
                      placeholder="Ex: 30/60/90 dias"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="principalDueDate">Data de Vencimento</Label>
                    <Input
                      type="date"
                      {...form.register('principalDueDate', { valueAsDate: true })}
                    />
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Comissão */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch('hasBrokerCommission')}
                    onCheckedChange={(checked) => 
                      form.setValue('hasBrokerCommission', checked as boolean)
                    }
                  />
                  <Label>Possui Comissão de Corretor</Label>
                </div>
                
                {form.watch('hasBrokerCommission') && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="brokerId">Corretor</Label>
                      <Select
                        value={form.watch('brokerId') || ''}
                        onValueChange={(value) => form.setValue('brokerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {brokers.map(broker => (
                            <SelectItem key={broker.id} value={broker.id}>
                              {broker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="commission">Valor da Comissão (R$)</Label>
                      <Input
                        type="number"
                        {...form.register('commission', { valueAsNumber: true })}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="commissionPaymentType">Pagamento</Label>
                      <Select
                        value={form.watch('commissionPaymentType')}
                        onValueChange={(value) => form.setValue('commissionPaymentType', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">À Vista</SelectItem>
                          <SelectItem value="installment">A Prazo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumo Financeiro */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor da Compra:</span>
                    <span className="font-bold">{formatCurrency(calculations.purchaseValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>{formatCurrency(calculations.freightCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão:</span>
                    <span>{formatCurrency(form.watch('commission') || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Custo/Cabeça: {formatCurrency(calculations.costPerHead)}</div>
                    <div>Custo/Kg: {formatCurrency(calculations.costPerKg)}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba Logística */}
            <TabsContent value="logistics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transportCompanyId">Transportadora</Label>
                  <Select
                    value={form.watch('transportCompanyId') || ''}
                    onValueChange={(value) => form.setValue('transportCompanyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {freightCarriers.map(carrier => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="freightPaymentType">Pagamento do Frete</Label>
                  <Select
                    value={form.watch('freightPaymentType')}
                    onValueChange={(value) => form.setValue('freightPaymentType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="installment">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="freightDistance">Distância (km)</Label>
                  <Input
                    type="number"
                    {...form.register('freightDistance', { valueAsNumber: true })}
                    placeholder="Ex: 250"
                  />
                </div>
                
                <div>
                  <Label htmlFor="freightCostPerKm">Custo por Km (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register('freightCostPerKm', { valueAsNumber: true })}
                    placeholder="Ex: 3.50"
                  />
                </div>
                
                <div>
                  <Label>Valor do Frete</Label>
                  <Input
                    value={formatCurrency(calculations.freightCost)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              {form.watch('freightPaymentType') === 'installment' && (
                <div>
                  <Label htmlFor="freightDueDate">Vencimento do Frete</Label>
                  <Input
                    type="date"
                    {...form.register('freightDueDate', { valueAsDate: true })}
                  />
                </div>
              )}
            </TabsContent>
            
            {/* Aba Projeções */}
            <TabsContent value="projections" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch('hasGMD')}
                    onCheckedChange={(checked) => 
                      form.setValue('hasGMD', checked as boolean)
                    }
                  />
                  <Label>Definir GMD e Projeções</Label>
                </div>
                
                {form.watch('hasGMD') && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="expectedGMD">GMD Esperado (kg/dia)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        {...form.register('expectedGMD', { valueAsNumber: true })}
                        placeholder="Ex: 1.2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="targetWeight">Peso Alvo (kg)</Label>
                      <Input
                        type="number"
                        {...form.register('targetWeight', { valueAsNumber: true })}
                        placeholder="Ex: 550"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  {...form.register('notes')}
                  placeholder="Observações adicionais..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}