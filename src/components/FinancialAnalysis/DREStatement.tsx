import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  Package,
  Truck,
  Users,
  Heart,
  Building,
  CreditCard,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getCategoryDisplayName } from '@/utils/categoryNormalizer';
import { 
  groupByAccountingCategory, 
  calculateDRE,
  ACCOUNTING_GROUPS 
} from '@/utils/accountingCategories';
import { cn } from '@/lib/utils';

interface DREStatementProps {
  expenses: Array<{ category: string; totalAmount: number }>;
  revenues: Array<{ category: string; totalAmount: number }>;
  period?: string;
}

export const DREStatement: React.FC<DREStatementProps> = ({
  expenses,
  revenues,
  period = 'Período Atual'
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  // Combinar e agrupar dados
  // Mantém valores negativos para despesas e positivos para receitas
  const allItems = [
    ...expenses,
    ...revenues
  ];
  
  const groupedData = groupByAccountingCategory(allItems);
  const dre = calculateDRE(groupedData);
  
  console.log('🔍 [DREStatement] ALL ITEMS PARA AGRUPAMENTO:');
  allItems.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.category}: ${item.totalAmount}`);
  });
  
  console.log('📊 [DREStatement] GROUPED DATA:');
  Object.entries(groupedData).forEach(([groupId, data]) => {
    console.log(`- ${groupId}:`, data.group.name, 'Total:', data.total);
    data.items.forEach((item: any) => {
      console.log(`  * ${item.category}: ${item.amount}`);
    });
  });

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupIcon = (groupId: string) => {
    switch(groupId) {
      case 'acquisition_costs': return <Package className="h-4 w-4" />;
      case 'logistics_costs': return <Truck className="h-4 w-4" />;
      case 'commission_costs': return <Users className="h-4 w-4" />;
      case 'production_expenses': return <Heart className="h-4 w-4" />;
      case 'admin_expenses': return <Building className="h-4 w-4" />;
      case 'financial_expenses': return <CreditCard className="h-4 w-4" />;
      case 'operational_losses': return <TrendingDown className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const renderGroupRow = (groupId: string, groupData: any, showDetails: boolean = true) => {
    if (!groupData) return null;
    
    const isExpanded = expandedGroups.has(groupId);
    const { group, total, items } = groupData;
    
    return (
      <div key={groupId} className="space-y-1">
        <div 
          className={cn(
            "flex items-center justify-between p-3 rounded-lg transition-colors",
            showDetails && items.length > 0 && "hover:bg-muted cursor-pointer"
          )}
          onClick={() => showDetails && items.length > 0 && toggleGroup(groupId)}
        >
          <div className="flex items-center gap-3">
            {showDetails && items.length > 0 && (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
            {getGroupIcon(groupId)}
            <div>
              <p className="font-medium">{group.name}</p>
              {group.description && (
                <p className="text-xs text-muted-foreground">{group.description}</p>
              )}
            </div>
          </div>
          <div className={cn(
            "font-bold text-right",
            group.type === 'REVENUE' ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(total)}
          </div>
        </div>
        
        {showDetails && isExpanded && items.length > 0 && (
          <div className="ml-11 space-y-1 mb-2">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between p-2 text-sm bg-muted/50 rounded">
                <span className="text-muted-foreground">
                  {getCategoryDisplayName(item.category)}
                </span>
                <span className={group.type === 'REVENUE' ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTotalRow = (label: string, value: number, variant: 'primary' | 'success' | 'danger' | 'warning' = 'primary', percentage?: number) => (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg font-bold",
      variant === 'primary' && "bg-primary/10",
      variant === 'success' && "bg-green-50 dark:bg-green-950/20",
      variant === 'danger' && "bg-red-50 dark:bg-red-950/20",
      variant === 'warning' && "bg-yellow-50 dark:bg-yellow-950/20"
    )}>
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {percentage !== undefined && (
          <Badge variant="outline" className="ml-2">
            {percentage.toFixed(1)}%
          </Badge>
        )}
      </div>
      <span className={cn(
        value >= 0 ? "text-green-600" : "text-red-600"
      )}>
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Demonstrativo de Resultado (DRE)</span>
          <Badge variant="outline">{period}</Badge>
        </CardTitle>
        <CardDescription>
          Demonstração contábil do resultado do exercício
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RECEITAS */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            RECEITAS
          </h3>
          {renderGroupRow('operational_revenue', groupedData['operational_revenue'])}
          {renderGroupRow('other_revenue', groupedData['other_revenue'])}
          {renderTotalRow('RECEITA TOTAL', dre.receitaTotal, 'success')}
        </div>

        <Separator />

        {/* CUSTOS DE AQUISIÇÃO */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            CUSTOS DE AQUISIÇÃO
          </h3>
          {renderGroupRow('acquisition_costs', groupedData['acquisition_costs'])}
          {renderGroupRow('logistics_costs', groupedData['logistics_costs'])}
          {renderGroupRow('commission_costs', groupedData['commission_costs'])}
          {renderTotalRow('(-) CUSTO TOTAL DE AQUISIÇÃO', -dre.custoTotalAquisicao, 'danger')}
        </div>

        <Separator />

        {/* RESULTADO BRUTO */}
        {renderTotalRow(
          '(=) RESULTADO BRUTO', 
          dre.resultadoBruto, 
          dre.resultadoBruto >= 0 ? 'success' : 'danger',
          dre.margemBruta
        )}

        <Separator />

        {/* DESPESAS OPERACIONAIS */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            DESPESAS OPERACIONAIS
          </h3>
          {renderGroupRow('production_expenses', groupedData['production_expenses'])}
          {renderGroupRow('operational_losses', groupedData['operational_losses'])}
          {renderGroupRow('admin_expenses', groupedData['admin_expenses'])}
          {renderTotalRow('(-) TOTAL DESPESAS OPERACIONAIS', -dre.totalDespesasOperacionais, 'danger')}
        </div>

        <Separator />

        {/* RESULTADO OPERACIONAL */}
        {renderTotalRow(
          '(=) RESULTADO OPERACIONAL (EBITDA)', 
          dre.resultadoOperacional,
          dre.resultadoOperacional >= 0 ? 'success' : 'danger',
          dre.margemOperacional
        )}

        <Separator />

        {/* DESPESAS FINANCEIRAS */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            DESPESAS FINANCEIRAS
          </h3>
          {renderGroupRow('financial_expenses', groupedData['financial_expenses'], false)}
        </div>

        <Separator className="my-4" />

        {/* RESULTADO LÍQUIDO */}
        <div className="pt-2">
          {renderTotalRow(
            '(=) RESULTADO LÍQUIDO', 
            dre.resultadoLiquido,
            dre.resultadoLiquido >= 0 ? 'success' : 'danger',
            dre.margemLiquida
          )}
        </div>

        {/* RESUMO DE MARGENS */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Indicadores de Performance</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Margem Bruta</p>
              <p className={cn(
                "font-bold",
                dre.margemBruta >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {dre.margemBruta.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Margem Operacional</p>
              <p className={cn(
                "font-bold",
                dre.margemOperacional >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {dre.margemOperacional.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Margem Líquida</p>
              <p className={cn(
                "font-bold",
                dre.margemLiquida >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {dre.margemLiquida.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};