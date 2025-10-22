-- Create assignment_daily_checkin table
-- This table tracks daily check-ins by promotors for their assignments
-- A promotor can check in once per day for each assignment they're assigned to

CREATE TABLE IF NOT EXISTS public.assignment_daily_checkin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL, -- Local date when the check-in occurred (YYYY-MM-DD)
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Actual timestamp of check-in
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one check-in per assignment per user per day
  CONSTRAINT unique_daily_checkin UNIQUE (assignment_id, user_id, checkin_date)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_checkin_user_date 
  ON public.assignment_daily_checkin(user_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_daily_checkin_assignment_date 
  ON public.assignment_daily_checkin(assignment_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_daily_checkin_assignment 
  ON public.assignment_daily_checkin(assignment_id);

-- RLS Policies
ALTER TABLE public.assignment_daily_checkin ENABLE ROW LEVEL SECURITY;

-- Promotors can read their own check-ins
CREATE POLICY "Promotors can view own check-ins"
  ON public.assignment_daily_checkin
  FOR SELECT
  USING (auth.uid() = user_id);

-- Promotors can insert their own check-ins
CREATE POLICY "Promotors can create own check-ins"
  ON public.assignment_daily_checkin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Promotors can update their own check-ins (for upsert operations)
CREATE POLICY "Promotors can update own check-ins"
  ON public.assignment_daily_checkin
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins"
  ON public.assignment_daily_checkin
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Comment on table
COMMENT ON TABLE public.assignment_daily_checkin IS 'Tracks daily check-ins by promotors for their assigned work. Used for the Tages-Check feature.';
COMMENT ON COLUMN public.assignment_daily_checkin.checkin_date IS 'Local date (YYYY-MM-DD) when the promotor checked in. Used to prevent duplicate check-ins on the same day.';
COMMENT ON COLUMN public.assignment_daily_checkin.checked_in_at IS 'Actual timestamp when the check-in was recorded, useful for analytics and timezone tracking.';

