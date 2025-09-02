-- Debug: Check what the view returns

-- 1. Check current date and timezone
SELECT 
  CURRENT_DATE as current_date,
  NOW() as current_timestamp,
  NOW() AT TIME ZONE 'Europe/Berlin' as berlin_time;

-- 2. Check raw assignment dates
SELECT 
  id,
  title,
  start_ts,
  start_ts AT TIME ZONE 'Europe/Berlin' as berlin_start,
  DATE(start_ts AT TIME ZONE 'Europe/Berlin') as assignment_date,
  CURRENT_DATE as today
FROM public.assignments
WHERE id IN ('e42841d5-c46a-4dd8-8fb8-53f6a9edefdc', '4bba1771-728a-4c01-9eaa-bf3543f5c865');

-- 3. Check what the view returns
SELECT * FROM public.todays_assignments;

-- 4. If view is empty, check without date filter
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
  at.notes
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
LEFT JOIN public.assignment_tracking at ON a.id = at.assignment_id AND ap.user_id = at.user_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
LEFT JOIN public.user_profiles bup ON at.buddy_user_id = bup.user_id
WHERE a.id IN ('e42841d5-c46a-4dd8-8fb8-53f6a9edefdc', '4bba1771-728a-4c01-9eaa-bf3543f5c865');
