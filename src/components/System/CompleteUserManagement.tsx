import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Activity,
  Settings,
  Key,
  Eye,
  EyeOff,
  Send,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  MapPin,
  Smartphone
} from 'lucide-react';
import { useBackend } from '@/providers/BackendProvider';
import { usersService } from '@/services/api/users';
import { useToast } from '@/hooks/use-toast';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Hooks e utilitários
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: 'MASTER' | 'ADMIN' | 'USER';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  avatar?: string;
  phone?: string;
  department?: string;
  permissions: UserPermission[];
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lastActivity?: Date;
  invitedBy?: string;
  notes?: string;
}

interface UserPermission {
  module: string;
  actions: string[];
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const roleLabels = {
  MASTER: 'Master',
  ADMIN: 'Administrador',
  USER: 'Usuário'
};

const roleColors = {
  MASTER: 'status-error',
  ADMIN: 'status-warning',
  USER: 'status-info'
};

const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  suspended: 'Suspenso'
};

const statusColors = {
  active: 'status-active',
  inactive: 'status-inactive',
  pending: 'status-warning',
  suspended: 'status-error'
};

const modules = [
  { id: 'dashboard', name: 'Dashboard', actions: ['view'] },
  { id: 'lots', name: 'Lotes', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'pipeline', name: 'Pipeline de Compras', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'sales', name: 'Vendas', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'financial', name: 'Centro Financeiro', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'dre', name: 'DRE', actions: ['view', 'generate', 'export'] },
  { id: 'calendar', name: 'Calendário', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'reconciliation', name: 'Conciliação', actions: ['view', 'execute', 'approve'] },
  { id: 'registrations', name: 'Cadastros', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'users', name: 'Usuários', actions: ['view', 'create', 'edit', 'delete', 'manage_permissions'] },
  { id: 'settings', name: 'Configurações', actions: ['view', 'edit', 'system_config'] }
];

export const CompleteUserManagement: React.FC = () => {
  const { user: currentUser } = useBackend();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para armazenar os usuários da API
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Função para carregar usuários da API
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersService.getAll();
      // Converter dados da API para o formato do componente
      const mappedUsers = response.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
        createdAt: new Date(user.createdAt),
        avatar: null,
        phone: user.phone || '',
        department: '',
        permissions: [],
        twoFactorEnabled: false,
        loginAttempts: 0,
        lastActivity: user.updatedAt ? new Date(user.updatedAt) : undefined,
        notes: ''
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    loadUsers();
  }, []);

  const [userActivities] = useState<UserActivity[]>([
    {
      id: '1',
      userId: '1',
      action: 'login',
      module: 'auth',
      details: 'Login realizado com sucesso',
      timestamp: new Date('2025-01-27T10:30:00'),
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      userId: '1',
      action: 'create_order',
      module: 'pipeline',
      details: 'Criou ordem de compra #ORD-2025-001',
      timestamp: new Date('2025-01-27T10:45:00'),
      ipAddress: '192.168.1.100'
    },
    {
      id: '3',
      userId: '2',
      action: 'edit_lot',
      module: 'lots',
      details: 'Editou lote #LOT-001',
      timestamp: new Date('2025-01-26T16:30:00'),
      ipAddress: '192.168.1.101'
    }
  ]);

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterRole !== 'all' && user.role !== filterRole) {
        return false;
      }
      if (filterStatus !== 'all' && user.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const with2FA = users.filter(u => u.twoFactorEnabled).length;
    const recentActivity = users.filter(u => 
      u.lastActivity && u.lastActivity > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      total: totalUsers,
      active: activeUsers,
      pending: pendingUsers,
      with2FA,
      recentActivity,
      securityScore: totalUsers > 0 ? Math.round((with2FA / totalUsers) * 100) : 0
    };
  }, [users]);

  const handleUserAction = async (action: string, userId: string) => {
    setIsLoading(true);
    
    try {
      switch (action) {
        case 'activate':
          await usersService.activate(userId);
          console.log(`Usuário ${userId} ativado`);
          await loadUsers();
          break;
        case 'deactivate':
          await usersService.deactivate(userId);
          console.log(`Usuário ${userId} desativado`);
          await loadUsers();
          break;
        case 'delete':
          if (confirm('Tem certeza que deseja excluir este usuário?')) {
            await usersService.delete(userId);
            console.log(`Usuário ${userId} excluído`);
            await loadUsers();
          }
          break;
        case 'reset_password':
          const result = await usersService.resetPassword(userId);
          alert(`Senha temporária gerada: ${result.temporaryPassword}`);
          break;
        case 'resend_invite':
          console.log(`Reenviando convite para usuário ${userId}`);
          alert('Funcionalidade de reenviar convite ainda não implementada');
          break;
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert(`Erro ao executar ação: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    setIsLoading(true);
    
    try {
      const emailInput = document.getElementById('invite-email') as HTMLInputElement;
      const nameInput = document.getElementById('invite-name') as HTMLInputElement;
      const passwordInput = document.getElementById('invite-password') as HTMLInputElement;
      const roleSelect = document.getElementById('invite-role') as HTMLSelectElement;
      
      if (!emailInput?.value || !nameInput?.value || !passwordInput?.value) {
        throw new Error('Preencha todos os campos obrigatórios');
      }
      
      // Criar o usuário via API
      await usersService.create({
        email: emailInput.value,
        name: nameInput.value,
        password: passwordInput.value,
        role: roleSelect?.value || 'USER'
      });
      
      console.log(`Usuário criado: ${emailInput.value}`);
      setShowInviteDialog(false);
      
      // Limpar campos
      emailInput.value = '';
      nameInput.value = '';
      passwordInput.value = '';
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert(error.message || 'Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    
    try {
      const nameInput = document.getElementById('edit-name') as HTMLInputElement;
      const emailInput = document.getElementById('edit-email') as HTMLInputElement;
      const roleSelect = document.getElementById('edit-role') as HTMLSelectElement;
      
      if (!nameInput?.value || !emailInput?.value) {
        throw new Error('Preencha todos os campos obrigatórios');
      }
      
      // Atualizar o usuário via API
      await usersService.update(editingUser.id, {
        name: nameInput.value,
        email: emailInput.value,
        role: roleSelect?.value || editingUser.role
      });
      
      console.log(`Usuário atualizado: ${editingUser.id}`);
      setShowEditDialog(false);
      setEditingUser(null);
      
      // Recarregar lista de usuários
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert(error.message || 'Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserActivities = (userId: string) => {
    return userActivities.filter(activity => activity.userId === userId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Gestão de Usuários</h1>
          <p className="page-subtitle">
            Gerencie usuários, permissões e controle de acesso ao sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowActivityDialog(true)}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Atividades
          </Button>
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.total}</div>
            <p className="kpi-change">
              <Users className="h-3 w-3" />
              usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-green-600">{stats.active}</div>
            <p className="kpi-change text-green-600">
              <CheckCircle className="h-3 w-3" />
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Convites Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-orange-600">{stats.pending}</div>
            <p className="kpi-change text-orange-600">
              <AlertCircle className="h-3 w-3" />
              aguardando ativação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">2FA Habilitado</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.with2FA}</div>
            <p className="kpi-change">
              <ShieldCheck className="h-3 w-3" />
              {stats.total > 0 ? Math.round((stats.with2FA / stats.total) * 100) : 0}% dos usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Atividade Recente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.recentActivity}</div>
            <p className="kpi-change">
              <Activity className="h-3 w-3" />
              últimas 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score de Segurança */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Score de Segurança</h3>
              <p className="text-sm text-muted-foreground">
                Baseado na adoção de 2FA e políticas de segurança
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.securityScore}%</div>
              <Badge className={stats.securityScore >= 80 ? 'status-active' : stats.securityScore >= 60 ? 'status-warning' : 'status-error'}>
                {stats.securityScore >= 80 ? 'Excelente' : stats.securityScore >= 60 ? 'Bom' : 'Precisa Melhorar'}
              </Badge>
            </div>
          </div>
          <Progress value={stats.securityScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Papéis</SelectItem>
                <SelectItem value="MASTER">Master</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="USER">Usuário</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Gerencie usuários, papéis e permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {user.department || 'Não definido'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]}>
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <div className="text-sm">
                        <div>{format(user.lastLogin, 'dd/MM/yy', { locale: ptBR })}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(user.lastLogin, 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.twoFactorEnabled ? (
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {user.twoFactorEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setShowUserDialog(true);
                        }}>
                          <Eye className="h-3 w-3 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingUser(user);
                          setShowEditDialog(true);
                        }}>
                          <Edit className="h-3 w-3 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionsDialog(true);
                        }}>
                          <Settings className="h-3 w-3 mr-2" />
                          Permissões
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleUserAction('deactivate', user.id)}>
                            <UserX className="h-3 w-3 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                            <UserCheck className="h-3 w-3 mr-2" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleUserAction('reset_password', user.id)}>
                          <Key className="h-3 w-3 mr-2" />
                          Resetar Senha
                        </DropdownMenuItem>
                        {user.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleUserAction('resend_invite', user.id)}>
                            <Send className="h-3 w-3 mr-2" />
                            Reenviar Convite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleUserAction('delete', user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Usuário */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de atividades
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
                <TabsTrigger value="activity">Atividades</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={roleColors[selectedUser.role]}>
                        {roleLabels[selectedUser.role]}
                      </Badge>
                      <Badge className={statusColors[selectedUser.status]}>
                        {statusLabels[selectedUser.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Departamento</Label>
                    <p className="text-sm">{selectedUser.department || 'Não definido'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefone</Label>
                    <p className="text-sm">{selectedUser.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Criado em</Label>
                    <p className="text-sm">
                      {format(selectedUser.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Último Acesso</Label>
                    <p className="text-sm">
                      {selectedUser.lastLogin 
                        ? format(selectedUser.lastLogin, 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca acessou'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedUser.notes && (
                  <div>
                    <Label className="text-sm font-medium">Observações</Label>
                    <p className="text-sm text-muted-foreground">{selectedUser.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-3">
                  {modules.map(module => {
                    const userPermission = selectedUser.permissions.find(p => p.module === module.id);
                    return (
                      <Card key={module.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{module.name}</h4>
                            <Badge variant="outline">
                              {userPermission?.actions.length || 0} de {module.actions.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {module.actions.map(action => {
                              const hasPermission = userPermission?.actions.includes(action);
                              return (
                                <Badge 
                                  key={action} 
                                  variant={hasPermission ? 'default' : 'outline'}
                                  className={hasPermission ? 'status-active' : ''}
                                >
                                  {action}
                                </Badge>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {getUserActivities(selectedUser.id).map(activity => (
                      <Card key={activity.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{activity.details}</p>
                              <p className="text-sm text-muted-foreground">
                                Módulo: {activity.module}
                              </p>
                              {activity.ipAddress && (
                                <p className="text-xs text-muted-foreground">
                                  IP: {activity.ipAddress}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {format(activity.timestamp, 'dd/MM HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Autenticação de Dois Fatores</Label>
                      <p className="text-xs text-muted-foreground">
                        Adiciona uma camada extra de segurança
                      </p>
                    </div>
                    <Badge className={selectedUser.twoFactorEnabled ? 'status-active' : 'status-inactive'}>
                      {selectedUser.twoFactorEnabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Tentativas de Login</Label>
                      <p className="text-xs text-muted-foreground">
                        Tentativas falhadas recentes
                      </p>
                    </div>
                    <Badge variant="outline">
                      {selectedUser.loginAttempts} tentativas
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Última Atividade</Label>
                      <p className="text-xs text-muted-foreground">
                        Última ação no sistema
                      </p>
                    </div>
                    <span className="text-sm">
                      {selectedUser.lastActivity 
                        ? format(selectedUser.lastActivity, 'dd/MM HH:mm', { locale: ptBR })
                        : 'Nenhuma atividade'
                      }
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Convite */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-name">Nome</Label>
              <Input id="invite-name" type="text" placeholder="Nome Completo" required />
            </div>
            
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" placeholder="usuario@exemplo.com" required />
            </div>
            
            <div>
              <Label htmlFor="invite-password">Senha</Label>
              <Input id="invite-password" type="password" placeholder="Senha inicial" required />
            </div>
            
            <div>
              <Label htmlFor="invite-role">Papel</Label>
              <select id="invite-role" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
                {currentUser?.role === 'MASTER' && (
                  <option value="MASTER">Master</option>
                )}
              </select>
            </div>
            
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Atividades */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Log de Atividades</DialogTitle>
            <DialogDescription>
              Histórico completo de ações dos usuários no sistema
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {userActivities.map(activity => {
                const user = users.find(u => u.id === activity.userId);
                return (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="text-xs">
                              {user ? getInitials(user.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{activity.details}</p>
                            <p className="text-sm text-muted-foreground">
                              {user?.name} • {activity.module}
                            </p>
                            {activity.ipAddress && (
                              <p className="text-xs text-muted-foreground">
                                IP: {activity.ipAddress}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {format(activity.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
              Fechar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input 
                id="edit-name" 
                type="text" 
                defaultValue={editingUser?.name || ''} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                type="email" 
                defaultValue={editingUser?.email || ''} 
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Papel</Label>
              <select 
                id="edit-role" 
                defaultValue={editingUser?.role || 'USER'}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
                {currentUser?.role === 'MASTER' && (
                  <option value="MASTER">Master</option>
                )}
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingUser(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
