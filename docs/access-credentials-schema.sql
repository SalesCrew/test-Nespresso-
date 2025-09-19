-- Access Credentials Table for Hübener and Demotool logins
-- This table stores login credentials for external systems that promotors need to access

CREATE TABLE IF NOT EXISTS access_credentials (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Hübener credentials
  huebener_email TEXT,
  huebener_password TEXT,
  
  -- Demotool credentials  
  demotool_email TEXT,
  demotool_password TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_access_credentials_updated_at 
    BEFORE UPDATE ON access_credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE access_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own credentials
CREATE POLICY "Users can view own access credentials" ON access_credentials
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own credentials
CREATE POLICY "Users can insert own access credentials" ON access_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own credentials
CREATE POLICY "Users can update own access credentials" ON access_credentials
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own credentials
CREATE POLICY "Users can delete own access credentials" ON access_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_access_credentials_user_id ON access_credentials(user_id);
