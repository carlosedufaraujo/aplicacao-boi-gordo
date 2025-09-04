-- Adicionar campo para indicar tipo de DRE
ALTER TABLE "DREStatement" 
ADD COLUMN "type" TEXT DEFAULT 'MONTHLY';

-- Criar índice para buscar DREs por tipo
CREATE INDEX "DREStatement_type_idx" ON "DREStatement"("type");

-- Criar view para DRE consolidado por ciclo
CREATE OR REPLACE VIEW "CycleDRESummary" AS
SELECT 
  "cycleId",
  SUM("grossRevenue") as "totalGrossRevenue",
  SUM("deductions") as "totalDeductions",
  SUM("netRevenue") as "totalNetRevenue",
  SUM("animalCost") as "totalAnimalCost",
  SUM("feedCost") as "totalFeedCost",
  SUM("healthCost") as "totalHealthCost",
  SUM("laborCost") as "totalLaborCost",
  SUM("otherCosts") as "totalOtherCosts",
  SUM("totalCosts") as "totalCosts",
  SUM("grossProfit") as "totalGrossProfit",
  SUM("adminExpenses") as "totalAdminExpenses",
  SUM("salesExpenses") as "totalSalesExpenses",
  SUM("financialExpenses") as "totalFinancialExpenses",
  SUM("otherExpenses") as "totalOtherExpenses",
  SUM("totalExpenses") as "totalExpenses",
  SUM("operationalProfit") as "totalOperationalProfit",
  SUM("netProfit") as "totalNetProfit",
  COUNT(*) as "monthCount",
  MIN("referenceMonth") as "startMonth",
  MAX("referenceMonth") as "endMonth"
FROM "DREStatement"
WHERE "cycleId" IS NOT NULL
GROUP BY "cycleId";