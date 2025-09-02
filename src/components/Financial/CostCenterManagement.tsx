import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Hash,
  DollarSign,
  Package,
  Users,
  Truck,
  Heart,
  Settings,
  Search,
  Filter,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: 'OPERATIONAL' | 'ADMINISTRATIVE' | 'LOT_SPECIFIC' | 'GLOBAL';
  parentId?: string;
  parent?: CostCenter;
  children?: CostCenter[];
  isActive: boolean;
  description?: string;
  allocationMethod?: 'DIRECT' | 'PROPORTIONAL' | 'BY_HEADCOUNT' | 'BY_WEIGHT';
  createdAt: string;
  updatedAt: string;
  _count?: {
    expenses: number;
    revenues: number;
  };
}

const COST_CENTER_TYPES = {
  OPERATIONAL: { label: 'Operacional', icon: Package, color: 'bg-blue-500' },
  ADMINISTRATIVE: { label: 'Administrativo', icon: Building2, color: 'bg-purple-500' },
  LOT_SPECIFIC: { label: 'Específico do Lote', icon: Hash, color: 'bg-green-500' },
  GLOBAL: { label: 'Global', icon: Settings, color: 'bg-gray-500' }
};

const ALLOCATION_METHODS = {
  DIRECT: 'Direto',
  PROPORTIONAL: 'Proporcional',
  BY_HEADCOUNT: 'Por Cabeça',
  BY_WEIGHT: 'Por Peso'
};

export const CostCenterManagement: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'OPERATIONAL' as CostCenter['type'],
    parentId: '',
    description: '',
    allocationMethod: 'DIRECT' as CostCenter['allocationMethod'],
    isActive: true
  });

  // Buscar centros de custo
  const fetchCostCenters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cost-centers`);
      if (!response.ok) throw new Error('Erro ao buscar centros de custo');
      
      const data = await response.json();
      const centers = data.data?.items || [];
      
      // Organizar em hierarquia
      const organized = organizeHierarchy(centers);
      setCostCenters(organized);
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error);
      toast.error('Erro ao carregar centros de custo');
    } finally {
      setLoading(false);
    }
  };

  // Organizar centros em hierarquia
  const organizeHierarchy = (centers: CostCenter[]): CostCenter[] => {
    const map = new Map<string, CostCenter>();
    const roots: CostCenter[] = [];

    // Primeiro, criar um mapa de todos os centros
    centers.forEach(center => {
      map.set(center.id, { ...center, children: [] });
    });

    // Depois, organizar a hierarquia
    centers.forEach(center => {
      const node = map.get(center.id);
      if (node) {
        if (center.parentId) {
          const parent = map.get(center.parentId);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  // Criar ou atualizar centro de custo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Código e nome são obrigatórios');
      return;
    }

    try {
      const url = editingCenter 
        ? `${API_BASE}/cost-centers/${editingCenter.id}`
        : `${API_BASE}/cost-centers`;
      
      const method = editingCenter ? 'PUT' : 'POST';
      
      // Preparar dados, removendo parentId se estiver vazio
      const dataToSend = {
        ...formData,
        parentId: formData.parentId || undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) throw new Error('Erro ao salvar centro de custo');

      toast.success(editingCenter ? 'Centro de custo atualizado!' : 'Centro de custo criado!');
      
      setShowDialog(false);
      resetForm();
      fetchCostCenters();
    } catch (error) {
      console.error('Erro ao salvar centro de custo:', error);
      toast.error('Erro ao salvar centro de custo');
    }
  };

  // Deletar centro de custo
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) return;

    try {
      const response = await fetch(`${API_BASE}/cost-centers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir centro de custo');

      toast.success('Centro de custo excluído!');
      fetchCostCenters();
    } catch (error) {
      console.error('Erro ao excluir centro de custo:', error);
      toast.error('Erro ao excluir centro de custo. Verifique se não há lançamentos vinculados.');
    }
  };

  // Alternar ativação do centro
  const toggleActive = async (center: CostCenter) => {
    try {
      const response = await fetch(`${API_BASE}/cost-centers/${center.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...center, isActive: !center.isActive })
      });

      if (!response.ok) throw new Error('Erro ao atualizar centro de custo');

      toast.success(center.isActive ? 'Centro de custo desativado' : 'Centro de custo ativado');
      fetchCostCenters();
    } catch (error) {
      console.error('Erro ao atualizar centro de custo:', error);
      toast.error('Erro ao atualizar centro de custo');
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'OPERATIONAL',
      parentId: '',
      description: '',
      allocationMethod: 'DIRECT',
      isActive: true
    });
    setEditingCenter(null);
  };

  // Abrir dialog para editar
  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      type: center.type,
      parentId: center.parentId || '',
      description: center.description || '',
      allocationMethod: center.allocationMethod || 'DIRECT',
      isActive: center.isActive
    });
    setShowDialog(true);
  };

  // Toggle expandir/colapsar nó
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Filtrar centros de custo
  const filterCenters = (centers: CostCenter[]): CostCenter[] => {
    return centers.filter(center => {
      const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           center.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || center.type === selectedType;
      
      if (matchesSearch && matchesType) return true;
      
      // Verificar se algum filho corresponde
      if (center.children && center.children.length > 0) {
        const filteredChildren = filterCenters(center.children);
        if (filteredChildren.length > 0) {
          center.children = filteredChildren;
          return true;
        }
      }
      
      return false;
    });
  };

  // Componente para renderizar linha da árvore
  const TreeRow: React.FC<{ center: CostCenter; level: number }> = ({ center, level }) => {
    const hasChildren = center.children && center.children.length > 0;
    const isExpanded = expandedNodes.has(center.id);
    const TypeInfo = COST_CENTER_TYPES[center.type];
    const Icon = TypeInfo.icon;

    return (
      <>
        <TableRow className={!center.isActive ? 'opacity-50' : ''}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6 mr-2"
                  onClick={() => toggleExpand(center.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              {!hasChildren && <div className="w-8" />}
              {isExpanded ? <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" /> : <Folder className="h-4 w-4 mr-2 text-muted-foreground" />}
              <span className="font-medium">{center.code}</span>
            </div>
          </TableCell>
          <TableCell>{center.name}</TableCell>
          <TableCell>
            <Badge variant="outline" className="gap-1">
              <Icon className="h-3 w-3" />
              {TypeInfo.label}
            </Badge>
          </TableCell>
          <TableCell>
            {center.allocationMethod && (
              <Badge variant="secondary">
                {ALLOCATION_METHODS[center.allocationMethod]}
              </Badge>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {center._count?.expenses || 0} despesas
              </Badge>
              <Badge variant="outline" className="text-xs">
                {center._count?.revenues || 0} receitas
              </Badge>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={center.isActive ? 'default' : 'secondary'}>
              {center.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEdit(center)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleActive(center)}>
                  {center.isActive ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(center.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && center.children?.map(child => (
          <TreeRow key={child.id} center={child} level={level + 1} />
        ))}
      </>
    );
  };

  // Obter todos os centros planos para o select
  const getFlatCenters = (centers: CostCenter[], level = 0): { value: string; label: string }[] => {
    const result: { value: string; label: string }[] = [];
    
    centers.forEach(center => {
      result.push({
        value: center.id,
        label: `${'  '.repeat(level)}${center.code} - ${center.name}`
      });
      
      if (center.children && center.children.length > 0) {
        result.push(...getFlatCenters(center.children, level + 1));
      }
    });
    
    return result;
  };

  const filteredCenters = filterCenters(costCenters);
  const flatCenters = getFlatCenters(costCenters);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando centros de custo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Centros de Custo</h2>
          <p className="text-muted-foreground">Gerencie a estrutura de centros de custo</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Centro de Custo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(COST_CENTER_TYPES).map(([key, info]) => {
          const count = costCenters.filter(c => c.type === key).length;
          const Icon = info.icon;
          
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${info.color} bg-opacity-20`}>
                    <Icon className={`h-6 w-6 ${info.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(COST_CENTER_TYPES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Centros de Custo */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Centros de Custo</CardTitle>
          <CardDescription>
            Visualize e gerencie a hierarquia de centros de custo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCenters.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhum centro de custo encontrado</AlertTitle>
              <AlertDescription>
                {searchTerm || selectedType !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Clique em "Novo Centro de Custo" para adicionar o primeiro.'}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método de Alocação</TableHead>
                  <TableHead>Lançamentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map(center => (
                  <TreeRow key={center.id} center={center} level={0} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
            </DialogTitle>
            <DialogDescription>
              {editingCenter 
                ? 'Atualize as informações do centro de custo'
                : 'Preencha as informações para criar um novo centro de custo'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Código */}
                <div>
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: 001, ADM-001"
                    required
                  />
                </div>

                {/* Nome */}
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do centro de custo"
                    required
                  />
                </div>

                {/* Tipo */}
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as CostCenter['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COST_CENTER_TYPES).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Método de Alocação */}
                <div>
                  <Label htmlFor="allocationMethod">Método de Alocação</Label>
                  <Select
                    value={formData.allocationMethod}
                    onValueChange={(value) => setFormData({ ...formData, allocationMethod: value as CostCenter['allocationMethod'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALLOCATION_METHODS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Centro Pai */}
                <div className="col-span-2">
                  <Label htmlFor="parentId">Centro de Custo Pai (opcional)</Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um centro pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Centro raiz)</SelectItem>
                      {flatCenters
                        .filter(c => c.value !== editingCenter?.id) // Não pode ser pai de si mesmo
                        .map(center => (
                          <SelectItem key={center.value} value={center.value}>
                            {center.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do centro de custo"
                    rows={3}
                  />
                </div>

                {/* Status Ativo */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Centro de Custo Ativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Centros inativos não podem receber novos lançamentos
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCenter ? 'Atualizar' : 'Criar'} Centro de Custo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};