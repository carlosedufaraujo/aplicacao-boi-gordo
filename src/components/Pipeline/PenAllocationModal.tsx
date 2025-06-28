import React, { useState, useEffect } from 'react';
import { X, Home, Users, AlertTriangle, CheckCircle, Plus, DollarSign, Divide } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PenRegistrationForm } from '../Forms/PenRegistrationForm';
import { Portal } from '../Common/Portal';

interface PenAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  lot: any;
}

export const PenAllocationModal: React.FC<PenAllocationModalProps> = ({
  isOpen,
  onClose,
  order,
  lot
}) => {
  const { 
    penStatuses, 
    penRegistrations,
    penAllocations,
    addPenAllocation, 
    movePurchaseOrderToNextStage,
    updateCattleLot,
    deletePenAllocation,
    addNotification
  } = useAppStore();
  
  const [selectedPenNumber, setSelectedPenNumber] = useState<string>('');
  const [allocationMethod, setAllocationMethod] = useState<'specific' | 'any' | 'multiple'>('any');
  const [showPenForm, setShowPenForm] = useState(false);
  const [existingAllocations, setExistingAllocations] = useState<any[]>([]);
  const [penRegistrationAdded, setPenRegistrationAdded] = useState(false);
  
  // Estado para alocação múltipla
  const [multipleAllocations, setMultipleAllocations] = useState<{penNumber: string, quantity: number}[]>([]);
  const [remainingAnimals, setRemainingAnimals] = useState(lot.entryQuantity);

  // Verificar se o lote já tem alocações existentes
  useEffect(() => {
    if (lot) {
      const lotAllocations = penAllocations.filter(alloc => alloc.lotId === lot.id);
      setExistingAllocations(lotAllocations);
      
      // Se já existirem alocações, pré-selecionar o primeiro curral
      if (lotAllocations.length > 0) {
        setSelectedPenNumber(lotAllocations[0].penNumber);
        setAllocationMethod('specific');
      }
      
      // Calcular animais restantes
      const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
      setRemainingAnimals(lot.entryQuantity - totalAllocated);
    }
  }, [lot, penAllocations]);

  // Atualizar lista de currais quando um novo curral for adicionado
  useEffect(() => {
    if (penRegistrationAdded && allocationMethod === 'specific') {
      // Encontrar o curral mais recente
      const latestPen = penRegistrations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      if (latestPen) {
        setSelectedPenNumber(latestPen.penNumber);
      }
      
      setPenRegistrationAdded(false);
    }
  }, [penRegistrations, penRegistrationAdded, allocationMethod]);

  if (!isOpen || !lot) return null;

  // SISTEMA INTELIGENTE: Encontrar o melhor curral disponível
  const findBestAvailablePen = () => {
    // 1. Prioridade: Currais completamente vazios
    const emptyPens = penStatuses.filter(pen => 
      pen.status === 'available' && pen.currentAnimals === 0
    );
    
    if (emptyPens.length > 0) {
      // Ordenar por capacidade (maior primeiro para otimizar espaço)
      return emptyPens.sort((a, b) => b.capacity - a.capacity)[0];
    }
    
    // 2. Fallback: Currais com espaço disponível
    const partiallyOccupiedPens = penStatuses.filter(pen => 
      (pen.status === 'available' || pen.status === 'occupied') && 
      pen.currentAnimals < pen.capacity &&
      (pen.capacity - pen.currentAnimals) > 0
    );
    
    if (partiallyOccupiedPens.length > 0) {
      // Ordenar por espaço disponível (menor primeiro para otimizar ocupação)
      return partiallyOccupiedPens.sort((a, b) => 
        (a.capacity - a.currentAnimals) - (b.capacity - b.currentAnimals)
      )[0];
    }
    
    return null;
  };

  // NOVO: Sugerir alocação múltipla inteligente
  const suggestMultipleAllocation = () => {
    const availablePens = penStatuses.filter(pen => 
      (pen.status === 'available' || pen.status === 'occupied') && 
      pen.currentAnimals < pen.capacity
    ).sort((a, b) => (b.capacity - b.currentAnimals) - (a.capacity - a.currentAnimals));
    
    if (availablePens.length === 0) return [];
    
    let animalsToAllocate = lot.entryQuantity;
    const allocations: {penNumber: string, quantity: number}[] = [];
    
    for (const pen of availablePens) {
      if (animalsToAllocate <= 0) break;
      
      const availableSpace = pen.capacity - pen.currentAnimals;
      if (availableSpace <= 0) continue;
      
      const quantityForThisPen = Math.min(availableSpace, animalsToAllocate);
      allocations.push({
        penNumber: pen.penNumber,
        quantity: quantityForThisPen
      });
      
      animalsToAllocate -= quantityForThisPen;
    }
    
    return allocations;
  };

  const bestPen = findBestAvailablePen();
  const suggestedMultipleAllocation = suggestMultipleAllocation();
  const canAllocateAll = suggestedMultipleAllocation.reduce((sum, alloc) => sum + alloc.quantity, 0) >= lot.entryQuantity;
  
  // Incluir currais onde o lote já está alocado na lista de disponíveis
  const availablePens = [
    ...existingAllocations.map(alloc => {
      const pen = penStatuses.find(p => p.penNumber === alloc.penNumber);
      return pen || {
        penNumber: alloc.penNumber,
        capacity: 0,
        currentAnimals: 0,
        status: 'occupied' as const
      };
    }),
    ...penStatuses.filter(pen => 
      (pen.status === 'available' || pen.status === 'occupied') && 
      (pen.capacity - pen.currentAnimals) > 0 &&
      !existingAllocations.some(alloc => alloc.penNumber === pen.penNumber)
    )
  ];

  // Agrupar currais por setor para melhor organização
  const pensBySector = availablePens.reduce((acc, pen) => {
    const penReg = penRegistrations.find(p => p.penNumber === pen.penNumber);
    const sector = penReg?.location || 'Sem Setor';
    
    if (!acc[sector]) {
      acc[sector] = [];
    }
    
    acc[sector].push(pen);
    return acc;
  }, {} as Record<string, typeof availablePens>);

  // Adicionar alocação múltipla
  const addMultipleAllocation = () => {
    if (multipleAllocations.length === 0) {
      // Usar a sugestão automática
      setMultipleAllocations(suggestedMultipleAllocation);
    } else {
      // Adicionar mais uma linha vazia
      setMultipleAllocations([...multipleAllocations, { penNumber: '', quantity: 0 }]);
    }
  };

  // Atualizar alocação múltipla
  const updateMultipleAllocation = (index: number, field: 'penNumber' | 'quantity', value: string | number) => {
    const newAllocations = [...multipleAllocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: field === 'quantity' ? Number(value) : value
    };
    setMultipleAllocations(newAllocations);
    
    // Recalcular animais restantes
    const totalAllocated = newAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    setRemainingAnimals(lot.entryQuantity - totalAllocated);
  };

  // Remover alocação múltipla
  const removeMultipleAllocation = (index: number) => {
    const newAllocations = multipleAllocations.filter((_, i) => i !== index);
    setMultipleAllocations(newAllocations);
    
    // Recalcular animais restantes
    const totalAllocated = newAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    setRemainingAnimals(lot.entryQuantity - totalAllocated);
  };

  const handleConfirmAllocation = () => {
    // Verificar qual método de alocação está sendo usado
    if (allocationMethod === 'multiple') {
      // Validar alocações múltiplas
      if (multipleAllocations.length === 0) {
        alert('Adicione pelo menos uma alocação');
        return;
      }
      
      // Verificar se todos os currais foram selecionados
      if (multipleAllocations.some(alloc => !alloc.penNumber)) {
        alert('Selecione um curral para cada alocação');
        return;
      }
      
      // Verificar se todas as quantidades são válidas
      if (multipleAllocations.some(alloc => alloc.quantity <= 0)) {
        alert('Todas as quantidades devem ser maiores que zero');
        return;
      }
      
      // Verificar se o total alocado é igual ao total de animais
      const totalAllocated = multipleAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
      if (totalAllocated !== lot.entryQuantity) {
        alert(`O total alocado (${totalAllocated}) deve ser igual ao total de animais do lote (${lot.entryQuantity})`);
        return;
      }
      
      // Criar alocações para cada curral
      for (const allocation of multipleAllocations) {
        // Calcular peso proporcional
        const weightProportion = (allocation.quantity / lot.entryQuantity) * lot.entryWeight;
        
        // Adicionar alocação
        addPenAllocation({
          penNumber: allocation.penNumber,
          lotId: lot.id,
          quantity: allocation.quantity,
          entryWeight: weightProportion,
          entryDate: lot.entryDate
        });
      }
      
      // Definir o curral principal no lote (o primeiro com mais animais)
      const primaryAllocation = [...multipleAllocations].sort((a, b) => b.quantity - a.quantity)[0];
      updateCattleLot(lot.id, { penNumber: primaryAllocation.penNumber });
      
      // Adicionar notificação
      addNotification({
        title: 'Lote alocado em múltiplos currais',
        message: `O lote ${lot.lotNumber} foi alocado em ${multipleAllocations.length} currais diferentes`,
        type: 'success',
        relatedEntityType: 'cattle_lot',
        relatedEntityId: lot.id,
        actionUrl: '/lots'
      });
    } else {
      let targetPenNumber = '';
      
      if (allocationMethod === 'any') {
        // ALOCAÇÃO INTELIGENTE: Usar o melhor curral encontrado
        if (bestPen) {
          targetPenNumber = bestPen.penNumber;
        } else {
          alert('Nenhum curral disponível com capacidade suficiente! Tente a alocação múltipla.');
          return;
        }
      } else {
        // ALOCAÇÃO ESPECÍFICA: Usar curral selecionado
        if (!selectedPenNumber) {
          alert('Selecione um curral específico!');
          return;
        }
        targetPenNumber = selectedPenNumber;
      }

      // Verificar se o lote já está alocado neste curral
      const existingAllocation = existingAllocations.find(
        alloc => alloc.penNumber === targetPenNumber
      );

      if (existingAllocation) {
        // Se já existe alocação neste curral, não precisamos criar uma nova
        console.log("Lote já está alocado neste curral, mantendo alocação existente");
      } else {
        // Criar alocação no curral
        addPenAllocation({
          penNumber: targetPenNumber,
          lotId: lot.id,
          quantity: lot.entryQuantity,
          entryWeight: lot.entryWeight,
          entryDate: lot.entryDate
        });
        
        // Adicionar notificação
        addNotification({
          title: 'Lote alocado em curral',
          message: `O lote ${lot.lotNumber} foi alocado no curral ${targetPenNumber}`,
          type: 'success',
          relatedEntityType: 'cattle_lot',
          relatedEntityId: lot.id,
          actionUrl: '/lots'
        });
      }

      // Atualizar o número do curral no lote
      updateCattleLot(lot.id, { penNumber: targetPenNumber });
    }

    // Avançar ordem para "Confinado"
    movePurchaseOrderToNextStage(order.id);
    
    onClose();
  };

  // Callback para quando um novo curral é adicionado
  const handlePenRegistrationAdded = () => {
    setPenRegistrationAdded(true);
    setShowPenForm(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
            <div>
              <h2 className="text-lg font-bold">Alocação de Animais em Currais</h2>
              <p className="text-b3x-navy-200 text-sm mt-1">
                Ordem: {order.code} • Lote: {lot.lotNumber} • {lot.entryQuantity} animais
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Resumo do Lote */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-4 h-4 text-b3x-lime-600" />
                <h3 className="text-base font-semibold text-b3x-navy-900">Resumo do Lote para Alocação</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-b3x-navy-900">{lot.entryQuantity}</div>
                  <div className="text-xs text-neutral-600">Animais</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-b3x-navy-900">{lot.entryWeight.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-neutral-600">kg Total</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-b3x-lime-600">
                    {(lot.entryWeight / lot.entryQuantity).toFixed(1)}
                  </div>
                  <div className="text-xs text-neutral-600">kg/animal</div>
                </div>
              </div>
            </div>

            {/* Alocações Existentes */}
            {existingAllocations.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-b3x-lime-600" />
                  <h3 className="text-base font-semibold text-b3x-navy-900">
                    Alocações Existentes Encontradas
                  </h3>
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-neutral-700 mb-3">
                    Este lote já possui alocações em currais. Você pode manter as alocações existentes ou escolher um novo curral.
                  </p>
                  
                  <div className="space-y-2">
                    {existingAllocations.map(alloc => {
                      const pen = penStatuses.find(p => p.penNumber === alloc.penNumber);
                      return (
                        <div key={alloc.id} className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200">
                          <div>
                            <span className="font-medium text-b3x-navy-900">Curral {alloc.penNumber}</span>
                            <span className="text-xs text-neutral-600 ml-2">
                              ({alloc.quantity} animais • {alloc.entryWeight.toLocaleString('pt-BR')} kg)
                            </span>
                          </div>
                          <div className="text-xs text-neutral-600">
                            {pen ? `${pen.currentAnimals}/${pen.capacity} ocupação` : 'Status desconhecido'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Pergunta Obrigatória */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
              <h3 className="text-base font-semibold text-b3x-navy-900 mb-3">
                Como deseja alocar os animais?
              </h3>
              
              <div className="space-y-3">
                {/* Opção 1: Qualquer Curral (Inteligente) */}
                <div 
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationMethod === 'any' 
                      ? 'border-b3x-lime-300 bg-b3x-lime-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setAllocationMethod('any')}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      allocationMethod === 'any' 
                        ? 'border-b3x-lime-500 bg-b3x-lime-500' 
                        : 'border-neutral-300'
                    }`}>
                      {allocationMethod === 'any' && (
                        <CheckCircle className="w-2 h-2 text-white m-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                        🤖 Alocação Inteligente {existingAllocations.length === 0 && "(Recomendado)"}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        O sistema escolherá automaticamente o melhor curral disponível, 
                        priorizando currais vazios para otimizar o manejo.
                      </p>
                      
                      {bestPen && bestPen.capacity >= lot.entryQuantity ? (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <CheckCircle className="w-3 h-3 text-success-600" />
                            <span className="font-medium text-success-800 text-xs">
                              Curral Recomendado: {bestPen.penNumber}
                            </span>
                          </div>
                          <div className="text-xs text-success-700">
                            Capacidade: {bestPen.capacity} animais | 
                            Ocupação atual: {bestPen.currentAnimals} | 
                            Disponível: {bestPen.capacity - bestPen.currentAnimals}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-warning-50 border border-warning-200 rounded-lg p-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-3 h-3 text-warning-600" />
                            <span className="font-medium text-warning-800 text-xs">
                              {bestPen 
                                ? `Curral ${bestPen.penNumber} tem apenas ${bestPen.capacity - bestPen.currentAnimals} espaços disponíveis` 
                                : 'Nenhum curral disponível com capacidade suficiente'}
                            </span>
                          </div>
                          <div className="text-xs text-warning-700 mt-1">
                            Considere usar a opção de alocação múltipla abaixo.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opção 2: Curral Específico */}
                <div 
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationMethod === 'specific' 
                      ? 'border-info-300 bg-info-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setAllocationMethod('specific')}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      allocationMethod === 'specific' 
                        ? 'border-info-500 bg-info-500' 
                        : 'border-neutral-300'
                    }`}>
                      {allocationMethod === 'specific' && (
                        <CheckCircle className="w-2 h-2 text-white m-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                        🎯 Curral Específico {existingAllocations.length > 0 && "(Recomendado)"}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        Escolha manualmente em qual curral deseja alocar os animais.
                        {existingAllocations.length > 0 && " Recomendamos manter a alocação existente."}
                      </p>
                      
                      {allocationMethod === 'specific' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-neutral-700 mb-1">
                                Selecione o Curral
                              </label>
                              
                              {/* Seleção de curral por setor */}
                              {Object.keys(pensBySector).length > 0 ? (
                                <select
                                  value={selectedPenNumber}
                                  onChange={(e) => setSelectedPenNumber(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-info-500"
                                >
                                  <option value="">Selecione um curral</option>
                                  {Object.entries(pensBySector).map(([sector, pens]) => (
                                    <optgroup key={sector} label={sector}>
                                      {pens.map(pen => {
                                        const isExisting = existingAllocations.some(a => a.penNumber === pen.penNumber);
                                        return (
                                          <option 
                                            key={pen.penNumber} 
                                            value={pen.penNumber}
                                          >
                                            Curral {pen.penNumber} - {pen.currentAnimals}/{pen.capacity} animais
                                            {isExisting ? ' (Alocação Existente)' : ''}
                                          </option>
                                        );
                                      })}
                                    </optgroup>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-xs text-error-600 p-2 bg-error-50 rounded-lg border border-error-200">
                                  Nenhum curral disponível com capacidade suficiente
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setShowPenForm(true)}
                              className="px-2 py-2 bg-info-500 text-white rounded-lg hover:bg-info-600 transition-colors mt-5"
                              title="Cadastrar novo curral"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {selectedPenNumber && (
                            <div className="bg-info-50 border border-info-200 rounded-lg p-2">
                              {(() => {
                                const selectedPen = penStatuses.find(p => p.penNumber === selectedPenNumber);
                                const isExistingAllocation = existingAllocations.some(
                                  a => a.penNumber === selectedPenNumber
                                );
                                
                                return (
                                  <div className="text-xs text-info-700">
                                    <strong>Curral {selectedPenNumber}:</strong> {' '}
                                    {selectedPen ? (
                                      <>
                                        {selectedPen.currentAnimals} animais ocupados de {selectedPen.capacity} total
                                        ({((selectedPen.currentAnimals / selectedPen.capacity) * 100).toFixed(1)}% ocupação)
                                      </>
                                    ) : 'Informações não disponíveis'}
                                    
                                    {isExistingAllocation && (
                                      <div className="mt-1 p-1 bg-success-100 text-success-700 rounded">
                                        ✓ Este lote já está alocado neste curral
                                      </div>
                                    )}
                                    
                                    {selectedPen && selectedPen.capacity < lot.entryQuantity && (
                                      <div className="mt-1 p-1 bg-warning-100 text-warning-700 rounded">
                                        ⚠️ Este curral não tem capacidade suficiente para todo o lote.
                                        Considere usar a alocação múltipla.
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NOVA OPÇÃO: Alocação Múltipla */}
                <div 
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    allocationMethod === 'multiple' 
                      ? 'border-warning-300 bg-warning-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setAllocationMethod('multiple')}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      allocationMethod === 'multiple' 
                        ? 'border-warning-500 bg-warning-500' 
                        : 'border-neutral-300'
                    }`}>
                      {allocationMethod === 'multiple' && (
                        <CheckCircle className="w-2 h-2 text-white m-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                        <Divide className="w-3 h-3 mr-1 text-warning-600" />
                        Alocação Múltipla {!canAllocateAll && "(Recomendado)"}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2">
                        Divida o lote entre múltiplos currais quando um único curral não tem capacidade suficiente.
                      </p>
                      
                      {allocationMethod === 'multiple' && (
                        <div className="space-y-3">
                          {/* Sugestão automática */}
                          {suggestedMultipleAllocation.length > 0 && multipleAllocations.length === 0 && (
                            <div className="bg-warning-50 border border-warning-200 rounded-lg p-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <CheckCircle className="w-3 h-3 text-warning-600" />
                                <span className="font-medium text-warning-800 text-xs">
                                  Sugestão de Alocação Múltipla
                                </span>
                              </div>
                              <div className="text-xs text-warning-700 mb-2">
                                O sistema sugere dividir os {lot.entryQuantity} animais entre {suggestedMultipleAllocation.length} currais:
                              </div>
                              <div className="space-y-1 mb-2">
                                {suggestedMultipleAllocation.map((alloc, index) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span>Curral {alloc.penNumber}:</span>
                                    <span className="font-medium">{alloc.quantity} animais</span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => setMultipleAllocations(suggestedMultipleAllocation)}
                                className="w-full px-3 py-1.5 bg-warning-500 text-white text-xs rounded hover:bg-warning-600 transition-colors"
                              >
                                Aceitar Sugestão
                              </button>
                            </div>
                          )}
                          
                          {/* Lista de alocações múltiplas */}
                          {multipleAllocations.length > 0 && (
                            <div className="space-y-2">
                              {multipleAllocations.map((alloc, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border border-neutral-200">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                                      Curral
                                    </label>
                                    <select
                                      value={alloc.penNumber}
                                      onChange={(e) => updateMultipleAllocation(index, 'penNumber', e.target.value)}
                                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:ring-2 focus:ring-warning-500 focus:border-warning-500"
                                    >
                                      <option value="">Selecione um curral</option>
                                      {availablePens.map(pen => {
                                        // Não mostrar currais já selecionados em outras alocações
                                        const isSelected = multipleAllocations.some((a, i) => i !== index && a.penNumber === pen.penNumber);
                                        if (isSelected) return null;
                                        
                                        return (
                                          <option key={pen.penNumber} value={pen.penNumber}>
                                            Curral {pen.penNumber} - {pen.currentAnimals}/{pen.capacity} ({pen.capacity - pen.currentAnimals} disponíveis)
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                  <div className="w-24">
                                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                                      Quantidade
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={alloc.quantity}
                                      onChange={(e) => updateMultipleAllocation(index, 'quantity', e.target.value)}
                                      className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:ring-2 focus:ring-warning-500 focus:border-warning-500"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeMultipleAllocation(index)}
                                    className="p-1.5 bg-error-500 text-white rounded hover:bg-error-600 transition-colors mt-5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              
                              {/* Resumo da alocação múltipla */}
                              <div className="bg-warning-50 border border-warning-200 rounded-lg p-2">
                                <div className="flex justify-between text-xs font-medium">
                                  <span>Total alocado:</span>
                                  <span>{lot.entryQuantity - remainingAnimals} de {lot.entryQuantity} animais</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium mt-1">
                                  <span>Restantes:</span>
                                  <span className={remainingAnimals > 0 ? "text-error-600" : "text-success-600"}>
                                    {remainingAnimals} animais
                                  </span>
                                </div>
                                {remainingAnimals !== 0 && (
                                  <div className="mt-1 p-1 bg-warning-100 text-warning-700 rounded text-xs">
                                    {remainingAnimals > 0 
                                      ? `⚠️ Ainda falta alocar ${remainingAnimals} animais` 
                                      : `⚠️ Você alocou ${Math.abs(remainingAnimals)} animais a mais que o total do lote`}
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={addMultipleAllocation}
                                className="w-full px-3 py-1.5 bg-warning-500 text-white text-xs rounded hover:bg-warning-600 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adicionar Mais um Curral</span>
                              </button>
                            </div>
                          )}
                          
                          {/* Botão para iniciar alocação múltipla */}
                          {multipleAllocations.length === 0 && suggestedMultipleAllocation.length === 0 && (
                            <button
                              onClick={addMultipleAllocation}
                              className="w-full px-3 py-2 bg-warning-500 text-white text-sm rounded hover:bg-warning-600 transition-colors flex items-center justify-center space-x-2"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Iniciar Alocação Múltipla</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAllocation}
                disabled={
                  (allocationMethod === 'any' && !bestPen) ||
                  (allocationMethod === 'specific' && !selectedPenNumber) ||
                  (allocationMethod === 'multiple' && (multipleAllocations.length === 0 || remainingAnimals !== 0))
                }
                className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Home className="w-3 h-3" />
                <span>Confirmar Alocação</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form de cadastro de curral */}
      {showPenForm && (
        <Portal>
          <div className="z-[10001]">
            <PenRegistrationForm
              isOpen={showPenForm}
              onClose={handlePenRegistrationAdded}
            />
          </div>
        </Portal>
      )}
    </>
  );
};