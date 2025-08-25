-- Add 'rejected_handled' status for original rejected invitations after replacement is submitted
-- This prevents the original rejection from triggering the declined UI state

-- STEP 1: Run this first and COMMIT
-- Add the new status to the enum
ALTER TYPE public.invitation_status ADD VALUE IF NOT EXISTS 'rejected_handled' AFTER 'verstanden';

-- STEP 2: Run this in a SEPARATE transaction after Step 1 is committed
-- Update the view to exclude rejected_handled from active processes
/*
CREATE OR REPLACE VIEW public.user_assignment_processes AS
SELECT 
  user_id,
  MAX(CASE 
    WHEN status = 'invited' AND responded_at IS NULL THEN 'select_assignment'
    WHEN status = 'applied' AND process_stage IS NULL THEN 'waiting'
    WHEN status = 'rejected' AND acknowledged_at IS NULL THEN 'declined'
    WHEN status = 'accepted' AND acknowledged_at IS NULL THEN 'accepted'
    WHEN status IN ('verstanden', 'rejected_handled') THEN NULL  -- Exclude both from active processes
    WHEN status IN ('accepted', 'rejected') AND acknowledged_at IS NOT NULL THEN NULL
    ELSE process_stage
  END) as current_stage,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NULL AND status NOT IN ('verstanden', 'rejected_handled')) as original_assignment_ids,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NOT NULL AND status NOT IN ('verstanden', 'rejected_handled')) as replacement_assignment_ids,
  COUNT(DISTINCT CASE WHEN status = 'accepted' AND acknowledged_at IS NULL THEN assignment_id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN status = 'rejected' AND acknowledged_at IS NULL THEN assignment_id END) as rejected_count,
  COUNT(DISTINCT assignment_id) FILTER (WHERE status NOT IN ('verstanden', 'rejected_handled')) as total_count
FROM public.assignment_invitations
WHERE (acknowledged_at IS NULL OR (status IN ('invited', 'applied'))) 
  AND status NOT IN ('verstanden', 'rejected_handled')
GROUP BY user_id;
*/
