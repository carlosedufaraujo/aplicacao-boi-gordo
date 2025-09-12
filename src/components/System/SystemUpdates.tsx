import React, { useState, useEffect } from 'react';
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Package,
  Zap,
  Bug,
  Shield,
  Sparkles
} from 'lucide-react';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemUpdate {
  id: string;
  version: string;
  type: 'major' | 'minor' | 'patch' | 'security';
  title: string;
  description: string;
  releaseDate: Date;
  size: string;
  status: 'available' | 'downloading' | 'installing' | 'installed' | 'failed';
  progress?: number;
  changelog: string[];
  critical: boolean;
}

// Dados mockados para demonstração
const mockUpdates: SystemUpdate[] = [
  {
    id: '1',
    version: '2.1.0',
    type: 'minor',
    title: 'Nova Interface e Melhorias de Performance',
    description: 'Atualização com nova interface shadcn/ui, melhorias de performance e correções de bugs.',
    releaseDate: new Date('2025-01-27'),
    size: '45.2 MB',
    status: 'available',
    changelog: [
      'Nova interface moderna com shadcn/ui',
      'Melhorias significativas de performance',
      'Sistema híbrido de migração gradativa',
      'Novos componentes de formulários',
      'Correções de bugs críticos'
    ],
    critical: false
  },
  {
    id: '2',
    version: '2.0.3',
    type: 'security',
    title: 'Correção de Segurança Crítica',
    description: 'Atualização de segurança que corrige vulnerabilidades importantes.',
    releaseDate: new Date('2025-01-25'),
    size: '12.8 MB',
    status: 'installed',
    changelog: [
      'Correção de vulnerabilidade de autenticação',
      'Melhorias na validação de dados',
      'Atualização de dependências de segurança'
    ],
    critical: true
  },
  {
    id: '3',
    version: '2.0.2',
    type: 'patch',
    title: 'Correções de Bugs',
    description: 'Correções menores e melhorias de estabilidade.',
    releaseDate: new Date('2025-01-20'),
    size: '8.5 MB',
    status: 'installed',
    changelog: [
      'Correção no cálculo de DRE',
      'Melhoria na sincronização de dados',
      'Correção de erros de validação'
    ],
    critical: false
  }
];

export const SystemUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>(mockUpdates);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkForUpdates = async () => {
    setIsChecking(true);
    
    // Simula verificação de atualizações
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLastCheck(new Date());
    setIsChecking(false);
  };

  const installUpdate = async (updateId: string) => {
    setUpdates(prev => prev.map(update => 
      update.id === updateId 
        ? { ...update, status: 'downloading', progress: 0 }
        : update
    ));

    // Simula download
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUpdates(prev => prev.map(update => 
        update.id === updateId 
          ? { ...update, progress: i }
          : update
      ));
    }

    // Simula instalação
    setUpdates(prev => prev.map(update => 
      update.id === updateId 
        ? { ...update, status: 'installing', progress: undefined }
        : update
    ));

    await new Promise(resolve => setTimeout(resolve, 3000));

    setUpdates(prev => prev.map(update => 
      update.id === updateId 
        ? { ...update, status: 'installed' }
        : update
    ));
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Sparkles className="h-4 w-4" />;
      case 'minor':
        return <Package className="h-4 w-4" />;
      case 'patch':
        return <Bug className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getUpdateBadge = (type: string, critical: boolean) => {
    if (critical) {
      return <Badge variant="destructive">Crítica</Badge>;
    }
    
    switch (type) {
      case 'major':
        return <Badge className="bg-purple-500">Major</Badge>;
      case 'minor':
        return <Badge className="bg-blue-500">Minor</Badge>;
      case 'patch':
        return <Badge variant="secondary">Patch</Badge>;
      case 'security':
        return <Badge className="bg-orange-500">Segurança</Badge>;
      default:
        return <Badge variant="outline">Atualização</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Download className="h-4 w-4 text-blue-600" />;
      case 'downloading':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'installing':
        return <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />;
      case 'installed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'downloading':
        return 'Baixando...';
      case 'installing':
        return 'Instalando...';
      case 'installed':
        return 'Instalado';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const availableUpdates = updates.filter(u => u.status === 'available');
  const criticalUpdates = availableUpdates.filter(u => u.critical);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Atualizações do Sistema</h1>
          <p className="page-subtitle">
            Mantenha seu sistema atualizado com as últimas melhorias e correções
          </p>
        </div>
        
        <Button onClick={checkForUpdates} disabled={isChecking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Atualizações'}
        </Button>
      </div>

      {/* Alertas Críticos */}
      {criticalUpdates.length > 0 && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Há {criticalUpdates.length} atualização(ões) crítica(s) de segurança disponível(is).
            Recomendamos instalar imediatamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Versão Atual</p>
                <p className="text-2xl font-bold">2.0.3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{availableUpdates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Críticas</p>
                <p className="text-2xl font-bold text-red-600">{criticalUpdates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Verificação</p>
                <p className="text-sm font-bold">
                  {lastCheck.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Atualizações */}
      <Card>
        <CardHeader>
          <CardTitle>Atualizações Disponíveis</CardTitle>
          <CardDescription>
            {availableUpdates.length > 0 
              ? `${availableUpdates.length} atualização(ões) disponível(is)`
              : 'Seu sistema está atualizado'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 mt-1">
                      {getUpdateIcon(update.type)}
                      {getStatusIcon(update.status)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{update.title}</h4>
                        <Badge variant="outline">v{update.version}</Badge>
                        {getUpdateBadge(update.type, update.critical)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {update.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Tamanho: {update.size}</span>
                        <span>•</span>
                        <span>
                          Lançado em: {update.releaseDate.toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span>Status: {getStatusText(update.status)}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      {update.status === 'downloading' && update.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Baixando...</span>
                            <span>{update.progress}%</span>
                          </div>
                          <Progress value={update.progress} className="h-2" />
                        </div>
                      )}
                      
                      {update.status === 'installing' && (
                        <div className="space-y-1">
                          <div className="text-xs text-orange-600">Instalando...</div>
                          <Progress value={undefined} className="h-2" />
                        </div>
                      )}
                      
                      {/* Changelog */}
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">Novidades:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {update.changelog.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-xs mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {update.status === 'available' && (
                        <Button 
                          size="sm"
                          onClick={() => installUpdate(update.id)}
                          variant={update.critical ? 'destructive' : 'default'}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Instalar
                        </Button>
                      )}
                      
                      {update.status === 'installed' && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Instalado
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {index < updates.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Configurações de Atualização */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Atualização</CardTitle>
          <CardDescription>
            Configure como as atualizações são gerenciadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Atualizações Automáticas:</strong> Atualmente desabilitadas.
                As atualizações devem ser instaladas manualmente para maior controle.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Nota:</strong> Recomendamos sempre fazer backup dos dados antes de instalar 
                atualizações importantes. Atualizações de segurança críticas devem ser instaladas 
                imediatamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};export default SystemUpdates;
