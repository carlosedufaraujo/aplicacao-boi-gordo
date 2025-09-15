import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Eye,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCattlePurchasesApi, CattlePurchase } from '@/hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { OptimizedPurchaseForm } from '../Forms/OptimizedPurchaseForm';
import { SimplifiedPurchaseDetails } from './SimplifiedPurchaseDetails';
import { EnhancedPurchaseTable } from './EnhancedPurchaseTable';

export function SimplifiedPurchaseManagement() {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<CattlePurchase | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Hooks de API
  const { 
    purchases, 
    loading, 
    loadPurchases, 
    createPurchase,
    updatePurchase,
    deletePurchase,
    
    registerDeath,
    registerReception,
    markAsConfined
  } = useCattlePurchasesApi();
  
  const { partners, loadPartners } = usePartnersApi();
  const { accounts, loadAccounts } = usePayerAccountsApi();

  // Carregar dados ao montar
  useEffect(() => {
    loadPurchases();
    loadPartners();
    loadAccounts();
  }, []);

  // Filtrar compras
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calcular estatísticas
  const statistics = {
    total: purchases.length,
    active: purchases.filter(p => p.currentQuantity > 0).length,
    totalAnimals: purchases.reduce((sum, p) => sum + (p.initialQuantity || 0), 0), // Usar quantidade inicial de compra
    totalInvestment: purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0),
  };

  // Funções auxiliares
  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    
    try {
      const success = await deletePurchase(purchaseToDelete);
      
      if (success) {
        // Exclusão bem-sucedida
        setShowDeleteDialog(false);
        setPurchaseToDelete(null);
        setSelectedPurchase(null);
        setShowDetails(false);
      }
    } catch (error: any) {
      // Apenas logar erros reais (não 404 que já foi tratado no hook)
      if (error.response?.status !== 404) {
        console.error('Erro ao excluir:', error);
      }
      
      // Fechar modais em caso de erro também
      setShowDeleteDialog(false);
      setPurchaseToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Estatísticas - Padrão Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                COMPRAS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active} ativas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                ANIMAIS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">
              {statistics.totalAnimals.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">cabeças</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                ARROBAS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">
              {purchases.reduce((sum, p) => {
                const carcassWeight = (p.purchaseWeight * p.carcassYield) / 100;
                return sum + (carcassWeight / 15);
              }, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">@ carcaça</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                PESO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">
              {statistics.totalAnimals > 0 ?
                (purchases.reduce((sum, p) => sum + (p.purchaseWeight || 0), 0) / statistics.totalAnimals).toFixed(1) :
                '0'
              } kg
            </div>
            <p className="text-xs text-muted-foreground">por cabeça</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                TOTAL
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">em compras</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                R$/@
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="text-2xl font-bold">
              {(() => {
                // Calcular total de arrobas de carcaça
                const totalArrobas = purchases.reduce((sum, p) => {
                  const carcassWeight = (p.purchaseWeight * p.carcassYield) / 100;
                  return sum + (carcassWeight / 15);
                }, 0);
                
                // Calcular valor total investido
                const totalValue = purchases.reduce((sum, p) => sum + p.totalCost, 0);
                
                // Preço médio real: valor total / total de arrobas
                return totalArrobas > 0 ? formatCurrency(totalValue / totalArrobas) : formatCurrency(0);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">valor real pago</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Compras</CardTitle>
              <CardDescription>
                Sistema unificado de compras e lotes
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, lote, fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabela de Compras Aprimorada */}
          <EnhancedPurchaseTable
            searchTerm={searchTerm}
            
            onView={(purchase) => {
              setSelectedPurchase(purchase);
              setShowDetails(true);
            }}
            onEdit={(purchase) => {
              setSelectedPurchase(purchase);
              setShowForm(true);
            }}
            onDelete={(purchase) => {
              setPurchaseToDelete(purchase.id);
              setShowDeleteDialog(true);
            }}
            
          />
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {showDetails && selectedPurchase && (
        <SimplifiedPurchaseDetails
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedPurchase(null);
          }}
          data={selectedPurchase}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
          onDelete={() => {
            setShowDetails(false);
            setPurchaseToDelete(selectedPurchase.id);
            setShowDeleteDialog(true);
          }}
          onRefresh={async () => {
            await loadPurchases();
            // Atualizar o selectedPurchase com os dados atualizados
            const updatedPurchase = purchases.find(p => p.id === selectedPurchase.id);
            if (updatedPurchase) {
              setSelectedPurchase(updatedPurchase);
            }
          }}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>Tem certeza que deseja excluir esta compra?</div>
                {purchaseToDelete && (() => {
                  const purchase = purchases.find(p => p.id === purchaseToDelete);
                  const isActive = purchase?.currentQuantity && purchase.currentQuantity > 0;
                  
                  if (isActive) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                        <div className="text-amber-800 font-medium">⚠️ Atenção: Este lote está ativo!</div>
                        <div className="text-amber-700 text-sm mt-1">
                          Ao excluir, serão removidos TODOS os dados relacionados:
                        </div>
                        <ul className="text-amber-700 text-sm mt-1 ml-4 list-disc">
                          <li>Alocações em currais</li>
                          <li>Registros de saúde e mortalidade</li>
                          <li>Despesas e receitas relacionadas</li>
                          <li>Análises de quebra de peso</li>
                          <li>Histórico completo do lote</li>
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="text-destructive font-semibold">Esta ação não pode ser desfeita!</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPurchaseToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Formulário de Nova/Editar Compra */}
      <OptimizedPurchaseForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedPurchase(null);
        }}
        onSubmit={async (data) => {
          if (selectedPurchase) {
            await updatePurchase(selectedPurchase.id, data);
          } else {
            await createPurchase(data);
          }
          await loadPurchases();
          setShowForm(false);
          setSelectedPurchase(null);
        }}
        partners={partners}
        payerAccounts={accounts}
        initialData={selectedPurchase}
      />
    </div>
  );
}

export default SimplifiedPurchaseManagement;
