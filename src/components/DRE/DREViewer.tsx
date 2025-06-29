import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart,
  BarChart3, Activity, Target, Calendar
} from 'lucide-react';
import { DREStatement } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DREViewerProps {
  dre: DREStatement;
}

export const DREViewer: React.FC<DREViewerProps> = ({ dre }) => {
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

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return 'text-success-600';
    if (margin >= 10) return 'text-warning-600';
    return 'text-error-600';
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 15) return 'bg-success-50';
    if (margin >= 10) return 'bg-warning-50';
    return 'bg-error-50';
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Receita Líquida</span>
            <DollarSign className="w-5 h-5 text-b3x-lime-500" />
          </div>
          <div className="text-2xl font-bold text-b3x-navy-900">
            {formatCurrency(dre.revenue.netSales)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {formatCurrency(dre.metrics.revenuePerArroba)}/@ 
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Lucro Líquido</span>
            {dre.netIncome >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-error-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${dre.netIncome >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {formatCurrency(dre.netIncome)}
          </div>
          <div className={`text-xs mt-1 ${getMarginColor(dre.netMargin)}`}>
            Margem: {formatPercentage(dre.netMargin)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">ROI</span>
            <Target className="w-5 h-5 text-info-500" />
          </div>
          <div className={`text-2xl font-bold ${dre.metrics.roi >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {formatPercentage(dre.metrics.roi)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Retorno sobre investimento
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Lucro/Cabeça</span>
            <Activity className="w-5 h-5 text-warning-500" />
          </div>
          <div className={`text-2xl font-bold ${dre.metrics.profitPerHead >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {formatCurrency(dre.metrics.profitPerHead)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {formatCurrency(dre.metrics.dailyProfit)}/dia
          </div>
        </div>
      </div>

      {/* DRE Detalhado */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-b3x-navy-900">
            Demonstrativo de Resultados
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Período: {format(dre.periodStart, "dd 'de' MMMM", { locale: ptBR })} a {format(dre.periodEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Receitas */}
          <div>
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3">RECEITAS</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Receita Bruta de Vendas</span>
                <span className="text-sm font-medium">{formatCurrency(dre.revenue.grossSales)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">(-) Deduções de Vendas</span>
                <span className="text-sm font-medium text-error-600">
                  {dre.revenue.salesDeductions > 0 ? '-' : ''}{formatCurrency(Math.abs(dre.revenue.salesDeductions))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <span className="text-sm font-semibold text-b3x-navy-900">(=) Receita Líquida</span>
                <span className="text-sm font-bold text-b3x-navy-900">{formatCurrency(dre.revenue.netSales)}</span>
              </div>
            </div>
          </div>

          {/* Custos dos Produtos Vendidos */}
          <div>
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3">CUSTO DOS PRODUTOS VENDIDOS</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Aquisição de Animais</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.costOfGoodsSold.animalPurchase)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Alimentação</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.costOfGoodsSold.feed)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Sanidade</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.costOfGoodsSold.health)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Frete</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.costOfGoodsSold.freight)}
                </span>
              </div>
              {dre.costOfGoodsSold.mortality > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 italic">Perdas por Mortalidade</span>
                  <span className="text-sm font-medium text-error-600 italic">
                    -{formatCurrency(dre.costOfGoodsSold.mortality)}
                  </span>
                </div>
              )}
              {dre.costOfGoodsSold.weightLoss > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 italic">Perdas por Quebra de Peso</span>
                  <span className="text-sm font-medium text-error-600 italic">
                    -{formatCurrency(dre.costOfGoodsSold.weightLoss)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <span className="text-sm font-semibold text-b3x-navy-900">(-) Total CPV</span>
                <span className="text-sm font-bold text-error-600">
                  -{formatCurrency(dre.costOfGoodsSold.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Lucro Bruto */}
          <div className="py-3 px-4 bg-neutral-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-b3x-navy-900">(=) LUCRO BRUTO</span>
                <span className={`text-xs ml-2 px-2 py-1 rounded-full ${getMarginBgColor(dre.grossMargin)} ${getMarginColor(dre.grossMargin)}`}>
                  {formatPercentage(dre.grossMargin)}
                </span>
              </div>
              <span className={`text-lg font-bold ${dre.grossProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(dre.grossProfit)}
              </span>
            </div>
          </div>

          {/* Despesas Operacionais */}
          <div>
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3">DESPESAS OPERACIONAIS</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Despesas Administrativas</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.operatingExpenses.administrative)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Despesas Comerciais</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.operatingExpenses.sales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Despesas Financeiras</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.operatingExpenses.financial)}
                </span>
              </div>
              {dre.operatingExpenses.depreciation > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 italic">Depreciação</span>
                  <span className="text-sm font-medium text-error-600 italic">
                    -{formatCurrency(dre.operatingExpenses.depreciation)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Outras Despesas</span>
                <span className="text-sm font-medium text-error-600">
                  -{formatCurrency(dre.operatingExpenses.other)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <span className="text-sm font-semibold text-b3x-navy-900">(-) Total Despesas</span>
                <span className="text-sm font-bold text-error-600">
                  -{formatCurrency(dre.operatingExpenses.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Resultado Operacional */}
          <div className="py-3 px-4 bg-neutral-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-b3x-navy-900">(=) RESULTADO OPERACIONAL (EBIT)</span>
                <span className={`text-xs ml-2 px-2 py-1 rounded-full ${getMarginBgColor(dre.operatingMargin)} ${getMarginColor(dre.operatingMargin)}`}>
                  {formatPercentage(dre.operatingMargin)}
                </span>
              </div>
              <span className={`text-lg font-bold ${dre.operatingIncome >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(dre.operatingIncome)}
              </span>
            </div>
          </div>

          {/* Impostos */}
          {dre.incomeBeforeTaxes > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3">IMPOSTOS</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Imposto de Renda (15%)</span>
                  <span className="text-sm font-medium text-error-600">
                    -{formatCurrency(dre.taxes.incomeTax)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Contribuição Social (9%)</span>
                  <span className="text-sm font-medium text-error-600">
                    -{formatCurrency(dre.taxes.socialContribution)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resultado Líquido */}
          <div className="py-4 px-4 bg-b3x-navy-900 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-bold text-white">(=) RESULTADO LÍQUIDO</span>
                <span className={`text-sm ml-2 px-2 py-1 rounded-full ${dre.netIncome >= 0 ? 'bg-success-500' : 'bg-error-500'} text-white`}>
                  {formatPercentage(dre.netMargin)}
                </span>
              </div>
              <span className={`text-2xl font-bold ${dre.netIncome >= 0 ? 'text-b3x-lime-400' : 'text-error-400'}`}>
                {formatCurrency(dre.netIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
          Métricas de Performance
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-neutral-600 mb-1">Receita por Arroba</div>
            <div className="text-xl font-bold text-b3x-navy-900">
              {formatCurrency(dre.metrics.revenuePerArroba)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-600 mb-1">Custo por Arroba</div>
            <div className="text-xl font-bold text-error-600">
              {formatCurrency(dre.metrics.costPerArroba)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-600 mb-1">Lucro por Arroba</div>
            <div className={`text-xl font-bold ${dre.metrics.profitPerArroba >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {formatCurrency(dre.metrics.profitPerArroba)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-600 mb-1">Dias em Confinamento</div>
            <div className="text-xl font-bold text-b3x-navy-900">
              {Math.round(dre.metrics.daysInConfinement)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 