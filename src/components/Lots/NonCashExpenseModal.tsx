import React, { useState } from 'react';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattlePurchase } from '../../types';
import { formatWeight } from '@/utils/formatters';

interface NonCashExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: CattlePurchase;
}

export const NonCashExpenseModal: React.FC<NonCashExpenseModalProps> = ({ isOpen, onClose, lot }) => {
  const { recordMortality, recordWeightLoss, addNotification } = useAppStore();
  const [expenseType, setExpenseType] = useState<'mortality' | 'currentWeight_loss'>('mortality');
  
  // Estados para mortalidade
  const [mortalityQuantity, setMortalityQuantity] = useState(1);
  const [mortalityCause, setMortalityCause] = useState<'disease' | 'accident' | 'stress' | 'unknown'>('unknown');
  const [mortalityNotes, setMortalityNotes] = useState('');
  
  // Estados para quebra de peso
  const [expectedWeight, setExpectedWeight] = useState(lot.entryWeight);
  const [actualWeight, setActualWeight] = useState(lot.entryWeight);
  const [currentWeightLossNotes, setWeightLossNotes] = useState('');

  const handleSubmit = () => {
    if (expenseType === 'mortality') {
      recordMortality(lot.id, mortalityQuantity, mortalityCause, mortalityNotes);
      
      // Adicionar notificação
      addNotification({
        title: 'Mortalidade Registrada',
        message: `${mortalityQuantity} animal(is) registrado(s) como morto(s) no lote ${lot.lotNumber}`,
        type: 'warning',
        relatedEntityType: 'cattle_lot',
        relatedEntityId: lot.id
      });
    } else {
      recordWeightLoss(lot.id, expectedWeight, actualWeight, weightLossNotes);
      
      const currentWeightLoss = expectedWeight - actualWeight;
      const lossPercentage = (currentWeightLoss / expectedWeight) * 100;
      
      // Adicionar notificação
      addNotification({
        title: 'Quebra de Peso Registrada',
        message: `Quebra de ${currentWeightLoss}kg (${lossPercentage.toFixed(1)}%) registrada no lote ${lot.lotNumber}`,
        type: 'info',
        relatedEntityType: 'cattle_lot',
        relatedEntityId: lot.id
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-b3x-navy-900">
            Registrar Lançamento Não-Caixa
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção do tipo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tipo de Lançamento
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExpenseType('mortality')}
              className={`p-3 rounded-lg border-2 transition-all ${
                expenseType === 'mortality'
                  ? 'border-error-500 bg-error-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${
                expenseType === 'mortality' ? 'text-error-600' : 'text-neutral-400'
              }`} />
              <span className={`text-sm font-medium ${
                expenseType === 'mortality' ? 'text-error-700' : 'text-neutral-600'
              }`}>
                Mortalidade
              </span>
            </button>
            
            <button
              onClick={() => setExpenseType('weight_loss')}
              className={`p-3 rounded-lg border-2 transition-all ${
                expenseType === 'weight_loss'
                  ? 'border-warning-500 bg-warning-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${
                expenseType === 'weight_loss' ? 'text-warning-600' : 'text-neutral-400'
              }`} />
              <span className={`text-sm font-medium ${
                expenseType === 'weight_loss' ? 'text-warning-700' : 'text-neutral-600'
              }`}>
                Quebra de Peso
              </span>
            </button>
          </div>
        </div>

        {/* Formulário de Mortalidade */}
        {expenseType === 'mortality' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Quantidade de Animais
              </label>
              <input
                type="number"
                min="1"
                max={lot.entryQuantity - lot.deaths}
                value={mortalityQuantity}
                onChange={(e) => setMortalityQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Máximo: {lot.entryQuantity - lot.deaths} animais
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Causa da Morte
              </label>
              <select
                value={mortalityCause}
                onChange={(e) => setMortalityCause(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              >
                <option value="unknown">Desconhecida</option>
                <option value="disease">Doença</option>
                <option value="accident">Acidente</option>
                <option value="stress">Estresse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Observações
              </label>
              <textarea
                rows={3}
                value={mortalityNotes}
                onChange={(e) => setMortalityNotes(e.target.value)}
                placeholder="Detalhes sobre a ocorrência..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Formulário de Quebra de Peso */}
        {expenseType === 'currentWeight_loss' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Peso Esperado (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={expectedWeight}
                onChange={(e) => setExpectedWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Peso Real (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
              {expectedWeight > actualWeight && (
                <p className="text-xs text-warning-600 mt-1">
                  Quebra: {(expectedWeight - actualWeight).toFixed(1)}kg ({((expectedWeight - actualWeight) / expectedWeight * 100).toFixed(1)}%)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Observações
              </label>
              <textarea
                rows={3}
                value={currentWeightLossNotes}
                onChange={(e) => setWeightLossNotes(e.target.value)}
                placeholder="Motivo da quebra de peso..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Aviso sobre impacto */}
        <div className="mt-4 p-3 bg-info-50 border border-info-200 rounded-lg">
          <p className="text-sm text-info-700">
            <strong>Importante:</strong> Este lançamento não afetará o fluxo de caixa, 
            mas será registrado no DRE e afetará o resultado do lote.
          </p>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (expenseType === 'mortality' && mortalityQuantity <= 0) ||
              (expenseType === 'currentWeight_loss' && actualWeight >= expectedWeight)
            }
            className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}; 
