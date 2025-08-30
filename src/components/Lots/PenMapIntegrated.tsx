import React, { useState } from 'react';
import { usePensApi } from '../../hooks/api/usePensApi';
import { usePenOccupancyApi } from '../../hooks/api/usePenOccupancyApi';
import { useCattleLotsApi } from '../../hooks/api/useCattleLotsApi';
import { Plus, Edit, Trash2, Home, ArrowRightLeft, Scale, Heart, ArrowRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Portal } from '../Common/Portal';
import { toast } from 'sonner';

export const PenMapIntegrated: React.FC = () => {
  const { pens, loading: pensLoading, error: pensError, createPen, updatePen, deletePen, reload: reloadPens } = usePensApi();
  const { 
    occupancyData, 
    loading: occupancyLoading, 
    totalPens,
    availablePens,
    partialPens,
    fullPens,
    maintenancePens,
    totalCapacity,
    totalOccupancy,
    averageOccupancyRate,
    reload: reloadOccupancy 
  } = usePenOccupancyApi();
  const { cattleLots } = useCattleLotsApi();
  
  const [selectedPen, setSelectedPen] = useState<string | null>(null);
  const [showPenForm, setShowPenForm] = useState(false);
  const [editingPen, setEditingPen] = useState<any>(null);
  
  const loading = pensLoading || occupancyLoading;
  const error = pensError || '';

  const handlePenClick = (penId: string) => {
    const pen = pens.find(p => p.id === penId);
    const occupancy = occupancyData.find(o => o.penId === penId);
    
    if (pen && occupancy && occupancy.status !== 'available') {
      setSelectedPen(penId);
    } else {
      // Abrir formulário de alocação
      handleEditPen(pen);
    }
  };

  const handleAddPen = () => {
    setEditingPen(null);
    setShowPenForm(true);
  };

  const handleEditPen = (pen: any) => {
    setEditingPen(pen);
    setShowPenForm(true);
  };

  const handleDeletePen = async (penId: string) => {
    if (confirm('Tem certeza que deseja excluir este curral?')) {
      const success = await deletePen(penId);
      if (success) {
        toast.success('Curral excluído com sucesso');
        reloadPens();
        reloadOccupancy();
      }
    }
  };

  const handleRefresh = () => {
    reloadPens();
    reloadOccupancy();
    toast.success('Dados atualizados');
  };

  const getPenStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'partial':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200';
      case 'maintenance':
        return 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200';
      case 'available':
      default:
        return 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50';
    }
  };

  // Agrupar currais por localização
  const pensByLocation = pens.reduce((acc, pen) => {
    const location = pen.location || 'Setor Principal';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(pen);
    return acc;
  }, {} as Record<string, typeof pens>);

  // Obter lotes em um curral específico
  const getLotsInPen = (penId: string) => {
    return cattleLots.filter(lot => lot.penId === penId && lot.status === 'ACTIVE');
  };

  const selectedPenData = selectedPen ? pens.find(p => p.id === selectedPen) : null;
  const selectedPenOccupancy = selectedPen ? occupancyData.find(o => o.penId === selectedPen) : null;

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-b3x-lime-500"></div>
          <span className="ml-3 text-neutral-600">Carregando mapa de currais...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-8">
        <div className="text-center text-red-600">
          <p>Erro ao carregar dados: {error}</p>
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-b3x-lime-500 text-white rounded-lg hover:bg-b3x-lime-600">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
        {/* Header com estatísticas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Mapa de Currais</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleAddPen}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft text-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Curral</span>
              </button>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3 text-center border border-neutral-300">
              <div className="text-xl font-bold text-neutral-800">{totalPens}</div>
              <div className="text-xs text-neutral-700">Total Currais</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
              <div className="text-xl font-bold text-green-700">{availablePens}</div>
              <div className="text-xs text-green-600">Disponíveis</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 text-center border border-emerald-200">
              <div className="text-xl font-bold text-emerald-700">{partialPens}</div>
              <div className="text-xs text-emerald-600">Parcialmente Ocupados</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
              <div className="text-xl font-bold text-red-700">{fullPens}</div>
              <div className="text-xs text-red-600">Lotados</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center border border-amber-200">
              <div className="text-xl font-bold text-amber-700">{maintenancePens}</div>
              <div className="text-xs text-amber-600">Manutenção</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
              <div className="text-xl font-bold text-blue-700">{totalOccupancy}</div>
              <div className="text-xs text-blue-600">Total Animais</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center border border-purple-200">
              <div className="text-xl font-bold text-purple-700">{totalCapacity}</div>
              <div className="text-xs text-purple-600">Capacidade Total</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 text-center border border-indigo-200">
              <div className="text-xl font-bold text-indigo-700">{averageOccupancyRate.toFixed(1)}%</div>
              <div className="text-xs text-indigo-600">Taxa Média</div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-neutral-600">Disponível</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-300 rounded"></div>
              <span className="text-neutral-600">Parcialmente Ocupado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-neutral-600">Lotado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-100 border-2 border-amber-300 rounded"></div>
              <span className="text-neutral-600">Manutenção</span>
            </div>
          </div>
        </div>

        {/* Grid de Currais por Localização */}
        <div className="space-y-6">
          {Object.entries(pensByLocation).map(([location, locationPens]) => (
            <div key={location} className="bg-neutral-50/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2 text-neutral-600" />
                {location}
                <span className="ml-2 text-xs font-normal text-neutral-500">({locationPens.length} currais)</span>
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-3">
                {locationPens.map((pen) => {
                  const occupancy = occupancyData.find(o => o.penId === pen.id);
                  const isSelected = selectedPen === pen.id;
                  
                  return (
                    <div
                      key={pen.id}
                      className={clsx(
                        'aspect-square border-2 rounded-lg p-1 sm:p-2 transition-all duration-200 cursor-pointer relative group',
                        getPenStatusColor(occupancy?.status || 'available'),
                        isSelected && 'ring-2 ring-b3x-lime-500 ring-offset-2 scale-105'
                      )}
                      onClick={() => handlePenClick(pen.id)}
                      title={`Curral ${pen.penNumber} - ${occupancy?.currentOccupancy || 0}/${pen.capacity} animais`}
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-xs sm:text-sm font-bold text-current">{pen.penNumber}</div>
                        
                        {occupancy && occupancy.currentOccupancy > 0 && (
                          <div className="mt-1">
                            <div className="text-[10px] font-medium">{occupancy.currentOccupancy}/{pen.capacity}</div>
                            <div className="text-[9px] text-current/70">{occupancy.occupancyRate.toFixed(0)}%</div>
                          </div>
                        )}
                      </div>

                      {/* Indicador de status */}
                      {occupancy && occupancy.status === 'full' && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      {occupancy && occupancy.status === 'partial' && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                      )}

                      {/* Botões de ação (aparecem no hover) */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPen(pen);
                          }}
                          className="p-1 bg-white/90 rounded hover:bg-white transition-colors"
                          title="Editar curral"
                        >
                          <Edit className="w-3 h-3 text-neutral-700" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePen(pen.id);
                          }}
                          className="p-1 bg-white/90 rounded hover:bg-white transition-colors"
                          title="Excluir curral"
                        >
                          <Trash2 className="w-3 h-3 text-error-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {pens.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <p>Nenhum curral cadastrado.</p>
              <button 
                onClick={handleAddPen}
                className="mt-4 px-4 py-2 bg-b3x-lime-500 text-white rounded-lg hover:bg-b3x-lime-600"
              >
                Cadastrar primeiro curral
              </button>
            </div>
          )}
        </div>

        {/* Detalhes do Curral Selecionado */}
        {selectedPen && selectedPenData && selectedPenOccupancy && (
          <div className="mt-4 p-3 bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-lg border border-b3x-lime-200">
            <h4 className="font-semibold text-b3x-navy-900 mb-2 text-sm">
              Detalhes do Curral {selectedPenData.penNumber}
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-600">Ocupação:</span>
                  <div className="font-medium text-b3x-navy-900">
                    {selectedPenOccupancy.currentOccupancy}/{selectedPenData.capacity} animais
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Taxa de Ocupação:</span>
                  <div className="font-medium text-b3x-navy-900">
                    {selectedPenOccupancy.occupancyRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Status:</span>
                  <div className="font-medium text-b3x-navy-900 capitalize">
                    {selectedPenOccupancy.status === 'available' ? 'Disponível' :
                     selectedPenOccupancy.status === 'partial' ? 'Parcialmente Ocupado' :
                     selectedPenOccupancy.status === 'full' ? 'Lotado' : 'Manutenção'}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-600">Localização:</span>
                  <div className="font-medium text-b3x-navy-900">
                    {selectedPenData.location || 'Setor Principal'}
                  </div>
                </div>
              </div>

              {/* Lotes no Curral */}
              {(() => {
                const lotsInPen = getLotsInPen(selectedPen);
                if (lotsInPen.length === 0) return null;
                
                return (
                  <div>
                    <h5 className="font-medium text-b3x-navy-900 mb-2 text-xs">Lotes neste Curral:</h5>
                    <div className="space-y-2">
                      {lotsInPen.map(lot => (
                        <div key={lot.id} className="bg-white/80 rounded p-3 border border-neutral-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-b3x-navy-900 text-sm">Lote {lot.lotNumber}</div>
                              <div className="text-xs text-neutral-600">
                                {lot.currentQuantity} animais • Entrada: {new Date(lot.entryDate).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                              Ativo
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedPen(null)}
                  className="px-3 py-1.5 text-xs bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                >
                  Fechar
                </button>
                
                <button
                  onClick={() => handleEditPen(selectedPenData)}
                  className="px-3 py-1.5 text-xs bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                >
                  Editar Curral
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};