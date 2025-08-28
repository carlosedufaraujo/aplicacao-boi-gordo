import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import type { SettingsData } from '@/hooks/useSettings';
import {
  Settings,
  Globe,
  Clock,
  DollarSign,
  FileText,
  Database,
  Shield,
  Save,
  Bell,
  User,
  Building2,
  Palette,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Key,
  Lock,
  Mail,
  Volume2,
  Wifi,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  FileDown,
  FileUp
} from 'lucide-react';

export const ModernSettings: React.FC = () => {
  const {
    settings: savedSettings,
    loading: settingsLoading,
    saving,
    backupInfo,
    saveSettings,
    performBackup,
    exportSettings,
    importSettings,
    reloadSettings
  } = useSettings();

  const [settings, setSettings] = useState<SettingsData>({
    // Regional
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    
    // Business
    weightUnit: 'kg',
    priceUnit: 'arroba',
    taxRate: 15,
    defaultPaymentTerm: 30,
    
    // System
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 90,
    sessionTimeout: 30,
    theme: 'light',
    
    // Security
    twoFactorAuth: false,
    passwordExpiration: 90,
    minPasswordLength: 8,
    requireStrongPassword: true,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationSound: true,
    newOrderAlert: true,
    paymentReminder: true,
    systemUpdates: true,
    marketingEmails: false,
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
      setHasChanges(false);
    }
  }, [savedSettings]);

  // Check if settings have changed
  useEffect(() => {
    if (savedSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(savedSettings);
      setHasChanges(changed);
    }
  }, [settings, savedSettings]);

  const handleSettingChange = (setting: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleSave = async () => {
    await saveSettings(settings);
    setHasChanges(false);
  };

  const handleBackupNow = async () => {
    const success = await performBackup();
    if (success) {
      await reloadSettings();
    }
  };

  const handleExport = () => {
    const jsonData = exportSettings();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bovicontrol-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas com sucesso!');
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Selecione um arquivo para importar');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const success = await importSettings(content);
      if (success) {
        setImportFile(null);
        await reloadSettings();
      }
    };
    reader.readAsText(importFile);
  };

  const getSecurityLevel = (): { level: string; color: string } => {
    let score = 0;
    if (settings.twoFactorAuth) score += 3;
    if (settings.requireStrongPassword) score += 2;
    if (settings.minPasswordLength >= 12) score += 2;
    if (settings.passwordExpiration <= 60) score += 1;

    if (score >= 7) return { level: 'Alto', color: 'text-green-500' };
    if (score >= 4) return { level: 'Médio', color: 'text-yellow-500' };
    return { level: 'Baixo', color: 'text-red-500' };
  };

  if (settingsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="page-title">Configurações Gerais</h1>
          <p className="page-subtitle">Carregando configurações...</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Configurações Gerais</h1>
          <p className="page-subtitle">
            Configure as preferências gerais do sistema BoviControl
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600">
              Alterações não salvas
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="regional" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="business">Negócio</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        {/* Tab Regional */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="card-title flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Configurações Regionais
              </CardTitle>
              <CardDescription className="card-subtitle">
                Ajuste idioma, fuso horário e formatos de exibição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language" className="form-label">Idioma</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="form-label">Fuso Horário</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                      <SelectItem value="America/Cuiaba">Cuiabá (UTC-4)</SelectItem>
                      <SelectItem value="America/Fortaleza">Fortaleza (UTC-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat" className="form-label">Formato de Data</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger id="dateFormat">
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
                  <Label htmlFor="currency" className="form-label">Moeda</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar (US$)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Business */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="card-title flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Configurações de Negócio
              </CardTitle>
              <CardDescription className="card-subtitle">
                Configure unidades padrão e parâmetros comerciais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weightUnit" className="form-label">Unidade de Peso</Label>
                  <Select value={settings.weightUnit} onValueChange={(value) => handleSettingChange('weightUnit', value)}>
                    <SelectTrigger id="weightUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                      <SelectItem value="arroba">Arrobas (@)</SelectItem>
                      <SelectItem value="ton">Toneladas (t)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceUnit" className="form-label">Unidade de Preço</Label>
                  <Select value={settings.priceUnit} onValueChange={(value) => handleSettingChange('priceUnit', value)}>
                    <SelectTrigger id="priceUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arroba">Por Arroba</SelectItem>
                      <SelectItem value="kg">Por Quilograma</SelectItem>
                      <SelectItem value="head">Por Cabeça</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="form-label">Taxa de Impostos (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="50"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerm" className="form-label">Prazo de Pagamento (dias)</Label>
                  <Input
                    id="paymentTerm"
                    type="number"
                    min="0"
                    value={settings.defaultPaymentTerm}
                    onChange={(e) => handleSettingChange('defaultPaymentTerm', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab System */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="card-title flex items-center gap-2">
                <Database className="h-4 w-4" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription className="card-subtitle">
                Gerencie backup, retenção de dados e tema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* Backup Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Backup de Dados</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoBackup" className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Backup Automático
                    </Label>
                    <Switch
                      id="autoBackup"
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                    />
                  </div>

                  {settings.autoBackup && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency" className="form-label">Frequência</Label>
                        <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                          <SelectTrigger id="backupFrequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">A cada hora</SelectItem>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataRetention" className="form-label">Retenção (dias)</Label>
                        <Input
                          id="dataRetention"
                          type="number"
                          min="7"
                          max="365"
                          value={settings.dataRetention}
                          onChange={(e) => handleSettingChange('dataRetention', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Último Backup</p>
                      <p className="text-xs text-muted-foreground">
                        {backupInfo.lastBackup 
                          ? new Date(backupInfo.lastBackup).toLocaleString('pt-BR')
                          : 'Nenhum backup realizado'}
                      </p>
                      {backupInfo.nextBackup && (
                        <p className="text-xs text-muted-foreground">
                          Próximo: {new Date(backupInfo.nextBackup).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleBackupNow}
                      variant="outline"
                      size="sm"
                      disabled={saving}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Backup Agora
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Session Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Sessão</h3>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout" className="form-label">Timeout da Sessão (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="120"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      O sistema desconectará automaticamente após {settings.sessionTimeout} minutos de inatividade
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Theme Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Aparência</h3>
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="form-label">Tema</Label>
                    <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <span className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Claro
                          </span>
                        </SelectItem>
                        <SelectItem value="dark">
                          <span className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Escuro
                          </span>
                        </SelectItem>
                        <SelectItem value="system">
                          <span className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Sistema
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Import/Export */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Importar/Exportar Configurações</h3>
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleExport}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Exportar
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="max-w-xs"
                      />
                      <Button 
                        onClick={handleImport}
                        variant="outline"
                        disabled={!importFile}
                        className="flex items-center gap-2"
                      >
                        <FileUp className="h-4 w-4" />
                        Importar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="card-title flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription className="card-subtitle">
                Configure autenticação e políticas de senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nível de segurança atual: 
                  <span className={`ml-2 font-semibold ${getSecurityLevel().color}`}>
                    {getSecurityLevel().level}
                  </span>
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactor" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Autenticação de Dois Fatores
                  </Label>
                  <Switch
                    id="twoFactor"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Política de Senhas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiration" className="form-label">
                        Expiração de Senha (dias)
                      </Label>
                      <Input
                        id="passwordExpiration"
                        type="number"
                        min="30"
                        max="365"
                        value={settings.passwordExpiration}
                        onChange={(e) => handleSettingChange('passwordExpiration', Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minPasswordLength" className="form-label">
                        Comprimento Mínimo
                      </Label>
                      <Input
                        id="minPasswordLength"
                        type="number"
                        min="6"
                        max="32"
                        value={settings.minPasswordLength}
                        onChange={(e) => handleSettingChange('minPasswordLength', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="strongPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Exigir Senha Forte
                    </Label>
                    <Switch
                      id="strongPassword"
                      checked={settings.requireStrongPassword}
                      onCheckedChange={(checked) => handleSettingChange('requireStrongPassword', checked)}
                    />
                  </div>

                  {settings.requireStrongPassword && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Senhas fortes devem conter: letras maiúsculas e minúsculas, números e caracteres especiais
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="card-title flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription className="card-subtitle">
                Gerencie como você recebe notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Canais de Notificação</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotif" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Notificações por E-mail
                      </Label>
                      <Switch
                        id="emailNotif"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsNotif" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Notificações por SMS
                      </Label>
                      <Switch
                        id="smsNotif"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotif" className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Notificações Push
                      </Label>
                      <Switch
                        id="pushNotif"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="soundNotif" className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Som de Notificação
                      </Label>
                      <Switch
                        id="soundNotif"
                        checked={settings.notificationSound}
                        onCheckedChange={(checked) => handleSettingChange('notificationSound', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Tipos de Notificação</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Novos Pedidos</Label>
                        <p className="text-xs text-muted-foreground">
                          Receber alertas sobre novos pedidos de compra
                        </p>
                      </div>
                      <Switch
                        checked={settings.newOrderAlert}
                        onCheckedChange={(checked) => handleSettingChange('newOrderAlert', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Lembretes de Pagamento</Label>
                        <p className="text-xs text-muted-foreground">
                          Avisos sobre pagamentos próximos do vencimento
                        </p>
                      </div>
                      <Switch
                        checked={settings.paymentReminder}
                        onCheckedChange={(checked) => handleSettingChange('paymentReminder', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Atualizações do Sistema</Label>
                        <p className="text-xs text-muted-foreground">
                          Informações sobre novas funcionalidades e melhorias
                        </p>
                      </div>
                      <Switch
                        checked={settings.systemUpdates}
                        onCheckedChange={(checked) => handleSettingChange('systemUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">E-mails de Marketing</Label>
                        <p className="text-xs text-muted-foreground">
                          Promoções e ofertas especiais
                        </p>
                      </div>
                      <Switch
                        checked={settings.marketingEmails}
                        onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};