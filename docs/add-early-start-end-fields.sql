-- Add early start and early end reasoning fields to assignment_tracking table

-- Add fields for early start reasoning
ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS early_start_reason text;

ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS minutes_early_start integer;

-- Add fields for early end reasoning  
ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS early_end_reason text;

ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS minutes_early_end integer;

-- Add fields for photo URLs
ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS foto_maschine_url text;

ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS foto_kapsellade_url text;

ALTER TABLE public.assignment_tracking 
ADD COLUMN IF NOT EXISTS foto_pos_gesamt_url text;

-- Update the todays_assignments view to include these fields
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
  at.early_start_reason,
  at.minutes_early_start,
  at.early_end_reason,
  at.minutes_early_end,
  at.foto_maschine_url,
  at.foto_kapsellade_url,
  at.foto_pos_gesamt_url,
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
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id AND ap.role = 'lead'
LEFT JOIN public.assignment_tracking at ON a.id = at.assignment_id AND ap.user_id = at.user_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
LEFT JOIN public.assignment_participants buddy_ap ON a.id = buddy_ap.assignment_id AND buddy_ap.role = 'buddy'
LEFT JOIN public.user_profiles bup ON buddy_ap.user_id = bup.user_id
WHERE 
  DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
  AND (ap.status IS NULL OR ap.status NOT IN ('verplant', 'buddy'))
  AND a.status NOT IN ('cancelled', 'completed');

GRANT SELECT ON public.todays_assignments TO authenticated;
