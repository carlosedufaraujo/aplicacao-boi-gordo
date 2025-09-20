-- CreateEnum
CREATE TYPE "DeathType" AS ENUM ('DISEASE', 'ACCIDENT', 'PREDATION', 'POISONING', 'STRESS', 'UNKNOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('CONFIRMED', 'RECEIVED', 'CONFINED', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('VENDOR', 'BROKER', 'BUYER', 'INVESTOR', 'SERVICE_PROVIDER', 'OTHER', 'FREIGHT_CARRIER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH');

-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('MALE', 'FEMALE', 'MIXED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'INSTALLMENT', 'MIXED');

-- CreateEnum
CREATE TYPE "PenType" AS ENUM ('RECEPTION', 'FATTENING', 'QUARANTINE', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "PenStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'QUARANTINE');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "CostSourceType" AS ENUM ('HEALTH', 'FEED', 'OPERATIONAL', 'OTHER', 'PURCHASE_ORDER');

-- CreateEnum
CREATE TYPE "ProtocolType" AS ENUM ('VACCINATION', 'MEDICATION', 'EXAMINATION', 'TREATMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ALLOCATION', 'TRANSFER', 'REMOVAL', 'DEATH', 'SALE');

-- CreateEnum
CREATE TYPE "CostCenterType" AS ENUM ('ACQUISITION', 'FATTENING', 'ADMINISTRATIVE', 'FINANCIAL', 'REVENUE', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "NonCashType" AS ENUM ('MORTALITY', 'WEIGHT_LOSS', 'DEPRECIATION', 'ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AllocationEntity" AS ENUM ('LOT', 'PEN', 'GLOBAL');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('PARTNER_CONTRIBUTION', 'PARTNER_LOAN', 'BANK_FINANCING', 'EXTERNAL_INVESTOR');

-- CreateEnum
CREATE TYPE "AccountTransactionType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'RECEIVED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReconciliationTransactionType" AS ENUM ('EXPENSE', 'REVENUE', 'CONTRIBUTION', 'TRANSFER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'PAYMENT_OVERDUE', 'SALE_COMPLETED', 'SYSTEM_UPDATE', 'ALERT', 'INFO');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PURCHASE', 'SALE', 'HEALTH', 'TRANSPORT', 'FINANCE', 'GENERAL', 'DRE', 'PAYMENT', 'MEETING', 'TASK');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'RECEIVED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DREStatus" AS ENUM ('DRAFT', 'REVIEWING', 'CLOSED', 'REVISED');

-- CreateEnum
CREATE TYPE "FinancialTransactionCategory" AS ENUM ('CATTLE_SALES', 'OTHER_REVENUE', 'CATTLE_ACQUISITION', 'FEED_COSTS', 'VETERINARY_COSTS', 'LABOR_COSTS', 'OPERATIONAL_COSTS', 'DEPRECIATION', 'MORTALITY', 'BIOLOGICAL_ADJUSTMENT', 'ADMINISTRATIVE', 'FINANCIAL_COSTS', 'INFRASTRUCTURE', 'EQUIPMENT', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "CashFlowClassification" AS ENUM ('OPERATING', 'INVESTING', 'FINANCING');

-- CreateEnum
CREATE TYPE "IntegratedAnalysisStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BiologicalCostMethod" AS ENUM ('WEIGHTED_AVERAGE', 'FIFO', 'SPECIFIC_ID');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'USER',
    "isMaster" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "cpfCnpj" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payer_accounts" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "agency" TEXT,
    "accountNumber" TEXT,
    "accountType" "AccountType" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "payer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cattle_purchases" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "brokerId" TEXT,
    "transportCompanyId" TEXT,
    "payerAccountId" TEXT NOT NULL,
    "userId" UUID,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "farm" TEXT,
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
    "status" "PurchaseStatus" NOT NULL DEFAULT 'CONFIRMED',
    "stage" TEXT,
    "notes" TEXT,
    "transportMortality" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cattle_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pens" (
    "id" TEXT NOT NULL,
    "penNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "type" "PenType" NOT NULL DEFAULT 'FATTENING',
    "status" "PenStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_pen_links" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "percentageOfLot" DOUBLE PRECISION NOT NULL,
    "percentageOfPen" DOUBLE PRECISION NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL,
    "removalDate" TIMESTAMP(3),
    "status" "LinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_pen_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_proportional_allocations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" "CostSourceType" NOT NULL,
    "penId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "allocatedValue" DOUBLE PRECISION NOT NULL,
    "allocatedPercentage" DOUBLE PRECISION NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_proportional_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_protocols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProtocolType" NOT NULL,
    "penId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "veterinarian" TEXT,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "animalCount" INTEGER NOT NULL,
    "costPerAnimal" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_records" (
    "id" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "feedDate" TIMESTAMP(3) NOT NULL,
    "feedType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_movements" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "fromPenId" TEXT,
    "toPenId" TEXT,
    "movementType" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "userId" TEXT NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CostCenterType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "costCenterId" TEXT,
    "description" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "impactsCashFlow" BOOLEAN NOT NULL DEFAULT true,
    "purchaseId" TEXT,
    "penId" TEXT,
    "vendorId" TEXT,
    "payerAccountId" TEXT,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "costCenterId" TEXT,
    "description" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "receiptDate" TIMESTAMP(3),
    "isReceived" BOOLEAN NOT NULL DEFAULT false,
    "saleRecordId" TEXT,
    "buyerId" TEXT,
    "payerAccountId" TEXT,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_cash_expenses" (
    "id" TEXT NOT NULL,
    "type" "NonCashType" NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "expectedValue" DOUBLE PRECISION,
    "actualValue" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_cash_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_allocations" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "entityType" "AllocationEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_allocations" (
    "id" TEXT NOT NULL,
    "revenueId" TEXT NOT NULL,
    "entityType" "AllocationEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "payerAccountId" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "transactionType" TEXT NOT NULL,
    "reference" TEXT,
    "importBatchId" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "bankStatementId" TEXT NOT NULL,
    "transactionType" "ReconciliationTransactionType" NOT NULL,
    "transactionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_readings" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "averageWeight" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "animalCount" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_interventions" (
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
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortality_records" (
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
    "estimatedLoss" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortality_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pen_movements" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pen_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_sync" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'USER',
    "isMaster" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "type" "AccountTransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "purchaseId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortality_analyses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cattle_purchase_id" TEXT NOT NULL,
    "pen_id" TEXT,
    "phase" TEXT NOT NULL,
    "mortality_date" TIMESTAMP(6) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "average_weight" DOUBLE PRECISION,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "total_loss" DOUBLE PRECISION NOT NULL,
    "accumulated_cost" DOUBLE PRECISION NOT NULL,
    "days_in_confinement" INTEGER,
    "cause" TEXT,
    "symptoms" TEXT,
    "veterinary_diagnosis" TEXT,
    "treatment_attempted" BOOLEAN DEFAULT false,
    "treatment_cost" DOUBLE PRECISION DEFAULT 0,
    "weather_conditions" TEXT,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortality_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_break_analyses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "cattle_purchase_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_state" TEXT NOT NULL,
    "vendor_region" TEXT NOT NULL,
    "transport_distance" DOUBLE PRECISION,
    "transport_company" TEXT,
    "transport_duration" INTEGER,
    "season" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(6) NOT NULL,
    "reception_date" TIMESTAMP(6) NOT NULL,
    "purchase_weight" DOUBLE PRECISION NOT NULL,
    "received_weight" DOUBLE PRECISION NOT NULL,
    "weight_lost" DOUBLE PRECISION NOT NULL,
    "break_percentage" DOUBLE PRECISION NOT NULL,
    "initial_quantity" INTEGER NOT NULL,
    "average_initial_weight" DOUBLE PRECISION NOT NULL,
    "average_final_weight" DOUBLE PRECISION NOT NULL,
    "temperature_at_loading" DOUBLE PRECISION,
    "temperature_at_arrival" DOUBLE PRECISION,
    "weather_conditions" TEXT,
    "road_conditions" TEXT,
    "adjusted_unit_cost" DOUBLE PRECISION NOT NULL,
    "financial_impact" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_break_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "participants" TEXT[],
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "EventPriority" NOT NULL DEFAULT 'MEDIUM',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "color" TEXT,
    "relatedId" TEXT,
    "amount" DOUBLE PRECISION,
    "autoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "death_records" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "penId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deathDate" TIMESTAMP(3) NOT NULL,
    "deathType" "DeathType" NOT NULL,
    "cause" TEXT,
    "veterinaryNotes" TEXT,
    "estimatedLoss" DOUBLE PRECISION,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "death_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flows" (
    "id" TEXT NOT NULL,
    "type" "FinancialType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "reference" TEXT,
    "supplier" TEXT,
    "notes" TEXT,
    "attachments" TEXT[],
    "tags" TEXT[],
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "FinancialTransactionCategory" NOT NULL,
    "subcategory" TEXT,
    "impactsCash" BOOLEAN NOT NULL DEFAULT true,
    "cashFlowDate" TIMESTAMP(3),
    "cashFlowType" "CashFlowClassification",
    "purchaseId" TEXT,
    "penId" TEXT,
    "partnerId" TEXT,
    "accountId" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciliationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrated_financial_analysis" (
    "id" TEXT NOT NULL,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashReceipts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashPayments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netCashFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nonCashItems" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depreciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biologicalAssetChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reconciliationDifference" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "IntegratedAnalysisStatus" NOT NULL DEFAULT 'DRAFT',
    "isConsolidated" BOOLEAN NOT NULL DEFAULT false,
    "consolidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "integrated_financial_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrated_analysis_items" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "transactionId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "FinancialTransactionCategory" NOT NULL,
    "subcategory" TEXT,
    "impactsCash" BOOLEAN NOT NULL,
    "cashFlowType" "CashFlowClassification",
    "biologicalImpact" BOOLEAN NOT NULL DEFAULT false,
    "weightedCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrated_analysis_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_analysis_config" (
    "id" TEXT NOT NULL,
    "depreciationRates" JSONB NOT NULL,
    "biologicalCostMethod" "BiologicalCostMethod" NOT NULL DEFAULT 'WEIGHTED_AVERAGE',
    "autoReconciliation" BOOLEAN NOT NULL DEFAULT true,
    "reconciliationTolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,

    CONSTRAINT "financial_analysis_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_records" (
    "id" TEXT NOT NULL,
    "internalCode" TEXT,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "penId" TEXT,
    "purchaseId" TEXT,
    "saleType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "exitWeight" DOUBLE PRECISION NOT NULL,
    "carcassWeight" DOUBLE PRECISION NOT NULL,
    "carcassYield" DOUBLE PRECISION NOT NULL,
    "pricePerArroba" DOUBLE PRECISION NOT NULL,
    "arrobas" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netValue" DOUBLE PRECISION NOT NULL,
    "paymentType" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "receiverAccountId" TEXT,
    "invoiceNumber" TEXT,
    "contractNumber" TEXT,
    "observations" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_cpfCnpj_key" ON "partners"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cattle_purchases_lotCode_key" ON "cattle_purchases"("lotCode");

-- CreateIndex
CREATE UNIQUE INDEX "pens_penNumber_key" ON "pens"("penNumber");

-- CreateIndex
CREATE UNIQUE INDEX "lot_pen_links_purchaseId_penId_allocationDate_key" ON "lot_pen_links"("purchaseId", "penId", "allocationDate");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_code_key" ON "cost_centers"("code");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_sync_email_key" ON "users_sync"("email");

-- CreateIndex
CREATE INDEX "idx_mortality_cattle" ON "mortality_analyses"("cattle_purchase_id");

-- CreateIndex
CREATE INDEX "idx_mortality_cause" ON "mortality_analyses"("cause");

-- CreateIndex
CREATE INDEX "idx_mortality_date" ON "mortality_analyses"("mortality_date");

-- CreateIndex
CREATE INDEX "idx_mortality_phase" ON "mortality_analyses"("phase");

-- CreateIndex
CREATE INDEX "idx_weight_break_date" ON "weight_break_analyses"("purchase_date");

-- CreateIndex
CREATE INDEX "idx_weight_break_region" ON "weight_break_analyses"("vendor_region");

-- CreateIndex
CREATE INDEX "idx_weight_break_season" ON "weight_break_analyses"("season");

-- CreateIndex
CREATE INDEX "idx_weight_break_vendor" ON "weight_break_analyses"("vendor_id");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_status_idx" ON "calendar_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "death_records_purchaseId_idx" ON "death_records"("purchaseId");

-- CreateIndex
CREATE INDEX "death_records_penId_idx" ON "death_records"("penId");

-- CreateIndex
CREATE INDEX "death_records_deathDate_idx" ON "death_records"("deathDate");

-- CreateIndex
CREATE INDEX "cash_flows_date_idx" ON "cash_flows"("date");

-- CreateIndex
CREATE INDEX "cash_flows_status_idx" ON "cash_flows"("status");

-- CreateIndex
CREATE INDEX "cash_flows_categoryId_idx" ON "cash_flows"("categoryId");

-- CreateIndex
CREATE INDEX "cash_flows_accountId_idx" ON "cash_flows"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "integrated_financial_analysis_referenceMonth_key" ON "integrated_financial_analysis"("referenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "sale_records_internalCode_key" ON "sale_records"("internalCode");

-- CreateIndex
CREATE INDEX "sale_records_saleDate_idx" ON "sale_records"("saleDate");

-- CreateIndex
CREATE INDEX "sale_records_buyerId_idx" ON "sale_records"("buyerId");

-- CreateIndex
CREATE INDEX "sale_records_penId_idx" ON "sale_records"("penId");

-- CreateIndex
CREATE INDEX "sale_records_purchaseId_idx" ON "sale_records"("purchaseId");

-- CreateIndex
CREATE INDEX "sale_records_status_idx" ON "sale_records"("status");

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "payer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_transportCompanyId_fkey" FOREIGN KEY ("transportCompanyId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cattle_purchases" ADD CONSTRAINT "cattle_purchases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_pen_links" ADD CONSTRAINT "lot_pen_links_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_pen_links" ADD CONSTRAINT "lot_pen_links_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_proportional_allocations" ADD CONSTRAINT "cost_proportional_allocations_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_protocols" ADD CONSTRAINT "health_protocols_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "health_protocols"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_records" ADD CONSTRAINT "feed_records_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_movements" ADD CONSTRAINT "lot_movements_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "payer_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "payer_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_saleRecordId_fkey" FOREIGN KEY ("saleRecordId") REFERENCES "sale_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_cash_expenses" ADD CONSTRAINT "non_cash_expenses_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_allocations" ADD CONSTRAINT "expense_allocations_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_allocations" ADD CONSTRAINT "revenue_allocations_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "revenues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "payer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES "bank_statements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_expense_fkey" FOREIGN KEY ("transactionId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_revenue_fkey" FOREIGN KEY ("transactionId") REFERENCES "revenues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_readings" ADD CONSTRAINT "weight_readings_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_interventions" ADD CONSTRAINT "health_interventions_cattlePurchaseId_fkey" FOREIGN KEY ("cattlePurchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_interventions" ADD CONSTRAINT "health_interventions_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_cattlePurchaseId_fkey" FOREIGN KEY ("cattlePurchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pen_movements" ADD CONSTRAINT "pen_movements_cattlePurchaseId_fkey" FOREIGN KEY ("cattlePurchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pen_movements" ADD CONSTRAINT "pen_movements_fromPenId_fkey" FOREIGN KEY ("fromPenId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pen_movements" ADD CONSTRAINT "pen_movements_toPenId_fkey" FOREIGN KEY ("toPenId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortality_analyses" ADD CONSTRAINT "mortality_analyses_cattle_purchase_id_fkey" FOREIGN KEY ("cattle_purchase_id") REFERENCES "cattle_purchases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mortality_analyses" ADD CONSTRAINT "mortality_analyses_pen_id_fkey" FOREIGN KEY ("pen_id") REFERENCES "pens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "weight_break_analyses" ADD CONSTRAINT "weight_break_analyses_cattle_purchase_id_fkey" FOREIGN KEY ("cattle_purchase_id") REFERENCES "cattle_purchases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "weight_break_analyses" ADD CONSTRAINT "weight_break_analyses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "death_records" ADD CONSTRAINT "death_records_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "death_records" ADD CONSTRAINT "death_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "death_records" ADD CONSTRAINT "death_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "payer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "payer_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrated_financial_analysis" ADD CONSTRAINT "integrated_financial_analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrated_analysis_items" ADD CONSTRAINT "integrated_analysis_items_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "integrated_financial_analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrated_analysis_items" ADD CONSTRAINT "integrated_analysis_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_analysis_config" ADD CONSTRAINT "financial_analysis_config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_penId_fkey" FOREIGN KEY ("penId") REFERENCES "pens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "cattle_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_receiverAccountId_fkey" FOREIGN KEY ("receiverAccountId") REFERENCES "payer_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_records" ADD CONSTRAINT "sale_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

