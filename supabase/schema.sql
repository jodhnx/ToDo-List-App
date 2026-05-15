-- Focus To-Do App — Supabase Schema
-- Im Supabase Dashboard: SQL Editor → New query → einfügen → Run

-- Todos-Tabelle
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('schule', 'gym', 'arbeit', 'privat')),
  priority TEXT NOT NULL CHECK (priority IN ('niedrig', 'mittel', 'hoch')),
  due_date DATE,
  due_time TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index für schnelle Abfragen pro Benutzer
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos (user_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos (user_id, completed);

-- Automatisches updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS todos_updated_at ON public.todos;
CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security: Jeder Benutzer sieht nur eigene Todos
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own todos" ON public.todos;
CREATE POLICY "Users select own todos"
  ON public.todos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own todos" ON public.todos;
CREATE POLICY "Users insert own todos"
  ON public.todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own todos" ON public.todos;
CREATE POLICY "Users update own todos"
  ON public.todos FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own todos" ON public.todos;
CREATE POLICY "Users delete own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);
