-- Script para corrigir os valores de compra com rendimento de 50%
-- Executar no banco PostgreSQL bovicontrol

-- 1. Criar backup da tabela antes de alterar
CREATE TABLE IF NOT EXISTS cattle_purchases_backup_20250910 AS 
SELECT * FROM cattle_purchases;

-- 2. Corrigir os valores de todos os lotes
UPDATE cattle_purchases
SET 
    "purchaseValue" = ROUND(((CAST("purchaseWeight" AS DECIMAL) * CAST("carcassYield" AS DECIMAL) / 100) / 15) * CAST("pricePerArroba" AS DECIMAL), 2),
    "totalCost" = ROUND(((CAST("purchaseWeight" AS DECIMAL) * CAST("carcassYield" AS DECIMAL) / 100) / 15) * CAST("pricePerArroba" AS DECIMAL), 2) + COALESCE("freightCost", 0) + COALESCE(commission, 0),
    "updatedAt" = NOW()
WHERE "carcassYield" = 50;

-- 3. Verificar a correção
SELECT 
    "lotCode",
    "purchaseWeight",
    "carcassYield",
    "pricePerArroba",
    "purchaseValue",
    "totalCost",
    ROUND(((CAST("purchaseWeight" AS DECIMAL) * CAST("carcassYield" AS DECIMAL) / 100) / 15) * CAST("pricePerArroba" AS DECIMAL), 2) as valor_calculado,
    "purchaseValue" - ROUND(((CAST("purchaseWeight" AS DECIMAL) * CAST("carcassYield" AS DECIMAL) / 100) / 15) * CAST("pricePerArroba" AS DECIMAL), 2) as diferenca
FROM cattle_purchases
ORDER BY "createdAt" DESC;

-- 4. Resumo da correção
SELECT 
    COUNT(*) as total_lotes,
    SUM("purchaseValue") as soma_valores_corrigidos,
    AVG("carcassYield") as rendimento_medio
FROM cattle_purchases;