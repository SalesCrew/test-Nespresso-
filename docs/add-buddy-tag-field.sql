-- Add is_buddy_tag field to assignment_invitations table
-- This field marks invitations as buddy tags for special handling

ALTER TABLE public.assignment_invitations 
ADD COLUMN IF NOT EXISTS is_buddy_tag BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient buddy tag queries
CREATE INDEX IF NOT EXISTS idx_assignment_invitations_buddy_tag 
ON public.assignment_invitations(is_buddy_tag) 
WHERE is_buddy_tag = TRUE;
