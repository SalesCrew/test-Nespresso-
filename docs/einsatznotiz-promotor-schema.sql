-- Create einsatznotiz_promotor table for assignment-specific notes visible to promotors
CREATE TABLE IF NOT EXISTS public.einsatznotiz_promotor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraint (if assignments table exists)
  -- CONSTRAINT fk_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- Create index for faster lookups by assignment_id
CREATE INDEX IF NOT EXISTS idx_einsatznotiz_promotor_assignment ON public.einsatznotiz_promotor(assignment_id);

-- Create index for faster lookups by updated_at
CREATE INDEX IF NOT EXISTS idx_einsatznotiz_promotor_updated ON public.einsatznotiz_promotor(updated_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_einsatznotiz_promotor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_update_einsatznotiz_promotor_updated_at ON public.einsatznotiz_promotor;
CREATE TRIGGER trigger_update_einsatznotiz_promotor_updated_at
  BEFORE UPDATE ON public.einsatznotiz_promotor
  FOR EACH ROW
  EXECUTE FUNCTION public.update_einsatznotiz_promotor_updated_at();

-- Enable Row Level Security
ALTER TABLE public.einsatznotiz_promotor ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin staff and admin of admins can do everything
CREATE POLICY "Admins have full access" ON public.einsatznotiz_promotor
  FOR ALL USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin_of_admins', 'admin_staff')
  ) WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin_of_admins', 'admin_staff')
  );

-- RLS Policy: Promotors can view notes
CREATE POLICY "Promotors can view notes" ON public.einsatznotiz_promotor
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'promotor'
  );

-- RLS Policy: Service role has full access (for API operations)
CREATE POLICY "Service role has full access" ON public.einsatznotiz_promotor
  FOR ALL USING (auth.role() = 'service_role');
