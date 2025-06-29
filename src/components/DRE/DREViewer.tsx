import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart,
  BarChart3, Activity, Target, Calendar, Percent,
  ArrowUpRight, ArrowDownRight, Wallet, Calculator
} from 'lucide-react';
import { DREStatement } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

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
    if (margin >= 15) return 'from-success-100 to-success-50';
    if (margin >= 10) return 'from-warning-100 to-warning-50';
    return 'from-error-100 to-error-50';
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-4">
      {/* Cards de Resumo - Modernizados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Receita Líquida */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-b3x-lime-100 to-b3x-lime-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-b3x-lime-600" />
            </div>
            <span className="text-xs font-medium text-b3x-lime-600 bg-b3x-lime-50 px-2 py-1 rounded-full">
              Receita
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs text-neutral-600">Receita Líquida</h3>
            <p className="text-xl font-bold text-b3x-navy-900">
              {formatCurrency(dre.revenue.netSales)}
            </p>
            <p className="text-xs text-neutral-500">
              {formatCurrency(dre.metrics.revenuePerArroba)}/@ 
            </p>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className={clsx(
              "p-2 rounded-lg",
              dre.netIncome >= 0 
                ? "bg-gradient-to-br from-success-100 to-success-50"
                : "bg-gradient-to-br from-error-100 to-error-50"
            )}>
              {dre.netIncome >= 0 ? (
                <TrendingUp className="w-5 h-5 text-success-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-error-600" />
              )}
            </div>
            <span className={clsx(
              "text-xs font-medium px-2 py-1 rounded-full",
              dre.netIncome >= 0 
                ? "text-success-600 bg-success-50"
                : "text-error-600 bg-error-50"
            )}>
              {dre.netIncome >= 0 ? 'Lucro' : 'Prejuízo'}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs text-neutral-600">Resultado Líquido</h3>
            <p className={clsx(
              "text-xl font-bold",
              dre.netIncome >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {formatCurrency(dre.netIncome)}
            </p>
            <p className={clsx(
              "text-xs font-medium",
              getMarginColor(dre.netMargin)
            )}>
              Margem: {formatPercentage(dre.netMargin)}
            </p>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-info-100 to-info-50 rounded-lg">
              <Target className="w-5 h-5 text-info-600" />
            </div>
            <span className="text-xs font-medium text-info-600 bg-info-50 px-2 py-1 rounded-full">
              ROI
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs text-neutral-600">Retorno s/ Investimento</h3>
            <p className={clsx(
              "text-xl font-bold",
              dre.metrics.roi >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {formatPercentage(dre.metrics.roi)}
            </p>
            <p className="text-xs text-neutral-500">
              Performance do período
            </p>
          </div>
        </div>

        {/* Lucro por Cabeça */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4 hover:shadow-soft-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-warning-100 to-warning-50 rounded-lg">
              <Activity className="w-5 h-5 text-warning-600" />
            </div>
            <span className="text-xs font-medium text-warning-600 bg-warning-50 px-2 py-1 rounded-full">
              Por Cabeça
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs text-neutral-600">Lucro por Animal</h3>
            <p className={clsx(
              "text-xl font-bold",
              dre.metrics.profitPerHead >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {formatCurrency(dre.metrics.profitPerHead)}
            </p>
            <p className="text-xs text-neutral-500">
              {formatCurrency(dre.metrics.dailyProfit)}/dia
            </p>
          </div>
        </div>
      </div>

      {/* DRE Detalhado - Modernizado */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Demonstrativo de Resultados
              </h3>
              <p className="text-sm text-b3x-lime-400 mt-1">
                {format(dre.periodStart, "dd 'de' MMMM", { locale: ptBR })} a {format(dre.periodEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="p-2 bg-white/10 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Receitas */}
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-b3x-lime-600" />
              RECEITAS
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Receita Bruta de Vendas</span>
                <span className="text-sm font-medium text-b3x-navy-900">{formatCurrency(dre.revenue.grossSales)}</span>
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
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-error-600" />
              CUSTO DOS PRODUTOS VENDIDOS
            </h4>
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
          <div className={clsx(
            "rounded-lg p-4 bg-gradient-to-r",
            getMarginBgColor(dre.grossMargin)
          )}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-b3x-navy-900">(=) LUCRO BRUTO</span>
                <span className={clsx(
                  "text-xs ml-3 px-2 py-1 rounded-full font-medium",
                  getMarginColor(dre.grossMargin),
                  dre.grossMargin >= 15 ? 'bg-success-100' : dre.grossMargin >= 10 ? 'bg-warning-100' : 'bg-error-100'
                )}>
                  <Percent className="w-3 h-3 inline mr-1" />
                  {formatPercentage(dre.grossMargin)}
                </span>
              </div>
              <span className={clsx(
                "text-lg font-bold",
                dre.grossProfit >= 0 ? 'text-success-600' : 'text-error-600'
              )}>
                {formatCurrency(dre.grossProfit)}
              </span>
            </div>
          </div>

          {/* Despesas Operacionais */}
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-warning-600" />
              DESPESAS OPERACIONAIS
            </h4>
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
          <div className={clsx(
            "rounded-lg p-4 bg-gradient-to-r",
            getMarginBgColor(dre.operatingMargin)
          )}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-b3x-navy-900">(=) RESULTADO OPERACIONAL (EBIT)</span>
                <span className={clsx(
                  "text-xs ml-3 px-2 py-1 rounded-full font-medium",
                  getMarginColor(dre.operatingMargin),
                  dre.operatingMargin >= 15 ? 'bg-success-100' : dre.operatingMargin >= 10 ? 'bg-warning-100' : 'bg-error-100'
                )}>
                  <Percent className="w-3 h-3 inline mr-1" />
                  {formatPercentage(dre.operatingMargin)}
                </span>
              </div>
              <span className={clsx(
                "text-lg font-bold",
                dre.operatingIncome >= 0 ? 'text-success-600' : 'text-error-600'
              )}>
                {formatCurrency(dre.operatingIncome)}
              </span>
            </div>
          </div>

          {/* Impostos */}
          {dre.incomeBeforeTaxes > 0 && (
            <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4">
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
          <div className="rounded-lg p-4 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-lg font-bold text-white">(=) RESULTADO LÍQUIDO</span>
                <span className={clsx(
                  "text-sm ml-3 px-3 py-1 rounded-full font-medium",
                  dre.netIncome >= 0 ? 'bg-success-500 text-white' : 'bg-error-500 text-white'
                )}>
                  {dre.netIncome >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 inline mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 inline mr-1" />
                  )}
                  {formatPercentage(dre.netMargin)}
                </span>
              </div>
              <span className={clsx(
                "text-2xl font-bold",
                dre.netIncome >= 0 ? 'text-b3x-lime-400' : 'text-error-400'
              )}>
                {formatCurrency(dre.netIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Adicionais - Modernizadas */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-4">
        <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-b3x-lime-600" />
          Métricas de Performance
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-lg p-3">
            <div className="text-xs text-neutral-600 mb-1">Receita por Arroba</div>
            <div className="text-lg font-bold text-b3x-navy-900">
              {formatCurrency(dre.metrics.revenuePerArroba)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-lg p-3">
            <div className="text-xs text-neutral-600 mb-1">Custo por Arroba</div>
            <div className="text-lg font-bold text-error-600">
              {formatCurrency(dre.metrics.costPerArroba)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-lg p-3">
            <div className="text-xs text-neutral-600 mb-1">Lucro por Arroba</div>
            <div className={clsx(
              "text-lg font-bold",
              dre.metrics.profitPerArroba >= 0 ? 'text-success-600' : 'text-error-600'
            )}>
              {formatCurrency(dre.metrics.profitPerArroba)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-lg p-3">
            <div className="text-xs text-neutral-600 mb-1">Dias em Confinamento</div>
            <div className="text-lg font-bold text-b3x-navy-900">
              {Math.round(dre.metrics.daysInConfinement)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 