-- Focus v13: Dauerhafte Konto-Speicherung und RLS für persönliche Daten härten.
-- Im Supabase SQL Editor ausführen (nach v12).

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

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_items_select" ON public.shopping_items;
CREATE POLICY "shopping_items_select" ON public.shopping_items FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_insert" ON public.shopping_items;
CREATE POLICY "shopping_items_insert" ON public.shopping_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_update" ON public.shopping_items;
CREATE POLICY "shopping_items_update" ON public.shopping_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "shopping_items_delete" ON public.shopping_items;
CREATE POLICY "shopping_items_delete" ON public.shopping_items FOR DELETE
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'todos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
  END IF;
END $$;
