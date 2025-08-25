-- Add 'verstanden' to the invitation_status enum
-- This allows tracking when a user has acknowledged their assignment

-- First, we need to check what status values are currently allowed
-- If using an enum type:
ALTER TYPE invitation_status ADD VALUE IF NOT EXISTS 'verstanden';

-- If using a CHECK constraint, we need to drop and recreate it:
-- First drop the existing constraint (adjust the name if different)
ALTER TABLE public.assignment_invitations 
DROP CONSTRAINT IF EXISTS assignment_invitations_status_check;

-- Add the new constraint with 'verstanden' included
ALTER TABLE public.assignment_invitations 
ADD CONSTRAINT assignment_invitations_status_check 
CHECK (status IN ('invited', 'applied', 'withdrawn', 'accepted', 'rejected', 'verstanden'));

-- Update the process_stage view to handle verstanden status
-- The view should treat verstanden as a completed state (no active process)