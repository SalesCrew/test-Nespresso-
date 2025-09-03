-- Create storage bucket for einsatz photos

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'einsatz-photos',
  'einsatz-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Policy for promotors to upload their own photos
CREATE POLICY "Promotors can upload their own einsatz photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'einsatz-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'einsatz-photos'
);

-- Policy for promotors to view their own photos
CREATE POLICY "Promotors can view their own einsatz photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'einsatz-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy for admins to view all photos
CREATE POLICY "Admins can view all einsatz photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'einsatz-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);

-- Policy for admins to delete photos if needed
CREATE POLICY "Admins can delete einsatz photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'einsatz-photos' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin_of_admins', 'admin_staff')
  )
);
