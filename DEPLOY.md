# 📦 Guia de Deploy - Aplicação Boi Gordo

## 🚀 Deploy no Vercel

Este projeto está configurado para deploy no Vercel com arquitetura separada:
- **Frontend**: aplicacao-boi-gordo.vercel.app
- **Backend**: aplicacao-boi-gordo-backend.vercel.app

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Vercel CLI instalado: `npm i -g vercel`
3. Banco de dados PostgreSQL (Supabase ou outro)
4. Variáveis de ambiente configuradas

## 🔧 Configuração Inicial

### 1. Frontend

#### Variáveis de Ambiente (Vercel Dashboard)
```env
VITE_API_URL=https://aplicacao-boi-gordo-backend.vercel.app/api/v1
VITE_SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
VITE_SUPABASE_ANON_KEY=seu_supabase_anon_key
VITE_APP_ENV=production
```

#### Deploy
```bash
# Na raiz do projeto
vercel --prod
```

### 2. Backend

#### Variáveis de Ambiente (Vercel Dashboard)
```env
DATABASE_URL=postgresql://seu_banco_de_dados
JWT_SECRET=seu_jwt_secret_seguro_min_32_chars
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://vffxtvuqhlhcbbyqmynz.supabase.co
SUPABASE_SERVICE_KEY=seu_supabase_service_key
FRONTEND_URL=https://aplicacao-boi-gordo.vercel.app
NODE_ENV=production
PORT=3001
```

#### Deploy
```bash
# Na pasta backend
cd backend
vercel --prod
```

## 🏗️ Estrutura do `vercel.json`

### Frontend (`/vercel.json`)
- **Build**: Vite com React
- **Rotas**: SPA com fallback para index.html
- **API Proxy**: Redireciona /api/v1/* para o backend
- **Headers**: CORS, segurança e cache configurados
- **Região**: GRU1 (São Paulo)

### Backend (`/backend/vercel.json`)
- **Build**: Node.js com TypeScript
- **Rotas**: API REST com endpoints específicos
- **Functions**: Serverless com 30s timeout
- **Headers**: CORS e rate limiting
- **Crons**: Tarefas agendadas (relatórios, limpeza)

## 🔒 Segurança

### Headers de Segurança Configurados
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `X-XSS-Protection`: 1; mode=block
- `Strict-Transport-Security`: HTTPS forçado
- `Content-Security-Policy`: Políticas de conteúdo

### CORS
- Origins permitidas configuradas
- Credenciais habilitadas
- Métodos HTTP específicos

## 📊 Monitoramento

### Vercel Analytics
- Performance metrics
- Web Vitals
- Error tracking

### Logs
```bash
# Ver logs do frontend
vercel logs aplicacao-boi-gordo.vercel.app

# Ver logs do backend
vercel logs aplicacao-boi-gordo-backend.vercel.app
```

## 🔄 CI/CD

### GitHub Actions (Opcional)
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Erro: "Token não fornecido"
- Verificar variável `VITE_API_URL` no frontend
- Confirmar que o backend está rodando
- Validar JWT_SECRET no backend

### Erro: CORS
- Verificar `FRONTEND_URL` no backend
- Confirmar headers no vercel.json

### Build falhou
```bash
# Limpar cache e rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database connection
- Verificar `DATABASE_URL` format
- Confirmar SSL settings
- Testar conexão local

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build local funcionando (`npm run build`)
- [ ] Testes passando
- [ ] Banco de dados acessível
- [ ] CORS configurado
- [ ] SSL/HTTPS ativo
- [ ] DNS configurado (se domínio customizado)
- [ ] Monitoramento ativo

## 🆘 Suporte

### Comandos Úteis
```bash
# Status do deploy
vercel ls

# Rollback
vercel rollback

# Variáveis de ambiente
vercel env ls

# Domínios
vercel domains ls
```

### Links Importantes
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Documentação Vercel](https://vercel.com/docs)
- [Status Page](https://www.vercel-status.com/)

## 📌 Notas Importantes

1. **Região**: Projeto configurado para GRU1 (São Paulo) para menor latência
2. **Limites**: Free tier tem limites de bandwidth e execução
3. **Secrets**: NUNCA commitar credenciais no código
4. **Cache**: Assets estáticos com cache longo (1 ano)
5. **Backup**: Sempre fazer backup do banco antes de deploy

---

*Última atualização: Dezembro 2024*