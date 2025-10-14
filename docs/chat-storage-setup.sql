-- Create Supabase Storage Bucket for Chat Attachments
-- This allows users to send photos and PDFs in chat messages

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false, -- Private bucket, users need to be authenticated
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- Policy: Users can upload files to chat-attachments bucket
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view files in conversations they're part of
CREATE POLICY "Users can view chat attachments they have access to"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- User can see their own uploads
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- User can see files in conversations they're part of
    (storage.foldername(name))[2] IN (
      SELECT conversation_id::text 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

