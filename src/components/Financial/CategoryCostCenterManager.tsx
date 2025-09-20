import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Building2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Palette,
  FolderTree
} from 'lucide-react';
import { categoryAPI } from '@/services/api/categoryApi';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: 'acquisition' | 'fattening' | 'administrative' | 'financial';
  parentId?: string;
  isActive: boolean;
}

export const CategoryCostCenterManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories');

  // Estados para o formulário de categoria
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#3B82F6',
    icon: 'tag'
  });

  // Estados para o formulário de centro de custo
  const [showCostCenterDialog, setShowCostCenterDialog] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [costCenterForm, setCostCenterForm] = useState({
    name: '',
    code: '',
    description: '',
    type: 'fattening' as 'acquisition' | 'fattening' | 'administrative' | 'financial',
    parentId: ''
  });

  // Cores predefinidas para categorias
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];

  // Ícones disponíveis
  const availableIcons = [
    { value: 'tag', label: 'Tag' },
    { value: 'dollar', label: 'Dinheiro' },
    { value: 'cart', label: 'Carrinho' },
    { value: 'truck', label: 'Caminhão' },
    { value: 'heart', label: 'Saúde' },
    { value: 'briefcase', label: 'Negócios' },
    { value: 'home', label: 'Casa' },
    { value: 'tool', label: 'Ferramenta' }
  ];

  // Tipos de centro de custo
  const costCenterTypes = [
    { value: 'acquisition', label: 'Aquisição', color: 'bg-blue-100 text-blue-800' },
    { value: 'fattening', label: 'Engorda', color: 'bg-green-100 text-green-800' },
    { value: 'administrative', label: 'Administrativo', color: 'bg-purple-100 text-purple-800' },
    { value: 'financial', label: 'Financeiro', color: 'bg-yellow-100 text-yellow-800' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar categorias do backend
      const categoriesData = await categoryAPI.getAll();
      setCategories(categoriesData);

      // TODO: Carregar centros de custo quando a API estiver disponível
      // const costCentersData = await costCenterAPI.getAll();
      // setCostCenters(costCentersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Funções para Categorias
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, categoryForm);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await categoryAPI.create(categoryForm);
        toast.success('Categoria criada com sucesso');
      }

      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        type: 'EXPENSE',
        color: '#3B82F6',
        icon: 'tag'
      });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color || '#3B82F6',
      icon: category.icon || 'tag'
    });
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        const canDelete = await categoryAPI.canDelete(id);
        if (!canDelete) {
          toast.error('Categoria em uso, não pode ser excluída');
          return;
        }

        await categoryAPI.delete(id);
        toast.success('Categoria excluída com sucesso');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        toast.error('Erro ao excluir categoria');
      }
    }
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    try {
      await categoryAPI.update(category.id, { isActive: !category.isActive });
      toast.success(`Categoria ${category.isActive ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da categoria');
    }
  };

  // Renderizar lista de categorias
  const renderCategories = () => {
    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
    const incomeCategories = categories.filter(c => c.type === 'INCOME');

    return (
      <div className="space-y-6">
        {/* Categorias de Despesa */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-red-500" />
            Categorias de Despesa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expenseCategories.map(category => (
              <div
                key={category.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    >
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant={category.isActive ? 'success' : 'secondary'}>
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      disabled={category.isDefault}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleCategoryStatus(category)}
                    >
                      {category.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={category.isDefault}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categorias de Receita */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Categorias de Receita
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeCategories.map(category => (
              <div
                key={category.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category.color || '#10B981' }}
                    >
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant={category.isActive ? 'success' : 'secondary'}>
                        {category.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      disabled={category.isDefault}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleCategoryStatus(category)}
                    >
                      {category.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={category.isDefault}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar lista de centros de custo
  const renderCostCenters = () => {
    const groupedCostCenters = costCenterTypes.map(type => ({
      ...type,
      centers: costCenters.filter(cc => cc.type === type.value)
    }));

    return (
      <div className="space-y-6">
        {groupedCostCenters.map(group => (
          <div key={group.value}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Centros de Custo - {group.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.centers.map(center => (
                <div
                  key={center.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{center.name}</h4>
                      <p className="text-sm text-gray-500">{center.code}</p>
                      {center.description && (
                        <p className="text-sm text-gray-600 mt-1">{center.description}</p>
                      )}
                      <Badge className={`mt-2 ${group.color}`}>
                        {group.label}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCostCenter(center);
                          setCostCenterForm({
                            name: center.name,
                            code: center.code,
                            description: center.description || '',
                            type: center.type,
                            parentId: center.parentId || ''
                          });
                          setShowCostCenterDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // TODO: Implementar exclusão de centro de custo
                          toast.info('Funcionalidade em desenvolvimento');
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {group.centers.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Nenhum centro de custo cadastrado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestão de Categorias e Centros de Custo</CardTitle>
        <CardDescription>
          Gerencie as categorias de despesas/receitas e os centros de custo para melhor controle financeiro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">
              <Tag className="w-4 h-4 mr-2" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="costcenters">
              <Building2 className="w-4 h-4 mr-2" />
              Centros de Custo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As categorias são usadas para classificar despesas e receitas.
                  Categorias padrão não podem ser excluídas.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setShowCategoryDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              renderCategories()
            )}
          </TabsContent>

          <TabsContent value="costcenters" className="space-y-4">
            <div className="flex justify-between items-center">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Centros de custo permitem alocar despesas para diferentes áreas do negócio.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setShowCostCenterDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Centro de Custo
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              renderCostCenters()
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para Categoria */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={categoryForm.type}
                  onValueChange={(value: 'INCOME' | 'EXPENSE') =>
                    setCategoryForm({ ...categoryForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                    <SelectItem value="INCOME">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex space-x-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        categoryForm.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Ícone</Label>
                <Select
                  value={categoryForm.icon}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCategory}>
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Centro de Custo */}
        <Dialog open={showCostCenterDialog} onOpenChange={setShowCostCenterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={costCenterForm.name}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, name: e.target.value })}
                  placeholder="Nome do centro de custo"
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input
                  value={costCenterForm.code}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, code: e.target.value })}
                  placeholder="Código único"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={costCenterForm.description}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, description: e.target.value })}
                  placeholder="Descrição (opcional)"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={costCenterForm.type}
                  onValueChange={(value: 'acquisition' | 'fattening' | 'administrative' | 'financial') =>
                    setCostCenterForm({ ...costCenterForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenterTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCostCenterDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // TODO: Implementar salvamento de centro de custo
                toast.info('Funcionalidade em desenvolvimento');
                setShowCostCenterDialog(false);
              }}>
                {editingCostCenter ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};