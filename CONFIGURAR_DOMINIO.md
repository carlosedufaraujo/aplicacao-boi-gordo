# 🌐 Configuração de Domínio Personalizado

## 📋 Visão Geral

A aplicação agora suporta personalização por domínio específico. Cada domínio pode ter:
- Nome da organização personalizado
- Logo e imagem de fundo
- Informações de contato
- Branding customizado

## 🎨 Como Personalizar um Domínio

### 1. Editar Configuração de Domínio

Edite o arquivo `src/utils/domainConfig.ts` e adicione ou modifique a configuração do seu domínio:

```typescript
const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  'seu-dominio.com': {
    domain: 'seu-dominio.com',
    organizationName: 'Nome da Sua Empresa',
    organizationSubtitle: 'Descrição da sua empresa',
    logo: '/logo-customizado.png',
    backgroundImage: '/imagem-fundo.jpg',
    supportEmail: 'suporte@suaempresa.com',
    supportPhone: '(00) 0000-0000',
    customBranding: {
      companyName: 'Sua Empresa Ltda',
      tagline: 'Sua tagline personalizada',
    },
  },
};
```

### 2. Estrutura de Configuração

```typescript
interface DomainConfig {
  domain: string;                    // Domínio (ex: 'seu-dominio.com')
  organizationName: string;           // Nome exibido no login
  organizationSubtitle?: string;      // Subtítulo/descrição
  logo?: string;                      // Caminho do logo (ex: '/logo.png')
  favicon?: string;                   // Caminho do favicon
  primaryColor?: string;              // Cor primária (futuro)
  secondaryColor?: string;            // Cor secundária (futuro)
  backgroundImage?: string;          // Imagem de fundo do login
  supportEmail?: string;              // Email de suporte
  supportPhone?: string;              // Telefone de suporte
  customBranding?: {
    logoUrl?: string;                 // URL do logo
    companyName?: string;              // Nome completo da empresa
    tagline?: string;                  // Tagline/slogan
  };
}
```

### 3. Detecção Automática

A aplicação detecta automaticamente o domínio atual através de:
- `window.location.hostname` (sem porta)
- Busca a configuração correspondente em `DOMAIN_CONFIGS`
- Usa configuração padrão se não encontrar

### 4. Exemplo de Configuração Completa

```typescript
'meu-dominio.com.br': {
  domain: 'meu-dominio.com.br',
  organizationName: 'Minha Empresa Agro',
  organizationSubtitle: 'Gestão Inteligente para Pecuária',
  logo: '/logos/minha-empresa-logo.png',
  backgroundImage: '/images/fazenda-background.jpg',
  supportEmail: 'suporte@minhaempresa.com.br',
  supportPhone: '(11) 99999-9999',
  customBranding: {
    companyName: 'Minha Empresa Agropecuária Ltda',
    tagline: 'Soluções inteligentes para o campo',
    logoUrl: 'https://cdn.exemplo.com/logo.png',
  },
},
```

## 🔧 Funcionalidades Implementadas

### ✅ Detecção Automática de Domínio
- Detecta o domínio atual da URL
- Carrega configuração correspondente
- Fallback para configuração padrão

### ✅ Personalização Visual
- Logo personalizado por domínio
- Imagem de fundo customizada
- Nome da organização dinâmico
- Tagline personalizado

### ✅ Informações de Contato
- Email de suporte por domínio
- Telefone de suporte por domínio
- Exibição no footer da página de login

### ✅ Campo de Domínio no Login
- Campo exibido automaticamente
- Mostra o domínio detectado
- Read-only (não editável pelo usuário)

## 📝 Domínios Configurados Atualmente

1. **aplicacao-boi-gordo.pages.dev**
   - Organização: CEAC Agropecuária
   - Logo: `/fazenda-ceac.jpg`
   - Suporte: contato@ceac.com.br

2. **localhost** (desenvolvimento)
   - Organização: CEAC Agropecuária
   - Logo: `/fazenda-ceac.jpg`
   - Suporte: contato@ceac.com.br

## 🚀 Como Adicionar Novo Domínio

1. **Adicione a configuração** em `src/utils/domainConfig.ts`:

```typescript
'novo-dominio.com': {
  domain: 'novo-dominio.com',
  organizationName: 'Nova Empresa',
  // ... outras configurações
},
```

2. **Adicione os assets** (logo, imagens) na pasta `public/`

3. **Teste localmente** usando o domínio no `hosts` file:
   ```
   127.0.0.1 novo-dominio.com
   ```

4. **Configure DNS** para apontar para seu servidor

## 🎯 Uso no Código

```typescript
import { 
  getDomainConfig, 
  getOrganizationName, 
  getOrganizationLogo 
} from '@/utils/domainConfig';

// Obter configuração completa
const config = getDomainConfig();

// Obter apenas o nome
const name = getOrganizationName();

// Obter logo
const logo = getOrganizationLogo();
```

## 📌 Notas Importantes

- O domínio é detectado automaticamente na inicialização
- A configuração é carregada uma vez por sessão
- Se o domínio não estiver configurado, usa valores padrão
- O campo de domínio no login é apenas informativo (read-only)

## 🔄 Próximas Melhorias

- [ ] Suporte a cores personalizadas por domínio
- [ ] Configuração via API/banco de dados
- [ ] Múltiplos idiomas por domínio
- [ ] Temas personalizados por organização

