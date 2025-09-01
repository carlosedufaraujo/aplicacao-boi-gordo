-- Migration: Simplify Status System
-- Remove stage field and use only status with flow: CONFIRMED -> RECEIVED -> CONFINED -> SOLD

-- Step 1: Update existing status values based on stage
UPDATE "CattlePurchase"
SET status = 
  CASE 
    WHEN stage = 'confirmed' THEN 'CONFIRMED'::text
    WHEN stage = 'in_transit' THEN 'RECEIVED'::text
    WHEN stage = 'active' THEN 'CONFINED'::text
    WHEN stage = 'confined' THEN 'CONFINED'::text
    WHEN stage = 'sold' THEN 'SOLD'::text
    ELSE status
  END
WHERE stage IS NOT NULL;

-- Step 2: Drop the stage column
ALTER TABLE "CattlePurchase" DROP COLUMN IF EXISTS stage;

-- Step 3: Ensure status column has proper constraint
ALTER TABLE "CattlePurchase" 
ALTER COLUMN status SET NOT NULL;

-- Step 4: Update enum type if needed (this may already be correct)
-- Note: PurchaseStatus enum should have: CONFIRMED, RECEIVED, CONFINED, SOLD, CANCELLED

-- Show completion message
SELECT 'Migration completed: Status system simplified' as message;