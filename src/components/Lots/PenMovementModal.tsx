import React, { useState } from 'react';
import { X, ArrowRight, Users, Home, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface PenMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePenNumber: string;
}

export const PenMovementModal: React.FC<PenMovementModalProps> = ({
  isOpen,
  onClose,
  sourcePenNumber
}) => {
  const { 
    penStatuses, 
    penAllocations,
    addLotMovement,
    updatePenAllocation,
    deletePenAllocation,
    addPenAllocation
  } = useAppStore();
  
  const [targetPenNumber, setTargetPenNumber] = useState<string>('');
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>('');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);

  if (!isOpen) return null;

  const sourcePen = penStatuses.find(pen => pen.penNumber === sourcePenNumber);
  const sourceAllocations = penAllocations.filter(alloc => alloc.penNumber === sourcePenNumber);
  const availableTargetPens = penStatuses.filter(pen => 
    pen.penNumber !== sourcePenNumber && pen.status === 'available'
  );

  const selectedAllocation = selectedAllocationId 
    ? penAllocations.find(alloc => alloc.id === selectedAllocationId)
    : null;

  const handleMovement = () => {
    if (!selectedAllocation || !targetPenNumber || movementQuantity <= 0) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const targetPen = penStatuses.find(pen => pen.penNumber === targetPenNumber);
    if (!targetPen) return;

    // Verificar capacidade do curral de destino
    if (targetPen.currentAnimals + movementQuantity > targetPen.capacity) {
      alert('Curral de destino não tem capacidade suficiente!');
      return;
    }

    // Registrar movimentação
    addLotMovement({
      lotId: selectedAllocation.lotId,
      fromPen: sourcePenNumber,
      toPen: targetPenNumber,
      quantity: movementQuantity,
      reason: 'Movimentação manual via mapa de currais',
      observations: `Movimentação de ${movementQuantity} animais do curral ${sourcePenNumber} para o curral ${targetPenNumber}`,
      date: new Date()
    });

    // Atualizar alocações
    if (movementQuantity === selectedAllocation.quantity) {
      // Movimentação completa: remover da origem e criar nova no destino
      deletePenAllocation(selectedAllocation.id);
      addPenAllocation({
        penNumber: targetPenNumber,
        lotId: selectedAllocation.lotId,
        quantity: movementQuantity,
        entryWeight: selectedAllocation.entryWeight,
        entryDate: selectedAllocation.entryDate
      });
    } else {
      // Movimentação parcial: reduzir na origem e criar nova no destino
      updatePenAllocation(selectedAllocation.id, {
        quantity: selectedAllocation.quantity - movementQuantity,
        entryWeight: selectedAllocation.entryWeight * (selectedAllocation.quantity - movementQuantity) / selectedAllocation.quantity
      });
      
      addPenAllocation({
        penNumber: targetPenNumber,
        lotId: selectedAllocation.lotId,
        quantity: movementQuantity,
        entryWeight: selectedAllocation.entryWeight * movementQuantity / selectedAllocation.quantity,
        entryDate: selectedAllocation.entryDate
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Mais compacto */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Movimentação de Curral</h2>
            <p className="text-warning-100 text-sm mt-1">Curral {sourcePenNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warning-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Source Pen Info - Mais compacto */}
          {sourcePen && (
            <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-4 border border-warning-200">
              <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <Home className="w-4 h-4 mr-2 text-warning-600" />
                Curral de Origem: {sourcePenNumber}
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-b3x-navy-900">{sourcePen.capacity}</div>
                  <div className="text-xs text-neutral-600">Capacidade</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-warning-600">{sourcePen.currentAnimals}</div>
                  <div className="text-xs text-neutral-600">Ocupação Atual</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="text-base font-bold text-success-600">{sourceAllocations.length}</div>
                  <div className="text-xs text-neutral-600">Lotes</div>
                </div>
              </div>
            </div>
          )}

          {/* Allocation Selection - Mais compacto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Selecione o Lote para Movimentar *
            </label>
            <select
              value={selectedAllocationId}
              onChange={(e) => {
                setSelectedAllocationId(e.target.value);
                const allocation = penAllocations.find(alloc => alloc.id === e.target.value);
                if (allocation) {
                  setMovementQuantity(allocation.quantity);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
            >
              <option value="">Selecione um lote</option>
              {sourceAllocations.map(allocation => (
                <option key={allocation.id} value={allocation.id}>
                  Lote {allocation.lotId.slice(-3)} - {allocation.quantity} animais ({allocation.entryWeight.toLocaleString('pt-BR')} kg)
                </option>
              ))}
            </select>
          </div>

          {/* Movement Details - Mais compacto */}
          {selectedAllocation && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                <Users className="w-3 h-3 mr-2" />
                Detalhes da Movimentação
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Quantidade a Movimentar *
                  </label>
                  <input
                    type="number"
                    value={movementQuantity}
                    onChange={(e) => setMovementQuantity(Number(e.target.value))}
                    max={selectedAllocation.quantity}
                    min={1}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                    placeholder={`Máximo: ${selectedAllocation.quantity}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Curral de Destino *
                  </label>
                  <select
                    value={targetPenNumber}
                    onChange={(e) => setTargetPenNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent"
                  >
                    <option value="">Selecione o destino</option>
                    {availableTargetPens.map(pen => (
                      <option key={pen.penNumber} value={pen.penNumber}>
                        Curral {pen.penNumber} - {pen.currentAnimals}/{pen.capacity} animais
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validation - Mais compacto */}
              {targetPenNumber && movementQuantity > 0 && (
                <div className="bg-info-50 border border-info-200 rounded-lg p-2">
                  {(() => {
                    const targetPen = penStatuses.find(pen => pen.penNumber === targetPenNumber);
                    if (!targetPen) return null;
                    
                    const wouldExceedCapacity = targetPen.currentAnimals + movementQuantity > targetPen.capacity;
                    
                    return wouldExceedCapacity ? (
                      <div className="flex items-center space-x-2 text-error-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          ⚠️ Capacidade insuficiente no curral de destino!
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-info-700">
                        ✅ Movimentação válida: {movementQuantity} animais para curral {targetPenNumber}
                        <br />
                        Nova ocupação: {targetPen.currentAnimals + movementQuantity}/{targetPen.capacity} animais
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleMovement}
              disabled={!selectedAllocation || !targetPenNumber || movementQuantity <= 0}
              className="px-4 py-1.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white font-medium rounded-lg hover:from-warning-600 hover:to-warning-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-3 h-3" />
              <span>Confirmar Movimentação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};