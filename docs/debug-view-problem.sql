-- Debug warum die View keine Daten zeigt

-- 1. Check die assignment_participants Status
SELECT DISTINCT status FROM public.assignment_participants;

-- 2. Check ob die Participants die richtigen Status haben
SELECT 
  ap.assignment_id,
  ap.user_id,
  ap.role,
  ap.status,
  a.title
FROM public.assignment_participants ap
INNER JOIN public.assignments a ON ap.assignment_id = a.id
WHERE ap.assignment_id IN ('e42841d5-c46a-4dd8-8fb8-53f6a9edefdc', '4bba1771-728a-4c01-9eaa-bf3543f5c865');

-- 3. Check die assignment status
SELECT id, title, status FROM public.assignments 
WHERE id IN ('e42841d5-c46a-4dd8-8fb8-53f6a9edefdc', '4bba1771-728a-4c01-9eaa-bf3543f5c865');

-- 4. Test die View ohne die Status Filter
SELECT 
  a.id as assignment_id,
  a.title,
  ap.user_id,
  ap.status as participant_status,
  a.status as assignment_status,
  up.display_name as promotor_name,
  DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') as assignment_date,
  CURRENT_DATE as today
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
WHERE DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE;

-- 5. Check was gefiltert wird
SELECT 
  a.id,
  a.title,
  ap.status as participant_status,
  a.status as assignment_status,
  ap.status NOT IN ('verplant', 'buddy') as participant_ok,
  a.status NOT IN ('cancelled', 'completed') as assignment_ok
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
WHERE DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE;
