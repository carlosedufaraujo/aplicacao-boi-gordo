import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  Calendar, Filter, Download, Plus, BarChart3,
  FileText, AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { DREStatement, DREGenerationParams } from '../../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DREViewer } from './DREViewer';
import { DREComparison } from './DREComparison';
import { DREFilters } from './DREFilters';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-b3x-navy-900">
            Demonstrativo de Resultados (DRE)
          </h1>
          <p className="text-neutral-600 mt-1">
            Análise de rentabilidade por lote, curral ou global
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 text-b3x-navy-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showComparison ? 'Visualização Única' : 'Comparar DREs'}
          </button>
          
          {currentDRE && (
            <>
              <button
                onClick={handleSaveDRE}
                className="px-4 py-2 text-b3x-navy-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Salvar DRE
              </button>
              
              <button
                onClick={handleExportDRE}
                className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
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
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
            <p className="text-neutral-600">
              Nenhum dado disponível para o período selecionado.
            </p>
          </div>
        )
      )}
    </div>
  );
}; 