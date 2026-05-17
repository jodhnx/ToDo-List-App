-- Focus — Repair Group Task Comments (Migration v19)
-- Im Supabase SQL Editor ausführen, wenn Kommentare nicht gespeichert oder live aktualisiert werden.

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_comments_task_created_idx
  ON public.task_comments (task_id, created_at ASC);

CREATE INDEX IF NOT EXISTS task_comments_user_idx
  ON public.task_comments (user_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON public.task_comments;
CREATE POLICY "comments_select" ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.shared_tasks t
      WHERE t.id = task_comments.task_id
        AND public.is_group_member(t.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON public.task_comments;
CREATE POLICY "comments_insert" ON public.task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.shared_tasks t
      WHERE t.id = task_comments.task_id
        AND public.is_group_member(t.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_delete_own_or_admin" ON public.task_comments;
CREATE POLICY "comments_delete_own_or_admin" ON public.task_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.shared_tasks t
      WHERE t.id = task_comments.task_id
        AND public.is_group_admin(t.group_id, auth.uid())
    )
  );

ALTER TABLE public.task_comments REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
