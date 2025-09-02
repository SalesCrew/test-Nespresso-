-- Assignment Tracking Schema
-- Tracks actual start/end times for assignments and real-time status

-- Create status enum for tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tracking_status') THEN
    CREATE TYPE tracking_status AS ENUM (
      'pending',       -- Assignment hasn't reached start time yet
      'verspätet',     -- Start time passed but not started
      'gestartet',     -- Assignment has been started
      'beendet',       -- Assignment has been completed
      'krankenstand',  -- Sick leave
      'urlaub',        -- Vacation
      'zeitausgleich'  -- Time compensation
    );
  END IF;
END $$;

-- Main tracking table
CREATE TABLE IF NOT EXISTS public.assignment_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tracking fields
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  status tracking_status NOT NULL DEFAULT 'pending',
  
  -- Additional info
  notes text,
  location_confirmed boolean DEFAULT false,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one tracking record per assignment per user
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.assignment_tracking ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_tracking_assignment ON public.assignment_tracking (assignment_id);
CREATE INDEX idx_tracking_user ON public.assignment_tracking (user_id);
CREATE INDEX idx_tracking_status ON public.assignment_tracking (status);
CREATE INDEX idx_tracking_date ON public.assignment_tracking (created_at);

-- Policies
-- Promotors can read and update their own tracking records
DROP POLICY IF EXISTS tracking_promotor_read_own ON public.assignment_tracking;
CREATE POLICY tracking_promotor_read_own ON public.assignment_tracking
  FOR SELECT USING (user_id = auth.uid() OR buddy_user_id = auth.uid());

DROP POLICY IF EXISTS tracking_promotor_update_own ON public.assignment_tracking;
CREATE POLICY tracking_promotor_update_own ON public.assignment_tracking
  FOR UPDATE USING (user_id = auth.uid() OR buddy_user_id = auth.uid());

DROP POLICY IF EXISTS tracking_promotor_insert_own ON public.assignment_tracking;
CREATE POLICY tracking_promotor_insert_own ON public.assignment_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can do everything
DROP POLICY IF EXISTS tracking_admin_all ON public.assignment_tracking;
CREATE POLICY tracking_admin_all ON public.assignment_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin_of_admins', 'admin_staff')
    )
  );

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_assignment_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS assignment_tracking_update_timestamp ON public.assignment_tracking;
CREATE TRIGGER assignment_tracking_update_timestamp
  BEFORE UPDATE ON public.assignment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assignment_tracking_timestamp();

-- View for today's assignments with all necessary info
CREATE OR REPLACE VIEW public.todays_assignments AS
SELECT 
  a.id as assignment_id,
  a.title,
  a.location_text,
  a.postal_code,
  a.city,
  a.start_ts as planned_start,
  a.end_ts as planned_end,
  a.special_status,
  ap.user_id,
  ap.role,
  ap.status as participant_status,
  up.display_name as promotor_name,
  at.id as tracking_id,
  at.buddy_user_id,
  bup.display_name as buddy_name,
  at.actual_start_time,
  at.actual_end_time,
  at.status as tracking_status,
  at.notes,
  -- Calculate display status - check special_status first
  CASE 
    WHEN a.special_status IS NOT NULL THEN a.special_status
    WHEN at.status IN ('krankenstand', 'urlaub', 'zeitausgleich') THEN at.status::text
    WHEN at.status = 'beendet' THEN 'beendet'
    WHEN at.status = 'gestartet' THEN 'gestartet'
    WHEN at.status = 'verspätet' THEN 'verspätet'
    WHEN a.start_ts > now() THEN 'pending'
    WHEN a.start_ts <= now() AND at.actual_start_time IS NULL THEN 'verspätet'
    ELSE 'pending'
  END as display_status
FROM public.assignments a
INNER JOIN public.assignment_participants ap ON a.id = ap.assignment_id
LEFT JOIN public.assignment_tracking at ON a.id = at.assignment_id AND ap.user_id = at.user_id
LEFT JOIN public.user_profiles up ON ap.user_id = up.user_id
LEFT JOIN public.user_profiles bup ON at.buddy_user_id = bup.user_id
WHERE 
  DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
  AND ap.status NOT IN ('verplant', 'buddy')  -- Exclude these statuses
  AND a.status NOT IN ('cancelled', 'completed');

-- Grant access to view
GRANT SELECT ON public.todays_assignments TO authenticated;

-- Function to auto-create tracking records when assignment starts
CREATE OR REPLACE FUNCTION public.check_and_update_tracking_status()
RETURNS void AS $$
BEGIN
  -- Update status to 'verspätet' for assignments that should have started
  UPDATE public.assignment_tracking at
  SET status = 'verspätet'
  FROM public.assignments a
  WHERE 
    at.assignment_id = a.id
    AND at.status = 'pending'
    AND at.actual_start_time IS NULL
    AND a.start_ts <= now();

  -- Create tracking records for today's assignments that don't have them yet
  INSERT INTO public.assignment_tracking (assignment_id, user_id, status)
  SELECT 
    ap.assignment_id,
    ap.user_id,
    CASE 
      WHEN a.start_ts > now() THEN 'pending'::tracking_status
      ELSE 'verspätet'::tracking_status
    END
  FROM public.assignment_participants ap
  INNER JOIN public.assignments a ON ap.assignment_id = a.id
  WHERE 
    DATE(a.start_ts AT TIME ZONE 'Europe/Berlin') = CURRENT_DATE
    AND ap.status NOT IN ('verplant', 'buddy')
    AND NOT EXISTS (
      SELECT 1 FROM public.assignment_tracking at 
      WHERE at.assignment_id = ap.assignment_id 
      AND at.user_id = ap.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_and_update_tracking_status() TO authenticated;

-- Grant permissions on table
GRANT ALL ON public.assignment_tracking TO authenticated;
