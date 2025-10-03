-- ========================================
-- SCRIPT DE MIGRAÇÃO DOS DADOS JSON PARA SUPABASE
-- ========================================
-- Execute este SQL no Supabase Dashboard:
-- https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/sql/new

-- ========================================
-- 1. LIMPAR TABELAS (OPCIONAL - CUIDADO!)
-- ========================================
-- Se quiser limpar antes de importar, descomente:
-- TRUNCATE users, cattle_purchases, expenses, partners CASCADE;

-- ========================================
-- 2. IMPORTAR USUÁRIOS (2 registros)
-- ========================================
INSERT INTO users (id, email, name, role, is_active, is_master, created_at, updated_at)
VALUES 
  ('user-001', 'carlosedufaraujo@outlook.com', 'Carlos Eduardo', 'ADMIN', true, true, '2025-08-15 10:00:00', '2025-09-26 00:00:00'),
  ('user-002', 'admin@boigordo.com', 'Administrador', 'ADMIN', true, false, '2025-08-20 14:30:00', '2025-09-25 16:45:00')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  is_master = EXCLUDED.is_master,
  updated_at = NOW();

-- ========================================
-- 3. IMPORTAR PARCEIROS (primeiros 5 como exemplo)
-- ========================================
INSERT INTO partners (id, name, type, created_at, updated_at)
VALUES
  ('cmfic7mjz00043lpt2eoynaj6', 'TOP Freios', 'FREIGHT_CARRIER', '2025-09-13 14:04:07', '2025-09-13 14:04:07'),
  ('cmfic7bg100033lpt6tqnp9a9', 'Antônio Odinoma', 'BROKER', '2025-09-13 14:03:53', '2025-09-13 14:03:53'),
  ('cmfic6z6x00023lpttacv7257', 'João Vitor Laranjeira', 'VENDOR', '2025-09-13 14:03:39', '2025-09-13 14:03:39'),
  ('cmfgqd7x5003h8ay75nlfmtwt', 'FREDERICO SANTOS NOGUEIRA', 'VENDOR', '2025-09-12 11:04:51', '2025-09-12 11:04:51'),
  ('cmfgqd7wi003g8ay7f3afrfq2', 'AGNALDO DOS REIS BRITO', 'VENDOR', '2025-09-12 11:04:51', '2025-09-12 11:04:51')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  updated_at = NOW();

-- ========================================
-- 4. IMPORTAR CATTLE PURCHASES (primeiros 5 como exemplo)
-- ========================================
-- NOTA: Você precisa primeiro criar os vendor_ids correspondentes na tabela partners

INSERT INTO cattle_purchases (
  id, 
  average_weight, 
  price_per_arroba, 
  purchase_date,
  status,
  created_at, 
  updated_at,
  vendor_id
)
VALUES
  ('cmfgqd98w00428ay7va1rkcbd', 446.1, 295, '2025-08-15', 'CONFIRMED', '2025-09-12 11:04:52', '2025-09-12 12:57:50', 
   (SELECT id FROM partners WHERE name = 'FREDERICO SANTOS NOGUEIRA' LIMIT 1)),
  
  ('cmfgqd8ys003w8ay7tgh6vbsz', 409.90, 295, '2025-08-18', 'CONFIRMED', '2025-09-12 11:04:52', '2025-09-12 12:57:50',
   (SELECT id FROM partners WHERE name = 'AGNALDO DOS REIS BRITO' LIMIT 1)),
  
  ('cmfgqd8oi003q8ay7hpyf73kg', 366.3, 289.66, '2025-08-10', 'CONFIRMED', '2025-09-12 11:04:51', '2025-09-12 12:57:50',
   (SELECT id FROM partners WHERE name = 'FREDERICO SANTOS NOGUEIRA' LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  average_weight = EXCLUDED.average_weight,
  price_per_arroba = EXCLUDED.price_per_arroba,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ========================================
-- 5. VERIFICAR IMPORTAÇÃO
-- ========================================
SELECT 'Users:' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'Partners:', COUNT(*) FROM partners
UNION ALL  
SELECT 'Cattle Purchases:', COUNT(*) FROM cattle_purchases
UNION ALL
SELECT 'Expenses:', COUNT(*) FROM expenses;

-- ========================================
-- NOTAS IMPORTANTES:
-- ========================================
-- 1. Este é um exemplo parcial com alguns registros
-- 2. Para importar TODOS os dados, você precisará do script completo
-- 3. Certifique-se de que as foreign keys estejam corretas
-- 4. Execute em partes para evitar timeout
