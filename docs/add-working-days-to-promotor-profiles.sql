-- Add working_days column to promotor_profiles table and migrate data from applications

-- Add working_days column (JSONB array to store selected days)
ALTER TABLE promotor_profiles 
ADD COLUMN IF NOT EXISTS working_days JSONB DEFAULT '[]'::jsonb;

-- Migrate working_days data from applications to promotor_profiles
UPDATE promotor_profiles 
SET working_days = COALESCE(apps."workingDays", '[]'::jsonb)
FROM applications apps
WHERE promotor_profiles.application_id = apps.id
  AND promotor_profiles.working_days = '[]'::jsonb;

-- Create index for better performance on working_days queries
CREATE INDEX IF NOT EXISTS idx_promotor_profiles_working_days 
ON promotor_profiles USING GIN (working_days);
