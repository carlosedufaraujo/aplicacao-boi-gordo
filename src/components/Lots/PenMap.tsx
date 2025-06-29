import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { PenRegistrationForm } from '../Forms/PenRegistrationForm';
import { PenAllocationForm } from '../Forms/PenAllocationForm';
import { PenMovementModal } from './PenMovementModal';
import { Plus, Edit, Trash2, Home, ArrowRightLeft, Scale, Heart, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Portal } from '../Common/Portal';
import { WeightReadingForm } from '../Forms/WeightReadingForm';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { LotMovementForm } from '../Forms/LotMovementForm';

export const PenMap: React.FC = () => {
  const { 
    penStatuses, 
    penRegistrations,
    penAllocations,
    cattleLots,
    getTotalConfinedAnimals, 
    getUnallocatedAnimals,
    deletePenRegistration,
    updatePenRegistration
  } = useAppStore();
  
  const [selectedPen, setSelectedPen] = useState<string | null>(null);
  const [showPenForm, setShowPenForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [showLotMovementForm, setShowLotMovementForm] = useState(false);
  const [editPenNumber, setEditPenNumber] = useState<string>('');
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const totalAnimals = getTotalConfinedAnimals();
  const unallocatedAnimals = getUnallocatedAnimals();
  const occupiedPens = penStatuses.filter(pen => pen.status === 'occupied').length;

  const handlePenClick = (penNumber: string) => {
    const pen = penStatuses.find(p => p.penNumber === penNumber);
    if (pen && pen.status === 'occupied') {
      setSelectedPen(penNumber);
    } else {
      if (unallocatedAnimals > 0) {
        setEditPenNumber(penNumber);
        setShowAllocationForm(true);
      } else {
        setEditPenNumber(penNumber);
        setShowPenForm(true);
      }
    }
  };

  const handleAddPen = () => {
    setEditPenNumber('');
    setShowPenForm(true);
  };

  const handleEditPen = (penNumber: string) => {
    setEditPenNumber(penNumber);
    setShowPenForm(true);
  };

  const handleDeletePen = (penNumber: string) => {
    const penRegistration = penRegistrations.find(pen => pen.penNumber === penNumber);
    if (penRegistration) {
      deletePenRegistration(penRegistration.id);
    }
  };

  const handleMovePen = (penNumber: string) => {
    setEditPenNumber(penNumber);
    setShowMovementModal(true);
  };

  const getPenInfo = (penNumber: string) => {
    return penStatuses.find(pen => pen.penNumber === penNumber);
  };

  const getPenStatusColor = (pen: any) => {
    switch (pen.status) {
      case 'occupied':
        return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200';
      case 'maintenance':
        return 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200';
      case 'quarantine':
        return 'bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200';
      default:
        return 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50';
    }
  };

  // Group pens by sector for better organization
  const pensBySector = penStatuses.reduce((acc, pen) => {
    const penReg = penRegistrations.find(p => p.penNumber === pen.penNumber);
    const sector = penReg?.location || 'Sem Setor';
    
    if (!acc[sector]) {
      acc[sector] = [];
    }
    
    acc[sector].push(pen);
    return acc;
  }, {} as Record<string, typeof penStatuses>);

  // Get lots in selected pen
  const getLotsInPen = (penNumber: string) => {
    const allocations = penAllocations.filter(alloc => alloc.penNumber === penNumber);
    return allocations.map(alloc => {
      const lot = cattleLots.find(l => l.id === alloc.lotId);
      return {
        allocation: alloc,
        lot
      };
    }).filter(item => item.lot);
  };

  // Handle health record for a lot in the pen
  const handleHealthRecord = (lotId: string) => {
    setSelectedLotId(lotId);
    setShowHealthForm(true);
  };

  // Handle weight reading for a lot in the pen
  const handleWeightReading = (lotId: string) => {
    setSelectedLotId(lotId);
    setShowWeightForm(true);
  };

  // Handle lot movement for a lot in the pen
  const handleLotMovement = (lotId: string) => {
    setSelectedLotId(lotId);
    setShowLotMovementForm(true);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
        {/* Header com estatísticas - Mais compacto */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b3x-navy-900">Mapa de Currais</h3>
            <button
              onClick={handleAddPen}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft text-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar Curral</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3 text-center border border-neutral-300">
              <div className="text-xl font-bold text-neutral-800">{totalAnimals}</div>
              <div className="text-xs text-neutral-700">Total de Animais</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 text-center border border-emerald-200">
              <div className="text-xl font-bold text-emerald-700">{occupiedPens}</div>
              <div className="text-xs text-emerald-600">Currais Ocupados</div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 text-center border border-slate-200">
              <div className="text-xl font-bold text-slate-700">{penStatuses.length - occupiedPens}</div>
              <div className="text-xs text-slate-600">Currais Disponíveis</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center border border-amber-200">
              <div className="text-xl font-bold text-amber-700">{unallocatedAnimals}</div>
              <div className="text-xs text-amber-600">Não Alocados</div>
            </div>
          </div>

          {/* Legenda - Mais compacta */}
          <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-300 rounded"></div>
              <span className="text-neutral-600">Ocupado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-white border-2 border-neutral-300 rounded"></div>
              <span className="text-neutral-600">Disponível</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-100 border-2 border-amber-300 rounded"></div>
              <span className="text-neutral-600">Manutenção</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-rose-100 border-2 border-rose-300 rounded"></div>
              <span className="text-neutral-600">Quarentena</span>
            </div>
          </div>
        </div>

        {/* Grid de Currais por Linha */}
        <div className="space-y-6">
          {Object.entries(pensBySector).map(([sector, pens]) => (
            <div key={sector} className="bg-neutral-50/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2 text-neutral-600" />
                {sector}
                <span className="ml-2 text-xs font-normal text-neutral-500">({pens.length} currais)</span>
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-3">
                {pens.map((pen) => {
                  const isSelected = selectedPen === pen.penNumber;
                  
                  return (
                    <div
                      key={pen.penNumber}
                      className={clsx(
                        'aspect-square border-2 rounded-lg p-1 sm:p-2 transition-all duration-200 cursor-pointer relative group',
                        getPenStatusColor(pen),
                        isSelected && 'ring-2 ring-b3x-lime-500 ring-offset-2 scale-105'
                      )}
                      onClick={() => handlePenClick(pen.penNumber)}
                      title={
                        pen.status === 'occupied' 
                          ? `Curral ${pen.penNumber} - ${pen.currentAnimals} animais`
                          : `Curral ${pen.penNumber} - Disponível`
                      }
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-xs sm:text-sm font-bold text-current">{pen.penNumber}</div>
                        
                        {pen.status === 'occupied' && (
                          <div className="mt-1">
                            <div className="text-xs font-medium">{pen.currentAnimals}</div>
                          </div>
                        )}
                      </div>

                      {/* Indicador de status */}
                      {pen.status === 'occupied' && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      )}

                      {/* Botões de ação (aparecem no hover) */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPen(pen.penNumber);
                          }}
                          className="p-1 bg-white/90 rounded hover:bg-white transition-colors"
                          title="Editar curral"
                        >
                          <Edit className="w-3 h-3 text-neutral-700" />
                        </button>
                        
                        {pen.status === 'occupied' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMovePen(pen.penNumber);
                            }}
                            className="p-1 bg-white/90 rounded hover:bg-white transition-colors"
                            title="Movimentar animais"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-warning-600" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePen(pen.penNumber);
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
        </div>

        {/* Detalhes do Curral Selecionado - Mais compacto */}
        {selectedPen && (
          <div className="mt-4 p-3 bg-gradient-to-br from-b3x-lime-50 to-b3x-lime-100 rounded-lg border border-b3x-lime-200">
            <h4 className="font-semibold text-b3x-navy-900 mb-2 text-sm">
              Detalhes do Curral {selectedPen}
            </h4>
            
            {(() => {
              const pen = getPenInfo(selectedPen);
              if (!pen) return null;
              
              // Get lots in this pen
              const lotsInPen = getLotsInPen(selectedPen);
              
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-600">Ocupação Atual:</span>
                      <div className="font-medium text-b3x-navy-900">{pen.currentAnimals} animais</div>
                    </div>
                    <div>
                      <span className="text-neutral-600">Status:</span>
                      <div className="font-medium text-b3x-navy-900 capitalize">
                        {pen.status === 'occupied' ? 'Ocupado' : 
                         pen.status === 'available' ? 'Disponível' :
                         pen.status === 'maintenance' ? 'Manutenção' : 'Quarentena'}
                      </div>
                    </div>
                  </div>

                  {/* Lotes no Curral */}
                  {lotsInPen.length > 0 && (
                    <div>
                      <h5 className="font-medium text-b3x-navy-900 mb-2 text-xs">Lotes neste Curral:</h5>
                      <div className="space-y-2">
                        {lotsInPen.map(({allocation, lot}) => (
                          <div key={allocation.id} className="bg-white/80 rounded p-3 border border-neutral-200">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-b3x-navy-900 text-sm">Lote {lot?.lotNumber}</div>
                                <div className="text-xs text-neutral-600">
                                  {allocation.quantity} animais • {allocation.entryWeight.toLocaleString('pt-BR')} kg
                                </div>
                              </div>
                              <div className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                                {lot?.status === 'active' ? 'Ativo' : 'Vendido'}
                              </div>
                            </div>
                            
                            {/* Ações para o lote */}
                            {lot?.status === 'active' && (
                              <div className="flex space-x-2 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHealthRecord(lot.id);
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Heart className="w-3 h-3" />
                                  <span>Protocolo</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWeightReading(lot.id);
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Scale className="w-3 h-3" />
                                  <span>Pesagem</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLotMovement(lot.id);
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Mover</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedPen(null)}
                      className="px-3 py-1.5 text-xs bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                    >
                      Fechar
                    </button>
                    
                    {pen.status === 'occupied' && (
                      <button
                        onClick={() => {
                          setShowMovementModal(true);
                          setEditPenNumber(selectedPen);
                        }}
                        className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Movimentar Animais
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setEditPenNumber(selectedPen);
                        setShowPenForm(true);
                      }}
                      className="px-3 py-1.5 text-xs bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                    >
                      Editar Curral
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Forms */}
      {showPenForm && (
        <Portal>
          <PenRegistrationForm
            isOpen={showPenForm}
            onClose={() => setShowPenForm(false)}
            penNumber={editPenNumber}
          />
        </Portal>
      )}

      {showAllocationForm && (
        <Portal>
          <PenAllocationForm
            isOpen={showAllocationForm}
            onClose={() => setShowAllocationForm(false)}
            penNumber={editPenNumber}
          />
        </Portal>
      )}

      {showMovementModal && (
        <Portal>
          <PenMovementModal
            isOpen={showMovementModal}
            onClose={() => setShowMovementModal(false)}
            sourcePenNumber={editPenNumber}
          />
        </Portal>
      )}

      {/* Forms for lot actions */}
      {showWeightForm && (
        <Portal>
          <WeightReadingForm
            isOpen={showWeightForm}
            onClose={() => setShowWeightForm(false)}
            lotId={selectedLotId}
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

      {showLotMovementForm && (
        <Portal>
          <LotMovementForm
            isOpen={showLotMovementForm}
            onClose={() => setShowLotMovementForm(false)}
            lotId={selectedLotId}
          />
        </Portal>
      )}
    </>
  );
};