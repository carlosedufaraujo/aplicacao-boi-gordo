-- Script para correção do sistema de status de lotes
-- ⚠️  EXECUTAR EM AMBIENTE DE DESENVOLVIMENTO PRIMEIRO
-- ⚠️  FAZER BACKUP COMPLETO ANTES DE EXECUTAR

-- 1. Mapear valores atuais de 'stage' para novos status
SELECT 
    stage,
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN stage = 'confirmed' THEN 'CONFIRMED'
        WHEN stage = 'in_transit' THEN 'IN_TRANSIT'
        WHEN stage = 'received' THEN 'RECEIVED'
        WHEN stage IN ('active', 'confined') THEN 'CONFINED'
        WHEN stage = 'sold' THEN 'SOLD'
        ELSE 'CONFIRMED'
    END as novo_status
FROM "CattlePurchase" 
GROUP BY stage, status
ORDER BY quantidade DESC;

-- 2. Verificar inconsistências antes da migração
SELECT 
    id,
    "lotCode",
    stage,
    status,
    "receivedDate",
    "createdAt"
FROM "CattlePurchase" 
WHERE stage IS NULL 
   OR stage NOT IN ('confirmed', 'in_transit', 'received', 'active', 'confined', 'sold', 'cancelled');

-- 3. Atualizar status baseado no stage atual
UPDATE "CattlePurchase" 
SET status = CASE 
    WHEN stage = 'confirmed' THEN 'CONFIRMED'::public."PurchaseStatus"
    WHEN stage = 'in_transit' THEN 'IN_TRANSIT'::public."PurchaseStatus"
    WHEN stage = 'received' THEN 'RECEIVED'::public."PurchaseStatus"
    WHEN stage IN ('active', 'confined') THEN 'CONFINED'::public."PurchaseStatus"
    WHEN stage = 'sold' THEN 'SOLD'::public."PurchaseStatus"
    WHEN stage = 'cancelled' THEN 'CANCELLED'::public."PurchaseStatus"
    ELSE 'CONFIRMED'::public."PurchaseStatus"
END;

-- 4. Adicionar status RECEIVED ao enum (se não existir)
-- Primeiro, verificar se já existe:
-- SELECT unnest(enum_range(NULL::public."PurchaseStatus"));

-- Se RECEIVED não existir, adicionar:
-- ALTER TYPE public."PurchaseStatus" ADD VALUE 'RECEIVED' AFTER 'IN_TRANSIT';

-- 5. Verificar resultado da migração
SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "CattlePurchase"), 2) as percentual
FROM "CattlePurchase" 
GROUP BY status
ORDER BY quantidade DESC;

-- 6. Criar tabela de auditoria para mudanças de status
CREATE TABLE IF NOT EXISTS "StatusChangeLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "cattlePurchaseId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "StatusChangeLog_cattlePurchaseId_fkey" 
    FOREIGN KEY ("cattlePurchaseId") REFERENCES "CattlePurchase"("id") ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "StatusChangeLog_cattlePurchaseId_idx" ON "StatusChangeLog"("cattlePurchaseId");
CREATE INDEX IF NOT EXISTS "StatusChangeLog_createdAt_idx" ON "StatusChangeLog"("createdAt");

-- 7. Popular log inicial com status atual
INSERT INTO "StatusChangeLog" ("cattlePurchaseId", "toStatus", "reason")
SELECT 
    id,
    status::TEXT,
    'Migração inicial do sistema de status'
FROM "CattlePurchase";

-- 8. Verificações finais
SELECT 'Status unificados com sucesso!' as resultado,
       COUNT(*) as total_lotes
FROM "CattlePurchase";

-- PRÓXIMO PASSO: 
-- Após executar este script, aplicar as alterações no schema Prisma:
-- 1. Remover campo 'stage' do modelo CattlePurchase
-- 2. Adicionar 'RECEIVED' ao enum PurchaseStatus (se necessário)
-- 3. Executar: npx prisma db push
-- 4. Atualizar código backend/frontend