-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('NEGOTIATING', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'ACTIVE', 'SOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "cost_proportional_allocations" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "purchaseId" TEXT;

-- AlterTable
ALTER TABLE "financial_accounts" ADD COLUMN     "purchaseId" TEXT;

-- AlterTable
ALTER TABLE "health_records" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lot_movements" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lot_pen_links" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "non_cash_expenses" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sale_records" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "weight_readings" ADD COLUMN     "purchaseId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cattle_purchases" (
    "id" TEXT NOT NULL,
    "purchaseCode" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "brokerId" TEXT,
    "transportCompanyId" TEXT,
    "payerAccountId" TEXT NOT NULL,
    "userId" TEXT,
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "animalType" "AnimalType" NOT NULL DEFAULT 'MALE',
    "animalAge" DOUBLE PRECISION,
    "initialQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "deathCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseWeight" DOUBLE PRECISION NOT NULL,
    "receivedWeight" DOUBLE PRECISION,
    "currentWeight" DOUBLE PRECISION,
    "averageWeight" DOUBLE PRECISION,
    "weightBreakPercentage" DOUBLE PRECISION,
    "carcassYield" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "pricePerArroba" DOUBLE PRECISION NOT NULL,
    "purchaseValue" DOUBLE PRECISION NOT NULL,
    "freightCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freightDistance" DOUBLE PRECISION,
    "freightCostPerKm" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operationalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH',
    "paymentTerms" TEXT,
    "principalDueDate" TIMESTAMP(3),
    "commissionPaymentType" TEXT,
    "commissionDueDate" TIMESTAMP(3),
    "freightPaymentType" TEXT,
    "freightDueDate" TIMESTAMP(3),
    "expectedGMD" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "estimatedSlaughterDate" TIMESTAMP(3),
    "status" "PurchaseStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "stage" TEXT,
    "notes" TEXT,
    "transportMortality" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cattle_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cattle_purchases_purchaseCode_key" ON "cattle_purchases"("purchaseCode");

-- CreateIndex
CREATE UNIQUE INDEX "cattle_purchases_lotCode_key" ON "cattle_purchases"("lotCode");

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_transportCompanyId_fkey" FOREIGN KEY ("transportCompanyId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "payer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_pen_links" ADD CONSTRAINT "lot_pen_links_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_proportional_allocations" ADD CONSTRAINT "cost_proportional_allocations_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_movements" ADD CONSTRAINT "lot_movements_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_readings" ADD CONSTRAINT "weight_readings_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_cash_expenses" ADD CONSTRAINT "non_cash_expenses_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

