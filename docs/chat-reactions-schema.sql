-- ============================================
-- CHAT MESSAGE REACTIONS SCHEMA
-- ============================================
-- This enables WhatsApp-style emoji reactions on chat messages
-- - One reaction per user per message
-- - Users can switch their reaction (upsert behavior)
-- - Reactions are aggregated by emoji with counts
-- - Group chats show reaction counts and user names

-- Create reactions table
CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL CHECK (length(emoji) > 0 AND length(emoji) <= 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cmr_message ON chat_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_cmr_message_emoji ON chat_message_reactions(message_id, emoji);
CREATE INDEX IF NOT EXISTS idx_cmr_user ON chat_message_reactions(user_id);

-- Enable RLS
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only conversation participants can see reactions
DROP POLICY IF EXISTS "cmr_select_participants" ON chat_message_reactions;
CREATE POLICY "cmr_select_participants"
ON chat_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM chat_messages m
    JOIN chat_participants p ON p.conversation_id = m.conversation_id
    WHERE m.id = chat_message_reactions.message_id
      AND p.user_id = auth.uid()
  )
);

-- Policy 2: Only participants can insert (react)
DROP POLICY IF EXISTS "cmr_insert_participants" ON chat_message_reactions;
CREATE POLICY "cmr_insert_participants"
ON chat_message_reactions
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM chat_messages m
    JOIN chat_participants p ON p.conversation_id = m.conversation_id
    WHERE m.id = message_id
      AND p.user_id = auth.uid()
  )
);

-- Policy 3: Only the reactor can update their own reaction
DROP POLICY IF EXISTS "cmr_update_own" ON chat_message_reactions;
CREATE POLICY "cmr_update_own"
ON chat_message_reactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: Only the reactor can delete their own reaction
DROP POLICY IF EXISTS "cmr_delete_own" ON chat_message_reactions;
CREATE POLICY "cmr_delete_own"
ON chat_message_reactions
FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- DONE
-- ============================================
-- After running this, reactions are ready to use.
-- The frontend will call:
-- - POST /api/chat/messages/[messageId]/react to add/update
-- - DELETE /api/chat/messages/[messageId]/react to remove
-- - GET /api/chat/messages/[messageId]/reactions to see who reacted

