import React, { useState, useEffect } from 'react';
import { Building2, Plus, PieChart, TrendingUp, Calculator, Filter, Search, Calendar, FileText, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CostCenterForm } from '../Forms/CostCenterForm';
import { ExpenseAllocationForm } from '../Forms/ExpenseAllocationForm';
import { CostAllocationChart } from './CostAllocationChart';
import { TableWithPagination } from '../Common/TableWithPagination';
import { format } from 'date-fns';

export const CostCenterManagement: React.FC = () => {
  const { 
    costCenters, 
    expenses, 
    costAllocations,
    cattleLots,
    addCostCenter,
    addExpense 
  } = useAppStore();
  
  // Função getTotalAllocatedAmount definida antes de ser usada
  const getTotalAllocatedAmount = (costCenterId: string) => {
    // Considerar alocações diretas para o centro de custo
    const directAllocations = costAllocations
      .filter(allocation => 
        allocation.targetType === 'cost_center' && 
        allocation.targetId === costCenterId
      )
      .reduce((sum, allocation) => sum + allocation.amount, 0);
    
    // Considerar alocações onde este centro é o centro de custo da despesa
    const indirectAllocations = costAllocations
      .filter(allocation => allocation.costCenterId === costCenterId)
      .reduce((sum, allocation) => sum + allocation.amount, 0);
    
    return directAllocations + indirectAllocations;
  };
  
  const [showCostCenterForm, setShowCostCenterForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('');
  const [selectedCostCenterType, setSelectedCostCenterType] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [filterLot, setFilterLot] = useState<string>('');
  const [filterCenter, setFilterCenter] = useState<string>('');

  const activeCostCenters = costCenters.filter(cc => cc.isActive);
  
  // Agrupar centros de custo por tipo
  const costCentersByType = {
    acquisition: activeCostCenters.filter(cc => cc.type === 'acquisition'),
    fattening: activeCostCenters.filter(cc => cc.type === 'fattening'),
    administrative: activeCostCenters.filter(cc => cc.type === 'administrative'),
    financial: activeCostCenters.filter(cc => cc.type === 'financial')
  };

  // Calcular totais por tipo de centro de custo
  const totalsByType = {
    acquisition: costCentersByType.acquisition.reduce((sum, cc) => 
      sum + getTotalAllocatedAmount(cc.id), 0),
    fattening: costCentersByType.fattening.reduce((sum, cc) => 
      sum + getTotalAllocatedAmount(cc.id), 0),
    administrative: costCentersByType.administrative.reduce((sum, cc) => 
      sum + getTotalAllocatedAmount(cc.id), 0),
    financial: costCentersByType.financial.reduce((sum, cc) => 
      sum + getTotalAllocatedAmount(cc.id), 0)
  };

  const getCostCenterExpenses = (costCenterId: string) => {
    return expenses.filter(expense => 
      expense.allocations.some(allocation => 
        (allocation.targetType === 'cost_center' && allocation.targetId === costCenterId) ||
        allocation.costCenterId === costCenterId
      )
    );
  };

  const getLotsForCostCenter = (costCenterId: string) => {
    // Encontrar alocações que têm este centro de custo e são para lotes
    const lotAllocations = costAllocations.filter(allocation => 
      allocation.costCenterId === costCenterId && 
      allocation.targetType === 'lot'
    );
    
    // Obter IDs únicos de lotes
    const lotIds = [...new Set(lotAllocations.map(allocation => allocation.targetId))];
    
    // Retornar os lotes correspondentes
    return cattleLots.filter(lot => lotIds.includes(lot.id));
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const totalAllocated = costAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const unallocatedAmount = totalExpenses - totalAllocated;

  // Filtrar despesas com base nos critérios
  const filteredExpenses = expenses.filter(expense => {
    // Filtro de pesquisa
    if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro de centro de custo
    if (filterCenter && !expense.allocations.some(allocation => 
      (allocation.targetType === 'cost_center' && allocation.targetId === filterCenter) ||
      allocation.costCenterId === filterCenter
    )) {
      return false;
    }
    
    // Filtro de lote
    if (filterLot && !expense.allocations.some(allocation => 
      allocation.targetType === 'lot' && allocation.targetId === filterLot
    )) {
      return false;
    }
    
    // Filtro de status
    if (filterStatus !== 'all' && expense.paymentStatus !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // Obter despesa selecionada para detalhes
  const selectedExpense = selectedExpenseId ? expenses.find(e => e.id === selectedExpenseId) : null;

  // Função para lidar com o clique em um card de centro de custo
  const handleCostCenterTypeClick = (type: string) => {
    if (selectedCostCenterType === type) {
      setSelectedCostCenterType(null); // Desselecionar se já estiver selecionado
    } else {
      setSelectedCostCenterType(type);
      setSelectedCostCenter(''); // Limpar seleção de centro específico
    }
  };

  // Função para lidar com o clique em um centro de custo específico
  const handleCostCenterClick = (centerId: string) => {
    if (selectedCostCenter === centerId) {
      setSelectedCostCenter(''); // Desselecionar se já estiver selecionado
    } else {
      setSelectedCostCenter(centerId);
    }
  };

  // Preparar dados para a tabela detalhada com base na seleção
  const getDetailedCostData = () => {
    if (selectedCostCenter) {
      // Mostrar subcategorias para o centro de custo selecionado
      const centerExpenses = getCostCenterExpenses(selectedCostCenter);
      const subcategories = [...new Set(centerExpenses.map(exp => exp.category))];
      
      return subcategories.map(subcategory => {
        // Filtrar despesas desta subcategoria para este centro
        const subcategoryExpenses = centerExpenses.filter(exp => exp.category === subcategory);
        
        // Calcular valor total para esta subcategoria
        const totalAmount = subcategoryExpenses.reduce((sum, exp) => {
          // Encontrar alocações para este centro de custo
          const allocations = exp.allocations.filter(alloc => 
            (alloc.targetType === 'cost_center' && alloc.targetId === selectedCostCenter) ||
            alloc.costCenterId === selectedCostCenter
          );
          
          // Somar os valores das alocações
          return sum + allocations.reduce((allocSum, alloc) => allocSum + alloc.amount, 0);
        }, 0);
        
        // Obter lotes envolvidos
        const involvedLots = getLotsForCostCenter(selectedCostCenter);
        
        // Calcular percentual sobre o total
        const percentageOfTotal = totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0;
        
        // Mapear categoria para nome legível
        const categoryMap: Record<string, string> = {
          'animal_purchase': 'Compra de Animais',
          'commission': 'Comissão',
          'freight': 'Frete',
          'acquisition_other': 'Outros (Aquisição)',
          'feed': 'Alimentação',
          'health_costs': 'Custos Sanitários',
          'operational_costs': 'Custos Operacionais',
          'fattening_other': 'Outros (Engorda)',
          'general_admin': 'Administrativo Geral',
          'marketing': 'Marketing',
          'accounting': 'Contabilidade',
          'personnel': 'Pessoal',
          'office': 'Escritório',
          'services': 'Prestação de Serviço',
          'technology': 'Tecnologia',
          'admin_other': 'Outros (Administrativo)',
          'taxes': 'Impostos',
          'interest': 'Juros',
          'fees': 'Taxas & Emolumentos',
          'insurance': 'Seguros',
          'capital_cost': 'Custo de Capital',
          'financial_management': 'Gestão Financeira',
          'deaths': 'Mortes',
          'default': 'Inadimplência',
          'financial_other': 'Outros (Financeiro)'
        };
        
        return {
          id: `${selectedCostCenter}-${subcategory}`,
          center: costCenters.find(cc => cc.id === selectedCostCenter)?.name || '',
          centerType: costCenters.find(cc => cc.id === selectedCostCenter)?.type || '',
          subcategory: categoryMap[subcategory] || subcategory,
          amount: totalAmount,
          percentage: percentageOfTotal,
          lotsInvolved: involvedLots.length > 0 
            ? involvedLots.map(lot => lot.lotNumber).join(', ')
            : 'Indireto',
          expenses: subcategoryExpenses
        };
      });
    } else if (selectedCostCenterType) {
      // Mostrar centros de custo do tipo selecionado
      const centersOfType = costCenters.filter(cc => cc.type === selectedCostCenterType && cc.isActive);
      
      return centersOfType.map(center => {
        const totalAmount = getTotalAllocatedAmount(center.id);
        const percentageOfTotal = totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0;
        const involvedLots = getLotsForCostCenter(center.id);
        
        return {
          id: center.id,
          center: center.name,
          centerType: center.type,
          subcategory: 'Total',
          amount: totalAmount,
          percentage: percentageOfTotal,
          lotsInvolved: involvedLots.length > 0 
            ? involvedLots.map(lot => lot.lotNumber).join(', ')
            : 'Indireto',
          expenses: getCostCenterExpenses(center.id)
        };
      });
    } else {
      // Mostrar todos os centros de custo agrupados por tipo
      return activeCostCenters.map(center => {
        const totalAmount = getTotalAllocatedAmount(center.id);
        const percentageOfTotal = totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0;
        const involvedLots = getLotsForCostCenter(center.id);
        
        return {
          id: center.id,
          center: center.name,
          centerType: center.type,
          subcategory: 'Total',
          amount: totalAmount,
          percentage: percentageOfTotal,
          lotsInvolved: involvedLots.length > 0 
            ? involvedLots.map(lot => lot.lotNumber).join(', ')
            : 'Indireto',
          expenses: getCostCenterExpenses(center.id)
        };
      });
    }
  };

  const detailedCostData = getDetailedCostData();

  // Colunas para a tabela detalhada
  const detailedColumns = [
    {
      key: 'center',
      label: 'Centro de Custo',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
          <div className="text-xs text-neutral-500">
            {row.centerType === 'acquisition' ? 'Aquisição' :
             row.centerType === 'fattening' ? 'Engorda' :
             row.centerType === 'administrative' ? 'Administrativo' : 'Financeiro'}
          </div>
        </div>
      )
    },
    {
      key: 'subcategory',
      label: 'Subcategoria',
      sortable: true
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-b3x-navy-900">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'percentage',
      label: '% sobre total',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-b3x-navy-900">
          {value.toFixed(1)}%
        </span>
      )
    },
    {
      key: 'lotsInvolved',
      label: 'Lotes/Indireto',
      render: (value: string) => (
        <span className={`text-sm ${value === 'Indireto' ? 'text-neutral-500 italic' : 'text-b3x-navy-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: any) => (
        <button
          onClick={() => {
            setShowExpenseDetails(true);
            // Usar o primeiro ID de despesa associado a esta combinação
            if (row.expenses.length > 0) {
              setSelectedExpenseId(row.expenses[0].id);
            }
          }}
          className="px-2 py-1 text-xs bg-b3x-lime-500 text-b3x-navy-900 rounded hover:bg-b3x-lime-600 transition-colors"
        >
          Ver Lançamentos
        </button>
      )
    }
  ];

  // Colunas para a tabela de despesas
  const expenseColumns = [
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value: Date) => format(value, 'dd/MM/yyyy')
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
      key: 'totalAmount',
      label: 'Valor',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium text-b3x-navy-900">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'bankAccount',
      label: 'Banco',
      render: (value: any, row: any) => (
        <span className="text-sm text-neutral-600">
          {row.bankAccount || 'Não informado'}
        </span>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      sortable: true,
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
    },
    {
      key: 'allocations',
      label: 'Lote/CC',
      render: (value: any, row: any) => {
        const lotAllocations = row.allocations.filter(a => a.targetType === 'lot');
        const ccAllocations = row.allocations.filter(a => a.targetType === 'cost_center');
        
        if (lotAllocations.length > 0) {
          const lotIds = lotAllocations.map(a => a.targetId);
          const lots = cattleLots.filter(lot => lotIds.includes(lot.id));
          return (
            <span className="text-sm text-b3x-navy-900">
              {lots.map(lot => lot.lotNumber).join(', ')}
            </span>
          );
        } else if (ccAllocations.length > 0) {
          const ccIds = ccAllocations.map(a => a.targetId);
          const centers = costCenters.filter(cc => ccIds.includes(cc.id));
          return (
            <span className="text-sm text-neutral-600 italic">
              {centers.map(cc => cc.code).join(', ')}
            </span>
          );
        }
        
        return <span className="text-sm text-neutral-500">-</span>;
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: any) => (
        <button
          className="px-2 py-1 text-xs bg-info-500 text-white rounded hover:bg-info-600 transition-colors"
        >
          Conciliar
        </button>
      )
    }
  ];

  // Renderizar cards de centros de custo por tipo
  const renderCostCenterCards = (type: 'acquisition' | 'fattening' | 'administrative' | 'financial') => {
    const centers = costCentersByType[type];
    const typeLabels = {
      acquisition: 'Aquisição',
      fattening: 'Engorda',
      administrative: 'Administrativo',
      financial: 'Financeiro'
    };
    
    const typeColors = {
      acquisition: 'bg-b3x-lime-50 border-b3x-lime-200 text-b3x-lime-700',
      fattening: 'bg-success-50 border-success-200 text-success-700',
      administrative: 'bg-info-50 border-info-200 text-info-700',
      financial: 'bg-warning-50 border-warning-200 text-warning-700'
    };
    
    const isTypeSelected = selectedCostCenterType === type;
    
    return (
      <div className="space-y-3">
        {/* Cabeçalho do tipo */}
        <div 
          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
            isTypeSelected 
              ? `${typeColors[type]} shadow-md` 
              : 'border-neutral-200 hover:border-neutral-300'
          }`}
          onClick={() => handleCostCenterTypeClick(type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${typeColors[type]}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-b3x-navy-900 text-sm">{typeLabels[type]}</h3>
                <p className="text-xs text-neutral-600">{centers.length} centros</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-b3x-navy-900">
                R$ {(totalsByType[type] / 1000).toFixed(0)}k
              </div>
              {isTypeSelected ? (
                <ChevronDown className="w-4 h-4 text-neutral-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              )}
            </div>
          </div>
        </div>
        
        {/* Lista de centros de custo deste tipo (visível apenas quando o tipo está selecionado) */}
        {isTypeSelected && (
          <div className="pl-4 space-y-2">
            {centers.map(center => {
              const totalAmount = getTotalAllocatedAmount(center.id);
              const isCenterSelected = selectedCostCenter === center.id;
              
              return (
                <div 
                  key={center.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isCenterSelected 
                      ? 'border-b3x-lime-300 bg-b3x-lime-50 shadow-sm' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => handleCostCenterClick(center.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-b3x-navy-900 text-sm">{center.name}</h4>
                      <p className="text-xs text-neutral-600">{center.code}</p>
                    </div>
                    <div className="text-sm font-bold text-b3x-navy-900">
                      R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Header - Mais compacto */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-b3x-navy-900 mb-1">Controle de Custos por Centro</h2>
          <p className="text-neutral-600 text-sm">Gerencie centros de custo e rateio de despesas</p>
        </div>
        
        <div className="flex space-x-2">
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
        </div>
      </div>

      {/* Summary Cards - Totais por tipo de centro de custo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-b3x-lime-100 rounded-lg">
              <Building2 className="w-4 h-4 text-b3x-lime-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-b3x-navy-900 text-sm">Aquisição</h3>
              <p className="text-xs text-neutral-600">{costCentersByType.acquisition.length} centros</p>
            </div>
          </div>
          <div className="text-xl font-bold text-b3x-lime-600">
            R$ {(totalsByType.acquisition / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Building2 className="w-4 h-4 text-success-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-b3x-navy-900 text-sm">Engorda</h3>
              <p className="text-xs text-neutral-600">{costCentersByType.fattening.length} centros</p>
            </div>
          </div>
          <div className="text-xl font-bold text-success-600">
            R$ {(totalsByType.fattening / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-info-100 rounded-lg">
              <Building2 className="w-4 h-4 text-info-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-b3x-navy-900 text-sm">Administrativo</h3>
              <p className="text-xs text-neutral-600">{costCentersByType.administrative.length} centros</p>
            </div>
          </div>
          <div className="text-xl font-bold text-info-600">
            R$ {(totalsByType.administrative / 1000).toFixed(0)}k
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-soft border border-neutral-200/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Building2 className="w-4 h-4 text-warning-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-b3x-navy-900 text-sm">Financeiro</h3>
              <p className="text-xs text-neutral-600">{costCentersByType.financial.length} centros</p>
            </div>
          </div>
          <div className="text-xl font-bold text-warning-600">
            R$ {(totalsByType.financial / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Centros de Custo e Gráfico de Alocação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Lista de Centros de Custo - NOVA VISUALIZAÇÃO */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
          <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Centros de Custo</h3>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {renderCostCenterCards('acquisition')}
            {renderCostCenterCards('fattening')}
            {renderCostCenterCards('administrative')}
            {renderCostCenterCards('financial')}
          </div>
        </div>

        {/* Cost Allocation Chart */}
        <CostAllocationChart selectedCostCenter={selectedCostCenter} />
      </div>

      {/* Filtros e Tabela Detalhada */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 mb-6">
        <div className="p-4 border-b border-neutral-200/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-b3x-navy-900">Tabela Detalhada</h3>
          
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
            
            {/* Filtro de Lote */}
            <select
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Todos os Lotes</option>
              {cattleLots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNumber}
                </option>
              ))}
            </select>
            
            {/* Filtro de Centro */}
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Todos os Centros</option>
              {activeCostCenters.map(center => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
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
          data={detailedCostData}
          columns={detailedColumns}
          itemsPerPage={10}
        />
      </div>

      {/* Filtros e Tabela de Lançamentos */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
        <div className="p-4 border-b border-neutral-200/50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-b3x-navy-900">Lançamentos Financeiros</h3>
          
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
            
            {/* Filtro de Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="payable">A Pagar</option>
              <option value="receivable">A Receber</option>
            </select>
            
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
            
            {/* Filtro de Lote */}
            <select
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Todos os Lotes</option>
              {cattleLots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNumber}
                </option>
              ))}
            </select>
            
            {/* Filtro de Centro */}
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Todos os Centros</option>
              {activeCostCenters.map(center => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <TableWithPagination
          data={filteredExpenses}
          columns={expenseColumns}
          itemsPerPage={10}
        />
      </div>

      {/* Modal de Detalhes de Lançamentos */}
      {showExpenseDetails && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
              <div>
                <h2 className="text-lg font-semibold">Detalhes do Lançamento</h2>
                <p className="text-b3x-navy-200 text-sm mt-1">
                  {selectedExpense.description}
                </p>
              </div>
              <button
                onClick={() => setShowExpenseDetails(false)}
                className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-b3x-navy-900 mb-2 flex items-center">
                    <Calendar className="w-3 h-3 mr-2" />
                    Data e Valor
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Data:</span>
                      <span className="font-medium">{format(selectedExpense.date, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Valor Total:</span>
                      <span className="font-medium">R$ {selectedExpense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Status:</span>
                      <span className={`font-medium ${
                        selectedExpense.paymentStatus === 'paid' ? 'text-success-600' :
                        selectedExpense.paymentStatus === 'overdue' ? 'text-error-600' :
                        'text-warning-600'
                      }`}>
                        {selectedExpense.paymentStatus === 'paid' ? 'Pago' :
                         selectedExpense.paymentStatus === 'overdue' ? 'Vencido' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-b3x-navy-900 mb-2 flex items-center">
                    <FileText className="w-3 h-3 mr-2" />
                    Categoria e Fornecedor
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Categoria:</span>
                      <span className="font-medium capitalize">{selectedExpense.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Fornecedor:</span>
                      <span className="font-medium">{selectedExpense.supplierId || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Nota Fiscal:</span>
                      <span className="font-medium">{selectedExpense.invoiceNumber || 'Não informada'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-b3x-navy-900 mb-2 flex items-center">
                    <PieChart className="w-3 h-3 mr-2" />
                    Alocações
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Tipo:</span>
                      <span className="font-medium">
                        {selectedExpense.allocationType === 'direct' ? 'Direta (Lotes)' : 'Indireta (Centros)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Quantidade:</span>
                      <span className="font-medium">{selectedExpense.allocations.length} alocações</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes das Alocações */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="p-3 bg-neutral-50 border-b border-neutral-200">
                  <h3 className="text-sm font-medium text-b3x-navy-900">Detalhes das Alocações</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50/70 border-b border-neutral-200/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Destino</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Tipo</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Valor</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Percentual</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Método</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/50">
                      {selectedExpense.allocations.map((allocation, index) => {
                        // Obter nome do destino
                        let destinationName = '';
                        if (allocation.targetType === 'lot') {
                          const lot = cattleLots.find(l => l.id === allocation.targetId);
                          destinationName = lot ? `Lote ${lot.lotNumber}` : 'Lote desconhecido';
                        } else {
                          const center = costCenters.find(cc => cc.id === allocation.targetId);
                          destinationName = center ? center.name : 'Centro desconhecido';
                        }
                        
                        // Mapear método para texto legível
                        const methodMap = {
                          'manual_value': 'Valor Manual',
                          'percentage_allocation': 'Percentual',
                          'equal_split': 'Divisão Igual'
                        };
                        
                        return (
                          <tr key={index} className="hover:bg-neutral-50/50">
                            <td className="px-3 py-2 text-xs text-neutral-700">{destinationName}</td>
                            <td className="px-3 py-2 text-xs text-neutral-700">
                              {allocation.targetType === 'lot' ? 'Lote' : 'Centro de Custo'}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-b3x-navy-900">
                              R$ {allocation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs text-neutral-700">
                              {allocation.percentage.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2 text-xs text-neutral-700">
                              {methodMap[allocation.allocationMethod as keyof typeof methodMap]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setShowExpenseDetails(false)}
                  className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  className="px-4 py-1.5 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-all duration-200 shadow-soft text-sm"
                >
                  Editar Lançamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      <CostCenterForm
        isOpen={showCostCenterForm}
        onClose={() => setShowCostCenterForm(false)}
      />

      <ExpenseAllocationForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
      />
    </div>
  );
};