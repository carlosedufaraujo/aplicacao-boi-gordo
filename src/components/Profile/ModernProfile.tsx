import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Save,
  Key,
  Globe,
  Palette,
  Monitor,
  Moon,
  Sun,
  Check,
  X,
  AlertCircle,
  Lock,
  Smartphone,
  CreditCard,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit2,
  Settings,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/providers/SupabaseProvider';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  bio?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  company: {
    name: string;
    cnpj: string;
    position: string;
  };
  joinedAt: Date;
  lastLogin: Date;
}

interface NotificationSettings {
  email: {
    enabled: boolean;
    newPurchase: boolean;
    newSale: boolean;
    reports: boolean;
    alerts: boolean;
  };
  push: {
    enabled: boolean;
    newPurchase: boolean;
    newSale: boolean;
    reports: boolean;
    alerts: boolean;
  };
  sms: {
    enabled: boolean;
    criticalAlerts: boolean;
  };
}

export const ModernProfile: React.FC = () => {
  const { user } = useSupabase();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('pt-BR');
  const [theme, setTheme] = useState('green');
  
  // Estado do perfil
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: user?.email?.split('@')[0] || 'Usuário',
    email: user?.email || 'usuario@exemplo.com',
    phone: '(11) 98765-4321',
    role: 'Administrador',
    bio: 'Gestor de fazenda com mais de 10 anos de experiência em pecuária de corte.',
    address: {
      street: 'Fazenda Boi Gordo, s/n',
      city: 'Ribeirão Preto',
      state: 'SP',
      zip: '14000-000'
    },
    company: {
      name: 'Fazenda Boi Gordo',
      cnpj: '12.345.678/0001-90',
      position: 'Proprietário'
    },
    joinedAt: new Date('2023-01-15'),
    lastLogin: new Date()
  });

  // Estado das notificações
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      enabled: true,
      newPurchase: true,
      newSale: true,
      reports: false,
      alerts: true
    },
    push: {
      enabled: true,
      newPurchase: false,
      newSale: true,
      reports: false,
      alerts: true
    },
    sms: {
      enabled: false,
      criticalAlerts: true
    }
  });

  // Sessões ativas
  const activeSessions = [
    { id: '1', device: 'Chrome - Windows', location: 'São Paulo, BR', lastActive: new Date(), current: true },
    { id: '2', device: 'Safari - iPhone', location: 'Ribeirão Preto, BR', lastActive: new Date(Date.now() - 3600000) },
    { id: '3', device: 'Chrome - MacBook', location: 'São Paulo, BR', lastActive: new Date(Date.now() - 86400000) }
  ];

  // Atividades recentes
  const recentActivities = [
    { id: '1', action: 'Login realizado', timestamp: new Date(), ip: '192.168.1.1' },
    { id: '2', action: 'Senha alterada', timestamp: new Date(Date.now() - 86400000), ip: '192.168.1.1' },
    { id: '3', action: 'Perfil atualizado', timestamp: new Date(Date.now() - 172800000), ip: '192.168.1.1' },
    { id: '4', action: 'Novo dispositivo autorizado', timestamp: new Date(Date.now() - 259200000), ip: '192.168.1.2' }
  ];

  const handleSaveProfile = () => {
    // Implementar salvamento do perfil
    console.log('Salvando perfil:', profile);
  };

  const handleChangePassword = () => {
    // Implementar mudança de senha
    console.log('Alterando senha');
  };

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log('Exportando dados');
  };

  const handleDeleteAccount = () => {
    // Implementar exclusão de conta
    console.log('Excluindo conta');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
        </div>
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        {/* Tab Perfil */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Máximo 5MB.</p>
                </div>
              </div>

              <Separator />

              {/* Dados Pessoais */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Input id="role" value={profile.role} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-medium mb-4">Endereço</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Endereço</Label>
                    <Input
                      id="street"
                      value={profile.address.street}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, street: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profile.address.city}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={profile.address.state}
                      onValueChange={(value) => setProfile({
                        ...profile,
                        address: { ...profile.address, state: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">CEP</Label>
                    <Input
                      id="zip"
                      value={profile.address.zip}
                      onChange={(e) => setProfile({
                        ...profile,
                        address: { ...profile.address, zip: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações da Empresa */}
              <div>
                <h3 className="text-lg font-medium mb-4">Informações da Empresa</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nome da Empresa</Label>
                    <Input
                      id="company"
                      value={profile.company.name}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: { ...profile.company, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={profile.company.cnpj}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: { ...profile.company, cnpj: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo na Empresa</Label>
                    <Input
                      id="position"
                      value={profile.company.position}
                      onChange={(e) => setProfile({
                        ...profile,
                        company: { ...profile.company, position: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Segurança */}
        <TabsContent value="security" className="space-y-4">
          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.
                </AlertDescription>
              </Alert>
              <Button onClick={handleChangePassword}>
                <Key className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          {/* Autenticação de Dois Fatores */}
          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores</CardTitle>
              <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Autenticação via SMS</p>
                  <p className="text-sm text-muted-foreground">Receba um código por SMS ao fazer login</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Autenticação via App</p>
                  <p className="text-sm text-muted-foreground">Use um app como Google Authenticator</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Sessões Ativas */}
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>Gerencie os dispositivos conectados à sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {session.device}
                          {session.current && (
                            <Badge variant="default" className="ml-2">Sessão Atual</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {format(session.lastActive, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Encerrar Todas as Outras Sessões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Escolha como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificações por E-mail */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="font-medium">Notificações por E-mail</p>
                    <p className="text-sm text-muted-foreground">Receba atualizações no seu e-mail</p>
                  </div>
                  <Switch
                    checked={notifications.email.enabled}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, enabled: checked }
                    })}
                  />
                </div>
                {notifications.email.enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-purchase">Novas Compras</Label>
                      <Switch
                        id="email-purchase"
                        checked={notifications.email.newPurchase}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          email: { ...notifications.email, newPurchase: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-sale">Novas Vendas</Label>
                      <Switch
                        id="email-sale"
                        checked={notifications.email.newSale}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          email: { ...notifications.email, newSale: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-reports">Relatórios</Label>
                      <Switch
                        id="email-reports"
                        checked={notifications.email.reports}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          email: { ...notifications.email, reports: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-alerts">Alertas do Sistema</Label>
                      <Switch
                        id="email-alerts"
                        checked={notifications.email.alerts}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          email: { ...notifications.email, alerts: checked }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Notificações Push */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                  </div>
                  <Switch
                    checked={notifications.push.enabled}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      push: { ...notifications.push, enabled: checked }
                    })}
                  />
                </div>
                {notifications.push.enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-purchase">Novas Compras</Label>
                      <Switch
                        id="push-purchase"
                        checked={notifications.push.newPurchase}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          push: { ...notifications.push, newPurchase: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-sale">Novas Vendas</Label>
                      <Switch
                        id="push-sale"
                        checked={notifications.push.newSale}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          push: { ...notifications.push, newSale: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-alerts">Alertas do Sistema</Label>
                      <Switch
                        id="push-alerts"
                        checked={notifications.push.alerts}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          push: { ...notifications.push, alerts: checked }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Notificações por SMS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="font-medium">Notificações por SMS</p>
                    <p className="text-sm text-muted-foreground">Mensagens de texto importantes</p>
                  </div>
                  <Switch
                    checked={notifications.sms.enabled}
                    onCheckedChange={(checked) => setNotifications({
                      ...notifications,
                      sms: { ...notifications.sms, enabled: checked }
                    })}
                  />
                </div>
                {notifications.sms.enabled && (
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-critical">Alertas Críticos</Label>
                      <Switch
                        id="sms-critical"
                        checked={notifications.sms.criticalAlerts}
                        onCheckedChange={(checked) => setNotifications({
                          ...notifications,
                          sms: { ...notifications.sms, criticalAlerts: checked }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Preferências */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Alterne entre tema claro e escuro</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Cor do Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="purple">Roxo</SelectItem>
                    <SelectItem value="orange">Laranja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Idioma e Região</CardTitle>
              <CardDescription>Configure idioma e formatos regionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
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
                <Label>Formato de Data</Label>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                    <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select defaultValue="BRL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar (US$)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacidade</CardTitle>
              <CardDescription>Controle suas configurações de privacidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Perfil Público</p>
                  <p className="text-sm text-muted-foreground">Permitir que outros usuários vejam seu perfil</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Mostrar Status Online</p>
                  <p className="text-sm text-muted-foreground">Exibir quando você está online</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">Ajude-nos a melhorar com dados anônimos</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Atividade */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Histórico de ações em sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(activity.timestamp, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })} • IP: {activity.ip}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver Histórico Completo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
              <CardDescription>Informações sobre sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID da Conta</span>
                <span className="font-mono text-sm">{profile.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data de Criação</span>
                <span className="text-sm">
                  {format(profile.joinedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Último Login</span>
                <span className="text-sm">
                  {format(profile.lastLogin, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plano</span>
                <Badge>Premium</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Baixar Relatório de Dados
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};