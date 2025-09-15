import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Users, AlertTriangle, Package } from 'lucide-react';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePenAllocationsApi } from '@/hooks/api/usePenAllocationsApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const penAllocationSchema = z.object({
  lotId: z.string().min(1, 'Selecione um lote'),
  quantity: z.number()
    .min(1, 'Quantidade deve ser maior que 0')
    .int('Quantidade deve ser um número inteiro'),
});

type PenAllocationFormData = z.infer<typeof penAllocationSchema>;

interface PenAllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  penNumber: string;
}

export const PenAllocationForm: React.FC<PenAllocationFormProps> = ({
  isOpen,
  onClose,
  penNumber
}) => {
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchasesApi();
  const { pens } = usePensApi();
  const { allocations, createAllocation, loading: allocationsLoading } = usePenAllocationsApi();
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pen = pens.find(p => p.penNumber === penNumber);
  const penId = pen?.id;

  const form = useForm<PenAllocationFormData>({
    resolver: zodResolver(penAllocationSchema),
    defaultValues: {
      lotId: '',
      quantity: 1
    }
  });

  const selectedLotId = form.watch('lotId');
  const selectedLot = cattlePurchases.find(lot => lot.id === selectedLotId);

  // Atualizar a lista de lotes disponíveis quando o componente montar
  useEffect(() => {
    if (cattlePurchases && allocations && pen) {
      // Filtrar lotes com status adequado para confinamento
      const eligibleLots = cattlePurchases.filter(lot => 
        lot.status === 'CONFIRMED' || lot.status === 'CONFINED'
      );

      // Para cada lote, calcular quantos animais ainda estão disponíveis
      const lotsWithAvailability = eligibleLots.map(lot => {
        // Obter todas as alocações deste lote
        const lotAllocations = allocations.filter(alloc => 
          alloc.lotId === lot.id && alloc.status === 'ACTIVE'
        );
        
        // Calcular o total já alocado
        const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
        
        // Calcular disponível
        const available = lot.currentQuantity - totalAllocated;
        
        return {
          ...lot,
          availableQuantity: available,
          totalAllocated,
          isInThisPen: lotAllocations.some(alloc => alloc.penId === penId)
        };
      }).filter(lot => lot.availableQuantity > 0); // Apenas lotes com animais disponíveis

      setAvailableLots(lotsWithAvailability);
    }
  }, [cattlePurchases, allocations, pen, penId]);

  // Quando o lote é selecionado, atualizar a quantidade máxima
  useEffect(() => {
    if (selectedLotId && availableLots.length > 0) {
      const lotData = availableLots.find(l => l.id === selectedLotId);
      if (lotData && pen) {
        // Capacidade restante do curral
        const penCapacityRemaining = pen.capacity - pen.currentOccupancy;
        
        // Quantidade máxima é o menor entre disponível no lote e capacidade do curral
        const maxQuantity = Math.min(lotData.availableQuantity, penCapacityRemaining);
        
        // Definir o valor inicial como o máximo possível
        if (maxQuantity > 0) {
          form.setValue('quantity', maxQuantity);
        }
      }
    }
  }, [selectedLotId, availableLots, pen, form]);

  const handleFormSubmit = async (data: PenAllocationFormData) => {
    if (!pen || !selectedLot) {
      toast.error('Informações incompletas');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Criar alocação via API
      await createAllocation({
        penId: pen.id,
        lotId: data.lotId,
        quantity: data.quantity,
        entryDate: new Date().toISOString()
      });

      toast.success(`${data.quantity} animais alocados com sucesso no curral ${penNumber}`);
      form.reset();
      onClose();
    } catch (error: any) {
      console.error('Erro ao alocar animais:', error);
      toast.error(error.message || 'Erro ao alocar animais');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pen) return null;

  const occupancyRate = (pen.currentOccupancy / pen.capacity) * 100;
  const availableSpace = pen.capacity - pen.currentOccupancy;

  // Calcular alocações existentes neste curral
  const existingAllocations = allocations.filter(alloc => 
    alloc.penId === penId && alloc.status === 'ACTIVE'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Alocar Animais no Curral {penNumber}
          </DialogTitle>
          <DialogDescription>
            Selecione um lote e a quantidade de animais para alocar neste curral
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Informações do Curral */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status do Curral</span>
                    <Badge variant={
                      occupancyRate === 100 ? 'destructive' :
                      occupancyRate > 80 ? 'secondary' : 'outline'
                    }>
                      {occupancyRate === 100 ? 'Lotado' :
                       occupancyRate > 80 ? 'Quase Cheio' : 'Disponível'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ocupação</span>
                      <span className="font-medium">{pen.currentOccupancy}/{pen.capacity} animais</span>
                    </div>
                    <Progress value={occupancyRate} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {availableSpace} vagas disponíveis ({(100 - occupancyRate).toFixed(1)}%)
                    </p>
                  </div>

                  {/* Lotes já alocados neste curral */}
                  {existingAllocations.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Package className="h-4 w-4" />
                          Lotes Alocados ({existingAllocations.length})
                        </div>
                        <div className="space-y-1">
                          {existingAllocations.map((alloc) => {
                            const lot = cattlePurchases.find(l => l.id === alloc.lotId);
                            return (
                              <div key={alloc.id} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {lot?.lotCode || 'Lote desconhecido'}
                                </span>
                                <span className="font-medium">{alloc.quantity} animais</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Lote */}
            <FormField
              control={form.control}
              name="lotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={lotsLoading || availableLots.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          lotsLoading ? "Carregando lotes..." : 
                          availableLots.length === 0 ? "Nenhum lote disponível" :
                          "Selecione um lote"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableLots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {lot.lotCode} - {lot.availableQuantity} disponíveis
                              {lot.isInThisPen && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Já neste curral
                                </Badge>
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {availableLots.length > 0 
                      ? `${availableLots.length} lotes com animais disponíveis`
                      : "Todos os lotes estão totalmente alocados"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantidade */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Animais</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={
                        selectedLot && availableLots.length > 0
                          ? Math.min(
                              availableLots.find(l => l.id === selectedLotId)?.availableQuantity || 0,
                              availableSpace
                            )
                          : availableSpace
                      }
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedLot && availableLots.length > 0 && (
                      <>
                        Máximo: {Math.min(
                          availableLots.find(l => l.id === selectedLotId)?.availableQuantity || 0,
                          availableSpace
                        )} animais
                      </>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detalhes do Lote Selecionado */}
            {selectedLot && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Detalhes do Lote {selectedLot.lotCode}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fornecedor</p>
                        <p className="font-medium">{selectedLot.partnerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total no Lote</p>
                        <p className="font-medium">{selectedLot.currentQuantity} animais</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Peso Médio</p>
                        <p className="font-medium">
                          {selectedLot.averageWeight ? `${selectedLot.averageWeight.toFixed(1)} kg` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-medium">{formatCurrency(selectedLot.totalCost)}</p>
                      </div>
                    </div>

                    {/* Alocações existentes do lote */}
                    {(() => {
                      const lotAllocations = allocations.filter(alloc => 
                        alloc.lotId === selectedLotId && alloc.status === 'ACTIVE'
                      );
                      const lotData = availableLots.find(l => l.id === selectedLotId);
                      
                      if (lotAllocations.length > 0 && lotData) {
                        return (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Este lote já tem {lotData.totalAllocated} animais alocados em {lotAllocations.length} curral(is).
                              Restam {lotData.availableQuantity} animais disponíveis para alocação.
                            </AlertDescription>
                          </Alert>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aviso se não houver espaço */}
            {availableSpace === 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este curral está com capacidade máxima. Não é possível alocar mais animais.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
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
                disabled={
                  !selectedLot || 
                  availableLots.length === 0 || 
                  availableSpace === 0 ||
                  isSubmitting ||
                  allocationsLoading
                }
              >
                {isSubmitting ? 'Alocando...' : 'Alocar Animais'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
