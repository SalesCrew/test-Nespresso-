-- Chat System Schema for Real-Time Messaging
-- This schema supports 1-1 chats between admins and promotors, and read-only group chats

-- ============================================
-- TABLES
-- ============================================

-- Conversations table (stores both direct and group chats)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT, -- For group chats, NULL for direct chats
    description TEXT, -- Optional group description
    is_read_only BOOLEAN DEFAULT false, -- TRUE for group chats (promotors can only read)
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants in conversations
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Messages in conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'pdf', 'file')),
    file_url TEXT, -- For attachments
    file_name TEXT, -- Original filename
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_id ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - chat_conversations
-- ============================================

-- Admins can see and manage all conversations
CREATE POLICY "Admins can view all conversations"
    ON chat_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

CREATE POLICY "Admins can create conversations"
    ON chat_conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Admins can update conversations"
    ON chat_conversations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
    ON chat_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_participants
            WHERE chat_participants.conversation_id = chat_conversations.id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES - chat_participants
-- ============================================

-- Admins can manage all participants
CREATE POLICY "Admins can view all participants"
    ON chat_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

CREATE POLICY "Admins can add participants"
    ON chat_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

CREATE POLICY "Admins can update participants"
    ON chat_participants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

-- Users can view participants in their conversations
CREATE POLICY "Users can view participants in their conversations"
    ON chat_participants FOR SELECT
    TO authenticated
    USING (
        conversation_id IN (
            SELECT conversation_id FROM chat_participants
            WHERE user_id = auth.uid()
        )
    );

-- Users can update their own participant record (for last_read_at)
CREATE POLICY "Users can update their own participant record"
    ON chat_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - chat_messages
-- ============================================

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
    );

-- Admins can send messages to any conversation
CREATE POLICY "Admins can send messages"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff', 'admin_of_admins')
        )
        AND sender_id = auth.uid()
    );

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (
        conversation_id IN (
            SELECT conversation_id FROM chat_participants
            WHERE user_id = auth.uid()
        )
    );

-- Users can send messages to non-read-only conversations they're part of
CREATE POLICY "Users can send messages to writable conversations"
    ON chat_messages FOR INSERT
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
CREATE POLICY "Users can update their own messages"
    ON chat_messages FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
    ON chat_messages FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_conversations
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

-- Trigger for chat_messages
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

-- Function to update conversation updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS update_conversation_timestamp ON chat_messages;
CREATE TRIGGER update_conversation_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_new_message();

