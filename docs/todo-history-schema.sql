-- Create todo_history table for persistent todo completion tracking
CREATE TABLE IF NOT EXISTS public.todo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id),
  todo_type TEXT NOT NULL CHECK (todo_type IN ('assignment', 'document', 'message', 'regular')),
  reference_id TEXT, -- assignment_id, document_type, message_id, or regular todo id
  title TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique completion per user per reference
  UNIQUE(user_id, todo_type, reference_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_todo_history_user_type ON public.todo_history(user_id, todo_type);
CREATE INDEX IF NOT EXISTS idx_todo_history_user_completed ON public.todo_history(user_id, completed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.todo_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own todo history
CREATE POLICY "Users can view own todo history" ON public.todo_history
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own todo history
CREATE POLICY "Users can insert own todo history" ON public.todo_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role has full access
CREATE POLICY "Service role has full access" ON public.todo_history
  FOR ALL USING (auth.role() = 'service_role');
