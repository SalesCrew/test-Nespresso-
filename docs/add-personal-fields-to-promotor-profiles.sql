-- Add personal data fields to promotor_profiles table
-- This moves birthday, socialSecurityNumber, and citizenship from applications to promotor_profiles
-- for better admin editability and consistency

-- Add the new columns to promotor_profiles
ALTER TABLE promotor_profiles 
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS social_security_number TEXT,
ADD COLUMN IF NOT EXISTS citizenship TEXT;

-- Migrate existing data from applications to promotor_profiles
-- This copies data for all existing promotor profiles that have an application_id
UPDATE promotor_profiles 
SET 
  birth_date = apps.birthDate,
  social_security_number = apps.socialSecurityNumber,
  citizenship = apps.citizenship
FROM applications apps
WHERE promotor_profiles.application_id = apps.id
  AND promotor_profiles.application_id IS NOT NULL
  AND (
    promotor_profiles.birth_date IS NULL OR 
    promotor_profiles.social_security_number IS NULL OR 
    promotor_profiles.citizenship IS NULL
  );

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_promotor_profiles_personal_data 
ON promotor_profiles(birth_date, social_security_number, citizenship);

-- Note: The existing RLS policies for promotor_profiles will automatically
-- apply to these new fields, so admin_staff users can edit them.
