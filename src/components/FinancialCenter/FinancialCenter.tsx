import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  Wallet,
  FileText,
  Activity,
  Plus
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
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);

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
            <div className="flex items-center gap-2">
              {/* Botão Nova Movimentação - visível nas abas de Receitas e Despesas */}
              {(activeTab === 'revenues' || activeTab === 'expenses' || activeTab === 'cashflow') && (
                <Button
                  size="sm"
                  onClick={() => {
                    // Se estiver em receitas ou despesas, mudar para fluxo de caixa e abrir formulário
                    if (activeTab === 'revenues' || activeTab === 'expenses') {
                      setActiveTab('cashflow');
                      // O CashFlowDashboard já tem o botão, então apenas mudamos a aba
                      // O usuário pode clicar no botão "Nova Movimentação" na aba de fluxo de caixa
                    } else {
                      setShowNewTransactionForm(true);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">
                    {activeTab === 'expenses' ? 'Nova Despesa' : 
                     activeTab === 'revenues' ? 'Nova Receita' : 
                     'Nova Movimentação'}
                  </span>
                </Button>
              )}
              <Badge variant="outline" className="text-sm">
                <Activity className="h-3 w-3 mr-1" />
                Dados em tempo real
              </Badge>
            </div>
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
              <ExpandedCashFlow 
                type="revenue" 
                onNewTransaction={() => {
                  // Mudar para aba de fluxo de caixa onde o formulário pode ser aberto
                  setActiveTab('cashflow');
                }}
              />
            </TabsContent>

            {/* Despesas */}
            <TabsContent value="expenses" className="space-y-4">
              <ExpandedCashFlow 
                type="expense" 
                onNewTransaction={() => {
                  // Mudar para aba de fluxo de caixa onde o formulário pode ser aberto
                  setActiveTab('cashflow');
                }}
              />
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
