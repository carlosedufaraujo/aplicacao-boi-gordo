/**
 * Arquivo de exportação centralizado para todos os componentes modernizados
 * usando shadcn/ui
 * 
 * Para usar os componentes modernos, importe deste arquivo:
 * import { ModernPipeline, ModernLots, ... } from '@/components/ModernComponents';
 */

// Compras - Modernizado
// export { ModernPurchases } from './Purchases/ModernPurchases';

// Vendas - A ser criado
// export { ModernSales } from './Sales/ModernSales';

// Gestão de Lotes - A ser criado
// export { ModernLots } from './Lots/ModernLots';

// Centro Financeiro - A ser criado
// export { ModernFinancialCenter } from './Financial/ModernFinancialCenter';

// DRE - A ser criado
// export { ModernDRE } from './DRE/ModernDRE';

// Calendário - A ser criado
// export { ModernCalendar } from './Calendar/ModernCalendar';

// Conciliação Financeira - A ser criado
// export { ModernReconciliation } from './Financial/ModernReconciliation';

// Cadastros - A ser criado
// export { ModernRegistrations } from './Registrations/ModernRegistrations';

// Configurações de Perfil - A ser criado
// export { ModernProfile } from './Profile/ModernProfile';

// Configurações Gerais - A ser criado
// export { ModernSettings } from './Settings/ModernSettings';

/**
 * Para ativar os componentes modernos:
 * 
 * 1. Em App.tsx, substitua as importações antigas pelos componentes modernos:
 *    
 *    // Antes:
 *    import { Pipeline } from './components/Pipeline/Pipeline';
 *    
 *    // Depois:
 *    import { ModernPipeline as Pipeline } from './components/ModernComponents';
 * 
 * 2. Ou use diretamente com aliasing:
 *    
 *    const Pipeline = lazy(() => 
 *      import('@/components/ModernComponents').then(module => ({ 
 *        default: module.ModernPipeline 
 *      }))
 *    );
 * 
 * 3. Os componentes modernos mantêm compatibilidade com:
 *    - useAppStore para estado global
 *    - Hooks de dados do Supabase
 *    - Sistema de roteamento existente
 *    - Formulários e modais existentes
 */

// Configuração de tema para os componentes modernos
export const modernTheme = {
  colors: {
    primary: 'hsl(142, 76%, 36%)', // Verde principal
    secondary: 'hsl(221, 83%, 53%)', // Azul secundário
    danger: 'hsl(0, 84%, 60%)', // Vermelho para alertas
    warning: 'hsl(38, 92%, 50%)', // Amarelo para avisos
    success: 'hsl(142, 76%, 36%)', // Verde para sucesso
    muted: 'hsl(210, 40%, 96%)', // Cinza claro
  },
  
  animations: {
    duration: '200ms',
    easing: 'ease-in-out',
  },
  
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
};

// Helper para aplicar classes condicionais nos componentes modernos
export const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(' ');
};