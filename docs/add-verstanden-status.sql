-- Add 'verstanden' to the invitation_status enum
-- This requires running in separate transactions due to PostgreSQL limitations

-- STEP 1: Run this first and commit
ALTER TYPE invitation_status ADD VALUE IF NOT EXISTS 'verstanden';

-- STEP 2: Then run this in a new transaction
-- Update the view to exclude verstanden status
CREATE OR REPLACE VIEW public.user_assignment_processes AS
SELECT 
  user_id,
  MAX(CASE 
    WHEN status = 'invited' AND responded_at IS NULL THEN 'select_assignment'
    WHEN status = 'applied' AND process_stage IS NULL THEN 'waiting'
    WHEN status = 'rejected' AND acknowledged_at IS NULL THEN 'declined'
    WHEN status = 'accepted' AND acknowledged_at IS NULL THEN 'accepted'
    WHEN status = 'verstanden' THEN NULL -- Verstanden assignments are complete
    WHEN status IN ('accepted', 'rejected') AND acknowledged_at IS NOT NULL THEN NULL
    ELSE process_stage
  END) as current_stage,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NULL AND status != 'verstanden') as original_assignment_ids,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NOT NULL AND status != 'verstanden') as replacement_assignment_ids,
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN assignment_id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN status = 'rejected' THEN assignment_id END) as rejected_count,
  COUNT(DISTINCT assignment_id) FILTER (WHERE status != 'verstanden') as total_count
FROM public.assignment_invitations
WHERE (acknowledged_at IS NULL OR status IN ('invited', 'applied')) AND status != 'verstanden'
GROUP BY user_id;