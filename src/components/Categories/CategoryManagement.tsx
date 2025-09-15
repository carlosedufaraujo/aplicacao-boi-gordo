import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Search,
  Download,
  Upload,
  RefreshCw,
  Palette,
  Tags,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { categoryService, CategoryService } from '@/services/categoryService';
import { Category } from '@/data/defaultCategories';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#000000',
    icon: ''
  });

  // Carregar categorias
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const allCategories = categoryService.getAll();
    setCategories(allCategories);
  };

  // Filtrar categorias
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || cat.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Estatísticas
  const stats = {
    total: categories.length,
    income: categories.filter(c => c.type === 'INCOME').length,
    expense: categories.filter(c => c.type === 'EXPENSE').length,
    custom: categories.filter(c => c.id.startsWith('cat-custom-')).length
  };

  // Abrir dialog para criar/editar
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || '#000000',
        icon: category.icon || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'EXPENSE',
        color: '#000000',
        icon: ''
      });
    }
    setShowCategoryDialog(true);
  };

  // Salvar categoria
  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editingCategory) {
        categoryService.update(editingCategory.id, formData);
        toast.success('Categoria atualizada com sucesso');
      } else {
        categoryService.create(formData);
        toast.success('Categoria criada com sucesso');
      }
      loadCategories();
      setShowCategoryDialog(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  // Deletar categoria
  const handleDeleteCategory = (category: Category) => {
    if (!categoryService.canDelete(category.id)) {
      toast.error('Categorias padrão não podem ser excluídas');
      return;
    }
    setDeleteConfirmCategory(category);
  };

  const confirmDelete = () => {
    if (deleteConfirmCategory) {
      if (categoryService.delete(deleteConfirmCategory.id)) {
        toast.success('Categoria excluída com sucesso');
        loadCategories();
      } else {
        toast.error('Erro ao excluir categoria');
      }
      setDeleteConfirmCategory(null);
    }
  };

  // Resetar para padrões
  const handleResetToDefaults = () => {
    if (confirm('Isso irá restaurar todas as categorias para os valores padrão. Deseja continuar?')) {
      categoryService.resetToDefaults();
      loadCategories();
      toast.success('Categorias restauradas para o padrão');
    }
  };

  // Exportar categorias
  const handleExport = () => {
    const data = categoryService.exportCategories();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categorias-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Categorias exportadas com sucesso');
  };

  // Importar categorias
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        if (categoryService.importCategories(text)) {
          loadCategories();
          toast.success('Categorias importadas com sucesso');
        } else {
          toast.error('Erro ao importar categorias. Verifique o formato do arquivo.');
        }
      }
    };
    input.click();
  };

  // Cores predefinidas para seleção rápida
  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#475569', '#1e293b'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as categorias de receitas e despesas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button size="sm" onClick={() => openCategoryDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.custom} personalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.income}</div>
            <p className="text-xs text-muted-foreground">Categorias de entrada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expense}</div>
            <p className="text-xs text-muted-foreground">Categorias de saída</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personalizadas</CardTitle>
            <Palette className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.custom}</div>
            <p className="text-xs text-muted-foreground">Criadas pelo usuário</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Categorias</CardTitle>
              <CardDescription>
                Gerencie todas as categorias de receitas e despesas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INCOME">Receitas</SelectItem>
                  <SelectItem value="EXPENSE">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabela de Categorias - Melhorada */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">Cor</TableHead>
                  <TableHead className="w-[35%]">Nome da Categoria</TableHead>
                  <TableHead className="w-[15%]">Tipo</TableHead>
                  <TableHead className="w-[15%]">Origem</TableHead>
                  <TableHead className="w-[15%]">Ícone</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma categoria encontrada
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => {
                    const isDefault = category.id.startsWith('cat-exp-') || category.id.startsWith('cat-inc-');
                    return (
                      <TableRow key={category.id} className="hover:bg-muted/50">
                        <TableCell className="py-3">
                          <div className="flex items-center">
                            <div 
                              className="w-8 h-8 rounded-md border-2 shadow-sm"
                              style={{ 
                                backgroundColor: category.color || '#000000',
                                borderColor: category.color || '#000000' 
                              }}
                              title={category.color}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium py-3">
                          <div className="flex items-center gap-2">
                            <span>{category.name}</span>
                            {category.id.startsWith('cat-custom-') && (
                              <Badge variant="outline" className="text-xs">
                                Personalizada
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge 
                            variant={category.type === 'INCOME' ? 'default' : 'destructive'}
                            className="font-normal"
                          >
                            <div className="flex items-center gap-1">
                              {category.type === 'INCOME' ? (
                                <>
                                  <TrendingUp className="h-3 w-3" />
                                  Receita
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-3 w-3" />
                                  Despesa
                                </>
                              )}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1">
                            {isDefault ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span className="text-sm">Sistema</span>
                              </>
                            ) : (
                              <>
                                <Palette className="h-3 w-3 text-purple-600" />
                                <span className="text-sm">Usuário</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {category.icon ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{category.icon}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCategoryDialog(category)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(category)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Rodapé com informações */}
          {filteredCategories.length > 0 && (
            <div className="px-4 py-3 border-t bg-muted/30">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Exibindo {filteredCategories.length} de {categories.length} categorias
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    {stats.income} receitas
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    {stats.expense} despesas
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    {stats.custom} personalizadas
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar Categoria */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Atualize as informações da categoria' 
                : 'Crie uma nova categoria para organizar suas movimentações'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Material de Escritório"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'INCOME' | 'EXPENSE') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">
                    <div className="flex items-center">
                      <TrendingDown className="mr-2 h-4 w-4 text-red-600" />
                      Despesa
                    </div>
                  </SelectItem>
                  <SelectItem value="INCOME">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                      Receita
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <div className="flex gap-1 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400"
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog 
        open={!!deleteConfirmCategory} 
        onOpenChange={() => setDeleteConfirmCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deleteConfirmCategory?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManagement;
