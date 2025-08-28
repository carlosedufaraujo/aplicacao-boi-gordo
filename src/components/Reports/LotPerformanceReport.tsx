import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useToast } from '@/hooks/use-toast';

interface LotPerformance {
  id: string;
  lotNumber: string;
  entryDate: string;
  entryQuantity: number;
  entryWeight: number;
  status: string;
  current_avg_weight: number;
  total_weight_gain: number;
  daily_weight_gain: number;
  days_confined: number;
  total_costs: number;
  cost_per_head: number;
  cost_per_kg: number;
  estimated_revenue: number;
  estimated_margin: number;
  last_weighing_date: string | null;
  weighing_count: number;
  createdAt: string;
}

export const LotPerformanceReport: React.FC = () => {
  const [data, setData] = useState<LotPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: performanceData, error: queryError } = await supabase
        .from('v_lot_performance')
        .select('*')
        .order('entryDate', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setData(performanceData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGeneratePDF = async () => {
    const result = await generatePDFFromElement('lot-performance-report', {
      filename: `relatorio-performance-lotes-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'landscape',
      quality: 2
    });

    if (result.success) {
      toast({
        title: "Sucesso",
        description: result.message,
      });
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleGenerateStructuredPDF = async () => {
    const reportData = {
      title: 'Relatório de Performance dos Lotes',
      subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
      data: data.map(lot => ({
        lote: lot.lotNumber,
        entrada: new Date(lot.entryDate).toLocaleDateString('pt-BR'),
        animais: lot.entryQuantity,
        dias: Math.round(lot.days_confined),
        gmd: `${lot.daily_weight_gain.toFixed(2)} kg`,
        custo_cabeca: `R$ ${lot.cost_per_head.toFixed(2)}`,
        margem: `R$ ${lot.estimated_margin.toFixed(2)}`
      })),
      columns: [
        { key: 'lote', label: 'Lote', width: 40 },
        { key: 'entrada', label: 'Entrada', width: 30 },
        { key: 'animais', label: 'Animais', width: 25 },
        { key: 'dias', label: 'Dias', width: 25 },
        { key: 'gmd', label: 'GMD', width: 30 },
        { key: 'custo_cabeca', label: 'Custo/Cabeça', width: 35 },
        { key: 'margem', label: 'Margem Est.', width: 35 }
      ],
      summary: {
        'Total de Lotes': data.length,
        'Total de Animais': data.reduce((sum, lot) => sum + lot.entryQuantity, 0),
        'GMD Médio': `${(data.reduce((sum, lot) => sum + lot.daily_weight_gain, 0) / data.length).toFixed(2)} kg`,
        'Margem Total Estimada': `R$ ${data.reduce((sum, lot) => sum + lot.estimated_margin, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }
    };

    const result = await generateReportPDF(reportData, {
      filename: `relatorio-estruturado-lotes-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'landscape'
    });

    if (result.success) {
      toast({
        title: "Sucesso",
        description: result.message,
      });
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ACTIVE': 'default',
      'SOLD': 'secondary',
      'FINISHED': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando Relatório...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao Carregar Dados</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Performance dos Lotes</CardTitle>
              <CardDescription>
                Dados em tempo real do PostgreSQL via Views
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleGeneratePDF} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF Visual
              </Button>
              <Button onClick={handleGenerateStructuredPDF} size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF Estruturado
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo do relatório */}
      <Card id="lot-performance-report">
        <CardHeader>
          <CardTitle>Performance dos Lotes de Gado</CardTitle>
          <CardDescription>
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lote encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead className="text-right">Animais</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                  <TableHead className="text-right">Peso Atual</TableHead>
                  <TableHead className="text-right">GMD</TableHead>
                  <TableHead className="text-right">Custo/Cabeça</TableHead>
                  <TableHead className="text-right">Margem Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">
                      {lot.lotNumber}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lot.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(lot.entryDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.entryQuantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(lot.days_confined)}
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.current_avg_weight.toFixed(0)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.daily_weight_gain.toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lot.cost_per_head)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={lot.estimated_margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(lot.estimated_margin)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {data.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Lotes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {data.reduce((sum, lot) => sum + lot.entryQuantity, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Animais
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(data.reduce((sum, lot) => sum + lot.daily_weight_gain, 0) / data.length).toFixed(2)} kg
                </div>
                <div className="text-sm text-muted-foreground">
                  GMD Médio
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.reduce((sum, lot) => sum + lot.estimated_margin, 0))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Margem Total Est.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
