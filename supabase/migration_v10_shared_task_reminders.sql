-- Focus v10: Erinnerungen für Gruppenaufgaben
-- Im Supabase SQL Editor ausführen (nach v9).

ALTER TABLE public.shared_tasks
ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_repeat BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_early BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sound TEXT NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS shared_tasks_reminder_idx
ON public.shared_tasks (group_id, assignee_id, reminder_at)
WHERE notify_enabled = true AND status = 'open' AND reminder_at IS NOT NULL;
