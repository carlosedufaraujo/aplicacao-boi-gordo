import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  Package,
  Play,
  BarChart3,
  Clock
} from 'lucide-react';
import { RetroactiveIntegrationService } from '../../services/retroactiveIntegrationService';

interface IntegrationReport {
  totalOrders: number;
  integratedOrders: number;
  partiallyIntegratedOrders: number;
  nonIntegratedOrders: number;
  details: Array<{
    lotCode: string;
    orderId: string;
    totalValue: number;
    status: string;
    integrationStatus: 'complete' | 'partial' | 'none';
    hasLot: boolean;
    hasExpenses: boolean;
    createdAt: string;
  }>;
}

export const RetroactiveIntegrationTool: React.FC = () => {
  const [report, setReport] = useState<IntegrationReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationProgress, setIntegrationProgress] = useState(0);
  const [integrationResults, setIntegrationResults] = useState<any>(null);

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const reportData = await RetroactiveIntegrationService.generateIntegrationReport();
      setReport(reportData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const executeIntegration = async () => {
    setIsIntegrating(true);
    setIntegrationProgress(0);
    
    try {
      // Simular progresso (em produção, seria baseado no progresso real)
      const progressInterval = setInterval(() => {
        setIntegrationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      await RetroactiveIntegrationService.integrateExistingOrders();
      
      clearInterval(progressInterval);
      setIntegrationProgress(100);
      
      // Regenerar relatório após integração
      await generateReport();
      
      setIntegrationResults({
        success: true,
        message: 'Integração retroativa concluída com sucesso!'
      });
    } catch (error) {
      console.error('Erro na integração:', error);
      setIntegrationResults({
        success: false,
        message: 'Erro durante a integração retroativa'
      });
    } finally {
      setIsIntegrating(false);
    }
  };

  const getStatusColor = (status: 'complete' | 'partial' | 'none') => {
    switch (status) {
      case 'complete':
        return 'status-active';
      case 'partial':
        return 'bg-warning text-warning-foreground';
      case 'none':
        return 'status-error';
      default:
        return 'status-inactive';
    }
  };

  const getStatusIcon = (status: 'complete' | 'partial' | 'none') => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4" />;
      case 'none':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: 'complete' | 'partial' | 'none') => {
    switch (status) {
      case 'complete':
        return 'Integrado';
      case 'partial':
        return 'Parcial';
      case 'none':
        return 'Não Integrado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Ferramenta de Integração Retroativa
          </CardTitle>
          <CardDescription>
            Integre ordens de compra existentes com todo o sistema (Lotes, Centro Financeiro, DRE, Calendário)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={generateReport} 
              disabled={isGeneratingReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              {isGeneratingReport ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            
            {report && report.nonIntegratedOrders > 0 && (
              <Button 
                onClick={executeIntegration} 
                disabled={isIntegrating}
                className="flex items-center gap-2"
              >
                {isIntegrating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isIntegrating ? 'Integrando...' : 'Executar Integração'}
              </Button>
            )}
          </div>

          {isIntegrating && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Integração</span>
                <span className="text-sm text-muted-foreground">{integrationProgress}%</span>
              </div>
              <Progress value={integrationProgress} className="w-full" />
            </div>
          )}

          {integrationResults && (
            <Alert className={`mb-6 ${integrationResults.success ? 'border-success' : 'border-error'}`}>
              <div className="flex items-center gap-2">
                {integrationResults.success ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-error" />
                )}
                <AlertTitle>
                  {integrationResults.success ? 'Sucesso!' : 'Erro!'}
                </AlertTitle>
              </div>
              <AlertDescription>
                {integrationResults.message}
              </AlertDescription>
            </Alert>
          )}

          {report && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{report.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">Total de Ordens</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-2xl font-bold text-success">{report.integratedOrders}</p>
                        <p className="text-xs text-muted-foreground">Integradas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <div>
                        <p className="text-2xl font-bold text-warning">{report.partiallyIntegratedOrders}</p>
                        <p className="text-xs text-muted-foreground">Parciais</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-error" />
                      <div>
                        <p className="text-2xl font-bold text-error">{report.nonIntegratedOrders}</p>
                        <p className="text-xs text-muted-foreground">Não Integradas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Detalhes das Ordens */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalhes das Ordens</h3>
                <div className="space-y-3">
                  {report.details.map((order) => (
                    <Card key={order.orderId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold">{order.lotCode}</p>
                            <p className="text-sm text-muted-foreground">
                              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {order.status}
                            </Badge>
                            <Badge className={getStatusColor(order.integrationStatus)}>
                              {getStatusIcon(order.integrationStatus)}
                              <span className="ml-1">{getStatusText(order.integrationStatus)}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Package className={`h-4 w-4 ${order.hasLot ? 'text-success' : 'text-muted-foreground'}`} />
                            <span className={order.hasLot ? 'text-success' : 'text-muted-foreground'}>
                              Lote
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className={`h-4 w-4 ${order.hasExpenses ? 'text-success' : 'text-muted-foreground'}`} />
                            <span className={order.hasExpenses ? 'text-success' : 'text-muted-foreground'}>
                              Despesas
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!report && !isGeneratingReport && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Clique em "Gerar Relatório" para analisar as integrações
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vamos verificar quais ordens precisam ser integradas com o sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
