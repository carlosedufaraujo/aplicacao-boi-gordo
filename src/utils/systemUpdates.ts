import { useAppStore } from '../stores/useAppStore';
import { SystemUpdate } from '../types';

// Função para registrar uma nova atualização do sistema
export const registerSystemUpdate = (
  version: string,
  title: string,
  description: string,
  type: SystemUpdate['type'],
  category: SystemUpdate['category'],
  changes: Array<{ description: string; icon?: string }>,
  isHighlighted: boolean = false
) => {
  const store = useAppStore.getState();
  
  const update: Omit<SystemUpdate, 'id' | 'createdAt'> = {
    version,
    title,
    description,
    type,
    category,
    changes: changes.map((change, index) => ({
      id: `change-${index}`,
      description: change.description,
      icon: change.icon
    })),
    releaseDate: new Date(),
    author: 'Equipe B3X',
    isHighlighted
  };
  
  store.addSystemUpdate(update);
  
  // Adicionar notificação sobre a nova atualização
  store.addNotification({
    type: 'info',
    title: 'Nova Atualização do Sistema',
    message: `${title} - v${version}`
  });
};

// Registrar atualizações existentes
export const registerExistingUpdates = () => {
  const store = useAppStore.getState();
  
  // Só registrar se ainda não houver atualizações
  if (store.systemUpdates.length > 0) return;
  
  // v1.0.0 - Lançamento inicial
  registerSystemUpdate(
    '1.0.0',
    'Lançamento do B3X CEAC',
    'Versão inicial do sistema de gestão de confinamento bovino com todos os módulos principais.',
    'feature',
    'general',
    [
      { description: 'Pipeline de Compras com kanban interativo', icon: 'ShoppingCart' },
      { description: 'Pipeline de Abate com rastreamento completo', icon: 'Package' },
      { description: 'Gestão de Lotes e Mapa de Currais', icon: 'Map' },
      { description: 'Centro Financeiro unificado', icon: 'DollarSign' },
      { description: 'DRE Integrado por lote e curral', icon: 'FileText' },
      { description: 'Calendário Financeiro com fluxo de caixa', icon: 'Calendar' },
      { description: 'Conciliação Financeira automatizada', icon: 'CheckCircle' },
      { description: 'Central de Notificações configurável', icon: 'Bell' },
      { description: 'Dashboard com KPIs e gráficos interativos', icon: 'BarChart' }
    ],
    true
  );
  
  // v1.0.1 - Melhorias de UI
  registerSystemUpdate(
    '1.0.1',
    'Melhorias de Interface',
    'Ajustes visuais e melhorias de responsividade em diversos componentes.',
    'improvement',
    'ui',
    [
      { description: 'Sidebar colapsável com estado persistente', icon: 'Menu' },
      { description: 'Pipeline responsivo para dispositivos móveis', icon: 'Smartphone' },
      { description: 'Melhorias nos tooltips e feedbacks visuais', icon: 'Info' },
      { description: 'Animações suaves nas transições', icon: 'Zap' }
    ]
  );
  
  // v1.0.2 - Correções
  registerSystemUpdate(
    '1.0.2',
    'Correções e Estabilidade',
    'Correção de bugs reportados e melhorias de estabilidade.',
    'bugfix',
    'general',
    [
      { description: 'Correção na validação de datas obrigatórias', icon: 'Calendar' },
      { description: 'Ajuste no cálculo de custos acumulados', icon: 'Calculator' },
      { description: 'Correção na alocação de animais em currais', icon: 'Map' },
      { description: 'Melhoria na performance do dashboard', icon: 'Zap' }
    ]
  );
  
  // v1.1.0 - Sistema de Atualizações
  registerSystemUpdate(
    '1.1.0',
    'Sistema de Atualizações',
    'Implementação do sistema de atualizações para acompanhar todas as mudanças e melhorias do sistema.',
    'feature',
    'general',
    [
      { description: 'Página de atualizações do sistema', icon: 'Bell' },
      { description: 'Registro automático de mudanças', icon: 'FileText' },
      { description: 'Sistema de feedback por atualização', icon: 'MessageCircle' },
      { description: 'Notificações de novas versões', icon: 'Bell' },
      { description: 'Filtros e busca de atualizações', icon: 'Search' },
      { description: 'Detalhamento completo de cada mudança', icon: 'Info' }
    ],
    true
  );
  
  // v1.1.1 - Validação de Datas e Gerenciador de Dados de Teste
  registerSystemUpdate(
    '1.1.1',
    'Validação de Datas e Dados de Teste',
    'Implementação de validação obrigatória de datas em todos os formulários e criação do gerenciador completo de dados de teste.',
    'feature',
    'general',
    [
      { description: 'Validação de datas obrigatórias em todos os formulários', icon: 'Calendar' },
      { description: 'Gerenciador de dados de teste com interface completa', icon: 'Database' },
      { description: 'Criação automática de vendedores, corretores e frigoríficos', icon: 'Users' },
      { description: 'Geração de 5 ordens de compra com status variados', icon: 'ShoppingCart' },
      { description: 'Botão de limpar todos os dados de teste', icon: 'Trash' },
      { description: 'Indicadores visuais de dados de teste criados', icon: 'CheckCircle' }
    ],
    true
  );
  
  // v1.1.2 - Sistema de Atualizações Integrado
  registerSystemUpdate(
    '1.1.2',
    'Sistema de Atualizações Integrado',
    'Sistema completo para registrar e exibir todas as atualizações do sistema de forma automática e organizada.',
    'feature',
    'general',
    [
      { description: 'Registro automático de mudanças relevantes', icon: 'FileText' },
      { description: 'Interface completa de visualização de atualizações', icon: 'Layout' },
      { description: 'Modal de detalhes para cada atualização', icon: 'Info' },
      { description: 'Sistema de feedback por atualização', icon: 'MessageCircle' },
      { description: 'Filtros por tipo e categoria', icon: 'Filter' },
      { description: 'Busca textual em todas as atualizações', icon: 'Search' },
      { description: 'Indicador de novas atualizações não visualizadas', icon: 'Bell' },
      { description: 'Agrupamento de atualizações por mês', icon: 'Calendar' }
    ],
    true
  );
};

// Função para registrar mudanças em tempo real
export const trackSystemChange = (
  description: string,
  category: SystemUpdate['category'],
  type: SystemUpdate['type'] = 'improvement'
) => {
  // Esta função pode ser usada para rastrear mudanças automaticamente
  // Por enquanto, apenas registra no console

  // TODO: Implementar registro automático de mudanças menores
  // que serão agrupadas em uma próxima versão
}; 
