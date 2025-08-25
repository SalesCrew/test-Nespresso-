-- Fix replacement invitations to properly link to original invitations
-- This ensures we keep the original rejected invitation and create new rows for replacements

-- First, let's add an index to make replacement_for queries efficient
CREATE INDEX IF NOT EXISTS idx_assignment_invitations_replacement_for 
ON public.assignment_invitations(replacement_for) 
WHERE replacement_for IS NOT NULL;

-- Update the view to handle replacements properly
CREATE OR REPLACE VIEW public.user_assignment_processes AS
SELECT 
  user_id,
  MAX(CASE 
    WHEN status = 'invited' AND responded_at IS NULL THEN 'select_assignment'
    WHEN status = 'applied' AND process_stage IS NULL THEN 'waiting'
    WHEN status = 'rejected' AND acknowledged_at IS NULL THEN 'declined'
    WHEN status = 'accepted' AND acknowledged_at IS NULL THEN 'accepted'
    WHEN status = 'verstanden' THEN NULL  -- Exclude verstanden from active processes
    WHEN status IN ('accepted', 'rejected') AND acknowledged_at IS NOT NULL THEN NULL
    ELSE process_stage
  END) as current_stage,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NULL AND status != 'verstanden') as original_assignment_ids,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NOT NULL AND status != 'verstanden') as replacement_assignment_ids,
  COUNT(DISTINCT CASE WHEN status = 'accepted' AND acknowledged_at IS NULL THEN assignment_id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN status = 'rejected' AND acknowledged_at IS NULL THEN assignment_id END) as rejected_count,
  COUNT(DISTINCT assignment_id) FILTER (WHERE status != 'verstanden') as total_count
FROM public.assignment_invitations
WHERE (acknowledged_at IS NULL OR (status IN ('invited', 'applied'))) 
  AND status != 'verstanden'
GROUP BY user_id;

-- Important note: When creating replacement invitations, ensure:
-- 1. The original invitation keeps its status as 'rejected'
-- 2. New invitation rows are created with replacement_for = original_invitation.id
-- 3. The new invitations have status = 'invited' and fresh timestamps
