import React, { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { LatestMovements } from './LatestMovements';
import { usePartnersApi } from '../../hooks/api/usePartnersApi';
import { useCattleLotsApi } from '../../hooks/api/useCattleLotsApi';
import { usePurchaseOrdersApi } from '../../hooks/api/usePurchaseOrdersApi';
import { useExpensesApi } from '../../hooks/api/useExpensesApi';
import { useRevenuesApi } from '../../hooks/api/useRevenuesApi';
import { Plus, ShoppingCart, Users, Home, Heart, Scale, ArrowRight, DollarSign, CreditCard, Building2, Clock, TrendingDown, AlertTriangle, Truck } from 'lucide-react';
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';
import { PartnerForm } from '../Forms/PartnerForm';
import { PenRegistrationForm } from '../Forms/PenRegistrationForm';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { WeightReadingForm } from '../Forms/WeightReadingForm';
import { LotMovementForm } from '../Forms/LotMovementForm';
import { SaleRecordForm } from '../Forms/SaleRecordForm';
import { PayerAccountForm } from '../Forms/PayerAccountForm';
import { Portal } from '../Common/Portal';
import { CostAllocationPieChart } from './CostAllocationPieChart';
import { HerdValueChart } from './HerdValueChart';
import { PurchaseByStateChart } from './PurchaseByStateChart';
import { PurchaseByBrokerChart } from './PurchaseByBrokerChart';

export const Dashboard: React.FC = () => {
  // Removido useAppStoreWithAPI - agora gerenciado pelo App.tsx
  
  // Hooks da Nova Arquitetura API
  const { cattleLots, loading: lotsLoading } = useCattleLotsApi();
  const { purchaseOrders, loading: ordersLoading } = usePurchaseOrdersApi();
  const { partners, loading: partnersLoading } = usePartnersApi();
  const { expenses, loading: expensesLoading } = useExpensesApi();
  const { revenues, loading: revenuesLoading } = useRevenuesApi();
  
  // Estados para controlar a exibição dos formulários
  const [showPurchaseOrderForm, setShowPurchaseOrderForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showPenForm, setShowPenForm] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showPayerAccountForm, setShowPayerAccountForm] = useState(false);
  const [selectedPartnerType, setSelectedPartnerType] = useState<'vendor' | 'broker' | 'slaughterhouse'>('vendor');
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [marketPrice, setMarketPrice] = useState<number>(320);
  
  // Estados para dados calculados
  const [totalAcquisitionCost, setTotalAcquisitionCost] = useState<number>(0);
  const [averagePurchaseCostPerArroba, setAveragePurchaseCostPerArroba] = useState<number>(0);
  const [pendingOrdersValue, setPendingOrdersValue] = useState<number>(0);
  const [confirmedAnimals, setConfirmedAnimals] = useState<number>(0);
  const [pendingAnimals, setPendingAnimals] = useState<number>(0);

  // Calcular dados quando os dados mudarem
  useEffect(() => {
    if (purchaseOrders.length > 0) {
      // Calcular animais confirmados vs pendentes
      const animalsConfirmed = purchaseOrders
        .filter(order => order.status !== 'PENDING')
        .reduce((total, order) => total + order.animalCount, 0);
      
      const animalsPending = purchaseOrders
        .filter(order => order.status === 'PENDING')
        .reduce((total, order) => total + order.animalCount, 0);
      
      setConfirmedAnimals(animalsConfirmed);
      setPendingAnimals(animalsPending);
      
      // Calcular custo total de aquisição - APENAS ORDENS COM PAGAMENTO VALIDADO
      const acquisitionCost = purchaseOrders
        .filter(order => order.status !== 'PENDING') // Excluir ordens ainda não validadas
        .reduce((total, order) => {
          const carcassWeight = order.totalWeight * (order.carcassYield / 100);
          const arrobas = carcassWeight / 15;
          const animalValue = arrobas * order.pricePerArroba;
          const orderTotal = animalValue + order.commission + order.otherCosts;
          return total + orderTotal;
        }, 0);
      
      setTotalAcquisitionCost(acquisitionCost);
      
      // Calcular valor das ordens pendentes (ainda não validadas)
      const pendingValue = purchaseOrders
        .filter(order => order.status === 'PENDING')
        .reduce((total, order) => {
          const carcassWeight = order.totalWeight * (order.carcassYield / 100);
          const arrobas = carcassWeight / 15;
          const animalValue = arrobas * order.pricePerArroba;
          const orderTotal = animalValue + order.commission + order.otherCosts;
          return total + orderTotal;
        }, 0);
      
      setPendingOrdersValue(pendingValue);
      
      // Calcular custo médio de compra por arroba - APENAS ORDENS COM PAGAMENTO VALIDADO
      const totalArrobas = purchaseOrders
        .filter(order => order.status !== 'PENDING') // Excluir ordens ainda não validadas
        .reduce((total, order) => {
          const carcassWeight = order.totalWeight * (order.carcassYield / 100);
          const arrobas = carcassWeight / 15;
          return total + arrobas;
        }, 0);
      
      if (totalArrobas > 0) {
        setAveragePurchaseCostPerArroba(acquisitionCost / totalArrobas);
      }
    }
  }, [purchaseOrders]);

  // Loading geral
  const isLoading = dashboardLoading || lotsLoading || ordersLoading || partnersLoading || expensesLoading || revenuesLoading;

  // Dados do dashboard
  const summary = dashboardData?.summary || {
    totalLots: 0,
    activeLots: 0,
    totalAnimals: 0,
    totalCosts: 0,
    totalExpenses: 0,
    totalRevenues: 0,
    profit: 0,
    activeCycles: 0,
    totalPartners: 0
  };

  // KPIs calculados
  const kpis = {
    totalLots: summary.totalLots,
    activeLots: summary.activeLots,
    totalAnimals: summary.totalAnimals,
    totalCosts: summary.totalCosts,
    totalExpenses: summary.totalExpenses,
    totalRevenues: summary.totalRevenues,
    profit: summary.profit,
    activeCycles: summary.activeCycles,
    totalPartners: summary.totalPartners,
    confirmedAnimals,
    pendingAnimals,
    totalAcquisitionCost,
    averagePurchaseCostPerArroba,
    pendingOrdersValue
  };

  // Dados recentes
  const recentData = dashboardData?.recentData || {
    cattleLots: [],
    purchaseOrders: [],
    expenses: [],
    revenues: []
  };

  // Selecionar o primeiro lote ativo para formulários que precisam de um lote
  const firstLot = cattleLots.find(lot => lot.status === 'active');

  const handleNewPartner = (type: 'vendor' | 'broker' | 'slaughterhouse') => {
    setSelectedPartnerType(type);
    setShowPartnerForm(true);
  };

  const handleHealthRecord = () => {
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setShowHealthForm(true);
    } else {
      alert('Não há lotes ativos para registrar protocolo sanitário');
    }
  };

  const handleWeightReading = () => {
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setShowWeightForm(true);
    } else {
      alert('Não há lotes ativos para registrar pesagem');
    }
  };

  const handleLotMovement = () => {
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setShowMovementForm(true);
    } else {
      alert('Não há lotes ativos para registrar movimentação');
    }
  };

  const handleSaleRecord = () => {
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setShowSaleForm(true);
    } else {
      alert('Não há lotes ativos para registrar venda');
    }
  };

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* KPIs - Grid mais compacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* KPI 1: Animais Confinados */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Animais Ativos</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{confirmedAnimals.toLocaleString('pt-BR')}</p>
              <div className="flex items-center mt-1">
                {pendingAnimals > 0 ? (
                  <span className="text-xs text-warning-600 truncate">
                    + {pendingAnimals.toLocaleString('pt-BR')} pendentes
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 truncate">Em confinamento</span>
                )}
              </div>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <div className="w-4 h-4 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* KPI 2: Média Dia/Confinado */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Média Dia/Confinado</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{kpis[1]?.value || "0"}</p>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <Clock className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
        
        {/* KPI 3: Média Quebra de Peso */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Média Quebra de Peso</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{kpis[2]?.value || "0%"}</p>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
        
        {/* KPI 4: Mortalidade Acumulada */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Mortalidade Acumulada</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{kpis[3]?.value || "0%"}</p>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
        
        {/* KPI 5: Custo Total de Aquisição */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Custo Total Ativo</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">
                R$ {totalAcquisitionCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              
              <div className="flex items-center mt-1">
                {pendingOrdersValue > 0 ? (
                  <span className="text-xs text-warning-600 truncate">
                    + R$ {pendingOrdersValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pendente
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500 truncate">Valores ativos</span>
                )}
              </div>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
        
        {/* KPI 6: Média de Compra (R$/@) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Média de Compra (R$/@)</p>
              <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">
                R$ {averagePurchaseCostPerArroba.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              
              <div className="flex items-center mt-1">
                <span className="text-xs text-neutral-500 truncate">Custo total ÷ Arrobas</span>
              </div>
            </div>
            
            <div className="ml-2 p-2 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg shadow-soft flex-shrink-0">
              <DollarSign className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - 4 gráficos em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CostAllocationPieChart />
        <HerdValueChart marketPrice={marketPrice} setMarketPrice={setMarketPrice} />
        <PurchaseByStateChart />
        <PurchaseByBrokerChart />
      </div>

      {/* Últimas Movimentações de Animais */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 hover:shadow-soft-lg transition-all duration-200">
        <div className="p-4 border-b border-neutral-200/50">
          <h3 className="text-lg font-semibold text-b3x-navy-900">Últimas Movimentações de Animais</h3>
          <p className="text-sm text-neutral-600 mt-1">Acompanhe as últimas ordens de compra e vendas registradas</p>
        </div>
        <div className="p-4">
          <LatestMovements />
        </div>
      </div>

      {/* Formulários em Portal */}
      {showPurchaseOrderForm && (
        <Portal>
          <PurchaseOrderForm
            isOpen={showPurchaseOrderForm}
            onClose={() => setShowPurchaseOrderForm(false)}
          />
        </Portal>
      )}

      {showPartnerForm && (
        <Portal>
          <PartnerForm
            isOpen={showPartnerForm}
            onClose={() => setShowPartnerForm(false)}
            type={selectedPartnerType}
          />
        </Portal>
      )}

      {showPenForm && (
        <Portal>
          <PenRegistrationForm
            isOpen={showPenForm}
            onClose={() => setShowPenForm(false)}
          />
        </Portal>
      )}

      {showHealthForm && (
        <Portal>
          <HealthRecordForm
            isOpen={showHealthForm}
            onClose={() => setShowHealthForm(false)}
            lotId={selectedLotId}
          />
        </Portal>
      )}

      {showWeightForm && (
        <Portal>
          <WeightReadingForm
            isOpen={showWeightForm}
            onClose={() => setShowWeightForm(false)}
            lotId={selectedLotId}
          />
        </Portal>
      )}

      {showMovementForm && (
        <Portal>
          <LotMovementForm
            isOpen={showMovementForm}
            onClose={() => setShowMovementForm(false)}
            lotId={selectedLotId}
          />
        </Portal>
      )}

      {showSaleForm && (
        <Portal>
          <SaleRecordForm
            isOpen={showSaleForm}
            onClose={() => setShowSaleForm(false)}
            lotId={selectedLotId}
          />
        </Portal>
      )}

      {showPayerAccountForm && (
        <Portal>
          <PayerAccountForm
            isOpen={showPayerAccountForm}
            onClose={() => setShowPayerAccountForm(false)}
          />
        </Portal>
      )}
    </div>
  );
};