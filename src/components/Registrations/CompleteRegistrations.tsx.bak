import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Star,
  Shield,
  Zap,
  ShoppingCart,
  DollarSign,
  Wrench,
  Package,
  LogIn,
  Wallet,
  Tags,
  Palette,
  RefreshCw,
  User
} from 'lucide-react';
import { formatSafeDate as formatBrazilianDate } from '@/utils/dateUtils';
import { toast } from 'sonner';
const formatBrazilianCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatBrazilianNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const DATE_CONFIG = { locale: 'pt-BR' };
import { cleanCpfCnpj, formatCpfCnpj } from '@/utils/cpfCnpjUtils';
import categoryAPI, { Category } from '@/services/api/categoryApi';
import { CategoryCostCenterManager } from '@/components/Financial/CategoryCostCenterManager';

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

// Tipos de cadastro
const registrationTypes = [
  {
    id: 'partners',
    title: 'Parceiros',
    description: 'Fornecedores, corretores e frigoríficos',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    types: ['vendor', 'broker', 'slaughterhouse', 'transporter']
  },
  {
    id: 'pens',
    title: 'Currais',
    description: 'Locais de confinamento e manejo',
    icon: Home,
    color: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'accounts',
    title: 'Contas Pagadoras',
    description: 'Contas bancárias e financeiras',
    icon: CreditCard,
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'categories',
    title: 'Categorias',
    description: 'Categorias de receitas e despesas',
    icon: Tags,
    color: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: 'properties',
    title: 'Propriedades',
    description: 'Fazendas e propriedades rurais',
    icon: Building2,
    color: 'text-teal-600 dark:text-teal-400'
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
      // Tipos de parceiros
      case 'SELLER': return 'Vendedor';
      case 'VENDOR': return 'Fornecedor';
      case 'BROKER': return 'Corretor';
      case 'BUYER': return 'Comprador';
      case 'INVESTOR': return 'Investidor';
      case 'SERVICE_PROVIDER': return 'Prestador de Serviço';
      case 'FREIGHT_CARRIER': return 'Transportadora';
      case 'OTHER': return 'Outro';
      // Tipos de currais
      case 'FATTENING': return 'Engorda';
      case 'QUARANTINE': return 'Quarentena';
      case 'RECEPTION': return 'Recepção';
      case 'HOSPITAL': return 'Hospital';
      // Status de currais
      case 'AVAILABLE': return 'Disponível';
      case 'OCCUPIED': return 'Ocupado';
      case 'MAINTENANCE': return 'Manutenção';
      // Tipos de contas
      case 'SAVINGS': return 'Poupança';
      case 'CHECKING': return 'Corrente';
      // Status gerais
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      default: return type || 'Item';
    }
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'SELLER': return 'border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-transparent';
      case 'VENDOR': return 'border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-transparent';
      case 'BROKER': return 'border border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-transparent';
      case 'BUYER': return 'border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-transparent';
      case 'INVESTOR': return 'border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 bg-transparent';
      case 'SERVICE_PROVIDER': return 'border border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400 bg-transparent';
      case 'FREIGHT_CARRIER': return 'border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-transparent';
      case 'OTHER': return 'border border-slate-600 text-slate-600 dark:border-slate-400 dark:text-slate-400 bg-transparent';
      // Tipos de currais
      case 'FATTENING': return 'border border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 bg-transparent';
      case 'QUARANTINE': return 'border border-yellow-600 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400 bg-transparent';
      case 'RECEPTION': return 'border border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 bg-transparent';
      case 'HOSPITAL': return 'border border-red-600 text-red-600 dark:border-red-400 dark:text-red-400 bg-transparent';
      // Status de currais
      case 'AVAILABLE': return 'border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-transparent';
      case 'OCCUPIED': return 'border border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400 bg-transparent';
      case 'MAINTENANCE': return 'border border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400 bg-transparent';
      // Tipos de contas
      case 'SAVINGS': return 'border border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 bg-transparent';
      case 'CHECKING': return 'border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-transparent';
      // Status gerais
      case 'ACTIVE': return 'border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-transparent';
      case 'INACTIVE': return 'border border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400 bg-transparent';
      default: return 'border border-slate-600 text-slate-600 dark:border-slate-400 dark:text-slate-400 bg-transparent';
    }
  };

  const getPartnerIcon = (type: string) => {
    switch (type) {
      // Tipos de parceiros
      case 'SELLER': return <Users className="h-3 w-3" />;
      case 'VENDOR': return <Users className="h-3 w-3" />;
      case 'BROKER': return <Building className="h-3 w-3" />;
      case 'BUYER': return <ShoppingCart className="h-3 w-3" />;
      case 'INVESTOR': return <DollarSign className="h-3 w-3" />;
      case 'SERVICE_PROVIDER': return <Wrench className="h-3 w-3" />;
      case 'FREIGHT_CARRIER': return <Truck className="h-3 w-3" />;
      case 'OTHER': return <Package className="h-3 w-3" />;
      // Tipos de currais
      case 'FATTENING': return <Home className="h-3 w-3" />;
      case 'QUARANTINE': return <Shield className="h-3 w-3" />;
      case 'RECEPTION': return <LogIn className="h-3 w-3" />;
      case 'HOSPITAL': return <Plus className="h-3 w-3" />;
      // Status de currais
      case 'AVAILABLE': return <CheckCircle className="h-3 w-3" />;
      case 'OCCUPIED': return <Clock className="h-3 w-3" />;
      case 'MAINTENANCE': return <Settings className="h-3 w-3" />;
      // Tipos de contas
      case 'SAVINGS': return <Wallet className="h-3 w-3" />;
      case 'CHECKING': return <CreditCard className="h-3 w-3" />;
      // Status gerais
      case 'ACTIVE': return <Activity className="h-3 w-3" />;
      case 'INACTIVE': return <XCircle className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow group">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={item.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {item.name ? item.name.slice(0, 2).toUpperCase() :
                 item.penNumber ? item.penNumber.slice(-2) :
                 item.accountName ? item.accountName.slice(0, 2).toUpperCase() : 'IT'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm truncate">
                {item.name || item.penNumber || item.accountName || 'Item'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground truncate">
                {item.cpfCnpj ? `${item.cpfCnpj}` :
                 item.location ? `${item.location} • Cap: ${item.capacity || 0}` :
                 item.bankName ? `${item.bankName} • ${item.accountNumber || 'N/A'}` :
                 item.description || 'N/A'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge className={`text-[10px] px-1.5 py-0.5 ${getPartnerTypeColor(item.type || item.accountType || item.status || 'default')}`}>
              {getPartnerTypeLabel(item.type || item.accountType || item.status || 'default')}
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
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => onView(item)} className="text-xs">
                  <Eye className="mr-1.5 h-3 w-3" />
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

      <CardContent className="p-3 pt-1 space-y-1.5">
        {/* Informações de contato */}
        <div className="space-y-1">
          {item.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{item.phone}</span>
            </div>
          )}
          {item.address && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{item.address}</span>
            </div>
          )}
          {item.capacity && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Home className="h-3 w-3 flex-shrink-0" />
              <span>Capacidade: {item.capacity} animais</span>
            </div>
          )}
          {item.bankName && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span>{item.bankName} - {item.accountNumber}</span>
            </div>
          )}
        </div>

        {/* Status e métricas */}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t">
          <div className="flex items-center gap-1">
            {item.isActive ? (
              <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {item.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="text-[10px] text-muted-foreground">
            Desde {(() => {
              try {
                if (!item.createdAt) return 'Data não informada';
                return formatBrazilianDate(item.createdAt, 'dd/MM/yyyy');
              } catch (err) {
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
      default: return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.type || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">CPF/CNPJ</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.cpfCnpj || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Telefone</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Endereço</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.address || 'N/A'}</p>
              </div>

            </>
          )}
          
          {type === 'pens' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Número</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.penNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Capacidade</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.capacity || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Localização</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.location || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</Label>
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
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome da Conta</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.accountName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Banco</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.bankName || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Agência</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.agency || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Conta</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.accountNumber || 'N/A'}</p>
                </div>
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
      case 'categories': return 'categoria';
      default: return 'item';
    }
  };

  const getItemName = (item: any, type: string) => {
    switch (type) {
      case 'partners': return item.name;
      case 'pens': return `Curral ${item.penNumber}`;
      case 'accounts': return item.accountName;
      case 'categories': return item.name;
      default: return 'Item';
    }
  };

  const getWarningMessage = (type: string) => {
    switch (type) {
      case 'partners':
      {
        return 'Esta ação removerá o parceiro e pode afetar pedidos de compra e vendas associadas.';
      case 'pens':
      {
        return 'Esta ação removerá o curral e pode afetar lotes que estão alocados neste curral.';
      case 'accounts':
      {
        return 'Esta ação removerá a conta pagadora e pode afetar transações financeiras associadas.';
      case 'categories':
      {
        return 'Esta ação removerá a categoria permanentemente. Certifique-se de que não há movimentações financeiras usando esta categoria.';
      default:
        return 'Esta ação não pode ser desfeita.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este {getTypeLabel(type)}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do item */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                {type === 'partners' && <Users className="h-4 w-4 text-destructive" />}
                {type === 'pens' && <Home className="h-4 w-4 text-destructive" />}
                {type === 'accounts' && <CreditCard className="h-4 w-4 text-destructive" />}
                {type === 'categories' && <Tags className="h-4 w-4 text-destructive" />}
              </div>
              <div>
                <p className="text-sm-sm font-medium">{getItemName(item, type)}</p>
                <p className="text-xs text-muted-foreground">
                  {type === 'partners' && item.type}
                  {type === 'pens' && `Capacidade: ${item.capacity}`}
                  {type === 'accounts' && item.bankName}
                  {type === 'categories' && `Tipo: ${item.type === 'EXPENSE' ? 'Despesa' : 'Receita'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Atenção</p>
                <p className="text-sm-sm text-muted-foreground mt-1">
                  {getWarningMessage(type)}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmação */}
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do parceiro"
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="text-sm">
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">CPF/CNPJ</Label>
          <Input
            value={formatCpfCnpj(formData.cpfCnpj || '')}
            onChange={(e) => {
              const formatted = formatCpfCnpj(e.target.value);
              setFormData({ ...formData, cpfCnpj: formatted });
            }}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            className="text-sm"
            maxLength={18}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="email@exemplo.com"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Endereço</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Endereço completo"
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações adicionais..."
          className="text-sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Parceiro ativo</Label>
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
    capacity: '150', // Capacidade padrão de 150 animais
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Número do Curral *</Label>
          <Input
            value={formData.penNumber}
            onChange={(e) => setFormData({ ...formData, penNumber: e.target.value })}
            placeholder="001"
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Capacidade *</Label>
          <Input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="150"
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Localização</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Setor A - Galpão 1"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo</Label>
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</Label>
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
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ativo</Label>
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome da Conta *</Label>
          <Input
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            placeholder="Conta Principal"
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Banco *</Label>
          <Input
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="Banco do Brasil"
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Agência *</Label>
          <Input
            value={formData.agency}
            onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            placeholder="1234-5"
            required
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Número da Conta *</Label>
          <Input
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="12345-6"
            required
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo de Conta *</Label>
          <Select value={formData.accountType} onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
            <SelectTrigger className="text-sm">
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
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Saldo Inicial</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.balance || 0}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ativo</Label>
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
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome do Ciclo *</Label>
        <Input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ciclo 2024/1"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Status *</Label>
        <Select value={formData.status || 'PLANNED'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger className="text-sm">
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
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Descrição</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do ciclo..."
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Data de Início</Label>
          <Input
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Data de Fim</Label>
          <Input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Orçamento</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.budget || 0}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Número de Animais</Label>
          <Input
            type="number"
            value={formData.targetAnimals || 0}
            onChange={(e) => setFormData({ ...formData, targetAnimals: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ativo</Label>
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

// Formulário de Categoria
const CategoryForm: React.FC<{ 
  category?: Category; 
  onSave: (data: any) => void; 
  onCancel: () => void 
}> = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState(category || {
    name: '',
    type: 'EXPENSE',
    color: '#3B82F6'
  });

  const presetColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#475569', '#1E293B'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome da Categoria *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Alimentação Animal"
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Despesa</span>
              </div>
            </SelectItem>
            <SelectItem value="INCOME">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Receita</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cor</Label>
        <div className="grid grid-cols-10 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`h-8 w-full rounded-md border-2 transition-all hover:scale-110 ${
                formData.color === color ? 'border-gray-800 dark:border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-8 w-20"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {category ? 'Atualizar' : 'Criar'} Categoria
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
  
  // Estado para categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Carregar categorias
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const allCategories = await categoryAPI.getAll();
      setCategories(allCategories);
    } catch (_error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as categorias',
        variant: 'destructive'
      });
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  const createCategory = async (data: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoryAPI.create(data);
      await loadCategories();
      toast({
        title: 'Categoria criada',
        description: 'Categoria criada com sucesso',
      });
      return newCategory;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível criar a categoria';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  };
  
  const updateCategory = async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    try {
      await categoryAPI.update(id, data);
      await loadCategories();
      toast({
        title: 'Categoria atualizada',
        description: 'Categoria atualizada com sucesso',
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível atualizar a categoria';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  };
  
  const deleteCategory = async (id: string) => {
    try {
      await categoryAPI.delete(id);
      await loadCategories();
      toast({
        title: 'Categoria excluída',
        description: 'Categoria excluída com sucesso',
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      const errorMessage = error.response?.data?.error || 'Não foi possível excluir a categoria. Verifique se não há movimentações usando esta categoria.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  };
  
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
      {
        data = partners || [];
        }
      break;
      case 'pens':
      {
        data = pens || [];
        }
      break;
      case 'accounts':
      {
        data = payerAccounts || [];
        }
      break;
      case 'categories':
      {
        data = categories || [];
        }
      break;
      default:
        data = [];
    }

    return data.filter(item => {
      // Busca adaptada para cada tipo de dado
      let searchText = '';
      switch (activeTab) {
        case 'partners':
      {
          searchText = `${item.name || ''} ${item.cpfCnpj || ''} ${item.email || ''}`.toLowerCase();
          }
      break;
        case 'pens':
      {
          searchText = `${item.penNumber || ''} ${item.location || ''}`.toLowerCase();
          }
      break;
        case 'accounts':
      {
          searchText = `${item.accountName || ''} ${item.bankName || ''} ${item.accountNumber || ''}`.toLowerCase();
          }
      break;
        case 'categories':
      {
          searchText = `${item.name || ''}`.toLowerCase();
          }
      break;
        default:
          searchText = ''
      }
      
      const matchesSearch = searchTerm === '' || searchText.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter || 
                         (activeTab === 'categories' && (typeFilter === 'all' || 
                         (typeFilter === 'INCOME' && item.type === 'INCOME') ||
                         (typeFilter === 'EXPENSE' && item.type === 'EXPENSE')));
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && (item.isActive !== false)) ||
                           (statusFilter === 'inactive' && item.isActive === false);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [activeTab, partners, pens, payerAccounts, categories, searchTerm, typeFilter, statusFilter]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const partnersArray = Array.isArray(partners) ? partners : [];
    const activePartners = partnersArray.filter(p => p.isActive).length;
    
    const pensArray = Array.isArray(pens) ? pens : [];
    const totalPens = pensArray.length;
    const activePens = pensArray.filter(p => p.isActive).length;
    
    const accountsArray = Array.isArray(payerAccounts) ? payerAccounts : [];
    const totalAccounts = accountsArray.length;
    return {
      totalPartners: partners?.length || 0,
      activePartners,
      totalPens,
      activePens,
      totalAccounts,
      penOccupancy: totalPens > 0 ? (activePens / totalPens) * 100 : 0
    };
  }, [partners, pens, payerAccounts]);

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
      let itemName = '';
      switch (activeTab) {
        case 'partners':
      {
          await deletePartner(itemToDelete.id);
          itemName = 'Parceiro';
          }
      break;
        case 'pens':
      {
          await deletePen(itemToDelete.id);
          itemName = 'Curral';
          }
      break;
        case 'accounts':
      {
          await deletePayerAccount(itemToDelete.id);
          itemName = 'Conta';
          }
      break;
        case 'categories':
      {
          const deleted = deleteCategory(itemToDelete.id);
          if (deleted) {
            itemName = 'Categoria';
          }
          }
      break;
        default:
      }

      // Não mostrar notificação para categorias pois já é mostrada na função deleteCategory
      if (itemName && activeTab !== 'categories') {
        toast({
          title: 'Exclusão realizada',
          description: `${itemName} excluído com sucesso`,
        });
      }

      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (_error) {
      console.error('Erro ao excluir item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o item. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleFormSave = async (data: any) => {
    try {
      let itemName = '';
      let isUpdate = false;

      switch (activeTab) {
        case 'partners':
      {
          if (editingItem) {
            await updatePartner(editingItem.id, data);
            isUpdate = true;
          } else {
            await createPartner(data);
          }
          itemName = 'Parceiro';
          }
      break;
        case 'pens':
      {
          if (editingItem) {
            await updatePen(editingItem.id, data);
            isUpdate = true;
          } else {
            await createPen(data);
          }
          itemName = 'Curral';
          }
      break;
        case 'accounts':
      {
          if (editingItem) {
            await updatePayerAccount(editingItem.id, data);
            isUpdate = true;
          } else {
            await createPayerAccount(data);
          }
          itemName = 'Conta';
          }
      break;
        case 'categories':
      {
          if (editingItem) {
            const updated = updateCategory(editingItem.id, data);
            if (updated) {
              isUpdate = true;
              itemName = 'Categoria';
            }
          } else {
            const created = createCategory(data);
            if (created) {
              itemName = 'Categoria';
            }
          }
          }
      break;
        default:
      }

      // Não mostrar notificação para categorias pois já é mostrada nas funções específicas
      if (itemName && activeTab !== 'categories') {
        toast({
          title: isUpdate ? 'Atualização realizada' : 'Cadastro realizado',
          description: `${itemName} ${isUpdate ? 'atualizado' : 'cadastrado'} com sucesso`,
        });
      }

      setShowForm(false);
      setEditingItem(null);
    } catch (_error) {
      console.error('Erro ao salvar item:', error);
      // Não mostrar notificação de erro para categorias pois já é mostrada nas funções específicas
      if (activeTab !== 'categories') {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar as informações. Tente novamente.',
          variant: 'destructive'
        });
      }
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
      {
        return partners?.length || 0;
      case 'pens':
      {
        return pens?.length || 0;
      case 'accounts':
      {
        return payerAccounts?.length || 0;
      case 'categories':
      {
        return categories?.length || 0;
      case 'properties':
      {
        return 0; // Ainda não implementado
      default:
        return 0;
    }
  };

  const isLoading = partnersLoading || pensLoading || accountsLoading || categoriesLoading;

  // DEBUG - Removido para mostrar a página normal
  // Descomente se precisar debugar novamente
  /*
  if (false) { 
    // const DebugRegistrations = React.lazy(() => import('./DebugRegistrations').then(module => ({ default: module.DebugRegistrations })));
    return (
      <React.Suspense fallback={<div>Carregando debug...</div>}>
        <div className="space-y-4">
          // <DebugRegistrations />
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
            <h1 className="text-xl font-bold text-foreground">Cadastros do Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie parceiros, currais, contas e todos os cadastros do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cadastro
            </Button>
          </div>
        </div>

        {/* Cards de Navegação */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {registrationTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeTab === type.id;

            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md dark:hover:shadow-lg ${
                  isActive ? 'ring-2 ring-primary border-primary dark:ring-primary/50' : 'hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveTab(type.id)}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${type.color}`} />
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {getItemCount(type.id)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <h3 className="text-sm font-medium text-card-foreground">{type.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
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
              
              {activeTab === 'categories' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="EXPENSE">Despesas</SelectItem>
                    <SelectItem value="INCOME">Receitas</SelectItem>
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
            {/* Estatísticas de Currais por Linha */}
            {filteredData.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Distribuição por Linha</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {(() => {
                      // Agrupar currais por localização (linha)
                      const pensByLocation = filteredData.reduce((acc: any, pen: any) => {
                        const location = pen.location || 'Sem localização';
                        if (!acc[location]) {
                          acc[location] = [];
                        }
                        acc[location].push(pen.penNumber);
                        return acc;
                      }, {});

                      // Ordenar as linhas alfabeticamente
                      const sortedLocations = Object.keys(pensByLocation).sort();

                      return sortedLocations.map((location, index) => (
                        <div key={`${location}-${index}`} className="flex flex-col space-y-1.5 p-2.5 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-xs truncate" title={location}>{location}</span>
                            <Badge key={`badge-${location}-${index}`} variant="secondary" className="text-[10px] px-1 py-0">
                              {pensByLocation[location].length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-0.5">
                            {pensByLocation[location].sort().slice(0, 3).map((pen: string, penIndex: number) => (
                              <Badge key={`${pen}-${penIndex}`} variant="outline" className="text-[10px] px-1 py-0">
                                {pen}
                              </Badge>
                            ))}
                            {pensByLocation[location].length > 3 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                +{pensByLocation[location].length - 3}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Cap: {pensByLocation[location].length * 150}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Geral: {filteredData.length} currais
                      </span>
                      <span className="text-sm font-medium">
                        Capacidade Total: {filteredData.length * 150} animais
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

          <TabsContent value="categories" className="space-y-4">
            <CategoryCostCenterManager />
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Propriedades Rurais
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            
            {activeTab === 'categories' && (
              <CategoryForm
                category={editingItem}
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

export default CompleteRegistrations;
