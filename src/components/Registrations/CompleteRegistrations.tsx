import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building, 
  Truck, 
  CreditCard, 
  Home, 
  Calendar,
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cleanCpfCnpj, formatCpfCnpj } from '@/utils/cpfCnpjUtils';

// Componentes shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Hooks da Nova Arquitetura API
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useCyclesApi } from '@/hooks/api/useCyclesApi';
import { useEffect } from 'react';

// Tipos de cadastro
const registrationTypes = [
  {
    id: 'partners',
    title: 'Parceiros',
    description: 'Fornecedores, corretores e frigoríficos',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    types: ['vendor', 'broker', 'slaughterhouse', 'transporter']
  },
  {
    id: 'pens',
    title: 'Currais',
    description: 'Locais de confinamento e manejo',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'accounts',
    title: 'Contas Pagadoras',
    description: 'Contas bancárias e financeiras',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'cycles',
    title: 'Ciclos',
    description: 'Ciclos de engorda e operação',
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'properties',
    title: 'Propriedades',
    description: 'Fazendas e propriedades rurais',
    icon: Building2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  }
];

// Componente de Card Genérico
const ItemCard: React.FC<{ 
  item: any; 
  type: string;
  onEdit: (item: any) => void; 
  onView: (item: any) => void; 
  onDelete: (item: any) => void 
}> = ({ item, type, onEdit, onView, onDelete }) => {
  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case 'VENDOR': return 'Fornecedor';
      case 'BROKER': return 'Corretor';
      case 'BUYER': return 'Comprador';
      case 'INVESTOR': return 'Investidor';
      case 'SERVICE_PROVIDER': return 'Prestador de Serviço';
      case 'OTHER': return 'Outro';
      case 'FATTENING': return 'Engorda';
      case 'QUARANTINE': return 'Quarentena';
      case 'AVAILABLE': return 'Disponível';
      case 'OCCUPIED': return 'Ocupado';
      case 'SAVINGS': return 'Poupança';
      case 'CHECKING': return 'Corrente';
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      default: return type || 'Item';
    }
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'VENDOR': return 'status-active';
      case 'BROKER': return 'status-pending';
      case 'BUYER': return 'bg-info';
      case 'INVESTOR': return 'bg-warning';
      case 'SERVICE_PROVIDER': return 'bg-secondary';
      case 'OTHER': return 'bg-muted';
      case 'FATTENING': return 'bg-success';
      case 'QUARANTINE': return 'bg-warning';
      case 'AVAILABLE': return 'status-active';
      case 'OCCUPIED': return 'status-pending';
      case 'SAVINGS': return 'bg-success';
      case 'CHECKING': return 'bg-info';
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      default: return 'status-inactive';
    }
  };

  const getPartnerIcon = (type: string) => {
    switch (type) {
      case 'vendor': return <Users className="h-3 w-3" />;
      case 'broker': return <Building className="h-3 w-3" />;
      case 'slaughterhouse': return <Building2 className="h-3 w-3" />;
      case 'transporter': return <Truck className="h-3 w-3" />;
      case 'FATTENING': return <Home className="h-3 w-3" />;
      case 'QUARANTINE': return <Shield className="h-3 w-3" />;
      case 'AVAILABLE': return <CheckCircle className="h-3 w-3" />;
      case 'OCCUPIED': return <Clock className="h-3 w-3" />;
      case 'SAVINGS': return <CreditCard className="h-3 w-3" />;
      case 'CHECKING': return <CreditCard className="h-3 w-3" />;
      case 'ACTIVE': return <Activity className="h-3 w-3" />;
      case 'INACTIVE': return <XCircle className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover-lift animate-scale-in group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {item.name ? item.name.slice(0, 2).toUpperCase() : 
                 item.penNumber ? item.penNumber.slice(-2) :
                 item.accountName ? item.accountName.slice(0, 2).toUpperCase() : 'IT'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="card-title">
                {item.name || item.penNumber || item.accountName || 'Item'}
              </CardTitle>
              <CardDescription className="card-subtitle">
                {item.cpfCnpj ? `${item.cpfCnpj}` :
                 item.location ? `${item.location} • Cap: ${item.capacity || 0}` :
                 item.bankName ? `${item.bankName} • ${item.accountNumber || 'N/A'}` :
                 item.description || 'N/A'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getPartnerTypeColor(item.type || item.status || 'default')}>
              {getPartnerIcon(item.type || item.status || 'default')}
              <span className="ml-1">{getPartnerTypeLabel(item.type || item.status || 'default')}</span>
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Informações de contato */}
        <div className="space-y-2">
          {item.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{item.phone}</span>
            </div>
          )}
          {item.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{item.address}</span>
            </div>
          )}
          {item.capacity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-3 w-3" />
              <span>Capacidade: {item.capacity} animais</span>
            </div>
          )}
          {item.bankName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{item.bankName} - {item.accountNumber}</span>
            </div>
          )}
        </div>

        {/* Status e métricas */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {item.isActive ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <span className="text-xs text-muted-foreground">
              {item.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Desde {(() => {
              try {
                if (!item.createdAt) return 'Data não informada';
                const date = new Date(item.createdAt);
                if (isNaN(date.getTime())) return 'Data inválida';
                return format(date, 'MMM/yy', { locale: ptBR });
              } catch (err) {
                console.warn('Erro ao formatar data:', { date: item.createdAt, error: err });
                return 'Data inválida';
              }
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



// Modal de Visualização
const ItemDetailModal: React.FC<{
  item: any;
  type: string;
  open: boolean;
  onClose: () => void;
}> = ({ item, type, open, onClose }) => {
  if (!item) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'partners': return 'Parceiro';
      case 'pens': return 'Curral';
      case 'accounts': return 'Conta Pagadora';
      case 'cycles': return 'Ciclo';
      default: return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="card-title flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Detalhes do {getTypeLabel(type)}
          </DialogTitle>
          <DialogDescription>
            Visualize as informações detalhadas do cadastro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {type === 'partners' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Nome</Label>
                  <p className="text-body-sm">{item.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Tipo</Label>
                  <p className="text-body-sm">{item.type || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">CPF/CNPJ</Label>
                  <p className="text-body-sm">{item.cpfCnpj || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Telefone</Label>
                  <p className="text-body-sm">{item.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="form-label">Email</Label>
                <p className="text-body-sm">{item.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="form-label">Endereço</Label>
                <p className="text-body-sm">{item.address || 'N/A'}</p>
              </div>

            </>
          )}
          
          {type === 'pens' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Número</Label>
                  <p className="text-body-sm">{item.penNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Capacidade</Label>
                  <p className="text-body-sm">{item.capacity || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="form-label">Localização</Label>
                <p className="text-body-sm">{item.location || 'N/A'}</p>
              </div>
              <div>
                <Label className="form-label">Status</Label>
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </>
          )}
          
          {type === 'accounts' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Nome da Conta</Label>
                  <p className="text-body-sm">{item.accountName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Banco</Label>
                  <p className="text-body-sm">{item.bankName || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Agência</Label>
                  <p className="text-body-sm">{item.agency || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Conta</Label>
                  <p className="text-body-sm">{item.accountNumber || 'N/A'}</p>
                </div>
              </div>
            </>
          )}
          
          {type === 'cycles' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="form-label">Nome</Label>
                  <p className="text-body-sm">{item.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="form-label">Status</Label>
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="form-label">Descrição</Label>
                <p className="text-body-sm">{item.description || 'N/A'}</p>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Modal de Confirmação de Exclusão
const DeleteConfirmModal: React.FC<{
  item: any;
  type: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, type, open, onConfirm, onCancel }) => {
  if (!item) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'partners': return 'parceiro';
      case 'pens': return 'curral';
      case 'accounts': return 'conta pagadora';
      case 'cycles': return 'ciclo';
      default: return 'item';
    }
  };

  const getItemName = (item: any, type: string) => {
    switch (type) {
      case 'partners': return item.name;
      case 'pens': return `Curral ${item.penNumber}`;
      case 'accounts': return item.accountName;
      case 'cycles': return item.name;
      default: return 'Item';
    }
  };

  const getWarningMessage = (type: string) => {
    switch (type) {
      case 'partners':
        return 'Esta ação removerá o parceiro e pode afetar pedidos de compra e vendas associadas.';
      case 'pens':
        return 'Esta ação removerá o curral e pode afetar lotes que estão alocados neste curral.';
      case 'accounts':
        return 'Esta ação removerá a conta pagadora e pode afetar transações financeiras associadas.';
      case 'cycles':
        return 'Esta ação removerá o ciclo e pode afetar lotes e operações associadas a este período.';
      default:
        return 'Esta ação não pode ser desfeita.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="card-title flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este {getTypeLabel(type)}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do item */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                {type === 'partners' && <Users className="h-4 w-4 text-destructive" />}
                {type === 'pens' && <Home className="h-4 w-4 text-destructive" />}
                {type === 'accounts' && <CreditCard className="h-4 w-4 text-destructive" />}
                {type === 'cycles' && <Calendar className="h-4 w-4 text-destructive" />}
              </div>
              <div>
                <p className="text-body-sm font-medium">{getItemName(item, type)}</p>
                <p className="text-caption text-muted-foreground">
                  {type === 'partners' && item.type}
                  {type === 'pens' && `Capacidade: ${item.capacity}`}
                  {type === 'accounts' && item.bankName}
                  {type === 'cycles' && item.description}
                </p>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-medium text-warning">Atenção</p>
                <p className="text-body-sm text-muted-foreground mt-1">
                  {getWarningMessage(type)}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmação */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-body-sm text-destructive font-medium">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir {getTypeLabel(type)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Formulário de Parceiro
const PartnerForm: React.FC<{ 
  partner?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void 
}> = ({ partner, onSave, onCancel }) => {
  const [formData, setFormData] = useState(partner || {
    name: '',
    type: 'VENDOR',
    cpfCnpj: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar CPF/CNPJ e remover campos vazios antes de salvar
    const cleanedData: any = {};
    
    // Adicionar apenas campos preenchidos
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'cpfCnpj') {
          cleanedData[key] = cleanCpfCnpj(value as string);
        } else {
          cleanedData[key] = value;
        }
      }
    });
    
    // Preservar campos originais se estiver editando
    const dataToSave = partner ? {
      ...partner, // Preserva todos os campos originais
      ...cleanedData, // Sobrescreve com os campos editados
    } : cleanedData;
    
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do parceiro"
            required
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Tipo *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="form-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VENDOR">Fornecedor</SelectItem>
              <SelectItem value="BROKER">Corretor</SelectItem>
              <SelectItem value="BUYER">Comprador</SelectItem>
              <SelectItem value="INVESTOR">Investidor</SelectItem>
              <SelectItem value="SERVICE_PROVIDER">Prestador de Serviço</SelectItem>
              <SelectItem value="FREIGHT_CARRIER">Transportadora/Frete</SelectItem>
              <SelectItem value="OTHER">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">CPF/CNPJ</Label>
          <Input
            value={formatCpfCnpj(formData.cpfCnpj || '')}
            onChange={(e) => {
              const formatted = formatCpfCnpj(e.target.value);
              setFormData({ ...formData, cpfCnpj: formatted });
            }}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            className="form-input"
            maxLength={18}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="form-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="form-label">Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          className="form-input"
        />
      </div>

      <div className="space-y-2">
        <Label className="form-label">Endereço</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Endereço completo"
          className="form-input"
        />
      </div>



      <div className="space-y-2">
        <Label className="form-label">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações adicionais..."
          className="form-input"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="form-label">Parceiro ativo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {partner ? 'Atualizar' : 'Criar'} Parceiro
        </Button>
      </div>
    </form>
  );
};

// Formulário de Curral
const PenForm: React.FC<{ 
  pen?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void 
}> = ({ pen, onSave, onCancel }) => {
  const [formData, setFormData] = useState(pen || {
    penNumber: '',
    capacity: '',
    location: '',
    type: 'FATTENING', // Tipo padrão
    status: 'AVAILABLE', // Status padrão
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preservar campos originais se estiver editando
    const dataToSave = pen ? {
      ...pen, // Preserva todos os campos originais
      ...formData, // Sobrescreve com os campos editados
      capacity: parseInt(formData.capacity) || 0
    } : {
      ...formData,
      capacity: parseInt(formData.capacity) || 0
    };
    
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Número do Curral *</Label>
          <Input
            value={formData.penNumber}
            onChange={(e) => setFormData({ ...formData, penNumber: e.target.value })}
            placeholder="001"
            required
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Capacidade *</Label>
          <Input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="100"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="form-label">Localização</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Setor A - Galpão 1"
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Tipo</Label>
          <select
            value={formData.type || 'FATTENING'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="RECEPTION">Recepção</option>
            <option value="FATTENING">Engorda</option>
            <option value="QUARANTINE">Quarentena</option>
            <option value="HOSPITAL">Hospital</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Status</Label>
          <select
            value={formData.status || 'AVAILABLE'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="AVAILABLE">Disponível</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="MAINTENANCE">Manutenção</option>
            <option value="QUARANTINE">Quarentena</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="form-label">Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {pen ? 'Atualizar' : 'Criar'} Curral
        </Button>
      </div>
    </form>
  );
};

// Formulário de Conta Pagadora
const PayerAccountForm: React.FC<{ 
  account?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void 
}> = ({ account, onSave, onCancel }) => {
  const [formData, setFormData] = useState(account || {
    accountName: '',
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'CHECKING',
    balance: 0,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preservar campos originais se estiver editando
    const dataToSave = account ? {
      ...account, // Preserva todos os campos originais
      ...formData, // Sobrescreve com os campos editados
      balance: parseFloat(formData.balance) || 0
    } : {
      ...formData,
      balance: parseFloat(formData.balance) || 0
    };
    
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Nome da Conta *</Label>
          <Input
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            placeholder="Conta Principal"
            required
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Banco *</Label>
          <Input
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="Banco do Brasil"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Agência *</Label>
          <Input
            value={formData.agency}
            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            placeholder="1234-5"
            required
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Número da Conta *</Label>
          <Input
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="12345-6"
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Tipo de Conta *</Label>
          <Select value={formData.accountType} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
            <SelectTrigger className="form-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CHECKING">Conta Corrente</SelectItem>
              <SelectItem value="SAVINGS">Poupança</SelectItem>
              <SelectItem value="INVESTMENT">Investimento</SelectItem>
              <SelectItem value="CASH">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Saldo Inicial</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.balance || 0}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            placeholder="0.00"
            className="form-input"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="form-label">Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {account ? 'Atualizar' : 'Criar'} Conta
        </Button>
      </div>
    </form>
  );
};

// Formulário de Ciclo
const CycleForm: React.FC<{ 
  cycle?: any; 
  onSave: (data: any) => void; 
  onCancel: () => void 
}> = ({ cycle, onSave, onCancel }) => {
  // Função para converter ISO date string para formato yyyy-MM-dd
  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState(() => {
    if (cycle) {
      return {
        ...cycle,
        startDate: formatDateForInput(cycle.startDate),
        endDate: formatDateForInput(cycle.endDate),
        budget: cycle.budget ?? 0,
        targetAnimals: cycle.targetAnimals ?? 0,
        isActive: cycle.isActive ?? true
      };
    }
    return {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      budget: 0,
      targetAnimals: 0,
      isActive: true
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preservar campos originais se estiver editando
    const dataToSave = cycle ? {
      ...cycle, // Preserva todos os campos originais
      ...formData, // Sobrescreve com os campos editados
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    } : {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    };
    
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="form-label">Nome do Ciclo *</Label>
        <Input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ciclo 2024/1"
          required
          className="form-input"
        />
      </div>

      <div className="space-y-2">
        <Label className="form-label">Status *</Label>
        <Select value={formData.status || 'PLANNED'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="form-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANNED">Planejado</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="COMPLETED">Completo</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="form-label">Descrição</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do ciclo..."
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Data de Início</Label>
          <Input
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Data de Fim</Label>
          <Input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="form-label">Orçamento</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.budget || 0}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="form-input"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="form-label">Número de Animais</Label>
          <Input
            type="number"
            value={formData.targetAnimals || 0}
            onChange={(e) => setFormData({ ...formData, targetAnimals: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="form-input"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="form-label">Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {cycle ? 'Atualizar' : 'Criar'} Ciclo
        </Button>
      </div>
    </form>
  );
};

// Componente Principal
export const CompleteRegistrations: React.FC = () => {
  const { partners, loading: partnersLoading, deletePartner, updatePartner, createPartner } = usePartnersApi();
  const { pens, loading: pensLoading, deletePen, updatePen, createPen } = usePensApi();
  const { payerAccounts, loading: accountsLoading, deletePayerAccount, updatePayerAccount, createPayerAccount } = usePayerAccountsApi();
  const { cycles, loading: cyclesLoading, deleteCycle, updateCycle, createCycle } = useCyclesApi();
  
  const [activeTab, setActiveTab] = useState('partners');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Dados filtrados
  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'partners':
        data = partners || [];
        break;
      case 'pens':
        data = pens || [];
        break;
      case 'accounts':
        data = payerAccounts || [];
        break;
      case 'cycles':
        data = cycles || [];
        break;
      default:
        data = [];
    }

    return data.filter(item => {
      // Busca adaptada para cada tipo de dado
      let searchText = '';
      switch (activeTab) {
        case 'partners':
          searchText = `${item.name || ''} ${item.cpfCnpj || ''} ${item.email || ''}`.toLowerCase();
          break;
        case 'pens':
          searchText = `${item.penNumber || ''} ${item.location || ''}`.toLowerCase();
          break;
        case 'accounts':
          searchText = `${item.accountName || ''} ${item.bankName || ''} ${item.accountNumber || ''}`.toLowerCase();
          break;
        case 'cycles':
          searchText = `${item.name || ''} ${item.description || ''}`.toLowerCase();
          break;
        default:
          searchText = '';
      }
      
      const matchesSearch = searchTerm === '' || searchText.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && item.isActive) ||
                           (statusFilter === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [activeTab, partners, pens, payerAccounts, cycles, searchTerm, typeFilter, statusFilter]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const partnersArray = Array.isArray(partners) ? partners : [];
    const activePartners = partnersArray.filter(p => p.isActive).length;
    
    const pensArray = Array.isArray(pens) ? pens : [];
    const totalPens = pensArray.length;
    const activePens = pensArray.filter(p => p.isActive).length;
    
    const accountsArray = Array.isArray(payerAccounts) ? payerAccounts : [];
    const totalAccounts = accountsArray.length;
    
    const cyclesArray = Array.isArray(cycles) ? cycles : [];
    const activeCycles = cyclesArray.filter(c => c.isActive).length;

    return {
      totalPartners: partners?.length || 0,
      activePartners,
      totalPens,
      activePens,
      totalAccounts,
      activeCycles,
      penOccupancy: totalPens > 0 ? (activePens / totalPens) * 100 : 0
    };
  }, [partners, pens, payerAccounts, cycles]);

  const handleItemView = (item: any) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleItemEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleItemDelete = (item: any) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      switch (activeTab) {
        case 'partners':
          await deletePartner(itemToDelete.id);
          break;
        case 'pens':
          await deletePen(itemToDelete.id);
          break;
        case 'accounts':
          await deletePayerAccount(itemToDelete.id);
          break;
        case 'cycles':
          await deleteCycle(itemToDelete.id);
          break;
        default:
          console.log('Tipo de item não reconhecido');
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleFormSave = async (data: any) => {
    try {
      switch (activeTab) {
        case 'partners':
          if (editingItem) {
            await updatePartner(editingItem.id, data);
          } else {
            await createPartner(data);
          }
          break;
        case 'pens':
          if (editingItem) {
            await updatePen(editingItem.id, data);
          } else {
            await createPen(data);
          }
          break;
        case 'accounts':
          if (editingItem) {
            await updatePayerAccount(editingItem.id, data);
          } else {
            await createPayerAccount(data);
          }
          break;
        case 'cycles':
          if (editingItem) {
            await updateCycle(editingItem.id, data);
          } else {
            await createCycle(data);
          }
          break;
        default:
          console.log('Tipo de item não reconhecido');
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Função para calcular a quantidade de itens por tipo
  const getItemCount = (typeId: string) => {
    switch (typeId) {
      case 'partners':
        return partners?.length || 0;
      case 'pens':
        return pens?.length || 0;
      case 'accounts':
        return payerAccounts?.length || 0;
      case 'cycles':
        return cycles?.length || 0;
      case 'properties':
        return 0; // Ainda não implementado
      default:
        return 0;
    }
  };

  const isLoading = partnersLoading || pensLoading || accountsLoading || cyclesLoading;

  // DEBUG - Removido para mostrar a página normal
  // Descomente se precisar debugar novamente
  /*
  if (false) { 
    const DebugRegistrations = React.lazy(() => import('./DebugRegistrations').then(module => ({ default: module.DebugRegistrations })));
    return (
      <React.Suspense fallback={<div>Carregando debug...</div>}>
        <div className="space-y-4">
          <DebugRegistrations />
          {!isLoading && (
            <div className="text-center">
              <p className="text-sm text-green-600 mb-2">✅ Dados carregados! Mostrando interface normal abaixo:</p>
            </div>
          )}
        </div>
      </React.Suspense>
    );
  }
  */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Carregando cadastros...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Cadastros do Sistema</h1>
            <p className="page-subtitle">
              Gerencie parceiros, currais, contas e todos os cadastros do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cadastro
            </Button>
          </div>
        </div>

        {/* Cards de Navegação */}
        <div className="grid gap-4 md:grid-cols-5">
          {registrationTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeTab === type.id;
            
            return (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover-lift ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveTab(type.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`p-2 ${type.bgColor} rounded-lg w-fit`}>
                    <Icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="card-title">{type.title}</h3>
                  <p className="card-subtitle mt-1">
                    {type.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {getItemCount(type.id)} itens
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="card-title">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, documento ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {activeTab === 'partners' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="vendor">Fornecedor</SelectItem>
                    <SelectItem value="broker">Corretor</SelectItem>
                    <SelectItem value="slaughterhouse">Frigorífico</SelectItem>
                    <SelectItem value="transporter">Transportadora</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
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

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Parceiros */}
          <TabsContent value="partners" className="space-y-4">
            {filteredData.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item}
                    type={activeTab}
                    onEdit={handleItemEdit}
                    onView={handleItemView}
                    onDelete={handleItemDelete}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum parceiro encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar um novo parceiro
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Currais */}
          <TabsContent value="pens" className="space-y-4">
            {filteredData.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredData.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item}
                    type={activeTab}
                    onEdit={handleItemEdit}
                    onView={handleItemView}
                    onDelete={handleItemDelete}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Home className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum curral encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar um novo curral
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Outras abas seguem o mesmo padrão... */}
          <TabsContent value="accounts" className="space-y-4">
            {filteredData.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item}
                    type={activeTab}
                    onEdit={handleItemEdit}
                    onView={handleItemView}
                    onDelete={handleItemDelete}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma conta encontrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar uma nova conta
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cycles" className="space-y-4">
            {filteredData.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item}
                    type={activeTab}
                    onEdit={handleItemEdit}
                    onView={handleItemView}
                    onDelete={handleItemDelete}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum ciclo encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar um novo ciclo
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Propriedades Rurais
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Formulário */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar' : 'Novo'} {registrationTypes.find(t => t.id === activeTab)?.title}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para {editingItem ? 'atualizar' : 'criar'} o cadastro.
              </DialogDescription>
            </DialogHeader>
            
            {activeTab === 'partners' && (
              <PartnerForm
                partner={editingItem}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            )}
            
            {activeTab === 'pens' && (
              <PenForm
                pen={editingItem}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            )}
            
            {activeTab === 'accounts' && (
              <PayerAccountForm
                account={editingItem}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            )}
            
            {activeTab === 'cycles' && (
              <CycleForm
                cycle={editingItem}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização */}
        <ItemDetailModal
          item={selectedItem}
          type={activeTab}
          open={showDetail}
          onClose={() => setShowDetail(false)}
        />

        {/* Modal de Confirmação de Exclusão */}
        <DeleteConfirmModal
          item={itemToDelete}
          type={activeTab}
          open={showDeleteConfirm}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </TooltipProvider>
  );
};
