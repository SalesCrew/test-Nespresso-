-- Buddy Tag System Database Migration - STEP 2
-- Run this AFTER step 1 has been committed
-- This contains all the logic that uses the new 'buddy_tag' enum value

-- 1) Add buddy_name field to assignments table to store the buddy's name
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS buddy_name text;

-- 2) Add buddy_user_id to store reference to the buddy user
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS buddy_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3) Create function to handle buddy tag acceptance
CREATE OR REPLACE FUNCTION public.handle_buddy_tag_acceptance(
  p_assignment_id uuid,
  p_buddy_user_id uuid,
  p_buddy_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the assignment status to buddy_tag and store buddy info
  UPDATE public.assignments 
  SET 
    status = 'buddy_tag',
    buddy_user_id = p_buddy_user_id,
    buddy_name = p_buddy_name,
    updated_at = now()
  WHERE id = p_assignment_id;
  
  -- Insert buddy as participant if not exists
  INSERT INTO public.assignment_participants (assignment_id, user_id, role, chosen_by_admin, chosen_at)
  VALUES (p_assignment_id, p_buddy_user_id, 'buddy', true, now())
  ON CONFLICT (assignment_id, user_id) 
  DO UPDATE SET 
    role = 'buddy',
    chosen_by_admin = true,
    chosen_at = now();
    
  -- Mark all other buddy tag invitations for this assignment as withdrawn
  UPDATE public.assignment_invitations 
  SET 
    status = 'withdrawn',
    responded_at = now()
  WHERE assignment_id = p_assignment_id 
    AND is_buddy_tag = true 
    AND user_id != p_buddy_user_id 
    AND status NOT IN ('accepted', 'withdrawn');
END;
$$;

-- 4) Create trigger to automatically handle buddy tag acceptance
CREATE OR REPLACE FUNCTION public.auto_handle_buddy_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  buddy_display_name text;
BEGIN
  -- Only trigger for buddy tag invitations that just became accepted
  IF NEW.is_buddy_tag = true 
     AND NEW.status = 'accepted' 
     AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Get the buddy's display name
    SELECT up.display_name INTO buddy_display_name
    FROM public.user_profiles up
    WHERE up.user_id = NEW.user_id;
    
    -- Handle the buddy tag acceptance
    PERFORM public.handle_buddy_tag_acceptance(
      NEW.assignment_id,
      NEW.user_id,
      COALESCE(buddy_display_name, 'Buddy')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger for assignment_invitations
DROP TRIGGER IF EXISTS trg_buddy_tag_acceptance ON public.assignment_invitations;
CREATE TRIGGER trg_buddy_tag_acceptance
  AFTER UPDATE ON public.assignment_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_handle_buddy_tags();

-- 5) Update the user_assignment_processes view to exclude buddy tags from normal flow
CREATE OR REPLACE VIEW public.user_assignment_processes AS
SELECT 
  user_id,
  MAX(CASE 
    WHEN status = 'invited' AND responded_at IS NULL AND is_buddy_tag = false THEN 'select_assignment'
    WHEN status = 'applied' AND process_stage IS NULL AND is_buddy_tag = false THEN 'waiting'
    WHEN status = 'rejected' AND acknowledged_at IS NULL AND is_buddy_tag = false THEN 'declined'
    WHEN status = 'accepted' AND acknowledged_at IS NULL AND is_buddy_tag = false THEN 'accepted'
    WHEN status IN ('accepted', 'rejected') AND acknowledged_at IS NOT NULL AND is_buddy_tag = false THEN NULL
    ELSE process_stage
  END) as current_stage,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NULL AND is_buddy_tag = false) as original_assignment_ids,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NOT NULL AND is_buddy_tag = false) as replacement_assignment_ids,
  COUNT(DISTINCT CASE WHEN status = 'accepted' AND is_buddy_tag = false THEN assignment_id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN status = 'rejected' AND is_buddy_tag = false THEN assignment_id END) as rejected_count,
  COUNT(DISTINCT assignment_id) FILTER (WHERE is_buddy_tag = false) as total_count
FROM public.assignment_invitations
WHERE (acknowledged_at IS NULL OR (status IN ('invited', 'applied'))) 
  AND (status NOT IN ('verstanden', 'rejected_handled') OR is_buddy_tag = true)
GROUP BY user_id;

-- 6) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_buddy_user 
ON public.assignments(buddy_user_id) 
WHERE buddy_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_status_buddy 
ON public.assignments(status) 
WHERE status = 'buddy_tag';

-- 7) Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_buddy_tag_acceptance TO authenticated;
GRANT SELECT ON public.user_assignment_processes TO authenticated;

-- 8) Create view for admin to see assignments with buddy information
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
