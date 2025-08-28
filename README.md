# 🐮 BoviControl - Sistema de Gestão Pecuária

![CI](https://github.com/seu-usuario/bovicontrol/workflows/CI/badge.svg)
![Deploy](https://github.com/seu-usuario/bovicontrol/workflows/Deploy/badge.svg)

Sistema completo de gestão para fazendas de gado, desenvolvido com React, TypeScript e Supabase.

## 🚀 Características

### 📊 Dashboard Inteligente
- KPIs em tempo real
- Gráficos interativos de receita vs custos
- Valor do rebanho atualizado
- Atividades recentes

### 🐄 Gestão de Lotes
- Controle completo de lotes de gado
- Rastreamento de peso e saúde
- Alocação em currais
- Histórico de movimentações

### 💰 Centro Financeiro
- Controle de receitas e despesas
- Conciliação bancária automatizada
- DRE (Demonstração de Resultados)
- Orçamento e metas

### 🛒 Pipeline de Vendas
- Kanban visual de negociações
- Acompanhamento de entregas
- Controle de pagamentos
- Analytics de vendas

### 📅 Calendário
- Agendamento de vacinações
- Controle de transporte
- Eventos e lembretes
- Integração com todas as áreas

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **shadcn/ui** para componentes
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **React Router v6** para roteamento
- **Recharts** para visualização de dados

### Backend & Infraestrutura
- **Supabase** para autenticação e database
- **PostgreSQL** como banco de dados
- **Prisma ORM** para modelagem
- **Node.js + Express** para API

### Qualidade & Testes
- **Vitest** para testes unitários
- **Testing Library** para testes de componentes
- **TypeScript** strict mode
- **ESLint** para linting
- **GitHub Actions** para CI/CD

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/bovicontrol.git
cd bovicontrol
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_SUPABASE_SERVICE_KEY=sua_service_key
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes com UI
npm run test:ui
```

## 🏗️ Build & Deploy

### Build de Produção
```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

### Deploy

#### Vercel (Recomendado)
```bash
npx vercel --prod
```

#### Netlify
```bash
npx netlify deploy --prod --dir=dist
```

#### Docker
```bash
docker build -t boi-gordo .
docker run -p 3000:3000 boi-gordo
```

## 📚 Documentação

### Estrutura do Projeto
```
src/
├── components/       # Componentes React
│   ├── Dashboard/   # Dashboard e KPIs
│   ├── Financial/   # Centro financeiro
│   ├── Lots/        # Gestão de lotes
│   └── ui/          # Componentes shadcn/ui
├── hooks/           # Custom hooks
├── services/        # Serviços e APIs
├── stores/          # Estado global (Zustand)
├── utils/           # Utilitários
└── test/            # Configuração de testes
```

### Componentes Principais

#### Dashboard
- `ShadcnDashboard`: Dashboard principal com KPIs
- `ModernDashboard`: Versão alternativa moderna

#### Gestão de Lotes
- `ModernLots`: Interface completa de lotes
- Cards, tabelas e analytics

#### Centro Financeiro
- `ModernFinancialCenter`: Gestão financeira
- `ModernFinancialReconciliation`: Conciliação
- `ModernDRE`: Demonstração de resultados

#### Pipeline de Vendas
- `ModernSalesPipeline`: Kanban de vendas
- Acompanhamento completo do processo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Scripts Disponíveis

```json
{
  "dev": "Inicia servidor de desenvolvimento",
  "build": "Build de produção",
  "preview": "Preview do build",
  "test": "Executa testes",
  "test:ui": "Testes com interface",
  "test:coverage": "Testes com cobertura",
  "lint": "Verifica código com ESLint"
}
```

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no PostgreSQL
- Tokens JWT seguros
- Sanitização de inputs
- Proteção contra XSS e CSRF

## 📊 Performance

- Lazy loading de componentes
- Code splitting automático
- Otimização de imagens
- Caching inteligente
- Bundle size < 200KB gzipped

## 🆘 Suporte

- [Documentação](https://docs.exemplo.com)
- [Issues](https://github.com/seu-usuario/bovicontrol/issues)
- [Discussões](https://github.com/seu-usuario/bovicontrol/discussions)
- Email: suporte@bovicontrol.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 👥 Time

- **Carlos Eduardo** - Desenvolvedor Principal
- **Equipe Boi Gordo** - Design e Requisitos

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com) pelos componentes
- [Supabase](https://supabase.com) pela infraestrutura
- [Vercel](https://vercel.com) pelo hosting
- Comunidade React e TypeScript

---

Desenvolvido com ❤️ para revolucionar a gestão pecuária 🐮