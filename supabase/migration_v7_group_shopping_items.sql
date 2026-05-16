-- Focus v7: Gemeinsame Einkaufsliste pro Familiengruppe
-- Im Supabase SQL Editor ausführen (nach v6).

CREATE TABLE IF NOT EXISTS public.group_shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  category TEXT NOT NULL DEFAULT 'Sonstiges',
  note TEXT NOT NULL DEFAULT '',
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS group_shopping_items_group_idx ON public.group_shopping_items(group_id);
CREATE INDEX IF NOT EXISTS group_shopping_items_status_idx ON public.group_shopping_items(group_id, checked);

ALTER TABLE public.group_shopping_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_shopping_select" ON public.group_shopping_items;
CREATE POLICY "group_shopping_select" ON public.group_shopping_items FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_shopping_insert" ON public.group_shopping_items;
CREATE POLICY "group_shopping_insert" ON public.group_shopping_items FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_shopping_update" ON public.group_shopping_items;
CREATE POLICY "group_shopping_update" ON public.group_shopping_items FOR UPDATE
  USING (public.is_group_member(group_id, auth.uid()))
  WITH CHECK (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_shopping_delete" ON public.group_shopping_items;
CREATE POLICY "group_shopping_delete" ON public.group_shopping_items FOR DELETE
  USING (public.is_group_member(group_id, auth.uid()));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'group_shopping_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_shopping_items;
  END IF;
END $$;
