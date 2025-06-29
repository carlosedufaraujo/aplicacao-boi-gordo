import React, { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { LatestMovements } from './LatestMovements';
import { useAppStore } from '../../stores/useAppStore';
import { Plus, ShoppingCart, Users, Home, Heart, Scale, ArrowRight, DollarSign, CreditCard, Building2, Clock, TrendingDown, AlertTriangle } from 'lucide-react';
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
  const { kpis, cattleLots, setCurrentPage, updateKPIs, purchaseOrders, clearAllTestData } = useAppStore();
  
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
  
  // Calcular custo total de aquisição
  const [totalAcquisitionCost, setTotalAcquisitionCost] = useState<number>(0);
  const [averagePurchaseCostPerArroba, setAveragePurchaseCostPerArroba] = useState<number>(0);

  // Atualizar KPIs e calcular custo total de aquisição quando o componente montar
  useEffect(() => {
    updateKPIs();
    
    // Calcular custo total de aquisição
    const acquisitionCost = purchaseOrders.reduce((total, order) => {
      const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = order.totalWeight * (rcPercentage / 100);
      const arrobas = carcassWeight / 15;
      const animalValue = arrobas * order.pricePerArroba;
      const orderTotal = animalValue + order.commission + order.taxes + order.otherCosts;
      return total + orderTotal;
    }, 0);
    
    setTotalAcquisitionCost(acquisitionCost);
    
    // Calcular custo médio de compra por arroba
    const totalArrobas = purchaseOrders.reduce((total, order) => {
      const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
      const carcassWeight = order.totalWeight * (rcPercentage / 100);
      const arrobas = carcassWeight / 15;
      return total + arrobas;
    }, 0);
    
    if (totalArrobas > 0) {
      setAveragePurchaseCostPerArroba(acquisitionCost / totalArrobas);
    }
  }, [updateKPIs, purchaseOrders]);

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
    <div className="p-4 space-y-4">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 rounded-xl p-4 text-white shadow-soft-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">Bem-vindo ao B3X CEAC</h1>
            <p className="text-b3x-navy-200 text-sm">Gestão completa do ciclo de produção e engorda de bovinos</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Botão temporário para limpar dados de teste */}
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar TODOS os dados de teste do sistema? Esta ação não pode ser desfeita.')) {
                  clearAllTestData();
                  alert('Todos os dados de teste foram removidos!');
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Limpar Dados de Teste
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-b3x-lime-400 to-b3x-lime-600 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-lg font-bold text-b3x-navy-900">B3X</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs - Grid mais compacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* KPI 1: Animais Confinados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Animais Confinados</p>
                <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">{kpis[0]?.value || "0"}</p>
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
                <p className="text-xs font-medium text-neutral-600 mb-1 leading-tight h-8">Custo Total Aquisição</p>
                <p className="text-xl font-bold text-b3x-navy-900 mb-1 truncate">
                  R$ {totalAcquisitionCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                
                <div className="flex items-center mt-1">
                  <span className="text-xs text-neutral-500 truncate">Compra, Comissão, Frete</span>
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

        {/* Ações Rápidas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 hover:shadow-soft-lg transition-all duration-200">
          <div className="p-4 border-b border-neutral-200/50">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Ações Rápidas</h3>
            <p className="text-sm text-neutral-600 mt-1">Acesse as principais funcionalidades do sistema</p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Compras */}
              <button 
                onClick={() => setShowPurchaseOrderForm(true)}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-lg border border-b3x-lime-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-b3x-lime-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Nova Ordem</span>
                <span className="text-xs text-neutral-600">de Compra</span>
              </button>
              
              {/* Vendedor */}
              <button 
                onClick={() => handleNewPartner('vendor')}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-info-50 to-info-100 rounded-lg border border-info-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-info-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Novo</span>
                <span className="text-xs text-neutral-600">Vendedor</span>
              </button>
              
              {/* Curral */}
              <button 
                onClick={() => setShowPenForm(true)}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-success-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Novo</span>
                <span className="text-xs text-neutral-600">Curral</span>
              </button>
              
              {/* Protocolo Sanitário */}
              <button 
                onClick={handleHealthRecord}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Protocolo</span>
                <span className="text-xs text-neutral-600">Sanitário</span>
              </button>
              
              {/* Pesagem */}
              <button 
                onClick={handleWeightReading}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg border border-warning-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-warning-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Nova</span>
                <span className="text-xs text-neutral-600">Pesagem</span>
              </button>
              
              {/* Movimentação */}
              <button 
                onClick={handleLotMovement}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg border border-neutral-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-neutral-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Movimentação</span>
                <span className="text-xs text-neutral-600">de Curral</span>
              </button>
              
              {/* Venda/Abate */}
              <button 
                onClick={handleSaleRecord}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-success-50 to-success-100 rounded-lg border border-success-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-success-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Registrar</span>
                <span className="text-xs text-neutral-600">Venda/Abate</span>
              </button>
              
              {/* Conta Pagadora */}
              <button 
                onClick={() => setShowPayerAccountForm(true)}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-info-50 to-info-100 rounded-lg border border-info-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-info-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Nova Conta</span>
                <span className="text-xs text-neutral-600">Pagadora</span>
              </button>
              
              {/* Centro de Custo */}
              <button 
                onClick={() => navigateTo('cost-centers')}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg border border-warning-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-warning-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Centro de</span>
                <span className="text-xs text-neutral-600">Custo</span>
              </button>
              
              {/* Pipeline */}
              <button 
                onClick={() => navigateTo('pipeline')}
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-b3x-navy-50 to-b3x-navy-100 rounded-lg border border-b3x-navy-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-10 h-10 bg-b3x-navy-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-b3x-navy-900">Pipeline</span>
                <span className="text-xs text-neutral-600">de Compras</span>
              </button>
            </div>
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