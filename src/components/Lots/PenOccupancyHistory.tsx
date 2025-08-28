import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OccupancyHistoryData {
  date: string;
  timestamp: Date;
  penId: string;
  penNumber: string;
  occupancy: number;
  capacity: number;
  occupancyRate: number;
  activeLots: number;
  movements: number; // Movimentações no dia
}

interface PenOccupancyHistoryProps {
  penId?: string;
  penNumber?: string;
  className?: string;
}

export const PenOccupancyHistory: React.FC<PenOccupancyHistoryProps> = ({
  penId,
  penNumber,
  className
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedPen, setSelectedPen] = useState<string>(penId || 'all');
  const [loading, setLoading] = useState(false);

  // Dados mockados para demonstração (em produção, viriam do Supabase)
  const generateMockData = (): OccupancyHistoryData[] => {
    const data: OccupancyHistoryData[] = [];
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd/MM');
      
      // Simular dados para múltiplos currais
      const pens = ['CURRAL-01', 'CURRAL-02', 'CURRAL-03', 'CURRAL-04', 'CURRAL-05'];
      
      pens.forEach((pen, index) => {
        const baseOccupancy = 80 + Math.sin(i * 0.1) * 20 + (index * 10);
        const occupancy = Math.max(0, Math.min(130, baseOccupancy + (Math.random() - 0.5) * 30));
        const capacity = 130;
        
        data.push({
          date: dateStr,
          timestamp: date,
          penId: `pen-${index + 1}`,
          penNumber: pen,
          occupancy: Math.round(occupancy),
          capacity,
          occupancyRate: (occupancy / capacity) * 100,
          activeLots: Math.floor(occupancy / 30) + 1,
          movements: Math.floor(Math.random() * 5)
        });
      });
    }
    
    return data;
  };

  const historyData = useMemo(() => generateMockData(), [selectedPeriod]);

  // Filtrar dados por curral se selecionado
  const filteredData = useMemo(() => {
    if (selectedPen === 'all') {
      // Agrupar por data para visão geral
      const groupedByDate = historyData.reduce((acc, item) => {
        const existing = acc.find(d => d.date === item.date);
        if (existing) {
          existing.occupancy += item.occupancy;
          existing.capacity += item.capacity;
          existing.activeLots += item.activeLots;
          existing.movements += item.movements;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [] as OccupancyHistoryData[]);
      
      return groupedByDate.map(item => ({
        ...item,
        occupancyRate: (item.occupancy / item.capacity) * 100
      }));
    }
    
    return historyData.filter(item => item.penId === selectedPen);
  }, [historyData, selectedPen]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const avgOccupancy = filteredData.reduce((sum, item) => sum + item.occupancyRate, 0) / filteredData.length;
    const maxOccupancy = Math.max(...filteredData.map(item => item.occupancyRate));
    const minOccupancy = Math.min(...filteredData.map(item => item.occupancyRate));
    const totalMovements = filteredData.reduce((sum, item) => sum + item.movements, 0);
    
    const trend = filteredData.length > 1 
      ? filteredData[filteredData.length - 1].occupancyRate - filteredData[0].occupancyRate
      : 0;
    
    return {
      avgOccupancy,
      maxOccupancy,
      minOccupancy,
      totalMovements,
      trend
    };
  }, [filteredData]);

  // Dados para gráfico de pizza (distribuição de ocupação)
  const pieData = useMemo(() => {
    const ranges = [
      { name: '0-25%', min: 0, max: 25, color: '#10b981' },
      { name: '26-50%', min: 26, max: 50, color: '#3b82f6' },
      { name: '51-75%', min: 51, max: 75, color: '#f59e0b' },
      { name: '76-100%', min: 76, max: 100, color: '#ef4444' }
    ];
    
    return ranges.map(range => ({
      name: range.name,
      value: filteredData.filter(item => 
        item.occupancyRate >= range.min && item.occupancyRate <= range.max
      ).length,
      color: range.color
    })).filter(item => item.value > 0);
  }, [filteredData]);

  const handleRefresh = async () => {
    setLoading(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleExport = () => {
    // Implementar exportação dos dados
    const csvContent = [
      'Data,Curral,Ocupação,Capacidade,Taxa,Lotes,Movimentações',
      ...filteredData.map(item => 
        `${item.date},${item.penNumber},${item.occupancy},${item.capacity},${item.occupancyRate.toFixed(1)}%,${item.activeLots},${item.movements}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocupacao-currais-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      {/* Controles */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Histórico de Ocupação
              </CardTitle>
              <CardDescription>
                Análise temporal da ocupação dos currais
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                  <SelectItem value="1y">1 ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={selectedPen} onValueChange={setSelectedPen}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Selecionar curral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os currais</SelectItem>
                <SelectItem value="pen-1">CURRAL-01</SelectItem>
                <SelectItem value="pen-2">CURRAL-02</SelectItem>
                <SelectItem value="pen-3">CURRAL-03</SelectItem>
                <SelectItem value="pen-4">CURRAL-04</SelectItem>
                <SelectItem value="pen-5">CURRAL-05</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Média</span>
              </div>
              <div className="text-2xl font-bold">{stats.avgOccupancy.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Máxima</span>
              </div>
              <div className="text-2xl font-bold text-success">{stats.maxOccupancy.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-info" />
                <span className="text-sm text-muted-foreground">Mínima</span>
              </div>
              <div className="text-2xl font-bold text-info">{stats.minOccupancy.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Movimentações</span>
              </div>
              <div className="text-2xl font-bold text-warning">{stats.totalMovements}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {stats.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-error" />
                )}
                <span className="text-sm text-muted-foreground">Tendência</span>
              </div>
              <div className={`text-2xl font-bold ${stats.trend >= 0 ? 'text-success' : 'text-error'}`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="line" className="space-y-4">
        <TabsList>
          <TabsTrigger value="line">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="area">Área</TabsTrigger>
          <TabsTrigger value="bar">Barras</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Ocupação</CardTitle>
              <CardDescription>Taxa de ocupação ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Ocupação']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="occupancyRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area">
          <Card>
            <CardHeader>
              <CardTitle>Área de Ocupação</CardTitle>
              <CardDescription>Visualização em área da ocupação</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)}%`, 'Ocupação']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="occupancyRate" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Diárias</CardTitle>
              <CardDescription>Número de movimentações por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Movimentações']}
                  />
                  <Bar 
                    dataKey="movements" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Ocupação</CardTitle>
                <CardDescription>Percentual de tempo em cada faixa</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Dias']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {pieData.map((entry, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
                <CardDescription>Principais métricas do período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Período analisado:</span>
                  <Badge>{selectedPeriod === '7d' ? '7 dias' : selectedPeriod === '30d' ? '30 dias' : selectedPeriod === '90d' ? '90 dias' : '1 ano'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pontos de dados:</span>
                  <span className="font-medium">{filteredData.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Curral selecionado:</span>
                  <Badge variant="outline">{selectedPen === 'all' ? 'Todos' : selectedPen}</Badge>
                </div>
                {stats && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Variação:</span>
                      <span className="font-medium">{(stats.maxOccupancy - stats.minOccupancy).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estabilidade:</span>
                      <Badge variant={Math.abs(stats.trend) < 5 ? "default" : "secondary"}>
                        {Math.abs(stats.trend) < 5 ? 'Estável' : 'Variável'}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
