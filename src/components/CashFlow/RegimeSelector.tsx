import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type FinancialRegime = 'CAIXA' | 'COMPETENCIA' | 'PROJECAO';

interface RegimeSelectorProps {
  value: FinancialRegime;
  onChange: (value: FinancialRegime) => void;
  showDescription?: boolean;
}

const regimeInfo = {
  CAIXA: {
    label: 'Regime de Caixa',
    icon: Wallet,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Mostra apenas movimentações realizadas (pagas/recebidas)',
    tooltip: 'Visão do dinheiro que efetivamente entrou ou saiu da conta',
    badge: 'Realizado',
    badgeVariant: 'default' as const
  },
  COMPETENCIA: {
    label: 'Regime de Competência',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Mostra receitas e despesas no período em que ocorreram',
    tooltip: 'Visão econômica das operações, independente do pagamento',
    badge: 'Previsto',
    badgeVariant: 'secondary' as const
  },
  PROJECAO: {
    label: 'Projeção de Fluxo',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Combina realizados (caixa) com previstos (vencimentos)',
    tooltip: 'Visão completa para planejamento financeiro',
    badge: 'Misto',
    badgeVariant: 'outline' as const
  }
};

export const RegimeSelector: React.FC<RegimeSelectorProps> = ({
  value,
  onChange,
  showDescription = true
}) => {
  const currentRegime = regimeInfo[value];
  const Icon = currentRegime.icon;

  return (
    <div className="space-y-4">
      {/* Seletor Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${currentRegime.color}`} />
          <span className="font-medium">Visão Financeira</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-2">Regimes Contábeis</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Caixa:</strong> Reconhece transações quando o dinheiro entra ou sai
                  </div>
                  <div>
                    <strong>Competência:</strong> Reconhece transações quando ocorrem, independente do pagamento
                  </div>
                  <div>
                    <strong>Projeção:</strong> Combina ambos para visão futura
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <ToggleGroup 
          type="single" 
          value={value} 
          onValueChange={(val) => val && onChange(val as FinancialRegime)}
          className="border rounded-lg p-1"
        >
          {Object.entries(regimeInfo).map(([key, info]) => {
            const ItemIcon = info.icon;
            return (
              <ToggleGroupItem
                key={key}
                value={key}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <ItemIcon className="h-4 w-4 mr-2" />
                {info.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Descrição do Regime Selecionado */}
      {showDescription && (
        <Card className={`${currentRegime.bgColor} ${currentRegime.borderColor} border`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={currentRegime.badgeVariant}>
                    {currentRegime.badge}
                  </Badge>
                  <h3 className={`font-semibold ${currentRegime.color}`}>
                    {currentRegime.label}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentRegime.description}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${currentRegime.color} opacity-20`} />
            </div>

            {/* Indicadores Específicos */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
              {value === 'CAIXA' && (
                <>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">Data</div>
                    <div className="text-muted-foreground">Pagamento</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">Status</div>
                    <div className="text-muted-foreground">Pago/Recebido</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">Saldo</div>
                    <div className="text-muted-foreground">Conta Bancária</div>
                  </div>
                </>
              )}

              {value === 'COMPETENCIA' && (
                <>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">Data</div>
                    <div className="text-muted-foreground">Fato Gerador</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">Status</div>
                    <div className="text-muted-foreground">Todos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">Resultado</div>
                    <div className="text-muted-foreground">DRE</div>
                  </div>
                </>
              )}

              {value === 'PROJECAO' && (
                <>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">Realizado</div>
                    <div className="text-muted-foreground">Caixa</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">Previsto</div>
                    <div className="text-muted-foreground">Vencimentos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">Gap</div>
                    <div className="text-muted-foreground">Necessidade</div>
                  </div>
                </>
              )}
            </div>

            {/* Alerta para Diferenças */}
            {value === 'PROJECAO' && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <strong>Atenção:</strong> Esta visão combina valores realizados com projetados. 
                    Use para planejamento e não para fechamento contábil.
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegimeSelector;
