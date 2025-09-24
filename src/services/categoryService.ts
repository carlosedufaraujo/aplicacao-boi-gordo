import api from '@/lib/api';

export interface Category {
  id: string;
  code: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  cost_center?: string;
  color: string;
  icon?: string;
  impacts_cash_flow: boolean;
  is_default: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export class CategoryService {
  private categories: Category[] = [];
  private loading: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.loadCategories();
    // Realtime sync removido - usando polling ou atualização manual
  }


  // Adicionar listener para mudanças
  public addChangeListener(callback: () => void): () => void {
    this.listeners.add(callback);
    // Retornar função para remover o listener
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notificar todos os listeners sobre mudanças
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Carregar categorias do banco de dados
  private async loadCategories(): Promise<void> {
    try {
      this.loading = true;

      // Usar API REST ao invés do Supabase direto
      const response = await api.get('/categories');

      if (response.data && Array.isArray(response.data)) {
        // Filtrar apenas categorias ativas
        this.categories = response.data
          .filter((cat: Category) => cat.is_active !== false)
          .sort((a: Category, b: Category) => (a.display_order || 0) - (b.display_order || 0));
      } else {
        // Fallback para categorias padrão em memória se houver erro
        this.loadDefaultCategories();
        return;
      }

      // Se não houver categorias no banco, inserir as padrão
      if (this.categories.length === 0) {
        await this.insertDefaultCategories();
        await this.loadCategories(); // Recarregar após inserir
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      this.loadDefaultCategories();
    } finally {
      this.loading = false;
    }
  }

  // Carregar categorias padrão (fallback)
  private loadDefaultCategories(): void {
    // Mantém as categorias básicas como fallback
    this.categories = [
      { id: '1', code: 'animal_purchase', name: 'Compra de Animais', type: 'EXPENSE', cost_center: 'acquisition', color: '#EF4444', icon: 'ShoppingCart', impacts_cash_flow: true, is_default: true, is_active: true, display_order: 1 },
      { id: '2', code: 'feed', name: 'Alimentação', type: 'EXPENSE', cost_center: 'fattening', color: '#84CC16', icon: 'Package', impacts_cash_flow: true, is_default: true, is_active: true, display_order: 5 },
      { id: '3', code: 'health_costs', name: 'Sanidade', type: 'EXPENSE', cost_center: 'fattening', color: '#06B6D4', icon: 'Heart', impacts_cash_flow: true, is_default: true, is_active: true, display_order: 6 },
      { id: '4', code: 'freight', name: 'Frete', type: 'EXPENSE', cost_center: 'acquisition', color: '#10B981', icon: 'Truck', impacts_cash_flow: true, is_default: true, is_active: true, display_order: 3 },
      { id: '5', code: 'cattle_sale', name: 'Venda de Gado', type: 'INCOME', cost_center: 'revenue', color: '#10B981', icon: 'DollarSign', impacts_cash_flow: true, is_default: true, is_active: true, display_order: 32 },
    ];
  }

  // Inserir categorias padrão no banco
  private async insertDefaultCategories(): Promise<void> {
    // As categorias padrão já são inseridas pela migration SQL
    // Este método existe apenas para caso precise reinicializar
    console.log('Categorias padrão já inseridas pela migration');
  }

  // Obter todas as categorias
  public getAll(): Category[] {
    return [...this.categories];
  }

  // Obter categorias por tipo
  public getByType(type: 'INCOME' | 'EXPENSE'): Category[] {
    return this.categories.filter(cat => cat.type === type);
  }

  // Obter categoria por ID
  public getById(id: string): Category | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  // Obter categoria por código
  public getByCode(code: string): Category | undefined {
    return this.categories.find(cat => cat.code === code);
  }

  // Criar nova categoria
  public async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> {
    try {
      const response = await api.post('/categories', {
        ...category,
        code: category.code || `custom_${Date.now()}`,
        is_default: false
      });

      const data = response.data;
      if (!data) {
        throw new Error('Erro ao criar categoria');
      }

      // Recarregar categorias
      await this.loadCategories();
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }
  }

  // Atualizar categoria
  public async update(id: string, updates: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category | null> {
    try {
      // Verificar se é categoria padrão
      const category = this.getById(id);
      if (category?.is_default) {
        // Limitar alterações em categorias padrão
        const allowedUpdates = {
          name: updates.name,
          color: updates.color,
          icon: updates.icon,
          display_order: updates.display_order
        };
        updates = allowedUpdates;
      }

      const response = await api.put(`/categories/${id}`, updates);

      const data = response.data;
      if (!data) {
        throw new Error('Erro ao atualizar categoria');
      }

      // Recarregar categorias
      await this.loadCategories();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return null;
    }
  }

  // Deletar categoria (soft delete)
  public async delete(id: string): Promise<boolean> {
    try {
      // Verificar se pode deletar
      const canDelete = await this.canDelete(id);
      if (!canDelete) {
        throw new Error('Categoria está em uso e não pode ser excluída');
      }

      // Soft delete - apenas marca como inativa
      await api.delete(`/categories/${id}`);
      // Ou usar update para soft delete
      // await api.put(`/categories/${id}`, { is_active: false });

      // Recarregar categorias
      await this.loadCategories();
      return true;
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return false;
    }
  }

  // Verificar se categoria pode ser deletada
  public async canDelete(id: string): Promise<boolean> {
    try {
      const category = this.getById(id);
      if (!category) return false;

      // Não permitir deletar categorias padrão
      if (category.is_default) return false;

      // Por enquanto, assumir que categorias customizadas podem ser deletadas
      // TODO: Implementar verificação via API quando disponível
      return true;
    } catch (error) {
      console.error('Erro ao verificar se pode deletar:', error);
      return false;
    }
  }

  // Buscar categorias
  public search(query: string): Category[] {
    const lowercaseQuery = query.toLowerCase();
    return this.categories.filter(cat =>
      cat.name.toLowerCase().includes(lowercaseQuery) ||
      cat.code.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Exportar categorias
  public async exportCategories(): Promise<string> {
    await this.loadCategories(); // Garantir dados atualizados
    return JSON.stringify(this.categories, null, 2);
  }

  // Importar categorias
  public async importCategories(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('Formato inválido');
      }

      // Validar estrutura
      const isValid = imported.every(cat =>
        cat.name &&
        cat.code &&
        (cat.type === 'INCOME' || cat.type === 'EXPENSE')
      );

      if (!isValid) {
        throw new Error('Categorias inválidas');
      }

      // Inserir categorias importadas
      for (const cat of imported) {
        // Pular se já existe
        if (this.getByCode(cat.code)) continue;

        await this.create({
          code: cat.code,
          name: cat.name,
          type: cat.type,
          cost_center: cat.cost_center,
          color: cat.color || '#6B7280',
          icon: cat.icon,
          impacts_cash_flow: cat.impacts_cash_flow !== false,
          is_default: false,
          is_active: true,
          display_order: cat.display_order || 999
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar categorias:', error);
      return false;
    }
  }

  // Resetar para categorias padrão
  public async resetToDefaults(): Promise<void> {
    try {
      // Desativar todas as categorias customizadas
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('is_default', false);

      if (error) throw error;

      // Reativar apenas as categorias padrão
      const { error: reactivateError } = await supabase
        .from('categories')
        .update({ is_active: true })
        .eq('is_default', true);

      if (reactivateError) throw reactivateError;

      // Recarregar
      await this.loadCategories();
    } catch (error) {
      console.error('Erro ao resetar categorias:', error);
    }
  }

  // Limpar recursos ao destruir
  public destroy(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.listeners.clear();
  }

  // Verificar se está carregando
  public isLoading(): boolean {
    return this.loading;
  }
}

// Singleton instance with lazy initialization and error handling
let categoryServiceInstance: CategoryService | null = null;

export const getCategoryService = (): CategoryService => {
  if (!categoryServiceInstance) {
    try {
      categoryServiceInstance = new CategoryService();
    } catch (error) {
      console.error('Error creating CategoryService instance:', error);
      // Create a minimal fallback instance
      categoryServiceInstance = new CategoryService();
    }
  }
  return categoryServiceInstance;
};

// Export for backward compatibility with error handling
let categoryServiceSingleton: CategoryService | null = null;
try {
  categoryServiceSingleton = getCategoryService();
} catch (error) {
  console.error('Error initializing categoryService singleton:', error);
  categoryServiceSingleton = getCategoryService(); // Try again
}

export const categoryService = categoryServiceSingleton!;