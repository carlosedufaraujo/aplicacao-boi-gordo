import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar,
  MapPin,
  Weight,
  Heart,
  DollarSign,
  TrendingUp,
  Clock,
  Edit,
  Eye,
  Trash2,
  FileText,
  Download,
  ChevronRight,
  Activity,
  Beef,
  Calculator
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Stores e hooks
import { useAppStore } from '@/stores/useAppStore';
import { useCattleLots, usePurchaseOrders } from '@/hooks/useSupabaseData';

export const ModernLots: React.FC = () => {
  const { cattleLots } = useCattleLots();
  const { purchaseOrders } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSaleSimulation, setShowSaleSimulation] = useState(false);

  // Filtrar lotes
  const filteredLots = useMemo(() => {
    return cattleLots.filter(lot => {
      const matchesSearch = searchTerm === '' || 
        lot.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.origin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [cattleLots, searchTerm, statusFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const activeLots = cattleLots.filter(l => l.status === 'active');
    const totalAnimals = activeLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
    const totalWeight = activeLots.reduce((sum, lot) => sum + (lot.currentQuantity * lot.currentAverageWeight), 0);
    const avgDaysConfined = activeLots.reduce((sum, lot) => {
      const days = differenceInDays(new Date(), new Date(lot.entryDate));
      return sum + days;
    }, 0) / (activeLots.length || 1);

    const totalCost = activeLots.reduce((sum, lot) => {
      const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
      if (!order) return sum;
      return sum + order.totalValue;
    }, 0);

    return {
      totalLots: cattleLots.length,
      activeLots: activeLots.length,
      soldLots: cattleLots.filter(l => l.status === 'sold').length,
      totalAnimals,
      totalWeight,
      avgDaysConfined: Math.round(avgDaysConfined),
      totalCost,
      mortalityRate: 0.5, // Simulado
    };
  }, [cattleLots, purchaseOrders]);

  // Função para calcular rendimento estimado
  const calculateEstimatedYield = (lot: any) => {
    const daysConfined = differenceInDays(new Date(), new Date(lot.entryDate));
    const estimatedWeight = lot.entryWeight + (lot.estimatedGmd * lot.entryQuantity * daysConfined);
    const estimatedArrobas = (estimatedWeight * 0.54) / 15; // 54% de rendimento
    const estimatedValue = estimatedArrobas * 320; // R$ 320 por arroba (exemplo)
    
    return {
      daysConfined,
      estimatedWeight,
      estimatedArrobas,
      estimatedValue
    };
  };

  const LotCard = ({ lot }: { lot: any }) => {
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    const metrics = calculateEstimatedYield(lot);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="card-title">{lot.code}</CardTitle>
              <CardDescription>{lot.origin}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={lot.status === 'active' ? 'success' : 'secondary'}>
                {lot.status === 'active' ? 'Ativo' : 'Vendido'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedLot(lot);
                    setShowDetail(true);
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedLot(lot);
                    setShowEdit(true);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedLot(lot);
                    setShowSaleSimulation(true);
                  }}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Simular venda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Quantidade de animais */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Beef className="h-3 w-3" />
                <span className="text-xs">Animais</span>
              </div>
              <p className="card-value">{lot.currentQuantity}</p>
              {lot.deaths > 0 && (
                <p className="text-xs text-red-600">-{lot.deaths} mortes</p>
              )}
            </div>

            {/* Peso médio */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Weight className="h-3 w-3" />
                <span className="text-xs">Peso médio</span>
              </div>
              <p className="card-value">{(lot.currentAverageWeight || 0).toFixed(1)} kg</p>
              <p className="text-xs text-green-600">
                +{(((lot.currentAverageWeight || 0) - (lot.entryWeight || 0)) / (lot.entryQuantity || 1)).toFixed(1)} kg
              </p>
            </div>

            {/* Dias confinados */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Dias confinados</span>
              </div>
              <p className="card-value">{metrics.daysConfined}</p>
            </div>

            {/* GMD */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">GMD</span>
              </div>
              <p className="card-value">{(lot.estimatedGmd || 0).toFixed(2)} kg/dia</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Valor estimado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor estimado</span>
              <span className="font-semibold text-green-600">
                R$ {metrics.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              65% do ciclo completo
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button variant="outline" className="w-full" onClick={() => {
            setSelectedLot(lot);
            setShowDetail(true);
          }}>
            Ver detalhes completos
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="page-title">Gestão de Lotes</h2>
            <p className="page-subtitle">
              Acompanhe e gerencie todos os lotes de animais confinados
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Lotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="kpi-value">{stats.totalLots}</span>
                <span className="text-sm text-green-600">
                  {stats.activeLots} ativos
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Animais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAnimals.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peso Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.totalWeight || 0) / 1000).toFixed(1)} ton
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média Dias Confinados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDaysConfined} dias</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por código ou origem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="sold">Vendidos</SelectItem>
                  <SelectItem value="finished">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de visualização */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
          </TabsList>

          {/* Visualização em Cards */}
          <TabsContent value="cards" className="space-y-4">
            {filteredLots.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLots.map(lot => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum lote encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar um novo lote
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visualização em Tabela */}
          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Animais</TableHead>
                        <TableHead>Peso Médio</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>GMD</TableHead>
                        <TableHead>Valor Est.</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLots.map(lot => {
                        const metrics = calculateEstimatedYield(lot);
                        return (
                          <TableRow key={lot.id}>
                            <TableCell className="font-medium">{lot.code}</TableCell>
                            <TableCell>
                              <Badge variant={lot.status === 'active' ? 'success' : 'secondary'}>
                                {lot.status === 'active' ? 'Ativo' : 'Vendido'}
                              </Badge>
                            </TableCell>
                            <TableCell>{lot.origin}</TableCell>
                            <TableCell>{lot.currentQuantity}</TableCell>
                            <TableCell>{(lot.currentAverageWeight || 0).toFixed(1)} kg</TableCell>
                            <TableCell>{metrics.daysConfined}</TableCell>
                            <TableCell>{(lot.estimatedGmd || 0).toFixed(2)} kg/dia</TableCell>
                            <TableCell>
                              R$ {metrics.estimatedValue.toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                                  <DropdownMenuItem>Editar</DropdownMenuItem>
                                  <DropdownMenuItem>Simular venda</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ativos</span>
                      <span className="font-medium">{stats.activeLots}</span>
                    </div>
                    <Progress value={(stats.activeLots / stats.totalLots) * 100} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vendidos</span>
                      <span className="font-medium">{stats.soldLots}</span>
                    </div>
                    <Progress value={(stats.soldLots / stats.totalLots) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Mortalidade</span>
                      <Badge variant={stats.mortalityRate < 2 ? "success" : "destructive"}>
                        {(stats.mortalityRate || 0).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">GMD Médio</span>
                      <span className="font-medium">1.35 kg/dia</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Conversão Alimentar</span>
                      <span className="font-medium">6.2:1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de detalhes */}
        {selectedLot && showDetail && (
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Lote {selectedLot.code}</DialogTitle>
                <DialogDescription>
                  Informações completas sobre o lote
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium">{selectedLot.origin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Entrada</p>
                    <p className="font-medium">
                      {format(new Date(selectedLot.entryDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Inicial</p>
                    <p className="font-medium">{selectedLot.entryQuantity} animais</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                    <p className="font-medium">{selectedLot.currentQuantity} animais</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso de Entrada</p>
                    <p className="font-medium">{selectedLot.entryWeight} kg (total)</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Peso Atual</p>
                    <p className="font-medium">
                      {((selectedLot.currentQuantity || 0) * (selectedLot.currentAverageWeight || 0)).toFixed(0)} kg
                    </p>
                  </div>
                </div>

                <Separator />

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>Performance do Lote</AlertTitle>
                  <AlertDescription>
                    GMD: {(selectedLot.estimatedGmd || 0).toFixed(2)} kg/dia | 
                    Conversão: 6.2:1 | 
                    Mortalidade: {(((selectedLot.deaths || 0) / (selectedLot.entryQuantity || 1)) * 100).toFixed(1)}%
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Fechar
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Lote
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
};