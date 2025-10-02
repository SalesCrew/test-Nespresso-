-- Profilbilder-Promotoren Bucket and Table
-- Stores profile pictures for promotors

-- 1. Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profilbilder-promotoren', 'profilbilder-promotoren', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for profile pictures bucket
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profilbilder-promotoren' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profilbilder-promotoren' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profilbilder-promotoren' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profilbilder-promotoren');

-- 3. Add profile_picture_url column to promotor_profiles table if not exists
ALTER TABLE public.promotor_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Note: Profile pictures will be stored at path: {user_id}/profile.jpg
-- And referenced in promotor_profiles.profile_picture_url

