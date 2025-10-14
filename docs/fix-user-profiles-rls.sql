-- Fix RLS policies for user_profiles table
-- This allows admins to read all user profiles, which is needed for the chat system

-- Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_profiles_admin_read_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_read_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_update_own" ON public.user_profiles;

-- Admins can read all user profiles
CREATE POLICY "user_profiles_admin_read_all"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Admins can update all user profiles
CREATE POLICY "user_profiles_admin_update_all"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin_staff', 'admin_of_admins')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin_staff', 'admin_of_admins')
    )
  );

-- Users can read their own profile
CREATE POLICY "user_profiles_user_read_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_profiles_user_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;

