-- Migration v2: pinned + Realtime (bestehende Projekte)
-- SQL Editor → Run

ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS todos_pinned_idx ON public.todos (user_id, pinned DESC, created_at DESC);

-- Realtime für Live-Sync zwischen Geräten/Benutzern-Sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
