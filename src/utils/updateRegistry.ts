import { registerSystemUpdate } from './systemUpdates';

// Registro de atualizações recentes do sistema
export const registerRecentUpdates = () => {
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

// Função para registrar mudanças futuras
export const registerFutureUpdate = (
  version: string,
  title: string,
  _description: string,
  _changes: string[]
) => {
  // Esta função pode ser chamada quando novas funcionalidades forem implementadas
  
  // Quando a atualização estiver pronta, chamar:
  // registerSystemUpdate(version, title, description, 'feature', 'general', 
  //   changes.map(c => ({ description: c }))
  // );
}; 
