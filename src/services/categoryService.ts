import { Category, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/data/defaultCategories';

const STORAGE_KEY = 'financial_categories';

export class CategoryService {
  private categories: Category[] = [];

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.categories = JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }

  private saveCategories(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.categories));
  }

  public resetToDefaults(): void {
    this.categories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    this.saveCategories();
  }

  public getAll(): Category[] {
    return [...this.categories];
  }

  public getByType(type: 'INCOME' | 'EXPENSE'): Category[] {
    return this.categories.filter(cat => cat.type === type);
  }

  public getById(id: string): Category | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  public create(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: `cat-custom-${Date.now()}`
    };
    this.categories.push(newCategory);
    this.saveCategories();
    return newCategory;
  }

  public update(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return null;

    this.categories[index] = {
      ...this.categories[index],
      ...updates
    };
    this.saveCategories();
    return this.categories[index];
  }

  public delete(id: string): boolean {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    this.saveCategories();
    return true;
  }

  public canDelete(id: string): boolean {
    return true;
  }

  public search(query: string): Category[] {
    const lowercaseQuery = query.toLowerCase();
    return this.categories.filter(cat => 
      cat.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  public exportCategories(): string {
    return JSON.stringify(this.categories, null, 2);
  }

  public importCategories(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        // Validar estrutura básica
        const isValid = imported.every(cat => 
          cat.id && cat.name && (cat.type === 'INCOME' || cat.type === 'EXPENSE')
        );
        
        if (isValid) {
          this.categories = imported;
          this.saveCategories();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao importar categorias:', error);
      return false;
    }
  }
}

// Singleton instance
export const categoryService = new CategoryService();