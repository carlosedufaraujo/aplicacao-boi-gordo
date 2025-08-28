/**
 * Configuração do Cliente Supabase
 * 
 * NOTA PARA O CURSOR MCP:
 * 1. Instale o SDK: npm install @supabase/supabase-js
 * 2. Configure as variáveis de ambiente no .env:
 *    - SUPABASE_URL
 *    - SUPABASE_ANON_KEY  
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 3. Implemente a migração gradual do sistema de auth atual para Supabase Auth
 */

// IMPORTANTE: Este arquivo está preparado para integração futura com Supabase Auth
// Por enquanto, o sistema usa autenticação própria com JWT

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
}

// Cliente para operações administrativas (service role)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente para operações do usuário (anon key)
export const supabaseAuth = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Flag para verificar se Supabase está habilitado
export const isSupabaseEnabled = () => {
  return !!supabaseUrl && !!supabaseServiceKey;
};

// Configuração para usar apenas Supabase Auth
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  useLocalTables: false, // Desabilitar tabelas locais
  useSupabaseAuth: true, // Usar apenas Supabase Auth
  syncTable: 'users' // Tabela de sincronização
};