import React, { useState } from 'react';
import { 
  X, Save, Edit2, AlertCircle, DollarSign, 
  Percent, Users, Calendar, Weight 
} from 'lucide-react';
import { IndirectCostAllocation } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Portal } from '../Common/Portal';

interface AllocationPreviewProps {
  allocation: IndirectCostAllocation;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (allocation: IndirectCostAllocation) => void;
}

export const AllocationPreview: React.FC<AllocationPreviewProps> = ({
  allocation,
  onSave,
  onCancel,
  onEdit
}) => {
  const [editingAllocations, setEditingAllocations] = useState(false);
  const [localAllocation, setLocalAllocation] = useState(allocation);

  const handleAllocationChange = (entityId: string, newAmount: number) => {
    const totalOtherAllocations = localAllocation.allocations
      .filter(a => a.entityId !== entityId)
      .reduce((sum, a) => sum + a.allocatedAmount, 0);
    
    const remainingAmount = localAllocation.totalAmount - totalOtherAllocations;
    const adjustedAmount = Math.min(newAmount, remainingAmount);
    
    const updatedAllocations = localAllocation.allocations.map(alloc => {
      if (alloc.entityId === entityId) {
        const percentage = (adjustedAmount / localAllocation.totalAmount) * 100;
        return { ...alloc, allocatedAmount: adjustedAmount, percentage };
      }
      return alloc;
    });
    
    setLocalAllocation({ ...localAllocation, allocations: updatedAllocations });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'by_heads': return Users;
      case 'by_value': return DollarSign;
      case 'by_days': return Calendar;
      case 'by_weight': return Weight;
      default: return Percent;
    }
  };

  const MethodIcon = getMethodIcon(allocation.allocationMethod);

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-b3x-navy-900">
                Preview do Rateio
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Revise a distribuição antes de salvar
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Informações Gerais */}
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Nome:</span>
                <span className="text-sm font-medium text-b3x-navy-900">{localAllocation.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Período:</span>
                <span className="text-sm font-medium text-b3x-navy-900">
                  {format(localAllocation.period.startDate, "dd/MM/yyyy", { locale: ptBR })} - 
                  {format(localAllocation.period.endDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Valor Total:</span>
                <span className="text-lg font-bold text-b3x-navy-900">
                  {localAllocation.totalAmount.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Método:</span>
                <div className="flex items-center">
                  <MethodIcon className="w-4 h-4 mr-1 text-neutral-500" />
                  <span className="text-sm font-medium text-b3x-navy-900">
                    {allocation.allocationMethod === 'by_heads' && 'Por Cabeças'}
                    {allocation.allocationMethod === 'by_value' && 'Por Valor'}
                    {allocation.allocationMethod === 'by_days' && 'Por Dias'}
                    {allocation.allocationMethod === 'by_weight' && 'Por Peso'}
                  </span>
                </div>
              </div>
            </div>

            {/* Distribuição */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-b3x-navy-900">
                  Distribuição por Lote
                </h3>
                {!editingAllocations && (
                  <button
                    onClick={() => setEditingAllocations(true)}
                    className="text-sm text-b3x-navy-700 hover:text-b3x-navy-900 flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Ajustar valores
                  </button>
                )}
              </div>

              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">
                        Lote
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase">
                        Base Cálculo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase">
                        %
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-700 uppercase">
                        Valor Alocado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {localAllocation.allocations.map((alloc) => (
                      <tr key={alloc.entityId}>
                        <td className="px-4 py-3 text-sm font-medium text-b3x-navy-900">
                          {alloc.entityName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-neutral-600">
                          {allocation.allocationMethod === 'by_heads' && `${alloc.heads} cabeças`}
                          {allocation.allocationMethod === 'by_value' && 
                            alloc.value?.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            })
                          }
                          {allocation.allocationMethod === 'by_days' && `${alloc.days} dias`}
                          {allocation.allocationMethod === 'by_weight' && `${alloc.weight?.toLocaleString('pt-BR')} kg`}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-neutral-600">
                          {alloc.percentage.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {editingAllocations ? (
                            <input
                              type="number"
                              value={alloc.allocatedAmount}
                              onChange={(e) => handleAllocationChange(alloc.entityId, Number(e.target.value))}
                              className="w-24 px-2 py-1 text-right border border-neutral-300 rounded"
                              step="0.01"
                              min="0"
                            />
                          ) : (
                            <span className="font-medium text-b3x-navy-900">
                              {alloc.allocatedAmount.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              })}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-b3x-navy-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-b3x-navy-900">
                        {localAllocation.allocations.reduce((sum, a) => sum + a.percentage, 0).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-b3x-navy-900">
                        {localAllocation.allocations
                          .reduce((sum, a) => sum + a.allocatedAmount, 0)
                          .toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Aviso de diferença */}
              {Math.abs(localAllocation.totalAmount - localAllocation.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)) > 0.01 && (
                <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-warning-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-800">
                    Há uma diferença entre o valor total e a soma das alocações. 
                    Ajuste os valores antes de salvar.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-neutral-200 flex justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Cancelar
            </button>
            
            <div className="flex space-x-3">
              {editingAllocations && (
                <button
                  onClick={() => {
                    onEdit(localAllocation);
                    setEditingAllocations(false);
                  }}
                  className="px-4 py-2 text-b3x-navy-700 bg-white border border-b3x-navy-300 rounded-lg hover:bg-neutral-50"
                >
                  Aplicar Ajustes
                </button>
              )}
              
              <button
                onClick={onSave}
                disabled={Math.abs(localAllocation.totalAmount - localAllocation.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)) > 0.01}
                className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Rateio
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}; 