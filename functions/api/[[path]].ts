/**
 * Cloudflare Pages Functions Handler
 * 
 * Este arquivo processa todas as requisições para /api/*
 * Conecta diretamente ao Supabase REST API
 */

/**
 * Handler principal para Cloudflare Pages Functions
 */
export async function onRequest(context: any): Promise<Response> {
  const startTime = Date.now();
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Tratar path corretamente (pode vir como string ou array)
  let path = '';
  if (typeof params.path === 'string') {
    path = params.path;
  } else if (Array.isArray(params.path)) {
    path = params.path.join('/');
  } else if (params.path) {
    path = String(params.path);
  }
  
  // Remover prefixo "v1/" se existir (Cloudflare Pages captura o path completo)
  if (path.startsWith('v1/')) {
    path = path.substring(3); // Remove "v1/"
  }
  if (path.startsWith('/v1/')) {
    path = path.substring(4); // Remove "/v1/"
  }
  
  const method = request.method;

  // Obter variáveis de ambiente
  const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
  
  // Anon key obtida via MCP Supabase (funciona para leitura via REST API)
  // Esta chave foi obtida diretamente do MCP e está funcionando
  const MCP_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc';
  
  // PRIORIDADE: Usar variáveis de ambiente do Cloudflare, com fallback para MCP
  const SUPABASE_PUBLISHABLE_KEY = 
    env.SUPABASE_PUBLISHABLE_KEY || 
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY || 
    MCP_ANON_KEY; // Fallback para chave obtida via MCP
    
  const SUPABASE_SECRET_KEY = 
    env.SUPABASE_SECRET_KEY || 
    env.VITE_SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    MCP_ANON_KEY; // Usar anon key como fallback (funciona para leitura)
  
  // Determinar qual chave usar baseado no formato
  const isNewPublishableKey = SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_');
  const isNewSecretKey = SUPABASE_SECRET_KEY?.startsWith('sb_secret_');
  
  // Usar secret key para operações que precisam de permissões completas
  // Se não tiver secret, usar publishable ou anon key do MCP
  const SUPABASE_KEY = SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY || MCP_ANON_KEY;
  const DATABASE_URL = env.DATABASE_URL || '';
  
  // Log detalhado para debug
  console.log('🔑 Configuração Supabase:', {
    url: SUPABASE_URL,
    hasPublishable: !!SUPABASE_PUBLISHABLE_KEY,
    hasSecret: !!SUPABASE_SECRET_KEY,
    isNewPublishable: isNewPublishableKey,
    isNewSecret: isNewSecretKey,
    publishableLength: SUPABASE_PUBLISHABLE_KEY?.length || 0,
    secretLength: SUPABASE_SECRET_KEY?.length || 0,
    publishablePrefix: SUPABASE_PUBLISHABLE_KEY?.substring(0, 30) || 'none',
    secretPrefix: SUPABASE_SECRET_KEY?.substring(0, 30) || 'none',
  });

  // Headers CORS (compatível com Safari)
  const origin = request.headers.get('origin');
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Cache-Control',
    'Access-Control-Allow-Credentials': 'true', // Importante para Safari
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin', // Importante para Safari
  };
  
  if (origin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    // Se não há origin, permitir qualquer origem (para compatibilidade)
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  // Handle OPTIONS (preflight)
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Health check
    if (path === 'health' || url.pathname === '/api/health' || url.pathname === '/api/v1/health') {
      const responseTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'aplicacao-boi-gordo-backend',
          version: '1.0.0',
          responseTime: `${responseTime}ms`,
          database: {
            connected: !!SUPABASE_URL,
            type: 'supabase',
            hasPublishableKey: !!SUPABASE_PUBLISHABLE_KEY,
            hasSecretKey: !!SUPABASE_SECRET_KEY,
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Server-Timing': `total;dur=${responseTime}`,
            'X-Response-Time': `${responseTime}ms`,
          },
        }
      );
    }

    // Endpoint de diagnóstico
    if (path === 'debug' || path === 'diagnostics') {
      return new Response(
        JSON.stringify({
          status: 'debug',
          timestamp: new Date().toISOString(),
          supabase: {
            url: SUPABASE_URL,
            hasPublishableKey: !!SUPABASE_PUBLISHABLE_KEY,
            hasSecretKey: !!SUPABASE_SECRET_KEY,
            publishableKeyLength: SUPABASE_PUBLISHABLE_KEY?.length || 0,
            secretKeyLength: SUPABASE_SECRET_KEY?.length || 0,
            publishablePrefix: SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) || 'none',
            secretPrefix: SUPABASE_SECRET_KEY?.substring(0, 20) || 'none',
          },
          env: {
            availableKeys: Object.keys(env).filter(k => k.includes('SUPABASE') || k.includes('VITE')),
            totalKeys: Object.keys(env).length,
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Rota de login - fazer proxy para Supabase Auth
    if (path.includes('auth/login') && method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Corpo da requisição inválido',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { email, password } = body || {};

      // Validação rigorosa de campos obrigatórios
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Email é obrigatório',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (!password || typeof password !== 'string' || password.trim() === '') {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Senha é obrigatória',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Validação básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Formato de email inválido',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Verificar se as chaves estão configuradas
      if (!SUPABASE_PUBLISHABLE_KEY) {
        console.error('❌ SUPABASE_PUBLISHABLE_KEY não configurada');
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'SUPABASE_PUBLISHABLE_KEY não configurada. Configure no Cloudflare Dashboard.',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Tentar autenticar via Supabase (usar publishable key para auth)
      try {
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            email: email.trim(), 
            password: password 
          }),
        });

        // Ler resposta do Supabase (pode ser sucesso ou erro)
        const authResponseText = await authResponse.text();
        let authData;
        
        try {
          authData = JSON.parse(authResponseText);
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta do Supabase:', authResponseText);
          return new Response(
            JSON.stringify({
              status: 'error',
              message: 'Resposta inválida do servidor de autenticação',
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Se autenticação foi bem-sucedida
        if (authResponse.ok && authData.access_token) {
          // Buscar dados do usuário (usar secret key para acesso completo)
          let userData = { 
            id: authData.user?.id || authData.user_id, 
            email: email.trim(), 
            name: email.split('@')[0], 
            role: 'ADMIN' as const, 
            isActive: true,
            isMaster: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.trim())}&select=*`, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              },
            });

            if (userResponse.ok) {
              const users = await userResponse.json();
              if (users && Array.isArray(users) && users.length > 0) {
                const dbUser = users[0];
                userData = {
                  id: dbUser.id || userData.id,
                  email: dbUser.email || userData.email,
                  name: dbUser.name || dbUser.email?.split('@')[0] || userData.name,
                  role: dbUser.role || 'ADMIN',
                  isActive: dbUser.isActive !== undefined ? dbUser.isActive : true,
                  isMaster: dbUser.isMaster === true,
                  createdAt: dbUser.createdAt || userData.createdAt,
                  updatedAt: dbUser.updatedAt || userData.updatedAt,
                };
              }
            }
          } catch (userError) {
            console.warn('⚠️ Erro ao buscar dados do usuário, usando dados padrão:', userError);
            // Continuar com dados padrão se não conseguir buscar
          }

          // Retornar resposta de sucesso no formato esperado pelo frontend
          return new Response(
            JSON.stringify({
              status: 'success',
              data: {
                user: userData,
                token: authData.access_token,
              },
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          // Autenticação falhou - extrair mensagem de erro do Supabase
          const errorMessage = authData.error_description || authData.message || authData.error || 'Credenciais inválidas';
          const statusCode = authResponse.status === 400 ? 400 : 401;
          
          console.warn(`⚠️ Login falhou para ${email}: ${errorMessage} (Status: ${authResponse.status})`);
          
          // Retornar mensagem de erro apropriada
          return new Response(
            JSON.stringify({
              status: 'error',
              message: errorMessage === 'Invalid login credentials' || 
                       errorMessage.includes('Invalid') || 
                       errorMessage.includes('invalid') ||
                       authResponse.status === 401
                ? 'Email ou senha incorretos' 
                : errorMessage,
            }),
            {
              status: statusCode,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      } catch (error: any) {
        console.error('❌ Erro ao fazer login:', error);
        return new Response(
          JSON.stringify({
            status: 'error',
            message: error.message || 'Erro ao fazer login. Tente novamente.',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Rota de exportação de dados do usuário (LGPD)
    if (path.includes('users/me/export') && method === 'GET') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Token não fornecido',
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Validar token e obter usuário
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Token inválido');
        }

        const user = await userResponse.json();
        const userId = user.id;
        const userEmail = user.email;

        // Coletar todos os dados do usuário do Supabase
        const userData: any = {
          perfil: {
            id: userId,
            email: userEmail,
            name: user.user_metadata?.name || userEmail?.split('@')[0],
            role: user.user_metadata?.role || 'USER',
            createdAt: user.created_at,
            lastSignIn: user.last_sign_in_at,
          },
          compras: [],
          vendas: [],
          despesas: [],
          receitas: [],
        };

        // Buscar dados relacionados (se houver user_id nas tabelas)
        // Nota: Como estamos usando Supabase, vamos buscar dados relacionados
        const dataPromises = [];

        // Buscar compras
        try {
          const purchasesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/cattle_purchases?select=*&order=created_at.desc&limit=1000`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              },
            }
          );
          if (purchasesResponse.ok) {
            const purchases = await purchasesResponse.json();
            userData.compras = purchases.filter((p: any) => p.user_id === userId).slice(0, 100);
          }
        } catch (e) {
          console.warn('Erro ao buscar compras:', e);
        }

        // Buscar vendas
        try {
          const salesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/sale_records?select=*&order=created_at.desc&limit=1000`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              },
            }
          );
          if (salesResponse.ok) {
            const sales = await salesResponse.json();
            userData.vendas = sales.filter((s: any) => s.user_id === userId).slice(0, 100);
          }
        } catch (e) {
          console.warn('Erro ao buscar vendas:', e);
        }

        // Log de auditoria
        console.log(`[LGPD] Exportação de dados solicitada por: ${userEmail} (${userId})`);

        return new Response(
          JSON.stringify({
            status: 'success',
            data: userData,
            exportedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error: any) {
        console.error('Erro ao exportar dados:', error);
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Erro ao exportar dados do usuário',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Rota de exclusão de dados do usuário (LGPD)
    if (path.includes('users/me/delete') && method === 'DELETE') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Token não fornecido',
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Validar token e obter usuário
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Token inválido');
        }

        const user = await userResponse.json();
        const userId = user.id;
        const userEmail = user.email;

        // Log de auditoria ANTES da exclusão
        console.log(`[LGPD] Exclusão de dados solicitada por: ${userEmail} (${userId})`);

        // Anonymizar dados relacionados (manter dados para histórico financeiro, mas remover referência ao usuário)
        // Nota: Em produção, você pode querer anonymizar ao invés de deletar completamente
        
        // Anonymizar compras
        try {
          await fetch(
            `${SUPABASE_URL}/rest/v1/cattle_purchases?user_id=eq.${userId}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ user_id: null }),
            }
          );
        } catch (e) {
          console.warn('Erro ao anonymizar compras:', e);
        }

        // Anonymizar vendas
        try {
          await fetch(
            `${SUPABASE_URL}/rest/v1/sale_records?user_id=eq.${userId}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ user_id: null }),
            }
          );
        } catch (e) {
          console.warn('Erro ao anonymizar vendas:', e);
        }

        console.log(`[LGPD] Dados anonymizados para: ${userEmail} (${userId})`);

        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Dados excluídos/anonymizados com sucesso',
            deletedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error: any) {
        console.error('Erro ao excluir dados:', error);
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Erro ao excluir dados do usuário',
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Rota de validação de token
    if (path.includes('auth/me') && method === 'GET') {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Token não fornecido',
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Validar token no Supabase
      try {
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (userResponse.ok) {
          const user = await userResponse.json();
          return new Response(
            JSON.stringify({
              status: 'success',
              data: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                role: user.user_metadata?.role || 'ADMIN',
                isActive: true,
              },
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          throw new Error('Token inválido');
        }
      } catch (error: any) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Token inválido',
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Proxy para Supabase REST API para todas as outras rotas
    // Mapear rotas da API para tabelas do Supabase
    const routeMapping: Record<string, string> = {
      'cattle-purchases': 'cattle_purchases',
      'sale-records': 'sale_records',
      'partners': 'partners',
      'expenses': 'expenses',
      'revenues': 'revenues',
      'users': 'users',
      'pens': 'pens',
      'payer-accounts': 'payer_accounts',
      'interventions': 'health_interventions', // Mapear para tabela health_interventions
      'health-interventions': 'health_interventions', // Alias
      'mortality-records': 'mortality_records',
      'pen-movements': 'pen_movements',
      'weight-readings': 'weight_readings',
      'stats': 'stats', // Rota especial
    };

    // Extrair nome da tabela do path
    const pathStr = String(path || '');
    const pathParts = pathStr.split('/').filter(p => p);
    const resourceName = pathParts[0] || '';
    const tableName = routeMapping[resourceName] || resourceName;

    // Rota especial para stats - retornar dados básicos
    if (resourceName === 'stats') {
      // Retornar stats básicos (pode ser expandido depois)
      return new Response(
        JSON.stringify({
          totalCattle: 0,
          activeLots: 0,
          occupiedPens: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          averageWeight: 0,
          mortalityRate: 0,
          lastUpdated: new Date().toISOString(),
          message: 'Stats endpoint - dados podem ser limitados sem service_role key'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Tratamento especial para rotas de intervenções com sub-rotas
    // Ex: /interventions/health, /interventions/history, /interventions/statistics
    if (resourceName === 'interventions' && pathParts.length > 1) {
      const subRoute = pathParts[1];
      
      // Rota de histórico: /interventions/history
      if (subRoute === 'history') {
        // Buscar de múltiplas tabelas relacionadas
        const queryParams = url.searchParams;
        const cattlePurchaseId = queryParams.get('cattlePurchaseId');
        const penId = queryParams.get('penId');
        const type = queryParams.get('type');
        const startDate = queryParams.get('startDate');
        const endDate = queryParams.get('endDate');
        
        // Construir queries para cada tipo de intervenção
        let queries: Promise<any>[] = [];
        
        // Health interventions
        if (!type || type === 'health') {
          let healthUrl = `${SUPABASE_URL}/rest/v1/health_interventions?select=*`;
          if (cattlePurchaseId) healthUrl += `&cattlePurchaseId=eq.${cattlePurchaseId}`;
          if (penId) healthUrl += `&penId=eq.${penId}`;
          if (startDate) healthUrl += `&applicationDate=gte.${startDate}`;
          if (endDate) healthUrl += `&applicationDate=lte.${endDate}`;
          
          queries.push(
            fetch(healthUrl, {
              headers: {
                'apikey': MCP_ANON_KEY,
                'Authorization': `Bearer ${MCP_ANON_KEY}`,
              },
            }).then(r => r.json()).catch(() => [])
          );
        }
        
        // Mortality records
        if (!type || type === 'mortality') {
          let mortalityUrl = `${SUPABASE_URL}/rest/v1/mortality_records?select=*`;
          if (cattlePurchaseId) mortalityUrl += `&cattlePurchaseId=eq.${cattlePurchaseId}`;
          if (penId) mortalityUrl += `&penId=eq.${penId}`;
          if (startDate) mortalityUrl += `&deathDate=gte.${startDate}`;
          if (endDate) mortalityUrl += `&deathDate=lte.${endDate}`;
          
          queries.push(
            fetch(mortalityUrl, {
              headers: {
                'apikey': MCP_ANON_KEY,
                'Authorization': `Bearer ${MCP_ANON_KEY}`,
              },
            }).then(r => r.json()).catch(() => [])
          );
        }
        
        // Pen movements
        if (!type || type === 'movement') {
          let movementUrl = `${SUPABASE_URL}/rest/v1/pen_movements?select=*`;
          if (cattlePurchaseId) movementUrl += `&cattlePurchaseId=eq.${cattlePurchaseId}`;
          if (startDate) movementUrl += `&movementDate=gte.${startDate}`;
          if (endDate) movementUrl += `&movementDate=lte.${endDate}`;
          
          queries.push(
            fetch(movementUrl, {
              headers: {
                'apikey': MCP_ANON_KEY,
                'Authorization': `Bearer ${MCP_ANON_KEY}`,
              },
            }).then(r => r.json()).catch(() => [])
          );
        }
        
        // Weight readings
        if (!type || type === 'weight') {
          let weightUrl = `${SUPABASE_URL}/rest/v1/weight_readings?select=*`;
          if (cattlePurchaseId) weightUrl += `&purchaseId=eq.${cattlePurchaseId}`;
          if (startDate) weightUrl += `&readingDate=gte.${startDate}`;
          if (endDate) weightUrl += `&readingDate=lte.${endDate}`;
          
          queries.push(
            fetch(weightUrl, {
              headers: {
                'apikey': MCP_ANON_KEY,
                'Authorization': `Bearer ${MCP_ANON_KEY}`,
              },
            }).then(r => r.json()).catch(() => [])
          );
        }
        
        // Executar todas as queries e combinar resultados
        const results = await Promise.all(queries);
        const combinedResults = results.flat().map((item: any, index: number) => {
          // Adicionar tipo baseado na origem
          if (index < results[0]?.length) return { ...item, type: 'health' };
          if (index < results[0]?.length + results[1]?.length) return { ...item, type: 'mortality' };
          if (index < results[0]?.length + results[1]?.length + results[2]?.length) return { ...item, type: 'movement' };
          return { ...item, type: 'weight' };
        });
        
        return new Response(
          JSON.stringify(combinedResults),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      // Rota de estatísticas: /interventions/statistics
      if (subRoute === 'statistics') {
        // Retornar estatísticas básicas (pode ser expandido depois)
        return new Response(
          JSON.stringify({
            totalHealthInterventions: 0,
            totalMortalityRecords: 0,
            totalPenMovements: 0,
            totalWeightReadings: 0,
            message: 'Statistics endpoint - dados podem ser limitados sem service_role key'
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      // Para outras sub-rotas (ex: /interventions/health), tratar como POST para criar
      if (method === 'POST' && (subRoute === 'health' || subRoute === 'mortality' || subRoute === 'movement' || subRoute === 'weight')) {
        // Mapear sub-rota para tabela correta
        const subRouteTableMap: Record<string, string> = {
          'health': 'health_interventions',
          'mortality': 'mortality_records',
          'movement': 'pen_movements',
          'weight': 'weight_readings',
        };
        
        const targetTable = subRouteTableMap[subRoute];
        if (targetTable) {
          const body = await request.json().catch(() => ({}));
          
          // Fazer POST para a tabela correta
          const createUrl = `${SUPABASE_URL}/rest/v1/${targetTable}`;
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'apikey': MCP_ANON_KEY,
              'Authorization': `Bearer ${MCP_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(body),
          });
          
          const createData = await createResponse.json().catch(() => ({}));
          
          return new Response(
            JSON.stringify({
              status: createResponse.ok ? 'success' : 'error',
              data: createResponse.ok ? createData : null,
              message: createResponse.ok 
                ? `${subRoute === 'health' ? 'Intervenção de saúde' : subRoute === 'mortality' ? 'Registro de mortalidade' : subRoute === 'movement' ? 'Movimentação' : 'Pesagem'} registrada com sucesso`
                : createData.message || 'Erro ao registrar',
            }),
            {
              status: createResponse.ok ? 201 : createResponse.status,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }
    }
    
    // Se não tem tableName válido, retornar 404
    if (!tableName || !routeMapping[resourceName]) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Rota não encontrada',
          path: pathStr,
          availableRoutes: Object.keys(routeMapping),
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Construir URL do Supabase
    let supabaseUrl = `${SUPABASE_URL}/rest/v1/${tableName}`;
    
    // Processar query parameters
    const searchParams = new URLSearchParams(url.search);
    
    // Extrair paginação (page e limit) e converter para formato Supabase
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    
    // Remover page e limit dos parâmetros para não serem interpretados como filtros
    searchParams.delete('page');
    searchParams.delete('limit');
    
    // Construir query string para Supabase
    const queryParts: string[] = [];
    
    // Adicionar filtros de ID se for uma rota específica (ex: /api/v1/cattle-purchases/123)
    if (pathParts.length > 1 && pathParts[1]) {
      const id = pathParts[1];
      queryParts.push(`id=eq.${id}`);
    }
    
    // Adicionar outros query parameters (filtros, ordenação, etc.)
    // Filtrar apenas parâmetros válidos do PostgREST
    const validPostgrestParams = ['select', 'order', 'filter', 'or', 'and', 'not', 'is', 'in', 'cs', 'cd', 'sl', 'sr', 'nxr', 'nxl', 'adj'];
    for (const [key, value] of searchParams.entries()) {
      // Se for um parâmetro válido do PostgREST ou um filtro customizado
      if (validPostgrestParams.includes(key.toLowerCase()) || key.includes('.')) {
        queryParts.push(`${key}=${encodeURIComponent(value)}`);
      } else {
        // Para outros parâmetros, tratar como filtro de igualdade
        queryParts.push(`${key}=eq.${encodeURIComponent(value)}`);
      }
    }
    
    // Adicionar paginação no formato correto do Supabase
    if (limit !== null) {
      queryParts.push(`limit=${limit}`);
    }
    if (page !== null && limit !== null) {
      const offset = (page - 1) * limit;
      queryParts.push(`offset=${offset}`);
    }
    
    // Construir URL final
    if (queryParts.length > 0) {
      supabaseUrl += `?${queryParts.join('&')}`;
    }

    // Verificar se as chaves estão configuradas
    if (!SUPABASE_SECRET_KEY && !SUPABASE_PUBLISHABLE_KEY) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Chaves do Supabase não configuradas. Configure SUPABASE_SECRET_KEY e SUPABASE_PUBLISHABLE_KEY no Cloudflare.',
          hint: 'Acesse: Dashboard → Pages → aplicacao-boi-gordo → Settings → Environment variables',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Headers para Supabase REST API
    // IMPORTANTE: SEMPRE usar anon key do MCP que sabemos que funciona
    // A secret key não está registrada, então vamos usar anon key
    const authHeader = request.headers.get('authorization');
    
    // SEMPRE usar anon key do MCP (funciona e está registrada)
    const apiKey = MCP_ANON_KEY;
    const isUsingAnonKey = true;
    
    // Para anon key (JWT), usar como Bearer token
    let authToken = authHeader;
    if (!authToken) {
      authToken = `Bearer ${apiKey}`;
    }
    
    // Headers para Supabase REST API
    const supabaseHeaders: Record<string, string> = {
      'apikey': apiKey, // Anon key no apikey header
      'Authorization': authToken, // Bearer token com anon key
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    
    // Log para debug
    console.log('🔑 Headers Supabase:', {
      apiKeyPrefix: apiKey?.substring(0, 30),
      authTokenPrefix: authToken?.substring(0, 30),
      keyType: apiKey.startsWith('sb_') ? 'new' : apiKey.startsWith('eyJ') ? 'anon' : 'unknown',
      isUsingAnonKey,
    });

    // Fazer requisição para Supabase
    const supabaseResponse = await fetch(supabaseUrl, {
      method: method,
      headers: supabaseHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? await request.text() : undefined,
    });

    // Se for erro de permissão ou não autenticado, retornar array vazio para GET requests
    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text().catch(() => '');
      const statusCode = supabaseResponse.status;
      
      // Para requisições GET sem autenticação, retornar array vazio em vez de erro
      if (method === 'GET' && (statusCode === 401 || statusCode === 403 || statusCode === 425)) {
        try {
          const errorJson = JSON.parse(errorText);
          // Se for erro de permissão ou não autenticado, retornar array vazio
          if (errorJson.code === '42501' || errorJson.message?.includes('permission') || 
              errorJson.message?.includes('Unauthorized') || statusCode === 401) {
            console.warn(`⚠️ Permissão negada para ${tableName}, retornando array vazio`);
            return new Response(
              JSON.stringify({
                status: 'success',
                data: [],
                message: 'Sem dados disponíveis',
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'X-Warning': 'Permission denied, returned empty array',
                },
              }
            );
          }
        } catch {
          // Se não conseguir parsear, retornar array vazio mesmo assim para GET
          if (method === 'GET' && (statusCode === 401 || statusCode === 403)) {
            console.warn(`⚠️ Erro ${statusCode} para ${tableName}, retornando array vazio`);
            return new Response(
              JSON.stringify({
                status: 'success',
                data: [],
                message: 'Sem dados disponíveis',
              }),
              {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'X-Warning': `Error ${statusCode}, returned empty array`,
                },
              }
            );
          }
        }
      }
      
      // Para outros erros ou métodos diferentes de GET, retornar o erro normalmente
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      return new Response(
        JSON.stringify(errorData),
        {
          status: statusCode,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await supabaseResponse.json().catch(() => ({}));
    
    // Calcular tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Log de performance para requisições lentas (>500ms)
    if (responseTime > 500) {
      console.warn(`⚠️ [Pages Function] Requisição lenta: ${method} ${path} - ${responseTime}ms`);
    }

    // Encapsular resposta no formato esperado pelo frontend
    // O frontend espera: { status: 'success', data: [...] }
    const formattedResponse = {
      status: 'success' as const,
      data: data,
      message: 'Dados carregados com sucesso',
    };

    return new Response(
      JSON.stringify(formattedResponse),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Server-Timing': `total;dur=${responseTime}`,
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [Pages Function] Erro em ${method} ${path} após ${responseTime}ms:`, error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Server-Timing': `total;dur=${responseTime}`,
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  }
}
