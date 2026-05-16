-- Focus v8: Benachrichtigungszeitpunkt pro Aufgabe
-- Im Supabase SQL Editor ausführen (nach v7).

ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS todos_reminder_at_idx
ON public.todos (user_id, reminder_at)
WHERE reminder_at IS NOT NULL AND completed = false;
