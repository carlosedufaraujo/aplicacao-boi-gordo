# 🔐 Guia Completo para Configurar Secrets no GitHub Actions

## 📋 Passo a Passo

### 1. Acesse as Configurações do Repositório
1. Abra: https://github.com/carlosedufaraujo/aplicacao-boi-gordo
2. Clique em **"Settings"** (Configurações)
3. No menu lateral esquerdo, clique em **"Secrets and variables"**
4. Clique em **"Actions"**

### 2. Adicione os Secrets
Clique em **"New repository secret"** para cada secret abaixo e cole exatamente os valores:

## 🔑 Lista Completa de Secrets com Valores

### Secrets Obrigatórios para Build/Deploy:

#### 1. **SUPABASE_URL**
```
https://vffxtvuqhlhcbbyqmynz.supabase.co
```

#### 2. **SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI
```

#### 3. **SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8
```

#### 4. **DATABASE_URL**
```
postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### 5. **JWT_SECRET**
```
your-super-secret-jwt-key-here-change-in-production
```

### Secrets para CI/CD:

#### 6. **VITE_API_URL**
```
http://localhost:3001/api/v1
```

#### 7. **VITE_BACKEND_URL**
```
http://localhost:3001
```

#### 8. **VITE_SUPABASE_URL**
```
https://vffxtvuqhlhcbbyqmynz.supabase.co
```

#### 9. **VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI
```

#### 10. **VITE_SUPABASE_SERVICE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNDYwNywiZXhwIjoyMDcxMjkwNjA3fQ.8U_SEhK7xB33ABE3KYdVhGsMzuF9fqIGTGfew_KPKb8
```

### Secrets Opcionais (podem ser deixados vazios se não usar):

#### 11. **CODECOV_TOKEN**
- Deixe vazio ou obtenha em https://codecov.io

#### 12. **VERCEL_TOKEN**
- Deixe vazio ou obtenha em https://vercel.com/account/tokens

#### 13. **VERCEL_ORG_ID**
- Deixe vazio ou obtenha nas configurações do Vercel

#### 14. **VERCEL_PROJECT_ID**
- Deixe vazio ou obtenha nas configurações do projeto Vercel

#### 15. **SLACK_WEBHOOK**
- Deixe vazio ou configure webhook do Slack

## ✅ Como Verificar se Funcionou

1. Após adicionar todos os secrets, vá para a aba **"Actions"** no GitHub
2. Clique em **"Run workflow"** em qualquer workflow
3. Se tudo estiver configurado corretamente, o workflow executará sem erros

## 🚨 Importante

- **NUNCA** compartilhe esses secrets publicamente
- Os valores acima são específicos para seu projeto
- Se precisar gerar novos valores no futuro, atualize tanto no GitHub quanto localmente

## 📝 Checklist

- [ ] SUPABASE_URL adicionado
- [ ] SUPABASE_ANON_KEY adicionado
- [ ] SUPABASE_SERVICE_ROLE_KEY adicionado
- [ ] DATABASE_URL adicionado
- [ ] JWT_SECRET adicionado
- [ ] VITE_API_URL adicionado
- [ ] VITE_BACKEND_URL adicionado
- [ ] VITE_SUPABASE_URL adicionado
- [ ] VITE_SUPABASE_ANON_KEY adicionado
- [ ] VITE_SUPABASE_SERVICE_KEY adicionado

## 🎉 Pronto!

Após adicionar todos os secrets, seus workflows do GitHub Actions funcionarão corretamente e os warnings no VS Code desaparecerão.