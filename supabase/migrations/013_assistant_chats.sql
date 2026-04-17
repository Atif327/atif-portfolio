-- Migration: Assistant chat threads, messages, and provider logs

CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content text NOT NULL,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_session_updated ON public.chats (session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages (chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_provider_logs_chat_created ON public.provider_logs (chat_id, created_at DESC);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chats_select_public ON public.chats;
CREATE POLICY chats_select_public
  ON public.chats
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS chats_insert_public ON public.chats;
CREATE POLICY chats_insert_public
  ON public.chats
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS chats_update_public ON public.chats;
CREATE POLICY chats_update_public
  ON public.chats
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS messages_select_public ON public.messages;
CREATE POLICY messages_select_public
  ON public.messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS messages_insert_public ON public.messages;
CREATE POLICY messages_insert_public
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS provider_logs_insert_public ON public.provider_logs;
CREATE POLICY provider_logs_insert_public
  ON public.provider_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS provider_logs_select_public ON public.provider_logs;
CREATE POLICY provider_logs_select_public
  ON public.provider_logs
  FOR SELECT
  TO authenticated
  USING (true);
