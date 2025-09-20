import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  FileText, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface IntegrationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details: string[];
  module: string;
}

export const LotIntegrationDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const integrationSteps: IntegrationStep[] = [
    {
      id: 'create-lot',
      title: 'Criar Ordem de Compra',
      description: 'Ordem de compra criada no sistema',
      icon: Receipt,
      status: 'completed',
      details: [
        'Ordem #2025-001 criada',
        '150 cabeças de gado',
        'Valor total: R$ 450.000,00',
        'Fornecedor: Fazenda Modelo Ltda'
      ],
      module: 'Pipeline de Compras'
    },
    {
      id: 'lots-integration',
      title: 'Integração com Lotes',
      description: 'Criação automática do lote na página de Lotes',
      icon: Package,
      status: currentStep >= 1 ? 'completed' : 'pending',
      details: [
        'Lote de gado criado automaticamente',
        'Dados de peso e quantidade sincronizados',
        'Status definido como ATIVO',
        'Vinculação com ordem de compra estabelecida'
      ],
      module: 'Lotes'
    },
    {
      id: 'financial-integration',
      title: 'Integração Financeira',
      description: 'Criação automática de despesas no Centro Financeiro',
      icon: DollarSign,
      status: currentStep >= 2 ? 'completed' : 'pending',
      details: [
        'Despesa: Compra de Gado - R$ 450.000,00',
        'Despesa: Comissão Corretor - R$ 9.000,00',
        'Despesa: Frete - R$ 3.500,00',
        'Vencimentos definidos automaticamente'
      ],
      module: 'Centro Financeiro'
    },
    {
      id: 'calendar-integration',
      title: 'Integração com Calendário',
      description: 'Criação de eventos importantes do lote',
      icon: Calendar,
      status: currentStep >= 3 ? 'completed' : 'pending',
      details: [
        'Evento: Chegada do Gado - Hoje',
        'Evento: Pagamento - 30 dias',
        'Evento: Primeira Pesagem - 7 dias',
        'Evento: Vacinação - 15 dias'
      ],
      module: 'Calendário'
    },
    {
      id: 'dre-integration',
      title: 'Integração com DRE',
      description: 'Dados automaticamente disponíveis no DRE',
      icon: TrendingUp,
      status: currentStep >= 4 ? 'completed' : 'pending',
      details: [
        'Custos de aquisição registrados',
        'Impacto no resultado do período',
        'Métricas de custo por cabeça atualizadas',
        'Comparativos históricos disponíveis'
      ],
      module: 'DRE'
    },
    {
      id: 'reconciliation-integration',
      title: 'Integração com Conciliação',
      description: 'Transações esperadas para conciliação bancária',
      icon: CreditCard,
      status: currentStep >= 5 ? 'completed' : 'pending',
      details: [
        'Transação esperada: Pagamento fornecedor',
        'Valor: R$ 450.000,00',
        'Data esperada: 30 dias',
        'Categoria: Compra de animais'
      ],
      module: 'Conciliação'
    }
  ];

  const runDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    for (let i = 1; i <= integrationSteps.length - 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(i);
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: IntegrationStep['status']) => {
    switch (status) {
      case 'completed':
      {
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
      {
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      case 'error':
      {
        return <AlertCircle className="h-4 w-4 text-error" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: IntegrationStep['status']) => {
    switch (status) {
      case 'completed':
      {
        return 'status-active';
      case 'processing':
      {
        return 'bg-warning text-warning-foreground';
      case 'error':
      {
        return 'status-error';
      default:
        return 'status-inactive';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demonstração das Integrações de Lote
          </CardTitle>
          <CardDescription>
            Veja como um novo lote se integra automaticamente com todos os módulos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Quando você cria uma nova ordem de compra, o sistema automaticamente:
              </p>
            </div>
            <Button 
              onClick={runDemo} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Executar Demo
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {integrationSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index && isRunning;
              
              return (
                <div key={step.id} className="relative">
                  <Card className={`transition-all duration-300 ${
                    isActive ? 'ring-2 ring-primary shadow-lg' : ''
                  } ${step.status === 'completed' ? 'bg-success/5 border-success/20' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          step.status === 'completed' ? 'bg-success/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            step.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                          }`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{step.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {step.module}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(isActive ? 'processing' : step.status)}
                              <Badge className={getStatusColor(isActive ? 'processing' : step.status)}>
                                {isActive ? 'Processando' : 
                                 step.status === 'completed' ? 'Concluído' :
                                 step.status === 'error' ? 'Erro' : 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            {step.details.map((detail, detailIndex) => (
                              <div key={detailIndex} className="flex items-center gap-2 text-xs">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  step.status === 'completed' ? 'bg-success' : 'bg-muted-foreground'
                                }`} />
                                <span className={
                                  step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                                }>
                                  {detail}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {index < integrationSteps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className={`h-4 w-4 ${
                        currentStep > index ? 'text-success' : 'text-muted-foreground'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Separator className="my-6" />
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Benefícios das Integrações Automáticas
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Redução de erros:</strong> Dados inseridos uma única vez</li>
              <li>• <strong>Economia de tempo:</strong> Sem necessidade de lançamentos manuais</li>
              <li>• <strong>Visão integrada:</strong> Todos os módulos sincronizados</li>
              <li>• <strong>Controle automático:</strong> Vencimentos e eventos programados</li>
              <li>• <strong>Relatórios precisos:</strong> DRE e análises sempre atualizados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
