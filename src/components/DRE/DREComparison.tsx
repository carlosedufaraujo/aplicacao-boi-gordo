import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { DREComparison as DREComparisonType } from '../../types';

interface DREComparisonProps {
  entityType: 'lot' | 'pen';
  periodStart: Date;
  periodEnd: Date;
}

export const DREComparison: React.FC<DREComparisonProps> = ({
  entityType,
  periodStart,
  periodEnd
}) => {
  const { cattleLots, penRegistrations, compareDREs } = useAppStore();
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [comparison, setComparison] = useState<DREComparisonType | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEntities.length >= 2) {
      const result = compareDREs(selectedEntities, entityType, periodStart, periodEnd);
      setComparison(result);
    } else {
      setComparison(null);
    }
  }, [selectedEntities, entityType, periodStart, periodEnd]);

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, isPercentage: boolean = false) => {
    if (isPercentage) {
      if (value >= 15) return 'text-success-600';
      if (value >= 10) return 'text-warning-600';
      return 'text-error-600';
    }
    return value >= 0 ? 'text-success-600' : 'text-error-600';
  };

  const entities = entityType === 'lot' 
    ? cattleLots.filter(lot => lot.status === 'active' || lot.status === 'sold')
    : penRegistrations.filter(pen => pen.isActive);

  return (
    <div className="space-y-6">
      {/* Seleção de Entidades */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
          Selecione {entityType === 'lot' ? 'Lotes' : 'Currais'} para Comparar
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {entities.map(entity => {
            const id = entityType === 'lot' ? entity.id : (entity as any).penNumber;
            const label = entityType === 'lot' 
              ? `${(entity as any).lotNumber} - ${(entity as any).entryQuantity} animais`
              : `Curral ${(entity as any).penNumber}`;
            
            return (
              <label key={id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEntities.includes(id)}
                  onChange={() => handleEntityToggle(id)}
                  className="h-4 w-4 text-b3x-lime-500 focus:ring-b3x-lime-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">{label}</span>
              </label>
            );
          })}
        </div>
        
        {selectedEntities.length < 2 && (
          <p className="text-sm text-warning-600 mt-3">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Selecione pelo menos 2 {entityType === 'lot' ? 'lotes' : 'currais'} para comparar
          </p>
        )}
      </div>

      {/* Resultados da Comparação */}
      {comparison && (
        <>
          {/* Resumo Geral */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
              Resumo da Comparação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="text-sm text-neutral-600 mb-1">Lucro Total</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(comparison.comparisonMetrics.totalNetIncome)}`}>
                  {formatCurrency(comparison.comparisonMetrics.totalNetIncome)}
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="text-sm text-neutral-600 mb-1">Margem Líquida Média</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(comparison.comparisonMetrics.averageNetMargin, true)}`}>
                  {formatPercentage(comparison.comparisonMetrics.averageNetMargin)}
                </div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="text-sm text-neutral-600 mb-1">ROI Médio</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(comparison.comparisonMetrics.averageROI, true)}`}>
                  {formatPercentage(comparison.comparisonMetrics.averageROI)}
                </div>
              </div>
            </div>

            {/* Insights */}
            {comparison.insights.length > 0 && (
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-info-900 mb-2">Insights</h4>
                <ul className="space-y-1">
                  {comparison.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-info-700 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tabela Comparativa */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-b3x-navy-900">
                Comparação Detalhada
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      {entityType === 'lot' ? 'Lote' : 'Curral'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Receita Líquida
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      CPV Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Lucro Líquido
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Margem %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      ROI %
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {comparison.entities.map(entity => (
                    <React.Fragment key={entity.id}>
                      <tr className={entity.id === comparison.comparisonMetrics.bestPerformer ? 'bg-success-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-b3x-navy-900">
                            {entity.name}
                          </div>
                          {entity.id === comparison.comparisonMetrics.bestPerformer && (
                            <span className="text-xs text-success-600 flex items-center mt-1">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Melhor desempenho
                            </span>
                          )}
                          {entity.id === comparison.comparisonMetrics.worstPerformer && (
                            <span className="text-xs text-error-600 flex items-center mt-1">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Pior desempenho
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {formatCurrency(entity.dre.revenue.netSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {formatCurrency(entity.dre.costOfGoodsSold.total)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getPerformanceColor(entity.dre.netIncome)}`}>
                          {formatCurrency(entity.dre.netIncome)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getPerformanceColor(entity.dre.netMargin, true)}`}>
                          {formatPercentage(entity.dre.netMargin)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getPerformanceColor(entity.dre.metrics.roi, true)}`}>
                          {formatPercentage(entity.dre.metrics.roi)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => setExpandedEntity(expandedEntity === entity.id ? null : entity.id)}
                            className="text-b3x-navy-700 hover:text-b3x-navy-900"
                          >
                            {expandedEntity === entity.id ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Detalhes Expandidos */}
                      {expandedEntity === entity.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-neutral-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-neutral-600">Custo/Arroba</div>
                                <div className="text-sm font-medium">
                                  {formatCurrency(entity.dre.metrics.costPerArroba)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-neutral-600">Lucro/Arroba</div>
                                <div className="text-sm font-medium">
                                  {formatCurrency(entity.dre.metrics.profitPerArroba)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-neutral-600">Lucro/Cabeça</div>
                                <div className="text-sm font-medium">
                                  {formatCurrency(entity.dre.metrics.profitPerHead)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-neutral-600">Dias Confinamento</div>
                                <div className="text-sm font-medium">
                                  {Math.round(entity.dre.metrics.daysInConfinement)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Composição de Custos */}
                            <div className="mt-4 pt-4 border-t border-neutral-200">
                              <h5 className="text-sm font-medium text-b3x-navy-900 mb-2">
                                Composição de Custos
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Aquisição:</span>
                                  <span>{formatCurrency(entity.dre.costOfGoodsSold.animalPurchase)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Alimentação:</span>
                                  <span>{formatCurrency(entity.dre.costOfGoodsSold.feed)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Sanidade:</span>
                                  <span>{formatCurrency(entity.dre.costOfGoodsSold.health)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-neutral-600">Frete:</span>
                                  <span>{formatCurrency(entity.dre.costOfGoodsSold.freight)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 