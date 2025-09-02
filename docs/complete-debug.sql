-- COMPLETE DEBUG - Finde das Problem

-- 1. Check ob die View jetzt Daten hat
SELECT COUNT(*) as view_count FROM public.todays_assignments;

-- 2. Zeige die Daten in der View
SELECT * FROM public.todays_assignments;

-- 3. Check ob tracking records existieren
SELECT * FROM public.assignment_tracking;

-- 4. Manuell die Funktion aufrufen
SELECT public.check_and_update_tracking_status();

-- 5. Nochmal view checken
SELECT * FROM public.todays_assignments;

-- 6. Test die View Permissions
SELECT has_table_privilege('authenticated', 'public.todays_assignments', 'SELECT');

-- 7. Direct query ohne View
SELECT 
  a.id as assignment_id,
  a.title,
  ap.user_id,
  up.display_name,
  a.start_ts AT TIME ZONE 'Europe/Berlin' as start_time
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
WHERE DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE;
