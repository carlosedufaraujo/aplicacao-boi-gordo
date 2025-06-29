import React from 'react';
import { 
  Calendar, DollarSign, CheckCircle, AlertCircle, 
  XCircle, ChevronRight, Trash2 
} from 'lucide-react';
import { IndirectCostAllocation } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AllocationListProps {
  allocations: IndirectCostAllocation[];
  onSelect: (allocation: IndirectCostAllocation) => void;
  onApprove: (id: string) => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  getMethodIcon: (method: string) => any;
  getMethodLabel: (method: string) => string;
}

export const AllocationList: React.FC<AllocationListProps> = ({
  allocations,
  onSelect,
  onApprove,
  onApply,
  onDelete,
  getMethodIcon,
  getMethodLabel
}) => {
  const getStatusBadge = (status: IndirectCostAllocation['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-warning-100 text-warning-700 rounded-full">
            Rascunho
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-info-100 text-info-700 rounded-full">
            Aprovado
          </span>
        );
      case 'applied':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded-full">
            Aplicado
          </span>
        );
    }
  };

  const getCostTypeLabel = (type: string) => {
    switch (type) {
      case 'administrative': return 'Administrativo';
      case 'financial': return 'Financeiro';
      case 'operational': return 'Operacional';
      case 'marketing': return 'Marketing';
      default: return 'Outros';
    }
  };

  if (allocations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-neutral-200">
        <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-600">Nenhum rateio encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Rateio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Método
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {allocations.map((allocation) => {
              const MethodIcon = getMethodIcon(allocation.allocationMethod);
              
              return (
                <tr 
                  key={allocation.id} 
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => onSelect(allocation)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-b3x-navy-900">
                        {allocation.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {getCostTypeLabel(allocation.costType)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-neutral-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(allocation.period.startDate, "dd/MM", { locale: ptBR })} - 
                      {format(allocation.period.endDate, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-neutral-600">
                      <MethodIcon className="w-4 h-4 mr-1" />
                      {getMethodLabel(allocation.allocationMethod)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-b3x-navy-900">
                      {allocation.totalAmount.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {allocation.allocations.length} lotes
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(allocation.status)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      {allocation.status === 'draft' && (
                        <>
                          <button
                            onClick={() => onApprove(allocation.id)}
                            className="p-1.5 text-info-600 hover:bg-info-50 rounded-lg transition-colors"
                            title="Aprovar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(allocation.id)}
                            className="p-1.5 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {allocation.status === 'approved' && (
                        <button
                          onClick={() => onApply(allocation.id)}
                          className="px-3 py-1.5 text-sm bg-success-500 text-white rounded-lg hover:bg-success-600 flex items-center"
                        >
                          Aplicar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      )}
                      
                      {allocation.status === 'applied' && (
                        <span className="text-sm text-neutral-500">
                          Aplicado em {format(allocation.appliedAt!, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 