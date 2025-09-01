-- 🎯 Migração para Sistema de Status Unificado - BoviControl
-- 
-- OBJETIVO: Simplificar para 5 status: CONFIRMED, RECEIVED, CONFINED, SOLD, CANCELLED
-- 
-- ⚠️  EXECUTAR EM AMBIENTE DE DESENVOLVIMENTO PRIMEIRO
-- ⚠️  FAZER BACKUP COMPLETO ANTES DE EXECUTAR

BEGIN;

-- 1. ANÁLISE DOS DADOS ATUAIS
SELECT 
    '=== ANÁLISE ATUAL DOS STATUS ===' as info,
    stage as stage_atual,
    status as status_atual,
    COUNT(*) as quantidade
FROM "CattlePurchase" 
GROUP BY stage, status
ORDER BY quantidade DESC;

-- 2. CRIAR TABELA DE AUDITORIA DE STATUS
CREATE TABLE IF NOT EXISTS "StatusChangeLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchaseId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "StatusChangeLog_purchaseId_idx" ON "StatusChangeLog"("purchaseId");
CREATE INDEX IF NOT EXISTS "StatusChangeLog_createdAt_idx" ON "StatusChangeLog"("createdAt");

-- 3. ADICIONAR NOVO STATUS 'RECEIVED' AO ENUM (se não existir)
-- Verificar status existentes
SELECT unnest(enum_range(NULL::"PurchaseStatus")) as status_existente;

-- Adicionar RECEIVED se necessário (executar apenas se não existir)
-- ALTER TYPE "PurchaseStatus" ADD VALUE IF NOT EXISTS 'RECEIVED' AFTER 'IN_TRANSIT';

-- 4. MAPEAMENTO INTELIGENTE DOS STATUS
-- Mapear stage atual para novo status simplificado
UPDATE "CattlePurchase" 
SET status = CASE 
    -- Casos principais
    WHEN stage = 'confirmed' OR stage IS NULL THEN 'CONFIRMED'::"PurchaseStatus"
    WHEN stage IN ('received', 'in_transit') THEN 'RECEIVED'::"PurchaseStatus"
    WHEN stage IN ('active', 'confined') THEN 'CONFINED'::"PurchaseStatus"
    WHEN stage = 'sold' THEN 'SOLD'::"PurchaseStatus"
    WHEN stage = 'cancelled' THEN 'CANCELLED'::"PurchaseStatus"
    
    -- Casos especiais baseados em dados
    WHEN stage = 'pending' AND "receivedDate" IS NOT NULL THEN 'RECEIVED'::"PurchaseStatus"
    WHEN stage = 'pending' THEN 'CONFIRMED'::"PurchaseStatus"
    
    -- Inferir por presença de dados
    WHEN "receivedDate" IS NOT NULL AND EXISTS (
        SELECT 1 FROM "LotPenLink" lpl 
        WHERE lpl."purchaseId" = "CattlePurchase".id 
        AND lpl.status = 'ACTIVE'
    ) THEN 'CONFINED'::"PurchaseStatus"
    
    WHEN "receivedDate" IS NOT NULL THEN 'RECEIVED'::"PurchaseStatus"
    
    -- Fallback padrão
    ELSE 'CONFIRMED'::"PurchaseStatus"
END;

-- 5. REGISTRAR ESTADO INICIAL NO LOG
INSERT INTO "StatusChangeLog" ("purchaseId", "toStatus", "reason")
SELECT 
    id,
    status::TEXT,
    CONCAT('Migração inicial: ', COALESCE(stage, 'null'), ' → ', status::TEXT)
FROM "CattlePurchase";

-- 6. LIMPEZA - REMOVER REFERÊNCIAS AO CAMPO 'stage'
-- ATENÇÃO: Esta operação é irreversível!
-- ALTER TABLE "CattlePurchase" DROP COLUMN IF EXISTS stage;

-- 7. VERIFICAÇÃO DOS RESULTADOS
SELECT 
    '=== RESULTADO DA MIGRAÇÃO ===' as info,
    status as novo_status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "CattlePurchase"), 2) as percentual
FROM "CattlePurchase" 
GROUP BY status
ORDER BY 
    CASE status::TEXT 
        WHEN 'CONFIRMED' THEN 1
        WHEN 'RECEIVED' THEN 2
        WHEN 'CONFINED' THEN 3
        WHEN 'SOLD' THEN 4
        WHEN 'CANCELLED' THEN 5
        ELSE 6
    END;

-- 8. VALIDAÇÕES FINAIS
-- Lotes sem status definido (deveria ser zero)
SELECT COUNT(*) as lotes_sem_status 
FROM "CattlePurchase" 
WHERE status IS NULL;

-- Lotes confinados que deveriam ter alocações
SELECT 
    COUNT(*) as lotes_confinados_sem_alocacao
FROM "CattlePurchase" cp
WHERE cp.status = 'CONFINED'
  AND NOT EXISTS (
      SELECT 1 FROM "LotPenLink" lpl 
      WHERE lpl."purchaseId" = cp.id 
      AND lpl.status = 'ACTIVE'
  );

-- Lotes recepcionados que deveriam ter data
SELECT 
    COUNT(*) as lotes_recepcionados_sem_data
FROM "CattlePurchase" 
WHERE status IN ('RECEIVED', 'CONFINED', 'SOLD')
  AND "receivedDate" IS NULL;

-- 9. RESULTADO FINAL
SELECT 
    '✅ MIGRAÇÃO CONCLUÍDA!' as resultado,
    COUNT(*) as total_lotes,
    COUNT(DISTINCT status) as total_status
FROM "CattlePurchase";

COMMIT;

-- 10. PRÓXIMOS PASSOS:
-- 
-- A) ATUALIZAR SCHEMA PRISMA:
--    - Remover campo 'stage' do modelo CattlePurchase
--    - Verificar se enum tem todos os status: CONFIRMED, RECEIVED, CONFINED, SOLD, CANCELLED
--    - Adicionar modelo StatusChangeLog
--
-- B) EXECUTAR:
--    npx prisma db pull  (para sincronizar schema)
--    npx prisma generate (para atualizar client)
--
-- C) ATUALIZAR CÓDIGO:
--    - Services: usar apenas 'status', remover referências a 'stage'
--    - Frontend: usar STATUS_CONFIG unificado
--    - Implementar validações de transição
--
-- D) TESTAR:
--    - Fluxo completo: CONFIRMED → RECEIVED → CONFINED → SOLD
--    - Cancelamentos em cada etapa
--    - Interface visual consistente