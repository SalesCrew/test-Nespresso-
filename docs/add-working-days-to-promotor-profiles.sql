-- Add working_days column to promotor_profiles table and migrate data from applications

-- 1) Ensure column exists and is of type JSONB
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotor_profiles' AND column_name = 'working_days'
  ) THEN
    ALTER TABLE promotor_profiles ADD COLUMN working_days jsonb DEFAULT '[]'::jsonb;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotor_profiles' AND column_name = 'working_days' AND data_type <> 'jsonb'
  ) THEN
    -- Convert existing type (e.g., text[]) to jsonb
    ALTER TABLE promotor_profiles
      ALTER COLUMN working_days TYPE jsonb USING to_jsonb(working_days);
  END IF;
END $$;

-- 2) Migrate working_days data from applications to promotor_profiles
UPDATE promotor_profiles p
SET working_days = COALESCE((apps."workingDays")::jsonb, '[]'::jsonb)
FROM applications apps
WHERE p.application_id = apps.id
  AND (p.working_days IS NULL OR p.working_days = '[]'::jsonb);

-- 3) Create index for better performance on working_days queries
CREATE INDEX IF NOT EXISTS idx_promotor_profiles_working_days 
ON promotor_profiles USING GIN (working_days);
