import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { EXPENSE_CATEGORIES } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

export const FinancialIntegration: React.FC = () => {
  const { 
    expenses, 
    purchaseOrders, 
    cattleLots,
    dreStatements,
    generateDREStatement
  } = useAppStore();

  // Demonstrar integração entre módulos
  const integrationExamples = [
    {
      title: 'Ordem de Compra → Centro Financeiro',
      description: 'Quando uma ordem de compra é criada, automaticamente são geradas despesas no Centro Financeiro',
      flow: [
        'Criar Ordem de Compra',
        'Gerar despesas (animal, comissão, outros custos)',
        'Definir vencimentos',
        'Acompanhar no Calendário Financeiro'
      ],
      status: 'implemented'
    },
    {
      title: 'Centro Financeiro → DRE',
      description: 'Despesas lançadas no Centro Financeiro alimentam automaticamente o DRE',
      flow: [
        'Lançar despesa/receita',
        'Definir categoria e centro de custo',
        'Verificar flag impactsCashFlow',
        'Aparecer no DRE correspondente'
      ],
      status: 'implemented'
    },
    {
      title: 'Lançamentos Não-Caixa → DRE',
      description: 'Mortalidade e quebra de peso vão direto para o DRE sem passar pelo Centro Financeiro',
      flow: [
        'Registrar mortalidade/quebra',
        'Calcular valor monetário',
        'Criar lançamento não-caixa',
        'Impactar apenas DRE'
      ],
      status: 'implemented'
    }
  ];

  // Exemplo de fluxo de dados
  const dataFlowExample = () => {
    const recentOrder = purchaseOrders[0];
    if (!recentOrder) return null;

    const relatedExpenses = expenses.filter(exp => 
      exp.description?.includes(recentOrder.code)
    );

    return {
      order: recentOrder,
      expenses: relatedExpenses,
      totalValue: relatedExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0)
    };
  };

  const example = dataFlowExample();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Integração do Sistema Financeiro</h2>
        
        {/* Fluxos de Integração */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {integrationExamples.map((integration, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{integration.title}</h3>
                {integration.status === 'implemented' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
              <ol className="text-sm space-y-1">
                {integration.flow.map((step, i) => (
                  <li key={i} className="flex items-center">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Exemplo Prático */}
        {example && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Exemplo Prático: Ordem {example.order.code}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Dados da Ordem:</h4>
                <ul className="text-sm space-y-1">
                  <li>Quantidade: {example.order.quantity} animais</li>
                  <li>Valor Total: R$ {((example.order.totalWeight / 15) * example.order.pricePerArroba).toFixed(2)}</li>
                  <li>Data: {format(new Date(example.order.date), 'dd/MM/yyyy', { locale: ptBR })}</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Despesas Geradas:</h4>
                <ul className="text-sm space-y-1">
                  {example.expenses.map((exp, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{EXPENSE_CATEGORIES.find(cat => cat.category === exp.category)?.name}</span>
                      <span>R$ {exp.totalAmount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Categorias e Impacto no Caixa */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">Categorias e Impacto no Sistema</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Centro de Custo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Impacta Caixa</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Vai para DRE</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {EXPENSE_CATEGORIES.slice(0, 10).map((cat, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{cat.costCenter.replace(/_/g, ' ').toUpperCase()}</td>
                    <td className="px-4 py-2 text-sm">{cat.name}</td>
                    <td className="px-4 py-2 text-center">
                      {cat.impactsCashFlow ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Como funciona a integração:</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Ordens de compra geram automaticamente despesas categorizadas</li>
                <li>Despesas com impactsCashFlow = true aparecem no Centro Financeiro</li>
                <li>Despesas com impactsCashFlow = false vão direto para o DRE</li>
                <li>Todas as despesas aparecem no DRE do período correspondente</li>
                <li>O modelo híbrido (isPaid) controla se é previsto ou realizado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 