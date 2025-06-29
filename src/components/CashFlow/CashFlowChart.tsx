import React, { useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashFlowMovement {
  id: string;
  date: Date;
  description: string;
  category: string;
  type: 'entrada' | 'saida';
  amount: number;
  status: string;
  relatedEntity?: string;
}

interface CashFlowChartProps {
  movements: CashFlowMovement[];
  period: 'day' | 'week' | 'month' | 'year';
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ movements, period }) => {
  const chartData = useMemo(() => {
    if (movements.length === 0) return [];

    // Determinar intervalo de datas
    const dates = movements.map(m => new Date(m.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Gerar array de dias no intervalo
    const days = eachDayOfInterval({ start: minDate, end: maxDate });

    // Calcular saldo acumulado por dia
    let runningBalance = 0;
    const dailyData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Movimentos do dia
      const dayMovements = movements.filter(m => 
        isWithinInterval(new Date(m.date), { start: dayStart, end: dayEnd })
      );

      // Calcular entradas e saídas do dia
      const dayIncome = dayMovements
        .filter(m => m.type === 'entrada')
        .reduce((sum, m) => sum + m.amount, 0);

      const dayExpenses = dayMovements
        .filter(m => m.type === 'saida')
        .reduce((sum, m) => sum + m.amount, 0);

      // Atualizar saldo acumulado
      runningBalance += dayIncome - dayExpenses;

      return {
        date: day,
        income: dayIncome,
        expenses: dayExpenses,
        balance: runningBalance,
        net: dayIncome - dayExpenses
      };
    });

    return dailyData;
  }, [movements]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-neutral-200">
        <div className="text-center text-neutral-500">
          <p className="text-lg">Nenhuma movimentação no período selecionado</p>
          <p className="text-sm mt-2">Adicione lançamentos para visualizar o gráfico</p>
        </div>
      </div>
    );
  }

  // Encontrar valores máximos para escala
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.income, d.expenses, Math.abs(d.balance)))
  );

  // Função para calcular altura da barra
  const getBarHeight = (value: number) => {
    const maxHeight = 200;
    return (Math.abs(value) / maxValue) * maxHeight;
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-b3x-navy-900">Evolução do Fluxo de Caixa</h3>
        <p className="text-sm text-neutral-600">Visualização diária do período</p>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-success-500 rounded"></div>
          <span className="text-sm text-neutral-600">Entradas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-error-500 rounded"></div>
          <span className="text-sm text-neutral-600">Saídas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-b3x-navy-900 rounded"></div>
          <span className="text-sm text-neutral-600">Saldo Acumulado</span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative">
        <div className="flex items-end justify-between gap-1 h-64 px-4">
          {chartData.slice(-30).map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              {/* Barras de entrada e saída */}
              <div className="relative w-full flex flex-col items-center justify-end h-48">
                {/* Barra de entrada */}
                {data.income > 0 && (
                  <div
                    className="absolute bottom-0 w-1/3 bg-success-500 rounded-t transition-all duration-300 hover:bg-success-600"
                    style={{ 
                      height: `${getBarHeight(data.income)}px`,
                      left: '0%'
                    }}
                    title={`Entradas: R$ ${data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                )}
                
                {/* Barra de saída */}
                {data.expenses > 0 && (
                  <div
                    className="absolute bottom-0 w-1/3 bg-error-500 rounded-t transition-all duration-300 hover:bg-error-600"
                    style={{ 
                      height: `${getBarHeight(data.expenses)}px`,
                      right: '0%'
                    }}
                    title={`Saídas: R$ ${data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                )}
              </div>

              {/* Data */}
              <div className="text-xs text-neutral-500 -rotate-45 transform origin-left whitespace-nowrap">
                {format(data.date, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Linha de saldo acumulado */}
        <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="2"
            points={chartData.slice(-30).map((data, index) => {
              const x = (index / (chartData.slice(-30).length - 1)) * 100;
              const y = 100 - ((data.balance + maxValue) / (maxValue * 2)) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
        </svg>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-200">
        <div>
          <p className="text-sm text-neutral-600">Total de Entradas</p>
          <p className="text-lg font-semibold text-success-600">
            R$ {chartData.reduce((sum, d) => sum + d.income, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Total de Saídas</p>
          <p className="text-lg font-semibold text-error-600">
            R$ {chartData.reduce((sum, d) => sum + d.expenses, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Saldo do Período</p>
          <p className={`text-lg font-semibold ${
            chartData[chartData.length - 1]?.net >= 0 ? 'text-success-600' : 'text-error-600'
          }`}>
            R$ {(chartData.reduce((sum, d) => sum + d.income, 0) - chartData.reduce((sum, d) => sum + d.expenses, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Saldo Acumulado</p>
          <p className={`text-lg font-semibold ${
            chartData[chartData.length - 1]?.balance >= 0 ? 'text-b3x-navy-900' : 'text-error-600'
          }`}>
            R$ {(chartData[chartData.length - 1]?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}; 