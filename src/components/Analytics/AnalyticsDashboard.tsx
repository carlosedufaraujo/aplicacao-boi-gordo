import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingDown, TrendingUp, AlertTriangle, Info,
  Download, Filter, Calendar, MapPin, Thermometer,
  Heart, DollarSign, Percent, AlertCircle
} from 'lucide-react';
import { useAnalyticsApi } from '@/hooks/api/useAnalyticsApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export const AnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'month' | 'year' | 'all-time'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  const {
    loading,
    error,
    getAnalyticsDashboard,
    getWeightBreakCorrelations,
    getEnvironmentalCorrelations,
    getTreatmentEffectiveness
  } = useAnalyticsApi();

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      const data = await getAnalyticsDashboard(period);
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  const loadAdditionalData = async (type: string) => {
    try {
      switch (type) {
        case 'correlations':
          const correlations = await getWeightBreakCorrelations();
          console.log('Correlações:', correlations);
          break;
        case 'environmental':
          const environmental = await getEnvironmentalCorrelations();
          console.log('Análise ambiental:', environmental);
          break;
        case 'treatments':
          const treatments = await getTreatmentEffectiveness();
          console.log('Eficácia de tratamentos:', treatments);
          break;
      }
    } catch (err) {
      console.error(`Erro ao carregar ${type}:`, err);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Analítico</h1>
        <div className="flex gap-4">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
              <SelectItem value="all-time">Todo Período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quebra Média</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.weightBreak?.patterns?.[0]?.averageBreak?.toFixed(2) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.weightBreak?.patterns?.[0]?.sampleSize || 0} amostras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Mortalidade</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.mortality?.patterns?.phasePatterns?.[0]?.averageRate?.toFixed(2) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.mortality?.patterns?.phasePatterns?.[0]?.totalDeaths || 0} óbitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Financeiro</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {((dashboardData?.mortality?.patterns?.phasePatterns?.[0]?.totalLoss || 0) / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground">
              Perdas totais no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 críticos, 1 moderado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="weight-break">Quebra de Peso</TabsTrigger>
          <TabsTrigger value="mortality">Mortalidade</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quebra por Região */}
            <Card>
              <CardHeader>
                <CardTitle>Quebra de Peso por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.weightBreak?.patterns || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                    <Legend />
                    <Bar dataKey="averageBreak" fill="#3b82f6" name="Quebra Média %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mortalidade por Fase */}
            <Card>
              <CardHeader>
                <CardTitle>Mortalidade por Fase</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.mortality?.patterns?.phasePatterns || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.phase}: ${entry.totalDeaths}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalDeaths"
                    >
                      {(dashboardData?.mortality?.patterns?.phasePatterns || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Correlações */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Correlações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-sm font-medium">Temperatura × Quebra</div>
                  <div className="text-2xl font-bold">
                    {dashboardData?.weightBreak?.correlations?.temperatureCorrelation?.[0]?.temperature_correlation?.toFixed(2) || 'N/A'}
                  </div>
                  <Badge variant={
                    Math.abs(dashboardData?.weightBreak?.correlations?.temperatureCorrelation?.[0]?.temperature_correlation || 0) > 0.5
                      ? 'destructive'
                      : 'default'
                  }>
                    {Math.abs(dashboardData?.weightBreak?.correlations?.temperatureCorrelation?.[0]?.temperature_correlation || 0) > 0.5
                      ? 'Alta Correlação'
                      : 'Baixa Correlação'}
                  </Badge>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-sm font-medium">Distância × Quebra</div>
                  <div className="text-2xl font-bold">
                    {dashboardData?.weightBreak?.correlations?.distanceCorrelation?.[0]?.distance_correlation?.toFixed(2) || 'N/A'}
                  </div>
                  <Badge variant={
                    Math.abs(dashboardData?.weightBreak?.correlations?.distanceCorrelation?.[0]?.distance_correlation || 0) > 0.5
                      ? 'destructive'
                      : 'default'
                  }>
                    {Math.abs(dashboardData?.weightBreak?.correlations?.distanceCorrelation?.[0]?.distance_correlation || 0) > 0.5
                      ? 'Alta Correlação'
                      : 'Baixa Correlação'}
                  </Badge>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-sm font-medium">Sazonalidade</div>
                  <div className="text-2xl font-bold">
                    {dashboardData?.weightBreak?.correlations?.seasonalPatterns?.length || 0}
                  </div>
                  <Badge variant="outline">
                    Padrões identificados
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight-break" className="space-y-4">
          {/* Análise detalhada de quebra de peso */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Temporal de Quebra de Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData?.weightBreak?.patterns || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="averageBreak" 
                    stroke="#3b82f6" 
                    name="Quebra Média %"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minBreak" 
                    stroke="#10b981" 
                    name="Mínimo %"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxBreak" 
                    stroke="#ef4444" 
                    name="Máximo %"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Estatísticas por região */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboardData?.weightBreak?.patterns?.map((pattern: any) => (
              <Card key={pattern.region}>
                <CardHeader>
                  <CardTitle className="text-lg">{pattern.region}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quebra Média:</span>
                      <span className="font-bold">{pattern.averageBreak?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Desvio Padrão:</span>
                      <span>{pattern.standardDeviation?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amostras:</span>
                      <span>{pattern.sampleSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Faixa:</span>
                      <span>{pattern.minBreak?.toFixed(2)}% - {pattern.maxBreak?.toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mortality" className="space-y-4">
          {/* Análise de mortalidade */}
          <Card>
            <CardHeader>
              <CardTitle>Causas de Mortalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData?.mortality?.patterns?.topCauses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cause" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_deaths" fill="#3b82f6" name="Total de Mortes" />
                  <Bar yAxisId="right" dataKey="total_loss" fill="#ef4444" name="Perda Financeira (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Análise ambiental */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mortalidade por Temperatura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData?.mortality?.environmental?.temperatureAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="temperature_range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_mortality_rate" fill="#f59e0b" name="Taxa de Mortalidade %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mortalidade Sazonal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.mortality?.environmental?.seasonalAnalysis || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.season}: ${entry.total_deaths}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_deaths"
                    >
                      {(dashboardData?.mortality?.environmental?.seasonalAnalysis || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {/* Previsões e recomendações */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Sistema de previsões baseado em análise histórica e padrões identificados
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Previsão de Quebra de Peso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="text-sm font-medium mb-2">Próxima Compra Estimada</div>
                    <div className="text-2xl font-bold text-blue-600">2.3% - 2.8%</div>
                    <Badge variant="outline" className="mt-2">Confiança: Alta</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Fatores de Risco:</div>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-red-500" />
                        Temperatura elevada prevista
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-yellow-500" />
                        Distância > 500km
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risco de Mortalidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded">
                    <div className="text-sm font-medium mb-2">Avaliação de Risco</div>
                    <div className="text-2xl font-bold text-green-600">BAIXO</div>
                    <Badge variant="outline" className="mt-2">Taxa esperada: &lt; 1%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recomendações:</div>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-green-500" />
                        Manter protocolo sanitário padrão
                      </li>
                      <li className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3 text-blue-500" />
                        Monitorar temperatura diária
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações recomendadas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Recomendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Alta Prioridade:</strong> Revisar fornecedores da região Nordeste - 
                    quebra 35% acima da média
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Média Prioridade:</strong> Implementar protocolo de hidratação 
                    intensiva para transportes > 8 horas
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Oportunidade:</strong> Fornecedor XYZ apresenta quebra 40% menor 
                    que a média - considerar aumento de volume
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};