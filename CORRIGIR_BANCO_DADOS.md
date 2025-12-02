# 🔧 Corrigir Conexão com Banco de Dados

## ❌ Problema Identificado

O Pages Functions estava muito básico e não conectava ao banco de dados real. Agora foi atualizado para conectar ao Supabase.

## ✅ Solução Aplicada

Atualizei o arquivo `functions/api/[[path]].ts` para:
- ✅ Conectar ao Supabase REST API
- ✅ Fazer proxy de todas as rotas para o Supabase
- ✅ Implementar autenticação via Supabase Auth
- ✅ Mapear rotas da API para tabelas do Supabase

## 📋 Variáveis de Ambiente Necessárias

Você precisa adicionar estas variáveis no Cloudflare Pages:

### 1. SUPABASE_URL (já tem como VITE_SUPABASE_URL)
```
Nome: SUPABASE_URL
Valor: https://vffxtvuqhlhcbbyqmynz.supabase.co
Environment: Production ✅
```

### 2. SUPABASE_SERVICE_KEY (IMPORTANTE - Nova!)
```
Nome: SUPABASE_SERVICE_KEY
Valor: [Sua Service Key do Supabase]
Environment: Production ✅
```

**⚠️ IMPORTANTE:** A Service Key é diferente da Anon Key!

### Como obter a Service Key:
1. Acesse: https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/settings/api
2. Role até "Project API keys"
3. Copie a **"service_role"** key (não a anon key!)
4. Esta key tem permissões completas para ler/escrever no banco

### 3. DATABASE_URL (Opcional, mas recomendado)
```
Nome: DATABASE_URL
Valor: postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
Environment: Production ✅
```

## 🔄 Próximos Passos

1. **Adicionar SUPABASE_SERVICE_KEY no Cloudflare:**
   - Dashboard → Pages → aplicacao-boi-gordo
   - Settings → Environment variables
   - Add variable: `SUPABASE_SERVICE_KEY`
   - Valor: Sua service key do Supabase
   - ✅ Production

2. **Adicionar SUPABASE_URL (se ainda não tem):**
   - Mesmo lugar
   - Nome: `SUPABASE_URL`
   - Valor: `https://vffxtvuqhlhcbbyqmynz.supabase.co`
   - ✅ Production

3. **Fazer novo deploy:**
   - Vá em Deployments
   - Clique nos 3 pontos do último deployment
   - **Retry deployment**

   OU faça push de novo:
   ```bash
   git add functions/api/[[path]].ts
   git commit -m "Atualizar Pages Functions para conectar ao Supabase"
   git push
   ```

## ✅ Verificar se Funcionou

Após o deploy, teste:

1. Acesse: `https://aplicacao-boi-gordo.pages.dev`
2. Abra o Console do navegador (F12)
3. Tente fazer login
4. Veja se os dados carregam

Se ainda não funcionar, verifique:
- ✅ Se SUPABASE_SERVICE_KEY foi adicionada
- ✅ Se o deploy foi feito novamente
- ✅ Logs no Cloudflare Dashboard → Pages → Functions → Logs

## 🐛 Troubleshooting

### Erro: "Missing API key"
- Verifique se SUPABASE_SERVICE_KEY está configurada
- Certifique-se de que é a **service_role** key, não a anon key

### Erro: "Table not found"
- Verifique se a tabela existe no Supabase
- Verifique o mapeamento de rotas no código

### Erro: "CORS"
- Verifique se os headers CORS estão configurados (já estão no código)

---

**Depois de adicionar a SUPABASE_SERVICE_KEY e fazer novo deploy, me avise se funcionou!** 🚀

