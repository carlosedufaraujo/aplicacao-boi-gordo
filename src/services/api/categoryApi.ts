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
  // Buscar todas as categorias
  async getAll(filters?: { type?: 'INCOME' | 'EXPENSE'; isActive?: boolean }): Promise<Category[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await api.get(`/categories${params.toString() ? `?${params}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  // Buscar categoria por ID
  async getById(id: string): Promise<Category & { _count?: { cashFlows: number } }> {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      throw error;
    }
  }

  // Criar nova categoria
  async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      const response = await api.post('/categories', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  // Atualizar categoria
  async update(id: string, data: Partial<Omit<Category, 'id' | 'type' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  // Deletar categoria
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  }

  // Buscar estatísticas
  async getStats(): Promise<CategoryStats[]> {
    try {
      const response = await api.get('/categories/stats/summary');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
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
    } catch (error) {
      console.error('Erro ao verificar se pode deletar:', error);
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
