-- RUN THIS SQL TO FIX THE VIEW
-- The issue is the view doesn't include special_status

DROP VIEW IF EXISTS public.assignments_with_buddy_info CASCADE;

CREATE VIEW public.assignments_with_buddy_info AS
SELECT 
  a.*,  -- This includes ALL columns from assignments including special_status
  lead_part.user_id as lead_user_id,
  lead_profile.display_name as lead_name,
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

-- TEST: Check if special_status column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
AND column_name = 'special_status';

-- If the column doesn't exist, create it:
-- ALTER TABLE public.assignments ADD COLUMN special_status text;
