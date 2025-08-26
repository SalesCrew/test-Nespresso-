-- Refresh the assignments_with_buddy_info view to include notes field
-- Drop and recreate the view to ensure it includes the notes column

DROP VIEW IF EXISTS public.assignments_with_buddy_info CASCADE;

CREATE OR REPLACE VIEW public.assignments_with_buddy_info AS
SELECT 
  a.*,
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
