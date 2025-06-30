# Backend - Sistema de Gestão de Confinamento Bovino

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Joi** - Validação
- **Winston** - Logs

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório e entre na pasta do backend
```bash
cd backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados

#### Opção A: PostgreSQL Local
Instale o PostgreSQL localmente e crie um banco de dados:
```sql
CREATE DATABASE boi_gordo_db;
```

#### Opção B: Docker
```bash
docker run --name postgres-boi-gordo \
  -e POSTGRES_DB=boi_gordo_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boi_gordo_db?schema=public"
JWT_SECRET=seu-secret-super-seguro-aqui
```

### 5. Execute as migrations
```bash
npx prisma migrate dev
```

### 6. Execute o seed (dados iniciais)
```bash
npm run prisma:seed
```

Isso criará:
- Usuário admin: `admin@ceac.com.br` / senha: `admin123`
- 10 currais de exemplo
- Contas pagadoras
- Parceiros de exemplo
- Centros de custo

### 7. Inicie o servidor
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3333`

## 📚 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Inicia o servidor em produção
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa as migrations
- `npm run prisma:studio` - Abre o Prisma Studio (GUI para o banco)
- `npm run prisma:seed` - Popula o banco com dados iniciais
- `npm test` - Executa os testes
- `npm run lint` - Verifica o código

## 🔑 Autenticação

A API usa JWT para autenticação. Para acessar rotas protegidas:

1. Faça login em `POST /api/v1/auth/login`
2. Use o token retornado no header: `Authorization: Bearer SEU_TOKEN`

## 📡 Endpoints Principais

### Autenticação
- `POST /api/v1/auth/register` - Registrar novo usuário
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Dados do usuário autenticado
- `POST /api/v1/auth/change-password` - Alterar senha

### Recursos (em desenvolvimento)
- `/api/v1/purchase-orders` - Ordens de compra
- `/api/v1/lots` - Lotes de gado
- `/api/v1/pens` - Currais
- `/api/v1/expenses` - Despesas
- `/api/v1/revenues` - Receitas
- `/api/v1/sales` - Vendas
- `/api/v1/reports` - Relatórios

## 🛠️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/         # Configurações (banco, logger, env)
│   ├── controllers/    # Controllers das rotas
│   ├── services/       # Lógica de negócio
│   ├── repositories/   # Acesso ao banco
│   ├── middlewares/    # Middlewares (auth, validação, etc)
│   ├── routes/         # Definição das rotas
│   ├── validations/    # Schemas de validação
│   ├── utils/          # Utilitários
│   ├── types/          # Tipos TypeScript
│   └── database/       # Migrations e seeds
├── prisma/
│   └── schema.prisma   # Schema do banco
├── tests/              # Testes
└── logs/               # Arquivos de log
```

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Autenticação JWT
- Rate limiting
- Helmet para headers de segurança
- Validação de entrada com Joi
- CORS configurado

## 🐛 Troubleshooting

### Erro de conexão com o banco
Verifique se o PostgreSQL está rodando e as credenciais no `.env` estão corretas.

### Erro ao executar migrations
Certifique-se que o banco de dados existe e está acessível.

### Porta já em uso
Mude a porta no `.env` ou encerre o processo usando a porta 3333.

## 📝 Licença

Propriedade de CEAC Agropecuária e Mercantil Ltda. 