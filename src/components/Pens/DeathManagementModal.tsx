import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronDown,
  FileText,
  Plus,
  Search,
  Skull,
  TrendingDown,
  AlertTriangle,
  Activity,
  BarChart3,
  Trash2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { useDeathRecordsApi, DeathType } from '@/hooks/api/useDeathRecordsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePensApi } from '@/hooks/api/usePensApi';

interface DeathManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPenId?: string;
  selectedPurchaseId?: string;
}

export function DeathManagementModal({
  isOpen,
  onClose,
  selectedPenId,
  selectedPurchaseId,
}: DeathManagementModalProps) {
  const [activeTab, setActiveTab] = useState('register');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    purchaseId: selectedPurchaseId || '',
    penId: selectedPenId || '',
    quantity: 1,
    deathDate: new Date(),
    deathType: 'UNKNOWN' as DeathType,
    cause: '',
    veterinaryNotes: '',
    estimatedLoss: 0,
  });

  // Hooks
  const {
    deathRecords,
    statistics,
    loading,
    loadDeathRecords,
    createDeathRecord,
    deleteDeathRecord,
    loadStatistics,
    getDeathTypeLabel,
    getDeathTypeColor,
  } = useDeathRecordsApi();

  const { purchases, loadPurchases } = useCattlePurchasesApi();
  const { pens, refresh: loadPens } = usePensApi();

  // Carregar dados ao abrir
  useEffect(() => {
    if (isOpen) {
      loadPurchases();
      loadPens();
      loadDeathRecords({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
      loadStatistics({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
    }
  }, [isOpen, selectedPenId, selectedPurchaseId]);

  // Filtrar registros
  const filteredRecords = deathRecords.filter(record => {
    const matchesSearch = 
      record.purchase?.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pen?.penNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.cause?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.purchaseId || !formData.penId) {
      toast.error('Selecione o lote e o curral');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    try {
      await createDeathRecord(formData);
      
      // Resetar form
      setFormData({
        purchaseId: selectedPurchaseId || '',
        penId: selectedPenId || '',
        quantity: 1,
        deathDate: new Date(),
        deathType: 'UNKNOWN',
        cause: '',
        veterinaryNotes: '',
        estimatedLoss: 0,
      });
      
      // Recarregar dados
      loadDeathRecords({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
      loadStatistics({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
      
      setActiveTab('history');
    } catch (_error) {
      // Erro já tratado no hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este registro de morte?')) {
      return;
    }

    const success = await deleteDeathRecord(id);
    if (success) {
      loadDeathRecords({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
      loadStatistics({
        penId: selectedPenId,
        purchaseId: selectedPurchaseId,
      });
    }
  };

  // Calcular perda estimada automaticamente
  useEffect(() => {
    if (formData.purchaseId && formData.quantity > 0) {
      const purchase = purchases.find(p => p.id === formData.purchaseId);
      if (purchase) {
        const avgWeight = purchase.purchaseWeight / purchase.quantity;
        const pricePerKg = purchase.totalCost / (purchase.quantity * purchase.purchaseWeight);
        const estimatedLoss = formData.quantity * avgWeight * pricePerKg;
        setFormData(prev => ({ ...prev, estimatedLoss }));
      }
    }
  }, [formData.purchaseId, formData.quantity, purchases]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-600" />
            Gestão de Intervenções e Mortes
          </DialogTitle>
          <DialogDescription>
            Registre e acompanhe mortes e intervenções veterinárias
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="register">Registrar Morte</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 max-h-[60vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase">Lote</Label>
                  <Select
                    value={formData.purchaseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, purchaseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchases.map(purchase => (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          {purchase.lotCode} - {purchase.vendor?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pen">Curral</Label>
                  <Select
                    value={formData.penId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, penId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o curral" />
                    </SelectTrigger>
                    <SelectContent>
                      {pens.map(pen => (
                        <SelectItem key={pen.id} value={pen.id}>
                          Curral {pen.code} - Capacidade: {pen.capacity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deathDate">Data da Morte</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.deathDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deathDate ? (
                          format(formData.deathDate, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.deathDate}
                        onSelect={(date) => date && setFormData(prev => ({ 
                          ...prev, 
                          deathDate: date 
                        }))}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deathType">Tipo de Morte</Label>
                  <Select
                    value={formData.deathType}
                    onValueChange={(value: DeathType) => setFormData(prev => ({ 
                      ...prev, 
                      deathType: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DISEASE">Doença</SelectItem>
                      <SelectItem value="ACCIDENT">Acidente</SelectItem>
                      <SelectItem value="PREDATION">Predação</SelectItem>
                      <SelectItem value="POISONING">Envenenamento</SelectItem>
                      <SelectItem value="STRESS">Estresse</SelectItem>
                      <SelectItem value="UNKNOWN">Desconhecida</SelectItem>
                      <SelectItem value="OTHER">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cause">Causa Específica</Label>
                <Input
                  id="cause"
                  value={formData.cause}
                  onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                  placeholder="Ex: Pneumonia, Timpanismo, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veterinaryNotes">Observações Veterinárias</Label>
                <Textarea
                  id="veterinaryNotes"
                  value={formData.veterinaryNotes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    veterinaryNotes: e.target.value 
                  }))}
                  placeholder="Descreva sintomas, tratamentos tentados, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedLoss">Perda Estimada</Label>
                <Input
                  id="estimatedLoss"
                  type="number"
                  step="0.01"
                  value={formData.estimatedLoss}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimatedLoss: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="Valor estimado da perda"
                />
                <p className="text-sm text-muted-foreground">
                  Valor calculado automaticamente baseado no peso médio
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Registrar Morte
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por lote, curral ou causa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Curral</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Causa</TableHead>
                    <TableHead>Perda</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Nenhum registro de morte encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.deathDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          {record.purchase?.lotCode}
                        </TableCell>
                        <TableCell>
                          {record.pen?.penNumber}
                        </TableCell>
                        <TableCell>{record.quantity}</TableCell>
                        <TableCell>
                          <Badge className={getDeathTypeColor(record.deathType)}>
                            {getDeathTypeLabel(record.deathType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.cause || '-'}</TableCell>
                        <TableCell>
                          {formatCurrency(record.estimatedLoss || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Mortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.totalDeaths}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Taxa: {statistics.mortalityRate.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Perda Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(statistics.totalEstimatedLoss)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Principal Causa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {Object.entries(statistics.deathsByType)
                        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(statistics.deathsByType)
                        .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} mortes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Mortes por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics && Object.entries(statistics.deathsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge className={getDeathTypeColor(type as DeathType)}>
                        {getDeathTypeLabel(type as DeathType)}
                      </Badge>
                      <span className="font-medium">{count} mortes</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mortes por Curral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics && Object.entries(statistics.deathsByPen)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([pen, count]) => (
                      <div key={pen} className="flex items-center justify-between">
                        <span>{pen}</span>
                        <span className="font-medium">{count} mortes</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default DeathManagementModal;
