import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, Weight, Users, MapPin, Check, Home, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePensApi } from '@/hooks/api/usePensApi';
import { toast } from 'sonner';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    currentStatus: string;
    nextStatus: string;
    purchase: any;
  };
  onConfirm: (statusData: any) => Promise<void>;
}

export function StatusChangeModal({ isOpen, onClose, data, onConfirm }: StatusChangeModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reception');
  const { pens, loading: loadingPens } = usePensApi();
  const [selectedPens, setSelectedPens] = useState<Map<string, number>>(new Map());
  
  const [formData, setFormData] = useState<any>({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedWeight: data?.purchase?.purchaseWeight || 0,
    actualQuantity: data?.purchase?.initialQuantity || 0,
    mortalityReason: '',
    notes: '',
    penAllocations: [],
  });

  // Filtrar apenas currais disponíveis
  const availablePens = pens.filter(pen => 
    (pen.status === 'AVAILABLE' || pen.status === 'ACTIVE') && 
    pen.isActive !== false &&
    pen.currentOccupancy < pen.capacity
  );

  const handlePenSelection = (penId: string, quantity: number) => {
    const newSelection = new Map(selectedPens);
    if (quantity > 0) {
      newSelection.set(penId, quantity);
    } else {
      newSelection.delete(penId);
    }
    setSelectedPens(newSelection);
  };

  const getTotalAllocated = () => {
    let total = 0;
    selectedPens.forEach(quantity => total += quantity);
    return total;
  };

  const getRemainingToAllocate = () => {
    return formData.actualQuantity - getTotalAllocated();
  };

  const handleAutoAllocate = () => {
    const newSelection = new Map<string, number>();
    let remaining = formData.actualQuantity;

    // Ordenar currais por capacidade disponível
    const sortedPens = [...availablePens].sort((a, b) => {
      const availA = a.capacity - a.currentOccupancy;
      const availB = b.capacity - b.currentOccupancy;
      return availB - availA;
    });

    for (const pen of sortedPens) {
      if (remaining <= 0) break;
      
      const available = pen.capacity - pen.currentOccupancy;
      const toAllocate = Math.min(available, remaining);
      
      if (toAllocate > 0) {
        newSelection.set(pen.id, toAllocate);
        remaining -= toAllocate;
      }
    }

    setSelectedPens(newSelection);
    
    if (remaining > 0) {
      toast.error(`Não há espaço suficiente nos currais. Faltam ${remaining} animais para alocar.`);
    } else {
      toast.success('Animais distribuídos automaticamente!');
    }
  };

  const validateReception = () => {
    const errors = [];
    
    if (!formData.receivedDate) {
      errors.push('Data de recepção é obrigatória');
    }
    
    if (formData.receivedWeight <= 0) {
      errors.push('Peso recebido deve ser maior que zero');
    }
    
    if (formData.actualQuantity <= 0) {
      errors.push('Quantidade recebida deve ser maior que zero');
    }
    
    if (formData.actualQuantity > data.purchase.initialQuantity) {
      errors.push('Quantidade recebida não pode ser maior que a comprada');
    }
    
    if (formData.actualQuantity < data.purchase.initialQuantity && !formData.mortalityReason) {
      errors.push('Informe o motivo da diferença na quantidade');
    }
    
    return errors;
  };

  const validateAllocation = () => {
    const errors = [];
    
    if (selectedPens.size === 0) {
      errors.push('Selecione pelo menos um curral');
    }
    
    const totalAllocated = getTotalAllocated();
    if (totalAllocated !== formData.actualQuantity) {
      errors.push(`Quantidade alocada (${totalAllocated}) deve ser igual à quantidade recebida (${formData.actualQuantity})`);
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    // Validar aba de recepção
    const receptionErrors = validateReception();
    if (receptionErrors.length > 0) {
      setActiveTab('reception');
      toast.error(receptionErrors[0]);
      return;
    }

    // Validar aba de alocação
    const allocationErrors = validateAllocation();
    if (allocationErrors.length > 0) {
      setActiveTab('allocation');
      toast.error(allocationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      // Preparar dados para envio
      const penIds = Array.from(selectedPens.keys());
      const penAllocations = Array.from(selectedPens.entries()).map(([penId, quantity]) => ({
        penId,
        quantity
      }));

      await onConfirm({
        status: 'RECEIVED',
        purchaseId: data.purchase.id,
        receivedDate: formData.receivedDate,
        receivedWeight: formData.receivedWeight,
        actualQuantity: formData.actualQuantity,
        transportMortality: data.purchase.initialQuantity - formData.actualQuantity,
        mortalityReason: formData.mortalityReason,
        notes: formData.notes,
        penIds,
        penAllocations
      });

      onClose();
    } catch (error) {
      console.error('Erro ao processar recepção:', error);
      toast.error('Erro ao processar recepção. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!data || data.nextStatus !== 'RECEIVED') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Recepção e Alocação do Lote</DialogTitle>
          <DialogDescription>
            Registre a recepção do lote {data.purchase.lotCode} e aloque os animais nos currais
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reception" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Dados da Recepção
            </TabsTrigger>
            <TabsTrigger value="allocation" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Alocação em Currais
              {getTotalAllocated() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalAllocated()}/{formData.actualQuantity}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto flex-1 px-1">
            <TabsContent value="reception" className="space-y-4 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dados da Compra:</strong><br />
                  Peso: {data.purchase.purchaseWeight.toLocaleString('pt-BR')} kg | 
                  Quantidade: {data.purchase.initialQuantity} cabeças
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receivedDate">
                    <Calendar className="inline-block w-4 h-4 mr-1" />
                    Data de Recepção
                  </Label>
                  <Input
                    id="receivedDate"
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="receivedWeight">
                    <Weight className="inline-block w-4 h-4 mr-1" />
                    Peso Recebido (kg)
                  </Label>
                  <Input
                    id="receivedWeight"
                    type="number"
                    value={formData.receivedWeight}
                    onChange={(e) => setFormData({ ...formData, receivedWeight: parseFloat(e.target.value) })}
                  />
                  {formData.receivedWeight < data.purchase.purchaseWeight && (
                    <p className="text-xs text-destructive mt-1">
                      Quebra: {(data.purchase.purchaseWeight - formData.receivedWeight).toLocaleString('pt-BR')} kg 
                      ({((data.purchase.purchaseWeight - formData.receivedWeight) / data.purchase.purchaseWeight * 100).toFixed(2)}%)
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="actualQuantity">
                    <Users className="inline-block w-4 h-4 mr-1" />
                    Quantidade Recebida
                  </Label>
                  <Input
                    id="actualQuantity"
                    type="number"
                    value={formData.actualQuantity}
                    onChange={(e) => setFormData({ ...formData, actualQuantity: parseInt(e.target.value) || 0 })}
                  />
                  {formData.actualQuantity < data.purchase.initialQuantity && (
                    <p className="text-xs text-destructive mt-1">
                      Diferença: {data.purchase.initialQuantity - formData.actualQuantity} cabeças
                    </p>
                  )}
                </div>

                {formData.actualQuantity < data.purchase.initialQuantity && (
                  <div>
                    <Label htmlFor="mortality">Motivo da Diferença</Label>
                    <Select
                      value={formData.mortalityReason}
                      onValueChange={(value) => setFormData({ ...formData, mortalityReason: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MORTE_TRANSPORTE">Morte no transporte</SelectItem>
                        <SelectItem value="ERRO_CONTAGEM">Erro na contagem</SelectItem>
                        <SelectItem value="REFUGO">Animais refugados</SelectItem>
                        <SelectItem value="OUTRO">Outro motivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a recepção..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="allocation" className="space-y-4 mt-4">
              <Alert>
                <Home className="h-4 w-4" />
                <AlertDescription>
                  Distribua <strong>{formData.actualQuantity} animais</strong> entre os currais disponíveis.
                  {getRemainingToAllocate() > 0 && (
                    <span className="text-destructive ml-1">
                      Faltam {getRemainingToAllocate()} para alocar.
                    </span>
                  )}
                  {getRemainingToAllocate() === 0 && getTotalAllocated() > 0 && (
                    <span className="text-green-600 ml-1">
                      ✓ Todos alocados!
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center mb-2">
                <Label>Selecionar Currais</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoAllocate}
                  disabled={formData.actualQuantity <= 0}
                >
                  Distribuir Automaticamente
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {loadingPens ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Carregando currais...
                  </div>
                ) : availablePens.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum curral disponível
                  </div>
                ) : (
                  availablePens.map((pen) => {
                    const availableSpace = pen.capacity - pen.currentOccupancy;
                    const isSelected = selectedPens.has(pen.id);
                    const selectedQuantity = selectedPens.get(pen.id) || 0;
                    
                    return (
                      <div key={pen.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const toAllocate = Math.min(
                                    availableSpace, 
                                    getRemainingToAllocate() + selectedQuantity
                                  );
                                  handlePenSelection(pen.id, toAllocate);
                                } else {
                                  handlePenSelection(pen.id, 0);
                                }
                              }}
                            />
                            <div>
                              <p className="font-medium">
                                Curral {pen.penNumber}
                                <Badge variant="outline" className="ml-2">
                                  {pen.type === 'CONFINEMENT' ? 'Confinamento' : 
                                   pen.type === 'PASTURE' ? 'Pasto' :
                                   pen.type === 'QUARANTINE' ? 'Quarentena' : 'Hospital'}
                                </Badge>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {pen.location} • Disponível: {availableSpace} de {pen.capacity} vagas
                              </p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-24"
                                value={selectedQuantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const maxValue = Math.min(
                                    availableSpace,
                                    getRemainingToAllocate() + selectedQuantity
                                  );
                                  handlePenSelection(pen.id, Math.min(value, maxValue));
                                }}
                                min={0}
                                max={availableSpace}
                              />
                              <span className="text-sm text-muted-foreground">animais</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedPens.size > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Resumo da Alocação:</h4>
                  <div className="space-y-1 text-sm">
                    {Array.from(selectedPens.entries()).map(([penId, quantity]) => {
                      const pen = availablePens.find(p => p.id === penId);
                      return (
                        <div key={penId} className="flex justify-between">
                          <span>Curral {pen?.penNumber}:</span>
                          <span className="font-medium">{quantity} animais</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                      <span>Total Alocado:</span>
                      <span className={getTotalAllocated() === formData.actualQuantity ? 'text-green-600' : 'text-destructive'}>
                        {getTotalAllocated()} / {formData.actualQuantity}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || getTotalAllocated() !== formData.actualQuantity}
          >
            {loading ? 'Processando...' : 'Confirmar Recepção e Alocação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}