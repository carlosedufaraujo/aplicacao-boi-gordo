import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  Calendar, Filter, Download, Plus, BarChart3,
  FileText, AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { DREStatement, DREGenerationParams } from '../../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DREViewer } from './DREViewer';
import { DREComparison } from './DREComparison';
import { DREFilters } from './DREFilters';
import { clsx } from 'clsx';

export const DREStatementComponent: React.FC = () => {
  const { 
    cattleLots, 
    penRegistrations,
    generateDREStatement,
    saveDREStatement,
    dreStatements,
    compareDREs
  } = useAppStore();
  
  const [selectedEntityType, setSelectedEntityType] = useState<'lot' | 'pen' | 'global'>('global');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState(startOfMonth(subMonths(new Date(), 1)));
  const [periodEnd, setPeriodEnd] = useState(endOfMonth(new Date()));
  const [includeProjections, setIncludeProjections] = useState(true);
  const [pricePerArroba, setPricePerArroba] = useState(320);
  const [currentDRE, setCurrentDRE] = useState<DREStatement | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedEntitiesForComparison, setSelectedEntitiesForComparison] = useState<string[]>([]);

  // Gerar DRE quando parâmetros mudarem
  useEffect(() => {
    generateDRE();
  }, [selectedEntityType, selectedEntityId, periodStart, periodEnd, includeProjections, pricePerArroba]);

  const generateDRE = () => {
    const params: DREGenerationParams = {
      entityType: selectedEntityType,
      entityId: selectedEntityType !== 'global' ? selectedEntityId : undefined,
      periodStart,
      periodEnd,
      includeProjections,
      pricePerArroba
    };
    
    const dre = generateDREStatement(params);
    setCurrentDRE(dre);
  };

  const handleSaveDRE = () => {
    if (currentDRE) {
      saveDREStatement(currentDRE);
      // Adicionar notificação de sucesso
    }
  };

  const handleExportDRE = () => {
    if (!currentDRE) return;
    
    // Criar CSV do DRE
    const csvContent = generateDRECSV(currentDRE);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DRE_${currentDRE.entityType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const generateDRECSV = (dre: DREStatement): string => {
    const lines = [
      'DEMONSTRATIVO DE RESULTADOS DO EXERCÍCIO',
      `Período: ${format(dre.periodStart, 'dd/MM/yyyy')} a ${format(dre.periodEnd, 'dd/MM/yyyy')}`,
      `Entidade: ${dre.entityType === 'global' ? 'Global' : dre.entityId}`,
      '',
      'DESCRIÇÃO;VALOR',
      `RECEITA BRUTA;${dre.revenue.grossSales.toFixed(2)}`,
      `(-) Deduções;${dre.revenue.salesDeductions.toFixed(2)}`,
      `RECEITA LÍQUIDA;${dre.revenue.netSales.toFixed(2)}`,
      '',
      'CUSTO DOS PRODUTOS VENDIDOS',
      `Aquisição de Animais;${dre.costOfGoodsSold.animalPurchase.toFixed(2)}`,
      `Alimentação;${dre.costOfGoodsSold.feed.toFixed(2)}`,
      `Sanidade;${dre.costOfGoodsSold.health.toFixed(2)}`,
      `Frete;${dre.costOfGoodsSold.freight.toFixed(2)}`,
      `Mortalidade;${dre.costOfGoodsSold.mortality.toFixed(2)}`,
      `Quebra de Peso;${dre.costOfGoodsSold.weightLoss.toFixed(2)}`,
      `TOTAL CPV;${dre.costOfGoodsSold.total.toFixed(2)}`,
      '',
      `LUCRO BRUTO;${dre.grossProfit.toFixed(2)}`,
      `Margem Bruta %;${dre.grossMargin.toFixed(2)}`,
      '',
      'DESPESAS OPERACIONAIS',
      `Administrativas;${dre.operatingExpenses.administrative.toFixed(2)}`,
      `Comerciais;${dre.operatingExpenses.sales.toFixed(2)}`,
      `Financeiras;${dre.operatingExpenses.financial.toFixed(2)}`,
      `Depreciação;${dre.operatingExpenses.depreciation.toFixed(2)}`,
      `Outras;${dre.operatingExpenses.other.toFixed(2)}`,
      `TOTAL DESPESAS;${dre.operatingExpenses.total.toFixed(2)}`,
      '',
      `RESULTADO OPERACIONAL;${dre.operatingIncome.toFixed(2)}`,
      `Margem Operacional %;${dre.operatingMargin.toFixed(2)}`,
      '',
      `RESULTADO ANTES DOS IMPOSTOS;${dre.incomeBeforeTaxes.toFixed(2)}`,
      `(-) Imposto de Renda;${dre.taxes.incomeTax.toFixed(2)}`,
      `(-) Contribuição Social;${dre.taxes.socialContribution.toFixed(2)}`,
      '',
      `RESULTADO LÍQUIDO;${dre.netIncome.toFixed(2)}`,
      `Margem Líquida %;${dre.netMargin.toFixed(2)}`,
      '',
      'MÉTRICAS',
      `Receita por Cabeça;${dre.metrics.revenuePerHead.toFixed(2)}`,
      `Custo por Cabeça;${dre.metrics.costPerHead.toFixed(2)}`,
      `Lucro por Cabeça;${dre.metrics.profitPerHead.toFixed(2)}`,
      `Receita por Arroba;${dre.metrics.revenuePerArroba.toFixed(2)}`,
      `Custo por Arroba;${dre.metrics.costPerArroba.toFixed(2)}`,
      `Lucro por Arroba;${dre.metrics.profitPerArroba.toFixed(2)}`,
      `ROI %;${dre.metrics.roi.toFixed(2)}`,
      `Lucro Diário;${dre.metrics.dailyProfit.toFixed(2)}`
    ];
    
    return lines.join('\n');
  };

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col">
      {/* Header - Compacto e moderno */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-b3x-navy-900 mb-1">
            Demonstrativo de Resultados (DRE)
          </h2>
          <p className="text-xs lg:text-sm text-neutral-600">
            Análise detalhada de rentabilidade e performance financeira
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={clsx(
              "flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              showComparison 
                ? "bg-b3x-navy-900 text-white hover:bg-b3x-navy-800"
                : "bg-white text-b3x-navy-700 border border-neutral-200 hover:bg-neutral-50 shadow-soft hover:shadow-soft-lg"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {showComparison ? 'Visualização Única' : 'Comparar DREs'}
            </span>
          </button>
          
          {currentDRE && (
            <>
              <button
                onClick={handleSaveDRE}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-white text-b3x-navy-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all duration-200 shadow-soft hover:shadow-soft-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Salvar</span>
              </button>
              
              <button
                onClick={handleExportDRE}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft hover:shadow-soft-lg text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtros - Redesenhado */}
      <DREFilters
        selectedEntityType={selectedEntityType}
        setSelectedEntityType={setSelectedEntityType}
        selectedEntityId={selectedEntityId}
        setSelectedEntityId={setSelectedEntityId}
        periodStart={periodStart}
        setPeriodStart={setPeriodStart}
        periodEnd={periodEnd}
        setPeriodEnd={setPeriodEnd}
        includeProjections={includeProjections}
        setIncludeProjections={setIncludeProjections}
        pricePerArroba={pricePerArroba}
        setPricePerArroba={setPricePerArroba}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 min-h-0 mt-4">
        {showComparison ? (
          <DREComparison
            entityType={selectedEntityType === 'global' ? 'lot' : selectedEntityType}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        ) : (
          currentDRE ? (
            <DREViewer dre={currentDRE} />
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-warning-100 to-warning-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2">
                Nenhum dado disponível
              </h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto">
                Não há informações para gerar o demonstrativo no período selecionado. 
                Verifique os filtros ou selecione outro período.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}; 