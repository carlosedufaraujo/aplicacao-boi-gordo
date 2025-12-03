/**
 * Configuração de Domínio/Organização
 * Permite personalizar a aplicação por domínio específico
 */

export interface DomainConfig {
  domain: string;
  organizationName: string;
  organizationSubtitle?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundImage?: string;
  supportEmail?: string;
  supportPhone?: string;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    tagline?: string;
  };
}

/**
 * Configurações padrão por domínio
 */
const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  'bovsync.acexcapital.com': {
    domain: 'bovsync.acexcapital.com',
    organizationName: 'BovSync',
    organizationSubtitle: 'Sistema de Gestão Completa para Pecuária de Corte',
    logo: '/fazenda-ceac.jpg',
    backgroundImage: '/fazenda-ceac.jpg',
    supportEmail: 'suporte@acexcapital.com',
    supportPhone: '',
    customBranding: {
      companyName: 'Acex Capital',
      tagline: 'Controle total do seu rebanho, desde a compra até a venda',
    },
  },
  'aplicacao-boi-gordo.pages.dev': {
    domain: 'aplicacao-boi-gordo.pages.dev',
    organizationName: 'CEAC Agropecuária',
    organizationSubtitle: 'Sistema de Gestão Completa para Pecuária de Corte',
    logo: '/fazenda-ceac.jpg',
    backgroundImage: '/fazenda-ceac.jpg',
    supportEmail: 'contato@ceac.com.br',
    supportPhone: '(65) 3544-1000',
    customBranding: {
      companyName: 'CEAC Agropecuária e Mercantil Ltda',
      tagline: 'Controle total do seu rebanho, desde a compra até a venda',
    },
  },
  'localhost': {
    domain: 'localhost',
    organizationName: 'CEAC Agropecuária',
    organizationSubtitle: 'Sistema de Gestão Completa para Pecuária de Corte',
    logo: '/fazenda-ceac.jpg',
    backgroundImage: '/fazenda-ceac.jpg',
    supportEmail: 'contato@ceac.com.br',
    supportPhone: '(65) 3544-1000',
    customBranding: {
      companyName: 'CEAC Agropecuária e Mercantil Ltda',
      tagline: 'Controle total do seu rebanho, desde a compra até a venda',
    },
  },
  // Adicione mais domínios aqui conforme necessário
};

/**
 * Obter configuração do domínio atual
 */
export function getDomainConfig(): DomainConfig {
  const currentDomain = typeof window !== 'undefined' 
    ? window.location.hostname 
    : 'localhost';

  // Remover porta se existir
  const domainWithoutPort = currentDomain.split(':')[0];

  // Buscar configuração específica ou usar padrão
  const config = DOMAIN_CONFIGS[domainWithoutPort] || DOMAIN_CONFIGS[domainWithoutPort.split('.')[0]] || {
    domain: domainWithoutPort,
    organizationName: 'Sistema de Gestão',
    organizationSubtitle: 'Plataforma de Gestão Empresarial',
    logo: '/fazenda-ceac.jpg',
    backgroundImage: '/fazenda-ceac.jpg',
    customBranding: {
      companyName: 'Sua Empresa',
      tagline: 'Gestão completa e eficiente',
    },
  };

  return {
    ...config,
    domain: domainWithoutPort,
  };
}

/**
 * Obter nome da organização do domínio atual
 */
export function getOrganizationName(): string {
  return getDomainConfig().organizationName;
}

/**
 * Obter logo do domínio atual
 */
export function getOrganizationLogo(): string | undefined {
  return getDomainConfig().logo;
}

/**
 * Obter imagem de fundo do domínio atual
 */
export function getBackgroundImage(): string | undefined {
  return getDomainConfig().backgroundImage;
}

/**
 * Verificar se é um domínio específico
 */
export function isDomain(domain: string): boolean {
  const currentDomain = typeof window !== 'undefined' 
    ? window.location.hostname.split(':')[0]
    : 'localhost';
  
  return currentDomain === domain || currentDomain.endsWith(`.${domain}`);
}

/**
 * Obter configuração customizada de branding
 */
export function getCustomBranding() {
  return getDomainConfig().customBranding || {};
}

