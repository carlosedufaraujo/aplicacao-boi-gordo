-- ============================================
-- Script para desabilitar RLS nas tabelas principais
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/sql/new
-- ============================================

-- Desabilitar RLS nas tabelas principais
ALTER TABLE public.cattle_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payer_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_interventions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortality_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pen_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_readings DISABLE ROW LEVEL SECURITY;

-- Confirmar que RLS foi desabilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

