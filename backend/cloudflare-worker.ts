/**
 * Cloudflare Worker Entry Point
 * Adapta o Express app para Cloudflare Workers usando Fetch API
 */

import { createSimplifiedApp } from './src/app-vercel';

// Cria a aplicação Express
const app = createSimplifiedApp();

/**
 * Handler principal do Cloudflare Worker
 * Converte requisições Fetch para Express e vice-versa
 */
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    // Configurar variáveis de ambiente do Cloudflare
    if (env.DATABASE_URL) {
      process.env.DATABASE_URL = env.DATABASE_URL;
    }
    if (env.JWT_SECRET) {
      process.env.JWT_SECRET = env.JWT_SECRET;
    }
    if (env.SUPABASE_URL) {
      process.env.SUPABASE_URL = env.SUPABASE_URL;
    }
    if (env.SUPABASE_SERVICE_KEY) {
      process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
    }
    if (env.SUPABASE_ANON_KEY) {
      process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
    }
    process.env.NODE_ENV = env.NODE_ENV || 'production';
    process.env.PORT = '3001';
    process.env.API_PREFIX = '/api/v1';
    process.env.FRONTEND_URL = request.headers.get('origin') || 'https://seu-dominio.com';

    // Converter Request do Fetch para formato compatível com Express
    const url = new URL(request.url);
    const method = request.method;
    const headers: Record<string, string> = {};
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Ler body se existir
    let body: any = null;
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } else {
        body = await request.text();
      }
    }

    // Criar objeto de requisição compatível com Express
    const expressReq = {
      method,
      url: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers,
      body,
      get: (name: string) => headers[name.toLowerCase()],
      header: (name: string) => headers[name.toLowerCase()],
    } as any;

    // Criar objeto de resposta compatível com Express
    let responseHeaders: Record<string, string> = {};
    let statusCode = 200;
    let responseBody: any = null;

    const expressRes = {
      status: (code: number) => {
        statusCode = code;
        return expressRes;
      },
      json: (data: any) => {
        responseBody = data;
        responseHeaders['Content-Type'] = 'application/json';
        return expressRes;
      },
      send: (data: any) => {
        if (typeof data === 'string') {
          responseBody = data;
          responseHeaders['Content-Type'] = 'text/plain';
        } else {
          responseBody = data;
          responseHeaders['Content-Type'] = 'application/json';
        }
        return expressRes;
      },
      set: (key: string, value: string) => {
        responseHeaders[key] = value;
        return expressRes;
      },
      header: (key: string, value: string) => {
        responseHeaders[key] = value;
        return expressRes;
      },
      end: () => expressRes,
    } as any;

    // Processar requisição através do Express
    try {
      await new Promise<void>((resolve, reject) => {
        app(expressReq, expressRes, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Retornar resposta no formato Fetch
      return new Response(
        typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
        {
          status: statusCode,
          headers: responseHeaders,
        }
      );
    } catch (error: any) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

