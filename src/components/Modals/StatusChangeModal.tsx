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
import { AlertCircle, Calendar, Weight, Users, MapPin, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePensApi } from '@/hooks/api/usePensApi';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [availablePens, setAvailablePens] = useState<any[]>([]);
  const [selectedPens, setSelectedPens] = useState<Map<string, number>>(new Map());
  const { fetchPens } = usePensApi();
  const [formData, setFormData] = useState<any>({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedWeight: data?.purchase?.purchaseWeight || 0,
    actualQuantity: data?.purchase?.initialQuantity || 0,
    notes: '',
    penAllocations: [],
  });

  useEffect(() => {
    if (data?.nextStatus === 'CONFINED') {
      loadAvailablePens();
    }
  }, [data?.nextStatus]);

  const loadAvailablePens = async () => {
    try {
      const pens = await fetchPens({ status: 'AVAILABLE', isActive: true });
      setAvailablePens(pens.items.filter((pen: any) => 
        pen.capacity - (pen.occupation?.totalOccupied || 0) > 0
      ));
    } catch (error) {
      console.error('Erro ao carregar currais:', error);
    }
  };

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

  const getModalContent = () => {
    if (!data) return null;

    switch (data.nextStatus) {
      case 'RECEIVED':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Registrar Recepção do Lote</DialogTitle>
              <DialogDescription>
                Confirme os dados da recepção do lote {data.purchase.lotCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Peso de compra: {data.purchase.purchaseWeight.toLocaleString('pt-BR')} kg
                  <br />
                  Quantidade comprada: {data.purchase.initialQuantity} cabeças
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
                    onChange={(e) => setFormData({ ...formData, actualQuantity: parseInt(e.target.value) })}
                  />
                  {formData.actualQuantity < data.purchase.initialQuantity && (
                    <p className="text-xs text-destructive mt-1">
                      Diferença: {data.purchase.initialQuantity - formData.actualQuantity} cabeças
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mortality">Motivo da Diferença</Label>
                  <Select
                    value={formData.mortalityReason}
                    onValueChange={(value) => setFormData({ ...formData, mortalityReason: value })}
                    disabled={formData.actualQuantity >= data.purchase.initialQuantity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORTE">Morte no transporte</SelectItem>
                      <SelectItem value="ERRO_COMPRA">Erro na compra</SelectItem>
                      <SelectItem value="ERRO_CARREGAMENTO">Erro no carregamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            </div>
          </>
        );

      case 'CONFINED':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar Confinamento</DialogTitle>
              <DialogDescription>
                Confirme o confinamento do lote {data.purchase.lotCode}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Peso atual: {(data.purchase.receivedWeight || data.purchase.purchaseWeight).toLocaleString('pt-BR')} kg
                  <br />
                  Quantidade atual: {data.purchase.currentQuantity} cabeças
                </AlertDescription>
              </Alert>

              <div>
                <Label>
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Selecionar Currais
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Distribua os {data.purchase.currentQuantity} animais entre os currais disponíveis
                </p>
                
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                  {availablePens.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum curral disponível
                    </p>
                  ) : (
                    availablePens.map((pen: any) => {
                      const availableSpace = pen.capacity - (pen.occupation?.totalOccupied || 0);
                      const isSelected = selectedPens.has(pen.id);
                      const selectedQuantity = selectedPens.get(pen.id) || 0;
                      
                      return (
                        <div key={pen.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handlePenSelection(pen.id, Math.min(availableSpace, data.purchase.currentQuantity - getTotalAllocated()));
                                } else {
                                  handlePenSelection(pen.id, 0);
                                }
                              }}
                            />
                            <div>
                              <p className="font-medium">Curral {pen.penNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                Espaço disponível: {availableSpace} de {pen.capacity} cabeças
                              </p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <Input
                              type="number"
                              value={selectedQuantity}
                              onChange={(e) => handlePenSelection(pen.id, parseInt(e.target.value) || 0)}
                              min={0}
                              max={Math.min(availableSpace, data.purchase.currentQuantity)}
                              className="w-24"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {getTotalAllocated() > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Total alocado: {getTotalAllocated()} de {data.purchase.currentQuantity} cabeças
                    </p>
                    {getTotalAllocated() < data.purchase.currentQuantity && (
                      <p className="text-sm text-destructive mt-1">
                        Faltam alocar {data.purchase.currentQuantity - getTotalAllocated()} cabeças
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o confinamento..."
                  rows={3}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleConfirm = async () => {
    // Validate pen allocations for CONFINED status
    if (data.nextStatus === 'CONFINED') {
      const totalAllocated = getTotalAllocated();
      if (totalAllocated !== data.purchase.currentQuantity) {
        alert(`Você deve alocar todos os ${data.purchase.currentQuantity} animais. Atualmente alocados: ${totalAllocated}`);
        return;
      }
    }

    setLoading(true);
    try {
      const penAllocations = data.nextStatus === 'CONFINED' 
        ? Array.from(selectedPens.entries()).map(([penId, quantity]) => ({
            penId,
            quantity
          }))
        : undefined;

      await onConfirm({
        ...formData,
        status: data.nextStatus,
        purchaseId: data.purchase.id,
        penAllocations,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao mudar status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {getModalContent()}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}