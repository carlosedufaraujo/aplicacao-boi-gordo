-- ========================================
-- ADICIONAR VENDAS DE BOIS (RECEITAS)
-- ========================================
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vffxtvuqhlhcbbyqmynz/sql/new

-- Criar tabela de receitas se não existir
CREATE TABLE IF NOT EXISTS revenues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  category TEXT DEFAULT 'VENDA_GADO',
  payment_status TEXT DEFAULT 'PENDENTE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir as 4 vendas de bois
INSERT INTO revenues (
  description, 
  amount, 
  date, 
  quantity,
  unit_price,
  category,
  payment_status,
  notes,
  created_at
) VALUES 
  (
    'Venda de 45 Bois',
    255774.36,
    CURRENT_DATE,
    45,
    5683.87, -- preço por cabeça
    'VENDA_GADO',
    'PENDENTE',
    'Venda registrada em ' || CURRENT_DATE,
    NOW()
  ),
  (
    'Venda de 50 Bois',
    237525.79,
    CURRENT_DATE,
    50,
    4750.52, -- preço por cabeça
    'VENDA_GADO',
    'PENDENTE',
    'Venda registrada em ' || CURRENT_DATE,
    NOW()
  ),
  (
    'Venda de 100 Bois (Lote 1)',
    455734.26,
    CURRENT_DATE,
    100,
    4557.34, -- preço por cabeça
    'VENDA_GADO',
    'PENDENTE',
    'Primeira venda de 100 bois registrada em ' || CURRENT_DATE,
    NOW()
  ),
  (
    'Venda de 100 Bois (Lote 2)',
    470881.50,
    CURRENT_DATE,
    100,
    4708.82, -- preço por cabeça
    'VENDA_GADO',
    'PENDENTE',
    'Segunda venda de 100 bois registrada em ' || CURRENT_DATE,
    NOW()
  );

-- Verificar inserção
SELECT 
  description,
  quantity as "Quantidade",
  'R$ ' || TO_CHAR(amount, 'FM999,999,999.00') as "Valor Total",
  'R$ ' || TO_CHAR(unit_price, 'FM999,999.00') as "Preço/Cabeça",
  date as "Data",
  payment_status as "Status"
FROM revenues
WHERE category = 'VENDA_GADO'
ORDER BY created_at DESC;

-- Resumo total
SELECT 
  'RESUMO DAS VENDAS' as info,
  SUM(quantity) as "Total de Bois",
  'R$ ' || TO_CHAR(SUM(amount), 'FM999,999,999.00') as "Valor Total",
  'R$ ' || TO_CHAR(AVG(unit_price), 'FM999,999.00') as "Preço Médio/Cabeça"
FROM revenues
WHERE category = 'VENDA_GADO';
