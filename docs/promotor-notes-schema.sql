-- Create promotor_notes table for storing admin notes about promotors
CREATE TABLE IF NOT EXISTS public.promotor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by promotor
CREATE INDEX IF NOT EXISTS idx_promotor_notes_promotor_user_id ON public.promotor_notes(promotor_user_id);

-- Create index for faster lookups by admin
CREATE INDEX IF NOT EXISTS idx_promotor_notes_admin_user_id ON public.promotor_notes(admin_user_id);

-- Enable Row Level Security
ALTER TABLE public.promotor_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Admin staff and admin_of_admins can view all notes
CREATE POLICY "Admins can view all notes"
  ON public.promotor_notes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Policy: Admin staff and admin_of_admins can insert notes
CREATE POLICY "Admins can insert notes"
  ON public.promotor_notes
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Policy: Admin staff and admin_of_admins can update notes
CREATE POLICY "Admins can update notes"
  ON public.promotor_notes
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Policy: Admin staff and admin_of_admins can delete notes
CREATE POLICY "Admins can delete notes"
  ON public.promotor_notes
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotor_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER set_promotor_notes_updated_at
  BEFORE UPDATE ON public.promotor_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_promotor_notes_updated_at();
