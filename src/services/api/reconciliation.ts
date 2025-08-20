// Serviço para Conciliação Bancária
import { apiRequest } from './index';

export const reconciliationService = {
  getStatements: async (accountId?: string) => {
    const endpoint = accountId ? `/reconciliation/statements?accountId=${accountId}` : '/reconciliation/statements';
    return apiRequest(endpoint);
  },

  importStatement: async (file: File, accountId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1'}/reconciliation/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to import statement');
    return response.json();
  },

  reconcile: async (data: {
    statementId: string;
    transactionId: string;
    type: 'expense' | 'revenue';
  }) => apiRequest('/reconciliation/reconcile', { method: 'POST', body: JSON.stringify(data) }),

  autoReconcile: async (accountId: string) => 
    apiRequest(`/reconciliation/auto-reconcile/${accountId}`, { method: 'POST' }),

  getPending: async (accountId?: string) => {
    const endpoint = accountId ? `/reconciliation/pending?accountId=${accountId}` : '/reconciliation/pending';
    return apiRequest(endpoint);
  },

  getReconciled: async (startDate: Date, endDate: Date, accountId?: string) => {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    if (accountId) params.append('accountId', accountId);
    return apiRequest(`/reconciliation/reconciled?${params}`);
  },
};