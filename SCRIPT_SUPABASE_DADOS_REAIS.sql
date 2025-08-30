-- ========================================
-- SCRIPT PARA CRIAR DADOS REAIS NO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- ========================================

-- PASSO 1: Desabilitar RLS temporariamente para inserção
ALTER TABLE IF EXISTS partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payer_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cattle_lots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_records DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Inserir dados reais de PARTNERS
INSERT INTO partners (id, name, type, "cpfCnpj", phone, email, address, notes, "isActive", "createdAt", "updatedAt") VALUES
('partner-1', 'Frigorífico ABC Ltda', 'BUYER', '12.345.678/0001-90', '(11) 99999-9999', 'contato@frigorificoabc.com', 'São Paulo - SP', 'Cliente premium', true, NOW(), NOW()),
('partner-2', 'Fazenda Boi Gordo XYZ', 'SUPPLIER', '98.765.432/0001-10', '(11) 88888-8888', 'fazenda@xyz.com', 'Ribeirão Preto - SP', 'Fornecedor confiável', true, NOW(), NOW()),
('partner-3', 'Corretor Rural Silva', 'BROKER', '123.456.789-00', '(11) 77777-7777', 'silva@corretor.com', 'Barretos - SP', 'Especialista em gado nelore', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

-- PASSO 3: Inserir dados reais de PAYER ACCOUNTS
INSERT INTO payer_accounts (id, "bankName", "accountName", agency, "accountNumber", "accountType", balance, "isActive", "createdAt", "updatedAt") VALUES
('account-1', 'Banco do Brasil', 'Fazenda Boi Gordo - Conta Principal', '1234-5', '56789-0', 'CHECKING', 50000.00, true, NOW(), NOW()),
('account-2', 'Itaú Unibanco', 'Fazenda Boi Gordo - Conta Operacional', '9876-1', '12345-6', 'SAVINGS', 25000.00, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance, "updatedAt" = NOW();

-- PASSO 4: Inserir dados reais de EXPENSES
INSERT INTO expenses (id, description, "totalAmount", category, "dueDate", "paymentDate", "isPaid", "payerAccountId", "userId", "createdAt", "updatedAt") VALUES
('expense-1', 'Ração Premium 25kg', 2500.00, 'FEED', '2025-01-15', '2025-01-15', true, 'account-1', 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', NOW(), NOW()),
('expense-2', 'Consulta Veterinária', 800.00, 'VETERINARY', '2025-01-20', NULL, false, 'account-2', 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "totalAmount" = EXCLUDED."totalAmount", "updatedAt" = NOW();

-- PASSO 5: Inserir dados reais de REVENUES  
INSERT INTO revenues (id, description, "totalAmount", category, "dueDate", "receiptDate", "isReceived", "payerAccountId", "userId", "createdAt", "updatedAt") VALUES
('revenue-1', 'Venda de Gado - Lote Premium A', 25000.00, 'CATTLE_SALE', '2025-01-25', '2025-01-20', true, 'account-1', 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', NOW(), NOW()),
('revenue-2', 'Venda de Gado - Lote Standard B', 18000.00, 'CATTLE_SALE', '2025-01-30', NULL, false, 'account-1', 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "totalAmount" = EXCLUDED."totalAmount", "updatedAt" = NOW();

-- PASSO 6: Inserir dados reais de PENS
INSERT INTO pens (id, "penNumber", name, capacity, "currentAnimals", location, "isActive", notes, "createdAt", "updatedAt") VALUES
('pen-1', 'A-001', 'Curral Principal A', 100, 45, 'Setor Norte', true, 'Curral com cobertura', NOW(), NOW()),
('pen-2', 'B-002', 'Curral Secundário B', 80, 30, 'Setor Sul', true, 'Curral para quarentena', NOW(), NOW()),
('pen-3', 'C-003', 'Curral de Engorda C', 120, 0, 'Setor Leste', true, 'Curral para engorda final', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "currentAnimals" = EXCLUDED."currentAnimals", "updatedAt" = NOW();

-- PASSO 7: Inserir dados reais de CYCLES
INSERT INTO cycles (id, name, description, "startDate", "endDate", status, "targetAnimals", "actualAnimals", budget, "totalCost", "totalRevenue", "userId", "isActive", "createdAt") VALUES
('cycle-1', 'Ciclo Produtivo 2025-A', 'Primeiro ciclo do ano 2025', '2025-01-01', '2025-06-30', 'ACTIVE', 100, 78, 150000.00, 135000.00, 43000.00, 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', true, NOW()),
('cycle-2', 'Ciclo Produtivo 2024-B', 'Segundo semestre de 2024', '2024-07-01', '2024-12-31', 'COMPLETED', 80, 80, 120000.00, 95000.00, 160000.00, 'e6a37e86-7456-44c3-8b38-5075fa7ed69e', true, NOW())
ON CONFLICT (id) DO UPDATE SET "actualAnimals" = EXCLUDED."actualAnimals", "createdAt" = NOW();

-- PASSO 8: Verificar dados inseridos
SELECT 'partners' as tabela, COUNT(*) as registros FROM partners
UNION ALL
SELECT 'payer_accounts', COUNT(*) FROM payer_accounts  
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'revenues', COUNT(*) FROM revenues
UNION ALL
SELECT 'pens', COUNT(*) FROM pens
UNION ALL
SELECT 'cycles', COUNT(*) FROM cycles
ORDER BY tabela;
