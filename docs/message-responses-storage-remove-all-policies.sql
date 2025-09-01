-- Remove ALL storage policies for message-responses bucket
-- This will fix the infinite recursion issue

-- Drop ALL existing policies for message-responses bucket
DELETE FROM storage.policies 
WHERE bucket_id = 'message-responses';

-- Alternative approach if the above doesn't work:
-- Find and drop all policies manually
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%message%response%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;
