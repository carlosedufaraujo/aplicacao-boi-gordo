import React, { useState } from 'react';
import {
  Palette,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Wifi,
  Settings,
  Users,
  Database,
  FileUp
} from 'lucide-react';
import { useSettings } from '@/providers/SettingsProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useBackend } from '@/providers/BackendProvider';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Importar os componentes das outras páginas
import CleanUserManagement from '@/components/System/CleanUserManagement';
import CompleteRegistrations from '@/components/Registrations/CompleteRegistrations';
import DataImport from '@/pages/DataImport';

export const GeneralSettings: React.FC = () => {
  const {
    resetSettings,
    exportSettings,
    importSettings
  } = useSettings();

  const { theme, setTheme } = useTheme();
  const { user } = useBackend();
  const isAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN';
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = () => {
    resetSettings();
    setMessage({ type: 'success', text: 'Configurações resetadas para os valores padrão!' });
  };

  const handleExport = () => {
    try {
      const settings = exportSettings();
      const blob = new Blob([settings], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracoes-sistema-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Configurações exportadas com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao exportar configurações' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const settings = event.target?.result as string;
          importSettings(settings);
          setMessage({ type: 'success', text: 'Configurações importadas com sucesso!' });
          // Recarregar a página para aplicar as configurações
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          setMessage({ type: 'error', text: 'Erro ao importar configurações. Verifique o formato do arquivo.' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Configurações Gerais</h1>
        <p className="page-subtitle">
          Configure as preferências do sistema
        </p>
      </div>

      {/* Mensagens */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-5'}`}>
          <TabsTrigger value="general">Geral</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users">Usuários</TabsTrigger>
          )}
          <TabsTrigger value="registrations">Cadastros</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
              <CardDescription>
                Informações básicas sobre o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Versão do Sistema</Label>
                  <p className="text-sm text-muted-foreground">v1.0.0</p>
                </div>
                <div className="space-y-2">
                  <Label>Última Atualização</Label>
                  <p className="text-sm text-muted-foreground">14/09/2025</p>
                </div>
                <div className="space-y-2">
                  <Label>Usuário Atual</Label>
                  <p className="text-sm text-muted-foreground">{user?.name || 'Não identificado'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <p className="text-sm text-muted-foreground">{user?.role || 'Não definido'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuários - apenas para admin */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <CleanUserManagement />
          </TabsContent>
        )}

        {/* Cadastros */}
        <TabsContent value="registrations" className="space-y-4">
          <CompleteRegistrations />
        </TabsContent>

        {/* Importar Dados */}
        <TabsContent value="import" className="space-y-4">
          <DataImport />
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema e Interface
              </CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Escolha entre tema claro ou escuro para a interface
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avançado */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>
                Importar, exportar e resetar configurações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Configurações
                </Button>
                
                <Button variant="outline" asChild>
                  <label htmlFor="import-settings" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Configurações
                  </label>
                </Button>
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                
                <Button variant="destructive" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar Tudo
                </Button>
              </div>

              <Alert>
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Resetar as configurações irá restaurar todos os valores padrão.
                  Esta ação não pode ser desfeita.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default GeneralSettings;
