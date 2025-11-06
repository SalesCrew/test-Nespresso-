-- Add opening_hours column to markets table
-- This column stores opening hours for each day of the week in JSONB format
-- Expected structure:
-- {
--   "monday": "08:00 - 18:00",
--   "tuesday": "08:00 - 18:00",
--   "wednesday": "08:00 - 18:00",
--   "thursday": "08:00 - 18:00",
--   "friday": "08:00 - 20:00",
--   "saturday": "09:00 - 17:00",
--   "sunday": "Geschlossen"
-- }
-- Can also support arrays for multiple time slots per day
-- Alternative: Simple string for uniform hours across all days

ALTER TABLE markets
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT NULL;

COMMENT ON COLUMN markets.opening_hours IS 'Opening hours for the market. Can be JSONB object with days as keys, array of time slots, or uniform string for all days.';

