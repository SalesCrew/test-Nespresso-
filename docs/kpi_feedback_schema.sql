-- KPI Feedback Table
-- Stores sent KPI feedback emails to promotors from the Statistiken page

CREATE TABLE IF NOT EXISTS kpi_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mc_et NUMERIC(4,1) NOT NULL,
  vl_value NUMERIC(5,1) NOT NULL,
  tma NUMERIC(5,1) NOT NULL,
  feedback_text TEXT NOT NULL,
  magic_touch VARCHAR(100),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_feedback_user_id ON kpi_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_feedback_created_at ON kpi_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_feedback_read ON kpi_feedback(read);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kpi_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kpi_feedback_updated_at
  BEFORE UPDATE ON kpi_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_kpi_feedback_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE kpi_feedback ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to kpi_feedback"
  ON kpi_feedback
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Promotors can view and update their own feedback (read status only)
CREATE POLICY "Promotors can view own kpi_feedback"
  ON kpi_feedback
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'promotor'
    )
  );

CREATE POLICY "Promotors can update own kpi_feedback read status"
  ON kpi_feedback
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'promotor'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Comments
COMMENT ON TABLE kpi_feedback IS 'Stores KPI feedback emails sent to promotors from the Statistiken admin page';
COMMENT ON COLUMN kpi_feedback.user_id IS 'Reference to the promotor who received this feedback';
COMMENT ON COLUMN kpi_feedback.mc_et IS 'MC/ET KPI value (machines per day)';
COMMENT ON COLUMN kpi_feedback.vl_value IS 'VL Share percentage value';
COMMENT ON COLUMN kpi_feedback.tma IS 'TMA percentage value';
COMMENT ON COLUMN kpi_feedback.feedback_text IS 'The complete generated feedback email text';
COMMENT ON COLUMN kpi_feedback.magic_touch IS 'Magic Touch category used for this feedback (Beeindruckt, Zufrieden, etc)';
COMMENT ON COLUMN kpi_feedback.read IS 'Whether the promotor has read this feedback';

