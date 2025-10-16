-- ============================================
-- CHAT GROUP PROFILE PICTURES SCHEMA
-- ============================================

-- Add profile_picture_url column to chat_conversations table
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Note: Storage bucket 'group-chat-pictures' needs to be created via Supabase UI
-- with the following RLS policies:
-- 
-- 1. Allow authenticated users to read:
--    - Policy name: "Allow authenticated users to read group pictures"
--    - SELECT: true for authenticated users
--
-- 2. Allow admins to upload:
--    - Policy name: "Allow admins to upload group pictures"
--    - INSERT: auth.uid() in (
--        SELECT user_id FROM user_profiles 
--        WHERE role IN ('admin_staff', 'admin_of_admins')
--    )
--
-- 3. Allow admins to update:
--    - Policy name: "Allow admins to update group pictures"
--    - UPDATE: auth.uid() in (
--        SELECT user_id FROM user_profiles 
--        WHERE role IN ('admin_staff', 'admin_of_admins')
--    )

