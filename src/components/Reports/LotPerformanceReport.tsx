import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, RefreshCw } from 'lucide-react';
import { reportApi, LotPerformanceReport as LotPerfReport } from '@/services/api/reportApi';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useToast } from '@/hooks/use-toast';

export const LotPerformanceReport: React.FC = () => {
  const [report, setReport] = useState<LotPerfReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportApi.getLotPerformance();
      setReport(data);
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
    if (!report) return;
    
    const reportData = {
      title: 'Relatório de Performance dos Lotes',
      subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
      data: report.lots.map(lot => ({
        lote: lot.lot.code,
        entrada: new Date(lot.timeline.entryDate).toLocaleDateString('pt-BR'),
        animais: lot.quantity.current,
        dias: Math.round(lot.timeline.daysInConfinement),
        gmd: `${lot.weight.avgDailyGain.toFixed(2)} kg`,
        custo_cabeca: `R$ ${lot.financials.costPerHead.toFixed(2)}`,
        margem: `R$ ${lot.financials.profit.toFixed(2)}`
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
        'Total de Lotes': report.summary.totalLots,
        'Total de Animais': report.lots.reduce((sum, lot) => sum + lot.quantity.current, 0),
        'GMD Médio': `${report.summary.averages?.daysInConfinement || 0} dias`,
        'Margem Total Estimada': `R$ ${report.lots.reduce((sum, lot) => sum + lot.financials.profit, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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
      'FINISHED': 'outline',
      'IN_FORMATION': 'outline'
    } as const;

    const labels = {
      'ACTIVE': 'Ativo',
      'SOLD': 'Vendido',
      'FINISHED': 'Finalizado',
      'IN_FORMATION': 'Em Formação'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
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
          {!report || report.lots.length === 0 ? (
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
                  <TableHead className="text-right">Peso Médio</TableHead>
                  <TableHead className="text-right">GMD</TableHead>
                  <TableHead className="text-right">Custo/Cabeça</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.lots.map((lot) => (
                  <TableRow key={lot.lot.id}>
                    <TableCell className="font-medium">
                      {lot.lot.code}
                      {lot.ranking && (
                        <Badge variant="outline" className="ml-2">
                          #{lot.ranking.position}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lot.lot.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(lot.timeline.entryDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.quantity.current.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(lot.timeline.daysInConfinement)}
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.weight.avgCurrent.toFixed(0)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {lot.weight.avgDailyGain.toFixed(2)} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lot.financials.costPerHead)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={lot.financials.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(lot.financials.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={lot.financials.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {lot.financials.roi.toFixed(1)}%
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
      {report && report.lots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {report.summary.totalLots}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Lotes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {report.lots.reduce((sum, lot) => sum + lot.quantity.current, 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Animais
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {report.summary.averages?.margin.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Margem Média
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {report.summary.averages?.roi.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  ROI Médio
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.lots.reduce((sum, lot) => sum + lot.financials.profit, 0))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Lucro Total
                </div>
              </div>
            </div>
            
            {/* Top Performers */}
            {report.summary.bestPerformers.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Melhores Desempenhos</h4>
                <div className="space-y-1">
                  {report.summary.bestPerformers.slice(0, 3).map((lot) => (
                    <div key={lot.lot.id} className="flex justify-between text-sm">
                      <span>{lot.lot.code}</span>
                      <span className="text-green-600">ROI: {lot.financials.roi.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
