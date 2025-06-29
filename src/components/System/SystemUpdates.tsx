import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Package, 
  Bug, 
  Shield, 
  Zap, 
  TrendingUp, 
  Calendar,
  Star,
  MessageCircle,
  ChevronRight,
  Filter,
  Search,
  X,
  Sparkles,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { SystemUpdate } from '../../types';
import { UpdateDetailModal } from './UpdateDetailModal';
import { UpdateFeedbackModal } from './UpdateFeedbackModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const SystemUpdates: React.FC = () => {
  const { 
    systemUpdates, 
    lastViewedUpdateDate,
    setLastViewedUpdateDate,
    addNotification 
  } = useAppStore();

  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackUpdateId, setFeedbackUpdateId] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | SystemUpdate['type']>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | SystemUpdate['category']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Marcar atualizações como visualizadas
  useEffect(() => {
    setLastViewedUpdateDate(new Date());
  }, [setLastViewedUpdateDate]);

  // Ícones por tipo
  const typeIcons = {
    feature: <Package className="w-4 h-4" />,
    improvement: <TrendingUp className="w-4 h-4" />,
    bugfix: <Bug className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    performance: <Zap className="w-4 h-4" />
  };

  // Cores por tipo
  const typeColors = {
    feature: 'bg-success-100 text-success-700 border-success-200',
    improvement: 'bg-info-100 text-info-700 border-info-200',
    bugfix: 'bg-warning-100 text-warning-700 border-warning-200',
    security: 'bg-error-100 text-error-700 border-error-200',
    performance: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  // Labels por tipo
  const typeLabels = {
    feature: 'Nova Funcionalidade',
    improvement: 'Melhoria',
    bugfix: 'Correção',
    security: 'Segurança',
    performance: 'Performance'
  };

  // Labels por categoria
  const categoryLabels = {
    pipeline: 'Pipeline',
    financial: 'Financeiro',
    reports: 'Relatórios',
    ui: 'Interface',
    api: 'API',
    general: 'Geral'
  };

  // Filtrar atualizações
  const filteredUpdates = systemUpdates.filter(update => {
    // Filtro por tipo
    if (filterType !== 'all' && update.type !== filterType) return false;
    
    // Filtro por categoria
    if (filterCategory !== 'all' && update.category !== filterCategory) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        update.title.toLowerCase().includes(search) ||
        update.description.toLowerCase().includes(search) ||
        update.changes.some(change => 
          change.description.toLowerCase().includes(search)
        )
      );
    }
    
    return true;
  });

  // Agrupar por mês
  const groupedUpdates = filteredUpdates.reduce((groups, update) => {
    const month = format(update.releaseDate, 'MMMM yyyy', { locale: ptBR });
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(update);
    return groups;
  }, {} as Record<string, SystemUpdate[]>);

  // Verificar se há novas atualizações
  const hasNewUpdates = systemUpdates.some(update => 
    !lastViewedUpdateDate || update.releaseDate > lastViewedUpdateDate
  );

  const handleUpdateClick = (update: SystemUpdate) => {
    setSelectedUpdate(update);
  };

  const handleFeedback = (updateId: string) => {
    setFeedbackUpdateId(updateId);
    setShowFeedbackModal(true);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-b3x-navy-900 flex items-center">
              <Bell className="w-6 h-6 mr-3 text-b3x-navy-600" />
              Atualizações do Sistema
              {hasNewUpdates && (
                <span className="ml-3 px-2 py-1 bg-b3x-lime-500 text-b3x-navy-900 text-xs font-medium rounded-full">
                  Novo
                </span>
              )}
            </h1>
            <p className="text-neutral-600 mt-1">
              Acompanhe as novidades e melhorias do B3X CEAC
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Estatísticas */}
            <div className="bg-white rounded-lg px-4 py-2 border border-neutral-200 shadow-sm">
              <div className="text-xs text-neutral-500">Total de Atualizações</div>
              <div className="text-lg font-bold text-b3x-navy-900">{systemUpdates.length}</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
          <div className="flex flex-wrap items-center gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar atualizações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Filtro por Categoria */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
            >
              <option value="all">Todas as Categorias</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(filterType !== 'all' || filterCategory !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('all');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Atualizações */}
      <div className="space-y-6">
        {Object.entries(groupedUpdates).map(([month, updates]) => (
          <div key={month}>
            {/* Cabeçalho do Mês */}
            <div className="flex items-center mb-4">
              <Calendar className="w-4 h-4 mr-2 text-neutral-500" />
              <h2 className="text-lg font-semibold text-b3x-navy-900 capitalize">
                {month}
              </h2>
              <span className="ml-2 text-sm text-neutral-500">
                ({updates.length} {updates.length === 1 ? 'atualização' : 'atualizações'})
              </span>
            </div>

            {/* Atualizações do Mês */}
            <div className="space-y-3">
              {updates.map(update => (
                <div
                  key={update.id}
                  className={`
                    bg-white rounded-xl border shadow-soft overflow-hidden
                    transition-all duration-200 hover:shadow-md cursor-pointer
                    ${update.isHighlighted ? 'border-b3x-lime-500 ring-2 ring-b3x-lime-500/20' : 'border-neutral-200'}
                  `}
                  onClick={() => handleUpdateClick(update)}
                >
                  {/* Destaque para atualizações importantes */}
                  {update.isHighlighted && (
                    <div className="bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-400 px-4 py-2 flex items-center justify-between">
                      <span className="text-b3x-navy-900 font-medium text-sm flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Atualização em Destaque
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {/* Cabeçalho */}
                        <div className="flex items-center space-x-3 mb-2">
                          {/* Tipo */}
                          <span className={`
                            inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border
                            ${typeColors[update.type]}
                          `}>
                            {typeIcons[update.type]}
                            <span className="ml-1">{typeLabels[update.type]}</span>
                          </span>

                          {/* Categoria */}
                          <span className="text-xs text-neutral-500">
                            {categoryLabels[update.category]}
                          </span>

                          {/* Versão */}
                          <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">
                            v{update.version}
                          </span>

                          {/* Nova */}
                          {(!lastViewedUpdateDate || update.releaseDate > lastViewedUpdateDate) && (
                            <span className="px-2 py-1 bg-b3x-lime-500 text-b3x-navy-900 text-xs font-medium rounded-full">
                              Nova
                            </span>
                          )}
                        </div>

                        {/* Título e Descrição */}
                        <h3 className="text-base font-semibold text-b3x-navy-900 mb-1">
                          {update.title}
                        </h3>
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {update.description}
                        </p>

                        {/* Preview das mudanças */}
                        <div className="mt-3 space-y-1">
                          {update.changes.slice(0, 2).map(change => (
                            <div key={change.id} className="flex items-start text-xs text-neutral-500">
                              <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-success-500 flex-shrink-0" />
                              <span className="line-clamp-1">{change.description}</span>
                            </div>
                          ))}
                          {update.changes.length > 2 && (
                            <div className="text-xs text-b3x-lime-600 font-medium">
                              +{update.changes.length - 2} outras mudanças
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Imagem Preview */}
                      {update.imageUrl && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={update.imageUrl}
                            alt={update.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center space-x-4 text-xs text-neutral-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(update.releaseDate, "d 'de' MMMM", { locale: ptBR })}
                        </span>
                        {update.author && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {update.author}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeedback(update.id);
                          }}
                          className="px-3 py-1.5 text-xs text-neutral-600 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors flex items-center"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Feedback
                        </button>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredUpdates.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-b3x-navy-900 mb-2">
              Nenhuma atualização encontrada
            </h3>
            <p className="text-neutral-600 text-sm">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Ainda não há atualizações do sistema'}
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      {selectedUpdate && (
        <UpdateDetailModal
          update={selectedUpdate}
          isOpen={!!selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
          onFeedback={() => handleFeedback(selectedUpdate.id)}
        />
      )}

      <UpdateFeedbackModal
        updateId={feedbackUpdateId}
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackUpdateId('');
        }}
      />
    </div>
  );
}; 