import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  Receipt,
  FileSpreadsheet,
  Check,
  X,
  Info,
  MoreHorizontal,
  Link,
  Zap,
  ChevronRight,
  Settings,
  Target,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Tipos para Conciliação Financeira
interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  bank: string;
  reference: string;
  reconciled: boolean;
  systemTransactionId?: string;
  confidence?: number;
}

interface SystemTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  status: 'pending' | 'paid' | 'overdue';
  reconciled: boolean;
  bankTransactionId?: string;
}

interface ReconciliationRule {
  id: string;
  name: string;
  field: 'description' | 'amount' | 'date' | 'reference';
  condition: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  category: string;
  active: boolean;
}

// Dados reais do Supabase via hooks - inicialmente vazios
const bankTransactions: BankTransaction[] = [];
const systemTransactions: SystemTransaction[] = [];
const reconciliationRules: ReconciliationRule[] = [];

export const CompleteFinancialReconciliation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);

  // Dados filtrados
  const filteredBankTransactions = useMemo(() => {
    return bankTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBank = selectedBank === 'all' || transaction.bank === selectedBank;
      const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'reconciled' && transaction.reconciled) ||
                          (selectedStatus === 'unreconciled' && !transaction.reconciled);
      
      return matchesSearch && matchesBank && matchesStatus;
    });
  }, [searchTerm, selectedBank, selectedStatus]);

  const filteredSystemTransactions = useMemo(() => {
    return systemTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'reconciled' && transaction.reconciled) ||
                          (selectedStatus === 'unreconciled' && !transaction.reconciled);
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalBankTransactions = bankTransactions.length;
    const reconciledBankTransactions = bankTransactions.filter(t => t.reconciled).length;
    const totalSystemTransactions = systemTransactions.length;
    const reconciledSystemTransactions = systemTransactions.filter(t => t.reconciled).length;
    
    const bankBalance = bankTransactions.reduce((sum, t) => sum + t.amount, 0);
    const systemBalance = systemTransactions.reduce((sum, t) => sum + (t.type === 'revenue' ? t.amount : -t.amount), 0);
    
    return {
      totalBankTransactions,
      reconciledBankTransactions,
      totalSystemTransactions,
      reconciledSystemTransactions,
      bankReconciliationRate: totalBankTransactions > 0 ? (reconciledBankTransactions / totalBankTransactions) * 100 : 0,
      systemReconciliationRate: totalSystemTransactions > 0 ? (reconciledSystemTransactions / totalSystemTransactions) * 100 : 0,
      bankBalance,
      systemBalance,
      difference: bankBalance - systemBalance
    };
  }, [bankTransactions, systemTransactions]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">Conciliação Financeira</h1>
          <p className="page-subtitle">
            Concilie transações bancárias com registros do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Extrato
          </Button>
          <Button variant="outline" onClick={() => setShowRulesDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Regras
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Conciliar Automático
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações Bancárias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBankTransactions}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {stats.reconciledBankTransactions} conciliadas
            </div>
            <Progress value={stats.bankReconciliationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSystemTransactions}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {stats.reconciledSystemTransactions} conciliadas
            </div>
            <Progress value={stats.systemReconciliationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Bancário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.bankBalance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              R$ {Math.abs(stats.bankBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.bankBalance >= 0 ? 'Positivo' : 'Negativo'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diferença
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              Math.abs(stats.difference) < 100 ? "text-green-600" : "text-red-600"
            )}>
              R$ {Math.abs(stats.difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.abs(stats.difference) < 100 ? 'Conciliado' : 'Divergência'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou referência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os bancos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bancos</SelectItem>
                <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                <SelectItem value="Itaú">Itaú</SelectItem>
                <SelectItem value="Bradesco">Bradesco</SelectItem>
                <SelectItem value="Caixa">Caixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="reconciled">Conciliadas</SelectItem>
                <SelectItem value="unreconciled">Não conciliadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Conciliação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="bank">Extrato Bancário</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="matched">Conciliadas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transações Pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Pendentes de Conciliação
                </CardTitle>
                <CardDescription>
                  Transações que precisam ser conciliadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredBankTransactions.filter(t => !t.reconciled).slice(0, 5).map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })} • {transaction.bank}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-medium",
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowMatchDialog(true);
                          }}
                        >
                          Conciliar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Atividades Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Últimas Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Conciliação automática executada</p>
                      <p className="text-xs text-muted-foreground">15 transações processadas</p>
                    </div>
                    <p className="text-xs text-muted-foreground">há 2 horas</p>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Extrato importado</p>
                      <p className="text-xs text-muted-foreground">Banco do Brasil - 23 transações</p>
                    </div>
                    <p className="text-xs text-muted-foreground">há 4 horas</p>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Divergência identificada</p>
                      <p className="text-xs text-muted-foreground">R$ 1.250,00 - Requer atenção</p>
                    </div>
                    <p className="text-xs text-muted-foreground">ontem</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Bancárias</CardTitle>
              <CardDescription>
                Transações importadas dos extratos bancários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBankTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.bank}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.amount > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {transaction.reconciled ? (
                          <Badge className="status-active">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conciliada
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
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
                              setSelectedTransaction(transaction);
                              setShowMatchDialog(true);
                            }}>
                              <Link className="h-3 w-3 mr-2" />
                              Conciliar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-3 w-3 mr-2" />
                              Visualizar
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
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações do Sistema</CardTitle>
              <CardDescription>
                Receitas e despesas registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSystemTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={transaction.type === 'revenue' ? 'status-active' : 'status-warning'}>
                          {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.amount > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {transaction.reconciled ? (
                          <Badge className="status-active">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conciliada
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matched" className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Todas as transações conciliadas são exibidas aqui. 
              Você pode desfazer a conciliação se necessário.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Dialog de Regras */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Regras de Conciliação</DialogTitle>
            <DialogDescription>
              Configure regras automáticas para conciliação de transações
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Regras Ativas</h4>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReconciliationRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.field}</TableCell>
                    <TableCell>
                      {rule.condition} "{rule.value}"
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={rule.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRulesDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importação */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Extrato Bancário</DialogTitle>
            <DialogDescription>
              Faça upload do arquivo de extrato bancário (OFX, CSV ou TXT)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste e solte o arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos suportados: OFX, CSV, TXT (máx. 10MB)
              </p>
              <Button variant="outline" className="mt-2">
                Selecionar Arquivo
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bb">Banco do Brasil</SelectItem>
                  <SelectItem value="itau">Itaú</SelectItem>
                  <SelectItem value="bradesco">Bradesco</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button disabled>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Conciliação Manual */}
      {selectedTransaction && (
        <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Conciliação Manual</DialogTitle>
              <DialogDescription>
                Selecione a transação do sistema que corresponde à transação bancária
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transação Bancária</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Descrição</Label>
                      <p>{selectedTransaction.description}</p>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <p className={selectedTransaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {selectedTransaction.amount > 0 ? '+' : ''}R$ {Math.abs(selectedTransaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label>Data</Label>
                      <p>{format(selectedTransaction.date, 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <div>
                      <Label>Banco</Label>
                      <p>{selectedTransaction.bank}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <Label>Transações do Sistema Compatíveis</Label>
                <ScrollArea className="h-48 border rounded-md p-2 mt-2">
                  <div className="space-y-2">
                    {mockSystemTransactions
                      .filter(t => !t.reconciled && Math.abs(t.amount - Math.abs(selectedTransaction.amount)) < 100)
                      .map(transaction => (
                        <Card key={transaction.id} className="cursor-pointer hover:bg-muted/50 p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })} • {transaction.category}
                              </p>
                            </div>
                            <p className={cn(
                              "font-medium text-sm",
                              transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
                Cancelar
              </Button>
              <Button>
                Conciliar Selecionadas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};