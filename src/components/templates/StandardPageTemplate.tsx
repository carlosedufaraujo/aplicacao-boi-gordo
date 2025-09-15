import React from 'react';
import { Plus, Download, Upload, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

/**
 * Template Padronizado para Páginas do Sistema BoviControl
 *
 * Este componente serve como base para criar novas páginas seguindo
 * os padrões estabelecidos no BOVICONTROL_STYLE_GUIDE.md
 *
 * Uso:
 * <StandardPageTemplate
 *   title="Título da Página"
 *   subtitle="Descrição da funcionalidade"
 *   metrics={metricsArray}
 *   filters={filtersConfig}
 *   onNewItem={() => {}}
 *   onExport={() => {}}
 *   onImport={() => {}}
 * >
 *   {children}
 * </StandardPageTemplate>
 */

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface FilterConfig {
  searchPlaceholder?: string;
  customFilters?: React.ReactNode;
  onSearch?: (value: string) => void;
}

interface StandardPageTemplateProps {
  title: string;
  subtitle?: string;
  metrics?: Metric[];
  filters?: FilterConfig;
  actions?: {
    showNew?: boolean;
    showExport?: boolean;
    showImport?: boolean;
    customActions?: React.ReactNode;
  };
  onNewItem?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  children: React.ReactNode;
}

export const StandardPageTemplate: React.FC<StandardPageTemplateProps> = ({
  title,
  subtitle,
  metrics = [],
  filters,
  actions = { showNew: true, showExport: true, showImport: true },
  onNewItem,
  onExport,
  onImport,
  children,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filters?.onSearch?.(value);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Padronizado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-2">
          {actions.customActions}

          {actions.showExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}

          {actions.showImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          )}

          {actions.showNew && (
            <Button size="sm" onClick={onNewItem}>
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      {metrics.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 ${metric.bgColor} rounded w-fit`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    {metric.change && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {metric.change}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <div className="text-lg font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Seção de Filtros */}
      {filters && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={filters.searchPlaceholder || "Buscar..."}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              {filters.customFilters}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Principal */}
      {children}
    </div>
  );
};

/**
 * Template para Card de Item em Lista
 */
interface ItemCardTemplateProps {
  avatar?: {
    src?: string;
    fallback: string;
  };
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
  details?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }>;
  status?: {
    isActive: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
  };
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export const ItemCardTemplate: React.FC<ItemCardTemplateProps> = ({
  avatar,
  title,
  subtitle,
  badge,
  details = [],
  status,
  actions,
  footer,
}) => {
  return (
    <Card className="hover:shadow-sm transition-shadow group">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {avatar && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {avatar.fallback}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {badge && (
              <Badge
                variant={badge.variant}
                className={badge.className || "text-[10px] px-1.5 py-0.5"}
              >
                {badge.label}
              </Badge>
            )}
            {actions}
          </div>
        </div>
      </CardHeader>

      {(details.length > 0 || status || footer) && (
        <CardContent className="p-3 pt-1 space-y-1.5">
          {/* Detalhes */}
          {details.length > 0 && (
            <div className="space-y-1">
              {details.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Icon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{detail.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer com Status */}
          {(status || footer) && (
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t">
              {status && (
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${status.isActive ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                  <span className="text-[10px] text-muted-foreground">
                    {status.isActive
                      ? (status.activeLabel || 'Ativo')
                      : (status.inactiveLabel || 'Inativo')
                    }
                  </span>
                </div>
              )}
              {footer}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Template para Estado Vazio
 */
interface EmptyStateTemplateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyStateTemplate: React.FC<EmptyStateTemplateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <Button size="sm" className="mt-4" onClick={action.onClick}>
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Template para Loading State
 */
interface LoadingStateTemplateProps {
  message?: string;
}

export const LoadingStateTemplate: React.FC<LoadingStateTemplateProps> = ({
  message = "Carregando...",
}) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};