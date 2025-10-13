-- ============================================
-- Fix Chat RLS Policies - Remove Infinite Recursion
-- Give service role (APIs) full access, users restricted access
-- ============================================

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Admins can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;

DROP POLICY IF EXISTS "Admins can view all participants" ON chat_participants;
DROP POLICY IF EXISTS "Admins can add participants" ON chat_participants;
DROP POLICY IF EXISTS "Admins can update participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON chat_participants;

DROP POLICY IF EXISTS "Admins can view all messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to writable conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- ============================================
-- NEW RLS POLICIES - Simple and No Recursion
-- ============================================

-- SERVICE ROLE (APIs) gets full access - bypasses RLS automatically

-- ============================================
-- chat_conversations policies
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins full access to conversations"
ON chat_conversations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
  )
);

-- Users can view conversations they're in
CREATE POLICY "Users can view their own conversations"
ON chat_conversations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- chat_participants policies
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins full access to participants"
ON chat_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
  )
);

-- Users can view participants in their own conversations
CREATE POLICY "Users can view own conversation participants"
ON chat_participants
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM chat_participants cp
    WHERE cp.user_id = auth.uid()
  )
);

-- Users can update their own participant record (for last_read_at)
CREATE POLICY "Users can update own participant record"
ON chat_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- chat_messages policies  
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins full access to messages"
ON chat_messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
  )
);

-- Users can view messages in their conversations
CREATE POLICY "Users can view own conversation messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can send messages to non-read-only conversations
CREATE POLICY "Users can send messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT cp.conversation_id 
    FROM chat_participants cp
    JOIN chat_conversations cc ON cc.id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
    AND (
      cc.is_read_only = false
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
      )
    )
  )
);

-- Users can update their own messages (for editing)
CREATE POLICY "Users can update own messages"
ON chat_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON chat_messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================
-- IMPORTANT: Re-enable RLS
-- ============================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

