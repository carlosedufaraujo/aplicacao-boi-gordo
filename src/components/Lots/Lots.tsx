import React, { useState, useEffect } from 'react';
import { LotsTable } from './LotsTable';
import { PenMap } from './PenMap';
import { List, Map, Package, DollarSign, TrendingDown, AlertTriangle, ShoppingCart, Calculator, Layers, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../stores/useAppStore';

export const Lots: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lots' | 'map'>('overview');
  const { cattleLots, purchaseOrders, loteCurralLinks } = useAppStore();

  // Calcular métricas
  const activeLots = cattleLots.filter(lot => lot.status === 'active');
  
  // Quantidade de Animais Atual
  const totalAnimalsActive = activeLots.reduce((sum, lot) => sum + lot.entryQuantity - lot.deaths, 0);
  
  // Quantidade de Lotes de Compra
  const totalActiveLots = activeLots.length;
  
  // Calcular métricas médias
  const metrics = activeLots.reduce((acc, lot) => {
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    if (!order) return acc;
    
    // Calcular arrobas com R.C.%
    const rcPercentage = order.rcPercentage || 50;
    const carcassWeight = order.totalWeight * (rcPercentage / 100);
    const arrobas = carcassWeight / 15;
    const animalValue = arrobas * order.pricePerArroba;
    const totalCost = animalValue + order.commission + (order.taxes || 0) + order.otherCosts;
    const costPerArroba = arrobas > 0 ? totalCost / arrobas : 0;
    
    // Quebra de peso
    const weightLoss = lot.entryWeight < order.totalWeight ? 
      ((order.totalWeight - lot.entryWeight) / order.totalWeight) * 100 : 0;
    
    // Mortes em transporte
    const transportDeaths = lot.quantityDifference && lot.quantityDifferenceReason === 'Morte Transporte' 
      ? lot.quantityDifference : 0;
    const transportDeathRate = order.quantity > 0 ? (transportDeaths / order.quantity) * 100 : 0;
    
    return {
      totalCostPerArroba: acc.totalCostPerArroba + costPerArroba,
      totalWeightLoss: acc.totalWeightLoss + weightLoss,
      totalTransportDeathRate: acc.totalTransportDeathRate + transportDeathRate,
      totalPricePerArroba: acc.totalPricePerArroba + order.pricePerArroba,
      count: acc.count + 1
    };
  }, { totalCostPerArroba: 0, totalWeightLoss: 0, totalTransportDeathRate: 0, totalPricePerArroba: 0, count: 0 });
  
  const avgCostPerArroba = metrics.count > 0 ? metrics.totalCostPerArroba / metrics.count : 0;
  const avgWeightLoss = metrics.count > 0 ? metrics.totalWeightLoss / metrics.count : 0;
  const avgTransportDeathRate = metrics.count > 0 ? metrics.totalTransportDeathRate / metrics.count : 0;
  const avgPricePerArroba = metrics.count > 0 ? metrics.totalPricePerArroba / metrics.count : 0;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-b3x-navy-900 mb-1">Gestão de Lotes e Currais</h2>
          <p className="text-neutral-600 text-sm">Visualize e gerencie todos os lotes em confinamento</p>
        </div>
      </div>

      {/* Tabs de navegação */}
      <div className="bg-neutral-100 rounded-lg p-1 mb-6 inline-flex">
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
          onClick={() => setActiveTab('lots')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'lots'
              ? 'bg-white text-b3x-navy-900 shadow-sm'
              : 'text-neutral-600 hover:text-b3x-navy-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <List className="w-4 h-4" />
            <span>Lista de Lotes</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'map'
              ? 'bg-white text-b3x-navy-900 shadow-sm'
              : 'text-neutral-600 hover:text-b3x-navy-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Map className="w-4 h-4" />
            <span>Mapa de Currais</span>
          </div>
        </button>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'overview' && (
        <>
          {/* Cards de Informações */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Quantidade de Animais Atual */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Animais Ativos</p>
                  <p className="text-xl font-bold text-b3x-navy-900">{totalAnimalsActive.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-2 bg-b3x-lime-100 rounded-lg">
                  <Package className="w-4 h-4 text-b3x-lime-600" />
                </div>
              </div>
            </div>

            {/* Quantidade de Lotes */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Lotes Ativos</p>
                  <p className="text-xl font-bold text-b3x-navy-900">{totalActiveLots}</p>
                </div>
                <div className="p-2 bg-info-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-info-600" />
                </div>
              </div>
            </div>

            {/* Preço Médio (R$/@) */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Preço Médio R$/@</p>
                  <p className="text-xl font-bold text-b3x-navy-900">
                    R$ {avgPricePerArroba.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-success-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-success-600" />
                </div>
              </div>
            </div>

            {/* Quebra de Peso Média */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Quebra Peso Média</p>
                  <p className="text-xl font-bold text-b3x-navy-900">{avgWeightLoss.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-warning-100 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-warning-600" />
                </div>
              </div>
            </div>

            {/* Mortes em Transporte */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Mortes Transporte</p>
                  <p className="text-xl font-bold text-b3x-navy-900">{avgTransportDeathRate.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-error-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-error-600" />
                </div>
              </div>
            </div>

            {/* Custo Médio R$/@ */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Custo Médio R$/@</p>
                  <p className="text-xl font-bold text-b3x-navy-900">
                    R$ {avgCostPerArroba.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calculator className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos e análises - placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Distribuição por Curral</h3>
              <div className="flex items-center justify-center h-64 text-neutral-400">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">Evolução de Peso</h3>
              <div className="flex items-center justify-center h-64 text-neutral-400">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'lots' && <LotsTable />}
      {activeTab === 'map' && <PenMap />}
    </div>
  );
};