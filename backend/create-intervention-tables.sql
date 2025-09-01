-- SQL para criação das tabelas de intervenções
-- Execute este script no seu banco PostgreSQL

-- Tabela de Intervenções de Saúde (Protocolos Sanitários)
CREATE TABLE IF NOT EXISTS "HealthIntervention" (
    "id" TEXT NOT NULL,
    "cattlePurchaseId" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "dose" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "veterinarian" TEXT,
    "batchNumber" TEXT,
    "manufacturer" TEXT,
    "expirationDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthIntervention_pkey" PRIMARY KEY ("id")
);

-- Tabela de Registros de Mortalidade
CREATE TABLE IF NOT EXISTS "MortalityRecord" (
    "id" TEXT NOT NULL,
    "cattlePurchaseId" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deathDate" TIMESTAMP(3) NOT NULL,
    "cause" TEXT NOT NULL,
    "specificCause" TEXT,
    "veterinarianReport" TEXT,
    "necropsy" BOOLEAN NOT NULL DEFAULT false,
    "necropsyReport" TEXT,
    "estimatedLoss" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MortalityRecord_pkey" PRIMARY KEY ("id")
);

-- Tabela de Movimentações entre Currais
CREATE TABLE IF NOT EXISTS "PenMovement" (
    "id" TEXT NOT NULL,
    "cattlePurchaseId" TEXT NOT NULL,
    "fromPenId" TEXT NOT NULL,
    "toPenId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "responsibleUser" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenMovement_pkey" PRIMARY KEY ("id")
);

-- Tabela de Leituras de Peso
CREATE TABLE IF NOT EXISTS "WeightReading" (
    "id" TEXT NOT NULL,
    "cattlePurchaseId" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "averageWeight" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL,
    "weighingDate" TIMESTAMP(3) NOT NULL,
    "weighingMethod" TEXT,
    "equipment" TEXT,
    "operator" TEXT,
    "weatherConditions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightReading_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "HealthIntervention_cattlePurchaseId_idx" ON "HealthIntervention"("cattlePurchaseId");
CREATE INDEX IF NOT EXISTS "HealthIntervention_penId_idx" ON "HealthIntervention"("penId");
CREATE INDEX IF NOT EXISTS "HealthIntervention_applicationDate_idx" ON "HealthIntervention"("applicationDate");

CREATE INDEX IF NOT EXISTS "MortalityRecord_cattlePurchaseId_idx" ON "MortalityRecord"("cattlePurchaseId");
CREATE INDEX IF NOT EXISTS "MortalityRecord_penId_idx" ON "MortalityRecord"("penId");
CREATE INDEX IF NOT EXISTS "MortalityRecord_deathDate_idx" ON "MortalityRecord"("deathDate");

CREATE INDEX IF NOT EXISTS "PenMovement_cattlePurchaseId_idx" ON "PenMovement"("cattlePurchaseId");
CREATE INDEX IF NOT EXISTS "PenMovement_fromPenId_idx" ON "PenMovement"("fromPenId");
CREATE INDEX IF NOT EXISTS "PenMovement_toPenId_idx" ON "PenMovement"("toPenId");
CREATE INDEX IF NOT EXISTS "PenMovement_movementDate_idx" ON "PenMovement"("movementDate");

CREATE INDEX IF NOT EXISTS "WeightReading_cattlePurchaseId_idx" ON "WeightReading"("cattlePurchaseId");
CREATE INDEX IF NOT EXISTS "WeightReading_penId_idx" ON "WeightReading"("penId");
CREATE INDEX IF NOT EXISTS "WeightReading_weighingDate_idx" ON "WeightReading"("weighingDate");

-- Adicionar chaves estrangeiras (assumindo que as tabelas CattlePurchase e Pen existem)
-- Descomente as linhas abaixo se as tabelas de referência existirem

-- ALTER TABLE "HealthIntervention" 
-- ADD CONSTRAINT "HealthIntervention_cattlePurchaseId_fkey" 
-- FOREIGN KEY ("cattlePurchaseId") REFERENCES "CattlePurchase"("id") ON DELETE CASCADE;

-- ALTER TABLE "HealthIntervention" 
-- ADD CONSTRAINT "HealthIntervention_penId_fkey" 
-- FOREIGN KEY ("penId") REFERENCES "Pen"("id") ON DELETE CASCADE;

-- ALTER TABLE "MortalityRecord" 
-- ADD CONSTRAINT "MortalityRecord_cattlePurchaseId_fkey" 
-- FOREIGN KEY ("cattlePurchaseId") REFERENCES "CattlePurchase"("id") ON DELETE CASCADE;

-- ALTER TABLE "MortalityRecord" 
-- ADD CONSTRAINT "MortalityRecord_penId_fkey" 
-- FOREIGN KEY ("penId") REFERENCES "Pen"("id") ON DELETE CASCADE;

-- ALTER TABLE "PenMovement" 
-- ADD CONSTRAINT "PenMovement_cattlePurchaseId_fkey" 
-- FOREIGN KEY ("cattlePurchaseId") REFERENCES "CattlePurchase"("id") ON DELETE CASCADE;

-- ALTER TABLE "PenMovement" 
-- ADD CONSTRAINT "PenMovement_fromPenId_fkey" 
-- FOREIGN KEY ("fromPenId") REFERENCES "Pen"("id") ON DELETE CASCADE;

-- ALTER TABLE "PenMovement" 
-- ADD CONSTRAINT "PenMovement_toPenId_fkey" 
-- FOREIGN KEY ("toPenId") REFERENCES "Pen"("id") ON DELETE CASCADE;

-- ALTER TABLE "WeightReading" 
-- ADD CONSTRAINT "WeightReading_cattlePurchaseId_fkey" 
-- FOREIGN KEY ("cattlePurchaseId") REFERENCES "CattlePurchase"("id") ON DELETE CASCADE;

-- ALTER TABLE "WeightReading" 
-- ADD CONSTRAINT "WeightReading_penId_fkey" 
-- FOREIGN KEY ("penId") REFERENCES "Pen"("id") ON DELETE CASCADE;

-- Triggers para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_intervention_updated_at 
    BEFORE UPDATE ON "HealthIntervention" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mortality_record_updated_at 
    BEFORE UPDATE ON "MortalityRecord" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pen_movement_updated_at 
    BEFORE UPDATE ON "PenMovement" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weight_reading_updated_at 
    BEFORE UPDATE ON "WeightReading" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Script concluído!
-- Agora você pode registrar intervenções no sistema BoviControl