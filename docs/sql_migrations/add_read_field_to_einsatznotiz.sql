-- Add read boolean field to einsatznotiz_promotor table
-- This tracks whether the promotor has seen the note (first dismiss marks it read)

ALTER TABLE public.einsatznotiz_promotor 
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on unread notes
CREATE INDEX IF NOT EXISTS idx_einsatznotiz_promotor_read 
ON public.einsatznotiz_promotor(read) 
WHERE read = false;

-- Optional: Add index on assignment_id + read for compound queries
CREATE INDEX IF NOT EXISTS idx_einsatznotiz_promotor_assignment_read 
ON public.einsatznotiz_promotor(assignment_id, read);

