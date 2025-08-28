import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Clock, 
  Database, 
  Shield, 
  Bell,
  Palette,
  Save,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useSettings } from '@/providers/SettingsProvider';
import { useTheme } from '@/providers/ThemeProvider';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const GeneralSettings: React.FC = () => {
  const { 
    defaultCurrency,
    dateFormat,
    timeFormat,
    timezone,
    autoBackup,
    backupFrequency,
    backupRetention,
    sessionTimeout,
    passwordExpiry,
    twoFactorAuth,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  } = useSettings();
  
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [localSettings, setLocalSettings] = useState({
    defaultCurrency,
    dateFormat,
    timeFormat,
    timezone,
    autoBackup,
    backupFrequency,
    backupRetention,
    sessionTimeout,
    passwordExpiry,
    twoFactorAuth
  });

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      updateSettings(localSettings);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings({
      defaultCurrency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'America/Sao_Paulo',
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      sessionTimeout: 60,
      passwordExpiry: 90,
      twoFactorAuth: false
    });
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
          Configure as preferências gerais do sistema
        </p>
      </div>

      {/* Mensagens */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regionalização
              </CardTitle>
              <CardDescription>
                Configure formatos de data, hora e moeda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moeda Padrão</Label>
                  <Select
                    value={localSettings.defaultCurrency}
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, defaultCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de Data</Label>
                  <Select
                    value={localSettings.dateFormat}
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de Hora</Label>
                  <Select
                    value={localSettings.timeFormat}
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, timeFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select
                    value={localSettings.timezone}
                    onValueChange={(value) => setLocalSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  O tema "Sistema" seguirá as configurações do seu dispositivo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Automático
              </CardTitle>
              <CardDescription>
                Configure backups automáticos dos seus dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Criar backups automáticos dos dados
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoBackup}
                  onCheckedChange={(value) => setLocalSettings(prev => ({ ...prev, autoBackup: value }))}
                />
              </div>

              {localSettings.autoBackup && (
                <div className="space-y-4 ml-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={localSettings.backupFrequency}
                        onValueChange={(value: any) => setLocalSettings(prev => ({ ...prev, backupFrequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Retenção (dias)</Label>
                      <Input
                        type="number"
                        value={localSettings.backupRetention}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, backupRetention: parseInt(e.target.value) }))}
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure políticas de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeout de Sessão (minutos)</Label>
                  <Input
                    type="number"
                    value={localSettings.sessionTimeout}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    min="5"
                    max="480"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tempo limite para sessões inativas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Expiração de Senha (dias)</Label>
                  <Input
                    type="number"
                    value={localSettings.passwordExpiry}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
                    min="30"
                    max="365"
                  />
                  <p className="text-sm text-muted-foreground">
                    Forçar troca de senha após este período
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicionar camada extra de segurança (em desenvolvimento)
                  </p>
                </div>
                <Switch
                  checked={localSettings.twoFactorAuth}
                  onCheckedChange={(value) => setLocalSettings(prev => ({ ...prev, twoFactorAuth: value }))}
                  disabled
                />
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

      {/* Ações */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};
