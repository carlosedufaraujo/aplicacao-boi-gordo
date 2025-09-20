import React, { useMemo, useState } from 'react';
import {
  Syringe,
  Skull,
  ArrowRightLeft,
  Weight,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tipos de intervenção
type InterventionType = 'PROTOCOL' | 'MORTALITY' | 'MOVEMENT' | 'WEIGHING';

interface UnifiedIntervention {
  id: string;
  date: Date;
  type: InterventionType;
  lotNumber: string;
  penNumber?: string;
  description: string;
  quantity?: number;
  weight?: number;
  weightChange?: number;
  value?: number;
  responsible?: string;
  observations?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  severity?: 'low' | 'medium' | 'high';
}

interface UnifiedInterventionsTableProps {
  lotId?: string;
  protocols?: any[];
  mortalities?: any[];
  movements?: any[];
  weighings?: any[];
  occupancyData?: any[];
}

export function UnifiedInterventionsTable({
  lotId,
  protocols = [],
  mortalities = [],
  movements = [],
  weighings = [],
  occupancyData = []
}: UnifiedInterventionsTableProps) {
  const [filterType, setFilterType] = useState<InterventionType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');

  // Unificar todas as intervenções em um único array
  const unifiedInterventions = useMemo<UnifiedIntervention[]>(() => {
    const interventions: UnifiedIntervention[] = [];

    // Adicionar protocolos sanitários
    protocols.forEach(protocol => {
      interventions.push({
        id: `protocol-${protocol.id}`,
        date: new Date(protocol.applicationDate || protocol.createdAt),
        type: 'PROTOCOL',
        lotNumber: protocol.lotNumber || 'N/A',
        penNumber: protocol.penNumber,
        description: protocol.protocolName || protocol.description,
        quantity: protocol.animalsCount,
        value: protocol.cost,
        responsible: protocol.veterinarian || protocol.responsible,
        observations: protocol.observations,
        status: protocol.status || 'completed',
        severity: 'low'
      });
    });

    // Adicionar mortalidades
    mortalities.forEach(mortality => {
      interventions.push({
        id: `mortality-${mortality.id}`,
        date: new Date(mortality.date || mortality.createdAt),
        type: 'MORTALITY',
        lotNumber: mortality.lotNumber || 'N/A',
        penNumber: mortality.penNumber,
        description: `Mortalidade - ${mortality.cause || 'Causa não especificada'}`,
        quantity: mortality.quantity || 1,
        responsible: mortality.reportedBy,
        observations: mortality.notes,
        status: 'completed',
        severity: 'high'
      });
    });

    // Adicionar movimentações
    movements.forEach(movement => {
      interventions.push({
        id: `movement-${movement.id}`,
        date: new Date(movement.date || movement.createdAt),
        type: 'MOVEMENT',
        lotNumber: movement.lotNumber || 'N/A',
        penNumber: movement.fromPen || movement.toPen,
        description: `Movimentação: ${movement.fromPen || 'N/A'} → ${movement.toPen || 'N/A'}`,
        quantity: movement.quantity,
        responsible: movement.responsible,
        observations: movement.reason,
        status: movement.status || 'completed',
        severity: 'medium'
      });
    });

    // Adicionar pesagens
    weighings.forEach(weighing => {
      const weightChange = weighing.previousWeight
        ? weighing.averageWeight - weighing.previousWeight
        : 0;

      interventions.push({
        id: `weighing-${weighing.id}`,
        date: new Date(weighing.date || weighing.createdAt),
        type: 'WEIGHING',
        lotNumber: weighing.lotNumber || 'N/A',
        penNumber: weighing.penNumber,
        description: `Pesagem - Peso médio: ${weighing.averageWeight?.toFixed(1) || 0}kg`,
        quantity: weighing.animalsWeighed,
        weight: weighing.averageWeight,
        weightChange: weightChange,
        responsible: weighing.responsible,
        observations: weighing.notes,
        status: 'completed',
        severity: weightChange < -5 ? 'high' : weightChange > 5 ? 'low' : 'medium'
      });
    });

    return interventions.sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.getTime() - a.date.getTime();
      }
      return a.type.localeCompare(b.type);
    });
  }, [protocols, mortalities, movements, weighings, sortBy]);

  // Filtrar intervenções
  const filteredInterventions = useMemo(() => {
    return unifiedInterventions.filter(intervention => {
      // Filtrar por tipo
      if (filterType !== 'ALL' && intervention.type !== filterType) {
        return false;
      }

      // Filtrar por termo de busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          intervention.description.toLowerCase().includes(search) ||
          intervention.lotNumber.toLowerCase().includes(search) ||
          intervention.penNumber?.toLowerCase().includes(search) ||
          intervention.responsible?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [unifiedInterventions, filterType, searchTerm]);

  // Estatísticas
  const statistics = useMemo(() => {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent = filteredInterventions.filter(i => i.date >= last30Days);

    return {
      total: filteredInterventions.length,
      recent: recent.length,
      byType: {
        protocol: filteredInterventions.filter(i => i.type === 'PROTOCOL').length,
        mortality: filteredInterventions.filter(i => i.type === 'MORTALITY').length,
        movement: filteredInterventions.filter(i => i.type === 'MOVEMENT').length,
        weighing: filteredInterventions.filter(i => i.type === 'WEIGHING').length
      },
      totalMortalities: filteredInterventions
        .filter(i => i.type === 'MORTALITY')
        .reduce((acc, i) => acc + (i.quantity || 0), 0),
      avgWeightGain: filteredInterventions
        .filter(i => i.type === 'WEIGHING' && i.weightChange)
        .reduce((acc, i, _, arr) => acc + (i.weightChange || 0) / arr.length, 0)
    };
  }, [filteredInterventions]);

  const getTypeIcon = (type: InterventionType) => {
    switch (type) {
      case 'PROTOCOL': return <Syringe className="h-4 w-4" />;
      case 'MORTALITY': return <Skull className="h-4 w-4" />;
      case 'MOVEMENT': return <ArrowRightLeft className="h-4 w-4" />;
      case 'WEIGHING': return <Weight className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: InterventionType) => {
    switch (type) {
      case 'PROTOCOL': return 'bg-blue-500/10 text-blue-500';
      case 'MORTALITY': return 'bg-red-500/10 text-red-500';
      case 'MOVEMENT': return 'bg-amber-500/10 text-amber-500';
      case 'WEIGHING': return 'bg-green-500/10 text-green-500';
    }
  };

  const getTypeLabel = (type: InterventionType) => {
    switch (type) {
      case 'PROTOCOL': return 'Protocolo';
      case 'MORTALITY': return 'Mortalidade';
      case 'MOVEMENT': return 'Movimentação';
      case 'WEIGHING': return 'Pesagem';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'medium': return <Minus className="h-3 w-3 text-amber-500" />;
      case 'low': return <TrendingUp className="h-3 w-3 text-green-500" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Lote', 'Curral', 'Descrição', 'Quantidade', 'Responsável'];
    const rows = filteredInterventions.map(i => [
      format(i.date, 'dd/MM/yyyy'),
      getTypeLabel(i.type),
      i.lotNumber,
      i.penNumber || '',
      i.description,
      i.quantity || '',
      i.responsible || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intervencoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Central de Intervenções
            </CardTitle>
            <CardDescription>
              Histórico completo de todas as intervenções realizadas nos lotes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {statistics.total} registros
            </Badge>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10">
            <Syringe className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Protocolos</p>
              <p className="text-sm font-semibold">{statistics.byType.protocol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
            <Skull className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Mortalidades</p>
              <p className="text-sm font-semibold">{statistics.totalMortalities}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Movimentações</p>
              <p className="text-sm font-semibold">{statistics.byType.movement}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
            <Weight className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">GMD</p>
              <p className="text-sm font-semibold">
                {statistics.avgWeightGain.toFixed(2)}kg
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input
            placeholder="Buscar por lote, curral, responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:flex-1"
          />
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo de intervenção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as intervenções</SelectItem>
              <SelectItem value="PROTOCOL">Protocolos Sanitários</SelectItem>
              <SelectItem value="MORTALITY">Mortalidades</SelectItem>
              <SelectItem value="MOVEMENT">Movimentações</SelectItem>
              <SelectItem value="WEIGHING">Pesagens</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de intervenções */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Lote/Curral</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterventions.length > 0 ? (
                filteredInterventions.slice(0, 20).map((intervention) => (
                  <TableRow key={intervention.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(intervention.date, 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1 ${getTypeColor(intervention.type)}`}
                      >
                        {getTypeIcon(intervention.type)}
                        {getTypeLabel(intervention.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{intervention.lotNumber}</p>
                        {intervention.penNumber && (
                          <p className="text-xs text-muted-foreground">
                            Curral {intervention.penNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{intervention.description}</p>
                          {intervention.observations && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {intervention.observations}
                            </p>
                          )}
                        </div>
                        {intervention.severity && getSeverityIcon(intervention.severity)}
                      </div>
                      {intervention.type === 'WEIGHING' && intervention.weightChange && (
                        <div className="flex items-center gap-1 mt-1">
                          {intervention.weightChange > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-xs font-medium ${
                            intervention.weightChange > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {intervention.weightChange > 0 ? '+' : ''}
                            {intervention.weightChange.toFixed(1)}kg
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {intervention.quantity || '-'}
                    </TableCell>
                    <TableCell>
                      {intervention.responsible || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant={intervention.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {intervention.status === 'completed' ? 'Concluído' :
                               intervention.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Status da intervenção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma intervenção encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredInterventions.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Mostrando 20 de {filteredInterventions.length} intervenções
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}