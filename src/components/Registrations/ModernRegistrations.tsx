import React, { useState } from 'react';
import {
  Users,
  Building2,
  Truck,
  Package,
  Home,
  CreditCard,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  UserCheck,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Hooks da Nova Arquitetura API
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';

const registrationTypes = [
  {
    id: 'partners',
    title: 'Parceiros',
    description: 'Fornecedores, corretores e frigoríficos',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'pens',
    title: 'Currais',
    description: 'Locais de confinamento',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'accounts',
    title: 'Contas',
    description: 'Contas bancárias e pagadoras',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'properties',
    title: 'Propriedades',
    description: 'Fazendas e propriedades rurais',
    icon: Building2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'vehicles',
    title: 'Veículos',
    description: 'Caminhões e veículos de transporte',
    icon: Truck,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
];

export const ModernRegistrations: React.FC = () => {
  const { partners } = usePartnersApi();
  const { pens } = usePensApi();
  const { payerAccounts } = usePayerAccountsApi();
  const [activeTab, setActiveTab] = useState('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState('');

  // Formulário de Parceiro
  const PartnerForm = () => {
    const [formData, setFormData] = useState(editingItem || {
      name: '',
      type: 'vendor',
      cpfCnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      isActive: true
    });

    return (
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Parceiro' : 'Novo Parceiro'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do parceiro
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome do parceiro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">Fornecedor</SelectItem>
                    <SelectItem value="broker">Corretor</SelectItem>
                    <SelectItem value="slaughterhouse">Frigorífico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})}
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(v) => setFormData({...formData, state: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações sobre o parceiro"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Ativo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Salvar dados
              setShowForm(false);
              setEditingItem(null);
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Formulário de Curral
  const PenForm = () => {
    const [formData, setFormData] = useState(editingItem || {
      code: '',
      capacity: '',
      currentOccupancy: 0,
      location: '',
      notes: '',
      isActive: true
    });

    return (
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Curral' : 'Novo Curral'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do curral
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="CUR-001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Setor A - Galpão 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações sobre o curral"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Ativo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Salvar dados
              setShowForm(false);
              setEditingItem(null);
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'partners':
        return (
          <>
            {/* Lista de Parceiros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parceiros Cadastrados</CardTitle>
                    <CardDescription>
                      {partners.length} parceiros no total
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setFormType('partner');
                    setShowForm(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Parceiro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {partner.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{partner.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              partner.type === 'vendor' ? 'default' :
                              partner.type === 'broker' ? 'secondary' :
                              'outline'
                            }>
                              {partner.type === 'vendor' ? 'Fornecedor' :
                               partner.type === 'broker' ? 'Corretor' :
                               'Frigorífico'}
                            </Badge>
                          </TableCell>
                          <TableCell>{partner.cpfCnpj}</TableCell>
                          <TableCell>{partner.phone}</TableCell>
                          <TableCell>{partner.email}</TableCell>
                          <TableCell>{partner.city}/{partner.state}</TableCell>
                          <TableCell>
                            <Badge variant={partner.isActive ? "success" : "secondary"}>
                              {partner.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingItem(partner);
                                  setFormType('partner');
                                  setShowForm(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            {formType === 'partner' && <PartnerForm />}
          </>
        );

      case 'pens':
        return (
          <>
            {/* Lista de Currais */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Currais Cadastrados</CardTitle>
                    <CardDescription>
                      {pens.length} currais no total
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setFormType('pen');
                    setShowForm(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Curral
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {pens.map((pen) => (
                    <Card key={pen.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{pen.code}</CardTitle>
                          <Badge variant={pen.isActive ? "success" : "secondary"}>
                            {pen.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacidade</span>
                            <span className="font-medium">{pen.capacity} animais</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ocupação</span>
                            <span className="font-medium">{pen.currentOccupancy} animais</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Disponível</span>
                            <span className="font-medium text-green-600">
                              {pen.capacity - pen.currentOccupancy} vagas
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            {formType === 'pen' && <PenForm />}
          </>
        );

      case 'accounts':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contas Cadastradas</CardTitle>
                  <CardDescription>
                    {payerAccounts.length} contas no total
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {payerAccounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <Badge variant={account.isActive ? "success" : "secondary"}>
                          {account.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Banco</span>
                          <span className="font-medium">{account.bankName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Agência</span>
                          <span className="font-medium">{account.agency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Conta</span>
                          <span className="font-medium">{account.accountNumber}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-body text-muted-foreground">
                  Seção em desenvolvimento
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta funcionalidade estará disponível em breve
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="page-title">Cadastros</h2>
            <p className="text-muted-foreground">
              Gerencie todos os cadastros do sistema
            </p>
          </div>
        </div>

        {/* Cards de navegação */}
        <div className="grid gap-4 md:grid-cols-5">
          {registrationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  activeTab === type.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveTab(type.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`p-2 ${type.bgColor} rounded-lg w-fit`}>
                    <Icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-sm">{type.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo dinâmico baseado na aba selecionada */}
        {renderContent()}
      </div>
    </TooltipProvider>
  );
};