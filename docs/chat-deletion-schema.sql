-- ============================================
-- CHAT MESSAGE DELETION SCHEMA
-- Support for "Delete for me" and "Delete for everyone"
-- ============================================

-- Table for per-user message hiding ("Delete for me")
CREATE TABLE IF NOT EXISTS chat_message_hidden (
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hidden_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- Add soft delete columns to chat_messages ("Delete for everyone")
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS deleted_for_all BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_message_hidden_user_id ON chat_message_hidden(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_hidden_message_id ON chat_message_hidden(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_for_all ON chat_messages(deleted_for_all);

-- ============================================
-- RLS POLICIES for chat_message_hidden
-- ============================================

ALTER TABLE chat_message_hidden ENABLE ROW LEVEL SECURITY;

-- Users can insert their own hidden records
CREATE POLICY "Users can hide messages for themselves"
    ON chat_message_hidden FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can view their own hidden records
CREATE POLICY "Users can view their own hidden messages"
    ON chat_message_hidden FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can delete their own hidden records (if they want to unhide)
CREATE POLICY "Users can unhide messages"
    ON chat_message_hidden FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all hidden records
CREATE POLICY "Admins can view all hidden messages"
    ON chat_message_hidden FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

-- ============================================
-- UPDATE RLS POLICIES for chat_messages
-- ============================================

-- Update existing policy to allow admins to delete any message
DROP POLICY IF EXISTS "Admins can delete any message" ON chat_messages;
CREATE POLICY "Admins can delete any message"
    ON chat_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

-- ============================================
-- HELPER FUNCTION
-- ============================================

-- Function to soft delete a message and optionally remove file from storage
CREATE OR REPLACE FUNCTION soft_delete_message(
    message_id_input UUID,
    user_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    message_record RECORD;
BEGIN
    -- Get the message
    SELECT * INTO message_record
    FROM chat_messages
    WHERE id = message_id_input;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update the message
    UPDATE chat_messages
    SET 
        deleted_for_all = true,
        deleted_at = NOW(),
        deleted_by = user_id_input,
        message_text = 'Diese Nachricht wurde gelöscht...',
        file_url = NULL,
        file_name = NULL
    WHERE id = message_id_input;
    
    RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_message(UUID, UUID) TO authenticated;

