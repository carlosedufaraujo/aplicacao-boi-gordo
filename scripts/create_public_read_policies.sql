-- ============================================
-- Script para criar políticas de leitura pública
-- Isso é MAIS SEGURO que desabilitar RLS completamente
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/sql/new
-- ============================================

-- Função auxiliar para criar políticas
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'cattle_purchases',
    'sale_records', 
    'partners',
    'expenses',
    'revenues',
    'users',
    'pens',
    'payer_accounts',
    'health_interventions',
    'mortality_records',
    'pen_movements',
    'weight_readings'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      -- Habilitar RLS (caso não esteja)
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      
      -- Remover política antiga se existir
      EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read access" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow anon read access" ON public.%I', t);
      
      -- Criar política de leitura para usuários autenticados
      EXECUTE format('
        CREATE POLICY "Allow authenticated read access" ON public.%I
        FOR SELECT
        TO authenticated
        USING (true)
      ', t);
      
      -- Criar política de leitura para anon (API key)
      EXECUTE format('
        CREATE POLICY "Allow anon read access" ON public.%I
        FOR SELECT  
        TO anon
        USING (true)
      ', t);
      
      RAISE NOTICE 'Políticas criadas para: %', t;
    ELSE
      RAISE NOTICE 'Tabela não existe: %', t;
    END IF;
  END LOOP;
END $$;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

