import React, { useState, useEffect, useMemo } from 'react';
import { usersService } from '@/services/api/users';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Clock,
  Building2,
  Ban,
  CheckCircle
} from 'lucide-react';
import { useBackend } from '@/providers/BackendProvider';
import { toast } from 'sonner';
// Tipos simplificados (sem funcionalidades de aprovação)
interface User {
  id: string;
  name: string;
  email: string;
  role: 'MASTER' | 'ADMIN' | 'USER';
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  phone?: string;
  department?: string;
  notes?: string;
}

const roleLabels = {
  MASTER: 'Master',
  ADMIN: 'Administrador',
  USER: 'Usuário'
};

const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo'
};

const statusColors = {
  active: 'status-success',
  inactive: 'status-inactive'
};

const CleanUserManagement: React.FC = () => {
  const { user: currentUser, updateUser } = useBackend();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
  const [isLoading, setIsLoading] = useState(false);

  // Dados reais do Backend
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carregar usuários reais do backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'https://aplicacao-boi-gordo.pages.dev/api/v1');
        const response = await fetch(`${apiUrl}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            // Mapear dados do backend para interface
            const mappedUsers = data.data.map(user => ({
              id: user.id,
              name: user.name || 'Usuário',
              email: user.email,
              role: user.role || 'USER',
              status: user.isActive ? 'active' : 'inactive',
              lastLogin: user.updatedAt ? new Date(user.updatedAt) : new Date(),
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              phone: user.phone || '',
              department: user.department || 'Geral',
              notes: user.notes || ''
            }));
            setUsers(mappedUsers);
          }
        } else {
          // Fallback para usuário atual apenas
          setUsers([{
            id: currentUser?.id || '1',
            name: currentUser?.name || 'Usuário Atual',
            email: currentUser?.email || 'usuario@sistema.com',
            role: currentUser?.role || 'ADMIN',
            status: 'active',
            lastLogin: new Date(),
            createdAt: new Date(),
            phone: '',
            department: 'Administração',
            notes: 'Usuário do sistema'
          }]);
        }
      } catch (_error) {
        console.error('Erro ao carregar usuários:', error);
        // Fallback para usuário atual apenas
        setUsers([{
          id: currentUser?.id || '1',
          name: currentUser?.name || 'Usuário Atual',
          email: currentUser?.email || 'usuario@sistema.com',
          role: currentUser?.role || 'ADMIN',
          status: 'active',
          lastLogin: new Date(),
          createdAt: new Date(),
          phone: '',
          department: 'Administração',
          notes: 'Usuário do sistema'
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [currentUser]);

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

  // Calcular estatísticas simplificadas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'MASTER').length;
    
    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: admins
    };
  }, [users]);

  // Função para recarregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'http://localhost:3001/api/v1');
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Mapear dados do backend para interface
          const mappedUsers = data.data.map((user: any) => ({
            id: user.id,
            name: user.name || 'Usuário',
            email: user.email,
            role: user.role || 'USER',
            status: user.isActive ? 'active' : 'inactive',
            lastLogin: user.updatedAt ? new Date(user.updatedAt) : new Date(),
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            phone: user.phone || '',
            department: user.department || 'Geral',
            notes: user.notes || ''
          }));
          setUsers(mappedUsers);
        }
      }
    } catch (_error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para alternar status do usuário
  const handleToggleUserStatus = async (user: User) => {
    try {
      setIsLoading(true);
      await usersService.update(user.id, {
        isActive: user.status !== 'active'
      });
      await loadUsers();
      toast({
        title: user.status === 'active' ? 'Usuário Desativado' : 'Usuário Ativado',
        description: `O usuário ${user.name} foi ${user.status === 'active' ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message || 'Não foi possível alterar o status do usuário.' ? `${'Erro'}: ${error.message || 'Não foi possível alterar o status do usuário.'}` : 'Erro');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para abrir dialog de confirmação
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário.' ? `${'Erro'}: ${'Você não pode excluir seu próprio usuário.'}` : 'Erro');
      return;
    }
    setDeleteConfirmDialog({ isOpen: true, userId });
  };

  // Handler para confirmar exclusão
  const confirmDeleteUser = async () => {
    const userId = deleteConfirmDialog.userId;
    if (!userId) return;

    try {
      setIsLoading(true);
      await usersService.delete(userId);
      // Recarregar a lista de usuários
      await loadUsers();
      toast('O usuário foi excluído com sucesso.' ? `${'Usuário Excluído'}: ${'O usuário foi excluído com sucesso.'}` : 'Usuário Excluído');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.message || 'Não foi possível excluir o usuário. Tente novamente.' ? `${'Erro'}: ${error.message || 'Não foi possível excluir o usuário. Tente novamente.'}` : 'Erro');
    } finally {
      setIsLoading(false);
      setDeleteConfirmDialog({ isOpen: false, userId: null });
    }
  };

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    // O dialog de edição será aberto automaticamente quando selectedUser for definido
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      const updatedUser = await usersService.update(selectedUser.id, {
        name: updatedData.name,
        email: updatedData.email,
        role: updatedData.role,
        isActive: updatedData.status === 'active',
        phone: updatedData.phone,
        department: updatedData.department,
        notes: updatedData.notes
      });

      // Se o usuário está atualizando suas próprias informações, atualizar o contexto
      if (selectedUser.id === currentUser?.id) {
        updateUser({
          name: updatedData.name,
          email: updatedData.email,
          role: updatedData.role,
          phone: updatedData.phone,
          department: updatedData.department
        });
      }

      await loadUsers();
      setSelectedUser(null);
      toast('As informações do usuário foram atualizadas com sucesso.' ? `${'Usuário Atualizado'}: ${'As informações do usuário foram atualizadas com sucesso.'}` : 'Usuário Atualizado');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Não foi possível atualizar o usuário. Tente novamente.' ? `${'Erro'}: ${error.message || 'Não foi possível atualizar o usuário. Tente novamente.'}` : 'Erro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData: { name: string; email: string; password: string; role: string }) => {
    try {
      setIsLoading(true);
      await usersService.create(userData);
      await loadUsers();
      setShowCreateDialog(false);
      toast('O novo usuário foi criado com sucesso.' ? `${'Usuário Criado'}: ${'O novo usuário foi criado com sucesso.'}` : 'Usuário Criado');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Não foi possível criar o usuário. Tente novamente.' ? `${'Erro'}: ${error.message || 'Não foi possível criar o usuário. Tente novamente.'}` : 'Erro');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie usuários do sistema - dados reais do banco
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* KPIs Simplificados */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">ativos no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">temporariamente inativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">com permissões especiais</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-filter">Papel</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Papéis</SelectItem>
                  <SelectItem value="MASTER">Master</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Lista de usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.department && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.department}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={user.role === 'MASTER' ? 'destructive' : user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {user.lastLogin.toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Nunca</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {user.createdAt.toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditUser(user)}
                        title="Editar usuário"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleUserStatus(user)}
                          title="Desativar usuário"
                          disabled={user.id === currentUser?.id}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleUserStatus(user)}
                          title="Ativar usuário"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum usuário encontrado</p>
                      <p className="text-sm">Ajuste os filtros ou adicione novos usuários</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação de Usuário */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-name" className="text-right">Nome</Label>
              <Input id="create-name" placeholder="Nome completo" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-email" className="text-right">Email</Label>
              <Input id="create-email" type="email" placeholder="email@exemplo.com" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-password" className="text-right">Senha</Label>
              <Input id="create-password" type="password" placeholder="Senha" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-role" className="text-right">Papel</Label>
              <Select defaultValue="USER">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MASTER">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                const nameInput = document.getElementById('create-name') as HTMLInputElement;
                const emailInput = document.getElementById('create-email') as HTMLInputElement;
                const passwordInput = document.getElementById('create-password') as HTMLInputElement;
                const roleSelect = document.querySelector('[role="combobox"]') as HTMLElement;
                
                if (nameInput && emailInput && passwordInput) {
                  await handleCreateUser({
                    name: nameInput.value,
                    email: emailInput.value,
                    password: passwordInput.value,
                    role: 'USER' // Default to USER for now
                  });
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Usuário */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Nome</Label>
                  <Input id="edit-name" defaultValue={selectedUser.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input id="edit-email" type="email" defaultValue={selectedUser.email} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">Papel</Label>
                  <Select defaultValue={selectedUser.role}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuário</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="MASTER">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-status" className="text-right">Status</Label>
                  <Select defaultValue={selectedUser.status}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-phone" className="text-right">Telefone</Label>
                  <Input id="edit-phone" defaultValue={selectedUser.phone} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-department" className="text-right">Depto</Label>
                  <Input id="edit-department" defaultValue={selectedUser.department} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    const nameInput = document.getElementById('edit-name') as HTMLInputElement;
                    const emailInput = document.getElementById('edit-email') as HTMLInputElement;
                    const phoneInput = document.getElementById('edit-phone') as HTMLInputElement;
                    const deptInput = document.getElementById('edit-department') as HTMLInputElement;
                    
                    if (nameInput && emailInput) {
                      await handleUpdateUser({
                        name: nameInput.value,
                        email: emailInput.value,
                        role: selectedUser.role, // Keep existing for now
                        status: selectedUser.status, // Keep existing for now
                        phone: phoneInput?.value || '',
                        department: deptInput?.value || '',
                        notes: ''
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => !open && setDeleteConfirmDialog({ isOpen: false, userId: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog({ isOpen: false, userId: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? 'Excluindo...' : 'Excluir Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CleanUserManagement;
