import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarIcon, Activity, Skull, ArrowRightLeft, Weight, Filter, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInterventionsApi } from '@/hooks/api/useInterventionsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePensApi } from '@/hooks/api/usePensApi';

interface InterventionHistoryProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const InterventionHistory: React.FC<InterventionHistoryProps> = ({ isOpen = true, onClose }) => {
  const [filters, setFilters] = useState({
    cattlePurchaseId: '',
    penId: '',
    type: '',
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  const [showFilters, setShowFilters] = useState(false);
  const [interventions, setInterventions] = useState<any[]>([]);

  const { getInterventionHistory, loading } = useInterventionsApi();
  const { cattlePurchases, fetchCattlePurchases } = useCattlePurchasesApi();
  const { pens, fetchPens } = usePensApi();

  useEffect(() => {
    fetchCattlePurchases();
    fetchPens();
    loadInterventions();
  }, []);

  useEffect(() => {
    loadInterventions();
  }, [filters]);

  const loadInterventions = async () => {
    const filterData = {
      ...filters,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString()
    };
    
    const result = await getInterventionHistory(filterData);
    if (result) {
      setInterventions(result);
    }
  };

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'health': return <Activity className="h-4 w-4" />;
      case 'mortality': return <Skull className="h-4 w-4" />;
      case 'movement': return <ArrowRightLeft className="h-4 w-4" />;
      case 'weight': return <Weight className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getInterventionColor = (type: string) => {
    switch (type) {
      case 'health': return 'bg-green-100 text-green-800 border-green-200';
      case 'mortality': return 'bg-red-100 text-red-800 border-red-200';
      case 'movement': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'weight': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterventionTitle = (intervention: any) => {
    switch (intervention.type) {
      case 'health':
        return `${intervention.productName} - ${intervention.interventionType}`;
      case 'mortality':
        return `${intervention.quantity} morte(s) - ${intervention.cause}`;
      case 'movement':
        return `Movimentação: ${intervention.quantity} animais`;
      case 'weight':
        return `Pesagem: ${intervention.averageWeight}kg (média)`;
      default:
        return 'Intervenção';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getLotName = (cattlePurchaseId: string) => {
    const purchase = cattlePurchases.find(p => p.id === cattlePurchaseId);
    return purchase ? `Lote ${purchase.lotNumber || purchase.id.slice(-4)}` : 'Lote desconhecido';
  };

  const getPenName = (penId: string) => {
    const pen = pens.find(p => p.id === penId);
    return pen ? pen.name : 'Curral desconhecido';
  };

  const clearFilters = () => {
    setFilters({
      cattlePurchaseId: '',
      penId: '',
      type: '',
      startDate: null,
      endDate: null
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Histórico de Intervenções</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Lote</label>
                <Select 
                  value={filters.cattlePurchaseId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, cattlePurchaseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os lotes</SelectItem>
                    {cattlePurchases.map(purchase => (
                      <SelectItem key={purchase.id} value={purchase.id}>
                        Lote {purchase.lotNumber || purchase.id.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Curral</label>
                <Select 
                  value={filters.penId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, penId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os currais</SelectItem>
                    {pens.map(pen => (
                      <SelectItem key={pen.id} value={pen.id}>
                        {pen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de intervenção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="health">Protocolo Sanitário</SelectItem>
                    <SelectItem value="mortality">Mortalidade</SelectItem>
                    <SelectItem value="movement">Movimentação</SelectItem>
                    <SelectItem value="weight">Pesagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.startDate || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.endDate || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : interventions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Nenhuma intervenção encontrada</p>
            </CardContent>
          </Card>
        ) : (
          interventions.map((intervention, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getInterventionColor(intervention.type)}`}>
                      {getInterventionIcon(intervention.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {getInterventionTitle(intervention)}
                        </h3>
                        <Badge variant="outline" className={getInterventionColor(intervention.type)}>
                          {intervention.type === 'health' && 'Sanitário'}
                          {intervention.type === 'mortality' && 'Mortalidade'}
                          {intervention.type === 'movement' && 'Movimentação'}
                          {intervention.type === 'weight' && 'Pesagem'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Lote:</strong> {getLotName(intervention.cattlePurchaseId)}</span>
                          <span><strong>Curral:</strong> {getPenName(intervention.penId)}</span>
                        </div>
                        <div><strong>Data:</strong> {formatDate(intervention.createdAt)}</div>
                        
                        {/* Detalhes específicos por tipo */}
                        {intervention.type === 'health' && (
                          <div>
                            <strong>Dose:</strong> {intervention.dose} {intervention.unit || 'ml'}
                            {intervention.veterinarian && <span className="ml-4"><strong>Veterinário:</strong> {intervention.veterinarian}</span>}
                          </div>
                        )}
                        
                        {intervention.type === 'mortality' && (
                          <div>
                            {intervention.specificCause && <span><strong>Causa específica:</strong> {intervention.specificCause}</span>}
                            {intervention.estimatedLoss && <span className="ml-4"><strong>Perda estimada:</strong> R$ {intervention.estimatedLoss.toLocaleString('pt-BR')}</span>}
                          </div>
                        )}
                        
                        {intervention.type === 'movement' && (
                          <div>
                            <strong>Motivo:</strong> {intervention.reason}
                            {intervention.responsibleUser && <span className="ml-4"><strong>Responsável:</strong> {intervention.responsibleUser}</span>}
                          </div>
                        )}
                        
                        {intervention.type === 'weight' && (
                          <div>
                            <strong>Amostra:</strong> {intervention.sampleSize} animais
                            {intervention.totalWeight && <span className="ml-4"><strong>Peso total:</strong> {intervention.totalWeight}kg</span>}
                            {intervention.weighingMethod && <span className="ml-4"><strong>Método:</strong> {intervention.weighingMethod}</span>}
                          </div>
                        )}
                        
                        {intervention.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <strong>Observações:</strong> {intervention.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InterventionHistory;