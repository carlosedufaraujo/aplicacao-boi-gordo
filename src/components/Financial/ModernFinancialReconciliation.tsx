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
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Calendar as CalendarIcon,
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
  GitBranch,
  Link,
  Unlink,
  Calculator,
  Zap,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  reconciled: boolean;
  matchedTransaction?: SystemTransaction;
  bank: string;
  reference?: string;
}

interface SystemTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  account: string;
  reconciled: boolean;
  matchedBankTransaction?: BankTransaction;
  reference?: string;
  tags?: string[];
}

interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  field: 'description' | 'amount' | 'reference';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
  value: string;
  category: string;
  active: boolean;
}

export const ModernFinancialReconciliation: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedBank, setSelectedBank] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [reconciliationMode, setReconciliationMode] = useState<'manual' | 'auto'>('manual');
  const [customDateRange, setCustomDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Dados reais do Supabase - inicialmente vazios, serão carregados via hooks
  const bankTransactions: BankTransaction[] = [];
  const systemTransactions: SystemTransaction[] = [];

  const reconciliationRules: ReconciliationRule[] = [
    {
      id: '1',
      name: 'Vendas Frigoríficos',
      description: 'Identifica vendas de gado para frigoríficos',
      field: 'description',
      operator: 'contains',
      value: 'FRIGORIFICO',
      category: 'Vendas',
      active: true
    },
    {
      id: '2',
      name: 'Pagamentos Veterinária',
      description: 'Identifica pagamentos para clínicas veterinárias',
      field: 'description',
      operator: 'contains',
      value: 'VETERINARIA',
      category: 'Veterinária',
      active: true
    },
    {
      id: '3',
      name: 'Transferências JBS',
      description: 'Identifica transferências da JBS',
      field: 'description',
      operator: 'contains',
      value: 'JBS',
      category: 'Vendas',
      active: true
    }
  ];

  // Estatísticas
  const stats = useMemo(() => {
    const totalBank = bankTransactions.reduce((sum, t) => 
      sum + (t.type === 'credit' ? t.amount : -t.amount), 0
    );
    const totalSystem = systemTransactions.reduce((sum, t) => 
      sum + (t.type === 'revenue' ? t.amount : -t.amount), 0
    );
    const reconciledBank = bankTransactions.filter(t => t.reconciled).length;
    const reconciledSystem = systemTransactions.filter(t => t.reconciled).length;
    
    return {
      bankBalance: totalBank,
      systemBalance: totalSystem,
      difference: Math.abs(totalBank - totalSystem),
      reconciledPercentage: (reconciledBank / bankTransactions.length) * 100,
      pendingTransactions: bankTransactions.filter(t => !t.reconciled).length,
      totalTransactions: bankTransactions.length
    };
  }, []);

  // Filtrar transações
  const filteredBankTransactions = useMemo(() => {
    return bankTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBank = selectedBank === 'all' || transaction.bank === selectedBank;
      return matchesSearch && matchesBank;
    });
  }, [searchTerm, selectedBank]);

  const filteredSystemTransactions = useMemo(() => {
    return systemTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm]);

  // Auto reconciliação
  const handleAutoReconciliation = () => {
    // Implementar lógica de reconciliação automática
    console.log('Executando reconciliação automática...');
  };

  // Reconciliar manualmente
  const handleManualReconciliation = (bankId: string, systemId: string) => {
    // Implementar lógica de reconciliação manual
    console.log(`Reconciliando ${bankId} com ${systemId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Conciliação Financeira</h1>
          <p className="text-muted-foreground">Reconcilie transações bancárias com o sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowRulesDialog(true)}>
            <GitBranch className="mr-2 h-4 w-4" />
            Regras
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Extrato Bancário</DialogTitle>
                <DialogDescription>
                  Importe arquivos OFX, CSV ou conecte-se ao banco
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                      <SelectItem value="santander">Santander</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato do Arquivo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ofx">OFX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="txt">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Arquivo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste o arquivo aqui
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setShowImportDialog(false)}>
                  Importar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleAutoReconciliation}>
            <Zap className="mr-2 h-4 w-4" />
            Auto Reconciliar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Saldo Bancário</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              R$ {stats.bankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo total nos extratos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Saldo Sistema</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              R$ {stats.systemBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo registrado no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Diferença</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-orange-500">
              R$ {stats.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Divergência a reconciliar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="kpi-label">Taxa de Conciliação</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-green-500">
              {stats.reconciledPercentage.toFixed(1)}%
            </div>
            <Progress value={stats.reconciledPercentage} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingTransactions} de {stats.totalTransactions} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_month">Mês Anterior</SelectItem>
                <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bancos</SelectItem>
                <SelectItem value="Banco do Brasil">Banco do Brasil</SelectItem>
                <SelectItem value="Itaú">Itaú</SelectItem>
                <SelectItem value="Bradesco">Bradesco</SelectItem>
                <SelectItem value="Santander">Santander</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`
                      : 'Selecione o período'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDateRange.from || undefined}
                    onSelect={(date) => setCustomDateRange({ ...customDateRange, from: date || null })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Modo:</Label>
              <Select value={reconciliationMode} onValueChange={(value: any) => setReconciliationMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reconciliation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="reconciled">Conciliadas</TabsTrigger>
          <TabsTrigger value="discrepancies">Divergências</TabsTrigger>
        </TabsList>

        {/* Tab Conciliação */}
        <TabsContent value="reconciliation" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Transações Bancárias */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Extrato Bancário</CardTitle>
                  <Badge variant="outline">{filteredBankTransactions.length} transações</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredBankTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          transaction.reconciled ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "hover:bg-muted/50",
                          selectedTransactions.has(transaction.id) && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          const newSelected = new Set(selectedTransactions);
                          if (newSelected.has(transaction.id)) {
                            newSelected.delete(transaction.id);
                          } else {
                            newSelected.clear();
                            newSelected.add(transaction.id);
                          }
                          setSelectedTransactions(newSelected);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {transaction.type === 'credit' ? (
                                <ArrowLeft className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowRight className="h-4 w-4 text-red-500" />
                              )}
                              <p className="text-sm font-medium">{transaction.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(transaction.date, 'dd/MM/yyyy')}
                              {transaction.reference && (
                                <>
                                  <span>•</span>
                                  <span>Ref: {transaction.reference}</span>
                                </>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {transaction.bank}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-medium",
                              transaction.type === 'credit' ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.type === 'credit' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {transaction.reconciled && (
                              <Badge variant="default" className="text-xs mt-1">
                                <Check className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Transações do Sistema */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lançamentos Sistema</CardTitle>
                  <Badge variant="outline">{filteredSystemTransactions.length} transações</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredSystemTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          transaction.reconciled ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "hover:bg-muted/50",
                          selectedTransactions.has(transaction.id) && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          const newSelected = new Set(selectedTransactions);
                          if (newSelected.has(transaction.id)) {
                            newSelected.delete(transaction.id);
                          } else {
                            if (newSelected.size === 1) {
                              // Se já tem uma transação bancária selecionada
                              const bankId = Array.from(newSelected)[0];
                              if (bankId.startsWith('bt')) {
                                handleManualReconciliation(bankId, transaction.id);
                              }
                            }
                            newSelected.clear();
                            newSelected.add(transaction.id);
                          }
                          setSelectedTransactions(newSelected);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {transaction.type === 'revenue' ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <p className="text-sm font-medium">{transaction.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(transaction.date, 'dd/MM/yyyy')}
                              <span>•</span>
                              <span>{transaction.category}</span>
                            </div>
                            <div className="flex gap-1">
                              {transaction.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-medium",
                              transaction.type === 'revenue' ? "text-green-600" : "text-red-600"
                            )}>
                              {transaction.type === 'revenue' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {transaction.reconciled && (
                              <Badge variant="default" className="text-xs mt-1">
                                <Check className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Reconciliar */}
          {selectedTransactions.size === 2 && (
            <div className="flex justify-center">
              <Button size="lg" onClick={() => console.log('Reconciliar selecionadas')}>
                <Link className="mr-2 h-4 w-4" />
                Reconciliar Transações Selecionadas
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab Pendentes */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Transações Pendentes de Conciliação</CardTitle>
              <CardDescription>
                {stats.pendingTransactions} transações aguardando conciliação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTransactions.filter(t => !t.reconciled).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(transaction.date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          {transaction.bank}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.type === 'credit' ? "text-green-600" : "text-red-600"}>
                          {transaction.type === 'credit' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Conciliadas */}
        <TabsContent value="reconciled">
          <Card>
            <CardHeader>
              <CardTitle>Transações Conciliadas</CardTitle>
              <CardDescription>Histórico de conciliações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Transação Bancária</TableHead>
                    <TableHead>Lançamento Sistema</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTransactions.filter(t => t.reconciled).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(transaction.date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.bank}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">Venda Lote #234</p>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.type === 'credit' ? "text-green-600" : "text-red-600"}>
                          R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conciliado
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Divergências */}
        <TabsContent value="discrepancies">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Existem {stats.pendingTransactions} transações com possíveis divergências que precisam de atenção
            </AlertDescription>
          </Alert>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Análise de Divergências</CardTitle>
              <CardDescription>Transações com valores ou datas divergentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Possível Duplicação</h4>
                      <p className="text-sm text-muted-foreground">2 transações similares encontradas</p>
                    </div>
                    <Badge variant="secondary">Análise Necessária</Badge>
                  </div>
                  <div className="grid gap-2 mt-3">
                    <div className="p-2 bg-muted rounded text-sm">
                      <div className="flex justify-between">
                        <span>PGTO FORNECEDOR - AGROPECUARIA XYZ</span>
                        <span>R$ 25.000,00</span>
                      </div>
                      <span className="text-xs text-muted-foreground">10/01/2024 - Banco do Brasil</span>
                    </div>
                    <div className="p-2 bg-muted rounded text-sm">
                      <div className="flex justify-between">
                        <span>Compra de Ração</span>
                        <span>R$ 25.000,00</span>
                      </div>
                      <span className="text-xs text-muted-foreground">10/01/2024 - Sistema</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm">
                      <Check className="mr-1 h-3 w-3" />
                      Confirmar Match
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="mr-1 h-3 w-3" />
                      Não Relacionados
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Valor Divergente</h4>
                      <p className="text-sm text-muted-foreground">Diferença de R$ 5.000,00</p>
                    </div>
                    <Badge variant="destructive">Alta Prioridade</Badge>
                  </div>
                  <div className="grid gap-2 mt-3">
                    <div className="p-2 bg-muted rounded text-sm">
                      <div className="flex justify-between">
                        <span>PIX ENVIADO - TRANSPORTADORA RAPIDA</span>
                        <span>R$ 12.000,00</span>
                      </div>
                      <span className="text-xs text-muted-foreground">25/01/2024 - Itaú</span>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3">
                    <Eye className="mr-1 h-3 w-3" />
                    Investigar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Regras */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Regras de Reconciliação</DialogTitle>
            <DialogDescription>
              Configure regras automáticas para categorização e reconciliação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {reconciliationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch checked={rule.active} />
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {rule.field}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rule.operator}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rule.value}
                      </Badge>
                      <ChevronRight className="h-3 w-3" />
                      <Badge className="text-xs">{rule.category}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRulesDialog(false)}>
              Cancelar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};