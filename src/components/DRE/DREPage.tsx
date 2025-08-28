import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Filter,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useCattleLotsApi } from '../../hooks/api/useCattleLotsApi';
import { DREViewer } from './DREViewer';
import { DREFilters } from './DREFilters';
import { DREComparison } from './DREComparison';
import { DREStatement, DREGenerationParams } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DREPage: React.FC = () => {
  const { cattleLots } = useCattleLotsApi();
  
  // TODO: Implementar generateDREStatement, saveDREStatement, dreStatements com API
  const generateDREStatement = (params: any) => {
    console.log('TODO: Implementar generateDREStatement via API', params);
    return null;
  };
  const saveDREStatement = (dre: any) => {
    console.log('TODO: Implementar saveDREStatement via API', dre);
  };
  const dreStatements: any[] = [];

  const [selectedEntityType, setSelectedEntityType] = useState<'lot' | 'pen' | 'global'>('global');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date());
  const [includeProjections, setIncludeProjections] = useState(false);
  const [pricePerArroba, setPricePerArroba] = useState(320);
  const [currentDRE, setCurrentDRE] = useState<DREStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Selecionar o primeiro lote disponível ao carregar (apenas se não for global)
  useEffect(() => {
    if (selectedEntityType === 'lot' && cattleLots.length > 0 && !selectedEntityId) {
      setSelectedEntityId(cattleLots[0].id);
    }
  }, [cattleLots, selectedEntityId, selectedEntityType]);

  const handleGenerateDRE = () => {
    if (selectedEntityType !== 'global' && !selectedEntityId) {
      return;
    }

    setIsLoading(true);

    const params: DREGenerationParams = {
      entityType: selectedEntityType,
      entityId: selectedEntityType === 'global' ? undefined : selectedEntityId,
      periodStart,
      periodEnd,
      includeProjections,
      pricePerArroba
    };

    const dre = generateDREStatement(params);
    
    if (dre) {
      setCurrentDRE(dre);
      saveDREStatement(dre);
    }

    setIsLoading(false);
  };

  const handleExportCSV = () => {
    if (!currentDRE) return;

    const csvContent = `
DRE - Demonstrativo de Resultados
Período: ${format(currentDRE.periodStart, 'dd/MM/yyyy')} a ${format(currentDRE.periodEnd, 'dd/MM/yyyy')}
Entidade: ${currentDRE.entityName}

RECEITAS
Receita Bruta de Vendas,${currentDRE.revenue.grossSales}
(-) Deduções de Vendas,${currentDRE.revenue.salesDeductions}
(=) Receita Líquida,${currentDRE.revenue.netSales}

CUSTO DOS PRODUTOS VENDIDOS
Aquisição de Animais,${currentDRE.costOfGoodsSold.animalPurchase}
Alimentação,${currentDRE.costOfGoodsSold.feed}
Sanidade,${currentDRE.costOfGoodsSold.health}
Frete,${currentDRE.costOfGoodsSold.freight}
Mortalidade,${currentDRE.costOfGoodsSold.mortality}
Quebra de Peso,${currentDRE.costOfGoodsSold.weightLoss}
(-) Total CPV,${currentDRE.costOfGoodsSold.total}

(=) LUCRO BRUTO,${currentDRE.grossProfit}
Margem Bruta (%),${currentDRE.grossMargin}

DESPESAS OPERACIONAIS
Despesas Administrativas,${currentDRE.operatingExpenses.administrative}
Despesas Comerciais,${currentDRE.operatingExpenses.sales}
Despesas Financeiras,${currentDRE.operatingExpenses.financial}
Depreciação,${currentDRE.operatingExpenses.depreciation}
Outras Despesas,${currentDRE.operatingExpenses.other}
(-) Total Despesas,${currentDRE.operatingExpenses.total}

(=) RESULTADO OPERACIONAL (EBIT),${currentDRE.operatingIncome}
Margem Operacional (%),${currentDRE.operatingMargin}

IMPOSTOS
Imposto de Renda,${currentDRE.taxes.incomeTax}
Contribuição Social,${currentDRE.taxes.socialContribution}

(=) RESULTADO LÍQUIDO,${currentDRE.netIncome}
Margem Líquida (%),${currentDRE.netMargin}

MÉTRICAS
Receita por Arroba,${currentDRE.metrics.revenuePerArroba}
Custo por Arroba,${currentDRE.metrics.costPerArroba}
Lucro por Arroba,${currentDRE.metrics.profitPerArroba}
Lucro por Cabeça,${currentDRE.metrics.profitPerHead}
ROI (%),${currentDRE.metrics.roi}
Dias em Confinamento,${currentDRE.metrics.daysInConfinement}
Lucro Diário,${currentDRE.metrics.dailyProfit}
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DRE_${currentDRE.entityName}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-b3x-navy-900 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-b3x-navy-600" />
              DRE Integrado
            </h1>
            <p className="text-neutral-600 mt-1">
              Demonstrativo de Resultados por Lote e Curral
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentDRE && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors flex items-center"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Comparar
                </button>
              </>
            )}
            <button
              onClick={handleGenerateDRE}
              disabled={(selectedEntityType !== 'global' && !selectedEntityId) || isLoading}
              className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Gerar DRE
            </button>
          </div>
        </div>

        {/* Filtros */}
        <DREFilters
          entityType={selectedEntityType}
          entityId={selectedEntityId}
          periodStart={periodStart}
          periodEnd={periodEnd}
          includeProjections={includeProjections}
          pricePerArroba={pricePerArroba}
          onEntityTypeChange={setSelectedEntityType}
          onEntityIdChange={setSelectedEntityId}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          onIncludeProjectionsChange={setIncludeProjections}
          onPricePerArrobaChange={setPricePerArroba}
        />
      </div>

      {/* Conteúdo Principal */}
      {cattleLots.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2">
            Nenhum lote disponível
          </h3>
          <p className="text-neutral-600 text-sm">
            É necessário ter pelo menos um lote cadastrado para gerar o DRE.
          </p>
        </div>
      ) : currentDRE ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* DRE Viewer */}
          <div className={showComparison ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <DREViewer dre={currentDRE} />
          </div>

          {/* Comparação */}
          {showComparison && (
            <div className="lg:col-span-4">
              <DREComparison
                currentDRE={currentDRE}
                entityType={selectedEntityType}
                periodStart={periodStart}
                periodEnd={periodEnd}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-12 text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2">
            Selecione os filtros e gere o DRE
          </h3>
          <p className="text-neutral-600 text-sm">
            Configure o período e a entidade desejada para visualizar o demonstrativo de resultados.
          </p>
        </div>
      )}
    </div>
  );
}; 