-- Add manual "mark as unread" support to chat_participants table
-- Run this SQL in your Supabase SQL editor

-- Add marked_unread column (boolean, default false)
ALTER TABLE chat_participants
ADD COLUMN IF NOT EXISTS marked_unread BOOLEAN NOT NULL DEFAULT FALSE;

-- Add marked_unread_at column (timestamp, nullable)
ALTER TABLE chat_participants
ADD COLUMN IF NOT EXISTS marked_unread_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_chat_participants_marked_unread 
ON chat_participants(user_id, marked_unread) WHERE marked_unread = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN chat_participants.marked_unread IS 'Whether the user manually marked this conversation as unread';
COMMENT ON COLUMN chat_participants.marked_unread_at IS 'Timestamp when conversation was manually marked unread';

