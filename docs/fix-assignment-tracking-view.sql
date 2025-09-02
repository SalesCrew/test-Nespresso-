-- Fix assignment tracking view to use correct user_profiles columns

-- Drop the existing view
DROP VIEW IF EXISTS public.todays_assignments;

-- Recreate view with correct column references
CREATE OR REPLACE VIEW public.todays_assignments AS
SELECT 
  a.id as assignment_id,
  a.title,
  a.location_text,
  a.postal_code,
  a.city,
  a.start_ts as planned_start,
  a.end_ts as planned_end,
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
  -- Calculate display status
  CASE 
    WHEN at.status IN ('krankenstand', 'urlaub', 'zeitausgleich') THEN at.status::text
    WHEN at.status = 'beendet' THEN 'beendet'
    WHEN at.status = 'gestartet' THEN 'gestartet'
    WHEN at.status = 'verspätet' THEN 'verspätet'
    WHEN a.start_ts > now() THEN 'pending'
    WHEN a.start_ts <= now() AND at.actual_start_time IS NULL THEN 'verspätet'
    ELSE 'pending'
  END as display_status
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
LEFT JOIN public.assignment_tracking at ON a.id = at.assignment_id AND ap.user_id = at.user_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
LEFT JOIN public.user_profiles bup ON at.buddy_user_id = bup.user_id
WHERE 
  DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
  AND ap.status NOT IN ('verplant', 'buddy')  -- Exclude these statuses
  AND a.status NOT IN ('cancelled', 'completed');

-- Grant access to view
GRANT SELECT ON public.todays_assignments TO authenticated;
