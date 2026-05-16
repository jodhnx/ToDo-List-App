-- Focus v16: Aufgaben-System reparieren und dauerhaft absichern.
-- Im Supabase SQL Editor nach v15 ausführen.

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'privat',
  priority TEXT NOT NULL DEFAULT 'mittel',
  due_date DATE,
  due_time TEXT,
  reminder_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'privat',
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'mittel',
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS due_time TEXT,
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_category_check;
ALTER TABLE public.todos ADD CONSTRAINT todos_category_check
  CHECK (category IN ('schule', 'gym', 'arbeit', 'privat'));

ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_priority_check;
ALTER TABLE public.todos ADD CONSTRAINT todos_priority_check
  CHECK (priority IN ('niedrig', 'mittel', 'hoch'));

CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos (user_id);
CREATE INDEX IF NOT EXISTS todos_completed_idx ON public.todos (user_id, completed);
CREATE INDEX IF NOT EXISTS todos_pinned_idx ON public.todos (user_id, pinned DESC, created_at DESC);

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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own todos" ON public.todos;
CREATE POLICY "Users delete own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF to_regclass('public.groups') IS NOT NULL THEN
    CREATE TABLE IF NOT EXISTS public.shared_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
      creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'mittel',
      due_date DATE,
      due_time TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.shared_tasks
    ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'mittel',
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS due_time TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reminder_repeat BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS reminder_early BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS reminder_sound TEXT NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

    ALTER TABLE public.shared_tasks DROP CONSTRAINT IF EXISTS shared_tasks_category_check;
    ALTER TABLE public.shared_tasks ADD CONSTRAINT shared_tasks_category_check
      CHECK (category IN ('shopping', 'cleaning', 'bills', 'family', 'school', 'other'));

    ALTER TABLE public.shared_tasks DROP CONSTRAINT IF EXISTS shared_tasks_priority_check;
    ALTER TABLE public.shared_tasks ADD CONSTRAINT shared_tasks_priority_check
      CHECK (priority IN ('niedrig', 'mittel', 'hoch'));

    ALTER TABLE public.shared_tasks DROP CONSTRAINT IF EXISTS shared_tasks_status_check;
    ALTER TABLE public.shared_tasks ADD CONSTRAINT shared_tasks_status_check
      CHECK (status IN ('open', 'completed'));

    CREATE INDEX IF NOT EXISTS shared_tasks_group_idx ON public.shared_tasks (group_id);
    CREATE INDEX IF NOT EXISTS shared_tasks_status_idx ON public.shared_tasks (group_id, status);
    CREATE INDEX IF NOT EXISTS shared_tasks_reminder_idx
      ON public.shared_tasks (group_id, assignee_id, reminder_at)
      WHERE notify_enabled = true AND status = 'open' AND reminder_at IS NOT NULL;

    CREATE OR REPLACE FUNCTION public.shared_tasks_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS shared_tasks_updated_at ON public.shared_tasks;
    CREATE TRIGGER shared_tasks_updated_at
      BEFORE UPDATE ON public.shared_tasks
      FOR EACH ROW EXECUTE FUNCTION public.shared_tasks_updated_at();

    ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "shared_tasks_select" ON public.shared_tasks;
    CREATE POLICY "shared_tasks_select" ON public.shared_tasks FOR SELECT
      USING (public.is_group_member(group_id, auth.uid()));

    DROP POLICY IF EXISTS "shared_tasks_insert" ON public.shared_tasks;
    CREATE POLICY "shared_tasks_insert" ON public.shared_tasks FOR INSERT
      WITH CHECK (
        creator_id = auth.uid()
        AND public.is_group_member(group_id, auth.uid())
      );

    DROP POLICY IF EXISTS "shared_tasks_update" ON public.shared_tasks;
    CREATE POLICY "shared_tasks_update" ON public.shared_tasks FOR UPDATE
      USING (public.is_group_member(group_id, auth.uid()))
      WITH CHECK (public.is_group_member(group_id, auth.uid()));

    DROP POLICY IF EXISTS "shared_tasks_delete" ON public.shared_tasks;
    CREATE POLICY "shared_tasks_delete" ON public.shared_tasks FOR DELETE
      USING (
        creator_id = auth.uid()
        OR public.is_group_admin(group_id, auth.uid())
        OR public.is_group_owner(group_id, auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'todos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
  END IF;

  IF to_regclass('public.shared_tasks') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'shared_tasks'
    )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_tasks;
  END IF;
END $$;
