// Serviço para módulo de Cadastros
import { apiRequest } from './index';
import { 
  PenRegistration, 
  Partner, 
  PayerAccount, 
  FatteningCycle,
  Transporter,
  FinancialInstitution 
} from '../../types';

export const cadastrosService = {
  // ===== CURRAIS =====
  pens: {
    getAll: async (): Promise<PenRegistration[]> => {
      return apiRequest<PenRegistration[]>('/pens');
    },

    getById: async (id: string): Promise<PenRegistration> => {
      return apiRequest<PenRegistration>(`/pens/${id}`);
    },

    create: async (data: Omit<PenRegistration, 'id' | 'createdAt' | 'updatedAt'>): Promise<PenRegistration> => {
      return apiRequest<PenRegistration>('/pens', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<PenRegistration>): Promise<PenRegistration> => {
      return apiRequest<PenRegistration>(`/pens/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/pens/${id}`, {
        method: 'DELETE',
      });
    },

    getAvailable: async (): Promise<PenRegistration[]> => {
      return apiRequest<PenRegistration[]>('/pens/available');
    },

    getStats: async (): Promise<any> => {
      return apiRequest<any>('/pens/stats');
    },

    updateStatus: async (id: string, status: string): Promise<PenRegistration> => {
      return apiRequest<PenRegistration>(`/pens/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // ===== PARCEIROS =====
  partners: {
    getAll: async (type?: string): Promise<Partner[]> => {
      const endpoint = type ? `/partners?type=${type}` : '/partners';
      return apiRequest<Partner[]>(endpoint);
    },

    getById: async (id: string): Promise<Partner> => {
      return apiRequest<Partner>(`/partners/${id}`);
    },

    create: async (data: Omit<Partner, 'id' | 'createdAt'>): Promise<Partner> => {
      return apiRequest<Partner>('/partners', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Partner>): Promise<Partner> => {
      return apiRequest<Partner>(`/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/partners/${id}`, {
        method: 'DELETE',
      });
    },

    getByType: async (type: 'vendor' | 'broker' | 'slaughterhouse'): Promise<Partner[]> => {
      return apiRequest<Partner[]>(`/partners/type/${type}`);
    },

    getActive: async (): Promise<Partner[]> => {
      return apiRequest<Partner[]>('/partners/active');
    },
  },

  // ===== CONTAS PAGADORAS =====
  payerAccounts: {
    getAll: async (): Promise<PayerAccount[]> => {
      return apiRequest<PayerAccount[]>('/payer-accounts');
    },

    getById: async (id: string): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>(`/payer-accounts/${id}`);
    },

    create: async (data: Omit<PayerAccount, 'id' | 'createdAt'>): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>('/payer-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<PayerAccount>): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>(`/payer-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/payer-accounts/${id}`, {
        method: 'DELETE',
      });
    },

    getDefault: async (): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>('/payer-accounts/default');
    },

    setDefault: async (id: string): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>(`/payer-accounts/${id}/set-default`, {
        method: 'PATCH',
      });
    },

    updateBalance: async (id: string, balance: number): Promise<PayerAccount> => {
      return apiRequest<PayerAccount>(`/payer-accounts/${id}/balance`, {
        method: 'PATCH',
        body: JSON.stringify({ balance }),
      });
    },
  },

  // ===== CICLOS =====
  cycles: {
    getAll: async (): Promise<FatteningCycle[]> => {
      return apiRequest<FatteningCycle[]>('/cycles');
    },

    getById: async (id: string): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>(`/cycles/${id}`);
    },

    create: async (data: Omit<FatteningCycle, 'id' | 'createdAt'>): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>('/cycles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<FatteningCycle>): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>(`/cycles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/cycles/${id}`, {
        method: 'DELETE',
      });
    },

    getActive: async (): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>('/cycles/active');
    },

    activate: async (id: string): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>(`/cycles/${id}/activate`, {
        method: 'PATCH',
      });
    },

    complete: async (id: string): Promise<FatteningCycle> => {
      return apiRequest<FatteningCycle>(`/cycles/${id}/complete`, {
        method: 'PATCH',
      });
    },
  },

  // ===== TRANSPORTADORAS =====
  transporters: {
    getAll: async (): Promise<Transporter[]> => {
      return apiRequest<Transporter[]>('/transporters');
    },

    getById: async (id: string): Promise<Transporter> => {
      return apiRequest<Transporter>(`/transporters/${id}`);
    },

    create: async (data: Omit<Transporter, 'id' | 'createdAt'>): Promise<Transporter> => {
      return apiRequest<Transporter>('/transporters', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Transporter>): Promise<Transporter> => {
      return apiRequest<Transporter>(`/transporters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/transporters/${id}`, {
        method: 'DELETE',
      });
    },

    getActive: async (): Promise<Transporter[]> => {
      return apiRequest<Transporter[]>('/transporters/active');
    },

    calculateFreight: async (data: { distance: number; transporterId: string }): Promise<{ total: number }> => {
      return apiRequest<{ total: number }>('/transporters/calculate-freight', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // ===== INSTITUIÇÕES FINANCEIRAS =====
  financialInstitutions: {
    getAll: async (): Promise<FinancialInstitution[]> => {
      return apiRequest<FinancialInstitution[]>('/financial-institutions');
    },

    getById: async (id: string): Promise<FinancialInstitution> => {
      return apiRequest<FinancialInstitution>(`/financial-institutions/${id}`);
    },

    create: async (data: Omit<FinancialInstitution, 'id' | 'createdAt'>): Promise<FinancialInstitution> => {
      return apiRequest<FinancialInstitution>('/financial-institutions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<FinancialInstitution>): Promise<FinancialInstitution> => {
      return apiRequest<FinancialInstitution>(`/financial-institutions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      return apiRequest<void>(`/financial-institutions/${id}`, {
        method: 'DELETE',
      });
    },

    getByType: async (type: 'bank' | 'cooperative' | 'fintech'): Promise<FinancialInstitution[]> => {
      return apiRequest<FinancialInstitution[]>(`/financial-institutions/type/${type}`);
    },
  },
};