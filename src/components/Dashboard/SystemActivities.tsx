import React, { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  TrendingDown,
  Users,
  Home,
  FileText,
  Settings,
  User,
  Monitor,
  Plus,
  Edit,
  Trash,
  RefreshCw,
  Eye,
  Download,
  Upload,
  Clock,
  Filter,
  Search,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { Activity, ActivityCategory, ActivityType } from '@/services/activityLogger';
import { cn } from '@/lib/utils';
import { importFinancialData } from '@/utils/importFinancialData';

export const SystemActivities: React.FC = () => {
  const { activities, loading, searchActivities, filterByDateRange, refresh } = useActivityLogger({
    limit: 100,
    autoRefresh: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('all');

  // Importar dados financeiros uma única vez ao carregar
  useEffect(() => {
    const checkAndImport = async () => {
      const imported = localStorage.getItem('financial_data_imported');

      if (!imported) {
        console.log('Importando dados do centro financeiro...');
        const success = await importFinancialData();

        if (success) {
          localStorage.setItem('financial_data_imported', 'true');
          localStorage.setItem('financial_import_date', new Date().toISOString());
          refresh();
        }
      }
    };

    checkAndImport();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    if (searchTerm) {
      searchActivities(searchTerm);
    } else if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate = subDays(now, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
      }

      filterByDateRange(startDate, now);
    } else {
      refresh();
    }
  }, [searchTerm, dateRange]);

  // Filtrar por categoria e tipo localmente
  const filteredActivities = activities.filter(activity => {
    if (filterCategory !== 'all' && activity.category !== filterCategory) return false;
    if (filterType !== 'all' && activity.type !== filterType) return false;
    return true;
  });

  // Agrupar atividades por data
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = 'Hoje';
    } else if (isYesterday(date)) {
      dateKey = 'Ontem';
    } else {
      dateKey = format(date, "dd 'de' MMMM", { locale: ptBR });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  const getIcon = (iconName?: string) => {
    const icons: Record<string, any> = {
      'ShoppingCart': ShoppingCart,
      'TrendingUp': TrendingUp,
      'TrendingDown': TrendingDown,
      'Package': Package,
      'DollarSign': DollarSign,
      'Users': Users,
      'Home': Home,
      'Activity': ActivityIcon,
      'FileText': FileText,
      'Settings': Settings,
      'User': User,
      'Monitor': Monitor,
      'Plus': Plus,
      'Edit': Edit,
      'Trash': Trash,
      'RefreshCw': RefreshCw,
      'Eye': Eye,
      'Download': Download,
      'Upload': Upload,
      'Clock': Clock
    };

    const IconComponent = icons[iconName || 'Activity'] || ActivityIcon;
    return IconComponent;
  };

  const getCategoryBadgeColor = (category: ActivityCategory) => {
    const colors: Record<ActivityCategory, string> = {
      cattle_purchase: 'bg-purple-100 text-purple-800',
      sale: 'bg-green-100 text-green-800',
      lot: 'bg-blue-100 text-blue-800',
      financial: 'bg-yellow-100 text-yellow-800',
      expense: 'bg-red-100 text-red-800',
      revenue: 'bg-emerald-100 text-emerald-800',
      partner: 'bg-indigo-100 text-indigo-800',
      pen: 'bg-orange-100 text-orange-800',
      intervention: 'bg-pink-100 text-pink-800',
      report: 'bg-gray-100 text-gray-800',
      settings: 'bg-slate-100 text-slate-800',
      user: 'bg-cyan-100 text-cyan-800',
      system: 'bg-zinc-100 text-zinc-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getImportanceBadge = (importance: 'low' | 'medium' | 'high') => {
    switch (importance) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    return value;
  };


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Atividades do Sistema</CardTitle>
            <CardDescription className="mt-1">
              Registro completo de todas as operações realizadas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ActivityCategory | 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="cattle_purchase">Compra de Gado</SelectItem>
              <SelectItem value="sale">Vendas</SelectItem>
              <SelectItem value="lot">Lotes</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="revenue">Receitas</SelectItem>
              <SelectItem value="partner">Parceiros</SelectItem>
              <SelectItem value="pen">Currais</SelectItem>
              <SelectItem value="intervention">Intervenções</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as ActivityType | 'all')}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="status_change">Mudança de Status</SelectItem>
              <SelectItem value="payment">Pagamento</SelectItem>
              <SelectItem value="view">Visualização</SelectItem>
              <SelectItem value="export">Exportação</SelectItem>
              <SelectItem value="import">Importação</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-0">
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando atividades...
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <ActivityIcon className="h-8 w-8 mb-2" />
              <p>Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="space-y-6 px-6">
              {Object.entries(groupedActivities).map(([date, activities]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-background z-10 pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {date}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const Icon = getIcon(activity.icon);

                      return (
                        <div
                          key={activity.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group",
                            activity.importance === 'high' && "border-red-200 bg-red-50/50",
                            activity.importance === 'low' && "opacity-75"
                          )}
                        >
                          <div
                            className="mt-1 p-2 rounded-lg"
                            style={{ backgroundColor: `${activity.color}15` }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: activity.color }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium leading-tight">
                                  {activity.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {activity.description}
                                </p>

                                {/* Valores e metadados */}
                                {(activity.newValue || activity.metadata) && (
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {activity.newValue && typeof activity.newValue === 'number' && (
                                      <Badge variant="outline" className="text-xs">
                                        {formatValue(activity.newValue)}
                                      </Badge>
                                    )}
                                    {activity.metadata?.quantity && (
                                      <Badge variant="outline" className="text-xs">
                                        {activity.metadata.quantity} animais
                                      </Badge>
                                    )}
                                    {activity.metadata?.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {activity.metadata.category}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Informações adicionais */}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {activity.userName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(activity.timestamp), {
                                      addSuffix: true,
                                      locale: ptBR
                                    })}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs", getCategoryBadgeColor(activity.category))}
                                  >
                                    {activity.category.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {getImportanceBadge(activity.importance)}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};