-- Fix buddy tag acceptance to preserve lead promotor information
-- This ensures that when a buddy tag is accepted, the original lead promotor remains assigned
-- Version 2: Simplified syntax for better compatibility

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.handle_buddy_tag_acceptance(uuid, uuid, text);

-- Create the updated function
CREATE FUNCTION public.handle_buddy_tag_acceptance(
  p_assignment_id uuid,
  p_buddy_user_id uuid,
  p_buddy_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_lead_user_id uuid;
  v_existing_lead_name text;
BEGIN
  -- First, check if there's already a lead participant
  SELECT ap.user_id, up.display_name 
  INTO v_existing_lead_user_id, v_existing_lead_name
  FROM public.assignment_participants ap
  LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
  WHERE ap.assignment_id = p_assignment_id 
    AND ap.role = 'lead'
  LIMIT 1;
  
  -- Update the assignment status to buddy_tag and store buddy info
  UPDATE public.assignments 
  SET 
    status = 'buddy_tag',
    buddy_user_id = p_buddy_user_id,
    buddy_name = p_buddy_name,
    updated_at = now()
  WHERE id = p_assignment_id;
  
  -- Insert buddy as participant
  INSERT INTO public.assignment_participants (assignment_id, user_id, role, chosen_by_admin, chosen_at)
  VALUES (p_assignment_id, p_buddy_user_id, 'buddy', true, now())
  ON CONFLICT (assignment_id, user_id) 
  DO UPDATE SET 
    role = 'buddy',
    chosen_by_admin = true,
    chosen_at = now();
  
  -- IMPORTANT: Ensure lead participant exists if there was one
  -- This prevents the lead from disappearing when a buddy is added
  IF v_existing_lead_user_id IS NOT NULL THEN
    -- First try to update if exists
    UPDATE public.assignment_participants 
    SET role = 'lead'
    WHERE assignment_id = p_assignment_id 
      AND user_id = v_existing_lead_user_id;
    
    -- If no rows were updated, insert
    IF NOT FOUND THEN
      INSERT INTO public.assignment_participants (assignment_id, user_id, role, chosen_by_admin, chosen_at)
      VALUES (p_assignment_id, v_existing_lead_user_id, 'lead', true, now());
    END IF;
  END IF;
    
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_buddy_tag_acceptance TO authenticated;
