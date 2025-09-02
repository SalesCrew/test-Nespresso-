-- Final fix for todays_assignments to only show assignments with actual participants

-- 1. Drop and recreate the view with proper filtering
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

-- 2. Update the function to clean up orphaned tracking records
CREATE OR REPLACE FUNCTION public.check_and_update_tracking_status()
RETURNS void AS $$
BEGIN
  -- First, delete tracking records where no lead participant exists
  DELETE FROM public.assignment_tracking at
  WHERE NOT EXISTS (
    SELECT 1 FROM public.assignment_participants ap
    WHERE ap.assignment_id = at.assignment_id
    AND ap.user_id = at.user_id
    AND ap.role = 'lead'
  );

  -- Update status to 'verspätet' for assignments that should have started
  UPDATE public.assignment_tracking at
  SET status = 'verspätet'
  FROM public.assignments a
  WHERE 
    at.assignment_id = a.id
    AND at.status = 'pending'
    AND at.actual_start_time IS NULL
    AND a.start_ts <= now();

  -- Create tracking records for today's assignments that don't have them yet
  INSERT INTO public.assignment_tracking (assignment_id, user_id, status)
  SELECT 
    ap.assignment_id,
    ap.user_id,
    CASE 
      WHEN a.start_ts > now() THEN 'pending'::tracking_status
      ELSE 'verspätet'::tracking_status
    END
  FROM public.assignment_participants ap
  INNER JOIN public.assignments a ON ap.assignment_id = a.id
  WHERE 
    DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
    AND (ap.status IS NULL OR ap.status NOT IN ('verplant', 'buddy'))
    AND ap.role = 'lead'
    AND NOT EXISTS (
      SELECT 1 FROM public.assignment_tracking at 
      WHERE at.assignment_id = ap.assignment_id 
      AND at.user_id = ap.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_and_update_tracking_status() TO authenticated;