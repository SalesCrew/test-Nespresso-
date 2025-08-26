-- Add all missing status values to assignment_status enum
-- These need to be run in separate transactions due to PostgreSQL enum limitations

-- Step 1: Add krankenstand (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'krankenstand' AND enumtypid = 'assignment_status'::regtype) THEN
    ALTER TYPE assignment_status ADD VALUE 'krankenstand';
  END IF;
END $$;

-- Step 2: Add notfall (run this after step 1 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'notfall' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'notfall';
--   END IF;
-- END $$;

-- Step 3: Add urlaub (run this after step 2 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'urlaub' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'urlaub';
--   END IF;
-- END $$;

-- Step 4: Add zeitausgleich (run this after step 3 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'zeitausgleich' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'zeitausgleich';
--   END IF;
-- END $$;

-- Step 5: Add markierte (run this after step 4 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'markierte' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'markierte';
--   END IF;
-- END $$;

-- Step 6: Add bestätigt (run this after step 5 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bestätigt' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'bestätigt';
--   END IF;
-- END $$;

-- Step 7: Add geplant (run this after step 6 is committed)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'geplant' AND enumtypid = 'assignment_status'::regtype) THEN
--     ALTER TYPE assignment_status ADD VALUE 'geplant';
--   END IF;
-- END $$;

-- Instructions:
-- 1. First run the uncommented krankenstand section above
-- 2. Then uncomment and run each subsequent section one by one
-- 3. Each must be committed before running the next one
