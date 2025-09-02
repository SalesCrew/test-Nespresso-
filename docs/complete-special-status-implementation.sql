-- Complete implementation of special_status column
-- This allows assignments to be "assigned" but also have special statuses like Urlaub, Krankenstand

-- 1. Add special_status column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS special_status text;

-- 2. Update the assignments_with_buddy_info view to include special_status
DROP VIEW IF EXISTS public.assignments_with_buddy_info CASCADE;

CREATE OR REPLACE VIEW public.assignments_with_buddy_info AS
SELECT 
  a.*,
  -- Include the new special_status column
  a.special_status,
  -- Lead promotor info
  lead_part.user_id as lead_user_id,
  lead_profile.display_name as lead_name,
  -- Buddy info
  buddy_profile.display_name as buddy_display_name,
  CASE 
    WHEN a.status = 'buddy_tag' THEN CONCAT(COALESCE(lead_profile.display_name, 'Promotor'), ' & ', COALESCE(a.buddy_name, buddy_profile.display_name, 'Buddy'))
    ELSE lead_profile.display_name
  END as display_name
FROM public.assignments a
LEFT JOIN public.assignment_participants lead_part ON a.id = lead_part.assignment_id AND lead_part.role = 'lead'
LEFT JOIN public.user_profiles lead_profile ON lead_part.user_id = lead_profile.user_id
LEFT JOIN public.user_profiles buddy_profile ON a.buddy_user_id = buddy_profile.user_id;

GRANT SELECT ON public.assignments_with_buddy_info TO authenticated;

-- 3. Update todays_assignments view to include special_status
DROP VIEW IF EXISTS public.todays_assignments;

CREATE VIEW public.todays_assignments AS
SELECT 
  a.id as assignment_id,
  a.title,
  a.location_text,
  a.postal_code,
  a.city,
  a.start_ts as planned_start,
  a.end_ts as planned_end,
  a.special_status,
  ap.user_id,
  ap.role,
  ap.status as participant_status,
  up.display_name as promotor_name,
  at.id as tracking_id,
  at.buddy_user_id,
  bup.display_name as buddy_name,
  at.actual_start_time,
  at.actual_end_time,
  at.status as tracking_status,
  at.notes,
  -- Calculate display status - check special_status first
  CASE 
    WHEN a.special_status IS NOT NULL THEN a.special_status
    WHEN at.status IN ('krankenstand', 'urlaub', 'zeitausgleich', 'notfall') THEN at.status::text
    WHEN at.status = 'beendet' THEN 'beendet'
    WHEN at.status = 'gestartet' THEN 'gestartet'
    WHEN at.status = 'verspätet' THEN 'verspätet'
    WHEN a.start_ts > now() THEN 'pending'
    WHEN a.start_ts <= now() AND at.actual_start_time IS NULL THEN 'verspätet'
    ELSE 'pending'
  END as display_status
FROM public.assignments a
-- Key change: INNER JOIN ensures only assignments with participants are shown
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id AND ap.role = 'lead'
LEFT JOIN public.assignment_tracking at ON a.id = at.assignment_id AND ap.user_id = at.user_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
-- Join for buddy
LEFT JOIN public.assignment_participants buddy_ap ON a.id = buddy_ap.assignment_id AND buddy_ap.role = 'buddy'
LEFT JOIN public.user_profiles bup ON buddy_ap.user_id = bup.user_id
WHERE 
  DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
  AND (ap.status IS NULL OR ap.status NOT IN ('verplant', 'buddy'))
  AND a.status NOT IN ('cancelled', 'completed');

-- Grant access
GRANT SELECT ON public.todays_assignments TO authenticated;

-- 4. Create index for performance on special_status
CREATE INDEX IF NOT EXISTS idx_assignments_special_status 
ON public.assignments(special_status) 
WHERE special_status IS NOT NULL;

-- How it works:
-- 1. When setting Urlaub, Krankenstand etc, it saves to special_status column
-- 2. The assignment can remain "assigned" status with a promotor
-- 3. UI displays special_status when it exists, otherwise shows regular status
-- 4. This prevents status conflicts when assigning/removing promotors
