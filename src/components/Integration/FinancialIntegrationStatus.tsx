import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Wallet,
  Clock,
  DollarSign
} from 'lucide-react';
import { formatSafeCurrency, formatSafeDecimal } from '@/utils/dateUtils';

interface FinancialIntegrationStatusProps {
  totalRevenues: number;
  totalExpenses: number;
  netCashFlow: number;
  totalAccountBalance: number;
  pendingRevenues: number;
  pendingExpenses: number;
  profitMargin: number;
  accountsCount: number;
  revenuesCount: number;
  expensesCount: number;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const FinancialIntegrationStatus: React.FC<FinancialIntegrationStatusProps> = ({
  totalRevenues,
  totalExpenses,
  netCashFlow,
  totalAccountBalance,
  pendingRevenues,
  pendingExpenses,
  profitMargin,
  accountsCount,
  revenuesCount,
  expensesCount,
  isLoading,
  onRefresh
}) => {
  const integrationHealth = React.useMemo(() => {
    const hasData = revenuesCount > 0 || expensesCount > 0 || accountsCount > 0;
    const hasBalance = totalAccountBalance !== 0;
    const hasTransactions = totalRevenues > 0 || totalExpenses > 0;
    
    if (!hasData) return { status: 'warning', message: 'Nenhum dado financeiro encontrado' };
    if (!hasBalance && !hasTransactions) return { status: 'warning', message: 'Dados limitados disponíveis' };
    if (hasData && (hasBalance || hasTransactions)) return { status: 'success', message: 'Integração funcionando corretamente' };
    
    return { status: 'error', message: 'Problemas na integração detectados' };
  }, [revenuesCount, expensesCount, accountsCount, totalAccountBalance, totalRevenues, totalExpenses]);

  const getStatusIcon = () => {
    switch (integrationHealth.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <RefreshCw className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (integrationHealth.status) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default:
        return 'bg-muted/50 border-muted';
    }
  };

  return (
    <Card className={`${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-base">Status da Integração Financeira</CardTitle>
              <CardDescription className="text-sm">
                {integrationHealth.message}
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resumo dos Dados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Wallet className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Contas</span>
            </div>
            <p className="text-sm font-semibold">{accountsCount}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Receitas</span>
            </div>
            <p className="text-sm font-semibold">{revenuesCount}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Despesas</span>
            </div>
            <p className="text-sm font-semibold">{expensesCount}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Activity className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Margem</span>
            </div>
            <p className={`text-sm font-semibold ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatSafeDecimal(profitMargin, 1)}%
            </p>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Saldo Total</p>
            <p className={`text-sm font-semibold ${totalAccountBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatSafeCurrency(totalAccountBalance)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Fluxo de Caixa</p>
            <p className={`text-sm font-semibold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatSafeCurrency(netCashFlow)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Pendências</p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Clock className="h-3 w-3 mr-1" />
                {formatSafeCurrency(pendingRevenues + pendingExpenses)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          <Badge 
            variant={integrationHealth.status === 'success' ? 'default' : 
                    integrationHealth.status === 'warning' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Integração {integrationHealth.status === 'success' ? 'Ativa' : 
                      integrationHealth.status === 'warning' ? 'Parcial' : 'Inativa'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
