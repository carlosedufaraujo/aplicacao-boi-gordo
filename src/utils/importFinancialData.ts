/**
 * Importa dados do Centro Financeiro (Despesas e Receitas)
 * Isso já inclui todas as compras de gado e vendas
 */

import { activityLogger } from '@/services/activityLogger';
import { expenseApi } from '@/services/api/expenseApi';
import { revenueApi } from '@/services/api/revenueApi';

export const importFinancialData = async () => {
  try {
    console.log('💰 Importando dados do Centro Financeiro...');
    let totalImported = 0;

    // 1. Importar TODAS as Despesas (incluindo compras de gado)
    try {
      const expensesResponse = await expenseApi.getAll({ limit: 1000 });
      if (expensesResponse.status === 'success' && expensesResponse.data) {
        const expenses = Array.isArray(expensesResponse.data)
          ? expensesResponse.data
          : expensesResponse.data.items || [];

        console.log(`📉 ${expenses.length} despesas encontradas`);

        expenses.forEach((expense: any) => {
          activityLogger.log({
            type: 'payment',
            action: 'paid',
            category: 'expense',
            title: `Despesa - ${expense.category}`,
            description: expense.description,
            entityId: expense.id,
            entityName: expense.description,
            newValue: expense.totalAmount,
            metadata: {
              category: expense.category,
              vendor: expense.vendor?.name || expense.vendorId,
              dueDate: expense.dueDate,
              paidDate: expense.paidDate,
              status: expense.status,
              paymentMethod: expense.paymentMethod,
              // Se for compra de gado, incluir info adicional
              cattlePurchaseId: expense.cattlePurchaseId,
              reference: expense.referenceNumber,
            },
            importance: expense.totalAmount > 10000 ? 'high' : 'medium',
            icon: 'TrendingDown',
            color: '#ef4444',
          });
          totalImported++;
        });
      }
    } catch (error) {
      console.error('Erro ao importar despesas:', error);
    }

    // 2. Importar TODAS as Receitas (incluindo vendas)
    try {
      const revenuesResponse = await revenueApi.getAll({ limit: 1000 });
      if (revenuesResponse.status === 'success' && revenuesResponse.data) {
        const revenues = Array.isArray(revenuesResponse.data)
          ? revenuesResponse.data
          : revenuesResponse.data.items || [];

        console.log(`📈 ${revenues.length} receitas encontradas`);

        revenues.forEach((revenue: any) => {
          activityLogger.log({
            type: 'payment',
            action: 'received',
            category: 'revenue',
            title: `Receita - ${revenue.category}`,
            description: revenue.description,
            entityId: revenue.id,
            entityName: revenue.description,
            newValue: revenue.amount,
            metadata: {
              category: revenue.category,
              source: revenue.source,
              dueDate: revenue.dueDate,
              receivedDate: revenue.receivedDate,
              status: revenue.status,
              paymentMethod: revenue.paymentMethod,
              // Se for venda, incluir info adicional
              saleRecordId: revenue.saleRecordId,
              reference: revenue.referenceNumber,
            },
            importance: revenue.amount > 50000 ? 'high' : 'medium',
            icon: 'DollarSign',
            color: '#10b981',
          });
          totalImported++;
        });
      }
    } catch (error) {
      console.error('Erro ao importar receitas:', error);
    }

    console.log(`✅ ${totalImported} registros financeiros importados!`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao importar dados financeiros:', error);
    return false;
  }
};