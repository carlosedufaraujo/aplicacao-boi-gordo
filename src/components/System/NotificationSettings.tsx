import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Settings, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '@/providers/SettingsProvider';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const NotificationSettings: React.FC = () => {
  const { 
    emailNotifications, 
    pushNotifications, 
    smsNotifications,
    updateSettings 
  } = useSettings();
  
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    emailNotifications,
    pushNotifications,
    smsNotifications,
    emailFrequency: 'immediate' as 'immediate' | 'daily' | 'weekly',
    pushFrequency: 'immediate' as 'immediate' | 'daily' | 'weekly',
    notificationTypes: {
      newCattlePurchase: true,
      saleCompleted: true,
      paymentDue: true,
      lowStock: true,
      systemUpdates: false,
      marketingEmails: false
    }
  });

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleNotificationTypeChange = (type: string, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings({
      emailNotifications: localSettings.emailNotifications,
      pushNotifications: localSettings.pushNotifications,
      smsNotifications: localSettings.smsNotifications
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings({
      emailNotifications,
      pushNotifications,
      smsNotifications,
      emailFrequency: 'immediate',
      pushFrequency: 'immediate',
      notificationTypes: {
        newCattlePurchase: true,
        saleCompleted: true,
        paymentDue: true,
        lowStock: true,
        systemUpdates: false,
        marketingEmails: false
      }
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Configurações de Notificação</h1>
        <p className="page-subtitle">
          Configure como e quando você deseja receber notificações do sistema
        </p>
      </div>

      {/* Alertas de Mudanças */}
      {hasChanges && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar Configurações" para aplicá-las.
          </AlertDescription>
        </Alert>
      )}

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canais de Notificação
          </CardTitle>
          <CardDescription>
            Ative ou desative os diferentes canais de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Notificações por Email</Label>
                <Badge variant="secondary">Recomendado</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Receba notificações importantes por email
              </p>
            </div>
            <Switch
              checked={localSettings.emailNotifications}
              onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
            />
          </div>

          {localSettings.emailNotifications && (
            <div className="ml-6 space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm">Frequência:</Label>
                <Select
                  value={localSettings.emailFrequency}
                  onValueChange={(value) => handleSettingChange('emailFrequency', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediato</SelectItem>
                    <SelectItem value="daily">Resumo Diário</SelectItem>
                    <SelectItem value="weekly">Resumo Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Separator />

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Notificações Push</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receba notificações instantâneas no navegador
              </p>
            </div>
            <Switch
              checked={localSettings.pushNotifications}
              onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
            />
          </div>

          {localSettings.pushNotifications && (
            <div className="ml-6 space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm">Frequência:</Label>
                <Select
                  value={localSettings.pushFrequency}
                  onValueChange={(value) => handleSettingChange('pushFrequency', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediato</SelectItem>
                    <SelectItem value="daily">Resumo Diário</SelectItem>
                    <SelectItem value="weekly">Resumo Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Separator />

          {/* SMS */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Notificações por SMS</Label>
                <Badge variant="outline">Em breve</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Receba notificações críticas por SMS (funcionalidade em desenvolvimento)
              </p>
            </div>
            <Switch
              checked={localSettings.smsNotifications}
              onCheckedChange={(value) => handleSettingChange('smsNotifications', value)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais eventos devem gerar notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Operacionais */}
          <div>
            <h4 className="font-medium mb-3">Operacionais</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Nova Ordem de Compra</Label>
                  <p className="text-xs text-muted-foreground">Quando uma nova ordem de compra é criada</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.newCattlePurchase}
                  onCheckedChange={(value) => handleNotificationTypeChange('newCattlePurchase', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Venda Concluída</Label>
                  <p className="text-xs text-muted-foreground">Quando uma venda é finalizada</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.saleCompleted}
                  onCheckedChange={(value) => handleNotificationTypeChange('saleCompleted', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Estoque Baixo</Label>
                  <p className="text-xs text-muted-foreground">Quando o estoque de ração está baixo</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.lowStock}
                  onCheckedChange={(value) => handleNotificationTypeChange('lowStock', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Financeiras */}
          <div>
            <h4 className="font-medium mb-3">Financeiras</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Pagamento Vencendo</Label>
                  <p className="text-xs text-muted-foreground">Quando um pagamento está próximo do vencimento</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.paymentDue}
                  onCheckedChange={(value) => handleNotificationTypeChange('paymentDue', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sistema */}
          <div>
            <h4 className="font-medium mb-3">Sistema</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Atualizações do Sistema</Label>
                  <p className="text-xs text-muted-foreground">Quando há novas atualizações disponíveis</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.systemUpdates}
                  onCheckedChange={(value) => handleNotificationTypeChange('systemUpdates', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Emails de Marketing</Label>
                  <p className="text-xs text-muted-foreground">Novidades e dicas sobre o sistema</p>
                </div>
                <Switch
                  checked={localSettings.notificationTypes.marketingEmails}
                  onCheckedChange={(value) => handleNotificationTypeChange('marketingEmails', value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={!hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
        
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
