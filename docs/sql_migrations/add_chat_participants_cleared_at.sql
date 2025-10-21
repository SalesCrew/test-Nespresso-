-- Add "clear chat for me" support to chat_participants table
-- Run this SQL in your Supabase SQL editor

-- Add cleared_at column (timestamp, nullable)
ALTER TABLE chat_participants
ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_chat_participants_cleared 
ON chat_participants(user_id, conversation_id, cleared_at);

-- Add comment for documentation
COMMENT ON COLUMN chat_participants.cleared_at IS 'Timestamp when user cleared chat history; messages before this are hidden for the user';

