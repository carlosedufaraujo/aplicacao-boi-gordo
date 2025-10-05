import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  Wallet,
  FileText,
  Activity
} from 'lucide-react';

// Importar componentes financeiros existentes
import { CashFlowDashboard } from '@/components/CashFlow/CashFlowDashboard';
import { SimpleIntegratedAnalysis } from '@/components/FinancialAnalysis/SimpleIntegratedAnalysis';
import { DREStatement } from '@/components/FinancialAnalysis/DREStatement';
import { ExpandedCashFlow } from '@/components/Financial/ExpandedCashFlow';

interface FinancialCenterProps {
  className?: string;
}

/**
 * Centro Financeiro - Componente principal que centraliza todas as funcionalidades financeiras
 * Inclui:
 * - Fluxo de Caixa
 * - DRE (Demonstração do Resultado do Exercício)
 * - Receitas
 * - Despesas
 * - Contas Bancárias
 * - Análise Integrada
 */
const FinancialCenter: React.FC<FinancialCenterProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('cashflow');

  return (
    <div className={className}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6 text-green-600" />
                Centro Financeiro
              </CardTitle>
              <CardDescription className="mt-1">
                Gestão completa e integrada das finanças da operação
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Activity className="h-3 w-3 mr-1" />
              Dados em tempo real
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="cashflow" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fluxo de Caixa
              </TabsTrigger>

              <TabsTrigger value="dre" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                DRE
              </TabsTrigger>

              <TabsTrigger value="revenues" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receitas
              </TabsTrigger>

              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Despesas
              </TabsTrigger>

              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análise Integrada
              </TabsTrigger>
            </TabsList>

            {/* Fluxo de Caixa */}
            <TabsContent value="cashflow" className="space-y-4">
              <CashFlowDashboard />
            </TabsContent>

            {/* DRE - Demonstração do Resultado do Exercício */}
            <TabsContent value="dre" className="space-y-4">
              <DREStatement />
            </TabsContent>

            {/* Receitas */}
            <TabsContent value="revenues" className="space-y-4">
              <ExpandedCashFlow type="revenue" />
            </TabsContent>

            {/* Despesas */}
            <TabsContent value="expenses" className="space-y-4">
              <ExpandedCashFlow type="expense" />
            </TabsContent>

            {/* Análise Integrada */}
            <TabsContent value="analysis" className="space-y-4">
              <SimpleIntegratedAnalysis />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCenter;
