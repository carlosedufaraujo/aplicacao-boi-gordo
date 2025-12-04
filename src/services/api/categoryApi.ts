import api from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryStats {
  category: Category;
  type: string;
  totalAmount: number;
  count: number;
}

class CategoryAPI {
  // Helper para extrair dados da resposta
  private extractData<T>(response: any): T {
    // Se a resposta tem formato { status: 'success', data: [...] }, extrair data
    if (response?.data?.status === 'success' && response?.data?.data !== undefined) {
      return response.data.data;
    }
    // Se response.data é o próprio objeto com status
    if (response?.status === 'success' && response?.data !== undefined) {
      return response.data;
    }
    // Fallback para formato antigo
    return response?.data || response || [];
  }

  // Buscar todas as categorias
  async getAll(filters?: { type?: 'INCOME' | 'EXPENSE'; isActive?: boolean }): Promise<Category[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await api.get(`/categories${params.toString() ? `?${params}` : ''}`);
      return this.extractData<Category[]>(response);
    } catch (_error) {
      console.error('Erro ao buscar categorias:', _error);
      throw _error;
    }
  }

  // Buscar categoria por ID
  async getById(id: string): Promise<Category & { _count?: { cashFlows: number } }> {
    try {
      const response = await api.get(`/categories/${id}`);
      return this.extractData(response);
    } catch (_error) {
      console.error('Erro ao buscar categoria:', _error);
      throw _error;
    }
  }

  // Criar nova categoria
  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      const response = await api.post('/categories', data);
      return this.extractData(response);
    } catch (_error) {
      console.error('Erro ao criar categoria:', _error);
      throw _error;
    }
  }

  // Atualizar categoria
  async update(id: string, data: Partial<Omit<Category, 'id' | 'type' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return this.extractData(response);
    } catch (_error) {
      console.error('Erro ao atualizar categoria:', _error);
      throw _error;
    }
  }

  // Deletar categoria
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (_error) {
      console.error('Erro ao deletar categoria:', _error);
      throw _error;
    }
  }

  // Buscar estatísticas
  async getStats(): Promise<CategoryStats[]> {
    try {
      const response = await api.get('/categories/stats/summary');
      return this.extractData<CategoryStats[]>(response);
    } catch (_error) {
      console.error('Erro ao buscar estatísticas:', _error);
      throw _error;
    }
  }

  // Buscar categorias por tipo
  async getByType(type: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
    return this.getAll({ type });
  }

  // Verificar se pode deletar (não está em uso)
  async canDelete(id: string): Promise<boolean> {
    try {
      const category = await this.getById(id);
      return !category._count || category._count.cashFlows === 0;
    } catch (_error) {
      console.error('Erro ao verificar se pode deletar:', _error);
      return false;
    }
  }

  // Buscar categorias ativas
  async getActive(): Promise<Category[]> {
    return this.getAll({ isActive: true });
  }

  // Buscar categorias ativas por tipo
  async getActiveByType(type: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
    return this.getAll({ type, isActive: true });
  }
}

// Singleton instance
export const categoryAPI = new CategoryAPI();
export default categoryAPI;
