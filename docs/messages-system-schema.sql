-- Messages System Schema
-- Creates tables for admin-to-promotor messaging system

-- Main messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'normal', -- 'normal' or 'confirmation_required'
  scheduled_send_time TIMESTAMPTZ NULL, -- For planned messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ NULL, -- When message was actually sent
  status VARCHAR(20) NOT NULL DEFAULT 'draft' -- 'draft', 'scheduled', 'sent'
);

-- Message recipients (many-to-many: one message can go to multiple promotors)
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NULL, -- When promotor read the message
  acknowledged_at TIMESTAMPTZ NULL, -- When promotor acknowledged (for confirmation_required type)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, recipient_user_id)
);

-- Message responses (for future file/response functionality)
CREATE TABLE IF NOT EXISTS public.message_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Promotor who responded
  response_type VARCHAR(20) NOT NULL DEFAULT 'file', -- 'file', 'text'
  file_url TEXT NULL, -- For file responses (future implementation)
  file_name TEXT NULL, -- Original filename
  file_size BIGINT NULL, -- File size in bytes
  response_text TEXT NULL, -- For text responses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled_send_time ON public.messages(scheduled_send_time);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_user_id ON public.message_recipients(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_read_at ON public.message_recipients(read_at);
CREATE INDEX IF NOT EXISTS idx_message_responses_message_id ON public.message_responses(message_id);
CREATE INDEX IF NOT EXISTS idx_message_responses_sender_user_id ON public.message_responses(sender_user_id);

-- RLS (Row Level Security) policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_responses ENABLE ROW LEVEL SECURITY;

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Promotors can view messages sent to them
CREATE POLICY "Recipients can view their messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.message_recipients 
      WHERE message_id = id AND recipient_user_id = auth.uid()
    )
  );

-- Admins can manage all message recipients
CREATE POLICY "Admins can manage message recipients" ON public.message_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Recipients can view/update their own recipient records
CREATE POLICY "Recipients can view their recipient records" ON public.message_recipients
  FOR SELECT USING (recipient_user_id = auth.uid());

CREATE POLICY "Recipients can update their recipient records" ON public.message_recipients
  FOR UPDATE USING (recipient_user_id = auth.uid());

-- Admins can view all message responses
CREATE POLICY "Admins can view all responses" ON public.message_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Promotors can manage their own responses
CREATE POLICY "Promotors can manage their responses" ON public.message_responses
  FOR ALL USING (sender_user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_recipients TO authenticated;
GRANT ALL ON public.message_responses TO authenticated;

-- Create a view for messages with recipient info (useful for admin dashboard)
CREATE OR REPLACE VIEW public.messages_with_recipients AS
SELECT 
  m.*,
  array_agg(
    json_build_object(
      'recipient_id', mr.recipient_user_id,
      'recipient_name', up.display_name,
      'read_at', mr.read_at,
      'acknowledged_at', mr.acknowledged_at
    )
  ) as recipients
FROM public.messages m
LEFT JOIN public.message_recipients mr ON m.id = mr.message_id
LEFT JOIN public.user_profiles up ON mr.recipient_user_id = up.user_id
GROUP BY m.id, m.sender_id, m.message_text, m.message_type, m.scheduled_send_time, m.created_at, m.sent_at, m.status;

GRANT SELECT ON public.messages_with_recipients TO authenticated;

-- Create a view for promotor dashboard (messages they should see)
CREATE OR REPLACE VIEW public.my_messages AS
SELECT 
  m.*,
  mr.read_at,
  mr.acknowledged_at,
  sender_profile.display_name as sender_name
FROM public.messages m
JOIN public.message_recipients mr ON m.id = mr.message_id
LEFT JOIN public.user_profiles sender_profile ON m.sender_id = sender_profile.user_id
WHERE mr.recipient_user_id = auth.uid()
  AND m.status = 'sent'
  AND (m.sent_at IS NULL OR m.sent_at <= NOW()) -- Only show messages that should be sent by now
ORDER BY m.created_at DESC;

GRANT SELECT ON public.my_messages TO authenticated;
