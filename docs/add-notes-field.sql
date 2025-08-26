-- Add notes field to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS notes text;

-- Also add more status values to the assignment_status enum if they don't exist
-- Note: This needs to be done in a separate transaction for PostgreSQL

-- First, check what statuses are missing and add them
DO $$ 
BEGIN
  -- Add 'krankenstand' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'krankenstand' AND enumtypid = 'assignment_status'::regtype) THEN
    ALTER TYPE assignment_status ADD VALUE 'krankenstand';
  END IF;
END $$;

-- Run these in separate transactions:
-- ALTER TYPE assignment_status ADD VALUE 'notfall';
-- ALTER TYPE assignment_status ADD VALUE 'urlaub';
-- ALTER TYPE assignment_status ADD VALUE 'zeitausgleich';
-- ALTER TYPE assignment_status ADD VALUE 'markierte';
-- ALTER TYPE assignment_status ADD VALUE 'bestätigt';
-- ALTER TYPE assignment_status ADD VALUE 'geplant';
