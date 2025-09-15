import api from './apiClient';

export interface ImportedPurchase {
  lotCode: string;
  purchaseDate: string;
  state: string;
  seller: string;
  quantity: number;
  purchaseWeight: number;
  pricePerArroba: number;
  purchaseValue: number;
  commission?: number;
  freightCost?: number;
  otherCosts?: number;
  averageAge?: number;
  breed?: string;
  observation?: string;
}

export interface ImportValidationResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  errors: Array<{
    row: number;
    lotCode: string;
    errors: Array<{
      field: string;
      message: string;
    }>;
  }>;
}

export interface ImportResult {
  message: string;
  results: {
    success: number;
    failed: number;
    errors: Array<{
      row: number;
      lotCode: string;
      errors: string[];
    }>;
    imported: Array<{
      id: string;
      lotCode: string;
      purchaseDate: string;
      value: number;
    }>;
  };
}

export const dataImportApi = {
  async importPurchases(purchases: ImportedPurchase[], skipValidation = false): Promise<ImportResult> {
    const response = await api.post('/data-import/import', {
      purchases,
      skipValidation
    });
    return response.data;
  },

  async validateImport(purchases: ImportedPurchase[]): Promise<ImportValidationResult> {
    const response = await api.post('/data-import/validate', {
      purchases
    });
    return response.data;
  },

  async getTemplate() {
    const response = await api.get('/data-import/template');
    return response.data;
  }
};
