-- Simplified Assignment Invitations Schema v2
-- This migration updates the assignment_invitations table to be the single source of truth

-- 1) Add new columns to assignment_invitations
ALTER TABLE public.assignment_invitations 
ADD COLUMN IF NOT EXISTS process_stage text 
  CHECK (process_stage IN ('select_assignment', 'waiting', 'declined', 'accepted', 'partially_accepted'));

ALTER TABLE public.assignment_invitations 
ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

ALTER TABLE public.assignment_invitations 
ADD COLUMN IF NOT EXISTS replacement_for uuid REFERENCES public.assignment_invitations(id);

ALTER TABLE public.assignment_invitations 
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 2) Create a view for active processes per user
CREATE OR REPLACE VIEW public.user_assignment_processes AS
SELECT 
  user_id,
  MAX(CASE 
    WHEN status = 'invited' AND responded_at IS NULL THEN 'select_assignment'
    WHEN status = 'applied' AND process_stage IS NULL THEN 'waiting'
    WHEN status = 'rejected' AND acknowledged_at IS NULL THEN 'declined'
    WHEN status = 'accepted' AND acknowledged_at IS NULL THEN 'accepted'
    WHEN status IN ('accepted', 'rejected') AND acknowledged_at IS NOT NULL THEN NULL
    ELSE process_stage
  END) as current_stage,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NULL) as original_assignment_ids,
  array_agg(DISTINCT assignment_id) FILTER (WHERE replacement_for IS NOT NULL) as replacement_assignment_ids,
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN assignment_id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN status = 'rejected' THEN assignment_id END) as rejected_count,
  COUNT(DISTINCT assignment_id) as total_count
FROM public.assignment_invitations
WHERE acknowledged_at IS NULL OR (status IN ('invited', 'applied'))
GROUP BY user_id;

-- 3) Function to get user's current process state
CREATE OR REPLACE FUNCTION public.get_user_process_state(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'stage', current_stage,
    'original_ids', original_assignment_ids,
    'replacement_ids', replacement_assignment_ids,
    'accepted_count', accepted_count,
    'rejected_count', rejected_count,
    'has_partial', accepted_count > 0 AND rejected_count > 0
  )
  FROM public.user_assignment_processes
  WHERE user_id = p_user_id;
$$;

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_user_stage 
ON public.assignment_invitations(user_id, process_stage) 
WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_replacement 
ON public.assignment_invitations(replacement_for);

-- 5) Grant permissions
GRANT SELECT ON public.user_assignment_processes TO authenticated;
