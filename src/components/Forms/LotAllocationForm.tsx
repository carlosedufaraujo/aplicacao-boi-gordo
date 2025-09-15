import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Portal } from '../Common/Portal';

interface LotAllocationFormData {
  allocations: {
    curralId: string;
    quantidade: number;
  }[];
}

interface LotAllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  loteId: string;
  quantidadeTotal: number;
}

export const LotAllocationForm: React.FC<LotAllocationFormProps> = ({
  isOpen,
  onClose,
  loteId,
  quantidadeTotal
}) => {
  const { 
    penRegistrations, 
    penStatuses, 
    cattlePurchases,
    allocateLotToPens,
    getLotesInCurral 
  } = useAppStore();
  
  const [allocations, setAllocations] = useState<{ curralId: string; quantidade: number }[]>([
    { curralId: '', quantidade: 0 }
  ]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const lote = cattlePurchases.find(l => l.id === loteId);
  
  const { handleSubmit, formState: { isSubmitting } } = useForm<LotAllocationFormData>();

  // Calcular currais disponíveis
  const availablePens = penRegistrations.filter(pen => {
    const penStatus = penStatuses.find(ps => ps.penNumber === pen.penNumber);
    if (!penStatus) return false;
    
    return pen.isActive && (penStatus.capacity - penStatus.currentAnimals) > 0;
  });

  // Calcular total alocado
  const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.quantidade || 0), 0);
  const remaining = quantidadeTotal - totalAllocated;

  const handleAddAllocation = () => {
    setAllocations([...allocations, { curralId: '', quantidade: 0 }]);
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index: number, field: 'curralId' | 'quantidade', value: string | number) => {
    const newAllocations = [...allocations];
    if (field === 'curralId') {
      newAllocations[index].curralId = value as string;
    } else {
      newAllocations[index].quantidade = Number(value) || 0;
    }
    setAllocations(newAllocations);
  };

  const getAvailableCapacity = (curralId: string) => {
    if (!curralId) return 0;
    
    const pen = penRegistrations.find(p => p.penNumber === curralId);
    const penStatus = penStatuses.find(ps => ps.penNumber === curralId);
    
    if (!pen || !penStatus) return 0;
    
    return pen.capacity - penStatus.currentAnimals;
  };

  const onSubmit = async () => {
    setErrorMessage('');
    
    // Validar alocações
    const validAllocations = allocations.filter(alloc => alloc.curralId && alloc.quantidade > 0);
    
    if (validAllocations.length === 0) {
      setErrorMessage('Adicione pelo menos uma alocação válida');
      return;
    }
    
    if (totalAllocated !== quantidadeTotal) {
      setErrorMessage(`O total alocado (${totalAllocated}) deve ser igual à quantidade total (${quantidadeTotal})`);
      return;
    }
    
    // Validar capacidade dos currais
    for (const alloc of validAllocations) {
      const available = getAvailableCapacity(alloc.curralId);
      if (alloc.quantidade > available) {
        setErrorMessage(`Curral ${alloc.curralId} não tem capacidade suficiente. Disponível: ${available} animais`);
        return;
      }
    }
    
    // Alocar lote aos currais
    allocateLotToPens(loteId, validAllocations);
    
    onClose();
  };

  if (!isOpen || !lote) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-neutral-900 bg-opacity-75" onClick={onClose} />

          <div className="inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-b3x-navy-900">
                  Alocar Lote aos Currais
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Lote {lote.lotNumber} - {quantidadeTotal} animais
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Status da Alocação */}
              <div className="bg-gradient-to-r from-b3x-lime-50 to-b3x-lime-100 rounded-lg p-4 border border-b3x-lime-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-b3x-navy-900">{quantidadeTotal}</div>
                    <div className="text-xs text-neutral-600">Total de Animais</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${totalAllocated > quantidadeTotal ? 'text-error-600' : 'text-success-600'}`}>
                      {totalAllocated}
                    </div>
                    <div className="text-xs text-neutral-600">Alocados</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${remaining < 0 ? 'text-error-600' : remaining === 0 ? 'text-success-600' : 'text-warning-600'}`}>
                      {remaining}
                    </div>
                    <div className="text-xs text-neutral-600">Restantes</div>
                  </div>
                </div>
                
                {remaining === 0 && (
                  <div className="mt-3 flex items-center justify-center text-success-600">
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Alocação completa!</span>
                  </div>
                )}
              </div>

              {/* Lista de Alocações */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-b3x-navy-900">Alocações por Curral</h4>
                  <button
                    type="button"
                    onClick={handleAddAllocation}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                </div>
                
                {allocations.map((allocation, index) => {
                  const availableCapacity = getAvailableCapacity(allocation.curralId);
                  const penInfo = penRegistrations.find(p => p.penNumber === allocation.curralId);
                  const lotesNoCurral = allocation.curralId ? getLotesInCurral(allocation.curralId) : [];
                  
                  return (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-5">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Curral
                          </label>
                          <select
                            value={allocation.curralId}
                            onChange={(e) => handleAllocationChange(index, 'curralId', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent text-sm"
                            required
                          >
                            <option value="">Selecione um curral</option>
                            {availablePens.map(pen => {
                              const penStatus = penStatuses.find(ps => ps.penNumber === pen.penNumber);
                              const available = pen.capacity - (penStatus?.currentAnimals || 0);
                              
                              return (
                                <option 
                                  key={pen.id} 
                                  value={pen.penNumber}
                                  disabled={available === 0}
                                >
                                  Curral {pen.penNumber} - {pen.location} ({available} disponíveis)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        <div className="col-span-4">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={Math.min(availableCapacity, remaining + (allocation.quantidade || 0))}
                            value={allocation.quantidade || ''}
                            onChange={(e) => handleAllocationChange(index, 'quantidade', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent text-sm"
                            placeholder="0"
                            required
                          />
                          {allocation.curralId && (
                            <div className="text-xs text-neutral-500 mt-1">
                              Máx: {Math.min(availableCapacity, remaining + (allocation.quantidade || 0))} animais
                            </div>
                          )}
                        </div>
                        
                        <div className="col-span-3 flex items-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveAllocation(index)}
                            className="w-full px-3 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors flex items-center justify-center"
                            disabled={allocations.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Informações do Curral */}
                      {allocation.curralId && penInfo && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-neutral-500">Localização:</span>
                              <span className="ml-1 font-medium text-neutral-700">{penInfo.location}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">Capacidade disponível:</span>
                              <span className="ml-1 font-medium text-neutral-700">{availableCapacity} animais</span>
                            </div>
                          </div>
                          
                          {lotesNoCurral.length > 0 && (
                            <div className="mt-2">
                              <span className="text-neutral-500">Lotes no curral:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lotesNoCurral.map(({ lote }) => (
                                  <span key={lote.id} className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-xs">
                                    {lote.lotNumber}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Avisos e Erros */}
              {totalAllocated > quantidadeTotal && (
                <div className="flex items-start space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 mt-0.5" />
                  <div className="text-sm text-error-700">
                    O total alocado excede a quantidade de animais do lote
                  </div>
                </div>
              )}
              
              {errorMessage && (
                <div className="flex items-start space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 mt-0.5" />
                  <div className="text-sm text-error-700">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || totalAllocated !== quantidadeTotal}
                  className="px-4 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Alocando...' : 'Confirmar Alocação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
}; 
