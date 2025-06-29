import React, { useState } from 'react';
import { Eye, Edit, Calculator, Trash2, DollarSign, Search, Filter, Calendar, MapPin, User, Scale, AlertTriangle, Home, Clock, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { LotDetailModal } from './LotDetailModal';
import { LotEditModal } from './LotEditModal';
import { SaleSimulationModal } from './SaleSimulationModal';
import { SaleRecordForm } from '../Forms/SaleRecordForm';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Portal } from '../Common/Portal';
import { CattleLot } from '../../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const LotsTable: React.FC = () => {
  const { cattleLots, purchaseOrders, partners, loteCurralLinks, calculateLotCostsByCategory, deleteCattleLot, cycles } = useAppStore();
  const [selectedLot, setSelectedLot] = useState<CattleLot | null>(null);
  const [editLot, setEditLot] = useState<CattleLot | null>(null);
  const [simulationLot, setSimulationLot] = useState<CattleLot | null>(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleLotId, setSaleLotId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLotId, setDeleteLotId] = useState<string>('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [penFilter, setPenFilter] = useState<string>('');

  // FILTRO ATUALIZADO: Mostrar todos os lotes (pendentes e ativos)
  const allLots = cattleLots.filter(lot => {
    const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
    return order !== undefined;
  });
  
  // Aplicar filtros
  const filteredLots = allLots.filter(lot => {
    // Filtro de pesquisa
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
      const vendor = order ? partners.find(p => p.id === order.vendorId) : null;
      
      if (
        !lot.lotNumber.toLowerCase().includes(searchLower) &&
        !(order?.city?.toLowerCase().includes(searchLower)) &&
        !(vendor?.name?.toLowerCase().includes(searchLower))
      ) {
        return false;
      }
    }
    
    // Filtro de status
    if (statusFilter !== 'all') {
      const order = purchaseOrders.find(o => o.id === lot.purchaseOrderId);
      const isPending = order && (order.status === 'order' || order.status === 'payment_validation');
      
      if (statusFilter === 'active' && isPending) return false;
      if (statusFilter === 'sold' && lot.status !== 'sold') return false;
    }
    
    // Filtro de curral
    if (penFilter) {
      const penNumbers = getPenNumbers(lot.id);
      if (!penNumbers.includes(penFilter)) {
        return false;
      }
    }
    
    return true;
  });

  const getOrderData = (purchaseOrderId: string) => {
    const order = purchaseOrders.find(o => o.id === purchaseOrderId);
    const vendor = order ? partners.find(p => p.id === order.vendorId) : null;
    return { order, vendor };
  };

  const calculateWeightLoss = (lot: CattleLot) => {
    const { order } = getOrderData(lot.purchaseOrderId);
    if (!order) return { kg: 0, percentage: 0 };
    const lossKg = order.totalWeight - lot.entryWeight;
    const lossPercentage = order.totalWeight > 0 ? (lossKg / order.totalWeight) * 100 : 0;
    return { kg: lossKg, percentage: lossPercentage };
  };

  const calculateCostPerArroba = (lot: CattleLot) => {
    const costs = calculateLotCostsByCategory(lot.id);
    const currentWeight = lot.entryWeight;
    
    // Considerar R.C.% para o cálculo
    const { order } = getOrderData(lot.purchaseOrderId);
    const rcPercentage = order?.rcPercentage || 50;
    const carcassWeight = currentWeight * (rcPercentage / 100);
    const arrobas = carcassWeight / 15;
    
    return arrobas > 0 ? costs.total / arrobas : 0;
  };

  const getPenNumbers = (lotId: string) => {
    const links = loteCurralLinks.filter(link => 
      link.loteId === lotId && link.status === 'active'
    );
    return links.map(link => link.curralId);
  };
  
  // Calcular dias em confinamento
  const getDaysInConfinement = (lot: CattleLot) => {
    return Math.floor((new Date().getTime() - lot.entryDate.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  // Calcular peso médio por animal
  const getAverageWeight = (lot: CattleLot) => {
    return lot.entryQuantity > 0 ? lot.entryWeight / lot.entryQuantity : 0;
  };

  const handleViewLot = (lot: CattleLot) => {
    setSelectedLot(lot);
  };

  const handleEditLot = (lot: CattleLot) => {
    setEditLot(lot);
  };

  const handleCalculateLot = (lot: CattleLot) => {
    setSimulationLot(lot);
  };

  const handleSaleLot = (lotId: string) => {
    setSaleLotId(lotId);
    setShowSaleForm(true);
  };

  const handleDeleteLot = (lotId: string) => {
    setDeleteLotId(lotId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLot = () => {
    deleteCattleLot(deleteLotId);
    setDeleteLotId('');
    setShowDeleteConfirm(false);
  };
  
  // Obter lista de currais únicos para o filtro
  const uniquePens = Array.from(new Set(
    allLots.flatMap(lot => getPenNumbers(lot.id))
  )).filter(pen => pen !== '');

  if (allLots.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">🐄</span>
        </div>
        <h3 className="text-lg font-medium text-b3x-navy-900 mb-2">Nenhum lote encontrado</h3>
        <p className="text-neutral-600 text-sm mb-4">
          Os lotes aparecem aqui após a criação de uma ordem de compra.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de Filtros */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-b3x-navy-900">Filtros:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar lotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent w-48"
              />
            </div>
            
            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="sold">Vendidos</option>
            </select>
            
            {/* Filtro de Curral */}
            <select
              value={penFilter}
              onChange={(e) => setPenFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="">Todos os Currais</option>
              {uniquePens.map(pen => (
                <option key={pen} value={pen}>Curral {pen}</option>
              ))}
            </select>
            
            {/* Contagem de Resultados */}
            <div className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm">
              {filteredLots.length} lote{filteredLots.length !== 1 ? 's' : ''} encontrado{filteredLots.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50/70 border-b border-neutral-200/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Data Compra
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Nº Lote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Curral(is)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Peso Médio/Quebra
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Custo R$/@ Conf.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Mortes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Dias Conf.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-neutral-200/50">
              {filteredLots.map((lot) => {
                const { order, vendor } = getOrderData(lot.purchaseOrderId);
                const isPending = order && (order.status === 'order' || order.status === 'payment_validation');
                const weightLoss = calculateWeightLoss(lot);
                const costPerArroba = calculateCostPerArroba(lot);
                const penNumbers = getPenNumbers(lot.id);
                const daysInConfinement = isPending ? 0 : getDaysInConfinement(lot);
                const averageWeight = isPending ? (order.totalWeight / order.quantity) : getAverageWeight(lot);
                
                return (
                  <tr key={lot.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {order ? format(order.date, 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {order?.city || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-b3x-navy-900 text-sm">{lot.lotNumber}</div>
                      <div className="text-xs text-success-600 font-medium">
                        {isPending ? order.quantity : lot.entryQuantity} animais
                      </div>
                      {(() => {
                        const cycle = order && cycles.find(c => c.id === order.cycleId);
                        return cycle ? (
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {cycle.name}
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!isPending && penNumbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {penNumbers.map(pen => (
                            <span key={pen} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-100 text-info-800">
                              Curral {pen}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-xs">
                          {isPending ? 'Aguardando' : 'Não alocado'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-b3x-navy-900">
                        {isPending ? '-' : `${averageWeight.toFixed(1)} kg/animal`}
                      </div>
                      {!isPending && weightLoss.kg !== 0 && (
                        <div className="flex items-center text-xs text-error-600">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {weightLoss.percentage.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-b3x-navy-900">
                      {isPending ? '-' : `R$ ${costPerArroba.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-error-600">
                        {isPending ? '-' : `${lot.deaths} animais`}
                      </div>
                      {!isPending && lot.deaths > 0 && (
                        <div className="text-xs text-neutral-600">
                          {((lot.deaths / lot.entryQuantity) * 100).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-b3x-navy-900">
                      {isPending ? '-' : `${daysInConfinement} dias`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        isPending ? 'bg-yellow-100 text-yellow-800' : 
                        lot.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                        'bg-success-100 text-success-800'
                      )}>
                        {isPending ? 'Pendente' : 
                         lot.status === 'sold' ? 'Vendido' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        {!isPending && (
                          <>
                            <button
                              onClick={() => handleViewLot(lot)}
                              className="text-info-600 hover:text-info-800 transition-colors p-1.5 rounded hover:bg-info-50"
                              title="Ver Ficha Completa"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleEditLot(lot)}
                              className="text-neutral-600 hover:text-neutral-800 transition-colors p-1.5 rounded hover:bg-neutral-50"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleCalculateLot(lot)}
                              className="text-b3x-lime-600 hover:text-b3x-lime-800 transition-colors p-1.5 rounded hover:bg-b3x-lime-50"
                              title="Simular Venda"
                            >
                              <Calculator className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleSaleLot(lot.id)}
                              className="text-success-600 hover:text-success-800 transition-colors p-1.5 rounded hover:bg-success-50"
                              title="Registrar Venda/Abate"
                            >
                              <DollarSign className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLot(lot.id)}
                              className="text-error-600 hover:text-error-800 transition-colors p-1.5 rounded hover:bg-error-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginação (se necessário) */}
        {filteredLots.length > 10 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
                Anterior
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50">
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-neutral-700">
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">{Math.min(10, filteredLots.length)}</span> de{' '}
                  <span className="font-medium">{filteredLots.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50">
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50">
                    <span className="sr-only">Próximo</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedLot && (
        <Portal>
          <LotDetailModal
            lot={selectedLot}
            isOpen={!!selectedLot}
            onClose={() => setSelectedLot(null)}
          />
        </Portal>
      )}

      {editLot && (
        <Portal>
          <LotEditModal
            lot={editLot}
            isOpen={!!editLot}
            onClose={() => setEditLot(null)}
          />
        </Portal>
      )}

      {simulationLot && (
        <Portal>
          <SaleSimulationModal
            lot={simulationLot}
            isOpen={!!simulationLot}
            onClose={() => setSimulationLot(null)}
          />
        </Portal>
      )}

      {showSaleForm && (
        <Portal>
          <SaleRecordForm
            isOpen={showSaleForm}
            onClose={() => setShowSaleForm(false)}
            lotId={saleLotId}
          />
        </Portal>
      )}

      {showDeleteConfirm && (
        <Portal>
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDeleteLot}
            title="Excluir Lote"
            message={`Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            type="danger"
          />
        </Portal>
      )}
    </>
  );
};