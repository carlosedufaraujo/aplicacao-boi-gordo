import React from 'react';
import { 
  X, 
  Package, 
  Bug, 
  Shield, 
  Zap, 
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  Star
} from 'lucide-react';
import { SystemUpdate } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpdateDetailModalProps {
  update: SystemUpdate;
  isOpen: boolean;
  onClose: () => void;
  onFeedback: () => void;
}

export const UpdateDetailModal: React.FC<UpdateDetailModalProps> = ({
  update,
  isOpen,
  onClose,
  onFeedback
}) => {
  if (!isOpen) return null;

  // Ícones por tipo
  const typeIcons = {
    feature: <Package className="w-5 h-5" />,
    improvement: <TrendingUp className="w-5 h-5" />,
    bugfix: <Bug className="w-5 h-5" />,
    security: <Shield className="w-5 h-5" />,
    performance: <Zap className="w-5 h-5" />
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeColors[update.type].split(' ')[0]}`}>
              {typeIcons[update.type]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-b3x-navy-900">{update.title}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-neutral-500">v{update.version}</span>
                <span className="text-sm text-neutral-500">•</span>
                <span className="text-sm text-neutral-500">
                  {format(update.releaseDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`
              inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border
              ${typeColors[update.type]}
            `}>
              {typeIcons[update.type]}
              <span className="ml-1.5">{typeLabels[update.type]}</span>
            </span>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium">
              {categoryLabels[update.category]}
            </span>
            {update.isHighlighted && (
              <span className="px-3 py-1 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg text-sm font-medium flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Destaque
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-2">Descrição</h3>
            <p className="text-neutral-600 leading-relaxed">{update.description}</p>
          </div>

          {/* Image */}
          {update.imageUrl && (
            <div className="mb-6">
              <img
                src={update.imageUrl}
                alt={update.title}
                className="w-full rounded-lg shadow-soft"
              />
            </div>
          )}

          {/* Changes */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3">
              O que mudou ({update.changes.length} {update.changes.length === 1 ? 'mudança' : 'mudanças'})
            </h3>
            <div className="space-y-3">
              {update.changes.map((change, index) => (
                <div key={change.id} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-success-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-3 h-3 text-success-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-neutral-700 leading-relaxed">
                      {change.description}
                    </p>
                    {change.icon && (
                      <span className="inline-flex items-center mt-1 text-xs text-neutral-500">
                        <i className={`${change.icon} w-3 h-3 mr-1`} />
                        Relacionado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Author */}
          {update.author && (
            <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg">
              <User className="w-4 h-4 text-neutral-500" />
              <div>
                <span className="text-sm text-neutral-600">Implementado por</span>
                <span className="ml-2 text-sm font-medium text-b3x-navy-900">{update.author}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center space-x-3 text-sm text-neutral-500">
            <Calendar className="w-4 h-4" />
            <span>Lançado em {format(update.releaseDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={onFeedback}
              className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Dar Feedback</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 