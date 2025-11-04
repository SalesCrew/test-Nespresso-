-- Chat Polls Schema (extends core chat system)
-- Run this after docs/chat-system-schema.sql

-- ============================================
-- TABLES
-- ============================================

-- Poll header
CREATE TABLE IF NOT EXISTS chat_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Poll options
CREATE TABLE IF NOT EXISTS chat_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

-- Votes per option per user
CREATE TABLE IF NOT EXISTS chat_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES chat_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES chat_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, option_id, user_id)
);

-- Optional: attach poll to the chat message for simple joins
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES chat_polls(id) ON DELETE SET NULL;

-- If message_type constrained, ensure 'poll' is allowed. (For TEXT type with CHECK include 'poll')
-- For deployments using CHECK(message_type IN (...)) add it if missing:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'chat_messages'
      AND ccu.column_name = 'message_type'
      AND cc.check_clause LIKE '%poll%'
  ) THEN
    -- already allows 'poll'
    NULL;
  ELSE
    -- Relax check by dropping and recreating with 'poll'
    -- NOTE: If you used the schema from docs/chat-system-schema.sql which already allows 'file', this block may need manual adjustment in production.
    -- Safest path: skip automatic alteration and let migration tools adjust it.
    NULL;
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_polls_conversation_id ON chat_polls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_poll_options_poll_id ON chat_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_chat_poll_votes_poll_id ON chat_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_chat_poll_votes_option_id ON chat_poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_chat_poll_votes_user_id ON chat_poll_votes(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_poll_votes ENABLE ROW LEVEL SECURITY;

-- Poll visibility: participants only (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Participants can view polls'
      AND schemaname = current_schema()
      AND tablename = 'chat_polls'
  ) THEN
    CREATE POLICY "Participants can view polls"
      ON chat_polls FOR SELECT TO authenticated
      USING (
        conversation_id IN (
          SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only admins can create polls (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admins can create polls'
      AND schemaname = current_schema()
      AND tablename = 'chat_polls'
  ) THEN
    CREATE POLICY "Admins can create polls"
      ON chat_polls FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin_staff','admin_of_admins')
        )
      );
  END IF;
END $$;

-- Options visible to participants (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Participants can view poll options'
      AND schemaname = current_schema()
      AND tablename = 'chat_poll_options'
  ) THEN
    CREATE POLICY "Participants can view poll options"
      ON chat_poll_options FOR SELECT TO authenticated
      USING (
        poll_id IN (
          SELECT id FROM chat_polls WHERE conversation_id IN (
            SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Votes visible to participants (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Participants can view poll votes'
      AND schemaname = current_schema()
      AND tablename = 'chat_poll_votes'
  ) THEN
    CREATE POLICY "Participants can view poll votes"
      ON chat_poll_votes FOR SELECT TO authenticated
      USING (
        poll_id IN (
          SELECT id FROM chat_polls WHERE conversation_id IN (
            SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Participants can vote'
      AND schemaname = current_schema()
      AND tablename = 'chat_poll_votes'
  ) THEN
    CREATE POLICY "Participants can vote"
      ON chat_poll_votes FOR INSERT TO authenticated
      WITH CHECK (
        poll_id IN (
          SELECT id FROM chat_polls WHERE conversation_id IN (
            SELECT conversation_id FROM chat_participants WHERE user_id = auth.uid()
          )
        ) AND user_id = auth.uid()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Participants can unvote'
      AND schemaname = current_schema()
      AND tablename = 'chat_poll_votes'
  ) THEN
    CREATE POLICY "Participants can unvote"
      ON chat_poll_votes FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Single-choice enforcement via trigger (optional safety)
CREATE OR REPLACE FUNCTION enforce_single_choice_vote()
RETURNS TRIGGER AS $$
DECLARE
  allow_multi BOOLEAN;
BEGIN
  SELECT allow_multiple INTO allow_multi FROM chat_polls WHERE id = NEW.poll_id;
  IF NOT allow_multi THEN
    -- remove any existing vote for this poll by the same user
    DELETE FROM chat_poll_votes WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_choice_vote ON chat_poll_votes;
CREATE TRIGGER trg_enforce_single_choice_vote
BEFORE INSERT ON chat_poll_votes
FOR EACH ROW EXECUTE FUNCTION enforce_single_choice_vote();


