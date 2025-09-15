// Este arquivo agora serve como uma ponte para o CategoryService
// Mantemos a interface para compatibilidade com código existente
import { categoryService } from '@/services/categoryService';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
}

// Converter categoria do CategoryService para o formato esperado
const convertCategory = (cat: any): Category => ({
  id: cat.id || cat.code,
  name: cat.name,
  type: cat.type as 'INCOME' | 'EXPENSE',
  color: cat.color,
  icon: cat.icon
});

// Obter categorias de despesa do CategoryService
export const DEFAULT_EXPENSE_CATEGORIES: Category[] = (() => {
  const categories = categoryService.getByType('EXPENSE');
  return categories.map(convertCategory);
})();

// Obter categorias de receita do CategoryService
export const DEFAULT_INCOME_CATEGORIES: Category[] = (() => {
  const categories = categoryService.getByType('INCOME');
  return categories.map(convertCategory);
})();

// Funções utilitárias que delegam para o CategoryService
export const getAllCategories = (): Category[] => {
  const categories = categoryService.getAll();
  return categories.map(convertCategory);
};

export const getCategoriesByType = (type: 'INCOME' | 'EXPENSE'): Category[] => {
  const categories = categoryService.getByType(type);
  return categories.map(convertCategory);
};

export const getCategoryById = (id: string): Category | undefined => {
  const category = categoryService.getById(id) || categoryService.getByCode(id);
  return category ? convertCategory(category) : undefined;
};

export const getCategoryByName = (name: string, type?: 'INCOME' | 'EXPENSE'): Category | undefined => {
  const categories = type ? categoryService.getByType(type) : categoryService.getAll();
  const category = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  return category ? convertCategory(category) : undefined;
};