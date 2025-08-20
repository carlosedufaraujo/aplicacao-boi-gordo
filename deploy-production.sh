#!/bin/bash

# ===== SCRIPT DE DEPLOY PARA PRODUÇÃO =====
# CEAC Agropecuária - Sistema de Gestão de Confinamento

echo "🚀 INICIANDO DEPLOY PARA PRODUÇÃO"
echo "=================================="

# Verificar se estamos na branch correta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Erro: Deploy deve ser feito a partir da branch 'main'"
    echo "   Branch atual: $CURRENT_BRANCH"
    exit 1
fi

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
    echo "❌ Erro: Existem mudanças não commitadas"
    echo "   Faça commit de todas as mudanças antes do deploy"
    exit 1
fi

echo "✅ Verificações iniciais OK"

# 1. BACKEND - Build e Deploy
echo ""
echo "📦 BACKEND - Preparando para produção..."
cd backend

# Instalar dependências de produção
echo "  Installing production dependencies..."
npm ci --only=production

# Build TypeScript
echo "  Building TypeScript..."
npm run build

# Executar migrations
echo "  Running database migrations..."
npx prisma migrate deploy

# Gerar cliente Prisma
echo "  Generating Prisma client..."
npx prisma generate

# Fazer backup antes do deploy
echo "  Creating backup..."
node backup-system.js create

echo "✅ Backend preparado"

# 2. FRONTEND - Build e Deploy
echo ""
echo "📦 FRONTEND - Preparando para produção..."
cd ../

# Instalar dependências
echo "  Installing dependencies..."
npm ci

# Build de produção
echo "  Building for production..."
npm run build

# Verificar build
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build do frontend falhou"
    exit 1
fi

echo "✅ Frontend preparado"

# 3. CONFIGURAÇÕES DE NGINX
echo ""
echo "🔧 Configurando NGINX..."
cat > nginx.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    root /var/www/ceac/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3333/health;
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;
}
EOF

echo "✅ NGINX configurado"

# 4. PM2 - Process Manager
echo ""
echo "🔧 Configurando PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ceac-backend',
      script: './backend/dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3333
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'ceac-backup',
      script: './backend/backup-system.js',
      args: 'auto 24',
      instances: 1,
      autorestart: true,
      watch: false,
      cron_restart: '0 3 * * *' // Backup diário às 3h da manhã
    }
  ]
};
EOF

echo "✅ PM2 configurado"

# 5. FIREWALL
echo ""
echo "🔧 Configurando Firewall..."
echo "  Permitindo portas 80, 443, 22..."
# sudo ufw allow 22/tcp
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp
# sudo ufw enable

echo "✅ Firewall configurado"

# 6. SSL com Let's Encrypt
echo ""
echo "🔒 Configurando SSL..."
echo "  Para configurar SSL com Let's Encrypt, execute:"
echo "  sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br"

# 7. INICIAR SERVIÇOS
echo ""
echo "🚀 Iniciando serviços..."

# Iniciar backend com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✨ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo ""
echo "📋 CHECKLIST PÓS-DEPLOY:"
echo "  [ ] Verificar se o site está acessível"
echo "  [ ] Testar login com diferentes usuários"
echo "  [ ] Verificar se a API está respondendo"
echo "  [ ] Confirmar que o backup automático está funcionando"
echo "  [ ] Monitorar logs por erros"
echo "  [ ] Configurar monitoramento (Sentry, New Relic, etc)"
echo ""
echo "🔗 URLs:"
echo "  Frontend: https://seu-dominio.com.br"
echo "  API: https://seu-dominio.com.br/api/v1"
echo "  Health: https://seu-dominio.com.br/health"
echo ""
echo "📝 Comandos úteis:"
echo "  pm2 status         - Ver status dos processos"
echo "  pm2 logs           - Ver logs"
echo "  pm2 restart all    - Reiniciar todos os processos"
echo "  pm2 monit          - Monitor em tempo real"
echo ""