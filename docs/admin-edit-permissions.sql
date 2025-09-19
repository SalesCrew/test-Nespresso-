-- Admin policies for editing promotor data in admin/team page
-- Uses enum value 'admin_of_admins' on user_profiles.role

-- Ensure RLS is enabled
ALTER TABLE promotor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications      ENABLE ROW LEVEL SECURITY;

-- promotor_profiles: SELECT + UPDATE for admins
DROP POLICY IF EXISTS "Admins can view promotor profiles"   ON promotor_profiles;
DROP POLICY IF EXISTS "Admins can update promotor profiles" ON promotor_profiles;

CREATE POLICY "Admins can view promotor profiles" ON promotor_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin_of_admins'::user_role
    )
  );

CREATE POLICY "Admins can update promotor profiles" ON promotor_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin_of_admins'::user_role
    )
  );

-- applications: SELECT + UPDATE for admins
DROP POLICY IF EXISTS "Admins can view applications"   ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;

CREATE POLICY "Admins can view applications" ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin_of_admins'::user_role
    )
  );

CREATE POLICY "Admins can update applications" ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin_of_admins'::user_role
    )
  );

-- Adjust the enum cast ('::user_role') to your actual enum type name if different.
