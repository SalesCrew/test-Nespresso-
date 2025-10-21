-- Add pinning support to chat_conversations table
-- Run this SQL in your Supabase SQL editor

-- Add is_pinned column (boolean, default false)
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add pinned_at column (timestamp, nullable)
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Create index for efficient sorting by pinned status and time
CREATE INDEX IF NOT EXISTS idx_chat_conversations_pinned 
ON chat_conversations(is_pinned DESC, pinned_at DESC NULLS LAST, updated_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN chat_conversations.is_pinned IS 'Whether this conversation is pinned to the top for the user';
COMMENT ON COLUMN chat_conversations.pinned_at IS 'Timestamp when conversation was pinned (used for ordering multiple pinned chats)';

