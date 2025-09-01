-- Adicionar campos cycleId nas tabelas relacionadas

-- 1. Adicionar cycleId em cattle_purchases
ALTER TABLE cattle_purchases 
ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- 2. Adicionar cycleId em expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- 3. Adicionar cycleId em revenues
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- 4. Adicionar cycleId em sale_records
ALTER TABLE sale_records 
ADD COLUMN IF NOT EXISTS "cycleId" TEXT;

-- 5. Adicionar foreign keys
ALTER TABLE cattle_purchases 
ADD CONSTRAINT fk_cattle_purchases_cycle 
FOREIGN KEY ("cycleId") REFERENCES cycles(id) 
ON DELETE SET NULL;

ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_cycle 
FOREIGN KEY ("cycleId") REFERENCES cycles(id) 
ON DELETE SET NULL;

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_cycle 
FOREIGN KEY ("cycleId") REFERENCES cycles(id) 
ON DELETE SET NULL;

ALTER TABLE sale_records 
ADD CONSTRAINT fk_sale_records_cycle 
FOREIGN KEY ("cycleId") REFERENCES cycles(id) 
ON DELETE SET NULL;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cattle_purchases_cycle ON cattle_purchases("cycleId");
CREATE INDEX IF NOT EXISTS idx_expenses_cycle ON expenses("cycleId");
CREATE INDEX IF NOT EXISTS idx_revenues_cycle ON revenues("cycleId");
CREATE INDEX IF NOT EXISTS idx_sale_records_cycle ON sale_records("cycleId");

-- 7. Atualizar registros existentes com o ciclo ativo
UPDATE cattle_purchases 
SET "cycleId" = (SELECT id FROM cycles WHERE status = 'ACTIVE' LIMIT 1)
WHERE "cycleId" IS NULL;

UPDATE expenses 
SET "cycleId" = (SELECT id FROM cycles WHERE status = 'ACTIVE' LIMIT 1)
WHERE "cycleId" IS NULL;

UPDATE revenues 
SET "cycleId" = (SELECT id FROM cycles WHERE status = 'ACTIVE' LIMIT 1)
WHERE "cycleId" IS NULL;

UPDATE sale_records 
SET "cycleId" = (SELECT id FROM cycles WHERE status = 'ACTIVE' LIMIT 1)
WHERE "cycleId" IS NULL;