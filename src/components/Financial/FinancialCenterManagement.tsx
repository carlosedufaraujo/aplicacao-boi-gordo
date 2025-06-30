import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Calculator, 
  Filter, 
  Search, 
  Calendar, 
  FileText, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  BarChart3,
  Activity,
  Receipt,
  Info
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ExpenseForm } from './ExpenseForm';
import { RevenueAllocationForm } from '../Forms/RevenueAllocationForm';
import { ContributionForm } from '../Forms/ContributionForm';
import { CostCenterForm } from '../Forms/CostCenterForm';
import { CostAllocationChart } from './CostAllocationChart';
import { TableWithPagination } from '../Common/TableWithPagination';
import { format, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EXPENSE_CATEGORIES } from '../../types';

export const FinancialCenterManagement: React.FC = () => {
  const { 
    costCenters, 
    expenses, 
    costAllocations,
    cattleLots,
    penRegistrations,
    cashFlowEntries,
    financialContributions,
    saleRecords,
    purchaseOrders,
    partners,
    addCostCenter,
    addExpense,
    addCashFlowEntry,
    addFinancialContribution
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'revenues' | 'cashflow'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [showCostCenterForm, setShowCostCenterForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showDebtDetails, setShowDebtDetails] = useState(false);
  const [selectedCostCenterType, setSelectedCostCenterType] = useState<string>('all');
  
  // 🆕 NOVO: Estados para o modal de subcategorias
  const [showSubcategoryModal, setShowSubcategoryModal] = useState<{type: string, isRevenue: boolean} | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<{
    type: string;
    category: string;
    label: string;
  } | null>(null);
  
  // Estados adicionais para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showCardDetailModal, setShowCardDetailModal] = useState<string | null>(null);

  // Calcular período baseado na seleção
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'week':
        return { start: subDays(today, 7), end: today };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'quarter':
        return { start: subDays(today, 90), end: today };
      case 'year':
        return { start: startOfYear(today), end: endOfYear(today) };
      case 'all':
      default:
        return null;
    }
  }, [selectedPeriod]);

  // Função para filtrar por período
  const filterByPeriod = <T extends { date: Date | string }>(items: T[]): T[] => {
    if (!dateRange) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, dateRange);
    });
  };

  // Calcular totais por tipo - DESPESAS
  const expensesByType = useMemo(() => {
    const totals = {
      acquisition: 0,
      fattening: 0,
      administrative: 0,
      financial: 0
    };
    
    const filteredExpenses = filterByPeriod(expenses).filter(expense => {
      // Se for compra de animais, verificar se existe ordem correspondente
      if (expense.category === 'animal_purchase') {
        const orderCode = expense.description?.match(/X\d{4}/)?.[0];
        if (orderCode) {
          return purchaseOrders.some(order => order.code === orderCode);
        }
        return false; // Não incluir compras sem código de ordem
      }
      return true; // Incluir todas as outras despesas
    });
    
    // Filtrar ordens de compra manualmente pois usa date ao invés de outro campo
    const filteredPurchaseOrders = dateRange 
      ? purchaseOrders.filter(order => {
          const orderDate = new Date(order.date);
          return isWithinInterval(orderDate, dateRange);
        })
      : purchaseOrders;
    
    // Adicionar compras de gado ao total de aquisição
    const cattlePurchases = filteredPurchaseOrders
      .filter(order => order.status === 'payment_validation' || order.status === 'reception' || order.status === 'confined')
      .reduce((sum, order) => {
        const totalCost = (order.totalWeight / 15) * order.pricePerArroba + order.commission + order.taxes + order.otherCosts;
        return sum + totalCost;
      }, 0);
    
    // NÃO adicionar compras de gado aqui pois já estão sendo contabilizadas via expenses
    // totals.acquisition += cattlePurchases;
    
    // Adicionar despesas diretas por categoria (não duplicar com centros de custo)
    filteredExpenses.forEach(expense => {
      // Verificar se a despesa já foi alocada a um centro de custo
      const hasAllocation = expense.allocations && expense.allocations.length > 0;
      
      if (!hasAllocation) {
        // Só adicionar se não tiver alocação para evitar duplicação
        if (expense.category === 'animal_purchase' || expense.category === 'commission' || expense.category === 'freight') {
          totals.acquisition += expense.totalAmount;
        } else if (expense.category === 'feed' || expense.category === 'health_costs' || expense.category === 'operational_costs') {
          totals.fattening += expense.totalAmount;
        } else if (expense.category === 'general_admin' || expense.category === 'personnel' || expense.category === 'office') {
          totals.administrative += expense.totalAmount;
        } else if (expense.category === 'taxes' || expense.category === 'interest' || expense.category === 'fees') {
          totals.financial += expense.totalAmount;
        }
      }
    });
    
    // Adicionar despesas alocadas aos centros de custo
    costCenters.forEach(center => {
      const centerExpenses = filteredExpenses
        .filter(expense => 
          expense.allocations.some(alloc => 
            (alloc.targetType === 'cost_center' && alloc.targetId === center.id) ||
            alloc.costCenterId === center.id
          )
        )
        .reduce((sum, expense) => sum + expense.totalAmount, 0);
      
      totals[center.type] += centerExpenses;
    });
    
    return totals;
  }, [expenses, costCenters, purchaseOrders, selectedPeriod]);

  // Calcular totais por tipo - RECEITAS
  const revenuesByType = useMemo(() => {
    const totals = {
      sales: 0,
      contributions: 0,
      financing: 0,
      other: 0
    };
    
    const filteredCashFlow = filterByPeriod(cashFlowEntries);
    const filteredContributions = filterByPeriod(financialContributions);
    
    // Filtrar vendas manualmente pois usa saleDate ao invés de date
    const filteredSales = dateRange 
      ? saleRecords.filter(sale => {
          const saleDate = new Date(sale.saleDate);
          return isWithinInterval(saleDate, dateRange);
        })
      : saleRecords;
    
    // Vendas - incluir tanto cashFlowEntries quanto saleRecords
    totals.sales = filteredCashFlow
      .filter(entry => entry.type === 'receita' && entry.category === 'vendas')
      .reduce((sum, entry) => sum + (entry.actualAmount || entry.plannedAmount), 0) +
      filteredSales.reduce((sum, sale) => sum + sale.grossRevenue, 0);
    
    // Aportes
    totals.contributions = filteredContributions
      .filter(contrib => (contrib.status === 'confirmado' || contrib.status === 'realizado') && contrib.type === 'aporte_socio')
      .reduce((sum, contrib) => sum + contrib.amount, 0);
    
    // Financiamentos
    totals.financing = filteredCashFlow
      .filter(entry => entry.type === 'financiamento')
      .reduce((sum, entry) => sum + (entry.actualAmount || entry.plannedAmount), 0) +
      filteredContributions
      .filter(contrib => contrib.type === 'financiamento_bancario' && (contrib.status === 'confirmado' || contrib.status === 'realizado'))
      .reduce((sum, contrib) => sum + contrib.amount, 0);
    
    // Outras receitas
    totals.other = filteredCashFlow
      .filter(entry => entry.type === 'receita' && entry.category !== 'vendas')
      .reduce((sum, entry) => sum + (entry.actualAmount || entry.plannedAmount), 0);
    
    return totals;
  }, [cashFlowEntries, financialContributions, saleRecords, selectedPeriod]);

  // Totais gerais
  const totalExpenses = Object.values(expensesByType).reduce((a, b) => a + b, 0);
  const totalRevenues = Object.values(revenuesByType).reduce((a, b) => a + b, 0);
  const netResult = totalRevenues - totalExpenses;
  
  // Calcular dívidas totais (empréstimos e financiamentos)
  const totalDebts = useMemo(() => {
    return financialContributions
      .filter(contrib => 
        (contrib.status === 'confirmado' || contrib.status === 'realizado') && 
        (contrib.type === 'financiamento_bancario' || 
         (contrib.type === 'emprestimo_socio' && contrib.returnType === 'emprestimo'))
      )
      .reduce((sum, contrib) => sum + contrib.amount, 0);
  }, [financialContributions]);

  // 🆕 NOVO: Função para obter subcategorias com dados reais
  const getSubcategoriesByType = (type: string, isRevenue: boolean = false) => {
    if (isRevenue) {
      const revenueSubcategories = {
        sales: [
          { 
            key: 'cattle_sales', 
            label: 'Venda de Gado', 
            expenses: saleRecords.map(sale => ({
              id: sale.id,
              description: `Venda Lote ${cattleLots.find(l => l.id === sale.lotId)?.lotNumber}`,
              date: sale.saleDate,
              totalAmount: sale.grossRevenue,
              status: sale.paymentType === 'cash' ? 'paid' : 'pending'
            }))
          }
        ],
        contributions: [
          { 
            key: 'partner_contributions', 
            label: 'Aportes de Sócios', 
            expenses: cashFlowEntries.filter(e => e.type === 'aporte').map(entry => ({
              id: entry.id,
              description: entry.description,
              date: entry.date,
              totalAmount: entry.actualAmount || entry.plannedAmount,
              status: entry.status
            }))
          }
        ],
        financing: [
          { 
            key: 'bank_financing', 
            label: 'Financiamento Bancário', 
            expenses: financialContributions.filter(c => c.type === 'financiamento_bancario').map(contrib => ({
              id: contrib.id,
              description: `Financiamento - ${contrib.contributorName}`,
              date: contrib.date,
              totalAmount: contrib.amount,
              status: contrib.status
            }))
          }
        ],
        other: [
          { 
            key: 'other_income', 
            label: 'Outras Receitas', 
            expenses: cashFlowEntries.filter(e => e.type === 'receita' && e.category === 'other').map(entry => ({
              id: entry.id,
              description: entry.description,
              date: entry.date,
              totalAmount: entry.actualAmount || entry.plannedAmount,
              status: entry.status
            }))
          }
        ]
      };
      return revenueSubcategories[type as keyof typeof revenueSubcategories] || [];
    } else {
      const expenseSubcategories = {
        acquisition: [
          { 
            key: 'animal_purchase', 
            label: 'Compra de Animais', 
            expenses: expenses.filter(e => {
              if (e.category === 'animal_purchase') {
                const orderCode = e.description?.match(/X\d{4}/)?.[0];
                if (orderCode) {
                  return purchaseOrders.some(order => order.code === orderCode);
                }
                return false;
              }
              return false;
            })
          },
          { 
            key: 'commission', 
            label: 'Comissões', 
            expenses: expenses.filter(e => e.category === 'commission')
          },
          { 
            key: 'freight', 
            label: 'Frete', 
            expenses: expenses.filter(e => e.category === 'freight')
          },
          { 
            key: 'acquisition_other', 
            label: 'Outros Custos de Aquisição', 
            expenses: expenses.filter(e => e.category === 'acquisition_other')
          }
        ],
        fattening: [
          { 
            key: 'feed', 
            label: 'Alimentação', 
            expenses: expenses.filter(e => e.category === 'feed')
          },
          { 
            key: 'health_costs', 
            label: 'Custos Sanitários', 
            expenses: expenses.filter(e => e.category === 'health_costs')
          },
          { 
            key: 'operational_costs', 
            label: 'Custos Operacionais', 
            expenses: expenses.filter(e => e.category === 'operational_costs')
          },
          { 
            key: 'fattening_other', 
            label: 'Outros Custos de Engorda', 
            expenses: expenses.filter(e => e.category === 'fattening_other')
          }
        ],
        administrative: [
          { 
            key: 'general_admin', 
            label: 'Administração Geral', 
            expenses: expenses.filter(e => e.category === 'general_admin')
          },
          { 
            key: 'marketing', 
            label: 'Marketing', 
            expenses: expenses.filter(e => e.category === 'marketing')
          },
          { 
            key: 'accounting', 
            label: 'Contabilidade', 
            expenses: expenses.filter(e => e.category === 'accounting')
          },
          { 
            key: 'personnel', 
            label: 'Pessoal', 
            expenses: expenses.filter(e => e.category === 'personnel')
          },
          { 
            key: 'office', 
            label: 'Escritório', 
            expenses: expenses.filter(e => e.category === 'office')
          },
          { 
            key: 'services', 
            label: 'Serviços', 
            expenses: expenses.filter(e => e.category === 'services')
          },
          { 
            key: 'technology', 
            label: 'Tecnologia', 
            expenses: expenses.filter(e => e.category === 'technology')
          },
          { 
            key: 'admin_other', 
            label: 'Outros Custos Administrativos', 
            expenses: expenses.filter(e => e.category === 'admin_other')
          }
        ],
        financial: [
          { 
            key: 'taxes', 
            label: 'Impostos', 
            expenses: expenses.filter(e => e.category === 'taxes')
          },
          { 
            key: 'interest', 
            label: 'Juros', 
            expenses: expenses.filter(e => e.category === 'interest')
          },
          { 
            key: 'fees', 
            label: 'Taxas', 
            expenses: expenses.filter(e => e.category === 'fees')
          },
          { 
            key: 'insurance', 
            label: 'Seguros', 
            expenses: expenses.filter(e => e.category === 'insurance')
          },
          { 
            key: 'capital_cost', 
            label: 'Custo de Capital', 
            expenses: expenses.filter(e => e.category === 'capital_cost')
          },
          { 
            key: 'financial_management', 
            label: 'Gestão Financeira', 
            expenses: expenses.filter(e => e.category === 'financial_management')
          },
          { 
            key: 'deaths', 
            label: 'Mortes', 
            expenses: expenses.filter(e => e.category === 'deaths')
          },
          { 
            key: 'default', 
            label: 'Inadimplência', 
            expenses: expenses.filter(e => e.category === 'default')
          },
          { 
            key: 'financial_other', 
            label: 'Outros Custos Financeiros', 
            expenses: expenses.filter(e => e.category === 'financial_other')
          }
        ]
      };
      return expenseSubcategories[type as keyof typeof expenseSubcategories] || [];
    }
  };

  // 🆕 NOVO: Modal de Detalhamento de Subcategorias
  const SubcategoryDetailModal = ({ type, isRevenue, onClose }: {
    type: string;
    isRevenue: boolean;
    onClose: () => void;
  }) => {
    const subcategories = getSubcategoriesByType(type, isRevenue);
    const typeLabels: Record<string, string> = {
      acquisition: 'Aquisição',
      fattening: 'Engorda', 
      administrative: 'Administrativo',
      financial: 'Financeiro',
      sales: 'Vendas',
      contributions: 'Aportes',
      financing: 'Financiamentos',
      other: 'Outras Receitas'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
            <div>
              <h2 className="text-lg font-semibold">
                Detalhamento: {typeLabels[type]}
              </h2>
              <p className="text-b3x-navy-200 text-sm mt-1">
                Subcategorias e lançamentos detalhados
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-4 space-y-4">
            {/* Resumo Geral */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="w-4 h-4 text-b3x-navy-600" />
                <h3 className="text-base font-semibold text-b3x-navy-900">Resumo por Subcategoria</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subcategories.map(subcategory => {
                  const total = subcategory.expenses.reduce((sum, expense: any) => {
                    if (expense.totalAmount) return sum + expense.totalAmount;
                    if (expense.amount) return sum + expense.amount;
                    if (expense.plannedAmount) return sum + expense.plannedAmount;
                    return sum;
                  }, 0);
                  
                  return (
                    <div key={subcategory.key} className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-600 mb-1">{subcategory.label}</p>
                      <p className="text-lg font-bold text-b3x-navy-900">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {subcategory.expenses.length} lançamento(s)
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista Detalhada por Subcategoria */}
            {subcategories.map(subcategory => {
              if (subcategory.expenses.length === 0) return null;
              
              return (
                <div key={subcategory.key} className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-b3x-lime-500 rounded-full"></div>
                    <h3 className="text-base font-semibold text-b3x-navy-900">{subcategory.label}</h3>
                    <span className="text-xs text-neutral-500">({subcategory.expenses.length} lançamentos)</span>
                  </div>
                  
                  <div className="space-y-2">
                    {subcategory.expenses.slice(0, 5).map((expense: any, index: number) => (
                      <div key={expense.id || index} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded">
                        <div>
                          <p className="font-medium text-sm text-b3x-navy-900">
                            {expense.description || expense.contributorName || 'Sem descrição'}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {format(new Date(expense.date || expense.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isRevenue ? 'text-success-600' : 'text-error-600'}`}>
                            {isRevenue ? '+' : '-'}R$ {(expense.totalAmount || expense.amount || expense.plannedAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {expense.paymentStatus || expense.status || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {subcategory.expenses.length > 5 && (
                      <div className="text-center py-2">
                        <button className="text-xs text-b3x-navy-600 hover:text-b3x-navy-800">
                          Ver mais {subcategory.expenses.length - 5} lançamentos...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 🆕 ATUALIZAR: Função renderFinancialCards com click para abrir subcategorias
  const renderFinancialCards = (type: string, isRevenue: boolean = false) => {
    const typeLabels: Record<string, string> = isRevenue ? {
      sales: 'Vendas',
      contributions: 'Aportes',
      financing: 'Financiamentos',
      other: 'Outras Receitas'
    } : {
      acquisition: 'Aquisição',
      fattening: 'Engorda',
      administrative: 'Administrativo',
      financial: 'Financeiro'
    };
    
    const typeColors: Record<string, string> = isRevenue ? {
      sales: 'bg-success-50 border-success-200 text-success-700',
      contributions: 'bg-info-50 border-info-200 text-info-700',
      financing: 'bg-warning-50 border-warning-200 text-warning-700',
      other: 'bg-neutral-50 border-neutral-200 text-neutral-700'
    } : {
      acquisition: 'bg-b3x-lime-50 border-b3x-lime-200 text-b3x-lime-700',
      fattening: 'bg-success-50 border-success-200 text-success-700',
      administrative: 'bg-info-50 border-info-200 text-info-700',
      financial: 'bg-warning-50 border-warning-200 text-warning-700'
    };
    
    const totals = isRevenue ? revenuesByType : expensesByType;
    const totalAmount = totals[type as keyof typeof totals] || 0;
    
    return (
      <div className="space-y-3">
        <div 
          className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-neutral-300 border-neutral-200`}
          onClick={() => {
            // 🆕 NOVO: Abrir modal de subcategorias ao clicar
            setShowSubcategoryModal({ type, isRevenue });
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${typeColors[type]}`}>
                {isRevenue ? <TrendingUp className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-semibold text-b3x-navy-900 text-sm">{typeLabels[type]}</h3>
                <p className="text-xs text-neutral-600">
                  {isRevenue ? 'Entradas' : 'Saídas'} do período
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-b3x-navy-900">
                R$ {(totalAmount / 1000).toFixed(0)}k
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Cards de KPI para visão geral
  const KPICard = ({ title, value, icon: Icon, trend, color, onClick, id }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    color: string;
    onClick?: () => void;
    id?: string;
  }) => (
    <div 
      className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50 ${onClick ? 'cursor-pointer hover:border-neutral-300 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 ${color} rounded-lg`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-b3x-navy-900 text-sm">{title}</h3>
          {trend && (
            <div className="flex items-center space-x-1 text-xs">
              {trend === 'up' ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-success-600" />
                  <span className="text-success-600">12%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 text-error-600" />
                  <span className="text-error-600">8%</span>
                </>
              )}
              <span className="text-neutral-600">vs mês anterior</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-xl font-bold text-b3x-navy-900">
        {value}
      </div>
    </div>
  );

  // 🆕 NOVO: Função para obter despesas por subcategoria
  const getExpensesBySubcategory = (category: string) => {
    return expenses.filter(expense => expense.category === category);
  };

  // 🆕 NOVO: Função para abrir o modal de subcategoria
  const handleSubcategoryClick = (type: string, category: string, label: string) => {
    setSelectedSubcategory({ type, category, label });
    setShowSubcategoryModal({ type, isRevenue: false });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-b3x-navy-900">Centro Financeiro</h2>
          <p className="text-neutral-600 text-sm mt-1">Gestão unificada de entradas e saídas financeiras</p>
        </div>

        <div className="flex space-x-2">
          {activeTab === 'expenses' ? (
            <>
              <button
                onClick={() => setShowCostCenterForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Centro de Custo</span>
              </button>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors text-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>
            </>
          ) : activeTab === 'revenues' ? (
            <>
              <button
                onClick={() => setShowContributionForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors text-sm"
              >
                <Users className="w-4 h-4" />
                <span>Novo Aporte</span>
              </button>
              <button
                onClick={() => setShowRevenueForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Receita</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Tabs e Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
        {/* Tabs de navegação */}
        <div className="bg-neutral-100 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-b3x-navy-900 shadow-sm'
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Visão Geral</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-b3x-navy-900 shadow-sm'
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4" />
              <span>Saídas</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('revenues')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'revenues'
                ? 'bg-white text-b3x-navy-900 shadow-sm'
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Entradas</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'cashflow'
                ? 'bg-white text-b3x-navy-900 shadow-sm'
                : 'text-neutral-600 hover:text-b3x-navy-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Fluxo de Caixa</span>
            </div>
          </button>
        </div>

        {/* Filtro de Período - Alinhado à direita */}
        {activeTab === 'overview' && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Período:</span>
              
              <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedPeriod('all')}
                  className={`px-3 py-1.5 text-xs rounded ${
                    selectedPeriod === 'all' 
                      ? 'bg-white text-b3x-navy-900 shadow-sm font-medium' 
                      : 'text-neutral-600 hover:text-b3x-navy-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedPeriod('week')}
                  className={`px-3 py-1.5 text-xs rounded ${
                    selectedPeriod === 'week' 
                      ? 'bg-white text-b3x-navy-900 shadow-sm font-medium' 
                      : 'text-neutral-600 hover:text-b3x-navy-900'
                  }`}
                >
                  7 dias
                </button>
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-3 py-1.5 text-xs rounded ${
                    selectedPeriod === 'month' 
                      ? 'bg-white text-b3x-navy-900 shadow-sm font-medium' 
                      : 'text-neutral-600 hover:text-b3x-navy-900'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setSelectedPeriod('quarter')}
                  className={`px-3 py-1.5 text-xs rounded ${
                    selectedPeriod === 'quarter' 
                      ? 'bg-white text-b3x-navy-900 shadow-sm font-medium' 
                      : 'text-neutral-600 hover:text-b3x-navy-900'
                  }`}
                >
                  Trimestre
                </button>
                <button
                  onClick={() => setSelectedPeriod('year')}
                  className={`px-3 py-1.5 text-xs rounded ${
                    selectedPeriod === 'year' 
                      ? 'bg-white text-b3x-navy-900 shadow-sm font-medium' 
                      : 'text-neutral-600 hover:text-b3x-navy-900'
                  }`}
                >
                  Ano
                </button>
              </div>
            </div>
            
            {selectedPeriod !== 'all' && (
              <div className="text-xs text-neutral-600">
                Exibindo dados de {
                  selectedPeriod === 'week' ? 'últimos 7 dias' :
                  selectedPeriod === 'month' ? format(startOfMonth(new Date()), 'MMMM yyyy', { locale: ptBR }) :
                  selectedPeriod === 'quarter' ? 'últimos 90 dias' :
                  'este ano'
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPIs principais */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <KPICard
              id="entradas"
              title="Total de Entradas"
              value={`R$ ${totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              trend="up"
              color="bg-success-100 text-success-600"
              onClick={() => setShowCardDetailModal('entradas')}
            />
            <KPICard
              id="saidas"
              title="Total de Saídas"
              value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={TrendingDown}
              trend="down"
              color="bg-error-100 text-error-600"
              onClick={() => setShowCardDetailModal('saidas')}
            />
            <KPICard
              id="resultado"
              title="Resultado Líquido"
              value={`R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color={netResult >= 0 ? "bg-success-100 text-success-600" : "bg-error-100 text-error-600"}
              onClick={() => setShowCardDetailModal('resultado')}
            />
            <KPICard
              id="aportes"
              title="Aportes do Mês"
              value={`R$ ${revenuesByType.contributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={Users}
              color="bg-info-100 text-info-600"
              onClick={() => setShowCardDetailModal('aportes')}
            />
            <KPICard
              id="financiamentos"
              title="Financiamentos"
              value={`R$ ${totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={Building2}
              color="bg-warning-100 text-warning-600"
              onClick={() => setShowCardDetailModal('financiamentos')}
            />
          </div>

          {/* Resumo por categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Resumo de Saídas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-error-600" />
                Distribuição de Saídas
              </h3>
              
              <div className="space-y-3">
                {Object.entries(expensesByType).map(([type, value]) => {
                  const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
                  const typeInfo = {
                    acquisition: { label: 'Aquisição', color: 'bg-b3x-lime-500' },
                    fattening: { label: 'Engorda', color: 'bg-success-500' },
                    administrative: { label: 'Administrativo', color: 'bg-info-500' },
                    financial: { label: 'Financeiro', color: 'bg-warning-500' }
                  };
                  
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">{typeInfo[type as keyof typeof typeInfo].label}</span>
                        <span className="font-medium">
                          R$ {(value / 1000).toFixed(0)}k ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${typeInfo[type as keyof typeof typeInfo].color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo de Entradas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
                Distribuição de Entradas
              </h3>
              
              <div className="space-y-3">
                {Object.entries(revenuesByType).map(([type, value]) => {
                  const percentage = totalRevenues > 0 ? (value / totalRevenues) * 100 : 0;
                  const typeInfo = {
                    sales: { label: 'Vendas', color: 'bg-success-500' },
                    contributions: { label: 'Aportes', color: 'bg-info-500' },
                    financing: { label: 'Financiamentos', color: 'bg-warning-500' },
                    other: { label: 'Outras', color: 'bg-neutral-500' }
                  };
                  
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">{typeInfo[type as keyof typeof typeInfo].label}</span>
                        <span className="font-medium">
                          R$ {(value / 1000).toFixed(0)}k ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${typeInfo[type as keyof typeof typeInfo].color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico temporal placeholder */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Evolução Mensal - Últimos 6 Meses
            </h3>
            
            <div className="flex items-center justify-center h-64 text-neutral-400">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                <p className="text-neutral-500">Gráfico em desenvolvimento</p>
              </div>
            </div>
          </div>

          {/* Tabela de Lançamentos Financeiros */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-b3x-navy-900">
                Últimos Lançamentos Financeiros
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro de Período */}
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPeriod('month')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'month' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('quarter')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'quarter' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Trimestre
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('year')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'year' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Ano
                  </button>
                </div>
                
                {/* Filtro de Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago/Recebido</option>
                  <option value="overdue">Vencido</option>
                </select>
                
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-40"
                  />
                </div>
              </div>
            </div>
            
            <TableWithPagination
              data={[
                     // Despesas - filtrar apenas as que têm ordem de compra correspondente ou não são de compra de animais
                     ...filterByPeriod(expenses)
                       .filter(expense => {
                         // Se for compra de animais, verificar se existe ordem correspondente
                         if (expense.category === 'animal_purchase') {
                           const orderCode = expense.description?.match(/X\d{4}/)?.[0];
                           if (orderCode) {
                             return purchaseOrders.some(order => order.code === orderCode);
                           }
                           return false; // Não mostrar compras sem código de ordem
                         }
                         return true; // Mostrar todas as outras despesas
                       })
                       .map(e => ({ ...e, movType: 'saida', movValue: -e.totalAmount })),
                     // Entradas do fluxo de caixa
                     ...filterByPeriod(cashFlowEntries.filter(e => ['receita', 'aporte', 'financiamento'].includes(e.type)))
                        .map(e => ({ ...e, movType: 'entrada', movValue: e.actualAmount || e.plannedAmount })),
                     // Vendas reais
                     ...(dateRange 
                       ? saleRecords.filter(sale => {
                           const saleDate = new Date(sale.saleDate);
                           return isWithinInterval(saleDate, dateRange);
                         })
                       : saleRecords
                     ).map(sale => ({
                       ...sale,
                       date: sale.saleDate,
                       description: `Venda Lote ${cattleLots.find(l => l.id === sale.lotId)?.lotNumber || sale.lotId}`,
                       movType: 'entrada',
                       movValue: sale.grossRevenue,
                       category: 'vendas',
                       paymentStatus: sale.paymentType === 'cash' ? 'paid' : 'pending'
                     })),
                     // Compras de gado - removido para evitar duplicação com expenses
                     // Aportes e financiamentos
                     ...filterByPeriod(financialContributions.filter(c => c.status === 'confirmado'))
                       .map(contrib => ({
                         ...contrib,
                         description: `${contrib.type === 'aporte_socio' ? 'Aporte' : 'Financiamento'} - ${contrib.contributorName}`,
                         movType: 'entrada',
                         movValue: contrib.amount,
                         category: contrib.type === 'aporte_socio' ? 'aportes' : 'financiamento',
                         paymentStatus: 'paid'
                       }))
                   ]
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .slice(0, 100)}
              columns={[
                {
                  key: 'date',
                  label: 'Data',
                  sortable: true,
                  render: (value: Date) => format(new Date(value), 'dd/MM/yyyy')
                },
                {
                  key: 'movType',
                  label: 'Tipo',
                  render: (value: string) => (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'entrada' 
                        ? 'bg-success-100 text-success-700'
                        : 'bg-error-100 text-error-700'
                    }`}>
                      {value === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  )
                },
                {
                  key: 'description',
                  label: 'Descrição',
                  sortable: true,
                  render: (value: string, row: any) => (
                    <div>
                      <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
                      {row.category && (
                        <div className="text-xs text-neutral-600">
                          {row.category === 'feed' ? 'Alimentação' :
                           row.category === 'health_costs' ? 'Custos Sanitários' :
                           row.category === 'animal_purchase' ? 'Compra de Animais' :
                           row.type === 'aporte' ? 'Aporte de Sócios' :
                           row.type === 'financiamento' ? 'Financiamento' :
                           row.category}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'movValue',
                  label: 'Valor',
                  sortable: true,
                  render: (value: number) => (
                    <span className={`text-sm font-medium ${
                      value >= 0 ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {value >= 0 ? '+' : ''}R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                {
                  key: 'paymentStatus',
                  label: 'Status',
                  render: (value: string, row: any) => (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (value === 'paid' || row.status === 'realizado')
                        ? 'bg-success-100 text-success-700'
                        : value === 'overdue'
                        ? 'bg-error-100 text-error-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {(value === 'paid' || row.status === 'realizado') ? 'Realizado' : 
                       value === 'overdue' ? 'Vencido' : 'Pendente'}
                    </span>
                  )
                }
              ]}
              itemsPerPage={10}
            />
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <>
          {/* Summary Cards - Totais por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-b3x-lime-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-b3x-lime-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Aquisição</h3>
                  <p className="text-xs text-neutral-600">Compras e comissões</p>
                </div>
              </div>
              <div className="text-xl font-bold text-b3x-lime-600">
                R$ {(expensesByType.acquisition / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Engorda</h3>
                  <p className="text-xs text-neutral-600">Alimentação e manejo</p>
                </div>
              </div>
              <div className="text-xl font-bold text-success-600">
                R$ {(expensesByType.fattening / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-info-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Administrativo</h3>
                  <p className="text-xs text-neutral-600">Gestão e operações</p>
                </div>
              </div>
              <div className="text-xl font-bold text-info-600">
                R$ {(expensesByType.administrative / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-warning-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Financeiro</h3>
                  <p className="text-xs text-neutral-600">Juros e taxas</p>
                </div>
              </div>
              <div className="text-xl font-bold text-warning-600">
                R$ {(expensesByType.financial / 1000).toFixed(0)}k
              </div>
            </div>
          </div>

          {/* Lista de Categorias e Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Lista de Categorias */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Centros de Custo</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {renderFinancialCards('acquisition')}
                {renderFinancialCards('fattening')}
                {renderFinancialCards('administrative')}
                {renderFinancialCards('financial')}
              </div>
            </div>

            {/* Gráfico de Alocação */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
                Distribuição de Custos
              </h3>
              
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-b3x-navy-900">
                Lançamentos de Saída
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro de Período */}
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPeriod('month')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'month' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('quarter')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'quarter' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Trimestre
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('year')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'year' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Ano
                  </button>
                </div>
                
                {/* Filtro de Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                </select>
                
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-40"
                  />
                </div>
              </div>
            </div>
            
            <TableWithPagination
              data={filterByPeriod(expenses).filter(expense => {
                // Se for compra de animais, verificar se existe ordem correspondente
                if (expense.category === 'animal_purchase') {
                  const orderCode = expense.description?.match(/X\d{4}/)?.[0];
                  if (orderCode) {
                    return purchaseOrders.some(order => order.code === orderCode);
                  }
                  return false; // Não mostrar compras sem código de ordem
                }
                return true; // Mostrar todas as outras despesas
              })}
              columns={[
                {
                  key: 'date',
                  label: 'Data',
                  sortable: true,
                  render: (value: Date) => format(new Date(value), 'dd/MM/yyyy')
                },
                {
                  key: 'description',
                  label: 'Descrição',
                  sortable: true,
                  render: (value: string, row: any) => (
                    <div>
                      <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
                      {row.invoiceNumber && (
                        <div className="text-xs text-neutral-600">NF: {row.invoiceNumber}</div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'category',
                  label: 'Categoria',
                  render: (value: string) => {
                    const categoryMap: Record<string, string> = {
                      'feed': 'Alimentação',
                      'health_costs': 'Custos Sanitários',
                      'operational_costs': 'Custos Operacionais',
                      'animal_purchase': 'Compra de Animais',
                      'commission': 'Comissão',
                      'freight': 'Frete',
                      'taxes': 'Impostos',
                      'general_admin': 'Administrativo Geral'
                    };
                    return categoryMap[value] || value;
                  }
                },
                {
                  key: 'totalAmount',
                  label: 'Valor',
                  sortable: true,
                  render: (value: number) => (
                    <span className="text-sm font-medium text-error-600">
                      -R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                {
                  key: 'paymentStatus',
                  label: 'Status',
                  render: (value: string) => (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'paid' 
                        ? 'bg-success-100 text-success-700'
                        : value === 'overdue'
                        ? 'bg-error-100 text-error-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {value === 'paid' ? 'Pago' : 
                       value === 'overdue' ? 'Vencido' : 'Pendente'}
                    </span>
                  )
                }
              ]}
              itemsPerPage={10}
            />
          </div>
        </>
      )}

      {activeTab === 'revenues' && (
        <>
          {/* Summary Cards - Totais por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Vendas</h3>
                  <p className="text-xs text-neutral-600">Boi gordo e descarte</p>
                </div>
              </div>
              <div className="text-xl font-bold text-success-600">
                R$ {(revenuesByType.sales / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <Users className="w-4 h-4 text-info-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Aportes</h3>
                  <p className="text-xs text-neutral-600">Sócios e investidores</p>
                </div>
              </div>
              <div className="text-xl font-bold text-info-600">
                R$ {(revenuesByType.contributions / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-warning-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Financiamentos</h3>
                  <p className="text-xs text-neutral-600">Empréstimos e crédito</p>
                </div>
              </div>
              <div className="text-xl font-bold text-warning-600">
                R$ {(revenuesByType.financing / 1000).toFixed(0)}k
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-neutral-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-b3x-navy-900 text-sm">Outras</h3>
                  <p className="text-xs text-neutral-600">Receitas diversas</p>
                </div>
              </div>
              <div className="text-xl font-bold text-neutral-600">
                R$ {(revenuesByType.other / 1000).toFixed(0)}k
              </div>
            </div>
          </div>

          {/* Lista de Categorias e Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Lista de Categorias */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Fontes de Receita</h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {renderFinancialCards('sales', true)}
                {renderFinancialCards('contributions', true)}
                {renderFinancialCards('financing', true)}
                {renderFinancialCards('other', true)}
              </div>
            </div>

            {/* Gráfico de Alocação */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
                Distribuição de Receitas
              </h3>
              
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-b3x-navy-900">
                Lançamentos de Entrada
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro de Período */}
                <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPeriod('month')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'month' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('quarter')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'quarter' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Trimestre
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('year')}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedPeriod === 'year' 
                        ? 'bg-white text-b3x-navy-900 shadow-sm' 
                        : 'text-neutral-600'
                    }`}
                  >
                    Ano
                  </button>
                </div>
                
                {/* Filtro de Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Recebido</option>
                  <option value="overdue">Vencido</option>
                </select>
                
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-40"
                  />
                </div>
              </div>
            </div>
            
            <TableWithPagination
              data={filterByPeriod(cashFlowEntries.filter(e => ['receita', 'aporte', 'financiamento'].includes(e.type)))}
              columns={[
                {
                  key: 'date',
                  label: 'Data',
                  sortable: true,
                  render: (value: Date) => format(new Date(value), 'dd/MM/yyyy')
                },
                {
                  key: 'description',
                  label: 'Descrição',
                  sortable: true
                },
                {
                  key: 'type',
                  label: 'Tipo',
                  render: (value: string) => {
                    const typeMap = {
                      'receita': 'Receita',
                      'aporte': 'Aporte',
                      'financiamento': 'Financiamento'
                    };
                    return typeMap[value as keyof typeof typeMap] || value;
                  }
                },
                {
                  key: 'plannedAmount',
                  label: 'Valor',
                  sortable: true,
                  render: (value: number, row: any) => (
                    <span className="text-sm font-medium text-success-600">
                      +R$ {(row.actualAmount || value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value: string) => (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'realizado' 
                        ? 'bg-success-100 text-success-700'
                        : value === 'cancelado'
                        ? 'bg-error-100 text-error-700'
                        : 'bg-info-100 text-info-700'
                    }`}>
                      {value === 'realizado' ? 'Realizado' : 
                       value === 'cancelado' ? 'Cancelado' : 'Projetado'}
                    </span>
                  )
                }
              ]}
              itemsPerPage={10}
            />
          </div>
        </>
      )}

      {activeTab === 'cashflow' && (
        <>
          {/* Cabeçalho do DRC */}
          <div className="bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Demonstrativo de Resultado de Caixa</h3>
                <p className="text-b3x-navy-200">Acompanhamento detalhado do fluxo financeiro</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <p className="text-xs text-b3x-navy-200 mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold">
                    R$ {(totalRevenues - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Indicadores rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-b3x-navy-200 mb-1">Entradas do Mês</p>
                <p className="text-lg font-bold text-success-400">
                  +R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-b3x-navy-200 mb-1">Saídas do Mês</p>
                <p className="text-lg font-bold text-error-400">
                  -R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-b3x-navy-200 mb-1">Resultado do Mês</p>
                <p className={`text-lg font-bold ${netResult >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                  R$ {netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-b3x-navy-200 mb-1">Projeção 30 dias</p>
                <p className="text-lg font-bold text-info-400">
                  R$ {((netResult * 30) / 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Fluxo de Caixa */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Fluxo de Caixa Diário - Últimos 30 dias
            </h3>
            
            <div className="flex items-center justify-center h-64 text-neutral-400">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4" />
                <p className="text-neutral-500">Gráfico em desenvolvimento</p>
              </div>
            </div>
          </div>

          {/* Tabela DRC Detalhada */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
            <div className="p-4 border-b border-neutral-200/50">
              <h3 className="text-lg font-semibold text-b3x-navy-900">
                Movimentações Detalhadas
              </h3>
            </div>
            
            <TableWithPagination
              data={[...filterByPeriod(expenses).map(e => ({ ...e, type: 'saida', amount: -e.totalAmount })),
                     ...filterByPeriod(cashFlowEntries.filter(e => ['receita', 'aporte', 'financiamento'].includes(e.type)))
                        .map(e => ({ ...e, type: 'entrada', amount: e.actualAmount || e.plannedAmount }))]
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              columns={[
                {
                  key: 'date',
                  label: 'Data',
                  sortable: true,
                  render: (value: Date) => format(new Date(value), 'dd/MM/yyyy')
                },
                {
                  key: 'description',
                  label: 'Descrição',
                  sortable: true
                },
                {
                  key: 'type',
                  label: 'Tipo',
                  render: (value: string) => (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'entrada' 
                        ? 'bg-success-100 text-success-700'
                        : 'bg-error-100 text-error-700'
                    }`}>
                      {value === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  )
                },
                {
                  key: 'amount',
                  label: 'Valor',
                  sortable: true,
                  render: (value: number) => (
                    <span className={`text-sm font-medium ${
                      value >= 0 ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {value >= 0 ? '+' : ''}R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value: string) => {
                    const statusMap = {
                      'paid': 'Realizado',
                      'pending': 'Pendente',
                      'overdue': 'Vencido',
                      'realizado': 'Realizado',
                      'projetado': 'Projetado',
                      'cancelado': 'Cancelado'
                    };
                    return statusMap[value as keyof typeof statusMap] || value;
                  }
                }
              ]}
              itemsPerPage={20}
            />
          </div>
        </>
      )}

      {/* Modal de Detalhes dos Cards */}
      {showCardDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
              <div>
                <h2 className="text-lg font-semibold">
                  {showCardDetailModal === 'financiamentos' && 'Detalhamento de Financiamentos'}
                  {showCardDetailModal === 'entradas' && 'Detalhamento de Entradas'}
                  {showCardDetailModal === 'saidas' && 'Detalhamento de Saídas'}
                  {showCardDetailModal === 'resultado' && 'Resultado Detalhado'}
                  {showCardDetailModal === 'aportes' && 'Detalhamento de Aportes'}
                </h2>
                <p className="text-b3x-navy-200 text-sm mt-1">
                  Informações detalhadas e análise completa
                </p>
              </div>
              <button
                onClick={() => setShowCardDetailModal(null)}
                className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo baseado no tipo de modal */}
            <div className="p-4 space-y-4">
              {showCardDetailModal === 'financiamentos' && (
                <>
                  {/* Resumo de Financiamentos */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <Building2 className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Resumo Geral</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Total de Financiamentos</p>
                        <p className="text-lg font-bold text-b3x-navy-900">
                          R$ {totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Número de Financiamentos</p>
                        <p className="text-lg font-bold text-warning-600">
                          {financialContributions.filter(c => (c.type === 'financiamento_bancario' || c.returnType === 'emprestimo') && c.status === 'confirmado').length}
                        </p>
                        <p className="text-xs text-neutral-500">ativos</p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Taxa Média</p>
                        <p className="text-lg font-bold text-success-600">
                          {financialContributions
                            .filter(c => (c.type === 'financiamento_bancario' || c.returnType === 'emprestimo') && c.status === 'confirmado' && c.interestRate)
                            .reduce((sum, c, _, arr) => sum + (c.interestRate || 0) / arr.length, 0)
                            .toFixed(2)}% a.m.
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Prazo Médio</p>
                        <p className="text-lg font-bold text-error-600">
                          {Math.round(financialContributions
                            .filter(c => (c.type === 'financiamento_bancario' || c.returnType === 'emprestimo') && c.status === 'confirmado' && c.paybackPeriod)
                            .reduce((sum, c, _, arr) => sum + (c.paybackPeriod || 0) / arr.length, 0))} meses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Financiamentos */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Financiamentos Ativos</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {financialContributions
                        .filter(contrib => (contrib.type === 'financiamento_bancario' || contrib.returnType === 'emprestimo') && contrib.status === 'confirmado')
                        .map(contrib => (
                          <div key={contrib.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-b3x-navy-900">{contrib.contributorName}</h4>
                                <p className="text-xs text-neutral-600">{contrib.type === 'emprestimo_socio' ? 'Empréstimo de Sócio' : 'Financiamento Bancário'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-b3x-navy-900">
                                  R$ {contrib.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-neutral-600">
                                  {contrib.interestRate}% a.m. • {contrib.paybackPeriod} meses
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-neutral-600">Data Contratação</p>
                                <p className="font-medium">{format(new Date(contrib.date), 'dd/MM/yyyy')}</p>
                              </div>
                              <div>
                                <p className="text-neutral-600">Próximo Pagamento</p>
                                <p className="font-medium text-warning-600">15/01/2024</p>
                              </div>
                              <div>
                                <p className="text-neutral-600">Saldo Devedor</p>
                                <p className="font-medium">R$ {(contrib.amount * 0.8).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {financialContributions.filter(c => (c.type === 'financiamento_bancario' || c.returnType === 'emprestimo') && (c.status === 'confirmado' || c.status === 'realizado')).length === 0 && (
                    <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                      <div className="text-center py-8 text-neutral-500">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                        <p className="text-sm">Nenhum financiamento ativo no momento</p>
                        <p className="text-xs mt-2">Clique no botão "Novo Aporte" para adicionar um financiamento</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {showCardDetailModal === 'entradas' && (
                <>
                  {/* Resumo de Entradas */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Resumo de Receitas</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-success-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Vendas</p>
                        <p className="text-lg font-bold text-success-700">
                          R$ {revenuesByType.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-info-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Aportes</p>
                        <p className="text-lg font-bold text-info-700">
                          R$ {revenuesByType.contributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-warning-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Financiamentos</p>
                        <p className="text-lg font-bold text-warning-700">
                          R$ {revenuesByType.financing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Outras</p>
                        <p className="text-lg font-bold text-neutral-700">
                          R$ {revenuesByType.other.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Receitas */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <Receipt className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Receitas do Período</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {/* Vendas */}
                      {(dateRange 
                        ? saleRecords.filter(sale => {
                            const saleDate = new Date(sale.saleDate);
                            return isWithinInterval(saleDate, dateRange);
                          })
                        : saleRecords
                      ).map(sale => (
                        <div key={sale.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded">
                          <div>
                            <p className="font-medium text-sm text-b3x-navy-900">
                              Venda Lote {cattleLots.find(l => l.id === sale.lotId)?.lotNumber || sale.lotId}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {format(new Date(sale.saleDate), 'dd/MM/yyyy')} • Vendas
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-success-600">
                              +R$ {sale.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {sale.paymentType === 'cash' ? 'À Vista' : 'A Prazo'}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Aportes e Financiamentos */}
                      {filterByPeriod(financialContributions.filter(c => c.status === 'confirmado' || c.status === 'realizado'))
                        .map(contrib => (
                          <div key={contrib.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded">
                            <div>
                              <p className="font-medium text-sm text-b3x-navy-900">
                                {contrib.type === 'aporte_socio' ? 'Aporte' : 'Financiamento'} - {contrib.contributorName}
                              </p>
                              <p className="text-xs text-neutral-600">
                                {format(new Date(contrib.date), 'dd/MM/yyyy')} • {contrib.type === 'aporte_socio' ? 'Aportes' : 'Financiamentos'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-success-600">
                                +R$ {contrib.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-neutral-500">Confirmado</p>
                            </div>
                          </div>
                        ))}
                      
                      {/* Outras Receitas */}
                      {filterByPeriod(cashFlowEntries.filter(e => e.type === 'receita'))
                        .map(entry => (
                          <div key={entry.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded">
                            <div>
                              <p className="font-medium text-sm text-b3x-navy-900">{entry.description}</p>
                              <p className="text-xs text-neutral-600">
                                {format(new Date(entry.date), 'dd/MM/yyyy')} • Receitas
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-success-600">
                                +R$ {(entry.actualAmount || entry.plannedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {entry.status === 'realizado' ? 'Realizado' : 'Projetado'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
              
              {showCardDetailModal === 'resultado' && (
                <>
                  {/* Resumo do Resultado */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Análise do Resultado</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-success-50 rounded-lg p-4">
                        <p className="text-xs text-neutral-600 mb-1">Total de Entradas</p>
                        <p className="text-xl font-bold text-success-700">
                          +R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-error-50 rounded-lg p-4">
                        <p className="text-xs text-neutral-600 mb-1">Total de Saídas</p>
                        <p className="text-xl font-bold text-error-700">
                          -R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className={`${netResult >= 0 ? 'bg-success-50' : 'bg-error-50'} rounded-lg p-4`}>
                        <p className="text-xs text-neutral-600 mb-1">Resultado Líquido</p>
                        <p className={`text-xl font-bold ${netResult >= 0 ? 'text-success-700' : 'text-error-700'}`}>
                          {netResult >= 0 ? '+' : ''}R$ {netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Composição */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <PieChart className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Composição do Resultado</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Entradas */}
                      <div>
                        <h4 className="text-sm font-medium text-b3x-navy-900 mb-3">Entradas por Categoria</h4>
                        <div className="space-y-2">
                          {Object.entries(revenuesByType).map(([type, value]) => {
                            const percentage = totalRevenues > 0 ? (value / totalRevenues) * 100 : 0;
                            return (
                              <div key={type}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-neutral-600">
                                    {type === 'sales' ? 'Vendas' :
                                     type === 'contributions' ? 'Aportes' :
                                     type === 'financing' ? 'Financiamentos' : 'Outras'}
                                  </span>
                                  <span className="font-medium">
                                    R$ {(value / 1000).toFixed(0)}k ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                  <div 
                                    className="h-1.5 rounded-full bg-success-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Saídas */}
                      <div>
                        <h4 className="text-sm font-medium text-b3x-navy-900 mb-3">Saídas por Categoria</h4>
                        <div className="space-y-2">
                          {Object.entries(expensesByType).map(([type, value]) => {
                            const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
                            return (
                              <div key={type}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-neutral-600">
                                    {type === 'acquisition' ? 'Aquisição' :
                                     type === 'fattening' ? 'Engorda' :
                                     type === 'administrative' ? 'Administrativo' : 'Financeiro'}
                                  </span>
                                  <span className="font-medium">
                                    R$ {(value / 1000).toFixed(0)}k ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                  <div 
                                    className="h-1.5 rounded-full bg-error-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Indicadores Financeiros</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-neutral-600 mb-1">Margem Líquida</p>
                        <p className={`text-lg font-bold ${netResult >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                          {totalRevenues > 0 ? ((netResult / totalRevenues) * 100).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-neutral-600 mb-1">Custo/Receita</p>
                        <p className="text-lg font-bold text-warning-600">
                          {totalRevenues > 0 ? ((totalExpenses / totalRevenues) * 100).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-neutral-600 mb-1">Média Diária</p>
                        <p className="text-lg font-bold text-info-600">
                          R$ {(netResult / 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-neutral-600 mb-1">Projeção Mensal</p>
                        <p className="text-lg font-bold text-b3x-navy-600">
                          R$ {netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {showCardDetailModal === 'aportes' && (
                <>
                  {/* Resumo de Aportes */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Resumo de Aportes</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-info-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Total do Período</p>
                        <p className="text-lg font-bold text-info-700">
                          R$ {revenuesByType.contributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-success-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Número de Aportes</p>
                        <p className="text-lg font-bold text-success-700">
                          {financialContributions.filter(c => c.type === 'aporte_socio' && (c.status === 'confirmado' || c.status === 'realizado')).length}
                        </p>
                      </div>
                      <div className="bg-warning-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Aporte Médio</p>
                        <p className="text-lg font-bold text-warning-700">
                          R$ {financialContributions.filter(c => c.type === 'aporte_socio' && (c.status === 'confirmado' || c.status === 'realizado')).length > 0
                            ? (revenuesByType.contributions / financialContributions.filter(c => c.type === 'aporte_socio' && (c.status === 'confirmado' || c.status === 'realizado')).length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            : '0,00'}
                        </p>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Sócios Ativos</p>
                        <p className="text-lg font-bold text-neutral-700">
                          {[...new Set(financialContributions.filter(c => c.type === 'aporte_socio').map(c => c.contributorName))].length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Aportes */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Aportes Realizados</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {filterByPeriod(financialContributions.filter(c => c.type === 'aporte_socio' && (c.status === 'confirmado' || c.status === 'realizado')))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(contrib => (
                          <div key={contrib.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-b3x-navy-900">{contrib.contributorName}</h4>
                                <p className="text-xs text-neutral-600">Aporte de Sócio</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-info-700">
                                  R$ {contrib.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-neutral-600">
                                  {format(new Date(contrib.date), 'dd/MM/yyyy')}
                                </p>
                              </div>
                            </div>
                            
                            {contrib.notes && (
                              <p className="text-xs text-neutral-600 mt-2 p-2 bg-white rounded">
                                {contrib.notes}
                              </p>
                            )}
                          </div>
                        ))}
                        
                      {filterByPeriod(financialContributions.filter(c => c.type === 'aporte_socio' && (c.status === 'confirmado' || c.status === 'realizado'))).length === 0 && (
                        <div className="text-center py-8 text-neutral-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                          <p className="text-sm">Nenhum aporte realizado no período</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {showCardDetailModal === 'saidas' && (
                <>
                  {/* Resumo de Saídas */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Resumo de Despesas</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-b3x-lime-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Aquisição</p>
                        <p className="text-lg font-bold text-b3x-lime-700">
                          R$ {expensesByType.acquisition.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-success-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Engorda</p>
                        <p className="text-lg font-bold text-success-700">
                          R$ {expensesByType.fattening.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-info-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Administrativo</p>
                        <p className="text-lg font-bold text-info-700">
                          R$ {expensesByType.administrative.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-warning-50 rounded-lg p-3">
                        <p className="text-xs text-neutral-600 mb-1">Financeiro</p>
                        <p className="text-lg font-bold text-warning-700">
                          R$ {expensesByType.financial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Despesas Válidas */}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-soft">
                    <div className="flex items-center space-x-2 mb-3">
                      <Receipt className="w-4 h-4 text-b3x-navy-600" />
                      <h3 className="text-base font-semibold text-b3x-navy-900">Despesas do Período</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filterByPeriod(expenses)
                        .filter(expense => {
                          // Aplicar o mesmo filtro usado na tabela
                          if (expense.category === 'animal_purchase') {
                            const orderCode = expense.description?.match(/X\d{4}/)?.[0];
                            if (orderCode) {
                              return purchaseOrders.some(order => order.code === orderCode);
                            }
                            return false;
                          }
                          return true;
                        })
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 20)
                        .map(expense => (
                          <div key={expense.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 rounded">
                            <div>
                              <p className="font-medium text-sm text-b3x-navy-900">{expense.description}</p>
                              <p className="text-xs text-neutral-600">
                                {format(new Date(expense.date), 'dd/MM/yyyy')} • {
                                  expense.category === 'feed' ? 'Alimentação' :
                                  expense.category === 'health_costs' ? 'Custos Sanitários' :
                                  expense.category === 'animal_purchase' ? 'Compra de Animais' :
                                  expense.category
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-error-600">
                                -R$ {expense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {expense.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Nota sobre compras de gado */}
                    <div className="mt-4 p-3 bg-info-50 rounded-lg border border-info-200">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-info-600 mt-0.5" />
                        <div className="text-xs text-info-700">
                          <p className="font-medium mb-1">Nota sobre Compras de Gado:</p>
                          <p>As compras de gado são exibidas diretamente do Pipeline de Compras. Apenas compras com ordens válidas (código X0001, X0002, etc.) são consideradas nas despesas.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Outros modais podem ser implementados similarmente */}
            </div>
          </div>
        </div>
      )}

      {/* 🆕 ADICIONAR no final, antes do fechamento dos formulários */}
      {showSubcategoryModal && (
        <SubcategoryDetailModal
          type={showSubcategoryModal.type}
          isRevenue={showSubcategoryModal.isRevenue}
          onClose={() => setShowSubcategoryModal(null)}
        />
      )}

      {/* Formulários */}
      {showExpenseForm && (
        <ExpenseForm
          isOpen={showExpenseForm}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
      
      {showRevenueForm && (
        <RevenueAllocationForm
          isOpen={showRevenueForm}
          onClose={() => setShowRevenueForm(false)}
        />
      )}
      
      {showContributionForm && (
        <ContributionForm
          isOpen={showContributionForm}
          onClose={() => setShowContributionForm(false)}
        />
      )}
      
      {showCostCenterForm && (
        <CostCenterForm
          isOpen={showCostCenterForm}
          onClose={() => setShowCostCenterForm(false)}
        />
      )}
    </div>
  );
}; 