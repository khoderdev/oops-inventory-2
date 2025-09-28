-- Remove unique constraint on date field to allow multiple day operations per date
-- This migration removes the old unique constraint that prevents multiple sessions per day

-- First, let's see what constraints exist
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public."DayOperations"'::regclass
AND contype = 'u';

-- Drop the unique constraint on date field
-- The constraint name might vary, so we'll try common patterns
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name for the date field unique constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'public."DayOperations"'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%date%'
    AND pg_get_constraintdef(oid) NOT LIKE '%uniqueId%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public."DayOperations" DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No date unique constraint found to drop';
    END IF;
END $$;

-- Verify the constraint is gone
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public."DayOperations"'::regclass
AND contype = 'u';

-- The composite unique constraint on (date, uniqueId) should remain
-- This ensures uniqueness per session while allowing multiple sessions per date
