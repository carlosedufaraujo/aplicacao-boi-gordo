import React, { useState, useMemo, useEffect } from 'react';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { useExpensesApi } from '@/hooks/api/useExpensesApi';
import { useRevenuesApi } from '@/hooks/api/useRevenuesApi';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { toast } from 'sonner';
import { eventBus, EVENTS } from '@/utils/eventBus';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Wallet,
  PiggyBank,
  Building2,
  Receipt,
  FileText,
  FileDown,
  Calculator,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Zap,
  Users,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatSafeDate, formatSafeDateTime, toSafeDate, formatSafeCurrency, formatSafeDecimal, toSafeNumber } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatters';

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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
// Sheet components removidos - não disponíveis no Radix UI

// Hooks já importados no topo do arquivo

// Tipos
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  balance: number;
  institution: string;
  color: string;
  isActive: boolean;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  accountId: string;
  date: Date;
  dueDate?: Date;
  status: 'paid' | 'pending' | 'overdue';
  costCenter?: string;
  tags?: string[];
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CostCenter {
  id: string;
  name: string;
  type: 'acquisition' | 'fattening' | 'administrative' | 'financial';
  description?: string;
  budget?: number;
  allocated: number;
  percentage: number;
  isActive: boolean;
}

// Dados reais do Supabase via hooks

// Componente de Formulário de Conta
const AccountForm: React.FC<{
  account?: Account | null;
  onSave: (accountData: any) => void;
  onCancel: () => void;
}> = ({ account, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    institution: account?.institution || '',
    type: account?.type || 'checking',
    balance: account?.balance || 0,
    isActive: account?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Conta *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Conta Corrente Principal"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="institution">Instituição</Label>
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            placeholder="Ex: Banco do Brasil"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Conta</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Conta Corrente</SelectItem>
              <SelectItem value="savings">Poupança</SelectItem>
              <SelectItem value="investment">Investimento</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="credit">Cartão de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="balance">Saldo Inicial (R$)</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Conta ativa</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {account ? 'Atualizar' : 'Criar'} Conta
        </Button>
      </DialogFooter>
    </form>
  );
};

// Componente de Card de Conta
const AccountCard: React.FC<{ 
  account: Account; 
  onEdit: (account: Account) => void; 
  onView: (account: Account) => void;
  onDelete: (account: Account) => void;
}> = ({ account, onEdit, onView, onDelete }) => {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <CreditCard className="h-4 w-4" />;
      case 'savings': return <PiggyBank className="h-4 w-4" />;
      case 'investment': return <TrendingUp className="h-4 w-4" />;
      case 'credit': return <Wallet className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'Conta Corrente';
      case 'savings': return 'Poupança';
      case 'investment': return 'Investimento';
      case 'credit': return 'Cartão de Crédito';
      default: return type;
    }
  };

  const isNegative = account.balance < 0;

  return (
    <Card className="hover-lift animate-scale-in group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${account.color} rounded-lg text-white`}>
              {getAccountIcon(account.type)}
            </div>
            <div>
              <CardTitle className="card-title">{account.name}</CardTitle>
              <CardDescription className="card-subtitle">
                {account.institution} • {getAccountTypeLabel(account.type)}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent hover:scale-110"

              >
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(account)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(account)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Saldo */}
        <div className="text-center">
          <p className="kpi-label">Saldo Atual</p>
          <p className={`text-2xl font-bold ${isNegative ? 'text-error' : 'text-success'}`}>
            {formatSafeCurrency(account.balance)}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center">
          <Badge className={account.isActive ? 'status-active' : 'status-inactive'}>
            {account.isActive ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {account.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={() => onView(account)}>
            <Eye className="h-3 w-3 mr-1" />
            Extrato
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Sincronizar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Componente de Card de Transação
const TransactionCard: React.FC<{ 
  transaction: Transaction; 
  accounts: Account[];
  onEdit: (transaction: Transaction) => void; 
  onView: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}> = ({ transaction, accounts, onEdit, onView, onDelete }) => {
  const account = accounts.find(a => a.id === transaction.accountId);
  const isRevenue = transaction.type === 'revenue';
  const isOverdue = transaction.status === 'overdue';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'status-active';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-error';
      default: return 'status-inactive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'overdue': return <AlertCircle className="h-3 w-3" />;
      default: return <XCircle className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover-lift animate-scale-in group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="card-title flex items-center gap-2">
              {isRevenue ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-error" />
              )}
              {transaction.description}
            </CardTitle>
            <CardDescription className="card-subtitle">
              {account?.name} • {formatSafeDate(transaction.date, 'dd/MM/yyyy')}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(transaction.status)}>
              {getStatusIcon(transaction.status)}
              <span className="ml-1 capitalize">{transaction.status}</span>
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(transaction)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(transaction.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Valor */}
        <div className="text-center">
          <p className={`text-xl font-bold ${isRevenue ? 'text-success' : 'text-error'}`}>
            {formatSafeCurrency(isRevenue ? transaction.amount : -transaction.amount)}
          </p>
        </div>

        {/* Informações adicionais */}
        <div className="space-y-2 text-sm">
          {transaction.category && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <Badge variant="outline">{transaction.category}</Badge>
            </div>
          )}
          
          {transaction.costCenter && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Centro de Custo:</span>
              <Badge variant="outline">{transaction.costCenter}</Badge>
            </div>
          )}
          
          {transaction.dueDate && transaction.status !== 'paid' && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vencimento:</span>
              <span className={isOverdue ? 'text-error font-medium' : ''}>
                {formatSafeDate(transaction.dueDate, 'dd/MM/yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {transaction.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {transaction.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{transaction.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente Principal
export const CompleteFinancialCenter: React.FC = () => {
  const { expenses, loading: expensesLoading, refresh: refreshExpenses } = useExpensesApi();
  const { revenues, loading: revenuesLoading, refresh: refreshRevenues } = useRevenuesApi();
  const { payerAccounts, loading: accountsLoading, deletePayerAccount, createPayerAccount, updatePayerAccount } = usePayerAccountsApi();
  const { generatePDFFromElement, generateReportPDF } = usePDFGenerator();
  
  // Converter PayerAccounts para Accounts
  const accounts: Account[] = useMemo(() => {
    return payerAccounts.map(account => ({
      id: account.id,
      name: account.name || account.accountName || 'Conta sem nome',
      type: account.accountType || account.bankAccountType || 'checking',
      balance: account.balance || 0,
      institution: account.bankName,
      color: 'bg-blue-500', // Cor padrão
      isActive: account.isActive
    }));
  }, [payerAccounts]);
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [showNewTransaction, setShowNewTransaction] = useState(false);

  // Função para gerar PDF do Centro Financeiro
  const handleGenerateFinancialPDF = async () => {
    const result = await generatePDFFromElement('financial-content', {
      filename: `centro-financeiro-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'landscape',
      quality: 2
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // Função para gerar relatório financeiro estruturado
  const handleGenerateFinancialReport = async () => {
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalRevenues = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const reportData = {
      title: 'Relatório Financeiro Consolidado',
      subtitle: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
      data: [
        { categoria: 'RECEITAS', valor: formatSafeCurrency(totalRevenues), tipo: 'Entrada' },
        { categoria: 'DESPESAS', valor: formatSafeCurrency(totalExpenses), tipo: 'Saída' },
        { categoria: 'RESULTADO', valor: formatSafeCurrency(totalRevenues - totalExpenses), tipo: totalRevenues > totalExpenses ? 'Positivo' : 'Negativo' },
        { categoria: 'CONTAS ATIVAS', valor: accounts.filter(a => a.isActive).length.toString(), tipo: 'Quantidade' },
        { categoria: 'TRANSAÇÕES', valor: transactions.length.toString(), tipo: 'Quantidade' }
      ],
      columns: [
        { key: 'categoria', label: 'Categoria', width: 80 },
        { key: 'valor', label: 'Valor', width: 60 },
        { key: 'tipo', label: 'Tipo', width: 40 }
      ],
      summary: {
        'Total de Contas': accounts.length,
        'Saldo Consolidado': formatSafeCurrency(totalRevenues - totalExpenses),
        'Margem': `${formatSafeDecimal(totalRevenues > 0 ? (((totalRevenues - totalExpenses) / totalRevenues) * 100) : 0, 1)}%`
      }
    };

    const result = await generateReportPDF(reportData, {
      filename: `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'a4',
      orientation: 'portrait'
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<Account | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Escutar eventos globais para refresh
  useEffect(() => {
    const handleRefreshFinancial = () => {
      console.log('🔄 Recarregando dados financeiros após exclusão de lote...');
      // Recarregar despesas e receitas
      refreshExpenses();
      refreshRevenues();
    };

    const handleLotDeleted = (data: any) => {
      console.log('🗑️ Lote excluído detectado:', data);
      // Aguardar um pouco para garantir que o backend processou
      setTimeout(() => {
        refreshExpenses();
        refreshRevenues();
      }, 1000);
    };

    const handleLotUpdated = (data: any) => {
      console.log('✏️ Lote atualizado detectado:', data);
      // Aguardar um pouco para garantir que o backend processou
      setTimeout(() => {
        refreshExpenses();
        refreshRevenues();
      }, 1000);
    };

    // Registrar listeners
    const unsubscribeRefresh = eventBus.on(EVENTS.REFRESH_FINANCIAL, handleRefreshFinancial);
    const unsubscribeLotDeleted = eventBus.on(EVENTS.LOT_DELETED, handleLotDeleted);
    const unsubscribeLotUpdated = eventBus.on(EVENTS.LOT_UPDATED, handleLotUpdated);
    const unsubscribeRefreshAll = eventBus.on(EVENTS.REFRESH_ALL, handleRefreshFinancial);

    // Cleanup
    return () => {
      unsubscribeRefresh();
      unsubscribeLotDeleted();
      unsubscribeLotUpdated();
      unsubscribeRefreshAll();
    };
  }, [refreshExpenses, refreshRevenues]);

  // Dados reais do Supabase via hooks
  
  // Converter dados para formato esperado
  const transactions: Transaction[] = useMemo(() => {
    const expenseTransactions = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.totalAmount || 0, // Usar totalAmount do backend
      type: 'expense' as const,
      category: expense.category,
      accountId: expense.payerAccountId || '1',
      date: expense.createdAt || expense.date,
      dueDate: expense.dueDate,
      status: expense.isPaid ? 'paid' : 'pending',
      costCenter: expense.costCenterId || 'general',
      tags: expense.tags || [],
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    }));
    
    const revenueTransactions = revenues.map(revenue => ({
      id: revenue.id,
      description: revenue.description,
      amount: revenue.totalAmount || 0, // Usar totalAmount do backend
      type: 'revenue' as const,
      category: revenue.category,
      accountId: revenue.payerAccountId || '1',
      date: revenue.createdAt || revenue.date,
      status: revenue.isReceived ? 'paid' as const : 'pending' as const,
      costCenter: revenue.costCenterId || 'revenue',
      tags: [],
      createdAt: revenue.createdAt,
      updatedAt: revenue.updatedAt
    }));
    
    return [...expenseTransactions, ...revenueTransactions];
  }, [expenses, revenues]);
  
  // Cost Centers mockados por enquanto
  const costCenters: CostCenter[] = [
    {
      id: '1',
      name: 'Aquisição de Animais',
      type: 'acquisition',
      description: 'Custos relacionados à compra de gado',
      budget: 500000,
      allocated: 420000,
      percentage: 84,
      isActive: true
    },
    {
      id: '2',
      name: 'Engorda e Manejo',
      type: 'fattening',
      description: 'Custos operacionais de engorda',
      budget: 300000,
      allocated: 185000,
      percentage: 61.7,
      isActive: true
    }
  ];

  // Filtros aplicados
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
      
      return matchesSearch && matchesType && matchesStatus && matchesAccount;
    });
  }, [transactions, searchTerm, selectedType, selectedStatus, selectedAccount]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const totalRevenues = transactions
      .filter(t => t.type === 'revenue' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0));
    const netCashFlow = totalRevenues - totalExpenses;
    
    const pendingRevenues = transactions
      .filter(t => t.type === 'revenue' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingExpenses = Math.abs(transactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const overdueTransactions = transactions.filter(t => t.status === 'overdue').length;

    return {
      totalBalance,
      totalRevenues,
      totalExpenses,
      netCashFlow,
      pendingRevenues,
      pendingExpenses,
      overdueTransactions,
      activeAccounts: accounts.filter(a => a.isActive).length
    };
  }, [accounts, transactions]);

  const handleTransactionView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
  };

  const handleTransactionEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowNewTransaction(true);
  };

  const handleTransactionDelete = (transactionId: string) => {
    // Implementar exclusão
    console.log('Excluir transação:', transactionId);
  };

  const handleAccountView = (account: Account) => {
    setSelectedAccountDetail(account);
    setShowAccountDetail(true);
  };

  const handleAccountEdit = (account: Account) => {
    setSelectedAccountDetail(account);
    setShowNewAccount(true);
  };

  const handleAccountDelete = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const confirmAccountDelete = async () => {
    if (accountToDelete) {
      try {
        await deletePayerAccount(accountToDelete.id);
        toast.success(`Conta ${accountToDelete.name} excluída com sucesso!`);
        setShowDeleteConfirm(false);
        setAccountToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        toast.error('Erro ao excluir conta. Tente novamente.');
      }
    }
  };

  const isLoading = expensesLoading || revenuesLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Carregando centro financeiro...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div id="financial-content" className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Centro Financeiro</h1>
            <p className="page-subtitle">
              Gestão completa de contas, transações e fluxo de caixa
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerateFinancialPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF Visual
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateFinancialReport}>
              <FileText className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button size="sm" onClick={() => setShowNewAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
            <Button size="sm" onClick={() => setShowNewTransaction(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Saldo Total</CardTitle>
              <Wallet className="h-4 w-4 icon-primary" />
            </CardHeader>
            <CardContent>
              <div className={`kpi-value ${metrics.totalBalance >= 0 ? 'text-success' : 'text-error'}`}>
                R$ {formatSafeDecimal(Math.abs(toSafeNumber(metrics.totalBalance)) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-muted-foreground">
                {metrics.activeAccounts} contas ativas
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-success">
                R$ {formatSafeDecimal(toSafeNumber(metrics.totalRevenues) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-success">
                <ArrowUpRight className="h-3 w-3 inline mr-1" />
                +12.5% vs anterior
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 icon-error" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-error">
                R$ {formatSafeDecimal(toSafeNumber(metrics.totalExpenses) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-success">
                <ArrowDownRight className="h-3 w-3 inline mr-1" />
                -3.2% vs anterior
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Fluxo Líquido</CardTitle>
              <Activity className="h-4 w-4 icon-info" />
            </CardHeader>
            <CardContent>
              <div className={`kpi-value ${metrics.netCashFlow >= 0 ? 'text-success' : 'text-error'}`}>
                R$ {formatSafeDecimal(Math.abs(toSafeNumber(metrics.netCashFlow)) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-success">
                Fluxo positivo
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">A Receber</CardTitle>
              <Clock className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-info">
                R$ {formatSafeDecimal(toSafeNumber(metrics.pendingRevenues) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-muted-foreground">
                Pendente
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">A Pagar</CardTitle>
              <AlertCircle className="h-4 w-4 icon-warning" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-warning">
                R$ {formatSafeDecimal(toSafeNumber(metrics.pendingExpenses) / 1000, 0)}k
              </div>
              <p className="kpi-variation text-muted-foreground">
                Pendente
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Em Atraso</CardTitle>
              <XCircle className="h-4 w-4 icon-error" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-error">
                {metrics.overdueTransactions}
              </div>
              <p className="kpi-variation text-error">
                Transações
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="kpi-label">Status</CardTitle>
              <Zap className="h-4 w-4 icon-success" />
            </CardHeader>
            <CardContent>
              <div className="kpi-value text-success">Saudável</div>
              <p className="kpi-variation text-success">
                Fluxo controlado
              </p>
            </CardContent>
          </Card>
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
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="revenue">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Visualização */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Contas
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="cost-centers" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Centros de Custo
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fluxo de Caixa */}
              <Card>
                <CardHeader>
                  <CardTitle className="card-title flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Fluxo de Caixa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Receitas</span>
                        <span className="text-success">{formatCurrency(metrics.totalRevenues)}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Despesas</span>
                        <span className="text-error">{formatCurrency(metrics.totalExpenses)}</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Resultado</span>
                      <span className={metrics.netCashFlow >= 0 ? 'text-success' : 'text-error'}>
                        {formatCurrency(Math.abs(metrics.netCashFlow))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Centro de Custo */}
              <Card>
                <CardHeader>
                  <CardTitle className="card-title flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Centros de Custo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {costCenters.map((center) => (
                      <div key={center.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{center.name}</span>
                          <span>{center.percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={center.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transações Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="card-title">Transações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTransactions.slice(0, 5).map((transaction) => {
                    const account = accounts.find(a => a.id === transaction.accountId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${transaction.type === 'revenue' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {transaction.type === 'revenue' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {account?.name} • {formatSafeDate(transaction.date, 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.type === 'revenue' ? 'text-success' : 'text-error'}`}>
                            {formatSafeCurrency(transaction.type === 'revenue' ? transaction.amount : -transaction.amount)}
                          </p>
                          <Badge className={`${transaction.status === 'paid' ? 'status-active' : transaction.status === 'pending' ? 'status-pending' : 'status-error'}`}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contas */}
          <TabsContent value="accounts" className="space-y-4">
            {accounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {accounts.map(account => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    onEdit={handleAccountEdit}
                    onView={handleAccountView}
                    onDelete={handleAccountDelete}
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
                    Adicione uma conta para começar
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transações */}
          <TabsContent value="transactions" className="space-y-4">
            {filteredTransactions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTransactions.map(transaction => (
                  <TransactionCard 
                    key={transaction.id} 
                    transaction={transaction}
                    accounts={accounts}
                    onEdit={handleTransactionEdit}
                    onView={handleTransactionView}
                    onDelete={handleTransactionDelete}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhuma transação encontrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente ajustar os filtros ou criar uma nova transação
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Centros de Custo */}
          <TabsContent value="cost-centers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {costCenters.map((center) => (
                <Card key={center.id} className="hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="card-title flex items-center gap-2">
                      <Target className="h-4 w-4 icon-primary" />
                      {center.name}
                    </CardTitle>
                    <CardDescription className="card-subtitle">
                      {center.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Orçado</span>
                        <span>{formatCurrency(center.budget!)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Alocado</span>
                        <span>{formatCurrency(center.allocated)}</span>
                      </div>
                      <Progress value={center.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {center.percentage.toFixed(1)}% do orçamento
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Relatórios Financeiros
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmAccountDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Conta */}
      <Dialog open={showAccountDetail} onOpenChange={setShowAccountDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Detalhes da Conta
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas da conta selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccountDetail && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nome da Conta</Label>
                  <p className="text-sm font-semibold">{selectedAccountDetail.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Instituição</Label>
                  <p className="text-sm">{selectedAccountDetail.institution || 'Não informado'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Conta</Label>
                  <Badge variant="outline">
                    {selectedAccountDetail.type === 'checking' ? 'Conta Corrente' :
                     selectedAccountDetail.type === 'savings' ? 'Poupança' :
                     selectedAccountDetail.type === 'investment' ? 'Investimento' :
                     selectedAccountDetail.type === 'cash' ? 'Dinheiro' :
                     selectedAccountDetail.type === 'credit' ? 'Cartão de Crédito' : 
                     selectedAccountDetail.type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={selectedAccountDetail.isActive ? 'status-active' : 'status-inactive'}>
                    {selectedAccountDetail.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativa
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Saldo */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Saldo Atual</Label>
                  <p className={`text-3xl font-bold mt-2 ${selectedAccountDetail.balance < 0 ? 'text-error' : 'text-success'}`}>
                    {formatSafeCurrency(selectedAccountDetail.balance)}
                  </p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowAccountDetail(false);
                    setShowNewAccount(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Conta
                </Button>
                <Button variant="outline" className="flex-1">
                  <Receipt className="h-4 w-4 mr-2" />
                  Ver Extrato
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDetail(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição/Nova Conta */}
      <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAccountDetail ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {selectedAccountDetail ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
            <DialogDescription>
              {selectedAccountDetail ? 'Altere as informações da conta abaixo' : 'Preencha as informações da nova conta'}
            </DialogDescription>
          </DialogHeader>
          
          <AccountForm 
            account={selectedAccountDetail}
            onSave={async (accountData) => {
              try {
                if (selectedAccountDetail) {
                  // Atualizar conta existente
                  await updatePayerAccount(selectedAccountDetail.id, {
                    accountName: accountData.name,
                    bankName: accountData.institution,
                    accountType: accountData.type,
                    balance: accountData.balance,
                    isActive: accountData.isActive
                  });
                  toast.success('Conta atualizada com sucesso!');
                } else {
                  // Criar nova conta
                  await createPayerAccount({
                    accountName: accountData.name,
                    bankName: accountData.institution,
                    accountType: accountData.type,
                    balance: accountData.balance,
                    isActive: accountData.isActive
                  });
                  toast.success('Conta criada com sucesso!');
                }
                setShowNewAccount(false);
                setSelectedAccountDetail(null);
              } catch (error) {
                console.error('Erro ao salvar conta:', error);
                toast.error('Erro ao salvar conta. Tente novamente.');
              }
            }}
            onCancel={() => {
              setShowNewAccount(false);
              setSelectedAccountDetail(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
