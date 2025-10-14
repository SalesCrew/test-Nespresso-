-- Fix infinite recursion in user_profiles RLS policies
-- The issue is that the admin check policy is querying user_profiles itself,
-- causing infinite recursion

-- First, disable RLS temporarily to clean up
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "user_profiles_admin_read_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_read_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_update_own" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple helper function to check admin status
-- This function uses SECURITY DEFINER to bypass RLS for the role check
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE user_id = user_id_param 
    AND role IN ('admin_staff', 'admin_of_admins')
  );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;

-- Now create policies using the helper function (no recursion)
-- Admins can read all user profiles
CREATE POLICY "user_profiles_admin_read_all"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- Admins can update all user profiles
CREATE POLICY "user_profiles_admin_update_all"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

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

