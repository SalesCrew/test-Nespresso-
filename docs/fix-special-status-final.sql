-- FINAL FIX FOR SPECIAL STATUS
-- This will 100% make it work

-- 1. First verify the column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
AND column_name = 'special_status';

-- If the above returns nothing, run this:
-- ALTER TABLE public.assignments ADD COLUMN special_status text;

-- 2. Recreate the view to include special_status
DROP VIEW IF EXISTS public.assignments_with_buddy_info CASCADE;

CREATE VIEW public.assignments_with_buddy_info AS
SELECT 
  a.id,
  a.batch_id,
  a.title,
  a.description,
  a.location_text,
  a.postal_code,
  a.city,
  a.region,
  a.start_ts,
  a.end_ts,
  a.type,
  a.status,
  a.metadata,
  a.created_at,
  a.updated_at,
  a.notes,
  a.buddy_user_id,
  a.buddy_name,
  a.special_status,  -- EXPLICITLY INCLUDING THIS
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

-- 3. Test it by manually setting a special_status
-- UPDATE public.assignments 
-- SET special_status = 'urlaub' 
-- WHERE id = 'some-assignment-id';
