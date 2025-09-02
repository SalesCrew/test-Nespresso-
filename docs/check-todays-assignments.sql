-- Check if there are assignments for today

-- 1. Check all assignments
SELECT COUNT(*) as total_assignments FROM public.assignments;

-- 2. Check assignments for today
SELECT 
  a.id,
  a.title,
  a.location_text,
  a.start_ts,
  a.end_ts,
  a.status
FROM public.assignments a
WHERE DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
ORDER BY a.start_ts;

-- 3. Check assignment participants for today
SELECT 
  ap.assignment_id,
  ap.user_id,
  ap.role,
  ap.status,
  up.display_name
FROM public.assignment_participants ap
INNER JOIN public.assignments a ON ap.assignment_id = a.id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
WHERE DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
ORDER BY a.start_ts;

-- 4. Manually create tracking records for today's assignments (if needed)
-- This is what the function check_and_update_tracking_status() does automatically
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
  AND ap.status NOT IN ('verplant', 'buddy')
  AND NOT EXISTS (
    SELECT 1 FROM public.assignment_tracking at 
    WHERE at.assignment_id = ap.assignment_id 
    AND at.user_id = ap.user_id
  );
