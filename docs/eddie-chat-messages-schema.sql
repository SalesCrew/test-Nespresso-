-- Eddie Chat Messages Table
-- Stores conversation history for follow-up questions
-- Messages older than 15 minutes are automatically deleted

CREATE TABLE IF NOT EXISTS public.eddie_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_eddie_chat_user_created ON public.eddie_chat_messages(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.eddie_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own messages
CREATE POLICY "Users can view own eddie chat messages" ON public.eddie_chat_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own eddie chat messages" ON public.eddie_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own eddie chat messages" ON public.eddie_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.eddie_chat_messages TO authenticated;

-- Note: Automatic cleanup is handled by Vercel Cron Job
-- See: /api/cron/cleanup-eddie-messages (runs every minute)
-- See: vercel.json for cron configuration

