-- Setup for message-responses storage bucket
-- Run this in Supabase SQL Editor

-- Create the message-responses bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-responses', 
  'message-responses', 
  false, 
  10485760, -- 10MB limit per file
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-responses bucket
-- Promotors can upload files to their own folder
CREATE POLICY "Promotors can upload message responses" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-responses' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Promotors can read their own files
CREATE POLICY "Promotors can read their message responses" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-responses' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all message response files
CREATE POLICY "Admins can read all message responses" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-responses' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin_of_admins', 'admin_staff')
    )
  );

-- Admins can delete message response files (for cleanup)
CREATE POLICY "Admins can delete message responses" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'message-responses' AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin_of_admins', 'admin_staff')
    )
  );
