-- Fixed storage policies for message-responses bucket
-- This version avoids infinite recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Promotors can upload message responses" ON storage.objects;
DROP POLICY IF EXISTS "Promotors can read their message responses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all message responses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete message responses" ON storage.objects;

-- Simple policies that avoid recursion
-- Promotors can upload files to their own folder
CREATE POLICY "Promotors can upload message responses" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-responses' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    auth.uid() IS NOT NULL
  );

-- Promotors can read their own files
CREATE POLICY "Promotors can read their message responses" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-responses' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    auth.uid() IS NOT NULL
  );

-- For admins, we'll use a simpler approach that doesn't check user_profiles
-- Instead, we'll rely on the fact that only admins can access admin endpoints
-- and the service client bypasses RLS anyway
