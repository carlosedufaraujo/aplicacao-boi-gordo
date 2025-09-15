import React, { useState, useEffect } from 'react';
import { LotsTable } from './LotsTable';
import { PenMap } from './PenMap';
import { List, Map, Package, DollarSign, TrendingDown, AlertTriangle, ShoppingCart, Layers, Activity } from 'lucide-react';
import { clsx } from 'clsx';

import { useCattlePurchases, useCattlePurchases } from '../../hooks/useSupabaseData';

export const Lots: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lots' | 'map'>('overview');
  // Removido useAppStoreWithAPI - agora gerenciado pelo App.tsx
  const { cattlePurchases, loading: lotsLoading } = useCattlePurchases();
  const { cattlePurchases, loading: ordersLoading } = useCattlePurchases();

  // Calcular métricas
  const activeLots = cattlePurchases.filter(lot => lot.status === 'ACTIVE');
  const pendingLots = cattlePurchases.filter(lot => {
    const order = cattlePurchases.find(o => o.id === lot.purchaseId);
    return order && (order.status === 'PENDING' || order.status === 'PAYMENT_VALIDATING');
  });
  
  // Quantidade de Animais Atual
  const totalAnimalsActive = activeLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
  
  // Quantidade de Animais Pendentes
  const totalAnimalsPending = pendingLots.reduce((sum, lot) => {
    const order = cattlePurchases.find(o => o.id === lot.purchaseId);
    return sum + (order?.animalCount || 0);
  }, 0);
  
  // Quantidade de Lotes de Compra
  const totalActiveLots = activeLots.length;
  
  // Calcular métricas médias
  const metrics = activeLots.reduce((acc, lot) => {
    const order = cattlePurchases.find(o => o.id === lot.purchaseId);
    if (!order) return acc;
    
    // Calcular arrobas com R.C.%
    const carcassWeight = order.totalWeight * (order.carcassYield / 100);
    const arrobas = carcassWeight / 15;
    const animalValue = arrobas * order.pricePerArroba;
    const totalCost = animalValue + order.commission + order.otherCosts;
    const costPerArroba = arrobas > 0 ? totalCost / arrobas : 0;
    
    // Quebra de peso
    const currentWeightLoss = lot.entryWeight < order.totalWeight ? 
      ((order.totalWeight - lot.entryWeight) / order.totalWeight) * 100 : 0;
    
    // Mortes em transporte
    const transportDeaths = lot.deathCount || 0;
    const transportDeathRate = order.animalCount > 0 ? (transportDeaths / order.animalCount) * 100 : 0;
    
    return {
      totalCostPerArroba: acc.totalCostPerArroba + costPerArroba,
      totalWeightLoss: acc.totalWeightLoss + currentWeightLoss,
      totalTransportDeathRate: acc.totalTransportDeathRate + transportDeathRate,
      totalPricePerArroba: acc.totalPricePerArroba + order.pricePerArroba,
      count: acc.count + 1
    };
  }, { totalCostPerArroba: 0, totalWeightLoss: 0, totalTransportDeathRate: 0, totalPricePerArroba: 0, count: 0 });
  
  const avgCostPerArroba = metrics.count > 0 ? metrics.totalCostPerArroba / metrics.count : 0;
  const avgWeightLoss = metrics.count > 0 ? metrics.totalWeightLoss / metrics.count : 0;
  const avgTransportDeathRate = metrics.count > 0 ? metrics.totalTransportDeathRate / metrics.count : 0;
  const avgPricePerArroba = metrics.count > 0 ? metrics.totalPricePerArroba / metrics.count : 0;

  // Loading geral
  const isLoading = lotsLoading || ordersLoading;

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
        <div className="space-y-4">
          {/* Cards de Informações - Mais compactos e organizados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-3">Métricas do Confinamento</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Quantidade de Animais Atual */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-4 h-4 text-b3x-lime-600" />
                  <span className="text-xs font-medium text-neutral-500">Atual</span>
                </div>
                <p className="text-2xl font-bold text-b3x-navy-900">{totalAnimalsActive.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-neutral-600 mt-1">Animais Ativos</p>
                {totalAnimalsPending > 0 && (
                  <p className="text-xs text-yellow-600 font-medium mt-1">
                    +{totalAnimalsPending.toLocaleString('pt-BR')} pendentes
                  </p>
                )}
              </div>

              {/* Quantidade de Lotes */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-4 h-4 text-info-600" />
                  <span className="text-xs font-medium text-neutral-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-b3x-navy-900">{totalActiveLots}</p>
                <p className="text-xs text-neutral-600 mt-1">Lotes Ativos</p>
                {pendingLots.length > 0 && (
                  <p className="text-xs text-yellow-600 font-medium mt-1">
                    +{pendingLots.length} pendentes
                  </p>
                )}
              </div>

              {/* Preço Médio (R$/@) */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-4 h-4 text-success-600" />
                  <span className="text-xs font-medium text-neutral-500">Compra</span>
                </div>
                <p className="text-2xl font-bold text-b3x-navy-900">
                  {avgPricePerArroba.toFixed(0)}
                </p>
                <p className="text-xs text-neutral-600 mt-1">R$/@ Médio</p>
              </div>

              {/* Quebra de Peso Média */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-4 h-4 text-warning-600" />
                  <span className="text-xs font-medium text-neutral-500">Perda</span>
                </div>
                <p className="text-2xl font-bold text-b3x-navy-900">{avgWeightLoss.toFixed(1)}%</p>
                <p className="text-xs text-neutral-600 mt-1">Quebra Peso</p>
              </div>

              {/* Mortes em Transporte */}
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-4 h-4 text-error-600" />
                  <span className="text-xs font-medium text-neutral-500">Mortalidade</span>
                </div>
                <p className="text-2xl font-bold text-b3x-navy-900">{avgTransportDeathRate.toFixed(1)}%</p>
                <p className="text-xs text-neutral-600 mt-1">Transporte</p>
              </div>
            </div>
          </div>

          {/* Resumo dos Lotes Ativos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-3">Lotes em Confinamento</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Lote</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Animais</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Dias Conf.</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Currais</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Peso Médio</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-neutral-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cattlePurchases.slice(0, 5).map((lot) => {
                    const order = cattlePurchases.find(o => o.id === lot.purchaseId);
                    const isPending = order && (order.status === 'PENDING' || order.status === 'PAYMENT_VALIDATING');
                    const entryDate = lot.entryDate instanceof Date ? lot.entryDate : new Date(lot.entryDate);
                    const daysConfined = Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                    const avgWeight = lot.entryQuantity > 0 ? lot.entryWeight / lot.entryQuantity : 0;
                    const currais = lot.curralLinks ? lot.curralLinks.map(link => link.curralId).join(', ') : '-';
                    
                    return (
                      <tr key={lot.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-2 px-3 text-sm font-medium text-b3x-navy-900">{lot.lotNumber}</td>
                        <td className="py-2 px-3 text-sm text-neutral-700">
                          {isPending ? order?.animalCount || 0 : lot.currentQuantity}
                        </td>
                        <td className="py-2 px-3 text-sm text-neutral-700">{isPending ? '-' : daysConfined}</td>
                        <td className="py-2 px-3 text-sm text-neutral-700">{currais || '-'}</td>
                        <td className="py-2 px-3 text-sm text-neutral-700">
                          {isPending ? '-' : `${avgWeight.toFixed(0)} kg`}
                        </td>
                        <td className="py-2 px-3">
                          <span className={clsx(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-success-100 text-success-800'
                          )}>
                            {isPending ? 'Pendente' : 'Ativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cattlePurchases.length > 5 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setActiveTab('lots')}
                    className="text-sm text-b3x-lime-600 hover:text-b3x-lime-700 font-medium"
                  >
                    Ver todos os {cattlePurchases.length} lotes →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Gráficos e análises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-3">Distribuição por Curral</h3>
              <div className="flex items-center justify-center h-48 text-neutral-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-3">Evolução de Peso</h3>
              <div className="flex items-center justify-center h-48 text-neutral-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Gráfico em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lots' && <LotsTable />}
      {activeTab === 'map' && <PenMap />}
    </div>
  );
};
