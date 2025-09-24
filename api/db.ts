/**
 * Conexão direta com o banco de dados PostgreSQL do Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI';

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
});

// Função para buscar dados
export async function fetchFromSupabase(table: string, query?: any) {
  try {
    let request = supabase.from(table).select('*');

    if (query?.limit) {
      request = request.limit(query.limit);
    }

    const { data, error } = await request;

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchFromSupabase for ${table}:`, error);
    return [];
  }
}

// Funções específicas para cada tabela
export async function getCattlePurchases() {
  return fetchFromSupabase('cattle_purchases');
}

export async function getExpenses() {
  return fetchFromSupabase('expenses');
}

export async function getRevenues() {
  return fetchFromSupabase('revenues');
}

export async function getPartners() {
  return fetchFromSupabase('partners');
}

export async function getSaleRecords() {
  return fetchFromSupabase('sale_records');
}